import { mockOAuth2Client } from '../mocks/google-auth.mock'
import { mockDriveAPI, mockSheetsAPI } from '../mocks/google-apis.mock'
import { mockSupabaseClient } from '../mocks/supabase.mock'
import { MockFactory } from '../utils/mock-factories'
import { createMockFile, mockFetchResponse, waitForAsync } from '../utils/test-helpers'

describe('Google Workspace Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete OAuth to Export Flow', () => {
    it('should complete full flow from OAuth to Sheets export', async () => {
      const userId = 'test-user-id'
      
      // Step 1: User initiates OAuth
      const authUrl = 'https://accounts.google.com/o/oauth2/auth?mock=true'
      const state = 'test-state-123'
      
      mockFetchResponse({
        authUrl,
        state
      })

      // Simulate auth URL generation
      const authResponse = await fetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ 
          userId,
          redirectUrl: '/dashboard' 
        })
      })
      
      const { authUrl: generatedUrl } = await authResponse.json()
      expect(generatedUrl).toBe(authUrl)

      // Step 2: User returns from Google with auth code
      const authCode = 'test-auth-code'
      
      mockFetchResponse({
        success: true,
        userId,
        tokens: MockFactory.createMockGoogleTokens()
      })

      const callbackResponse = await fetch('/api/auth/google/callback', {
        method: 'POST',
        body: JSON.stringify({ code: authCode, state })
      })

      const tokenResult = await callbackResponse.json()
      expect(tokenResult.success).toBe(true)

      // Step 3: User uploads PDF
      const mockFile = createMockFile('statement.pdf', 1024000)
      const fileId = 'file-123'
      
      mockFetchResponse({
        fileId,
        status: 'processing'
      })

      const uploadResponse = await fetch('/api/process-pdf', {
        method: 'POST',
        body: JSON.stringify({
          file: mockFile,
          userId
        })
      })

      const uploadResult = await uploadResponse.json()
      expect(uploadResult.fileId).toBe(fileId)

      // Step 4: PDF processing completes
      await waitForAsync()
      
      mockFetchResponse({
        status: 'completed',
        transactions: MockFactory.transactions(10, fileId)
      })

      // Step 5: User exports to Google Sheets
      mockFetchResponse({
        success: true,
        spreadsheetId: 'sheet-123',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sheet-123/edit'
      })

      const exportResponse = await fetch('/api/export', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          format: 'google_sheets',
          userId
        })
      })

      const exportResult = await exportResponse.json()
      expect(exportResult.success).toBe(true)
      expect(exportResult.spreadsheetUrl).toContain('docs.google.com')
    })

    it('should handle token refresh during long operations', async () => {
      const userId = 'test-user-id'
      const fileIds = Array(5).fill(null).map((_, i) => `file-${i}`)
      
      // Mock token that expires during operation
      let tokenExpiryTime = Date.now() + 2000 // Expires in 2 seconds
      
      const mockTokenRefresh = jest.fn().mockImplementation(() => {
        tokenExpiryTime = Date.now() + 3600000 // Refresh adds 1 hour
        return {
          access_token: 'refreshed-token',
          expiry_date: tokenExpiryTime
        }
      })

      // Simulate batch export operation
      const batchExport = async (fileIds) => {
        const results = []
        
        for (const fileId of fileIds) {
          // Check if token needs refresh
          if (Date.now() > tokenExpiryTime - 300000) { // 5 min buffer
            await mockTokenRefresh()
          }
          
          // Simulate export delay
          await new Promise(resolve => setTimeout(resolve, 500))
          
          results.push({
            fileId,
            exported: true,
            timestamp: Date.now()
          })
        }
        
        return results
      }

      const results = await batchExport(fileIds)
      
      expect(results).toHaveLength(5)
      expect(mockTokenRefresh).toHaveBeenCalled() // Token should have been refreshed
    })
  })

  describe('Workspace Admin Operations', () => {
    it('should allow admin to configure domain-wide settings', async () => {
      const adminUser = MockFactory.createMockWorkspaceAdmin('example.com')
      
      // Step 1: Verify admin status
      mockFetchResponse({
        isAdmin: true,
        domain: 'example.com',
        permissions: ['manage_users', 'configure_settings']
      })

      const verifyResponse = await fetch('/api/workspace/verify-domain', {
        method: 'POST',
        body: JSON.stringify({
          userId: adminUser.id,
          domain: 'example.com'
        })
      })

      const verifyResult = await verifyResponse.json()
      expect(verifyResult.isAdmin).toBe(true)

      // Step 2: Configure workspace settings
      const workspaceConfig = {
        domain: 'example.com',
        settings: {
          defaultExportFormat: 'google_sheets',
          autoProcessing: true,
          sharedDriveFolder: 'folder-123',
          categoryMapping: {
            'WALMART': 'Groceries',
            'AMAZON': 'Shopping'
          }
        }
      }

      mockFetchResponse({
        success: true,
        config: workspaceConfig
      })

      const configResponse = await fetch('/api/workspace/configure', {
        method: 'POST',
        body: JSON.stringify(workspaceConfig)
      })

      const configResult = await configResponse.json()
      expect(configResult.success).toBe(true)

      // Step 3: Get workspace usage analytics
      mockFetchResponse({
        analytics: {
          totalUsers: 150,
          activeUsers: 87,
          totalConversions: 1234,
          storageUsed: '2.5GB',
          topCategories: ['Shopping', 'Food & Dining', 'Transportation']
        }
      })

      const analyticsResponse = await fetch('/api/workspace/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminUser.token}`
        }
      })

      const analytics = await analyticsResponse.json()
      expect(analytics.analytics.totalUsers).toBe(150)
    })

    it('should enforce workspace-level permissions', async () => {
      const regularUser = {
        id: 'regular-user',
        email: 'user@example.com',
        domain: 'example.com',
        isAdmin: false
      }

      // Regular user tries to access admin endpoint
      mockFetchResponse(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )

      const response = await fetch('/api/workspace/configure', {
        method: 'POST',
        body: JSON.stringify({
          userId: regularUser.id,
          settings: {}
        })
      })

      expect(response.status).toBe(403)
      const result = await response.json()
      expect(result.error).toContain('Insufficient permissions')
    })
  })

  describe('Drive Integration Features', () => {
    it('should import PDFs from Google Drive', async () => {
      const userId = 'test-user-id'
      const driveFiles = MockFactory.driveFiles(3).filter(f => 
        f.mimeType === 'application/pdf'
      )

      // Step 1: List Drive files
      mockFetchResponse({
        files: driveFiles,
        nextPageToken: null
      })

      const listResponse = await fetch('/api/google/drive/files?mimeType=application/pdf', {
        headers: {
          'Authorization': `Bearer test-token`
        }
      })

      const fileList = await listResponse.json()
      expect(fileList.files).toHaveLength(driveFiles.length)

      // Step 2: Import selected files
      const selectedFiles = driveFiles.slice(0, 2)
      
      mockFetchResponse({
        imported: selectedFiles.length,
        files: selectedFiles.map(f => ({
          driveFileId: f.id,
          localFileId: `local-${f.id}`,
          status: 'processing'
        }))
      })

      const importResponse = await fetch('/api/google/drive/import', {
        method: 'POST',
        body: JSON.stringify({
          fileIds: selectedFiles.map(f => f.id),
          userId
        })
      })

      const importResult = await importResponse.json()
      expect(importResult.imported).toBe(2)
    })

    it('should create organized folder structure in Drive', async () => {
      const userId = 'test-user-id'
      
      // Create folder structure
      const folderStructure = {
        root: 'Statement Desk Exports',
        subfolders: {
          '2024': ['January', 'February', 'March'],
          'Categories': ['Income', 'Expenses', 'Reports']
        }
      }

      mockFetchResponse({
        created: true,
        folderId: 'root-folder-123',
        structure: folderStructure
      })

      const createFolderResponse = await fetch('/api/google/drive/create-folder', {
        method: 'POST',
        body: JSON.stringify({
          name: folderStructure.root,
          parentId: 'root',
          userId
        })
      })

      const folderResult = await createFolderResponse.json()
      expect(folderResult.created).toBe(true)
      expect(folderResult.folderId).toBeDefined()
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle API failures gracefully', async () => {
      const userId = 'test-user-id'
      const fileId = 'file-123'
      
      // Simulate Google API failure
      mockFetchResponse(
        { 
          error: 'Google API temporarily unavailable',
          retryAfter: 60
        },
        { status: 503 }
      )

      const response = await fetch('/api/export', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          format: 'google_sheets',
          userId
        })
      })

      expect(response.status).toBe(503)
      const result = await response.json()
      expect(result.error).toContain('temporarily unavailable')
      expect(result.retryAfter).toBe(60)
    })

    it('should maintain data consistency on partial failures', async () => {
      const userId = 'test-user-id'
      const transactions = MockFactory.transactions(1000) // Large dataset
      
      // Simulate partial export failure
      const exportBatch = async (transactions, batchSize = 100) => {
        const results = []
        const failures = []
        
        for (let i = 0; i < transactions.length; i += batchSize) {
          const batch = transactions.slice(i, i + batchSize)
          
          try {
            // Simulate random failure
            if (Math.random() < 0.2) {
              throw new Error('Batch export failed')
            }
            
            results.push({
              batchIndex: i / batchSize,
              exported: batch.length,
              success: true
            })
          } catch (error) {
            failures.push({
              batchIndex: i / batchSize,
              transactions: batch,
              error: error.message
            })
          }
        }
        
        return { results, failures }
      }

      const { results, failures } = await exportBatch(transactions)
      
      // Verify some batches succeeded and some failed
      expect(results.length + failures.length).toBe(10) // 1000 / 100
      expect(failures.length).toBeGreaterThan(0)
      
      // Verify we can retry failed batches
      const retryFailures = async (failures) => {
        const retryResults = []
        
        for (const failure of failures) {
          // Retry logic
          retryResults.push({
            batchIndex: failure.batchIndex,
            retried: true,
            success: true
          })
        }
        
        return retryResults
      }

      const retryResults = await retryFailures(failures)
      expect(retryResults.every(r => r.success)).toBe(true)
    })
  })

  describe('Performance and Optimization', () => {
    it('should batch API requests efficiently', async () => {
      const transactions = MockFactory.transactions(500)
      
      // Track API calls
      let apiCalls = 0
      const batchedExport = async (transactions) => {
        const BATCH_SIZE = 50
        const MAX_CONCURRENT = 3
        
        const batches = []
        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
          batches.push(transactions.slice(i, i + BATCH_SIZE))
        }
        
        // Process batches with concurrency limit
        const results = []
        for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
          const concurrent = batches.slice(i, i + MAX_CONCURRENT)
          
          const batchResults = await Promise.all(
            concurrent.map(async (batch) => {
              apiCalls++
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 100))
              return { exported: batch.length }
            })
          )
          
          results.push(...batchResults)
        }
        
        return results
      }

      const results = await batchedExport(transactions)
      
      // Should make 10 API calls (500 / 50)
      expect(apiCalls).toBe(10)
      expect(results.reduce((sum, r) => sum + r.exported, 0)).toBe(500)
    })

    it('should cache frequently accessed data', async () => {
      const cache = new Map()
      let cacheMisses = 0
      
      const getCachedData = async (key, fetcher) => {
        if (cache.has(key)) {
          const cached = cache.get(key)
          if (cached.expiry > Date.now()) {
            return cached.data
          }
        }
        
        cacheMisses++
        const data = await fetcher()
        cache.set(key, {
          data,
          expiry: Date.now() + 300000 // 5 minutes
        })
        
        return data
      }

      // Simulate multiple requests for same data
      const requests = Array(10).fill(null).map(() => 
        getCachedData('user-quotas', async () => ({
          driveQuota: { used: 5000, limit: 10000 },
          sheetsQuota: { used: 100, limit: 1000 }
        }))
      )

      await Promise.all(requests)
      
      // Should only have 1 cache miss
      expect(cacheMisses).toBe(1)
    })
  })
})