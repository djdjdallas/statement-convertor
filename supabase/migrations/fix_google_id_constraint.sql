-- Fix google_id and email constraint issues in google_oauth_tokens table
-- This migration handles the missing google_id and email fields

-- First, make google_id nullable if it exists and is NOT NULL
ALTER TABLE google_oauth_tokens 
ALTER COLUMN google_id DROP NOT NULL;

-- Also make email nullable if it exists and is NOT NULL
ALTER TABLE google_oauth_tokens 
ALTER COLUMN email DROP NOT NULL;

-- Update existing rows to set google_id from user metadata if available
UPDATE google_oauth_tokens 
SET google_id = COALESCE(
    google_id,
    metadata->>'google_id',
    -- Extract from email if it looks like a Google ID
    CASE 
        WHEN google_email ~ '^[0-9]+@' 
        THEN split_part(google_email, '@', 1)
        ELSE NULL
    END
)
WHERE google_id IS NULL;

-- Drop and recreate the upsert function with google_id support
DROP FUNCTION IF EXISTS upsert_google_token CASCADE;

CREATE OR REPLACE FUNCTION upsert_google_token(
    p_user_id UUID,
    p_access_token TEXT,
    p_refresh_token TEXT,
    p_expires_at TIMESTAMPTZ,
    p_scopes TEXT[] DEFAULT '{}',
    p_google_email TEXT DEFAULT NULL,
    p_google_name TEXT DEFAULT NULL,
    p_google_picture TEXT DEFAULT NULL,
    p_google_id TEXT DEFAULT NULL,  -- Add google_id parameter
    p_workspace_id TEXT DEFAULT NULL,
    p_domain TEXT DEFAULT NULL,
    p_token_type TEXT DEFAULT 'user',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO google_oauth_tokens (
        user_id,
        google_id,  -- Include google_id in INSERT
        email,  -- Include email in INSERT
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
        updated_at,
        is_encrypted  -- Set to false for plain text tokens
    )
    VALUES (
        p_user_id,
        COALESCE(p_google_id, p_metadata->>'google_id', p_metadata->>'provider_id'),  -- Try to extract google_id
        COALESCE(p_google_email, p_metadata->>'email'),  -- Use google_email for email column
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
        NOW(),
        false  -- Plain text tokens for now
    )
    ON CONFLICT (user_id, workspace_id) DO UPDATE SET
        google_id = COALESCE(EXCLUDED.google_id, google_oauth_tokens.google_id),
        email = COALESCE(EXCLUDED.email, google_oauth_tokens.email),
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
            THEN COALESCE(google_oauth_tokens.refresh_count, 0) + 1 
            ELSE COALESCE(google_oauth_tokens.refresh_count, 0)
        END,
        updated_at = NOW(),
        is_encrypted = false;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_google_token IS 'Upserts Google OAuth tokens with google_id support';