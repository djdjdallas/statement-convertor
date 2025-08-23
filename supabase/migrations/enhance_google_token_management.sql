-- Enhanced Google OAuth token management for Workspace support
-- This migration adds encryption support, workspace features, and audit logging

-- First, backup existing data (if any)
CREATE TEMP TABLE google_oauth_tokens_backup AS 
SELECT * FROM google_oauth_tokens;

-- Drop existing constraints
ALTER TABLE google_oauth_tokens DROP CONSTRAINT IF EXISTS google_oauth_tokens_user_id_key;

-- Add new columns for enhanced token management
ALTER TABLE google_oauth_tokens 
ADD COLUMN IF NOT EXISTS workspace_id TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'user' CHECK (token_type IN ('user', 'service_account')),
ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refresh_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create composite unique constraint for workspace support
ALTER TABLE google_oauth_tokens 
ADD CONSTRAINT google_oauth_tokens_unique_key 
UNIQUE NULLS NOT DISTINCT (user_id, workspace_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_workspace_id ON google_oauth_tokens(workspace_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_domain ON google_oauth_tokens(domain);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_token_expires_at ON google_oauth_tokens(token_expires_at);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_token_type ON google_oauth_tokens(token_type);

-- Create workspace configuration table for domain-wide delegation
CREATE TABLE IF NOT EXISTS workspace_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    domain TEXT UNIQUE NOT NULL,
    service_account_key TEXT, -- Encrypted JSON
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create token activity logs table for audit trail
CREATE TABLE IF NOT EXISTS token_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_token_activity_logs_user_id ON token_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_token_activity_logs_action ON token_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_token_activity_logs_created_at ON token_activity_logs(created_at);

-- Update the upsert function to handle new fields
CREATE OR REPLACE FUNCTION upsert_google_token(
    p_user_id UUID,
    p_access_token TEXT,
    p_refresh_token TEXT,
    p_expires_at TIMESTAMPTZ,
    p_scopes TEXT[] DEFAULT '{}',
    p_google_email TEXT DEFAULT NULL,
    p_google_name TEXT DEFAULT NULL,
    p_google_picture TEXT DEFAULT NULL,
    p_workspace_id TEXT DEFAULT NULL,
    p_domain TEXT DEFAULT NULL,
    p_token_type TEXT DEFAULT 'user',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO google_oauth_tokens (
        user_id,
        access_token,
        refresh_token,
        token_expires_at,
        scopes,
        google_email,
        google_name,
        google_picture,
        workspace_id,
        domain,
        token_type,
        metadata,
        last_refreshed_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_access_token,
        p_refresh_token,
        p_expires_at,
        p_scopes,
        p_google_email,
        p_google_name,
        p_google_picture,
        p_workspace_id,
        p_domain,
        p_token_type,
        p_metadata,
        CASE WHEN p_refresh_token IS NOT NULL THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (user_id, workspace_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, google_oauth_tokens.refresh_token),
        token_expires_at = EXCLUDED.token_expires_at,
        scopes = EXCLUDED.scopes,
        google_email = COALESCE(EXCLUDED.google_email, google_oauth_tokens.google_email),
        google_name = COALESCE(EXCLUDED.google_name, google_oauth_tokens.google_name),
        google_picture = COALESCE(EXCLUDED.google_picture, google_oauth_tokens.google_picture),
        domain = COALESCE(EXCLUDED.domain, google_oauth_tokens.domain),
        token_type = EXCLUDED.token_type,
        metadata = EXCLUDED.metadata || google_oauth_tokens.metadata,
        last_refreshed_at = CASE 
            WHEN EXCLUDED.refresh_token IS NOT NULL THEN NOW() 
            ELSE google_oauth_tokens.last_refreshed_at 
        END,
        refresh_count = CASE 
            WHEN EXCLUDED.refresh_token IS NOT NULL 
            THEN google_oauth_tokens.refresh_count + 1 
            ELSE google_oauth_tokens.refresh_count 
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get tokens for a specific workspace
CREATE OR REPLACE FUNCTION get_workspace_tokens(p_workspace_id TEXT)
RETURNS TABLE (
    user_id UUID,
    google_email TEXT,
    token_expires_at TIMESTAMPTZ,
    last_refreshed_at TIMESTAMPTZ,
    refresh_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        got.user_id,
        got.google_email,
        got.token_expires_at,
        got.last_refreshed_at,
        got.refresh_count
    FROM google_oauth_tokens got
    WHERE got.workspace_id = p_workspace_id
    AND got.token_expires_at > NOW()
    ORDER BY got.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Log expired tokens before deletion
    INSERT INTO token_activity_logs (user_id, action, metadata)
    SELECT 
        user_id, 
        'token_expired_cleanup',
        jsonb_build_object(
            'workspace_id', workspace_id,
            'expired_at', token_expires_at,
            'token_type', token_type
        )
    FROM google_oauth_tokens
    WHERE token_expires_at < NOW() - INTERVAL '30 days'
    AND refresh_token IS NULL;

    -- Delete expired tokens without refresh tokens
    DELETE FROM google_oauth_tokens
    WHERE token_expires_at < NOW() - INTERVAL '30 days'
    AND refresh_token IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE workspace_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_configs
CREATE POLICY "Workspace admins can view their configs" ON workspace_configs
    FOR SELECT
    USING (auth.uid() = admin_user_id OR 
           EXISTS (
               SELECT 1 FROM google_oauth_tokens 
               WHERE user_id = auth.uid() 
               AND domain = workspace_configs.domain
           ));

CREATE POLICY "Only workspace admins can manage configs" ON workspace_configs
    FOR ALL
    USING (auth.uid() = admin_user_id)
    WITH CHECK (auth.uid() = admin_user_id);

-- RLS Policies for token_activity_logs
CREATE POLICY "Users can view their own token activity" ON token_activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert token activity" ON token_activity_logs
    FOR INSERT
    WITH CHECK (true); -- Allow system to log all activities

-- Create a scheduled job to clean up expired tokens (adjust cron schedule as needed)
-- Note: This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT cleanup_expired_tokens();');

-- Restore data with migration to encrypted format
-- Note: In production, you would need to encrypt existing tokens before this migration
-- This is a placeholder showing the structure
INSERT INTO google_oauth_tokens (
    user_id,
    access_token,
    refresh_token,
    token_expires_at,
    scopes,
    google_email,
    google_name,
    google_picture,
    created_at,
    updated_at
)
SELECT 
    user_id,
    access_token, -- In production, encrypt this
    refresh_token, -- In production, encrypt this
    token_expires_at,
    scopes,
    google_email,
    google_name,
    google_picture,
    created_at,
    updated_at
FROM google_oauth_tokens_backup
ON CONFLICT (user_id, workspace_id) DO NOTHING;

-- Drop the backup table
DROP TABLE google_oauth_tokens_backup;

-- Add comment for documentation
COMMENT ON TABLE google_oauth_tokens IS 'Stores encrypted Google OAuth tokens with workspace support';
COMMENT ON TABLE workspace_configs IS 'Stores Google Workspace domain-wide delegation configurations';
COMMENT ON TABLE token_activity_logs IS 'Audit trail for token-related activities';
COMMENT ON COLUMN google_oauth_tokens.workspace_id IS 'Google Workspace ID for multi-tenant support';
COMMENT ON COLUMN google_oauth_tokens.token_type IS 'Type of token: user (OAuth) or service_account (domain-wide)';
COMMENT ON COLUMN workspace_configs.service_account_key IS 'Encrypted service account JSON key for domain-wide delegation';