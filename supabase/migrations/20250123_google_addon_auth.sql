-- Create table for Google Add-on auth codes
CREATE TABLE IF NOT EXISTS addon_auth_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    addon_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for Google Add-on tokens
CREATE TABLE IF NOT EXISTS addon_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    addon_type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_addon_auth_codes_code ON addon_auth_codes(code);
CREATE INDEX idx_addon_auth_codes_user_id ON addon_auth_codes(user_id);
CREATE INDEX idx_addon_tokens_access_token ON addon_tokens(access_token);
CREATE INDEX idx_addon_tokens_refresh_token ON addon_tokens(refresh_token);
CREATE INDEX idx_addon_tokens_user_id ON addon_tokens(user_id);

-- Add RLS policies
ALTER TABLE addon_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
CREATE POLICY "Service role only" ON addon_auth_codes
    FOR ALL TO service_role
    USING (true);

CREATE POLICY "Service role only" ON addon_tokens
    FOR ALL TO service_role
    USING (true);

-- Add cleanup function for expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_addon_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM addon_auth_codes WHERE expires_at < NOW();
    DELETE FROM addon_tokens WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired tokens (requires pg_cron extension)
-- Run this separately if pg_cron is available:
-- SELECT cron.schedule('cleanup-addon-tokens', '0 2 * * *', 'SELECT cleanup_expired_addon_tokens();');