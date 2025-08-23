import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createOAuth2Client } from './auth'

// Encryption configuration
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const PBKDF2_ITERATIONS = 100000

// Derive key from password
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256')
}

// Encrypt sensitive data
export function encryptToken(text) {
  if (!text) return null
  
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = deriveKey(ENCRYPTION_KEY, salt)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ])
  
  const tag = cipher.getAuthTag()
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
}

// Decrypt sensitive data
export function decryptToken(encryptedData) {
  if (!encryptedData) return null
  
  try {
    // First check if this is actually encrypted data
    // Encrypted data should be base64 and have specific length characteristics
    const buffer = Buffer.from(encryptedData, 'base64')
    
    // If buffer is too small to contain salt + iv + tag, it's likely plain text
    if (buffer.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
      // Return as plain text
      return encryptedData
    }
    
    const salt = buffer.slice(0, SALT_LENGTH)
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    const key = deriveKey(ENCRYPTION_KEY, salt)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption failed:', error)
    // If decryption fails, it might be plain text
    // Check if it looks like a valid token (starts with ya29 for Google tokens)
    if (encryptedData.startsWith('ya29') || encryptedData.includes('.')) {
      return encryptedData
    }
    return null
  }
}

// Token management service
export class GoogleTokenService {
  constructor() {
    this.refreshBuffer = 5 * 60 * 1000 // 5 minutes before expiry
  }

  // Store tokens with encryption
  async storeTokens({
    userId,
    tokens,
    userInfo,
    workspaceId = null,
    domain = null,
    tokenType = 'user',
    metadata = {}
  }) {
    try {
      // Encrypt sensitive tokens
      const encryptedAccessToken = encryptToken(tokens.access_token)
      const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null
      
      // Calculate expiry time
      const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000)
      
      // Extract domain from email if not provided
      if (!domain && userInfo?.email) {
        domain = userInfo.email.split('@')[1]
      }
      
      // Log token activity
      await this.logActivity(userId, 'token_stored', {
        workspace_id: workspaceId,
        domain,
        token_type: tokenType,
        scopes: tokens.scope?.split(' ') || []
      })
      
      // Store encrypted tokens
      const { error } = await supabaseAdmin.rpc('upsert_google_token', {
        p_user_id: userId,
        p_access_token: encryptedAccessToken,
        p_refresh_token: encryptedRefreshToken,
        p_expires_at: expiresAt.toISOString(),
        p_scopes: tokens.scope?.split(' ') || [],
        p_google_email: userInfo?.email,
        p_google_name: userInfo?.name,
        p_google_picture: userInfo?.picture,
        p_workspace_id: workspaceId,
        p_domain: domain,
        p_token_type: tokenType,
        p_metadata: metadata
      })
      
      if (error) {
        throw error
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error storing tokens:', error)
      throw error
    }
  }

  // Retrieve and decrypt tokens
  async getTokens(userId, workspaceId = null) {
    try {
      let query = supabaseAdmin
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', userId)
      
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      }
      
      const { data, error } = await query.single()
      
      if (error || !data) {
        return null
      }
      
      // Decrypt tokens - handle both encrypted and plain text
      const decryptedData = {
        ...data,
        access_token: data.is_encrypted === false ? data.access_token : decryptToken(data.access_token),
        refresh_token: data.refresh_token ? (data.is_encrypted === false ? data.refresh_token : decryptToken(data.refresh_token)) : null
      }
      
      return decryptedData
    } catch (error) {
      console.error('Error retrieving tokens:', error)
      return null
    }
  }

  // Get valid access token with automatic refresh
  async getValidAccessToken(userId, workspaceId = null) {
    try {
      const tokenData = await this.getTokens(userId, workspaceId)
      
      if (!tokenData) {
        throw new Error('No tokens found')
      }
      
      const now = new Date()
      const expiresAt = new Date(tokenData.token_expires_at)
      const shouldRefresh = now >= new Date(expiresAt - this.refreshBuffer)
      
      if (shouldRefresh && tokenData.refresh_token) {
        // Refresh the token
        const newTokens = await this.refreshAccessToken(userId, workspaceId)
        return newTokens.access_token
      }
      
      return tokenData.access_token
    } catch (error) {
      console.error('Error getting valid access token:', error)
      throw error
    }
  }

  // Refresh access token
  async refreshAccessToken(userId, workspaceId = null) {
    try {
      const tokenData = await this.getTokens(userId, workspaceId)
      
      if (!tokenData || !tokenData.refresh_token) {
        throw new Error('No refresh token available')
      }
      
      const oauth2Client = createOAuth2Client()
      oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token
      })
      
      // Log refresh attempt
      await this.logActivity(userId, 'token_refresh_attempt', {
        workspace_id: workspaceId,
        current_expiry: tokenData.token_expires_at
      })
      
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      // Store new tokens
      await this.storeTokens({
        userId,
        tokens: credentials,
        userInfo: {
          email: tokenData.google_email,
          name: tokenData.google_name,
          picture: tokenData.google_picture
        },
        workspaceId,
        domain: tokenData.domain,
        tokenType: tokenData.token_type,
        metadata: {
          ...tokenData.metadata,
          last_refresh: new Date().toISOString()
        }
      })
      
      // Log successful refresh
      await this.logActivity(userId, 'token_refreshed', {
        workspace_id: workspaceId,
        new_expiry: new Date(credentials.expiry_date).toISOString()
      })
      
      return {
        access_token: credentials.access_token,
        expiry_date: credentials.expiry_date
      }
    } catch (error) {
      // Log failed refresh
      await this.logActivity(userId, 'token_refresh_failed', {
        workspace_id: workspaceId,
        error: error.message
      })
      
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  // Revoke tokens
  async revokeTokens(userId, workspaceId = null) {
    try {
      const tokenData = await this.getTokens(userId, workspaceId)
      
      if (!tokenData) {
        return { success: true, message: 'No tokens to revoke' }
      }
      
      // Revoke with Google
      if (tokenData.access_token) {
        const oauth2Client = createOAuth2Client()
        try {
          await oauth2Client.revokeToken(tokenData.access_token)
        } catch (error) {
          console.error('Error revoking token with Google:', error)
        }
      }
      
      // Delete from database
      let query = supabaseAdmin
        .from('google_oauth_tokens')
        .delete()
        .eq('user_id', userId)
      
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId)
      }
      
      const { error } = await query
      
      if (error) {
        throw error
      }
      
      // Log revocation
      await this.logActivity(userId, 'token_revoked', {
        workspace_id: workspaceId,
        domain: tokenData.domain
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error revoking tokens:', error)
      throw error
    }
  }

  // Log token activity
  async logActivity(userId, action, metadata = {}) {
    try {
      const { error } = await supabaseAdmin
        .from('token_activity_logs')
        .insert({
          user_id: userId,
          action,
          metadata,
          ip_address: metadata.ip_address || null,
          user_agent: metadata.user_agent || null
        })
      
      if (error) {
        console.error('Error logging activity:', error)
      }
    } catch (error) {
      console.error('Error in logActivity:', error)
    }
  }

  // Get workspace tokens (for admin)
  async getWorkspaceTokens(workspaceId) {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_workspace_tokens', { p_workspace_id: workspaceId })
      
      if (error) {
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error getting workspace tokens:', error)
      return []
    }
  }

  // Check token health
  async checkTokenHealth(userId, workspaceId = null) {
    try {
      const tokenData = await this.getTokens(userId, workspaceId)
      
      if (!tokenData) {
        return {
          status: 'missing',
          message: 'No tokens found'
        }
      }
      
      const now = new Date()
      const expiresAt = new Date(tokenData.token_expires_at)
      const minutesUntilExpiry = (expiresAt - now) / (1000 * 60)
      
      if (minutesUntilExpiry < 0) {
        return {
          status: 'expired',
          message: 'Token has expired',
          expired_at: expiresAt,
          has_refresh_token: !!tokenData.refresh_token
        }
      }
      
      if (minutesUntilExpiry < 10) {
        return {
          status: 'expiring_soon',
          message: 'Token expiring soon',
          minutes_until_expiry: Math.floor(minutesUntilExpiry),
          expires_at: expiresAt
        }
      }
      
      return {
        status: 'healthy',
        message: 'Token is valid',
        expires_at: expiresAt,
        refresh_count: tokenData.refresh_count || 0,
        last_refreshed_at: tokenData.last_refreshed_at
      }
    } catch (error) {
      console.error('Error checking token health:', error)
      return {
        status: 'error',
        message: error.message
      }
    }
  }

  // Cleanup expired tokens (scheduled job)
  async cleanupExpiredTokens() {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('cleanup_expired_tokens')
      
      if (error) {
        throw error
      }
      
      console.log(`Cleaned up ${data} expired tokens`)
      return data
    } catch (error) {
      console.error('Error cleaning up tokens:', error)
      return 0
    }
  }
}

// Export singleton instance
export const tokenService = new GoogleTokenService()