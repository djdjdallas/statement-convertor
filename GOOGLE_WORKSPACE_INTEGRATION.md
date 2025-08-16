# Google Workspace Marketplace Integration Plan

## Overview
This document outlines the implementation plan for adding Google Workspace integration to enable marketplace listing and provide seamless user experience with Google services.

---

## Phase 1: Core Google OAuth Setup

### 1.1 Dependencies Installation
- Install `googleapis` package for Google APIs
- Install `google-auth-library` for OAuth handling
- Add environment variables for Google credentials

### 1.2 Google Cloud Console Setup
- Create Google Cloud Project (if not exists)
- Enable Google Drive API and Google OAuth2 API
- Create OAuth 2.0 credentials (Client ID + Secret)
- Configure authorized redirect URIs
- Set up OAuth consent screen

### 1.3 OAuth Implementation
**New API Routes:**
- `/api/auth/google` - Initiate OAuth flow
- `/api/auth/google/callback` - Handle OAuth callback
- `/api/auth/google/link` - Link Google account to existing user
- `/api/auth/google/unlink` - Unlink Google account

**OAuth Scopes Required:**
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile` 
- `https://www.googleapis.com/auth/drive.file`

### 1.4 Database Schema Updates
**New Supabase table: `google_integrations`**
```sql
CREATE TABLE google_integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT NOT NULL, -- encrypted
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 Google Service Layer
**New file: `/src/lib/google/auth-service.js`**
- Token management (store, refresh, validate)
- User profile retrieval
- Integration status checking

**Updated AuthContext:**
- Add Google auth state management
- Handle account linking for existing users
- Manage multiple auth providers

---

## Phase 2: Google Drive Integration

### 2.1 Drive API Service
**New file: `/src/lib/google/drive-service.js`**
- File upload/download functionality
- Folder creation and management
- File metadata handling
- Error handling and retries

### 2.2 Core Drive Features

**Upload to Drive:**
- Save converted CSV/Excel files to user's Google Drive
- Create "Statement Converter" folder automatically
- Organize files by date/type
- Return shareable links

**Import from Drive:**
- Google Drive file picker integration
- Support PDF file selection from Drive
- Direct processing without download/re-upload
- Handle large files efficiently

**File Management:**
- List user's statement files in Drive
- Delete/rename converted files
- Batch operations for multiple files

### 2.3 UI Components

**New Components:**
- `GoogleSignInButton` - OAuth login button
- `GoogleDrivePicker` - File selection from Drive
- `DriveExportDialog` - Export options for Drive
- `GoogleIntegrationSettings` - Manage Google account linking

**Updated Components:**
- `DataPreview` - Add "Save to Drive" option
- `FileUploader` - Add "Import from Drive" option
- Export buttons - Add Drive export alongside CSV/Excel

### 2.4 Enhanced Export API
**Updated `/api/export/route.js`:**
- Add `destination` parameter (local, drive)
- Handle Drive uploads after conversion
- Return Drive file URLs and sharing links
- Maintain existing CSV/Excel download functionality

**New `/api/google/drive/upload` endpoint:**
- Accept converted data and upload to Drive
- Handle folder organization
- Return file metadata and sharing links

### 2.5 User Experience Flow

**For New Users:**
1. Click "Sign in with Google" on landing page
2. Complete OAuth flow
3. Account created in Supabase with Google integration
4. Immediate access to Drive features

**For Existing Users:**
1. Go to Settings/Integrations
2. Click "Connect Google Drive"
3. Complete OAuth flow
4. Google account linked to existing Supabase account
5. Drive features now available

**File Processing Flow:**
1. User uploads PDF (local) OR selects from Drive
2. PDF processed with AI enhancement
3. Results shown in preview
4. Export options: Download CSV/Excel OR Save to Drive
5. If Drive selected: File uploaded to organized Drive folder

### 2.6 Error Handling & Edge Cases
- Token expiration and automatic refresh
- API rate limiting and backoff
- Large file handling (chunked uploads)
- Network failures and retries
- User permission changes
- Drive storage quota exceeded

### 2.7 Security Considerations
- Encrypt Google tokens in database
- Implement token rotation
- Secure OAuth callback validation
- Rate limiting on Google API calls
- User consent for each Drive access

---

## Phase 3: Google Sheets Integration  
### 3.1 Sheets API Service
- Create Google Sheets service wrapper (`/src/lib/google/sheets-service.js`)
- Implement spreadsheet creation and data population
- Add formatting and styling capabilities

### 3.2 Enhanced Export Options
- **Export to New Sheet**: Create formatted Google Sheets with transaction data
- **Update Existing Sheet**: Append to existing spreadsheets
- **Template Support**: Pre-formatted templates for different statement types
- **Real-time Collaboration**: Share sheets with team members

---

## Phase 4: Advanced Features
### 4.1 Gmail Integration (Optional)
- Add Gmail API scope for processing email attachments
- Auto-detect statement emails and offer conversion
- Direct processing of PDF attachments from Gmail

### 4.2 Google Workspace Add-on
- Create workspace add-on manifest
- Implement sidebar integration for Drive/Gmail
- Add context-aware processing suggestions

---

## Phase 5: UI/UX Enhancements
### 5.1 Google Sign-In Integration
- Add "Sign in with Google" buttons
- Implement account linking flow for existing users
- Create onboarding flow for Google Workspace users

### 5.2 Integration UI Components
- Google Drive file picker component
- Google Sheets export dialog with options
- Integration status indicators and connection management

### 5.3 Material Design Compliance
- Update components to follow Material Design guidelines
- Ensure mobile responsiveness for all Google integrations
- Add Google-style loading states and error handling

---

## Phase 6: Marketplace Preparation
### 6.1 Manifest and Configuration
- Create Google Workspace Add-on manifest file
- Configure OAuth consent screen with proper branding
- Set up domain verification

### 6.2 Documentation and Compliance
- Create privacy policy covering Google data usage
- Update terms of service for Google integration
- Prepare user documentation and help guides
- Set up support channels

### 6.3 Security and Testing
- Implement proper token management and refresh
- Add rate limiting for Google API calls
- Create comprehensive test suite for all integrations
- Security audit of OAuth flows

---

## Implementation Strategy

### Technical Approach
1. **Hybrid Authentication**: Maintain Supabase as primary auth, add Google as secondary
2. **Service Layer**: Create abstracted Google services for easy maintenance
3. **Graceful Degradation**: App works without Google integration if user prefers
4. **Error Handling**: Robust error handling for API failures and token expiration

### Environment Variables Needed
```bash
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
```

### Key Integration Points
- Maintain existing Supabase authentication as primary
- Google integration as enhancement, not replacement
- Graceful degradation if Google services unavailable
- Preserve all existing functionality for non-Google users

---

## Success Metrics
- Google Workspace Marketplace approval
- Increased user acquisition through Google discovery
- Higher conversion rates for Google Workspace users
- Improved user engagement with enhanced export options

---

## Timeline Estimate
- **Phase 1-2**: 3-4 weeks (Core OAuth + Drive)
- **Phase 3**: 1-2 weeks (Sheets integration)
- **Phase 4**: 2-3 weeks (Advanced features)
- **Phase 5-6**: 2-3 weeks (UI/UX + Marketplace prep)
- **Total**: 8-12 weeks for complete implementation

---

## Code Examples

### Example OAuth Configuration
```javascript
// /pages/api/auth/google.js
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export default function handler(req, res) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
}
```

### Example Google Drive Upload
```javascript
// Save converted statement to Google Drive
async function saveToGoogleDrive(convertedData, originalFileName) {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  const fileMetadata = {
    name: `${originalFileName}_converted.csv`,
    mimeType: 'text/csv',
    parents: [await getOrCreateAppFolder()]
  };
  
  const media = {
    mimeType: 'text/csv',
    body: convertedData
  };
  
  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink'
  });
  
  return response.data;
}
```

### Example Google Sheets Export
```javascript
// Export to Google Sheets
async function exportToSheets(convertedData, sheetName) {
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  const spreadsheet = await sheets.spreadsheets.create({
    resource: {
      properties: {
        title: `Statement Export - ${sheetName}`
      }
    }
  });
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: 'A1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: convertedData
    }
  });
  
  return spreadsheet.data.spreadsheetUrl;
}
```

---

This plan provides a comprehensive roadmap to Google Workspace Marketplace integration while maintaining your existing architecture and user base. Implement in phases based on user demand and business priorities.