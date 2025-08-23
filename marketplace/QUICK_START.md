# Google Workspace Marketplace Quick Start Guide

This guide helps you quickly set up Statement Desk for Google Workspace Marketplace listing.

## Prerequisites Checklist

- [ ] Google Cloud Project created
- [ ] Billing enabled on the project
- [ ] Domain verified in Google Search Console
- [ ] SSL certificate for your domain

## Step-by-Step Setup

### 1. Enable APIs (5 minutes)

Run these commands in Google Cloud Shell:

```bash
gcloud config set project YOUR_PROJECT_ID

gcloud services enable drive.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable identity.googleapis.com
gcloud services enable appsmarketplace.googleapis.com
```

### 2. Create OAuth Credentials (10 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** > **Credentials**
3. Click **Create Credentials** > **OAuth client ID**
4. Choose **Web application**
5. Add these settings:
   ```
   Name: Statement Desk Web Client
   
   Authorized JavaScript origins:
   - https://yourdomain.com
   - https://www.yourdomain.com
   
   Authorized redirect URIs:
   - https://yourdomain.com/api/auth/google/callback
   - https://yourdomain.com/auth/callback
   ```
6. Save and copy the Client ID and Client Secret

### 3. Configure OAuth Consent Screen (15 minutes)

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** and click **Create**
3. Fill in:
   ```
   App name: Statement Desk
   User support email: support@yourdomain.com
   App logo: Upload 120x120 PNG
   
   App domain:
   - Homepage: https://yourdomain.com
   - Privacy policy: https://yourdomain.com/privacy
   - Terms of service: https://yourdomain.com/terms
   
   Authorized domains: yourdomain.com
   Developer email: developers@yourdomain.com
   ```
4. Add scopes:
   - `../auth/drive.file`
   - `../auth/spreadsheets`
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users if needed
6. Submit for verification if using sensitive scopes

### 4. Configure Marketplace SDK (20 minutes)

1. Go to **APIs & Services** > **Google Workspace Marketplace SDK**
2. Click **Enable**
3. Go to **Configuration** tab
4. Fill in:

```yaml
# App Configuration
Name: Statement Desk
Description: Convert bank statements to Excel with AI
Icon: Upload 128x128 PNG

# OAuth Configuration
Scopes: (should match consent screen)
- https://www.googleapis.com/auth/drive.file
- https://www.googleapis.com/auth/spreadsheets
- https://www.googleapis.com/auth/userinfo.email
- https://www.googleapis.com/auth/userinfo.profile

# Installation URLs
Individual install: https://yourdomain.com/install/individual
Domain install: https://yourdomain.com/install/domain

# Support URLs
Terms of Service: https://yourdomain.com/terms
Privacy Policy: https://yourdomain.com/privacy
Support: https://yourdomain.com/support
```

### 5. Deploy Installation Endpoints (30 minutes)

1. Update your `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. Deploy the marketplace routes (already created in this setup)

3. Run database migrations:
   ```bash
   psql -d your_database -f database/migrations/add_marketplace_tables.sql
   ```

4. Test installation flow:
   ```bash
   npm run dev
   # Visit http://localhost:3000/install/individual?domain=test.com&userEmail=test@test.com&token=test123
   ```

### 6. Create Marketplace Listing (15 minutes)

1. Go to [Google Workspace Marketplace](https://workspace.google.com/marketplace)
2. Click **Publish an app**
3. Select your project
4. Fill in listing details:
   - Upload 5 screenshots (1280x800)
   - Write compelling description
   - Set pricing (Freemium recommended)
   - Choose categories
   - Add support links

### 7. Test Your Integration (30 minutes)

Run the test script:

```bash
node scripts/test-marketplace-install.js
```

Manual testing checklist:
- [ ] Install from test marketplace listing
- [ ] OAuth flow completes
- [ ] User can access Statement Desk
- [ ] Google Drive integration works
- [ ] Export to Sheets works
- [ ] Uninstall process works

### 8. Submit for Review

1. Ensure all tests pass
2. Review the submission checklist
3. Click **Submit for Review** in Marketplace SDK
4. Provide test credentials if requested
5. Wait 3-5 business days for review

## Environment Variables Reference

```bash
# Required for Marketplace
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional but recommended
MARKETPLACE_APP_ID=your-app-id
MARKETPLACE_WEBHOOK_SECRET=your-webhook-secret
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# For domain-wide delegation (optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./keys/service-account.json
```

## Common Issues & Solutions

### Issue: OAuth error during installation
**Solution**: Ensure redirect URI exactly matches configuration

### Issue: Scopes mismatch error  
**Solution**: OAuth consent screen and Marketplace SDK scopes must match exactly

### Issue: Installation hangs
**Solution**: Check browser console for errors, ensure HTTPS is working

### Issue: Can't access Google Drive files
**Solution**: Verify drive.file scope is properly requested and authorized

## Testing URLs

After deployment, test these URLs:

```
# OAuth flow
https://yourdomain.com/api/auth/google

# Individual installation
https://yourdomain.com/install/individual?domain=test.com&userEmail=user@test.com&token=test123

# Domain installation  
https://yourdomain.com/install/domain?domain=test.com&adminEmail=admin@test.com&token=test123

# Webhook endpoint
POST https://yourdomain.com/api/marketplace/webhook
```

## Next Steps

1. Monitor installation metrics in Google Cloud Console
2. Set up error alerting
3. Prepare support documentation
4. Plan marketing for launch
5. Gather user feedback for improvements

## Support

- **Google Workspace Marketplace Support**: https://developers.google.com/workspace/marketplace/support
- **Statement Desk Development**: developers@statementdesk.com
- **Documentation**: https://statementdesk.com/docs

---

**Time Estimate**: 2-3 hours for complete setup
**Difficulty**: Medium
**Requirements**: Basic knowledge of OAuth, Google Cloud Console