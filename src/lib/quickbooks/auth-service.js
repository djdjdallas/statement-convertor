/**
 * QuickBooks Authentication Service
 *
 * Handles OAuth 2.0 flow, token management, and connection status
 * for QuickBooks Online integration.
 */

import OAuthClient from 'intuit-oauth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Initialize QuickBooks OAuth client
 * @returns {OAuthClient} Configured OAuth client
 */
export function getOAuthClient() {
  return new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox', // sandbox or production
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
  });
}

/**
 * Generate authorization URL for OAuth flow
 * @param {string} userId - User ID for state parameter
 * @returns {Object} Authorization URL and state
 */
export function generateAuthUrl(userId) {
  const oauthClient = getOAuthClient();

  // Generate state parameter for CSRF protection
  const state = Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7)
  })).toString('base64');

  const authUri = oauthClient.authorizeUri({
    scope: [
      OAuthClient.scopes.Accounting,
      OAuthClient.scopes.OpenId,
    ],
    state,
  });

  return { authUri, state };
}

/**
 * Exchange authorization code for access tokens
 * @param {string} authCode - Authorization code from callback
 * @param {string} realmId - QuickBooks company ID
 * @returns {Promise<Object>} Token data
 */
export async function exchangeCodeForTokens(authCode, realmId) {
  const oauthClient = getOAuthClient();

  try {
    // Set the redirect URI explicitly before creating token
    oauthClient.redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

    // Create token
    const authResponse = await oauthClient.createToken(authCode);
    const token = authResponse.getJson();

    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
      realmId,
      tokenData: token,
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    console.error('Error details:', error.authResponse || error.message);
    console.error('Redirect URI used:', process.env.QUICKBOOKS_REDIRECT_URI);
    throw new Error('Failed to exchange authorization code for tokens: ' + (error.message || 'Unknown error'));
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token data
 */
export async function refreshAccessToken(refreshToken) {
  const oauthClient = getOAuthClient();

  try {
    oauthClient.setToken({
      refresh_token: refreshToken,
    });

    const authResponse = await oauthClient.refresh();
    const token = authResponse.getJson();

    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Save QuickBooks connection to database
 * @param {string} userId - User ID
 * @param {Object} tokenData - Token data from OAuth
 * @param {Object} companyInfo - Company information
 * @returns {Promise<Object>} Created connection record
 */
export async function saveConnection(userId, tokenData, companyInfo = {}) {
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .upsert({
      user_id: userId,
      company_id: tokenData.realmId,
      company_name: companyInfo.CompanyName || 'QuickBooks Company',
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      token_expires_at: tokenData.expiresAt,
      is_active: true,
      connected_at: new Date(),
    }, {
      onConflict: 'user_id,company_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving connection:', error);
    throw new Error('Failed to save QuickBooks connection');
  }

  return data;
}

/**
 * Get active QuickBooks connection for user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Connection record or null
 */
export async function getConnection(userId) {
  const { data, error } = await supabase
    .from('quickbooks_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error getting connection:', error);
    throw new Error('Failed to retrieve QuickBooks connection');
  }

  return data;
}

/**
 * Get connection with automatic token refresh if needed
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Connection with valid token
 */
export async function getValidConnection(userId) {
  const connection = await getConnection(userId);

  if (!connection) {
    return null;
  }

  // Check if token is expired or will expire in next 10 minutes
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

  if (expiresAt <= tenMinutesFromNow) {
    // Token expired or expiring soon, refresh it
    try {
      const newTokens = await refreshAccessToken(connection.refresh_token);

      // Update connection with new tokens
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          token_expires_at: newTokens.expiresAt,
        })
        .eq('id', connection.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error refreshing token:', error);

      // Mark connection as inactive if refresh fails
      await supabase
        .from('quickbooks_connections')
        .update({ is_active: false })
        .eq('id', connection.id);

      throw new Error('QuickBooks connection expired. Please reconnect.');
    }
  }

  return connection;
}

/**
 * Disconnect QuickBooks connection
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function disconnectConnection(userId) {
  const connection = await getConnection(userId);

  if (!connection) {
    return false;
  }

  try {
    // Revoke token with QuickBooks
    const oauthClient = getOAuthClient();
    oauthClient.setToken({
      access_token: connection.access_token,
    });

    try {
      await oauthClient.revoke();
    } catch (revokeError) {
      // Continue even if revoke fails (token might already be invalid)
      console.warn('Token revocation warning:', revokeError);
    }

    // Mark connection as inactive
    const { error } = await supabase
      .from('quickbooks_connections')
      .update({ is_active: false })
      .eq('id', connection.id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error disconnecting:', error);
    throw new Error('Failed to disconnect QuickBooks');
  }
}

/**
 * Check if user has active QuickBooks connection
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Connection status
 */
export async function checkConnectionStatus(userId) {
  try {
    const connection = await getValidConnection(userId);

    return {
      connected: !!connection,
      companyName: connection?.company_name || null,
      companyId: connection?.company_id || null,
      connectedAt: connection?.connected_at || null,
      lastSynced: connection?.last_synced_at || null,
      expiresAt: connection?.token_expires_at || null,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Verify state parameter from OAuth callback
 * @param {string} state - State parameter
 * @param {string} expectedUserId - Expected user ID
 * @returns {boolean} Whether state is valid
 */
export function verifyState(state, expectedUserId) {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());

    // Verify user ID matches
    if (decoded.userId !== expectedUserId) {
      return false;
    }

    // Verify timestamp is within last 10 minutes (prevent replay attacks)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    if (decoded.timestamp < tenMinutesAgo) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying state:', error);
    return false;
  }
}

/**
 * Update last synced timestamp for connection
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function updateLastSynced(userId) {
  const connection = await getConnection(userId);

  if (!connection) {
    return;
  }

  await supabase
    .from('quickbooks_connections')
    .update({ last_synced_at: new Date() })
    .eq('id', connection.id);
}

export default {
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  saveConnection,
  getConnection,
  getValidConnection,
  disconnectConnection,
  checkConnectionStatus,
  verifyState,
  updateLastSynced,
};
