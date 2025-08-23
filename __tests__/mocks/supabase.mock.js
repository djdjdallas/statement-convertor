// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {}
        }
      },
      error: null
    }),
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        }
      },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' }
      },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: { id: 'test-id' },
    error: null
  }),
  maybeSingle: jest.fn().mockResolvedValue({
    data: null,
    error: null
  })
}

// Mock Supabase admin client
export const mockSupabaseAdmin = {
  ...mockSupabaseClient,
  auth: {
    admin: {
      getUserById: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      })
    }
  }
}

// Mock createClient functions
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue(mockSupabaseClient)
}))

jest.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: mockSupabaseAdmin
}))

// Mock database responses
export const mockDatabaseResponses = {
  googleTokens: {
    valid: {
      id: 'token-id-1',
      user_id: 'test-user-id',
      access_token: 'encrypted-access-token',
      refresh_token: 'encrypted-refresh-token',
      expiry_date: new Date(Date.now() + 3600000).toISOString(),
      scope: 'drive.file spreadsheets',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    expired: {
      id: 'token-id-2',
      user_id: 'test-user-id',
      access_token: 'encrypted-expired-token',
      refresh_token: 'encrypted-refresh-token',
      expiry_date: new Date(Date.now() - 3600000).toISOString(),
      scope: 'drive.file spreadsheets',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  files: {
    processing: {
      id: 'file-id-1',
      user_id: 'test-user-id',
      filename: 'statement.pdf',
      status: 'processing',
      google_drive_id: 'drive-file-id',
      created_at: new Date().toISOString()
    },
    completed: {
      id: 'file-id-2',
      user_id: 'test-user-id',
      filename: 'statement.pdf',
      status: 'completed',
      google_drive_id: 'drive-file-id',
      ai_enhanced: true,
      created_at: new Date().toISOString()
    }
  },
  transactions: [
    {
      id: 'txn-1',
      file_id: 'file-id-1',
      date: '2024-01-01',
      description: 'WALMART PURCHASE',
      amount: -50.00,
      category: 'Shopping',
      confidence: 95
    },
    {
      id: 'txn-2',
      file_id: 'file-id-1',
      date: '2024-01-02',
      description: 'SALARY DEPOSIT',
      amount: 5000.00,
      category: 'Income',
      confidence: 100
    }
  ],
  subscriptions: {
    free: {
      user_id: 'test-user-id',
      tier: 'free',
      conversions_used: 2,
      conversions_limit: 5,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    pro: {
      user_id: 'test-user-id',
      tier: 'pro',
      conversions_used: 45,
      conversions_limit: 100,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    limitReached: {
      user_id: 'test-user-id',
      tier: 'free',
      conversions_used: 5,
      conversions_limit: 5,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
}