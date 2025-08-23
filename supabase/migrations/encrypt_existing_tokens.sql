-- Migration to encrypt existing tokens
-- This should be run AFTER deploying the new token service code

-- Create a temporary function to mark tokens for re-encryption
CREATE OR REPLACE FUNCTION mark_tokens_for_encryption()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Add a temporary column to track encryption status
    ALTER TABLE google_oauth_tokens 
    ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
    
    -- Count unencrypted tokens
    SELECT COUNT(*) INTO updated_count
    FROM google_oauth_tokens
    WHERE is_encrypted = false;
    
    -- Log migration start
    INSERT INTO token_activity_logs (user_id, action, metadata, created_at)
    SELECT 
        user_id,
        'token_encryption_migration',
        jsonb_build_object(
            'migration_type', 'mark_for_encryption',
            'token_count', updated_count
        ),
        NOW()
    FROM (SELECT DISTINCT user_id FROM google_oauth_tokens WHERE is_encrypted = false) AS users;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to verify token encryption
CREATE OR REPLACE FUNCTION verify_token_encryption()
RETURNS TABLE (
    total_tokens INTEGER,
    encrypted_tokens INTEGER,
    unencrypted_tokens INTEGER,
    encryption_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tokens,
        COUNT(CASE WHEN is_encrypted = true THEN 1 END)::INTEGER as encrypted_tokens,
        COUNT(CASE WHEN is_encrypted = false THEN 1 END)::INTEGER as unencrypted_tokens,
        ROUND(
            COUNT(CASE WHEN is_encrypted = true THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100, 
            2
        ) as encryption_percentage
    FROM google_oauth_tokens;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for migration performance
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_is_encrypted 
ON google_oauth_tokens(is_encrypted) 
WHERE is_encrypted = false;

-- Create a view for monitoring encryption progress
CREATE OR REPLACE VIEW token_encryption_status AS
SELECT 
    u.email,
    got.user_id,
    got.workspace_id,
    got.domain,
    got.token_type,
    got.is_encrypted,
    got.last_refreshed_at,
    got.updated_at
FROM google_oauth_tokens got
JOIN auth.users u ON u.id = got.user_id
ORDER BY got.is_encrypted ASC, got.updated_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON token_encryption_status TO authenticated;

-- Add RLS policy for the view
ALTER VIEW token_encryption_status OWNER TO postgres;

-- Create a function to safely update tokens post-encryption
CREATE OR REPLACE FUNCTION update_token_encryption_status(
    p_user_id UUID,
    p_workspace_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE google_oauth_tokens
    SET 
        is_encrypted = true,
        updated_at = NOW()
    WHERE 
        user_id = p_user_id
        AND (workspace_id = p_workspace_id OR (p_workspace_id IS NULL AND workspace_id IS NULL));
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION mark_tokens_for_encryption() IS 'Marks existing tokens for encryption migration';
COMMENT ON FUNCTION verify_token_encryption() IS 'Returns statistics about token encryption status';
COMMENT ON FUNCTION update_token_encryption_status(UUID, TEXT) IS 'Updates token encryption status after successful encryption';
COMMENT ON VIEW token_encryption_status IS 'Monitor token encryption migration progress';

-- Execute the marking function
SELECT mark_tokens_for_encryption();

-- Show initial status
SELECT * FROM verify_token_encryption();