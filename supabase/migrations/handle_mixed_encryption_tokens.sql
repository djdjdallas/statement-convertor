-- Handle mixed encryption state for Google OAuth tokens
-- This migration ensures we can work with both encrypted and unencrypted tokens

-- Mark existing tokens as not encrypted if they look like plain text tokens
-- Google access tokens typically start with 'ya29.'
UPDATE google_oauth_tokens 
SET is_encrypted = false
WHERE access_token LIKE 'ya29.%'
  OR LENGTH(access_token) < 200  -- Encrypted tokens are much longer due to salt/iv/tag
  OR access_token NOT LIKE '%==%'  -- Base64 encoded strings often end with padding
  OR access_token ~ '^[A-Za-z0-9._-]+$';  -- Plain tokens only have these characters

-- Add index for performance on is_encrypted column
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_encrypted 
ON google_oauth_tokens(is_encrypted);

-- Add comment to track migration status
COMMENT ON TABLE google_oauth_tokens IS 'OAuth tokens table with mixed encryption support. Tokens created before encryption implementation have is_encrypted=false';