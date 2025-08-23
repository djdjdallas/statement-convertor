-- Create google_oauth_states table for OAuth flow security
CREATE TABLE IF NOT EXISTS google_oauth_states (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    state TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create index for efficient lookups
CREATE INDEX idx_google_oauth_states_state ON google_oauth_states(state);
CREATE INDEX idx_google_oauth_states_user_id ON google_oauth_states(user_id);

-- Clean up expired states automatically
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM google_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired states (if pg_cron is available)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-oauth-states', '0 * * * *', 'SELECT cleanup_expired_oauth_states();');