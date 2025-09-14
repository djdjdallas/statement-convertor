import crypto from 'crypto'
import { google } from 'googleapis'
// DEPRECATED: Migrating to unified-oauth.js
import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/utils/supabase/server'

// Encryption configuration
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 32)
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

// Token refresh configuration
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000 // Refresh 5 minutes before expiry
const MAX_REFRESH_RETRIES = 3
const REFRESH_RETRY_DELAY = 1000 // 1 second

/**
 * Encrypts sensitive data using AES-256-GCM
 */
function encrypt(text) {
  if (!ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  }

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  )

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypts data encrypted with encrypt()
 */
function decrypt(encryptedData) {
  if (!ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  }

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(encryptedData.iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Enhanced OAuth2 client factory with workspace support
 */
export function createOAuth2Client(options = {}) {
  const { serviceAccount, subject } = options

  // Service account flow for domain-wide delegation
  if (serviceAccount) {
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: options.scopes || [],
      subject: subject // For domain-wide delegation
    })
    return auth
  }

  // Standard OAuth2 flow - use unified implementation
  const { createOAuth2Client } = require('./unified-oauth')
  return createOAuth2Client(options.redirectUri)
}

/**
 * Token manager class for comprehensive token handling
 */
export class TokenManager {
  constructor(options = {}) {
    this.isServerSide = options.isServerSide || false
    this.workspaceId = options.workspaceId
    this.domain = options.domain
  }

  /**
   * Get Supabase client instance
   */
  async getSupabase() {
    return this.isServerSide ? await createServerClient() : createClient()
  }

  /**
   * Store tokens with encryption
   */
  async storeTokens({
    userId,
    accessToken,
    refreshToken,
    expiresAt,
    scopes,
    googleEmail,
    googleName,
    googlePicture,
    workspaceId,
    domain,
    tokenType = 'user' // 'user' or 'service_account'
  }) {
    const supabase = await this.getSupabase()

    // Encrypt sensitive tokens
    const encryptedAccess = encrypt(accessToken)
    const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null

    const tokenData = {
      user_id: userId,
      access_token: JSON.stringify(encryptedAccess),
      refresh_token: encryptedRefresh ? JSON.stringify(encryptedRefresh) : null,
      token_expires_at: expiresAt,
      scopes: scopes || [],
      google_email: googleEmail,
      google_name: googleName,
      google_picture: googlePicture,
      workspace_id: workspaceId,
      domain: domain,
      token_type: tokenType,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('google_oauth_tokens')
      .upsert(tokenData, {
        onConflict: 'user_id,workspace_id',
        ignoreDuplicates: false
      })

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`)
    }

    // Schedule automatic refresh if needed
    if (tokenType === 'user') {
      await this.scheduleTokenRefresh(userId, expiresAt, workspaceId)
    }

    return { success: true }
  }

  /**
   * Retrieve and decrypt tokens
   */
  async getTokens(userId, workspaceId = null) {
    const supabase = await this.getSupabase()

    let query = supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    } else {
      query = query.is('workspace_id', null)
    }

    const { data: tokenData, error } = await query.single()

    if (error || !tokenData) {
      return null
    }

    // Decrypt tokens
    try {
      const decryptedAccess = decrypt(JSON.parse(tokenData.access_token))
      const decryptedRefresh = tokenData.refresh_token 
        ? decrypt(JSON.parse(tokenData.refresh_token))
        : null

      return {
        ...tokenData,
        access_token: decryptedAccess,
        refresh_token: decryptedRefresh
      }
    } catch (error) {
      console.error('Failed to decrypt tokens:', error)
      throw new Error('Token decryption failed')
    }
  }

  /**
   * Get valid access token with automatic refresh
   */
  async getValidAccessToken(userId, options = {}) {
    const { workspaceId, forceRefresh = false } = options
    const tokenData = await this.getTokens(userId, workspaceId)

    if (!tokenData) {
      throw new Error('No tokens found')
    }

    const now = new Date()
    const expiresAt = new Date(tokenData.token_expires_at)
    const shouldRefresh = forceRefresh || 
      (now.getTime() + TOKEN_REFRESH_BUFFER >= expiresAt.getTime())

    if (shouldRefresh && tokenData.refresh_token) {
      return await this.refreshAccessToken(userId, tokenData, workspaceId)
    }

    return tokenData.access_token
  }

  /**
   * Refresh access token with retry logic
   */
  async refreshAccessToken(userId, tokenData, workspaceId = null, retryCount = 0) {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
      refresh_token: tokenData.refresh_token
    })

    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Calculate new expiry
      const newExpiresAt = new Date()
      if (credentials.expiry_date) {
        newExpiresAt.setTime(credentials.expiry_date)
      } else {
        // Default to 1 hour if not provided
        newExpiresAt.setHours(newExpiresAt.getHours() + 1)
      }

      // Store updated tokens
      await this.storeTokens({
        userId,
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || tokenData.refresh_token,
        expiresAt: newExpiresAt.toISOString(),
        scopes: tokenData.scopes,
        googleEmail: tokenData.google_email,
        googleName: tokenData.google_name,
        googlePicture: tokenData.google_picture,
        workspaceId,
        domain: tokenData.domain,
        tokenType: tokenData.token_type
      })

      // Log successful refresh
      await this.logTokenActivity(userId, 'refresh_success', { workspaceId })

      return credentials.access_token
    } catch (error) {
      console.error('Token refresh failed:', error)

      // Retry logic
      if (retryCount < MAX_REFRESH_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, REFRESH_RETRY_DELAY * (retryCount + 1)))
        return await this.refreshAccessToken(userId, tokenData, workspaceId, retryCount + 1)
      }

      // Log refresh failure
      await this.logTokenActivity(userId, 'refresh_failed', { 
        workspaceId, 
        error: error.message 
      })

      throw new Error('Failed to refresh token after retries')
    }
  }

  /**
   * Schedule automatic token refresh
   */
  async scheduleTokenRefresh(userId, expiresAt, workspaceId = null) {
    // In a production environment, you would use a job queue like Bull or similar
    // For now, we'll use a simple setTimeout for demonstration
    const expiryTime = new Date(expiresAt).getTime()
    const now = Date.now()
    const refreshTime = expiryTime - TOKEN_REFRESH_BUFFER

    if (refreshTime > now) {
      setTimeout(async () => {
        try {
          const tokenData = await this.getTokens(userId, workspaceId)
          if (tokenData && tokenData.refresh_token) {
            await this.refreshAccessToken(userId, tokenData, workspaceId)
          }
        } catch (error) {
          console.error('Scheduled token refresh failed:', error)
        }
      }, refreshTime - now)
    }
  }

  /**
   * Get authenticated client with proper token handling
   */
  async getAuthenticatedClient(userId, options = {}) {
    const { workspaceId, serviceAccount } = options
    const accessToken = await this.getValidAccessToken(userId, { workspaceId })

    if (serviceAccount) {
      return createOAuth2Client({ serviceAccount, scopes: options.scopes })
    }

    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
      access_token: accessToken
    })

    return oauth2Client
  }

  /**
   * Revoke tokens and clean up
   */
  async revokeTokens(userId, workspaceId = null) {
    const supabase = await this.getSupabase()
    
    try {
      // Get tokens before deletion
      const tokenData = await this.getTokens(userId, workspaceId)
      
      if (tokenData) {
        // Revoke with Google
        const oauth2Client = createOAuth2Client()
        await oauth2Client.revokeToken(tokenData.access_token)
      }

      // Delete from database
      let query = supabase
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', userId)

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      } else {
        query = query.is('workspace_id', null)
      }

      const { error } = await query

      if (error) {
        throw error
      }

      // Log revocation
      await this.logTokenActivity(userId, 'revoked', { workspaceId })

      return { success: true }
    } catch (error) {
      console.error('Error revoking tokens:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Log token-related activities for audit trail
   */
  async logTokenActivity(userId, action, metadata = {}) {
    const supabase = await this.getSupabase()
    
    await supabase
      .from('token_activity_logs')
      .insert({
        user_id: userId,
        action,
        metadata,
        ip_address: metadata.ipAddress || null,
        user_agent: metadata.userAgent || null,
        created_at: new Date().toISOString()
      })
      .catch(error => console.error('Failed to log token activity:', error))
  }

  /**
   * Handle domain-wide delegation for Google Workspace
   */
  async setupDomainWideDelegation(adminUserId, serviceAccountKey, domain) {
    const supabase = await this.getSupabase()

    // Encrypt service account key
    const encryptedKey = encrypt(JSON.stringify(serviceAccountKey))

    const { error } = await supabase
      .from('workspace_configs')
      .upsert({
        admin_user_id: adminUserId,
        domain,
        service_account_key: JSON.stringify(encryptedKey),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'domain'
      })

    if (error) {
      throw new Error(`Failed to store workspace config: ${error.message}`)
    }

    return { success: true }
  }

  /**
   * Get service account for domain
   */
  async getServiceAccountForDomain(domain) {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('workspace_configs')
      .select('service_account_key')
      .eq('domain', domain)
      .single()

    if (error || !data) {
      return null
    }

    try {
      const decryptedKey = decrypt(JSON.parse(data.service_account_key))
      return JSON.parse(decryptedKey)
    } catch (error) {
      console.error('Failed to decrypt service account key:', error)
      return null
    }
  }
}

// Export convenience functions that use the TokenManager
export async function getValidAccessToken(userId, isServerSide = false) {
  const manager = new TokenManager({ isServerSide })
  return await manager.getValidAccessToken(userId)
}

export async function getAuthenticatedClient(userId, isServerSide = false) {
  const manager = new TokenManager({ isServerSide })
  return await manager.getAuthenticatedClient(userId)
}

export async function hasGoogleIntegration(userId, isServerSide = false) {
  const manager = new TokenManager({ isServerSide })
  const tokens = await manager.getTokens(userId)
  return tokens !== null
}

export async function revokeGoogleAccess(userId) {
  const manager = new TokenManager()
  return await manager.revokeTokens(userId)
}