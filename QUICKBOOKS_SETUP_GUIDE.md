# QuickBooks Integration - Setup Guide

## What We've Built

Congratulations! The foundation for QuickBooks integration is now in place. Here's what has been implemented:

### ✅ Completed Components

#### 1. **Database Schema** (`database/migrations/20250118_quickbooks_integration.sql`)
- 7 new tables for managing QuickBooks connections, mappings, and sync jobs
- Row Level Security (RLS) policies for user data isolation
- Indexes optimized for performance
- Automatic timestamp tracking

#### 2. **Backend Services**
- **`src/lib/quickbooks/auth-service.js`**: Complete OAuth 2.0 flow
  - Token storage and automatic refresh
  - Connection status checking
  - Secure state verification
- **`src/lib/quickbooks/api-client.js`**: QuickBooks API wrapper
  - Rate limiting (90 req/min to stay under QB limits)
  - Automatic token refresh on API calls
  - Methods for accounts, vendors, customers, transactions
- **`src/lib/quickbooks/transaction-converter.js`**: Data transformation
  - Converts Statement Desk transactions to QB format
  - Validation and error handling
  - Support for Purchases, Deposits, Journal Entries

#### 3. **API Endpoints**
- `POST /api/quickbooks/connect` - Initiate OAuth flow
- `GET /api/quickbooks/callback` - Handle OAuth callback
- `POST /api/quickbooks/disconnect` - Revoke connection
- `GET /api/quickbooks/status` - Check connection status
- `GET /api/quickbooks/accounts` - Fetch QB data (accounts, vendors, customers)

#### 4. **User Interface**
- **`src/components/quickbooks/QuickBooksConnectionStatus.js`**
  - Beautiful card-based UI matching existing Xero integration
  - Connection/disconnection flow
  - Test connection feature
  - Feature highlights for non-connected users
  - Success/error toast notifications
- Integrated into Settings page with tier-based access control
- Available for Professional, Business, and Enterprise tiers

#### 5. **Subscription Tier Support**
- QuickBooks access added to subscription tiers
- Helper function `hasQuickBooksAccess()` for access control
- Upgrade prompts for free tier users

---

## Next Steps: Complete the Setup

### Step 1: Create QuickBooks Developer Account

1. Go to [Intuit Developer Portal](https://developer.intuit.com/)
2. Sign up or sign in with your Intuit account
3. Click "Create an app" in the dashboard

### Step 2: Configure Your QuickBooks App

1. **App Name**: "Statement Desk" (or your preferred name)
2. **Select API**: Choose "QuickBooks Online API"
3. **Development Settings**:
   - **Redirect URI**: `http://localhost:3000/api/quickbooks/callback`
   - **Scopes**: Select "Accounting"
4. **Get Credentials**:
   - Copy **Client ID**
   - Copy **Client Secret**

### Step 3: Set Up Environment Variables

Create or update your `.env.local` file:

```bash
# QuickBooks Integration
QUICKBOOKS_CLIENT_ID=your_client_id_from_step_2
QUICKBOOKS_CLIENT_SECRET=your_client_secret_from_step_2
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox
```

**Important**: Start with `sandbox` environment for testing!

### Step 4: Run Database Migrations

```bash
# Connect to your Supabase database
psql -d your_database_url

# Run the migration
\i database/migrations/20250118_quickbooks_integration.sql

# Verify tables were created
\dt quickbooks_*
```

Or use Supabase Dashboard:
1. Go to Database → SQL Editor
2. Copy contents of `database/migrations/20250118_quickbooks_integration.sql`
3. Click "Run"

### Step 5: Test the OAuth Flow

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `/settings` in your browser

3. Make sure you're on a Professional tier or higher:
   - If on free tier, you'll see upgrade prompt
   - For testing, you can temporarily modify the tier check

4. Click "Connect QuickBooks" button

5. You'll be redirected to QuickBooks login:
   - Use sandbox test credentials
   - Grant permissions
   - You'll be redirected back to `/settings?qb_connected=true`

6. Verify connection:
   - You should see green "Connected" status
   - Click "Test Connection" to verify API access works

### Step 6: Troubleshooting

#### Problem: "Failed to initiate QuickBooks connection"
- ✅ Check environment variables are set correctly
- ✅ Verify QUICKBOOKS_CLIENT_ID and CLIENT_SECRET are not empty
- ✅ Check browser console for errors

#### Problem: OAuth callback fails
- ✅ Verify redirect URI matches exactly in QB app settings
- ✅ Check if the state parameter is valid (not expired)
- ✅ Look at server logs for detailed error messages

#### Problem: "No authorization header" error
- ✅ Make sure you're logged in to the app
- ✅ Check that AuthContext is providing the user session
- ✅ Verify Supabase authentication is working

#### Problem: Database errors
- ✅ Confirm migration ran successfully
- ✅ Check RLS policies allow authenticated users
- ✅ Verify service role key has correct permissions

---

## Testing Checklist

Before moving to production, test these scenarios:

- [ ] Connect QuickBooks account successfully
- [ ] Disconnect and reconnect
- [ ] Test connection button works
- [ ] Token auto-refresh (wait 10 minutes, then test connection)
- [ ] OAuth state validation (try to reuse old callback URL)
- [ ] Multiple users connecting their own QB accounts
- [ ] Free tier users see upgrade prompt
- [ ] Professional tier users can connect
- [ ] Error handling when QB is unavailable

---

## Production Deployment

When ready to go live:

### 1. Update QuickBooks App Settings

In your QB app settings:
- Change **Redirect URI** to: `https://yourdomain.com/api/quickbooks/callback`
- Submit for **Production Review** (if needed)
- Wait for Intuit approval (can take 1-2 weeks)

### 2. Update Environment Variables

```bash
QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=production
```

### 3. Security Review

- ✅ Verify tokens are encrypted at rest
- ✅ Confirm RLS policies are active
- ✅ Test that users can only access their own data
- ✅ Enable HTTPS everywhere
- ✅ Set up error monitoring (Sentry, etc.)

---

## What's Not Implemented Yet

These features are planned for Phase 2-3 (see `QUICKBOOKS_INTEGRATION_PLAN.md`):

### Phase 2: Mapping Engine (Week 2)
- [ ] AI-powered category → account mapping
- [ ] Merchant → vendor/customer mapping
- [ ] Mapping UI wizard
- [ ] Mapping validation

### Phase 3: Sync Engine (Week 3-4)
- [ ] Transaction sync service
- [ ] Batch processing with queue
- [ ] Retry logic and error handling
- [ ] Sync job tracking
- [ ] Webhook handler

### Phase 4: Full UI (Week 4-5)
- [ ] Sync dashboard
- [ ] Transaction review interface
- [ ] Sync settings panel
- [ ] Error resolution UI

---

## Getting Help

If you encounter issues:

1. **Check Implementation Plan**: See `QUICKBOOKS_INTEGRATION_PLAN.md` for detailed architecture
2. **Review Code Comments**: All services have detailed JSDoc comments
3. **QuickBooks Docs**: https://developer.intuit.com/app/developer/qbo/docs/
4. **Test with Sandbox**: Always test in sandbox before production

---

## Quick Reference

### Environment Variables
```bash
QUICKBOOKS_CLIENT_ID         # From QB app settings
QUICKBOOKS_CLIENT_SECRET     # From QB app settings
QUICKBOOKS_REDIRECT_URI      # Your callback URL
QUICKBOOKS_ENVIRONMENT       # "sandbox" or "production"
```

### Database Tables
- `quickbooks_connections` - OAuth connections
- `quickbooks_category_mappings` - Category → Account maps
- `quickbooks_merchant_mappings` - Merchant → Vendor/Customer maps
- `quickbooks_sync_jobs` - Sync job tracking
- `quickbooks_transaction_syncs` - Individual transaction status
- `quickbooks_sync_queue` - Background processing queue
- `quickbooks_webhooks` - QB webhook events

### Key Files
- **Auth**: `src/lib/quickbooks/auth-service.js`
- **API**: `src/lib/quickbooks/api-client.js`
- **Convert**: `src/lib/quickbooks/transaction-converter.js`
- **UI**: `src/components/quickbooks/QuickBooksConnectionStatus.js`
- **Routes**: `src/pages/api/quickbooks/*`

---

## Timeline Estimate

Based on the implementation plan:

- ✅ **Week 1**: Foundation & OAuth - **DONE!**
- ⏳ **Week 2**: Data Mapping Engine
- ⏳ **Week 3-4**: Sync Engine
- ⏳ **Week 4-5**: Full UI
- ⏳ **Week 5-6**: Testing & Polish

You're approximately **25% complete** with the full QuickBooks integration!

---

**Last Updated**: 2025-01-18
**Status**: Phase 1 Complete - Ready for Testing
**Next Phase**: Implement Mapping Engine (Week 2)
