# Statement Desk Test Suite

This directory contains comprehensive tests for the Google Workspace integration in Statement Desk.

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for individual components
│   ├── auth/               # OAuth and authentication tests
│   ├── processing/         # PDF processing tests
│   └── api/               # API and rate limiting tests
├── integration/            # Integration tests for complete flows
├── e2e/                   # End-to-end tests and guides
├── mocks/                 # Mock implementations
│   ├── google-auth.mock.js
│   ├── google-apis.mock.js
│   ├── supabase.mock.js
│   └── pdf-parser.mock.js
└── utils/                 # Test utilities and helpers
    ├── test-helpers.js
    ├── mock-factories.js
    └── google-test-utils.js
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- __tests__/unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Categories

### 1. Unit Tests

#### Authentication (`unit/auth/`)
- **oauth-flow.test.js**: OAuth URL generation, callback handling, state management
- **workspace-installation.test.js**: Domain-wide vs individual installation logic
- **token-refresh.test.js**: Token validation, refresh, and lifecycle management

#### Processing (`unit/processing/`)
- **pdf-processing.test.js**: PDF parsing, AI enhancement, format variations

#### API (`unit/api/`)
- **rate-limiting.test.js**: Rate limit detection, retry logic, quota management

### 2. Integration Tests

#### Complete Flows (`integration/`)
- **google-workspace-flow.test.js**: Full OAuth to export flow, error recovery

### 3. End-to-End Tests

#### Testing Guide (`e2e/`)
- **TESTING_GUIDE.md**: Comprehensive manual and automated testing procedures

## Mock Services

### Google Auth Mock
```javascript
import { mockOAuth2Client, mockTokenScenarios } from './mocks/google-auth.mock'

// Use in tests
mockOAuth2Client.generateAuthUrl.mockReturnValue('https://mock-auth-url')
```

### Google APIs Mock
```javascript
import { mockDriveAPI, mockSheetsAPI } from './mocks/google-apis.mock'

// Mock Drive operations
mockDriveAPI.files.create.mockResolvedValue({ data: mockFile })
```

### Supabase Mock
```javascript
import { mockSupabaseClient } from './mocks/supabase.mock'

// Mock database operations
mockSupabaseClient.from.mockReturnThis()
```

## Test Utilities

### Test Helpers
```javascript
import { 
  renderWithProviders, 
  createMockFile,
  mockFetchResponse 
} from './utils/test-helpers'

// Render with auth context
const { getByTestId } = renderWithProviders(<Component />, {
  initialAuth: mockUser
})
```

### Mock Factories
```javascript
import { MockFactory } from './utils/mock-factories'

// Create test data
const user = MockFactory.createMockUser()
const tokens = MockFactory.createMockGoogleTokens()
const transactions = MockFactory.transactions(10)
```

### Google Test Utils
```javascript
import { googleTestUtils } from './utils/google-test-utils'

// Generate test auth URL
const { url, state } = googleTestUtils.generateMockAuthUrl()

// Create test spreadsheet
const spreadsheet = googleTestUtils.createMockSpreadsheet({
  title: 'Test Export',
  sheets: [{ title: 'Transactions', data: testData }]
})
```

## Writing New Tests

### Test Template
```javascript
import { mockDependencies } from '../mocks/your-mock'
import { testUtils } from '../utils/test-helpers'

describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Specific Functionality', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = testUtils.createInput()
      mockDependency.method.mockResolvedValue(expectedOutput)

      // Act
      const result = await functionUnderTest(input)

      // Assert
      expect(result).toEqual(expectedOutput)
      expect(mockDependency.method).toHaveBeenCalledWith(input)
    })

    it('should handle error case', async () => {
      // Test error scenarios
    })
  })
})
```

### Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies
3. **Assertions**: Test both success and failure paths
4. **Cleanup**: Clear mocks between tests
5. **Descriptive**: Use clear test descriptions

## Coverage Goals

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: Cover all critical paths
- **E2E Tests**: Cover main user journeys

## Debugging Tests

### Run Single Test File
```bash
npm test -- __tests__/unit/auth/oauth-flow.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="token refresh"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## CI/CD Integration

Tests run automatically on:
- Pull requests to main/develop
- Commits to main branch
- Nightly scheduled runs

See `.github/workflows/test.yml` for configuration.

## Troubleshooting

### Common Issues

1. **Mock not working**
   - Check jest.mock() is at top of file
   - Verify mock path is correct

2. **Async test timeout**
   - Increase timeout: `jest.setTimeout(10000)`
   - Check for unresolved promises

3. **Database connection errors**
   - Ensure test database is configured
   - Check environment variables

### Getting Help

- Check existing test examples
- Review mock implementations
- Consult testing guide in `/docs`

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Add integration tests for workflows
4. Update this README if needed
5. Check coverage doesn't decrease