-- Create table for storing OAuth state parameters
CREATE TABLE IF NOT EXISTS google_oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    state TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create index for faster state lookups
CREATE INDEX idx_google_oauth_states_state ON google_oauth_states(state);
CREATE INDEX idx_google_oauth_states_expires_at ON google_oauth_states(expires_at);

-- Create table for storing Google OAuth tokens
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    google_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    picture TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);
CREATE INDEX idx_google_oauth_tokens_google_id ON google_oauth_tokens(google_id);

-- Enable RLS (Row Level Security)
ALTER TABLE google_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for google_oauth_states
CREATE POLICY "Users can view their own OAuth states" ON google_oauth_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth states" ON google_oauth_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth states" ON google_oauth_states
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for google_oauth_tokens
CREATE POLICY "Users can view their own Google tokens" ON google_oauth_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google tokens" ON google_oauth_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google tokens" ON google_oauth_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google tokens" ON google_oauth_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Clean up expired OAuth states automatically
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM google_oauth_states
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired states (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-oauth-states', '0 * * * *', 'SELECT cleanup_expired_oauth_states();');