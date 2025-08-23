import { test, expect } from '@playwright/test'
import { googleTestUtils } from '../utils/google-test-utils'

// Test configuration
test.use({
  // Set base URL for tests
  baseURL: process.env.TEST_URL || 'http://localhost:3000',
  
  // Screenshot on failure
  screenshot: 'only-on-failure',
  
  // Video recording
  video: 'retain-on-failure',
  
  // Viewport size
  viewport: { width: 1280, height: 720 }
})

test.describe('Google Workspace Complete E2E Flow', () => {
  let testUser
  let testFile

  test.beforeAll(async () => {
    // Setup test data
    testUser = {
      email: 'test@example.com',
      password: 'testpassword123'
    }
    
    // Create test PDF content
    testFile = {
      name: 'test-statement.pdf',
      content: googleTestUtils.createTestPDFContent({
        bankName: 'E2E Test Bank',
        transactions: googleTestUtils.generateTestTransactions(20)
      })
    }
  })

  test.afterAll(async () => {
    // Cleanup test data
    googleTestUtils.cleanup()
  })

  test('Complete flow: Sign in → OAuth → Upload → Process → Export', async ({ page }) => {
    // Step 1: Sign in
    await test.step('User signs in', async () => {
      await page.goto('/auth/signin')
      await page.fill('input[name="email"]', testUser.email)
      await page.fill('input[name="password"]', testUser.password)
      await page.click('button[type="submit"]')
      
      // Wait for redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
    })

    // Step 2: Connect Google Account
    await test.step('Connect Google Account', async () => {
      // Click connect button
      await page.click('[data-testid="connect-google"]')
      
      // Mock OAuth flow (in real test, would handle Google OAuth)
      await page.waitForURL(/\/auth\/google/)
      
      // Simulate successful OAuth callback
      await page.goto(`/auth/callback?code=test-code&state=test-state`)
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]'))
        .toContainText('Google account connected successfully')
    })

    // Step 3: Upload PDF
    await test.step('Upload bank statement PDF', async () => {
      await page.goto('/upload')
      
      // Upload file
      const fileInput = await page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: testFile.name,
        mimeType: 'application/pdf',
        buffer: Buffer.from(testFile.content)
      })
      
      // Wait for upload to complete
      await expect(page.locator('[data-testid="upload-status"]'))
        .toContainText('Upload complete')
    })

    // Step 4: Process PDF
    await test.step('Process PDF with AI', async () => {
      // Click process button
      await page.click('[data-testid="process-button"]')
      
      // Monitor processing progress
      await expect(page.locator('[data-testid="processing-status"]'))
        .toContainText('Processing', { timeout: 5000 })
      
      // Wait for completion
      await expect(page.locator('[data-testid="processing-status"]'))
        .toContainText('Processing complete', { timeout: 30000 })
      
      // Verify transaction count
      const transactionCount = await page.locator('[data-testid="transaction-count"]').textContent()
      expect(parseInt(transactionCount)).toBe(20)
    })

    // Step 5: Review and categorize
    await test.step('Review AI categorization', async () => {
      // Check AI confidence scores
      const confidenceScores = await page.locator('[data-testid="confidence-score"]').all()
      
      for (const score of confidenceScores) {
        const value = await score.textContent()
        expect(parseInt(value)).toBeGreaterThan(70)
      }
      
      // Verify categories assigned
      const categories = await page.locator('[data-testid="transaction-category"]').all()
      expect(categories.length).toBe(20)
    })

    // Step 6: Export to Google Sheets
    await test.step('Export to Google Sheets', async () => {
      // Open export dialog
      await page.click('[data-testid="export-button"]')
      
      // Select Google Sheets format
      await page.click('[data-testid="export-format-sheets"]')
      
      // Configure export options
      await page.fill('input[name="spreadsheet-name"]', 'E2E Test Export')
      await page.check('input[name="include-categories"]')
      await page.check('input[name="include-ai-insights"]')
      
      // Start export
      await page.click('[data-testid="confirm-export"]')
      
      // Wait for export completion
      await expect(page.locator('[data-testid="export-status"]'))
        .toContainText('Export successful', { timeout: 10000 })
      
      // Verify spreadsheet link
      const spreadsheetLink = await page.locator('[data-testid="spreadsheet-link"]')
      await expect(spreadsheetLink).toHaveAttribute('href', /docs\.google\.com\/spreadsheets/)
    })

    // Step 7: Verify in Google Drive
    await test.step('Verify file in Google Drive', async () => {
      // Open Drive integration
      await page.goto('/dashboard')
      await page.click('[data-testid="google-drive-files"]')
      
      // Search for exported file
      await page.fill('input[name="search"]', 'E2E Test Export')
      
      // Verify file appears
      await expect(page.locator('[data-testid="drive-file-item"]'))
        .toContainText('E2E Test Export')
    })
  })

  test('Workspace admin flow', async ({ page }) => {
    // Login as workspace admin
    await test.step('Admin login', async () => {
      await page.goto('/auth/signin')
      await page.fill('input[name="email"]', 'admin@testdomain.com')
      await page.fill('input[name="password"]', 'adminpassword')
      await page.click('button[type="submit"]')
    })

    // Navigate to workspace settings
    await test.step('Configure workspace', async () => {
      await page.goto('/settings/workspace')
      
      // Verify admin controls visible
      await expect(page.locator('[data-testid="workspace-admin-panel"]')).toBeVisible()
      
      // Configure domain-wide settings
      await page.click('[data-testid="enable-domain-wide"]')
      await page.selectOption('select[name="default-export-format"]', 'google_sheets')
      await page.fill('input[name="shared-drive-folder"]', 'Company Statements')
      
      // Save settings
      await page.click('[data-testid="save-workspace-settings"]')
      await expect(page.locator('[data-testid="success-message"]'))
        .toContainText('Workspace settings saved')
    })

    // View workspace analytics
    await test.step('View analytics', async () => {
      await page.click('[data-testid="workspace-analytics"]')
      
      // Verify analytics dashboard loads
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible()
      await expect(page.locator('[data-testid="total-conversions"]')).toBeVisible()
      await expect(page.locator('[data-testid="storage-used"]')).toBeVisible()
    })
  })

  test('Error handling and recovery', async ({ page }) => {
    // Test token expiration handling
    await test.step('Handle expired token', async () => {
      // Simulate expired token scenario
      await page.goto('/dashboard')
      
      // Trigger an operation that requires valid token
      await page.click('[data-testid="export-button"]')
      
      // Should automatically refresh token (no user interaction)
      await expect(page.locator('[data-testid="token-refresh-indicator"]'))
        .toBeVisible({ timeout: 5000 })
      
      // Operation should continue after refresh
      await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible()
    })

    // Test rate limit handling
    await test.step('Handle rate limiting', async () => {
      // Trigger multiple rapid exports
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="quick-export"]')
      }
      
      // Should show rate limit message
      await expect(page.locator('[data-testid="rate-limit-message"]'))
        .toContainText('Please wait before making another request')
      
      // Verify retry timer
      await expect(page.locator('[data-testid="retry-timer"]')).toBeVisible()
    })

    // Test network error recovery
    await test.step('Recover from network errors', async () => {
      // Simulate offline mode
      await page.context().setOffline(true)
      
      // Try to export
      await page.click('[data-testid="export-button"]')
      
      // Should show offline message
      await expect(page.locator('[data-testid="offline-message"]'))
        .toContainText('No internet connection')
      
      // Go back online
      await page.context().setOffline(false)
      
      // Retry should work
      await page.click('[data-testid="retry-button"]')
      await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible()
    })
  })

  test('Performance and large data handling', async ({ page }) => {
    // Test large file upload
    await test.step('Upload large PDF', async () => {
      await page.goto('/upload')
      
      // Create large test file (10MB)
      const largeFile = {
        name: 'large-statement.pdf',
        content: googleTestUtils.createTestPDFContent({
          transactions: googleTestUtils.generateTestTransactions(1000)
        })
      }
      
      // Upload and monitor progress
      const fileInput = await page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: largeFile.name,
        mimeType: 'application/pdf',
        buffer: Buffer.from(largeFile.content)
      })
      
      // Verify progress bar
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
      
      // Wait for completion
      await expect(page.locator('[data-testid="upload-status"]'))
        .toContainText('Upload complete', { timeout: 60000 })
    })

    // Test batch processing
    await test.step('Batch process multiple files', async () => {
      // Select multiple files
      await page.goto('/dashboard')
      await page.check('[data-testid="select-file-1"]')
      await page.check('[data-testid="select-file-2"]')
      await page.check('[data-testid="select-file-3"]')
      
      // Start batch processing
      await page.click('[data-testid="batch-process"]')
      
      // Monitor batch progress
      await expect(page.locator('[data-testid="batch-progress"]'))
        .toContainText('Processing 3 files')
      
      // Verify individual file progress
      for (let i = 1; i <= 3; i++) {
        await expect(page.locator(`[data-testid="file-${i}-status"]`))
          .toContainText('Complete', { timeout: 30000 })
      }
    })
  })

  test('Accessibility and keyboard navigation', async ({ page }) => {
    await test.step('Navigate with keyboard', async () => {
      await page.goto('/dashboard')
      
      // Tab through interface
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="upload-button"]')).toBeFocused()
      
      // Activate with Enter
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL('/upload')
      
      // Escape to close dialogs
      await page.click('[data-testid="export-button"]')
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-testid="export-dialog"]')).not.toBeVisible()
    })

    // Test screen reader compatibility
    await test.step('Screen reader labels', async () => {
      // Verify ARIA labels
      const uploadButton = await page.locator('[data-testid="upload-button"]')
      await expect(uploadButton).toHaveAttribute('aria-label', 'Upload new bank statement')
      
      // Verify role attributes
      const progressBar = await page.locator('[data-testid="processing-progress"]')
      await expect(progressBar).toHaveAttribute('role', 'progressbar')
    })
  })
})

// Helper function to create test files
async function createTestFile(name, size = 1024) {
  const content = Buffer.alloc(size)
  content.fill('PDF test content')
  
  return {
    name,
    mimeType: 'application/pdf',
    buffer: content
  }
}