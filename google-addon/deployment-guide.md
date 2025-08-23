# Statement Desk Google Drive Add-on Deployment Guide

This guide provides step-by-step instructions for deploying the Statement Desk Google Drive Add-on.

## Pre-deployment Checklist

- [ ] Google Cloud Project created
- [ ] Apps Script API enabled in GCP
- [ ] Statement Desk API key obtained
- [ ] OAuth redirect URLs configured in Statement Desk
- [ ] Add-on icons/logos uploaded (if custom)

## Step 1: Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Rename project to "Statement Desk Drive Add-on"

## Step 2: Add Source Files

1. In the Apps Script editor, delete the default `Code.gs` file
2. Create new files for each source file:
   - Click "+" next to Files
   - Select "Script" 
   - Name it appropriately (Code, AuthHandler, BatchProcessor)
3. Copy contents from:
   - `google-addon/src/Code.js` → `Code.gs`
   - `google-addon/src/AuthHandler.js` → `AuthHandler.gs`
   - `google-addon/src/BatchProcessor.js` → `BatchProcessor.gs`

## Step 3: Add Manifest

1. In Apps Script editor, click Project Settings (gear icon)
2. Check "Show 'appsscript.json' manifest file in editor"
3. Open `appsscript.json` in the editor
4. Replace contents with `google-addon/appsscript.json`

## Step 4: Configure Script Properties

1. Go to Project Settings > Script Properties
2. Add the following properties:
   ```
   STATEMENT_DESK_API_KEY = your-api-key-here
   ```

## Step 5: Test Deployment

1. Click "Deploy" > "Test deployments"
2. Under "Configuration", ensure:
   - Execute as: Me
   - Access: Only myself
3. Click "Install"
4. Open Google Drive
5. Select a PDF file
6. Check if Statement Desk appears in the sidebar

## Step 6: Configure OAuth in Statement Desk

1. In your Statement Desk admin panel, add OAuth redirect URL:
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
   ```
   (Replace {SCRIPT_ID} with your Apps Script project ID)

2. Set allowed origins:
   ```
   https://script.google.com
   https://drive.google.com
   ```

## Step 7: Production Deployment

### For Personal/Team Use:

1. Click "Deploy" > "New deployment"
2. Configuration:
   - Type: Add-on
   - Description: "Statement Desk - AI-powered bank statement processor"
   - Version: New version
   - Execute as: User accessing the add-on
   - Access: Anyone (or specific domain)
3. Click "Deploy"
4. Copy the Deployment ID

### For Google Workspace Marketplace:

1. **Prepare Store Listing:**
   - App name: Statement Desk
   - Short description: Process bank statements with AI
   - Detailed description: (from README)
   - Icons: 32x32, 128x128 PNG
   - Screenshots: At least 3

2. **OAuth Configuration:**
   - Configure OAuth consent screen in GCP
   - Add all required scopes
   - Submit for verification if needed

3. **Submit for Review:**
   - Go to Google Workspace Marketplace SDK
   - Create new listing
   - Fill in all required fields
   - Submit for review

## Step 8: Post-Deployment

1. **Monitor Usage:**
   - Check Apps Script dashboard for executions
   - Monitor error rates
   - Review user feedback

2. **Set Up Triggers (Optional):**
   ```javascript
   // Add to Code.gs for cleanup
   function setupTriggers() {
     ScriptApp.newTrigger('cleanupOldBatchRecords')
       .timeBased()
       .everyDays(1)
       .atHour(2)
       .create();
   }
   ```

3. **Configure Logging:**
   - Enable Stackdriver logging
   - Set up error alerts
   - Monitor API quota usage

## Troubleshooting Deployment

### Common Issues:

**"Script not found" error:**
- Ensure all files are saved
- Check manifest syntax
- Verify script properties are set

**OAuth errors:**
- Verify redirect URLs match exactly
- Check API key is valid
- Ensure user has Drive access

**Add-on not showing:**
- Clear browser cache
- Try incognito mode
- Check console for errors

### Debug Mode:

Add to any function for debugging:
```javascript
console.log('Debug info:', {
  user: Session.getActiveUser().getEmail(),
  scriptId: ScriptApp.getScriptId(),
  deploymentId: ScriptApp.getDeploymentId()
});
```

## Version Management

### Updating the Add-on:

1. Make changes in Apps Script editor
2. Save all files
3. Click "Deploy" > "Manage deployments"
4. Click pencil icon on active deployment
5. Version: "New version"
6. Update description
7. Click "Deploy"

### Rollback:

1. Go to "Deploy" > "Manage deployments"
2. Click on deployment
3. Select previous version
4. Click "Deploy"

## Security Best Practices

1. **API Key Security:**
   - Never hardcode API keys in source
   - Use Script Properties (server-side only)
   - Rotate keys regularly

2. **Token Management:**
   - Use UserProperties for OAuth tokens
   - Implement token refresh logic
   - Clear tokens on sign out

3. **Error Handling:**
   - Never expose internal errors to users
   - Log errors server-side only
   - Provide generic user messages

## Monitoring & Analytics

### Built-in Monitoring:

1. Apps Script Dashboard:
   - Execution transcript
   - Error rates
   - Usage statistics

2. Google Cloud Console:
   - API usage
   - Quota consumption
   - Error logs

### Custom Analytics:

```javascript
// Add to track usage
function trackEvent(action, label, value) {
  const payload = {
    action: action,
    label: label,
    value: value,
    user: Session.getActiveUser().getEmail(),
    timestamp: new Date().toISOString()
  };
  
  // Send to your analytics endpoint
  UrlFetchApp.fetch('https://statementdesk.com/api/analytics/addon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CONFIG.API_KEY
    },
    payload: JSON.stringify(payload)
  });
}
```

## Support Resources

- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Add-on Guidelines](https://developers.google.com/workspace/add-ons)
- [OAuth 2.0 for Add-ons](https://developers.google.com/workspace/add-ons/guides/auth)
- Statement Desk API Docs: statementdesk.com/api/docs

## Next Steps

1. Test with real users
2. Gather feedback
3. Iterate on UI/UX
4. Add requested features
5. Submit for broader marketplace listing