// Mock for Google OAuth2Client
export const mockOAuth2Client = {
  generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth?mock=true'),
  getToken: jest.fn().mockResolvedValue({
    tokens: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expiry_date: Date.now() + 3600000,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/drive.file'
    }
  }),
  setCredentials: jest.fn(),
  refreshToken: jest.fn().mockResolvedValue({
    credentials: {
      access_token: 'mock-refreshed-access-token',
      expiry_date: Date.now() + 3600000
    }
  }),
  revokeToken: jest.fn().mockResolvedValue({}),
  verifyIdToken: jest.fn().mockResolvedValue({
    getPayload: () => ({
      sub: 'mock-user-id',
      email: 'test@example.com',
      email_verified: true,
      hd: 'example.com'
    })
  })
}

// Mock for JWT
export const mockJWT = {
  credentials: {
    access_token: 'mock-service-account-token',
    expiry_date: Date.now() + 3600000
  },
  authorize: jest.fn().mockResolvedValue(null),
  getAccessToken: jest.fn().mockResolvedValue({
    token: 'mock-service-account-token'
  })
}

// Mock Google Auth Library
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => mockOAuth2Client),
  JWT: jest.fn().mockImplementation(() => mockJWT),
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: jest.fn().mockResolvedValue(mockJWT)
  }))
}))

// Mock workspace domain verification responses
export const mockWorkspaceDomainVerification = {
  valid: {
    domain: 'example.com',
    verified: true,
    adminConsent: true,
    scopes: ['drive.file'],
    installationType: 'domain'
  },
  individual: {
    domain: null,
    verified: true,
    adminConsent: false,
    scopes: ['drive.file'],
    installationType: 'individual'
  },
  pendingConsent: {
    domain: 'example.com',
    verified: true,
    adminConsent: false,
    scopes: [],
    installationType: 'pending'
  },
  invalid: {
    domain: null,
    verified: false,
    adminConsent: false,
    scopes: [],
    installationType: null
  }
}

// Mock token scenarios
export const mockTokenScenarios = {
  valid: {
    access_token: 'valid-access-token',
    refresh_token: 'valid-refresh-token',
    expiry_date: Date.now() + 3600000,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/drive.file'
  },
  expired: {
    access_token: 'expired-access-token',
    refresh_token: 'expired-refresh-token',
    expiry_date: Date.now() - 3600000,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/drive.file'
  },
  noRefreshToken: {
    access_token: 'no-refresh-access-token',
    refresh_token: null,
    expiry_date: Date.now() + 3600000,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/drive.file'
  },
  invalidScope: {
    access_token: 'invalid-scope-token',
    refresh_token: 'invalid-scope-refresh',
    expiry_date: Date.now() + 3600000,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/drive.readonly'
  }
}