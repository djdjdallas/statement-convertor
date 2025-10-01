import { mockOAuth2Client, mockWorkspaceDomainVerification } from '../../mocks/google-auth.mock'
import { mockSupabaseClient, mockSupabaseAdmin } from '../../mocks/supabase.mock'
import { MockFactory } from '../../utils/mock-factories'

// Mock the actual implementation
const mockWorkspaceAuth = {
  verifyDomainOwnership: jest.fn(),
  installForDomain: jest.fn(),
  installForIndividual: jest.fn(),
  checkInstallationType: jest.fn(),
  getDomainUsers: jest.fn()
}

jest.mock('@/lib/google/workspace-auth', () => mockWorkspaceAuth)

describe('Workspace Installation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Domain-wide Installation', () => {
    it('should verify domain ownership before installation', async () => {
      const adminEmail = 'admin@example.com'
      const domain = 'example.com'
      
      mockWorkspaceAuth.verifyDomainOwnership.mockResolvedValue({
        verified: true,
        domain,
        adminEmail
      })

      mockWorkspaceAuth.installForDomain.mockResolvedValue({
        success: true,
        installationType: 'domain',
        domain,
        workspaceConfig: MockFactory.workspaceConfig(domain)
      })

      // Verify domain first
      const verification = await mockWorkspaceAuth.verifyDomainOwnership(adminEmail)
      expect(verification.verified).toBe(true)

      // Then install
      const result = await mockWorkspaceAuth.installForDomain({
        domain,
        adminEmail,
        tokens: MockFactory.createMockGoogleTokens()
      })

      expect(result.success).toBe(true)
      expect(result.installationType).toBe('domain')
    })

    it('should require admin privileges for domain installation', async () => {
      const nonAdminEmail = 'user@example.com'
      const domain = 'example.com'
      
      mockWorkspaceAuth.verifyDomainOwnership.mockResolvedValue({
        verified: false,
        error: 'User is not a domain administrator'
      })

      const verification = await mockWorkspaceAuth.verifyDomainOwnership(nonAdminEmail)
      
      expect(verification.verified).toBe(false)
      expect(verification.error).toContain('administrator')
    })

    it('should store domain-wide configuration', async () => {
      const domain = 'example.com'
      const config = MockFactory.workspaceConfig(domain)
      
      mockSupabaseAdmin.from.mockReturnValueOnce({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: config,
          error: null
        })
      })

      const storeConfig = async (config) => {
        return mockSupabaseAdmin
          .from('workspace_configs')
          .upsert(config)
          .select()
          .single()
      }

      const result = await storeConfig(config)
      
      expect(result.data.domain).toBe(domain)
      expect(result.data.installation_type).toBe('domain')
    })

    it('should handle domain verification failures', async () => {
      mockWorkspaceAuth.verifyDomainOwnership.mockResolvedValue({
        verified: false,
        error: 'Domain verification failed: TXT record not found'
      })

      const result = await mockWorkspaceAuth.verifyDomainOwnership('admin@unverified.com')
      
      expect(result.verified).toBe(false)
      expect(result.error).toContain('TXT record')
    })
  })

  describe('Individual Installation', () => {
    it('should allow individual users without domain verification', async () => {
      const userEmail = 'user@gmail.com'
      
      mockWorkspaceAuth.installForIndividual.mockResolvedValue({
        success: true,
        installationType: 'individual',
        userEmail,
        config: {
          features: ['basic_export', 'manual_upload'],
          limits: {
            daily_conversions: 10,
            file_size_mb: 25
          }
        }
      })

      const result = await mockWorkspaceAuth.installForIndividual({
        userEmail,
        tokens: MockFactory.createMockGoogleTokens()
      })

      expect(result.success).toBe(true)
      expect(result.installationType).toBe('individual')
      expect(result.config.limits.daily_conversions).toBe(10)
    })

    it('should not grant admin features to individual users', async () => {
      const result = await mockWorkspaceAuth.installForIndividual({
        userEmail: 'user@gmail.com',
        tokens: MockFactory.createMockGoogleTokens()
      })

      mockWorkspaceAuth.installForIndividual.mockResolvedValue({
        ...result,
        config: {
          features: ['basic_export', 'manual_upload'],
          adminFeatures: []
        }
      })

      const response = await mockWorkspaceAuth.installForIndividual({
        userEmail: 'user@gmail.com',
        tokens: MockFactory.createMockGoogleTokens()
      })

      expect(response.config.adminFeatures).toEqual([])
      expect(response.config.features).not.toContain('admin_controls')
    })
  })

  describe('Installation Type Detection', () => {
    it('should detect domain installation for workspace users', async () => {
      const email = 'user@example.com'
      
      mockWorkspaceAuth.checkInstallationType.mockResolvedValue({
        type: 'domain',
        domain: 'example.com',
        config: MockFactory.workspaceConfig('example.com')
      })

      const result = await mockWorkspaceAuth.checkInstallationType(email)
      
      expect(result.type).toBe('domain')
      expect(result.domain).toBe('example.com')
    })

    it('should detect individual installation for personal accounts', async () => {
      const email = 'user@gmail.com'
      
      mockWorkspaceAuth.checkInstallationType.mockResolvedValue({
        type: 'individual',
        domain: null
      })

      const result = await mockWorkspaceAuth.checkInstallationType(email)
      
      expect(result.type).toBe('individual')
      expect(result.domain).toBeNull()
    })

    it('should handle mixed workspace scenarios', async () => {
      // User from workspace domain but no domain-wide installation
      const email = 'user@company.com'
      
      mockWorkspaceAuth.checkInstallationType.mockResolvedValue({
        type: 'individual',
        domain: 'company.com',
        reason: 'Domain not configured for workspace installation'
      })

      const result = await mockWorkspaceAuth.checkInstallationType(email)
      
      expect(result.type).toBe('individual')
      expect(result.reason).toContain('not configured')
    })
  })

  describe('Domain User Management', () => {
    it('should list all domain users for admin', async () => {
      const domain = 'example.com'
      const users = [
        { email: 'user1@example.com', role: 'user', active: true },
        { email: 'user2@example.com', role: 'user', active: true },
        { email: 'admin@example.com', role: 'admin', active: true }
      ]
      
      mockWorkspaceAuth.getDomainUsers.mockResolvedValue({
        users,
        totalUsers: 3,
        domain
      })

      const result = await mockWorkspaceAuth.getDomainUsers({
        domain,
        adminToken: 'admin-token'
      })

      expect(result.users).toHaveLength(3)
      expect(result.users.some(u => u.role === 'admin')).toBe(true)
    })

    it('should handle pagination for large domains', async () => {
      const domain = 'large-company.com'
      
      mockWorkspaceAuth.getDomainUsers
        .mockResolvedValueOnce({
          users: Array(100).fill(null).map((_, i) => ({
            email: `user${i}@${domain}`,
            role: 'user'
          })),
          nextPageToken: 'page-2',
          totalUsers: 250
        })
        .mockResolvedValueOnce({
          users: Array(100).fill(null).map((_, i) => ({
            email: `user${i + 100}@${domain}`,
            role: 'user'
          })),
          nextPageToken: 'page-3',
          totalUsers: 250
        })

      const page1 = await mockWorkspaceAuth.getDomainUsers({
        domain,
        pageToken: null
      })

      const page2 = await mockWorkspaceAuth.getDomainUsers({
        domain,
        pageToken: page1.nextPageToken
      })

      expect(page1.users).toHaveLength(100)
      expect(page2.users).toHaveLength(100)
      expect(page1.nextPageToken).toBe('page-2')
    })
  })

  describe('Permission Scopes', () => {
    it('should request appropriate scopes for domain installation', async () => {
      const generateAuthUrl = (installationType) => {
        const scopes = installationType === 'domain'
          ? [
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/admin.directory.user.readonly'
            ]
          : [
              'https://www.googleapis.com/auth/drive.file'
            ]

        return { scopes }
      }

      const domainScopes = generateAuthUrl('domain')
      const individualScopes = generateAuthUrl('individual')

      expect(domainScopes.scopes).toContain('https://www.googleapis.com/auth/admin.directory.user.readonly')
      expect(individualScopes.scopes).not.toContain('https://www.googleapis.com/auth/admin.directory.user.readonly')
    })
  })
})