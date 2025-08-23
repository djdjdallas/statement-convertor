# Statement Desk Google Workspace Add-on

This directory contains the Google Apps Script code for the Statement Desk Google Workspace Add-on, which allows users to process bank statements directly from Google Drive.

## Files

### Core Files
- **`appsscript.json`** - Add-on manifest file defining permissions, triggers, and UI elements
- **`Code.js`** - Main add-on logic including card UI builders and file processing
- **`SidebarCode.js`** - Functions specific to the sidebar interface
- **`Sidebar.html`** - HTML interface for the sidebar with file selection and processing UI
- **`AuthCallback.js`** - OAuth and authentication handling code

### Documentation
- **`DEPLOYMENT.md`** - Detailed deployment instructions
- **`README.md`** - This file

## Features

### 1. Drive Integration
- Automatically detects when PDF files are selected in Google Drive
- Shows contextual UI based on file selection
- Processes files directly from Drive without downloading

### 2. Authentication
- Secure OAuth-based authentication with Statement Desk
- Token stored securely in Apps Script Properties
- Automatic token refresh

### 3. File Processing
- Converts PDF bank statements to Excel (.xlsx) or CSV format
- AI-enhanced transaction extraction
- Progress tracking during processing
- Results saved back to Google Drive

### 4. User Interface
- Card-based UI for the add-on homepage
- Interactive sidebar for file selection and processing
- Real-time status updates
- Error handling and user feedback

## Architecture

### Authentication Flow
1. User clicks "Connect Statement Desk"
2. OAuth window opens to Statement Desk auth page
3. User signs in (if needed) and authorizes
4. Token is passed back to add-on
5. Token stored securely for future use

### Processing Flow
1. User selects PDF files in Drive
2. Add-on shows selected files
3. User chooses export format
4. Files are sent to Statement Desk API
5. Processed files are saved back to Drive
6. User sees results with links to new files

## Configuration

Update these values before deployment:

### In `Code.js`:
```javascript
const CONFIG = {
  baseUrl: 'https://your-domain.com',  // Your Statement Desk domain
  googleClientId: 'your-client-id',     // From Google Cloud Console
  googleClientSecret: 'your-secret',    // From Google Cloud Console
  // ...
};
```

### In `appsscript.json`:
```json
{
  "addOns": {
    "common": {
      "logoUrl": "https://your-domain.com/logo.png",
      // ...
    }
  }
}
```

## Development

### Local Testing
1. Open [script.google.com](https://script.google.com)
2. Create a new project
3. Copy all files from this directory
4. Update configuration values
5. Deploy as test add-on
6. Install and test in Google Drive

### Debugging
- Use `console.log()` for debugging
- View logs in Apps Script editor (View > Logs)
- Check Stackdriver logs for detailed errors

## API Integration

The add-on communicates with these Statement Desk endpoints:

- `POST /api/google/addon/auth` - Generate auth token
- `GET /api/google/addon/auth` - Verify auth status  
- `POST /api/google/addon/process` - Process PDF file
- `GET /api/google/addon/status/[id]` - Check processing status

## Security

- All API calls use HTTPS
- JWT tokens expire after 30 days
- File size limited to 10MB
- Only PDF files are accepted
- User data isolated by authentication

## Support

For issues or questions:
1. Check the [Deployment Guide](DEPLOYMENT.md)
2. Review Apps Script logs
3. Contact Statement Desk support

## License

This add-on is part of Statement Desk and subject to the same license terms.