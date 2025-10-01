# Analytics System Setup Guide

## Overview

This document provides complete instructions for setting up and testing the analytics admin system for Statement Desk.

## Table of Contents

1. [Installation](#installation)
2. [Database Setup](#database-setup)
3. [Admin Configuration](#admin-configuration)
4. [Testing the System](#testing-the-system)
5. [Event Tracking Reference](#event-tracking-reference)
6. [A/B Testing Guide](#ab-testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### 1. Install Dependencies

All required dependencies should already be installed. If needed, verify you have:

```bash
npm install recharts  # For charts in the dashboard
```

### 2. File Structure

The analytics system consists of the following files:

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.js                    # Admin route protection
│   │   └── analytics/
│   │       └── page.js                  # Analytics dashboard
│   └── layout.js                        # Root layout (AnalyticsProvider already integrated)
├── components/
│   └── AnalyticsProvider.js             # Automatic page view tracking
└── lib/
    └── analytics/
        ├── analytics-service.js         # Core analytics service
        ├── funnel-tracker.js            # Conversion funnel tracking
        └── ab-testing.js                # A/B testing framework

database/
└── migrations/
    └── add_analytics_system.sql         # Database schema and functions
```

---

## Database Setup

### 1. Run the Migration

Execute the SQL migration to create analytics tables and functions:

```bash
# Using psql
psql -d your_database_name -f database/migrations/add_analytics_system.sql

# OR using Supabase CLI
supabase db push
```

### 2. Verify Tables Were Created

Connect to your database and verify:

```sql
-- Check that tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('page_views', 'user_sessions', 'analytics_events');

-- Check that functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'get_%';
```

You should see:
- Tables: `page_views`, `user_sessions`, `analytics_events`
- Functions: `get_daily_active_users`, `get_top_pages`, `get_traffic_sources`, `get_event_stats`, `get_realtime_active_users`, `get_conversion_funnel`

### 3. Test the RPC Functions

```sql
-- Test get_daily_active_users (should return empty initially)
SELECT * FROM get_daily_active_users(
  NOW() - INTERVAL '7 days',
  NOW()
);

-- Test get_realtime_active_users
SELECT * FROM get_realtime_active_users();
```

---

## Admin Configuration

### 1. Configure Admin Access

Edit `/src/app/admin/layout.js` and add your admin credentials:

```javascript
// Add your user ID (from Supabase auth.users table)
const ADMIN_USER_IDS = [
  'your-user-uuid-here'  // Replace with your actual user UUID
]

// OR add your email
const ADMIN_EMAILS = [
  'admin@statementdesk.com',
  'your-email@example.com'  // Add your email
]
```

### 2. Get Your User ID

To find your user ID:

**Method 1: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user and copy the UUID

**Method 2: Via SQL**
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

**Method 3: Via Browser Console**
```javascript
// Go to your app, open browser console, and run:
const { data } = await supabase.auth.getUser()
console.log('User ID:', data.user.id)
```

---

## Testing the System

### 1. Test Page View Tracking

1. Navigate to your app in a browser
2. Open browser DevTools → Console
3. You should see logs like:
   ```
   [Analytics] Service initialized
   [Analytics] Page view tracked: /dashboard
   ```

4. Verify in database:
   ```sql
   SELECT * FROM page_views ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM user_sessions ORDER BY started_at DESC LIMIT 5;
   ```

### 2. Test Custom Events

#### Test File Upload Event

1. Go to `/upload` page
2. Upload a PDF file
3. Check console for:
   ```
   [Analytics] Event tracked: pdf_upload
   ```

4. Verify in database:
   ```sql
   SELECT
     event_name,
     event_category,
     event_value,
     metadata
   FROM analytics_events
   WHERE event_name = 'pdf_upload'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

#### Test Export Event

1. Go to a processed file's preview page
2. Export to Excel/CSV
3. Check for export event in database:
   ```sql
   SELECT * FROM analytics_events
   WHERE event_name LIKE 'export_%'
   ORDER BY created_at DESC;
   ```

#### Test AI Chat Event

1. Use the AI chat feature
2. Ask a question about your transactions
3. Verify event was tracked:
   ```sql
   SELECT * FROM analytics_events
   WHERE event_name = 'ai_chat_query'
   ORDER BY created_at DESC;
   ```

### 3. Test Admin Dashboard

1. Make sure you've configured admin access (see Admin Configuration above)

2. Navigate to `/admin/analytics`

3. You should see:
   - ✅ Summary metrics cards (Total Views, Unique Visitors, etc.)
   - ✅ Daily active users chart
   - ✅ Top pages table
   - ✅ Traffic sources pie chart
   - ✅ Real-time active users count
   - ✅ Date range selector (7, 30, 90 days)
   - ✅ Export to CSV button

4. If you see "Access Denied":
   - Verify your user ID/email is in the admin list
   - Check browser console for errors
   - Verify you're logged in

### 4. Test Data Export

1. In the admin dashboard, click "Export CSV"
2. A CSV file should download with:
   - Daily active users
   - Top pages
   - Traffic sources
   - Event statistics

---

## Event Tracking Reference

### Automatic Events

These are tracked automatically:

| Event | When | Category | Value |
|-------|------|----------|-------|
| Page views | Every navigation | N/A | N/A |
| Session stats | Every page view | N/A | N/A |

### Manual Events (Already Implemented)

| Event Name | Triggered When | Category | Location |
|------------|---------------|----------|----------|
| `pdf_upload` | File uploaded | conversion | `/app/upload/page.js` |
| `pdf_processed` | File processing complete | feature_usage | `/app/upload/page.js` |
| `export_excel` | Excel export | conversion | `/app/api/export/route.js` |
| `export_csv` | CSV export | conversion | `/app/api/export/route.js` |
| `export_google_sheets` | Google Sheets export | conversion | `/app/api/export/route.js` |
| `ai_chat_query` | AI chat query | feature_usage | `/app/api/chat/query/route.js` |
| `user_signup` | User signs up | conversion | `/app/auth/signup/page.js` |

### Adding New Events

To track a new event in your code:

```javascript
import analyticsService from '@/lib/analytics/analytics-service'

// Basic event
analyticsService.trackEvent('event_name', 'category', 'label', value, metadata)

// Conversion event (helper)
analyticsService.trackConversion('subscription_created', {
  plan: 'premium',
  amount: 29.99
})

// Feature usage (helper)
analyticsService.trackFeatureUsage('xero_export', {
  organization_id: 'abc123'
})
```

---

## A/B Testing Guide

### Using A/B Tests in Components

```javascript
import abTesting, { useABTest } from '@/lib/analytics/ab-testing'

function MyComponent() {
  const variant = useABTest('pricing_cta_text')

  const handleAction = () => {
    // Track conversion when user completes desired action
    abTesting.trackConversion('pricing_cta_text')
    // ... proceed with action
  }

  return (
    <Button onClick={handleAction}>
      {variant === 'A' ? 'Start Free Trial' : 'Get Started Now'}
    </Button>
  )
}
```

### Defining New Experiments

Edit `/src/lib/analytics/ab-testing.js`:

```javascript
abTesting.defineExperiment('my_experiment', {
  variants: ['A', 'B', 'C'],       // Variant names
  weights: [40, 40, 20],           // Traffic split (must sum to 100)
  description: 'Test three different homepage layouts'
})
```

### Analyzing A/B Test Results

```sql
-- Get exposure counts (how many users saw each variant)
SELECT
  metadata->>'experiment' as experiment,
  metadata->>'variant' as variant,
  COUNT(DISTINCT visitor_id) as unique_visitors
FROM analytics_events
WHERE event_name = 'ab_test_exposure'
GROUP BY experiment, variant;

-- Get conversion counts
SELECT
  metadata->>'experiment' as experiment,
  metadata->>'variant' as variant,
  COUNT(*) as conversions,
  COUNT(DISTINCT visitor_id) as unique_converters
FROM analytics_events
WHERE event_name = 'ab_test_conversion'
GROUP BY experiment, variant;

-- Calculate conversion rate
WITH exposures AS (
  SELECT
    metadata->>'experiment' as experiment,
    metadata->>'variant' as variant,
    COUNT(DISTINCT visitor_id) as exposed_users
  FROM analytics_events
  WHERE event_name = 'ab_test_exposure'
  GROUP BY experiment, variant
),
conversions AS (
  SELECT
    metadata->>'experiment' as experiment,
    metadata->>'variant' as variant,
    COUNT(DISTINCT visitor_id) as converted_users
  FROM analytics_events
  WHERE event_name = 'ab_test_conversion'
  GROUP BY experiment, variant
)
SELECT
  e.experiment,
  e.variant,
  e.exposed_users,
  COALESCE(c.converted_users, 0) as converted_users,
  ROUND(
    COALESCE(c.converted_users, 0)::numeric /
    NULLIF(e.exposed_users, 0) * 100,
    2
  ) as conversion_rate_percent
FROM exposures e
LEFT JOIN conversions c
  ON e.experiment = c.experiment
  AND e.variant = c.variant
ORDER BY e.experiment, e.variant;
```

---

## Conversion Funnel Tracking

### Using the Funnel Tracker

```javascript
import { trackFunnelStep, FUNNELS } from '@/lib/analytics/funnel-tracker'

// Track a funnel step
trackFunnelStep('onboarding', 'visited_landing')
trackFunnelStep('onboarding', 'completed_signup', { plan: 'free' })
```

### Predefined Funnels

The system includes these funnels:

1. **Onboarding**: visited_landing → started_signup → completed_signup → verified_email → visited_dashboard

2. **First Conversion**: viewed_upload_page → uploaded_file → processed_file → viewed_results → exported_data

3. **Subscription**: viewed_pricing → selected_plan → started_checkout → completed_payment → subscription_active

4. **AI Adoption**: viewed_ai_features → first_ai_processing → viewed_ai_insights → used_ai_chat → ai_power_user

### Analyzing Funnel Data

The admin dashboard includes a "Conversion Funnel" tab that shows:
- Step completion rates
- Drop-off percentages between steps
- Visual progress bars

You can also query directly:

```sql
SELECT * FROM get_conversion_funnel(
  NOW() - INTERVAL '30 days',
  NOW()
);
```

---

## Troubleshooting

### Issue: No data appears in admin dashboard

**Solutions:**
1. Check that migration was run successfully
2. Verify RLS policies allow your user to read data
3. Check browser console for errors
4. Ensure you've navigated around the app to generate data

```sql
-- Temporarily disable RLS to test if it's the issue
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- Check if data exists
SELECT COUNT(*) FROM page_views;
SELECT COUNT(*) FROM analytics_events;
```

### Issue: "Access Denied" on /admin/analytics

**Solutions:**
1. Verify your user ID is in `ADMIN_USER_IDS` array in `/src/app/admin/layout.js`
2. Check that you're logged in
3. Clear browser cache and cookies
4. Check browser console for auth errors

### Issue: Events not being tracked

**Solutions:**
1. Check browser console for `[Analytics]` logs
2. Verify analyticsService is imported correctly
3. Check that analytics service initialized successfully
4. Verify database connection

```javascript
// Test in browser console
import analyticsService from '@/lib/analytics/analytics-service'
analyticsService.trackEvent('test_event', 'test', 'Testing', 1, { test: true })
```

### Issue: Charts not rendering

**Solutions:**
1. Verify recharts is installed: `npm install recharts`
2. Check for JavaScript errors in console
3. Verify data format matches what charts expect
4. Try a different date range (maybe no data in selected range)

### Issue: Visitor ID not persisting

**Solutions:**
1. Check that localStorage is enabled in browser
2. Verify visitor ID is being generated:
   ```javascript
   console.log('Visitor ID:', localStorage.getItem('sd_visitor_id'))
   ```
3. Check that third-party cookies aren't blocking localStorage

---

## Performance Considerations

### Database Indexes

The migration creates these indexes for optimal performance:

- `idx_page_views_user_id`
- `idx_page_views_session_id`
- `idx_page_views_visitor_id`
- `idx_page_views_page_path`
- `idx_page_views_created_at`
- `idx_analytics_events_event_name`
- `idx_analytics_events_created_at`

### Data Retention

Consider implementing data retention policies:

```sql
-- Delete page views older than 90 days
DELETE FROM page_views
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete sessions older than 90 days
DELETE FROM user_sessions
WHERE started_at < NOW() - INTERVAL '90 days';
```

Set up a cron job to run this monthly.

### Archiving Old Data

For long-term storage, consider archiving to a separate table:

```sql
-- Create archive table
CREATE TABLE page_views_archive AS TABLE page_views WITH NO DATA;

-- Move old data
INSERT INTO page_views_archive
SELECT * FROM page_views
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM page_views
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## Next Steps

1. **Set up automated reports**: Create a scheduled function to email weekly analytics summaries
2. **Add more custom events**: Track specific features you want to measure
3. **Create custom dashboards**: Build specialized views for different metrics
4. **Implement alerts**: Get notified when metrics cross thresholds
5. **A/B test key features**: Use the A/B testing framework to optimize conversions

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the CLAUDE.md file for project context
3. Check browser console and database logs for errors
4. Verify all migrations ran successfully

---

**Last Updated:** January 2025
**Analytics System Version:** v1.0
