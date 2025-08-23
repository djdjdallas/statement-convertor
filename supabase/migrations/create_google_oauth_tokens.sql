-- Create google_oauth_tokens table for storing Google OAuth tokens
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    google_email TEXT,
    google_name TEXT,
    google_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);

-- Create function to upsert Google tokens
CREATE OR REPLACE FUNCTION upsert_google_token(
    p_user_id UUID,
    p_access_token TEXT,
    p_refresh_token TEXT,
    p_expires_at TIMESTAMPTZ,
    p_scopes TEXT[] DEFAULT '{}',
    p_google_email TEXT DEFAULT NULL,
    p_google_name TEXT DEFAULT NULL,
    p_google_picture TEXT DEFAULT NULL
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
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, google_oauth_tokens.refresh_token),
        token_expires_at = EXCLUDED.token_expires_at,
        scopes = EXCLUDED.scopes,
        google_email = COALESCE(EXCLUDED.google_email, google_oauth_tokens.google_email),
        google_name = COALESCE(EXCLUDED.google_name, google_oauth_tokens.google_name),
        google_picture = COALESCE(EXCLUDED.google_picture, google_oauth_tokens.google_picture),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own tokens
CREATE POLICY "Users can manage their own Google tokens" ON google_oauth_tokens
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);