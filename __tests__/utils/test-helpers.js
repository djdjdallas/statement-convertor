import { render } from '@testing-library/react'
import { mockSupabaseClient } from '../mocks/supabase.mock'

// Test IDs for common elements
export const TEST_IDS = {
  fileUploader: 'file-uploader',
  googleSignIn: 'google-sign-in',
  driveFilePicker: 'drive-file-picker',
  exportButton: 'export-button',
  processingStatus: 'processing-status',
  errorMessage: 'error-message',
  successMessage: 'success-message'
}

// Helper to render components with providers
export function renderWithProviders(ui, options = {}) {
  const { initialAuth = null, ...renderOptions } = options

  // Mock auth context
  const AuthProvider = ({ children }) => {
    const value = {
      user: initialAuth,
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      supabase: mockSupabaseClient
    }
    
    return children
  }

  return render(ui, {
    wrapper: AuthProvider,
    ...renderOptions
  })
}

// Helper to create mock files for testing
export function createMockFile(name = 'test.pdf', size = 1024, type = 'application/pdf') {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Helper to wait for async operations
export async function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Helper to mock fetch responses
export function mockFetchResponse(response, options = {}) {
  const { status = 200, headers = {} } = options
  
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => response,
    text: async () => JSON.stringify(response),
    blob: async () => new Blob([JSON.stringify(response)])
  })
}

// Helper to mock fetch error
export function mockFetchError(error = 'Network error') {
  global.fetch.mockRejectedValueOnce(new Error(error))
}

// Helper to create mock user
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {
      provider: 'email'
    },
    user_metadata: {
      full_name: 'Test User'
    },
    created_at: new Date().toISOString(),
    ...overrides
  }
}

// Helper to create mock Google tokens
export function createMockGoogleTokens(overrides = {}) {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expiry_date: Date.now() + 3600000,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
    ...overrides
  }
}

// Helper to simulate file upload
export async function simulateFileUpload(fileInput, file) {
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    writable: false
  })
  
  const event = new Event('change', { bubbles: true })
  fileInput.dispatchEvent(event)
  
  await waitForAsync()
}

// Helper to mock rate limiting
export function mockRateLimitResponse() {
  return {
    status: 429,
    error: 'Rate limit exceeded',
    retryAfter: 60
  }
}

// Helper to mock quota exceeded
export function mockQuotaExceededResponse() {
  return {
    status: 403,
    error: 'Quota exceeded',
    quotaInfo: {
      used: 5,
      limit: 5,
      resetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  }
}

// Helper for testing async errors
export async function expectAsyncError(asyncFn, errorMessage) {
  let error
  try {
    await asyncFn()
  } catch (e) {
    error = e
  }
  
  expect(error).toBeDefined()
  if (errorMessage) {
    expect(error.message).toContain(errorMessage)
  }
  
  return error
}

// Helper to mock workspace admin scenarios
export function createMockWorkspaceAdmin(domain = 'example.com') {
  return {
    id: 'admin-user-id',
    email: `admin@${domain}`,
    app_metadata: {
      provider: 'google',
      workspace_domain: domain,
      is_admin: true
    }
  }
}

// Helper to create mock API responses
export function createMockAPIResponse(data, options = {}) {
  const { error = null, status = 'success' } = options
  
  return {
    data,
    error,
    status,
    timestamp: new Date().toISOString()
  }
}