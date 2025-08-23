# Google Workspace Add-on Deployment Guide

## Overview
This guide will help you deploy the Statement Desk Google Workspace Add-on that allows users to process bank statements directly from Google Drive.

## Prerequisites
1. A Google Cloud Platform (GCP) project
2. Google Workspace account (for testing)
3. Statement Desk deployment with API endpoints
4. Environment variables configured

## Step 1: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Apps Script API

## Step 2: Configure OAuth 2.0

1. In GCP Console, go to "APIs & Services" > "Credentials"
2. Create a new OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Statement Desk Add-on
   - Authorized redirect URIs:
     - `https://your-domain.com/auth/google-addon`
     - `https://script.google.com/macros/d/{SCRIPT_ID}/usercallback`
3. Save the Client ID and Client Secret

## Step 3: Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy all files from the `google-addon` directory:
   - `Code.js`
   - `SidebarCode.js`
   - `AuthCallback.js`
   - `Sidebar.html`
   - `appsscript.json`

## Step 4: Configure the Add-on

1. Update `CONFIG` object in `Code.js`:
   ```javascript
   const CONFIG = {
     baseUrl: 'https://your-actual-domain.com',
     googleClientId: 'your-client-id',
     googleClientSecret: 'your-client-secret',
     // ... other settings
   };
   ```

2. Update logo URLs in:
   - `appsscript.json` (line 11)
   - `Code.js` (buildHomepage function)
   - `Sidebar.html`

## Step 5: Update Statement Desk Backend

1. Add environment variables:
   ```env
   ADDON_JWT_SECRET=your-secure-jwt-secret
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

2. Create database table for add-on tokens:
   ```sql
   CREATE TABLE addon_tokens (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     token TEXT NOT NULL,
     temporary_token TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     expires_at TIMESTAMPTZ NOT NULL,
     UNIQUE(user_id)
   );
   
   CREATE INDEX idx_addon_tokens_user_id ON addon_tokens(user_id);
   CREATE INDEX idx_addon_tokens_expires_at ON addon_tokens(expires_at);
   ```

## Step 6: Deploy the Add-on

1. In Apps Script editor, click "Deploy" > "New Deployment"
2. Choose deployment type: "Add-on"
3. Fill in the details:
   - Description: Statement Desk - Bank Statement Converter
   - Version: 1
4. Click "Deploy"
5. Copy the Deployment ID

## Step 7: Test the Add-on

### Install for Testing
1. In Apps Script editor, click "Deploy" > "Test deployments"
2. Click "Install" to install the add-on to your account
3. Go to Google Drive
4. You should see "Statement Desk" in the right sidebar

### Test Workflow
1. Click on the Statement Desk add-on icon
2. Click "Connect Statement Desk"
3. Complete authentication flow
4. Select PDF bank statements
5. Choose export format (Excel/CSV)
6. Process files
7. Check that converted files appear in Drive

## Step 8: Publish to Google Workspace Marketplace (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "Google Workspace Marketplace SDK"
3. Configure your app listing:
   - App name: Statement Desk
   - App description: Convert bank statements to Excel/CSV
   - Icons and screenshots
   - OAuth scopes
   - Terms of service and privacy policy URLs

4. Submit for review

## Troubleshooting

### Common Issues

1. **Authentication fails**
   - Check OAuth client ID and secret
   - Verify redirect URIs are correct
   - Ensure user has a Statement Desk account

2. **File processing fails**
   - Check API endpoints are accessible
   - Verify JWT secret matches
   - Check file size limits (10MB)

3. **Add-on doesn't appear**
   - Refresh Google Drive
   - Check deployment status
   - Verify OAuth scopes in manifest

### Debug Mode

Enable debug logging in Apps Script:
1. View > Logs
2. Add console.log statements
3. Check Stackdriver logs for errors

## Security Considerations

1. **Token Storage**: Tokens are stored in Apps Script Properties Service (user-specific)
2. **JWT Expiration**: Tokens expire after 30 days
3. **HTTPS Only**: All API calls use HTTPS
4. **Input Validation**: File size and type validation
5. **Rate Limiting**: Implement rate limiting on API endpoints

## API Endpoints Required

Ensure these endpoints are available on your Statement Desk deployment:

- `POST /api/google/addon/auth` - Authentication
- `GET /api/google/addon/auth` - Verify authentication
- `POST /api/google/addon/process` - Process PDF files
- `GET /api/google/addon/status/[processId]` - Check processing status

## Maintenance

### Regular Tasks
1. Monitor API usage and errors
2. Update OAuth tokens before expiry
3. Review and update file size limits
4. Check for Apps Script API changes

### Updating the Add-on
1. Make changes in Apps Script editor
2. Create a new deployment version
3. Test thoroughly
4. Update production deployment

## Support Integration

Add support documentation:
1. Create help page at `/support/google-addon`
2. Add FAQs for common issues
3. Include contact information
4. Link from add-on help menu

## Monitoring

Set up monitoring for:
1. API endpoint availability
2. Processing success rate
3. Authentication failures
4. File processing times
5. Error rates by type

## Next Steps

1. Set up error tracking (e.g., Sentry)
2. Add analytics to track usage
3. Implement batch processing for multiple files
4. Add progress notifications
5. Create video tutorial for users