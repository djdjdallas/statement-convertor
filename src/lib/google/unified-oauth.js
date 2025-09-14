// Unified Google OAuth Implementation
// This file consolidates all OAuth logic to ensure consistency across the application

import { OAuth2Client } from 'google-auth-library';

// Use HTTPS for production!
const getRedirectUri = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
  }
  
  // Ensure HTTPS for production
  if (!baseUrl.includes('localhost') && !baseUrl.startsWith('https://')) {
    console.error('WARNING: Production URL must use HTTPS for Google OAuth');
    return baseUrl.replace('http://', 'https://') + '/api/auth/google/oauth-callback';
  }
  
  return `${baseUrl}/api/auth/google/oauth-callback`;
};

// Create OAuth2 client instance
export const oauth2Client = new OAuth2Client(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri()
);

// Define OAuth scopes
export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets'
];

/**
 * Generate Google OAuth authorization URL
 * @param {string} state - Security state parameter for CSRF protection
 * @returns {string} - Complete OAuth authorization URL
 */
export function getAuthUrl(state) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
  }
  
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: state
  });
  
  // Debug log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('OAuth Configuration:', {
      redirectUri: getRedirectUri(),
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      scopes: SCOPES
    });
  }
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} - Token object containing access_token, refresh_token, etc.
 */
export async function getTokensFromCode(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - New token object
 */
export async function refreshAccessToken(refreshToken) {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Get user info from Google
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} - User information from Google
 */
export async function getUserInfo(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw new Error('Failed to fetch user information from Google');
  }
}

/**
 * Get the OAuth callback URL for the current environment
 * @returns {string} - The callback URL
 */
export function getOAuthCallbackUrl() {
  return getRedirectUri();
}

/**
 * Create a new OAuth2 client instance with optional redirect URI override
 * @param {string} redirectUri - Optional redirect URI override
 * @returns {OAuth2Client} - New OAuth2Client instance
 */
export function createOAuth2Client(redirectUri = null) {
  return new OAuth2Client(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || getRedirectUri()
  );
}

// Export Google API related functions
export { google } from 'googleapis';

/**
 * Get Google Drive client
 * @param {string} accessToken - Access token
 * @returns {Object} - Google Drive API client
 */
export function getDriveClient(accessToken) {
  const { google } = require('googleapis');
  const auth = new OAuth2Client();
  auth.setCredentials({
    access_token: accessToken
  });
  
  return google.drive({
    version: 'v3',
    auth: auth
  });
}

/**
 * Upload file to Google Drive
 * @param {string} accessToken - Access token
 * @param {string} fileName - Name of the file
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} - Upload response from Google Drive
 */
export async function uploadToDrive(accessToken, fileName, fileBuffer, mimeType) {
  const drive = getDriveClient(accessToken);
  
  const fileMetadata = {
    name: fileName,
    mimeType: mimeType
  };
  
  const media = {
    mimeType: mimeType,
    body: fileBuffer
  };
  
  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink'
  });
  
  return response.data;
}

/**
 * List files from Google Drive
 * @param {string} accessToken - Access token
 * @param {Object} query - Query parameters for listing files
 * @returns {Promise<Object>} - List of files from Google Drive
 */
export async function listDriveFiles(accessToken, query = {}) {
  const drive = getDriveClient(accessToken);
  
  const params = {
    pageSize: 20,
    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)',
    ...query
  };
  
  const response = await drive.files.list(params);
  return response.data;
}