# Google OAuth 2.0 Setup Guide

This guide will walk you through setting up Google OAuth 2.0 for StatementConverter, enabling users to sign in with their Google accounts and access Google Drive/Sheets integration.

## Prerequisites

- A Google Cloud Console account
- Access to your Supabase project dashboard
- The application deployed or running locally

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "StatementConverter")
4. Click "Create"

### 1.2 Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable the following APIs:
   - Google Identity Platform (for OAuth)
   - Google Drive API
   - Google Sheets API

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace organization)
3. Fill in the required information:
   - App name: StatementConverter
   - User support email: Your email
   - App logo: Upload your logo (optional)
   - App domain: Your production domain
   - Developer contact: Your email
4. Add scopes:
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/drive.file`
     - `https://www.googleapis.com/auth/spreadsheets`
5. Add test users (if in testing mode)
6. Review and save

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Configure the client:
   - Name: StatementConverter Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com`
   - Authorized redirect URIs:
     - `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-production-domain.com/auth/callback`
5. Click "Create"
6. Save the Client ID and Client Secret

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Authentication" → "Providers"
4. Find "Google" and click "Enable"
5. Enter your Google OAuth credentials:
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console
6. Click "Save"

### 2.2 Run Database Migration

Execute the database migration to create the necessary tables:

```sql
-- Run this in your Supabase SQL editor
-- The migration file is located at: database/migrations/add_google_oauth_tables.sql
```

## Step 3: Environment Configuration

### 3.1 Update Environment Variables

Add these to your `.env.local` file:

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret

# Ensure these are set
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 3.2 Verify Configuration

Ensure all required environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Step 4: Testing the Integration

### 4.1 Local Development Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/auth/signin`

3. Click "Sign in with Google"

4. Complete the Google OAuth flow

5. Verify you're redirected to the dashboard

### 4.2 Verify Token Storage

Check that Google tokens are properly stored:

```sql
-- Run in Supabase SQL editor
SELECT * FROM google_tokens WHERE user_id = 'your-user-id';
```

### 4.3 Test Google Drive Integration

1. Sign in with Google
2. Navigate to the file converter
3. Look for "Save to Drive" options in export menu
4. Test uploading a converted file to Google Drive

## Step 5: Production Deployment

### 5.1 Update Redirect URIs

1. In Google Cloud Console, update your OAuth client to include production URLs:
   - Add your production domain to authorized JavaScript origins
   - Add production callback URL to authorized redirect URIs

### 5.2 Move to Production Mode

1. In Google Cloud Console, submit your OAuth consent screen for verification
2. This is required if you want to allow users outside your test user list

### 5.3 Update Environment Variables

Update your production environment variables with the correct values.

## Troubleshooting

### Common Issues

1. **"Error 400: redirect_uri_mismatch"**
   - Ensure the redirect URI in Google Cloud Console exactly matches your Supabase callback URL
   - Check for trailing slashes or protocol differences (http vs https)

2. **"Access blocked: This app's request is invalid"**
   - Verify all required scopes are added in the consent screen
   - Ensure the app is either in testing mode with test users added, or verified for production

3. **Tokens not storing**
   - Check that the database migration ran successfully
   - Verify RLS policies are correctly set
   - Check Supabase logs for any errors

4. **Google API errors**
   - Ensure all required APIs are enabled in Google Cloud Console
   - Check API quotas haven't been exceeded
   - Verify the access token is valid and not expired

### Debug Mode

To enable detailed logging:

```javascript
// In your auth callback handler
console.log('OAuth response:', data)
console.log('Provider token:', data.session?.provider_token)
console.log('User data:', data.session?.user)
```

## Security Best Practices

1. **Never commit credentials**
   - Keep Google Client Secret in environment variables only
   - Use `.env.local` for local development
   - Use secure environment variable management in production

2. **Token Security**
   - Tokens are stored encrypted in the database
   - Implement token rotation
   - Set appropriate token expiration times

3. **Scope Management**
   - Only request necessary scopes
   - Explain why each scope is needed in your privacy policy
   - Allow users to revoke access

4. **Rate Limiting**
   - Implement rate limiting for Google API calls
   - Cache frequently accessed data
   - Handle quota errors gracefully

## Next Steps

1. **Implement Google Drive Features**
   - File picker for importing PDFs from Drive
   - Save converted files to Drive
   - Organize files in app-specific folders

2. **Add Google Sheets Export**
   - Direct export to formatted Google Sheets
   - Support for templates
   - Batch operations

3. **User Settings Page**
   - Show linked Google account
   - Allow unlinking/relinking
   - Manage permissions

## Support

For issues specific to:
- **Google OAuth**: Check [Google Identity Platform docs](https://developers.google.com/identity)
- **Supabase Auth**: See [Supabase Auth docs](https://supabase.com/docs/guides/auth)
- **Implementation**: Review the codebase or contact development team

---

Last updated: January 2025