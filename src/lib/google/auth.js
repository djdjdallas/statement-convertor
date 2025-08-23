import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { 
  withGoogleErrorHandling, 
  GOOGLE_ERROR_CODES,
  createErrorResponse,
  handleTokenRefresh 
} from './error-handler'
import { tokenService } from './token-service'

// Initialize OAuth2 client
export function createOAuth2Client() {
  return new OAuth2Client(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  )
}

// Get valid access token for a user
export async function getValidAccessToken(userId, isServerSide = false) {
  return withGoogleErrorHandling(async () => {
    // Use tokenService to get decrypted tokens
    const tokenData = await tokenService.getTokens(userId)
    
    if (!tokenData) {
      const error = new Error('No Google OAuth tokens found for user')
      error.code = GOOGLE_ERROR_CODES.INVALID_CREDENTIALS
      throw error
    }
    
    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.token_expires_at)
    
    if (now >= expiresAt) {
      // Token is expired, refresh it
      const oauth2Client = createOAuth2Client()
      oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token
      })
      
      try {
        const { credentials } = await oauth2Client.refreshAccessToken()
        
        // Update stored tokens using tokenService
        await tokenService.storeTokens({
          userId,
          tokens: {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || tokenData.refresh_token,
            expiry_date: credentials.expiry_date,
            scope: tokenData.scopes?.join(' ') || ''
          },
          userInfo: {
            email: tokenData.google_email,
            name: tokenData.google_name,
            picture: tokenData.google_picture
          },
          workspaceId: tokenData.workspace_id,
          domain: tokenData.domain,
          tokenType: tokenData.token_type
        })
        
        return credentials.access_token
      } catch (error) {
        // Check if it's a revoked token error
        if (error.message?.includes('revoked') || error.message?.includes('invalid_grant')) {
          error.code = GOOGLE_ERROR_CODES.PERMISSION_REVOKED
        } else {
          error.code = GOOGLE_ERROR_CODES.TOKEN_EXPIRED
        }
        throw error
      }
    }
    
    // Token is still valid
    return tokenData.access_token
  }, {
    context: { userId, operation: 'getValidAccessToken' },
    retryEnabled: true
  })
}

// Get authenticated OAuth2 client for a user
export async function getAuthenticatedClient(userId, isServerSide = false) {
  const accessToken = await getValidAccessToken(userId, isServerSide)
  const oauth2Client = createOAuth2Client()
  
  oauth2Client.setCredentials({
    access_token: accessToken
  })
  
  return oauth2Client
}

// Check if user has Google integration
export async function hasGoogleIntegration(userId, isServerSide = false) {
  // Use tokenService to check for tokens
  const tokenData = await tokenService.getTokens(userId)
  return tokenData !== null
}

// Revoke Google access
export async function revokeGoogleAccess(userId) {
  return withGoogleErrorHandling(async () => {
    // Get the access token
    const accessToken = await getValidAccessToken(userId)
    
    // Revoke the token with Google
    const oauth2Client = createOAuth2Client()
    await oauth2Client.revokeToken(accessToken)
    
    // Use tokenService to revoke tokens
    await tokenService.revokeTokens(userId)
    
    return { success: true }
  }, {
    context: { userId, operation: 'revokeGoogleAccess' },
    throwOnError: false,
    retryEnabled: false // Don't retry revoke operations
  })
}