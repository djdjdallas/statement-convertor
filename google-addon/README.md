# Statement Desk Google Drive Add-on

This Google Workspace Add-on integrates Statement Desk directly into Google Drive, allowing users to process PDF bank statements without leaving their Drive interface.

## Features

- **In-Context Processing**: Process bank statements directly from Drive
- **AI Enhancement**: Toggle AI-powered extraction for better accuracy
- **Batch Processing**: Process multiple statements at once
- **Real-time Status**: See processing progress and results
- **Export Options**: Choose between Excel (.xlsx) or CSV format
- **Authentication**: Secure OAuth2 integration with Statement Desk

## Installation & Deployment

### Prerequisites

1. Google Cloud Project with Apps Script API enabled
2. Statement Desk API credentials
3. Google Workspace account

### Setup Steps

1. **Create Apps Script Project**
   ```bash
   # Go to https://script.google.com
   # Create a new project
   # Copy all files from google-addon/src/ to the project
   ```

2. **Configure Script Properties**
   - In Apps Script Editor, go to Project Settings > Script Properties
   - Add property: `STATEMENT_DESK_API_KEY` = `your-api-key`

3. **Deploy as Add-on**
   ```
   # In Apps Script Editor:
   1. Click "Deploy" > "Test deployments"
   2. Select "Install add-on" 
   3. Choose your Google account
   4. Grant necessary permissions
   ```

4. **Production Deployment**
   ```
   # For organization-wide deployment:
   1. Click "Deploy" > "New deployment"
   2. Type: "Add-on"
   3. Description: "Statement Desk - Bank Statement Processor"
   4. Execute as: "User accessing the add-on"
   5. Who has access: "Anyone" or specific domain
   ```

## Project Structure

```
google-addon/
├── appsscript.json          # Add-on manifest and configuration
├── src/
│   ├── Code.js             # Main entry point and UI logic
│   ├── AuthHandler.js      # OAuth authentication handling
│   └── BatchProcessor.js   # Batch file processing logic
├── assets/                 # Icons and images (if needed)
└── README.md              # This file
```

## Configuration

### appsscript.json
- Defines add-on metadata and permissions
- Configures Drive integration triggers
- Sets OAuth scopes for API access

### Required Scopes
- `drive.addons.metadata.readonly` - Read file metadata
- `drive.readonly` - Read file contents
- `userinfo.email` - Get user email for authentication
- `script.external_request` - Make API calls to Statement Desk

## API Integration

The add-on communicates with Statement Desk API endpoints:

- `POST /api/upload` - Upload PDF file
- `POST /api/process-pdf` - Process uploaded file
- `POST /api/export` - Export processed data
- `GET /api/auth/verify` - Verify authentication
- `POST /api/auth/token` - Exchange auth code for token
- `POST /api/auth/refresh` - Refresh access token

## User Flow

1. **Initial Setup**
   - User installs add-on from Google Workspace Marketplace
   - Opens Drive and selects a PDF bank statement
   - Add-on sidebar appears

2. **Authentication**
   - User clicks "Connect Account"
   - Redirected to Statement Desk for OAuth consent
   - Returns to Drive with authenticated session

3. **Processing**
   - User selects processing options (AI enhancement, export format)
   - Clicks "Process Statement"
   - Sees real-time progress updates
   - Downloads result or views in dashboard

4. **Batch Processing**
   - Select multiple PDF files
   - Choose "Process All X Files"
   - Receive email notification when complete

## Development

### Local Testing
```bash
# Use clasp for local development
npm install -g @google/clasp
clasp login
clasp create --type addon --title "Statement Desk"
clasp push
```

### Debugging
- Use `console.log()` for logging (visible in Apps Script Editor)
- Test with sample PDF files in Drive
- Check Stackdriver logs for errors

### Error Handling
- All API calls wrapped in try-catch blocks
- User-friendly error messages displayed
- Fallback to traditional processing if AI fails

## Security

- OAuth tokens stored in UserProperties (encrypted)
- API key stored in ScriptProperties (server-side only)
- No sensitive data logged or exposed
- Automatic token refresh before expiry

## Maintenance

### Regular Tasks
- Monitor API usage and rate limits
- Update API endpoints if changed
- Review and update OAuth scopes as needed
- Clean up old batch processing records

### Troubleshooting

**Add-on not appearing in Drive:**
- Check deployment status
- Verify manifest configuration
- Ensure proper OAuth scopes

**Authentication failures:**
- Verify API key is set correctly
- Check OAuth redirect URLs
- Ensure Statement Desk API is accessible

**Processing errors:**
- Check file size limits (10MB)
- Verify PDF mime type
- Review API response errors

## Future Enhancements

- Google Sheets integration for direct export
- Scheduled batch processing
- Advanced filtering options
- Multi-language support
- Offline capability with sync

## Support

For issues or questions:
- Check Statement Desk documentation
- Review Apps Script logs
- Contact support@statementdesk.com