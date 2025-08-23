// Jest setup file for global test configuration
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.GOOGLE_CLIENT_ID = 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.CLAUDE_MODEL = 'claude-3-7-sonnet-20250219'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}

// Mock window.location
delete window.location
window.location = { 
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  reload: jest.fn(),
  assign: jest.fn(),
}

// Mock crypto for UUID generation
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})