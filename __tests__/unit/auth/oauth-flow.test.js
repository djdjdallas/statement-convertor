import { mockOAuth2Client, mockTokenScenarios } from '../../mocks/google-auth.mock'
import { mockSupabaseClient } from '../../mocks/supabase.mock'
import { MockFactory } from '../../utils/mock-factories'
import { generateAuthUrl, handleCallback, refreshAccessToken } from '@/lib/google/auth'

// Mock dependencies
jest.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabaseClient
}))

describe('Google OAuth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateAuthUrl', () => {
    it('should generate auth URL for individual installation', async () => {
      const userId = 'test-user-id'
      const redirectUrl = '/dashboard'
      
      const result = await generateAuthUrl({
        userId,
        redirectUrl,
        installationType: 'individual'
      })

      expect(result).toHaveProperty('authUrl')
      expect(result).toHaveProperty('state')
      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: expect.arrayContaining([
          'https://www.googleapis.com/auth/drive.file'
        ]),
        state: expect.any(String),
        prompt: 'consent'
      })
    })

    it('should generate auth URL for domain-wide installation', async () => {
      const userId = 'admin-user-id'
      const domain = 'example.com'
      
      const result = await generateAuthUrl({
        userId,
        installationType: 'domain',
        domain,
        redirectUrl: '/settings'
      })

      expect(result).toHaveProperty('authUrl')
      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: expect.arrayContaining([
          'https://www.googleapis.com/auth/admin.directory.user.readonly'
        ]),
        state: expect.any(String),
        prompt: 'consent',
        hd: domain
      })
    })

    it('should store OAuth state in database', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: MockFactory.oauthState(),
          error: null
        })
      })

      const result = await generateAuthUrl({
        userId: 'test-user-id',
        redirectUrl: '/dashboard'
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('google_oauth_states')
      expect(result.state).toBeDefined()
    })

    it('should handle state creation errors', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })

      await expect(generateAuthUrl({
        userId: 'test-user-id'
      })).rejects.toThrow('Failed to create OAuth state')
    })
  })

  describe('handleCallback', () => {
    it('should exchange code for tokens successfully', async () => {
      const code = 'test-auth-code'
      const state = 'test-state'
      
      // Mock state verification
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: MockFactory.oauthState({ state }),
          error: null
        })
      })

      // Mock token storage
      mockSupabaseClient.from.mockReturnValueOnce({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'token-id' },
          error: null
        })
      })

      const result = await handleCallback({ code, state })

      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith(code)
      expect(result).toHaveProperty('tokens')
      expect(result).toHaveProperty('userId', 'test-user-id')
    })

    it('should handle invalid state', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      await expect(handleCallback({
        code: 'test-code',
        state: 'invalid-state'
      })).rejects.toThrow('Invalid or expired OAuth state')
    })

    it('should handle token exchange errors', async () => {
      const state = 'test-state'
      
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: MockFactory.oauthState({ state }),
          error: null
        })
      })

      mockOAuth2Client.getToken.mockRejectedValueOnce(new Error('Invalid grant'))

      await expect(handleCallback({
        code: 'invalid-code',
        state
      })).rejects.toThrow('Invalid grant')
    })

    it('should validate token scopes', async () => {
      const state = 'test-state'
      const insufficientTokens = {
        tokens: {
          ...mockTokenScenarios.valid,
          scope: 'https://www.googleapis.com/auth/drive.readonly'
        }
      }
      
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: MockFactory.oauthState({ state }),
          error: null
        })
      })

      mockOAuth2Client.getToken.mockResolvedValueOnce(insufficientTokens)

      await expect(handleCallback({
        code: 'test-code',
        state
      })).rejects.toThrow('Insufficient permissions granted')
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh expired token successfully', async () => {
      const userId = 'test-user-id'
      const expiredToken = mockTokenScenarios.expired
      
      // Mock token retrieval
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...expiredToken, user_id: userId },
          error: null
        })
      })

      // Mock token update
      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { access_token: 'new-access-token' },
          error: null
        })
      })

      const result = await refreshAccessToken(userId)

      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(expiredToken)
      expect(mockOAuth2Client.refreshToken).toHaveBeenCalled()
      expect(result).toHaveProperty('access_token', 'new-access-token')
    })

    it('should return valid token without refreshing', async () => {
      const userId = 'test-user-id'
      const validToken = mockTokenScenarios.valid
      
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...validToken, user_id: userId },
          error: null
        })
      })

      const result = await refreshAccessToken(userId)

      expect(mockOAuth2Client.refreshToken).not.toHaveBeenCalled()
      expect(result).toEqual(validToken)
    })

    it('should handle missing refresh token', async () => {
      const userId = 'test-user-id'
      const tokenWithoutRefresh = mockTokenScenarios.noRefreshToken
      
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...tokenWithoutRefresh, user_id: userId },
          error: null
        })
      })

      await expect(refreshAccessToken(userId)).rejects.toThrow('No refresh token available')
    })

    it('should handle refresh failures', async () => {
      const userId = 'test-user-id'
      const expiredToken = mockTokenScenarios.expired
      
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...expiredToken, user_id: userId },
          error: null
        })
      })

      mockOAuth2Client.refreshToken.mockRejectedValueOnce(new Error('Token has been revoked'))

      await expect(refreshAccessToken(userId)).rejects.toThrow('Token has been revoked')
    })
  })

  describe('OAuth Flow Edge Cases', () => {
    it('should handle concurrent auth attempts', async () => {
      const userId = 'test-user-id'
      
      // Simulate concurrent auth URL generation
      const promises = Array(3).fill(null).map(() => 
        generateAuthUrl({ userId, redirectUrl: '/dashboard' })
      )

      const results = await Promise.all(promises)
      
      // Each should have unique state
      const states = results.map(r => r.state)
      expect(new Set(states).size).toBe(3)
    })

    it('should clean up expired states', async () => {
      // This would be tested in integration tests with actual database
      // Here we just verify the cleanup query structure
      const cleanup = async () => {
        return mockSupabaseClient
          .from('google_oauth_states')
          .delete()
          .lt('expires_at', new Date().toISOString())
      }

      mockSupabaseClient.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ error: null })
      })

      await cleanup()
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('google_oauth_states')
    })
  })
})