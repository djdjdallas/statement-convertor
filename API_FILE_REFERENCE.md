# API Wrapper - File Reference

Quick reference for all files created for the B2B API wrapper.

---

## 🗄️ Database

### Migration
```
supabase/migrations/20250111_api_wrapper_infrastructure.sql
```
**What it does**: Creates all database tables, RLS policies, indexes, and functions for the API system.

**Tables created**:
- `api_keys`: Stores hashed API keys
- `api_usage`: Logs every API request
- `api_quotas`: Manages monthly usage limits
- `api_webhooks`: Webhook configurations
- `user_api_access`: Feature flags per user

---

## 🔧 Backend Library Files

### API Key Management
```
src/lib/api-keys/index.js
```
- `generateApiKey()`: Create new keys
- `hashApiKey()`: Hash with bcrypt
- `validateApiKey()`: Check if key is valid
- `createApiKey()`: Save to database
- `revokeApiKey()`: Soft delete
- `rotateApiKey()`: Replace with new key
- `listApiKeys()`: Get user's keys
- `deleteApiKey()`: Hard delete
- `canCreateApiKey()`: Check quota

### API Authentication Middleware
```
src/lib/api-keys/middleware.js
```
- `withApiAuth()`: Main authentication function
- `extractApiKey()`: Get key from headers
- `getCurrentQuota()`: Fetch quota info
- `hasAvailableQuota()`: Check limits
- `logApiUsage()`: Record requests
- `createRateLimitHeaders()`: Add headers
- `apiError()`: Standardized error responses
- `apiSuccess()`: Standardized success responses

### Feature Flags
```
src/lib/features/flags.js
```
- `FEATURE_FLAGS`: Flag definitions
- `isFeatureEnabled()`: Check if user has access
- `enableApiAccessForUser()`: Grant access
- `disableApiAccessForUser()`: Revoke access
- `joinApiWaitlist()`: Add to waitlist
- `getWaitlistStats()`: Admin stats
- `DEV_SHORTCUTS`: Quick dev toggles

### Stripe Metered Billing
```
src/lib/stripe/metered-billing.js
```
- `API_PRICE_IDS`: Stripe price IDs
- `API_PLAN_CONFIGS`: Plan definitions
- `recordMeterEvent()`: Log to Stripe
- `recordApiConversion()`: Log conversion
- `createApiCheckoutSession()`: Start subscription
- `createBillingPortalSession()`: Manage subscription
- `getCustomerSubscription()`: Fetch details
- `handleStripeWebhook()`: Process webhooks
- `calculateCost()`: Estimate costs

---

## 🛣️ API Routes

### Convert Endpoint
```
src/app/api/v1/convert/route.js
```
**Methods**: POST, GET
**Authentication**: API key required
**Purpose**: Convert PDF bank statements to Excel/CSV

**POST Request**:
- Accepts PDF file (multipart/form-data)
- Optional: `ai_enhanced`, `export_format`
- Returns downloadable file
- Records usage to Stripe
- Increments quota

**GET Request**:
- Returns endpoint documentation

### Usage Endpoint
```
src/app/api/v1/usage/route.js
```
**Methods**: GET
**Authentication**: API key required
**Purpose**: Get usage statistics and quota info

**Response includes**:
- Current period usage
- Daily breakdown (last 30 days)
- Success/failure rates
- Quota remaining
- Reset date

### API Keys List Endpoint
```
src/app/api/v1/keys/route.js
```
**Methods**: GET, POST
**Authentication**: Session auth (not API key)
**Purpose**: Manage API keys

**GET**: List all keys for user
**POST**: Create new API key (returns plain key once)

### API Key Delete Endpoint
```
src/app/api/v1/keys/[keyId]/route.js
```
**Methods**: DELETE
**Authentication**: Session auth
**Purpose**: Revoke or delete specific key

**Query params**:
- `?hard_delete=true`: Permanently delete (vs soft delete)

---

## 🎨 Frontend Pages

### API Dashboard
```
src/app/dashboard/api/page.jsx
```
**URL**: `/dashboard/api`
**Purpose**: Main API management interface

**Greyed-out version** (default):
- Blurred preview
- "Coming Soon" overlay
- Waitlist signup

**Full version** (when enabled):
- API key manager
- Usage metrics
- Quota display
- Documentation links
- Pricing cards

### Developer Settings
```
src/app/settings/developer/page.jsx
```
**URL**: `/settings/developer`
**Purpose**: Dev tools for testing

**Features**:
- Toggle API access on/off
- Create test quotas
- View configuration
- Quick links to dashboard

### API Documentation
```
src/app/docs/api/page.mdx
```
**URL**: `/docs/api`
**Purpose**: API reference documentation

**Sections**:
- Quick start guide
- Authentication
- Endpoint reference
- Code examples (JS, Python, PHP)
- Error handling
- Best practices

---

## 🧩 Frontend Components

### API Key Manager
```
src/components/api/APIKeyManager.jsx
```
**Purpose**: Create, view, and revoke API keys

**Features**:
- List all keys with status
- Create new key modal
- Display key once on creation
- Copy to clipboard
- Revoke keys
- Show usage stats per key

### Usage Metrics
```
src/components/api/UsageMetrics.jsx
```
**Purpose**: Display usage analytics

**Shows**:
- Total requests
- Success/failure rates
- Daily usage chart (last 30 days)
- Transaction counts

### Quota Display
```
src/components/api/QuotaDisplay.jsx
```
**Purpose**: Show current quota status

**Displays**:
- Current plan tier
- Used vs. limit
- Progress bar
- Days until reset
- Remaining quota

### Pricing Cards
```
src/components/api/PricingCards.jsx
```
**Purpose**: Show upgrade options

**Features**:
- Starter, Growth, Scale plans
- Current plan indicator
- Features list
- Upgrade buttons

---

## 📄 Documentation

### Setup Guide
```
API_WRAPPER_SETUP_GUIDE.md
```
**Complete instructions for**:
- What was built
- Setup steps
- Testing procedures
- Deployment strategy
- Troubleshooting

### File Reference (this file)
```
API_FILE_REFERENCE.md
```
**Quick lookup for**:
- File locations
- Function descriptions
- What each file does

---

## 🎯 Quick Commands

### Run Migration
```bash
psql -d your_database -f supabase/migrations/20250111_api_wrapper_infrastructure.sql
```

### Start Dev Server
```bash
npm run dev
```

### Test API Locally
```bash
# Create API key first, then:
curl -X POST http://localhost:3000/api/v1/convert \
  -H "Authorization: Bearer YOUR_KEY" \
  -F "file=@test.pdf"
```

### Enable API Access (Dev)
1. Go to: `http://localhost:3000/settings/developer`
2. Click "Enable API Access"
3. Click "Create Initial Quota"

### Access API Dashboard
```
http://localhost:3000/dashboard/api
```

---

## 🔄 Common Edits

### Change Pricing
Edit: `src/lib/stripe/metered-billing.js`
Update: `API_PLAN_CONFIGS` object

### Enable API for Everyone
Edit: `src/lib/features/flags.js`
Change: `API_ACCESS.enabled = true`
Change: `API_ACCESS.devOnly = false`

### Add New Endpoint
Create: `src/app/api/v1/your-endpoint/route.js`
Use: `withApiAuth()` middleware

### Modify Rate Limits
Edit: `src/lib/api-keys/middleware.js`
Update: `rateLimiters` object

---

## 📊 Database Queries

### Check User API Access
```sql
SELECT * FROM user_api_access WHERE user_id = 'xxx';
```

### View All API Keys
```sql
SELECT id, name, key_prefix, is_active, created_at
FROM api_keys
WHERE user_id = 'xxx';
```

### Check Current Quota
```sql
SELECT * FROM get_current_quota('user-id-here');
```

### View Recent API Usage
```sql
SELECT * FROM api_usage
WHERE user_id = 'xxx'
ORDER BY created_at DESC
LIMIT 50;
```

### Manually Create Quota
```sql
INSERT INTO api_quotas (
  user_id, plan_tier, monthly_limit,
  current_usage, period_start, period_end
) VALUES (
  'user-id',
  'growth',
  500,
  0,
  NOW(),
  NOW() + INTERVAL '1 month'
);
```

---

## 🎨 Styling

All components use **Tailwind CSS** classes:
- Primary color: `indigo-600`
- Success: `green-600`
- Warning: `yellow-600`
- Error: `red-600`

Icons from: **lucide-react**

---

## 🔐 Environment Variables

Required in `.env.local`:

```bash
# Existing (already set)
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
STRIPE_SECRET_KEY=your_key
ENCRYPTION_KEY=your_key

# New (add these)
STRIPE_API_STARTER_PRICE_ID=price_xxx
STRIPE_API_GROWTH_PRICE_ID=price_xxx
STRIPE_API_SCALE_PRICE_ID=price_xxx
STRIPE_API_ENTERPRISE_PRICE_ID=price_xxx
STRIPE_API_PAYG_PRICE_ID=price_xxx
```

---

## 📝 Notes

- **All backend code is production-ready**
- **Frontend is greyed out by default**
- **Feature flag controls everything**
- **One line change to launch**: `FEATURE_FLAGS.API_ACCESS.enabled = true`
- **Analytics built-in**: Every request logged
- **Stripe integration ready**: Just create products
- **Security hardened**: RLS, rate limiting, hashing

---

## 🚀 Launch Checklist

Before going live:

- [ ] Run database migration
- [ ] Create Stripe products and add price IDs
- [ ] Test all endpoints thoroughly
- [ ] Set up Stripe webhooks
- [ ] Configure monitoring (Sentry, etc.)
- [ ] Update documentation with real examples
- [ ] Test error scenarios
- [ ] Enable feature flag
- [ ] Announce launch! 🎉

---

Happy coding! 🚀
