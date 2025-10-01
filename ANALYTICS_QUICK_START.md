# Analytics System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get your analytics system up and running quickly.

---

## Step 1: Run Database Migration (2 minutes)

```bash
# Connect to your Supabase database
psql postgresql://your-connection-string

# Run the migration
\i database/migrations/add_analytics_system.sql

# Verify tables were created
\dt page_views user_sessions analytics_events
```

**Expected output:** You should see 3 tables listed.

---

## Step 2: Configure Admin Access (1 minute)

Edit `src/app/admin/layout.js` and add your email:

```javascript
const ADMIN_EMAILS = [
  'your-email@example.com'  // ← Add your email here
]
```

**Pro tip:** To find your user ID instead of using email:

```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

Then add it to `ADMIN_USER_IDS` array.

---

## Step 3: Test the System (2 minutes)

### Test Automatic Tracking

1. Start your dev server: `npm run dev`
2. Navigate to your app: `http://localhost:3000`
3. Open browser console - you should see:
   ```
   [Analytics] Service initialized
   [Analytics] Page view tracked: /
   ```

### Verify Data in Database

```sql
-- Check page views
SELECT COUNT(*) FROM page_views;

-- Check your recent activity
SELECT page_path, created_at
FROM page_views
ORDER BY created_at DESC
LIMIT 10;
```

### Access Admin Dashboard

1. Go to `http://localhost:3000/admin/analytics`
2. You should see the analytics dashboard with charts and metrics
3. If you see "Access Denied", verify Step 2 configuration

---

## Step 4: Generate Sample Data (Optional)

To see the dashboard with data, navigate around your app:

1. ✅ Visit different pages (/, /dashboard, /upload, /pricing)
2. ✅ Upload a PDF file
3. ✅ Export to Excel/CSV
4. ✅ Use AI chat feature
5. ✅ Return to `/admin/analytics` to see data

---

## What's Tracking Automatically?

### ✅ Already Implemented

- **Page Views**: Every navigation tracked automatically
- **User Sessions**: Session duration, pages per session
- **Device Info**: Browser, OS, screen resolution
- **UTM Parameters**: Marketing campaign tracking
- **Traffic Sources**: Where users come from

### ✅ Custom Events Already Added

| Event | Location | Triggers When |
|-------|----------|---------------|
| `pdf_upload` | Upload page | File uploaded |
| `pdf_processed` | Upload page | Processing complete |
| `export_excel/csv` | Export API | File exported |
| `export_google_sheets` | Export API | Sheets export |
| `ai_chat_query` | Chat API | AI query sent |
| `user_signup` | Signup page | User registers |

---

## Quick Reference: Track Custom Events

### In Client Components

```javascript
import analyticsService from '@/lib/analytics/analytics-service'

// Track any event
analyticsService.trackEvent('button_clicked', 'engagement', 'CTA Button', 1, {
  button_location: 'hero_section'
})

// Track conversion
analyticsService.trackConversion('subscription_created', {
  plan: 'premium',
  amount: 29.99
})

// Track feature usage
analyticsService.trackFeatureUsage('xero_integration', {
  organization_id: 'abc123'
})
```

### In API Routes (Server-side)

```javascript
// Import Supabase client
const supabase = await createClient()

// Track event
await supabase.from('analytics_events').insert({
  user_id: user.id,
  session_id: 'server_action',
  visitor_id: user.id,
  event_name: 'api_called',
  event_category: 'feature_usage',
  event_value: 1,
  metadata: { endpoint: '/api/special-feature' }
})
```

---

## Dashboard Features

### 📊 Overview Tab
- Total page views
- Unique visitors
- Average pages per visitor
- Real-time active users
- Daily active users chart

### 📄 Top Pages Tab
- Most visited pages
- Unique visitors per page
- Average time on page
- Interactive charts + data table

### 🌐 Traffic Sources Tab
- Source breakdown (Google, Direct, Referral, etc.)
- UTM campaign tracking
- Pie chart visualization
- Detailed source metrics

### 🎯 Events Tab
- Custom event counts
- Unique users per event
- Event values and totals
- Feature usage tracking

### 📈 Conversion Funnel Tab
- Step-by-step user journey
- Conversion rates at each stage
- Drop-off analysis
- Visual progress indicators

---

## Advanced Features

### A/B Testing

```javascript
import abTesting, { useABTest } from '@/lib/analytics/ab-testing'

function MyComponent() {
  const variant = useABTest('pricing_cta_text')

  return (
    <Button onClick={() => abTesting.trackConversion('pricing_cta_text')}>
      {variant === 'A' ? 'Start Free Trial' : 'Get Started Now'}
    </Button>
  )
}
```

### Funnel Tracking

```javascript
import { trackFunnelStep } from '@/lib/analytics/funnel-tracker'

// Track user progress through conversion funnel
trackFunnelStep('onboarding', 'visited_landing')
trackFunnelStep('onboarding', 'completed_signup', { plan: 'free' })
trackFunnelStep('first_conversion', 'uploaded_file', { fileId: 'xyz' })
```

---

## Troubleshooting

### ❌ "No data in dashboard"

```sql
-- Check if tables exist
\dt page_views

-- Check if data exists
SELECT COUNT(*) FROM page_views;

-- Check RLS policies (might need service role access)
SELECT * FROM page_views LIMIT 1;
```

**Solution:** Make sure you've navigated around the app to generate data.

### ❌ "Access Denied" on /admin/analytics

1. Verify email/user ID in `src/app/admin/layout.js`
2. Ensure you're logged in
3. Clear cookies and try again

### ❌ Events not tracking

Check browser console for errors:
```javascript
// Test in console
localStorage.getItem('sd_visitor_id')  // Should return a UUID
sessionStorage.getItem('sd_session')   // Should return session info
```

---

## What's Included?

### 📁 Files Created/Modified

```
✅ src/app/admin/layout.js              # Admin protection
✅ src/app/admin/analytics/page.js      # Dashboard (already existed)
✅ src/components/AnalyticsProvider.js  # Page tracking (already existed)
✅ src/lib/analytics/analytics-service.js  # Core service (already existed)
✅ src/lib/analytics/funnel-tracker.js  # NEW: Funnel tracking
✅ src/lib/analytics/ab-testing.js      # NEW: A/B testing
✅ database/migrations/add_analytics_system.sql  # NEW: Database schema
✅ src/app/layout.js                    # Already integrated
✅ src/app/upload/page.js               # Event tracking added
✅ src/app/api/export/route.js          # Event tracking added
✅ src/app/api/chat/query/route.js      # Event tracking added
✅ src/app/auth/signup/page.js          # Event tracking added
```

---

## Next Steps

1. ✅ **Run the migration** (Step 1)
2. ✅ **Configure admin access** (Step 2)
3. ✅ **Test the system** (Step 3)
4. 📚 **Read full docs**: See `ANALYTICS_SETUP.md` for detailed documentation
5. 🎨 **Customize**: Add your own events and experiments
6. 📊 **Monitor**: Check the dashboard regularly
7. 🧪 **A/B Test**: Start optimizing with A/B tests

---

## Key SQL Queries

```sql
-- Today's activity
SELECT COUNT(*) as page_views,
       COUNT(DISTINCT visitor_id) as unique_visitors
FROM page_views
WHERE created_at >= CURRENT_DATE;

-- Top events this week
SELECT event_name, COUNT(*) as count
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY event_name
ORDER BY count DESC
LIMIT 10;

-- Conversion funnel
SELECT * FROM get_conversion_funnel(
  NOW() - INTERVAL '30 days',
  NOW()
);

-- A/B test results
SELECT
  metadata->>'experiment' as experiment,
  metadata->>'variant' as variant,
  COUNT(DISTINCT visitor_id) as unique_users
FROM analytics_events
WHERE event_name = 'ab_test_exposure'
GROUP BY experiment, variant;
```

---

## Resources

- 📖 **Full Documentation**: `ANALYTICS_SETUP.md`
- 🏗️ **Database Schema**: `database/migrations/add_analytics_system.sql`
- 💡 **Project Context**: `CLAUDE.md`

---

## Support

If something isn't working:

1. Check browser console for `[Analytics]` logs
2. Verify database migration ran successfully
3. Confirm admin access is configured correctly
4. Review the troubleshooting section in `ANALYTICS_SETUP.md`

---

**You're all set! 🎉**

Your analytics system is now tracking user behavior automatically. Visit `/admin/analytics` to see your dashboard.
