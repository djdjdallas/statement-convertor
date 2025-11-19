# QuickBooks Integration - Implementation Plan

## Executive Summary
Add QuickBooks Online integration to Statement Desk, enabling users to automatically sync their processed bank statement transactions to QuickBooks. Leverage existing AI categorization and merchant normalization to provide superior auto-mapping compared to competitors.

**Timeline**: 4-6 weeks
**Effort**: ~120-160 hours
**Risk Level**: Medium
**ROI**: High (major enterprise feature, competitive differentiator)

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Implementation Phases](#implementation-phases)
4. [Technical Specifications](#technical-specifications)
5. [Testing Strategy](#testing-strategy)
6. [Rollout Plan](#rollout-plan)
7. [Risk Mitigation](#risk-mitigation)

---

## Architecture Overview

### High-Level Flow
```
User Uploads PDF → AI Processing → Review Transactions →
Connect QuickBooks → Map Accounts/Categories → Sync to QuickBooks →
Monitor Sync Status → Handle Conflicts
```

### Components to Build

#### 1. Authentication Layer
- OAuth 2.0 flow handler
- Token storage and refresh mechanism
- Connection status management

#### 2. Data Mapping Engine
- Category → Chart of Accounts mapping
- Merchant → Vendor/Customer matching
- Transaction format conversion

#### 3. Sync Service
- Bulk transaction upload
- Queue management
- Retry logic with exponential backoff
- Webhook handler for QB events

#### 4. UI Components
- Connection setup wizard
- Account mapping interface
- Sync dashboard
- Transaction review/conflict resolution

---

## Database Schema Changes

### New Tables

```sql
-- QuickBooks connections per user
CREATE TABLE quickbooks_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL, -- QuickBooks realm ID
    company_name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    sync_settings JSONB DEFAULT '{}',
    UNIQUE(user_id, company_id)
);

-- Category to QuickBooks account mappings
CREATE TABLE quickbooks_category_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    connection_id UUID REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subcategory TEXT,
    qb_account_id TEXT NOT NULL,
    qb_account_name TEXT,
    qb_account_type TEXT, -- Expense, Income, Asset, etc.
    auto_mapped BOOLEAN DEFAULT FALSE, -- AI suggested vs manual
    confidence INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id, category, subcategory)
);

-- Merchant to QuickBooks vendor/customer mappings
CREATE TABLE quickbooks_merchant_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    connection_id UUID REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
    normalized_merchant TEXT NOT NULL,
    qb_vendor_id TEXT,
    qb_vendor_name TEXT,
    qb_customer_id TEXT,
    qb_customer_name TEXT,
    mapping_type TEXT CHECK (mapping_type IN ('vendor', 'customer', 'none')),
    auto_created BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id, normalized_merchant)
);

-- Sync job tracking
CREATE TABLE quickbooks_sync_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    connection_id UUID REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')) DEFAULT 'pending',
    total_transactions INTEGER DEFAULT 0,
    synced_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    error_log JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    sync_metadata JSONB DEFAULT '{}'
);

-- Individual transaction sync status
CREATE TABLE quickbooks_transaction_syncs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sync_job_id UUID REFERENCES quickbooks_sync_jobs(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    qb_transaction_id TEXT, -- QuickBooks entity ID
    qb_transaction_type TEXT, -- JournalEntry, Purchase, Deposit, etc.
    status TEXT CHECK (status IN ('pending', 'synced', 'failed', 'skipped')) DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    synced_at TIMESTAMPTZ,
    qb_link TEXT, -- Deep link to QB transaction
    UNIQUE(transaction_id, sync_job_id)
);

-- Sync queue for background processing
CREATE TABLE quickbooks_sync_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sync_job_id UUID REFERENCES quickbooks_sync_jobs(id) ON DELETE CASCADE,
    transaction_ids UUID[] NOT NULL,
    priority INTEGER DEFAULT 5,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    processing BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook events from QuickBooks
CREATE TABLE quickbooks_webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    connection_id UUID REFERENCES quickbooks_connections(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_qb_connections_user ON quickbooks_connections(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_qb_category_mappings_connection ON quickbooks_category_mappings(connection_id);
CREATE INDEX idx_qb_merchant_mappings_connection ON quickbooks_merchant_mappings(connection_id);
CREATE INDEX idx_qb_sync_jobs_status ON quickbooks_sync_jobs(status, started_at);
CREATE INDEX idx_qb_transaction_syncs_job ON quickbooks_transaction_syncs(sync_job_id, status);
CREATE INDEX idx_qb_sync_queue_scheduled ON quickbooks_sync_queue(scheduled_for) WHERE NOT processing AND processed_at IS NULL;
CREATE INDEX idx_qb_webhooks_unprocessed ON quickbooks_webhooks(received_at) WHERE NOT processed;
```

### Row Level Security (RLS)

```sql
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own QB connections" ON quickbooks_connections
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE quickbooks_category_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own mappings" ON quickbooks_category_mappings
    FOR ALL USING (
        connection_id IN (SELECT id FROM quickbooks_connections WHERE user_id = auth.uid())
    );

-- Repeat for other tables...
```

---

## Implementation Phases

### Phase 1: Foundation & OAuth (Week 1)
**Goal**: Establish QuickBooks connection infrastructure

#### Tasks:
1. **QuickBooks App Setup** (4 hours)
   - Create Intuit Developer account
   - Register OAuth 2.0 app
   - Configure redirect URIs
   - Obtain client ID/secret
   - Set up sandbox environment

2. **Database Setup** (4 hours)
   - Run migration scripts
   - Set up RLS policies
   - Create indexes
   - Test with sample data

3. **OAuth Implementation** (16 hours)
   - Install dependencies (`intuit-oauth`, `node-quickbooks`)
   - Create OAuth service (`src/lib/quickbooks/auth-service.js`)
   - Implement authorization flow
   - Token storage in database
   - Automatic token refresh
   - Connection status checks

4. **API Route Setup** (8 hours)
   ```
   POST   /api/quickbooks/connect        - Initiate OAuth
   GET    /api/quickbooks/callback       - OAuth callback handler
   POST   /api/quickbooks/disconnect     - Revoke connection
   GET    /api/quickbooks/status         - Check connection status
   POST   /api/quickbooks/refresh-token  - Manual token refresh
   ```

5. **Basic UI** (8 hours)
   - Settings page section for QB integration
   - "Connect to QuickBooks" button
   - Connection status indicator
   - Disconnect option

**Deliverable**: Users can connect/disconnect QuickBooks
**Success Criteria**: Successfully authenticate and store tokens

---

### Phase 2: Data Mapping Engine (Week 2)
**Goal**: Intelligent mapping between Statement Desk and QuickBooks data models

#### Tasks:
1. **QuickBooks Data Fetcher** (12 hours)
   - Service to fetch Chart of Accounts
   - Fetch existing vendors/customers
   - Cache QB data in database/Redis
   - Handle pagination and rate limits
   - API endpoints:
   ```
   GET /api/quickbooks/accounts           - Fetch all accounts
   GET /api/quickbooks/vendors            - Fetch vendors
   GET /api/quickbooks/customers          - Fetch customers
   POST /api/quickbooks/sync-metadata     - Refresh QB data cache
   ```

2. **AI-Powered Auto-Mapping** (16 hours)
   - Create mapping service (`src/lib/quickbooks/mapping-service.js`)
   - Use Claude to suggest category → account mappings
   - Analyze merchant names → vendor matching
   - Generate confidence scores
   - Prompt template:
   ```javascript
   const prompt = `
   Given these transaction categories: ${categories}
   And these QuickBooks accounts: ${qbAccounts}
   Suggest the best mapping with confidence scores.
   Consider standard accounting practices.
   `;
   ```

3. **Mapping UI Components** (16 hours)
   - `src/components/quickbooks/AccountMappingWizard.js`
   - Category → Account dropdown selectors
   - Merchant → Vendor mapping interface
   - AI suggestions with confidence indicators
   - Bulk accept/reject AI mappings
   - Search and filter for large account lists
   - Preview transaction distribution per mapping

4. **Mapping API Routes** (8 hours)
   ```
   GET    /api/quickbooks/mappings                    - Get all mappings
   POST   /api/quickbooks/mappings/categories        - Save category mappings
   POST   /api/quickbooks/mappings/merchants         - Save merchant mappings
   POST   /api/quickbooks/mappings/auto-suggest     - Get AI suggestions
   DELETE /api/quickbooks/mappings/:id              - Remove mapping
   POST   /api/quickbooks/mappings/validate         - Validate before sync
   ```

5. **Mapping Validation** (8 hours)
   - Check all categories have mappings before sync
   - Warn about unmapped merchants
   - Validate QB account types match transaction types
   - Show mapping coverage percentage

**Deliverable**: Complete mapping interface with AI suggestions
**Success Criteria**: 90%+ categories auto-mapped correctly

---

### Phase 3: Sync Engine (Week 3-4)
**Goal**: Reliable, scalable transaction syncing to QuickBooks

#### Tasks:
1. **Transaction Converter** (16 hours)
   - Service to convert Statement Desk transactions to QB format
   - `src/lib/quickbooks/transaction-converter.js`
   - Handle different QB transaction types:
     - **Deposits** (positive transactions)
     - **Purchases** (negative transactions)
     - **Journal Entries** (complex scenarios)
   - Apply mappings (accounts, vendors)
   - Format validation
   - Example conversion:
   ```javascript
   // Statement Desk transaction
   {
     date: "2025-01-15",
     description: "Walmart",
     amount: -125.50,
     category: "Groceries",
     normalized_merchant: "Walmart"
   }

   // QuickBooks Purchase
   {
     TxnDate: "2025-01-15",
     EntityRef: { value: "123", name: "Walmart" }, // Vendor
     Line: [{
       Amount: 125.50,
       DetailType: "AccountBasedExpenseLineDetail",
       AccountBasedExpenseLineDetail: {
         AccountRef: { value: "45", name: "Groceries Expense" }
       }
     }],
     PaymentType: "Cash"
   }
   ```

2. **Sync Service Core** (20 hours)
   - `src/lib/quickbooks/sync-service.js`
   - Batch processing (25 transactions per batch to stay under rate limits)
   - Queue management using database queue table
   - Progress tracking
   - Key features:
     - Duplicate detection (check if already synced)
     - Partial sync support (resume on failure)
     - Dry run mode (validate without syncing)
     - Transaction grouping by date/type
   - Rate limiting: 400 requests/minute max
   - Exponential backoff on errors

3. **Error Handling & Retry Logic** (12 hours)
   - Categorize error types:
     - **Retryable**: Rate limit, timeout, server errors
     - **Non-retryable**: Invalid data, missing mappings, permission errors
   - Retry strategy: 3 attempts with 5s, 15s, 45s delays
   - Error logging with context
   - User-friendly error messages
   - Partial success handling (some transactions sync, others fail)

4. **Sync API Routes** (12 hours)
   ```
   POST   /api/quickbooks/sync/start          - Start sync job for file
   GET    /api/quickbooks/sync/status/:jobId  - Get job progress
   POST   /api/quickbooks/sync/retry/:jobId   - Retry failed transactions
   POST   /api/quickbooks/sync/cancel/:jobId  - Cancel in-progress job
   GET    /api/quickbooks/sync/history        - List all sync jobs
   POST   /api/quickbooks/sync/dry-run        - Validate without syncing
   ```

5. **Background Worker** (16 hours)
   - Create worker process for queue processing
   - Use Vercel Cron or separate Node process
   - Process sync queue every minute
   - Handle long-running syncs (>5min)
   - Graceful shutdown on deployment
   - Health check endpoint
   - Worker script: `src/workers/quickbooks-sync-worker.js`

6. **Webhook Handler** (12 hours)
   - Receive QuickBooks webhook events
   - Verify webhook signatures
   - Handle transaction updates/deletions
   - Update sync status based on QB changes
   - API endpoint:
   ```
   POST /api/quickbooks/webhooks             - Receive QB events
   ```
   - Event types to handle:
     - Transaction created (already synced by us?)
     - Transaction updated (need to update our records?)
     - Transaction deleted (mark as unsynced)

**Deliverable**: Working sync engine with robust error handling
**Success Criteria**:
- Successfully sync 1000+ transactions
- <1% error rate on valid data
- Handle rate limits gracefully

---

### Phase 4: User Interface (Week 4-5)
**Goal**: Intuitive UX for managing QuickBooks integration

#### Components to Build:

1. **Connection Setup Wizard** (12 hours)
   - `src/components/quickbooks/SetupWizard.js`
   - Multi-step wizard:
     1. Introduction & benefits
     2. QuickBooks authentication
     3. Company selection (if multiple)
     4. Initial data fetch (accounts, vendors)
     5. Account mapping (can defer to later)
     6. Completion & next steps
   - Progress indicator
   - Ability to save and resume

2. **Sync Dashboard** (16 hours)
   - `src/components/quickbooks/SyncDashboard.js`
   - Overview cards:
     - Connection status
     - Last sync time
     - Total transactions synced
     - Pending transactions
     - Recent errors
   - Sync history table with:
     - Job date/time
     - File name
     - Status badge
     - Transaction counts (total, success, failed)
     - Action buttons (view details, retry)
   - Quick actions:
     - Sync all unsynced files
     - Refresh QB data
     - Re-run auto-mapping

3. **Transaction Review Interface** (16 hours)
   - `src/components/quickbooks/TransactionReview.js`
   - List view with filters:
     - Sync status (synced, pending, failed)
     - Confidence level
     - Date range
     - Category
   - Per-transaction details:
     - Original transaction data
     - QB mapping preview
     - Confidence indicators
     - Error messages (if failed)
     - Link to QB transaction (if synced)
   - Bulk actions:
     - Select and sync multiple
     - Exclude from sync
     - Fix mappings
   - Individual actions:
     - Edit mapping before sync
     - View sync log
     - Retry failed

4. **Sync Settings Panel** (8 hours)
   - `src/components/quickbooks/SyncSettings.js`
   - Options:
     - Auto-sync on file upload (toggle)
     - Minimum confidence threshold (slider: 70-95%)
     - Transaction date handling (use statement date vs. today)
     - Default expense account (fallback)
     - Sync historical data (date range picker)
     - Email notifications (success/failure)
   - Save to `quickbooks_connections.sync_settings`

5. **Error Resolution UI** (12 hours)
   - `src/components/quickbooks/ErrorResolution.js`
   - Grouped error display by type:
     - Missing mappings
     - Invalid dates
     - Duplicate transactions
     - Permission errors
   - Suggested fixes with one-click apply:
     - "Create vendor Walmart in QB"
     - "Map 'Groceries' to 'Food & Beverage'"
     - "Skip duplicate transaction"
   - Bulk resolution actions

6. **Integration into Existing Pages** (12 hours)
   - Add QB sync button to file preview page
   - Show sync status badges on transaction lists
   - Add QB tab to analytics dashboard
   - Update navigation with QB settings link
   - Onboarding tooltip for new feature

**Deliverable**: Complete UI for QB integration
**Success Criteria**: User can set up and manage QB sync without documentation

---

### Phase 5: Testing & Polish (Week 5-6)
**Goal**: Production-ready, tested integration

#### Tasks:

1. **Unit Tests** (16 hours)
   - Test OAuth flow (mocked)
   - Test transaction conversion logic
   - Test mapping algorithms
   - Test error handling
   - Test retry logic
   - Coverage target: 80%+

2. **Integration Tests** (16 hours)
   - Test full sync flow with QB sandbox
   - Test with multiple QB companies
   - Test rate limit handling
   - Test webhook processing
   - Test concurrent sync jobs
   - Test partial failures

3. **End-to-End Tests** (12 hours)
   - Use Playwright/Cypress
   - Test user flows:
     - Connect QB account
     - Complete mapping wizard
     - Sync transactions
     - Handle errors
     - Disconnect account

4. **Performance Testing** (8 hours)
   - Test with large datasets (10k+ transactions)
   - Measure sync throughput
   - Identify bottlenecks
   - Optimize database queries
   - Test memory usage of worker

5. **Security Audit** (8 hours)
   - Review token storage (ensure encrypted)
   - Test RLS policies
   - Validate webhook signatures
   - Check for injection vulnerabilities
   - Review API authentication
   - Test token refresh edge cases

6. **Documentation** (12 hours)
   - User guide: "How to Connect QuickBooks"
   - Troubleshooting guide
   - FAQ section
   - Developer documentation
   - API documentation (if exposing to users)
   - Update CLAUDE.md with QB integration details

7. **UI/UX Polish** (12 hours)
   - Loading states and skeletons
   - Error message improvements
   - Responsive design testing
   - Accessibility audit (WCAG AA)
   - Animation and micro-interactions
   - Empty states with helpful CTAs

8. **Beta Testing** (1 week)
   - Recruit 5-10 beta users
   - Provide QuickBooks sandbox accounts
   - Monitor usage and errors
   - Collect feedback
   - Iterate on pain points

**Deliverable**: Production-ready integration
**Success Criteria**:
- Zero critical bugs
- 95%+ test coverage
- Positive beta user feedback

---

## Technical Specifications

### Dependencies

```json
{
  "dependencies": {
    "intuit-oauth": "^4.1.0",
    "node-quickbooks": "^2.0.33",
    "ioredis": "^5.3.2"
  },
  "devDependencies": {
    "@types/node-quickbooks": "^2.0.8"
  }
}
```

### Environment Variables

```bash
# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=your_client_id
QUICKBOOKS_CLIENT_SECRET=your_client_secret
QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox # or production
QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN=your_webhook_token

# Rate Limiting (optional)
REDIS_URL=redis://localhost:6379 # For distributed rate limiting
```

### API Rate Limits

QuickBooks Online API Limits:
- **Burst**: 500 requests per minute
- **Sustained**: Approximately 100 requests per minute average
- **Daily**: No hard limit, but monitoring recommended

Our Strategy:
- Batch size: 25 transactions per batch
- Delay between batches: 2 seconds
- Estimated throughput: 750 transactions/minute (well under limit)
- Use Redis-based rate limiter for multi-instance deployments

### Error Codes

Standardized error codes for frontend:

```javascript
const QB_ERROR_CODES = {
  // Authentication
  AUTH_EXPIRED: 'qb_auth_expired',
  AUTH_INVALID: 'qb_auth_invalid',
  AUTH_REVOKED: 'qb_auth_revoked',

  // Mapping
  MAPPING_INCOMPLETE: 'qb_mapping_incomplete',
  MAPPING_INVALID: 'qb_mapping_invalid',

  // Sync
  SYNC_RATE_LIMIT: 'qb_rate_limit',
  SYNC_DUPLICATE: 'qb_duplicate',
  SYNC_VALIDATION: 'qb_validation_error',
  SYNC_PERMISSION: 'qb_permission_denied',

  // System
  NETWORK_ERROR: 'qb_network_error',
  QB_SERVICE_DOWN: 'qb_service_unavailable'
};
```

### Data Transformation Examples

#### Category Mapping Logic
```javascript
// Auto-mapping algorithm using AI
async function autoMapCategories(categories, qbAccounts) {
  const prompt = `
    Map these transaction categories to QuickBooks accounts.

    Categories: ${JSON.stringify(categories)}

    Available QuickBooks Accounts:
    ${qbAccounts.map(a => `${a.Name} (${a.AccountType})`).join('\n')}

    Return JSON array with format:
    [
      {
        "category": "Groceries",
        "qb_account_id": "45",
        "qb_account_name": "Food & Beverage",
        "confidence": 95,
        "reasoning": "Standard mapping for grocery expenses"
      }
    ]

    Use accounting best practices. Prioritize Expense accounts for spending categories.
  `;

  const result = await claude.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  return JSON.parse(result.content[0].text);
}
```

#### Transaction Conversion
```javascript
function convertToQuickBooksTransaction(transaction, mappings) {
  const isDeposit = transaction.amount > 0;
  const amount = Math.abs(transaction.amount);

  if (isDeposit) {
    // Create Deposit
    return {
      TxnDate: transaction.date,
      DepositToAccountRef: { value: mappings.bankAccountId },
      Line: [{
        Amount: amount,
        DetailType: "DepositLineDetail",
        DepositLineDetail: {
          AccountRef: {
            value: mappings.categoryMapping.qb_account_id
          },
          Entity: transaction.normalized_merchant ? {
            EntityRef: {
              value: mappings.merchantMapping.qb_customer_id,
              type: "Customer"
            }
          } : undefined
        },
        Description: transaction.description
      }]
    };
  } else {
    // Create Purchase (expense)
    return {
      TxnDate: transaction.date,
      PaymentType: "Cash",
      AccountRef: { value: mappings.bankAccountId },
      EntityRef: transaction.normalized_merchant ? {
        value: mappings.merchantMapping.qb_vendor_id,
        type: "Vendor"
      } : undefined,
      Line: [{
        Amount: amount,
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value: mappings.categoryMapping.qb_account_id
          }
        },
        Description: transaction.description
      }]
    };
  }
}
```

---

## Testing Strategy

### Test Environments

1. **Local Development**
   - Use QuickBooks Sandbox
   - Mock data for unit tests
   - Local Supabase instance

2. **Staging**
   - QuickBooks Sandbox
   - Production-like data volume
   - Real API calls (sandboxed)

3. **Production**
   - QuickBooks Production API
   - Gradual rollout (10% → 50% → 100%)
   - Enhanced monitoring

### Test Cases

#### Critical Path Tests
- [ ] User connects QB account successfully
- [ ] AI suggests accurate category mappings
- [ ] Manual mapping override works
- [ ] Sync 100 transactions successfully
- [ ] Handle rate limit gracefully
- [ ] Retry failed transactions
- [ ] Token refresh works automatically
- [ ] User disconnects QB account

#### Edge Cases
- [ ] Sync with no mappings (should block)
- [ ] Sync with duplicate transactions (should detect)
- [ ] Sync with invalid QB account (should fail gracefully)
- [ ] Token expires during sync (should refresh and continue)
- [ ] User deletes file during sync (should cancel)
- [ ] Very large file (10k+ transactions)
- [ ] Special characters in merchant names
- [ ] Transactions with $0 amount
- [ ] Future-dated transactions

#### Error Scenarios
- [ ] QB API returns 500 error
- [ ] Network timeout mid-sync
- [ ] Invalid token (user revoked access in QB)
- [ ] User has multiple QB companies
- [ ] Insufficient QB permissions
- [ ] Webhook signature verification fails

### Automated Testing

```javascript
// Example integration test
describe('QuickBooks Sync', () => {
  let qbConnection;
  let testFile;

  beforeAll(async () => {
    // Set up test QB connection
    qbConnection = await createTestConnection();
    testFile = await uploadTestPDF();
  });

  test('should sync transactions successfully', async () => {
    // Create mappings
    await createTestMappings(qbConnection.id);

    // Start sync
    const job = await startSync(testFile.id, qbConnection.id);

    // Wait for completion
    await waitForJobCompletion(job.id);

    // Verify
    const jobStatus = await getSyncJobStatus(job.id);
    expect(jobStatus.status).toBe('completed');
    expect(jobStatus.synced_transactions).toBe(jobStatus.total_transactions);

    // Verify in QuickBooks
    const qbTransactions = await fetchQBTransactions(qbConnection);
    expect(qbTransactions.length).toBeGreaterThan(0);
  });
});
```

---

## Rollout Plan

### Phase 1: Internal Beta (Week 6)
- Enable for admin users only
- Test with real QB accounts (not sandbox)
- Monitor closely for errors
- Quick iteration on issues

### Phase 2: Closed Beta (Week 7)
- Invite 10-20 power users
- Provide onboarding call/video
- Collect detailed feedback
- Monitor error rates and performance

### Phase 3: Soft Launch (Week 8)
- Enable for all paid users
- Add feature announcement banner
- Create help center articles
- Monitor support tickets

### Phase 4: Full Launch (Week 9+)
- Marketing announcement
- Email to all users
- Blog post / case study
- Social media promotion
- Consider as upsell feature for lower tiers

### Success Metrics
- **Adoption**: 20% of paid users connect QB within 30 days
- **Retention**: 80% of connected users sync at least monthly
- **Satisfaction**: NPS 50+ for QB feature
- **Technical**: <2% error rate on syncs
- **Support**: <5 tickets per 100 syncs

---

## Risk Mitigation

### Risk 1: QuickBooks API Changes
**Impact**: High | **Probability**: Medium

**Mitigation**:
- Subscribe to Intuit developer newsletter
- Version API calls explicitly
- Build abstraction layer over QB SDK
- Maintain test suite for API compatibility
- Budget time for API migration

### Risk 2: Rate Limit Issues at Scale
**Impact**: Medium | **Probability**: High

**Mitigation**:
- Implement aggressive rate limiting
- Use queue-based processing
- Provide users with sync time estimates
- Consider Redis-based distributed rate limiter
- Implement priority queue (premium users first?)

### Risk 3: Data Mapping Errors
**Impact**: High | **Probability**: Medium

**Mitigation**:
- Always show preview before sync
- Dry-run mode by default
- Easy undo/resync functionality
- Detailed error messages with fixes
- Manual override for all mappings

### Risk 4: Token Management Issues
**Impact**: High | **Probability**: Low

**Mitigation**:
- Automated token refresh
- Proactive token expiry warnings
- Clear re-authentication flow
- Log all auth failures
- Test token edge cases extensively

### Risk 5: Support Burden
**Impact**: Medium | **Probability**: High

**Mitigation**:
- Comprehensive documentation
- Video tutorials
- Self-service troubleshooting tools
- In-app guidance and tooltips
- FAQ section with common issues

### Risk 6: Scope Creep
**Impact**: Medium | **Probability**: High

**Mitigation**:
- Strict MVP scope (defined below)
- Defer nice-to-have features to v2
- Time-box each phase
- Regular stakeholder check-ins
- Feature flag non-critical components

---

## MVP Scope vs. V2 Features

### MVP (Must Have)
✅ OAuth connection to QuickBooks
✅ Category to Account mapping (manual + AI suggestions)
✅ Basic transaction sync (Purchases and Deposits)
✅ Sync status tracking and error handling
✅ Retry failed transactions
✅ Basic settings (auto-sync toggle, confidence threshold)

### V2 (Nice to Have)
⏳ Bi-directional sync (QB → Statement Desk)
⏳ Reconciliation matching
⏳ Sync invoices and bills
⏳ Multi-currency support
⏳ Custom field mapping
⏳ Scheduled syncs (weekly/monthly auto-sync)
⏳ Advanced duplicate detection
⏳ Sync to specific QB classes/locations
⏳ Batch operations (sync multiple files at once)
⏳ QB Desktop support (in addition to Online)

### V3 (Future)
🔮 Other accounting integrations (Xero, FreshBooks)
🔮 Two-way chat integration ("sync these transactions to QB")
🔮 AI-powered reconciliation assistant
🔮 Automated monthly closing workflows
🔮 Custom sync rules engine

---

## Development Resources

### QuickBooks Documentation
- [QuickBooks API Explorer](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
- [OAuth 2.0 Guide](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [API Rate Limits](https://developer.intuit.com/app/developer/qbo/docs/develop/best-practices/rate-limiting)
- [Webhooks Setup](https://developer.intuit.com/app/developer/qbo/docs/develop/webhooks)

### Libraries
- [`intuit-oauth`](https://github.com/intuit/oauth-jsclient) - Official OAuth library
- [`node-quickbooks`](https://github.com/mcohen01/node-quickbooks) - Community QB API wrapper

### Existing Integrations to Study
- Stripe → QB integration (for UX patterns)
- Expensify → QB (mapping strategies)
- Gusto → QB (error handling examples)

---

## Cost Analysis

### Development Costs
- Engineering time: 120-160 hours @ $100/hr = **$12,000-$16,000**
- Testing/QA: 40 hours @ $75/hr = **$3,000**
- Design/UX: 20 hours @ $100/hr = **$2,000**
- **Total**: **$17,000-$21,000**

### Ongoing Costs
- QuickBooks API: Free (no per-call costs)
- Additional database storage: ~$10/month
- Redis for rate limiting: $15/month (optional)
- Monitoring/logging: $20/month
- **Total**: **$45/month**

### Revenue Potential
- Assume 1000 paid users
- 20% adoption (200 users)
- Upsell opportunity: $10-20/mo premium feature
- **Monthly recurring revenue**: **$2,000-$4,000**
- **Break-even**: 5-10 months

### ROI Analysis
- High-value feature for business users
- Reduces churn (increases stickiness)
- Competitive advantage (most competitors don't have this)
- Enables expansion into SMB market
- Potential for white-label partnerships with accounting firms

---

## Support Plan

### Documentation to Create
1. **Getting Started Guide**
   - How to connect QuickBooks
   - Understanding account mappings
   - Your first sync

2. **Troubleshooting Guide**
   - Connection issues
   - Mapping errors
   - Sync failures
   - Token expiration

3. **FAQ**
   - Does this work with QB Desktop? (No, Online only for MVP)
   - How often should I sync? (User's choice)
   - Can I undo a sync? (Not automatically, but can delete in QB)
   - What if my accountant uses QB? (Perfect use case!)

4. **Video Tutorials**
   - 2-minute overview
   - Complete setup walkthrough
   - Handling mapping errors

### Support Channels
- In-app chat (prioritize QB questions)
- Email support with 24hr SLA
- Help center with searchable articles
- Community forum for peer support

### Escalation Path
1. Tier 1: General support team (connection issues, basic questions)
2. Tier 2: Technical support (mapping issues, sync errors)
3. Tier 3: Engineering (API issues, bugs)

---

## Timeline Summary

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Foundation | OAuth working, database ready |
| 2 | Mapping | AI-powered mapping UI complete |
| 3-4 | Sync Engine | Reliable transaction syncing |
| 4-5 | UI | Complete user interface |
| 5-6 | Testing | Production-ready code |
| 6 | Internal Beta | Admin users testing |
| 7 | Closed Beta | Power users feedback |
| 8 | Soft Launch | All paid users |
| 9+ | Full Launch | Marketing push |

---

## Next Steps

### Immediate Actions (This Week)
1. [ ] Create QuickBooks Developer account
2. [ ] Register OAuth application
3. [ ] Set up sandbox environment
4. [ ] Install dependencies (`intuit-oauth`, `node-quickbooks`)
5. [ ] Create database migration files
6. [ ] Set up project structure (`src/lib/quickbooks/`)

### Decision Points
- **Choice 1**: Use existing worker infrastructure or build dedicated QB worker?
  - **Recommendation**: Dedicated worker for isolation and scaling
- **Choice 2**: Redis for rate limiting or in-memory?
  - **Recommendation**: Start in-memory, add Redis if scaling issues
- **Choice 3**: Support QB Desktop in MVP?
  - **Recommendation**: No - focus on QB Online only
- **Choice 4**: Make QB integration free or paid feature?
  - **Recommendation**: Free for paid tiers, consider as upsell for basic tier

### Stakeholder Approvals Needed
- [ ] Budget approval for development time
- [ ] Decision on pricing strategy
- [ ] Legal review of data handling
- [ ] Marketing plan for launch

---

## Appendix: Code Structure

```
src/
├── lib/
│   ├── quickbooks/
│   │   ├── auth-service.js           # OAuth flow
│   │   ├── api-client.js             # QB API wrapper
│   │   ├── mapping-service.js        # Auto-mapping logic
│   │   ├── transaction-converter.js  # Format conversion
│   │   ├── sync-service.js           # Core sync engine
│   │   ├── webhook-handler.js        # Webhook processing
│   │   └── rate-limiter.js           # Rate limiting
│   └── analytics/
│       └── quickbooks-analytics.js   # QB-specific analytics
├── components/
│   └── quickbooks/
│       ├── SetupWizard.js
│       ├── SyncDashboard.js
│       ├── AccountMappingWizard.js
│       ├── TransactionReview.js
│       ├── SyncSettings.js
│       ├── ErrorResolution.js
│       └── ConnectionStatus.js
├── pages/
│   └── api/
│       └── quickbooks/
│           ├── connect.js
│           ├── callback.js
│           ├── disconnect.js
│           ├── status.js
│           ├── accounts.js
│           ├── mappings/
│           │   ├── categories.js
│           │   ├── merchants.js
│           │   └── auto-suggest.js
│           ├── sync/
│           │   ├── start.js
│           │   ├── status.js
│           │   ├── retry.js
│           │   └── history.js
│           └── webhooks.js
├── workers/
│   └── quickbooks-sync-worker.js     # Background processor
└── database/
    └── migrations/
        └── 20250118_quickbooks_integration.sql
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-18
**Author**: AI Implementation Plan
**Status**: Ready for Review
