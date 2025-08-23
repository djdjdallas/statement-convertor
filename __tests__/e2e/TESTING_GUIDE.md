# End-to-End Testing Guide for Google Workspace Integration

## Overview

This guide provides comprehensive instructions for testing the Google Workspace integration in Statement Desk. It covers manual testing procedures, automated E2E tests, and validation scenarios.

## Prerequisites

### Test Environment Setup

1. **Google Cloud Console Access**
   - Test project with OAuth 2.0 credentials
   - Google Drive API enabled
   - Google Sheets API enabled
   - Test domain for workspace testing (optional)

2. **Test Accounts**
   ```
   - Personal Google Account: test.user@gmail.com
   - Workspace Admin Account: admin@testdomain.com
   - Workspace User Account: user@testdomain.com
   - Limited Permissions Account: limited@gmail.com
   ```

3. **Test Data**
   - Sample PDF bank statements (various formats)
   - Large PDF files (>25MB) for size limit testing
   - Corrupted PDF files for error testing
   - Multi-page statements for pagination testing

### Environment Variables

Create a `.env.test` file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=test-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=test-client-secret
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

## Manual Testing Procedures

### 1. OAuth Flow Testing

#### Individual User Authentication
1. Navigate to `/dashboard`
2. Click "Connect Google Account"
3. Verify redirect to Google OAuth consent screen
4. Check requested permissions:
   - Google Drive (Files created by this app)
   - Google Sheets
5. Complete authentication
6. Verify redirect back to app with success message
7. Check token storage in database

#### Workspace Domain-Wide Installation
1. Login as workspace admin
2. Navigate to `/settings`
3. Click "Install for Entire Domain"
4. Verify additional admin consent screen
5. Check for domain verification
6. Complete installation
7. Verify workspace configuration saved

#### Error Scenarios
- Test with invalid credentials
- Cancel OAuth flow mid-process
- Test with insufficient permissions
- Test with revoked tokens

### 2. File Processing Testing

#### Standard PDF Upload
1. Upload a standard bank statement PDF
2. Monitor processing status
3. Verify transaction extraction accuracy
4. Check AI categorization results
5. Validate confidence scores

#### Batch Processing
1. Select multiple PDFs
2. Initiate batch processing
3. Monitor individual file progress
4. Verify parallel processing
5. Check error handling for failed files

#### Edge Cases
- Upload non-PDF files (should reject)
- Upload password-protected PDFs
- Upload scanned PDFs (no text)
- Upload corrupted files
- Test file size limits

### 3. Google Drive Integration

#### File Import from Drive
1. Click "Import from Drive"
2. Verify Drive file picker loads
3. Filter by PDF files
4. Select multiple files
5. Confirm import
6. Monitor import progress

#### Export to Drive
1. Process a PDF statement
2. Click "Export to Drive"
3. Choose folder location
4. Verify file creation
5. Check file permissions
6. Validate file content

#### Folder Organization
1. Enable auto-organization
2. Process statements from different months
3. Verify folder structure creation:
   ```
   Statement Desk/
   ├── 2024/
   │   ├── January/
   │   ├── February/
   │   └── March/
   └── Reports/
   ```

### 4. Google Sheets Export

#### Basic Export
1. Select processed transactions
2. Choose "Export to Google Sheets"
3. Verify spreadsheet creation
4. Check data formatting:
   - Headers
   - Date formats
   - Currency formatting
   - Category columns
5. Validate formulas and totals

#### Advanced Features
1. Test custom templates
2. Verify multi-sheet exports
3. Test large dataset exports (>10k rows)
4. Check cell formatting preservation
5. Test formula insertion

### 5. Rate Limiting and Quotas

#### API Rate Limits
1. Perform rapid successive exports
2. Verify rate limit detection
3. Check retry mechanism
4. Monitor quota usage display
5. Test quota reset at midnight UTC

#### User Quotas
1. Test free tier limits (5 conversions)
2. Verify upgrade prompts
3. Test pro tier limits
4. Check quota enforcement

### 6. Token Management

#### Token Refresh
1. Wait for token near expiry
2. Perform an operation
3. Verify automatic refresh
4. Check no user interruption

#### Token Revocation
1. Disconnect Google account
2. Verify token revocation
3. Check data cleanup
4. Test re-authentication

### 7. Security Testing

#### Permission Scopes
1. Verify minimal scope requests
2. Test with reduced permissions
3. Check scope validation
4. Test permission escalation prevention

#### Data Privacy
1. Verify encrypted token storage
2. Check secure API communication
3. Test data isolation between users
4. Validate audit logging

## Automated E2E Test Scenarios

### Setup E2E Tests

```bash
# Install E2E testing dependencies
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e
```

### Core E2E Test Suite

```javascript
// __tests__/e2e/google-workspace.spec.js
import { test, expect } from '@playwright/test'

test.describe('Google Workspace Integration', () => {
  test('complete flow from upload to sheets export', async ({ page }) => {
    // Login
    await page.goto('/auth/signin')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    
    // Navigate to upload
    await page.goto('/upload')
    
    // Upload file
    const fileInput = await page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-data/sample-statement.pdf')
    
    // Wait for processing
    await expect(page.locator('[data-testid="processing-status"]'))
      .toContainText('Processing complete')
    
    // Export to Sheets
    await page.click('[data-testid="export-button"]')
    await page.click('[data-testid="export-sheets"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Exported to Google Sheets')
  })
})
```

## Performance Testing

### Load Testing Scenarios

1. **Concurrent User Test**
   - 100 simultaneous PDF uploads
   - Monitor response times
   - Check resource usage
   - Verify queue management

2. **Large File Processing**
   - Upload 50MB PDF
   - Monitor memory usage
   - Check timeout handling
   - Verify chunked processing

3. **API Rate Limit Stress**
   - Simulate 1000 requests/minute
   - Verify rate limiting kicks in
   - Check backoff implementation
   - Monitor queue behavior

### Performance Benchmarks

| Operation | Expected Time | Max Time |
|-----------|--------------|----------|
| OAuth Flow | < 3s | 5s |
| PDF Upload (5MB) | < 5s | 10s |
| Processing (100 transactions) | < 10s | 20s |
| Sheets Export | < 3s | 5s |
| Token Refresh | < 1s | 2s |

## Troubleshooting Common Issues

### OAuth Issues
- **"Access Blocked" Error**: Check OAuth consent screen configuration
- **Missing Scopes**: Verify all required APIs are enabled
- **Domain Verification Failed**: Check DNS TXT records

### Processing Issues
- **Extraction Failed**: Check PDF format compatibility
- **AI Timeout**: Verify Claude API key and limits
- **Memory Errors**: Check file size and server resources

### Export Issues
- **Sheets API Error**: Verify quota availability
- **Permission Denied**: Check token scopes
- **Format Issues**: Validate data types and encoding

## Test Data Management

### Creating Test PDFs
```bash
# Generate test PDFs with known data
node scripts/generate-test-pdfs.js

# Output:
# test-data/
# ├── standard-bank.pdf
# ├── complex-format.pdf
# ├── multi-page.pdf
# ├── corrupted.pdf
# └── large-file.pdf
```

### Seeding Test Database
```sql
-- Insert test user with Google tokens
INSERT INTO auth.users (id, email) 
VALUES ('test-user-id', 'test@example.com');

INSERT INTO google_oauth_tokens (user_id, access_token, refresh_token)
VALUES ('test-user-id', 'encrypted-token', 'encrypted-refresh');

-- Insert test files and transactions
INSERT INTO files (id, user_id, filename, status)
VALUES ('test-file-id', 'test-user-id', 'test.pdf', 'completed');
```

## Monitoring and Validation

### Key Metrics to Monitor

1. **Success Rates**
   - OAuth completion rate
   - PDF processing success rate
   - Export success rate

2. **Performance Metrics**
   - Average processing time
   - API response times
   - Queue processing speed

3. **Error Rates**
   - Failed authentications
   - Processing errors
   - Export failures

### Validation Checklist

- [ ] OAuth flow completes successfully
- [ ] Tokens are properly encrypted and stored
- [ ] PDF processing extracts all transactions
- [ ] AI categorization provides high confidence
- [ ] Drive integration maintains proper permissions
- [ ] Sheets export preserves data integrity
- [ ] Rate limiting prevents API abuse
- [ ] Token refresh works seamlessly
- [ ] Error messages are user-friendly
- [ ] Audit logs capture all operations

## Regression Testing

### Critical Paths to Test

1. **New User Journey**
   - Sign up → OAuth → Upload → Export

2. **Returning User Flow**
   - Login → Token Refresh → Batch Process → Export

3. **Workspace Admin Flow**
   - Domain Install → User Management → Analytics

4. **Error Recovery Flow**
   - Failed Export → Retry → Success

### Version Compatibility

Test against:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest version)
- Edge (latest version)

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          GOOGLE_CLIENT_ID: ${{ secrets.TEST_GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.TEST_GOOGLE_CLIENT_SECRET }}
```

## Reporting Issues

When reporting issues, include:

1. **Environment Details**
   - Browser and version
   - Operating system
   - User type (individual/workspace)

2. **Steps to Reproduce**
   - Exact sequence of actions
   - Test data used
   - Expected vs actual behavior

3. **Error Information**
   - Console errors
   - Network requests/responses
   - Screenshots

4. **Logs**
   - Application logs
   - API error responses
   - Audit log entries