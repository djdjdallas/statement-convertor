-- Fix the column name mismatch in google_oauth_tokens table
-- This migration corrects the expires_at vs token_expires_at confusion

-- First, drop the expires_at column if it exists (it shouldn't be there)
ALTER TABLE google_oauth_tokens DROP COLUMN IF EXISTS expires_at;

-- Update any existing null token_expires_at values from the upsert function
-- This handles tokens that were inserted with the wrong column mapping
UPDATE google_oauth_tokens 
SET token_expires_at = NOW() + INTERVAL '1 hour'
WHERE token_expires_at IS NULL 
AND access_token IS NOT NULL;

-- Drop ALL existing versions of the function
-- First, let's see what versions exist
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all overloaded versions of upsert_google_token
    FOR func_record IN 
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc 
        WHERE proname = 'upsert_google_token'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Recreate the upsert function with correct column mapping
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
        token_expires_at,  -- Fixed: was using wrong column name
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
        p_expires_at,  -- This parameter correctly maps to token_expires_at
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

-- Add a comment for clarity
COMMENT ON FUNCTION upsert_google_token IS 'Upserts Google OAuth tokens. The p_expires_at parameter maps to the token_expires_at column.';