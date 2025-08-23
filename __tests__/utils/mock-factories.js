// Factory functions for creating consistent mock data

export const MockFactory = {
  // Create a mock OAuth state
  oauthState: (overrides = {}) => ({
    state: 'mock-state-' + Math.random().toString(36).substr(2, 9),
    userId: 'test-user-id',
    redirectUrl: '/dashboard',
    scopes: ['drive.file', 'spreadsheets'],
    installationType: 'individual',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 minutes
    ...overrides
  }),

  // Create a mock file record
  file: (overrides = {}) => ({
    id: 'file-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    filename: 'statement-' + new Date().toISOString().split('T')[0] + '.pdf',
    original_filename: 'bank-statement.pdf',
    file_size: 1024000,
    status: 'pending',
    google_drive_id: null,
    google_sheets_id: null,
    ai_enhanced: false,
    extraction_method: 'traditional',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  // Create mock transactions
  transactions: (count = 5, fileId = 'test-file-id') => {
    const categories = ['Shopping', 'Food & Dining', 'Transportation', 'Income', 'Bills', 'Entertainment']
    const merchants = ['Walmart', 'Starbucks', 'Uber', 'Netflix', 'Amazon', 'Target']
    
    return Array.from({ length: count }, (_, i) => ({
      id: `txn-${i + 1}`,
      file_id: fileId,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `${merchants[i % merchants.length]} Purchase`,
      amount: i % 4 === 0 ? Math.random() * 1000 + 1000 : -(Math.random() * 200 + 10),
      category: categories[i % categories.length],
      subcategory: null,
      confidence: Math.floor(Math.random() * 30) + 70,
      normalized_merchant: merchants[i % merchants.length],
      ai_reasoning: 'Categorized based on merchant name',
      anomaly_data: null,
      created_at: new Date().toISOString()
    }))
  },

  // Create a mock subscription
  subscription: (tier = 'free', overrides = {}) => {
    const tiers = {
      free: {
        tier: 'free',
        conversions_limit: 5,
        features: ['basic_export', 'manual_upload']
      },
      pro: {
        tier: 'pro',
        conversions_limit: 100,
        features: ['basic_export', 'manual_upload', 'ai_insights', 'bulk_export']
      },
      enterprise: {
        tier: 'enterprise',
        conversions_limit: -1, // unlimited
        features: ['basic_export', 'manual_upload', 'ai_insights', 'bulk_export', 'api_access', 'priority_support']
      }
    }

    const base = tiers[tier] || tiers.free
    
    return {
      id: 'sub-' + Math.random().toString(36).substr(2, 9),
      user_id: 'test-user-id',
      stripe_subscription_id: tier === 'free' ? null : 'sub_' + Math.random().toString(36).substr(2, 9),
      ...base,
      conversions_used: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }
  },

  // Create mock Google Drive files
  driveFiles: (count = 3) => {
    const types = ['pdf', 'xlsx', 'csv']
    const names = ['January Statement', 'February Statement', 'March Statement']
    
    return Array.from({ length: count }, (_, i) => ({
      id: `drive-file-${i + 1}`,
      name: `${names[i % names.length]}.${types[i % types.length]}`,
      mimeType: i % 3 === 0 ? 'application/pdf' : 
                i % 3 === 1 ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                'text/csv',
      size: Math.floor(Math.random() * 5000000) + 100000,
      modifiedTime: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      webViewLink: `https://drive.google.com/file/d/drive-file-${i + 1}/view`,
      parents: ['root']
    }))
  },

  // Create mock API error
  apiError: (code = 500, message = 'Internal server error', details = {}) => ({
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  }),

  // Create mock batch processing job
  batchJob: (overrides = {}) => ({
    id: 'job-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    status: 'pending',
    total_files: 5,
    processed_files: 0,
    successful_files: 0,
    failed_files: 0,
    error_details: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  // Create mock workspace configuration
  workspaceConfig: (domain = 'example.com', overrides = {}) => ({
    domain,
    admin_email: `admin@${domain}`,
    installation_type: 'domain',
    installed_at: new Date().toISOString(),
    features: {
      bulk_processing: true,
      admin_controls: true,
      usage_analytics: true,
      custom_categories: false
    },
    limits: {
      daily_conversions: 1000,
      file_size_mb: 50,
      retention_days: 90
    },
    oauth_config: {
      client_id: 'workspace-client-id',
      scopes: ['drive.file', 'spreadsheets', 'admin.directory.user.readonly']
    },
    ...overrides
  }),

  // Create mock security event
  securityEvent: (type = 'login', overrides = {}) => ({
    id: 'event-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user-id',
    event_type: type,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    metadata: {
      success: true,
      method: 'google_oauth'
    },
    created_at: new Date().toISOString(),
    ...overrides
  })
}