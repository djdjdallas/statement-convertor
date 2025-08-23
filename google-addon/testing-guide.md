# Google Drive Add-on Testing Guide

This guide walks through testing the Statement Desk Google Drive Add-on during development.

## Prerequisites

1. **Environment Variables**
   Add to your `.env.local`:
   ```bash
   GOOGLE_ADDON_API_KEY=your-secret-api-key-here
   ```

2. **Database Setup**
   Run the migration:
   ```bash
   psql -d your_database -f supabase/migrations/20250123_google_addon_auth.sql
   ```

3. **Test User Account**
   Ensure you have a test user in your Statement Desk database

## Local Testing Setup

### 1. Deploy to Apps Script

1. Install clasp:
   ```bash
   npm install -g @google/clasp
   ```

2. Login to clasp:
   ```bash
   clasp login
   ```

3. Create new Apps Script project:
   ```bash
   cd google-addon
   clasp create --type addon --title "Statement Desk Test"
   ```

4. Push files:
   ```bash
   clasp push
   ```

### 2. Configure Script Properties

1. Open Apps Script project:
   ```bash
   clasp open
   ```

2. Go to Project Settings > Script Properties
3. Add property:
   - Key: `STATEMENT_DESK_API_KEY`
   - Value: Same as your `GOOGLE_ADDON_API_KEY` env variable

### 3. Update API URLs for Local Testing

In `google-addon/src/Code.js`, temporarily update:
```javascript
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api', // For local testing
  // API_BASE_URL: 'https://statementdesk.com/api', // Production
  ...
};
```

### 4. Test Deployment

1. In Apps Script Editor, click "Deploy" > "Test deployments"
2. Click "Install"
3. Grant permissions when prompted

## Testing Workflow

### Test 1: Add-on Installation

1. Open Google Drive
2. Select any PDF file
3. Look for Statement Desk icon in right sidebar
4. Click to open add-on

**Expected Result:** Welcome card appears with "Connect Account" button

### Test 2: Authentication Flow

1. Click "Connect Account" in the add-on
2. You should be redirected to: `http://localhost:3000/auth/google-addon?email=your-email&addon=drive`
3. Complete authentication
4. Window should close automatically

**Expected Result:** Add-on shows authenticated state with processing options

### Test 3: Single File Processing

1. Select a PDF bank statement in Drive
2. Open Statement Desk add-on
3. Toggle "AI Enhancement" on
4. Select "Excel (.xlsx)" format
5. Click "Process Statement"

**Expected Result:** 
- Processing notification appears
- Success card shows with transaction summary
- Download and Dashboard links work

### Test 4: Batch Processing

1. Select multiple PDF files in Drive
2. Open Statement Desk add-on
3. Click "Process All X Files"

**Expected Result:**
- Batch processing card appears
- Email notification sent when complete

### Test 5: Error Handling

Test various error scenarios:

1. **Large File (>10MB)**
   - Select large PDF
   - Try to process
   - Should show "File size exceeds 10MB limit"

2. **Non-PDF File**
   - Select non-PDF file
   - Add-on should show "No PDF Files Selected"

3. **Expired Token**
   - Wait for token to expire (or manually expire in DB)
   - Try to process file
   - Should prompt to reconnect account

4. **Network Error**
   - Disconnect internet
   - Try to process
   - Should show appropriate error message

## API Testing with curl

Test individual API endpoints:

### 1. Generate Auth Code
```bash
curl -X POST http://localhost:3000/api/auth/google-addon \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","addon":"drive"}'
```

### 2. Exchange Code for Token
```bash
curl -X PUT http://localhost:3000/api/auth/google-addon \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{"code":"auth-code-here","grantType":"authorization_code","clientId":"google-addon-drive"}'
```

### 3. Verify Token
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer access-token-here" \
  -H "X-API-Key: your-secret-api-key-here"
```

### 4. Get User Info
```bash
curl -X GET http://localhost:3000/api/auth/user \
  -H "Authorization: Bearer access-token-here" \
  -H "X-API-Key: your-secret-api-key-here"
```

## Debugging Tips

### 1. View Apps Script Logs

In Apps Script Editor:
- View > Logs
- Or use: `console.log()` in code

### 2. Check Network Requests

In Chrome DevTools while testing:
- Network tab shows all API calls
- Check request/response details

### 3. Database Verification

Check auth tokens:
```sql
-- View auth codes
SELECT * FROM addon_auth_codes ORDER BY created_at DESC;

-- View tokens
SELECT * FROM addon_tokens ORDER BY created_at DESC;

-- Check user's tokens
SELECT * FROM addon_tokens 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
```

### 4. Common Issues

**Add-on not appearing:**
- Clear browser cache
- Re-install add-on
- Check deployment status

**Authentication fails:**
- Verify API key matches
- Check user exists in database
- Ensure URLs are correct (localhost vs production)

**Processing fails:**
- Check file upload endpoint
- Verify PDF parsing works
- Check API response format

## Performance Testing

### Load Testing
1. Create script to process multiple files:
```javascript
function testBatchProcessing() {
  const fileIds = ['id1', 'id2', 'id3']; // Add real file IDs
  processBatch(fileIds);
}
```

2. Monitor:
- API response times
- Memory usage in Apps Script
- Rate limiting behavior

### Stress Testing
- Process 10+ files simultaneously
- Test with various file sizes
- Monitor for timeouts or failures

## Production Readiness Checklist

Before deploying to production:

- [ ] Update all API URLs to production endpoints
- [ ] Verify API key is set correctly
- [ ] Test with real bank statement PDFs
- [ ] Confirm email notifications work
- [ ] Test token refresh flow
- [ ] Verify error messages are user-friendly
- [ ] Check all external links work
- [ ] Test on different Google Workspace accounts
- [ ] Ensure proper cleanup of expired tokens
- [ ] Monitor API rate limits

## Automated Testing

Create test suite in Apps Script:
```javascript
function runAllTests() {
  testAuthentication();
  testSingleFileProcessing();
  testBatchProcessing();
  testErrorHandling();
  console.log('All tests completed');
}

function testAuthentication() {
  // Test auth flow
  const isAuth = checkAuthentication();
  console.log('Auth test:', isAuth ? 'PASS' : 'FAIL');
}

// Add more test functions...
```

Run tests:
```bash
clasp run runAllTests
```

## Support & Troubleshooting

For additional help:
1. Check Apps Script documentation
2. Review Statement Desk API docs
3. Check GitHub issues
4. Contact development team