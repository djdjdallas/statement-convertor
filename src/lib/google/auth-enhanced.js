import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { tokenService, encryptToken, decryptToken } from './token-service'

// Scopes required for Google Workspace Marketplace
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
]

// Additional scopes for domain-wide delegation
export const ADMIN_SCOPES = [
  ...WORKSPACE_SCOPES,
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/admin.reports.audit.readonly'
]

// Initialize OAuth2 client with proper redirect URI
export function createOAuth2Client(redirectUri = null) {
  const defaultRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/oauth-callback`
  
  return new OAuth2Client(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || defaultRedirectUri
  )
}

// Create service account client for domain-wide delegation
export async function createServiceAccountClient(domain, subject) {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  
  if (!serviceAccountKey) {
    throw new Error('Service account key not configured')
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(serviceAccountKey),
    scopes: ADMIN_SCOPES,
    subject // Impersonate this user in the domain
  })
  
  return auth
}

// Generate authorization URL with proper scopes
export function generateAuthUrl({
  scopes = WORKSPACE_SCOPES,
  state = null,
  accessType = 'offline',
  prompt = 'consent',
  loginHint = null,
  hd = null // Hosted domain for Google Workspace
}) {
  const oauth2Client = createOAuth2Client()
  
  const params = {
    access_type: accessType,
    scope: scopes,
    prompt,
    state
  }
  
  if (loginHint) {
    params.login_hint = loginHint
  }
  
  if (hd) {
    params.hd = hd // Restrict to specific Google Workspace domain
  }
  
  return oauth2Client.generateAuthUrl(params)
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code, redirectUri = null) {
  const oauth2Client = createOAuth2Client(redirectUri)
  
  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)
    
    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()
    
    return {
      tokens,
      userInfo
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    throw error
  }
}

// Get valid access token with automatic refresh
export async function getValidAccessToken(userId, workspaceId = null, isServerSide = false) {
  try {
    // Use the token service for enhanced token management
    const accessToken = await tokenService.getValidAccessToken(userId, workspaceId)
    return accessToken
  } catch (error) {
    // Fallback to legacy method if token service fails
    console.warn('Token service failed, using legacy method:', error)
    
    const supabase = isServerSide ? await createServerClient() : createClient()
    
    // Get stored tokens
    let query = supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
    
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }
    
    const { data: tokenData, error: tokenError } = await query.single()
    
    if (tokenError || !tokenData) {
      throw new Error('No Google OAuth tokens found for user')
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
      
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Update stored tokens
      const newExpiresAt = new Date()
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + (credentials.expiry_date - Date.now()) / 1000)
      
      const { error: updateError } = await supabase.rpc('upsert_google_token', {
        p_user_id: userId,
        p_access_token: credentials.access_token,
        p_refresh_token: credentials.refresh_token || tokenData.refresh_token,
        p_expires_at: newExpiresAt.toISOString(),
        p_scopes: tokenData.scopes,
        p_google_email: tokenData.google_email,
        p_google_name: tokenData.google_name,
        p_google_picture: tokenData.google_picture,
        p_workspace_id: workspaceId
      })
      
      if (updateError) {
        console.error('Error updating tokens:', updateError)
      }
      
      return credentials.access_token
    }
    
    // Token is still valid
    return tokenData.access_token
  }
}

// Get authenticated OAuth2 client for a user
export async function getAuthenticatedClient(userId, workspaceId = null, isServerSide = false) {
  const accessToken = await getValidAccessToken(userId, workspaceId, isServerSide)
  const oauth2Client = createOAuth2Client()
  
  // Get full token data for refresh token
  const tokenData = await tokenService.getTokens(userId, workspaceId)
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: tokenData?.refresh_token
  })
  
  return oauth2Client
}

// Check if user has Google integration
export async function hasGoogleIntegration(userId, workspaceId = null, isServerSide = false) {
  const supabase = isServerSide ? await createServerClient() : createClient()
  
  let query = supabase
    .from('google_oauth_tokens')
    .select('id')
    .eq('user_id', userId)
  
  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId)
  }
  
  const { data, error } = await query.single()
  
  return !error && data !== null
}

// Store Google tokens securely
export async function storeGoogleTokens({
  userId,
  tokens,
  userInfo,
  workspaceId = null,
  tokenType = 'user'
}) {
  try {
    return await tokenService.storeTokens({
      userId,
      tokens,
      userInfo,
      workspaceId,
      domain: userInfo.hd || userInfo.email?.split('@')[1],
      tokenType,
      metadata: {
        authorized_at: new Date().toISOString(),
        auth_method: 'oauth2'
      }
    })
  } catch (error) {
    console.error('Error storing Google tokens:', error)
    throw error
  }
}

// Revoke Google access
export async function revokeGoogleAccess(userId, workspaceId = null) {
  try {
    return await tokenService.revokeTokens(userId, workspaceId)
  } catch (error) {
    console.error('Error revoking Google access:', error)
    return { success: false, error: error.message }
  }
}

// Check token health
export async function checkTokenHealth(userId, workspaceId = null) {
  return await tokenService.checkTokenHealth(userId, workspaceId)
}

// Handle workspace installation
export async function handleWorkspaceInstallation({
  adminUserId,
  domain,
  serviceAccountKey
}) {
  try {
    const { error } = await supabaseAdmin
      .from('workspace_configs')
      .upsert({
        admin_user_id: adminUserId,
        domain,
        service_account_key: encryptToken(JSON.stringify(serviceAccountKey)),
        settings: {
          installed_at: new Date().toISOString(),
          features_enabled: ['bank_statement_processing', 'google_drive_export']
        },
        is_active: true
      }, {
        onConflict: 'domain'
      })
    
    if (error) {
      throw error
    }
    
    // Log installation
    await tokenService.logActivity(adminUserId, 'workspace_installed', {
      domain,
      installation_type: 'marketplace'
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error handling workspace installation:', error)
    throw error
  }
}

// Get workspace configuration
export async function getWorkspaceConfig(domain) {
  try {
    const { data, error } = await supabaseAdmin
      .from('workspace_configs')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()
    
    if (error || !data) {
      return null
    }
    
    // Decrypt service account key if present
    if (data.service_account_key) {
      data.service_account_key = JSON.parse(decryptToken(data.service_account_key))
    }
    
    return data
  } catch (error) {
    console.error('Error getting workspace config:', error)
    return null
  }
}

// Validate workspace user
export async function validateWorkspaceUser(email, workspaceId) {
  const domain = email.split('@')[1]
  
  const workspaceConfig = await getWorkspaceConfig(domain)
  
  if (!workspaceConfig) {
    return {
      isValid: false,
      reason: 'Workspace not configured'
    }
  }
  
  if (workspaceConfig.id !== workspaceId) {
    return {
      isValid: false,
      reason: 'Workspace ID mismatch'
    }
  }
  
  return {
    isValid: true,
    workspaceConfig
  }
}

// Middleware for workspace-aware requests
export async function withWorkspaceAuth(handler) {
  return async (req, res) => {
    const { userId, workspaceId } = req.body || req.query
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    try {
      // Check token health
      const health = await checkTokenHealth(userId, workspaceId)
      
      if (health.status === 'expired' && !health.has_refresh_token) {
        return res.status(401).json({ 
          error: 'Token expired',
          requiresReauth: true 
        })
      }
      
      // Get valid token (will auto-refresh if needed)
      const accessToken = await getValidAccessToken(userId, workspaceId, true)
      
      // Add to request context
      req.googleAuth = {
        accessToken,
        userId,
        workspaceId
      }
      
      return handler(req, res)
    } catch (error) {
      console.error('Workspace auth error:', error)
      return res.status(401).json({ error: 'Authentication failed' })
    }
  }
}