// Utilities for testing Google Workspace integration

export class GoogleTestUtils {
  constructor() {
    this.mockTokens = new Map()
    this.mockFiles = new Map()
    this.requestLog = []
  }

  // Generate mock OAuth URL with test parameters
  generateMockAuthUrl(options = {}) {
    const {
      clientId = 'test-client-id',
      redirectUri = 'http://localhost:3000/auth/callback',
      scope = ['drive.file', 'spreadsheets'],
      state = this.generateState(),
      accessType = 'offline',
      prompt = 'consent'
    } = options

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope.join(' '),
      state,
      access_type: accessType,
      response_type: 'code',
      prompt
    })

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      state
    }
  }

  // Generate random state for OAuth
  generateState() {
    return 'test-state-' + Math.random().toString(36).substr(2, 9)
  }

  // Create mock tokens with configurable expiry
  createMockTokens(options = {}) {
    const {
      userId = 'test-user-id',
      expiresIn = 3600, // 1 hour
      scopes = ['https://www.googleapis.com/auth/drive.file'],
      includeRefreshToken = true
    } = options

    const tokens = {
      access_token: `mock-access-${Math.random().toString(36).substr(2, 9)}`,
      token_type: 'Bearer',
      expiry_date: Date.now() + (expiresIn * 1000),
      scope: scopes.join(' ')
    }

    if (includeRefreshToken) {
      tokens.refresh_token = `mock-refresh-${Math.random().toString(36).substr(2, 9)}`
    }

    this.mockTokens.set(userId, tokens)
    return tokens
  }

  // Simulate token refresh
  refreshMockToken(userId) {
    const currentTokens = this.mockTokens.get(userId)
    if (!currentTokens || !currentTokens.refresh_token) {
      throw new Error('No refresh token available')
    }

    const newTokens = {
      ...currentTokens,
      access_token: `mock-refreshed-${Math.random().toString(36).substr(2, 9)}`,
      expiry_date: Date.now() + 3600000 // 1 hour
    }

    this.mockTokens.set(userId, newTokens)
    return newTokens
  }

  // Create mock Google Drive file
  createMockDriveFile(options = {}) {
    const {
      name = `test-file-${Date.now()}.pdf`,
      mimeType = 'application/pdf',
      size = 1024000,
      parents = ['root'],
      content = null
    } = options

    const fileId = `mock-file-${Math.random().toString(36).substr(2, 9)}`
    
    const file = {
      id: fileId,
      name,
      mimeType,
      size,
      parents,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`
    }

    if (content) {
      file.content = content
    }

    this.mockFiles.set(fileId, file)
    return file
  }

  // Create mock spreadsheet
  createMockSpreadsheet(options = {}) {
    const {
      title = 'Test Spreadsheet',
      sheets = [{ title: 'Sheet1', data: [] }]
    } = options

    const spreadsheetId = `mock-sheet-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      properties: {
        title,
        locale: 'en_US',
        timeZone: 'America/New_York'
      },
      sheets: sheets.map((sheet, index) => ({
        properties: {
          sheetId: index,
          title: sheet.title,
          index,
          gridProperties: {
            rowCount: sheet.data.length || 1000,
            columnCount: sheet.data[0]?.length || 26
          }
        },
        data: sheet.data
      }))
    }
  }

  // Simulate API request with logging
  async mockApiRequest(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      delay = 100,
      shouldFail = false,
      errorCode = 500,
      errorMessage = 'Internal server error'
    } = options

    // Log request
    this.requestLog.push({
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      headers,
      body
    })

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delay))

    // Simulate failure if requested
    if (shouldFail) {
      throw {
        code: errorCode,
        message: errorMessage,
        errors: [{
          domain: 'test',
          reason: 'testError'
        }]
      }
    }

    // Return mock response based on endpoint
    return this.getMockResponse(endpoint, method, body)
  }

  // Get mock response for endpoint
  getMockResponse(endpoint, method, body) {
    // Drive files list
    if (endpoint.includes('/drive/v3/files') && method === 'GET') {
      return {
        files: Array.from(this.mockFiles.values()),
        nextPageToken: null
      }
    }

    // Create file
    if (endpoint.includes('/drive/v3/files') && method === 'POST') {
      const file = this.createMockDriveFile(body)
      return file
    }

    // Create spreadsheet
    if (endpoint.includes('/sheets/v4/spreadsheets') && method === 'POST') {
      return this.createMockSpreadsheet(body)
    }

    // Update spreadsheet values
    if (endpoint.includes('/sheets/v4/spreadsheets') && endpoint.includes('values')) {
      return {
        spreadsheetId: endpoint.match(/spreadsheets\/([^/]+)/)[1],
        updatedCells: body.values ? body.values.flat().length : 0,
        updatedColumns: body.values ? body.values[0].length : 0,
        updatedRows: body.values ? body.values.length : 0
      }
    }

    return { success: true }
  }

  // Simulate rate limiting
  simulateRateLimit(options = {}) {
    const {
      retryAfter = 60,
      limit = 60,
      remaining = 0,
      reset = Date.now() + 3600000
    } = options

    return {
      code: 429,
      message: 'Rate limit exceeded',
      errors: [{
        domain: 'usageLimits',
        reason: 'rateLimitExceeded'
      }],
      headers: {
        'retry-after': retryAfter.toString(),
        'x-ratelimit-limit': limit.toString(),
        'x-ratelimit-remaining': remaining.toString(),
        'x-ratelimit-reset': new Date(reset).toISOString()
      }
    }
  }

  // Create test PDF content
  createTestPDFContent(options = {}) {
    const {
      bankName = 'Test Bank',
      accountNumber = '****1234',
      startDate = '2024-01-01',
      endDate = '2024-01-31',
      transactions = this.generateTestTransactions()
    } = options

    return `
${bankName}
Statement Period: ${startDate} - ${endDate}
Account Number: ${accountNumber}

Beginning Balance: $5,000.00
Ending Balance: $4,850.00

TRANSACTIONS

Date        Description                          Amount      Balance
${transactions.map(t => 
  `${t.date}  ${t.description.padEnd(35)} ${t.amount.toFixed(2).padStart(10)} ${t.balance.toFixed(2).padStart(10)}`
).join('\n')}
    `.trim()
  }

  // Generate test transactions
  generateTestTransactions(count = 10) {
    const transactions = []
    let balance = 5000

    for (let i = 0; i < count; i++) {
      const date = new Date(2024, 0, i + 1).toISOString().split('T')[0]
      const isCredit = i % 3 === 0
      const amount = isCredit ? 
        Math.random() * 1000 + 500 : 
        -(Math.random() * 200 + 20)
      
      balance += amount

      transactions.push({
        date,
        description: isCredit ? 'DEPOSIT' : `PURCHASE ${i}`,
        amount,
        balance
      })
    }

    return transactions
  }

  // Validate exported spreadsheet data
  validateSpreadsheetData(spreadsheetData, expectedTransactions) {
    const errors = []

    // Check headers
    const expectedHeaders = ['Date', 'Description', 'Amount', 'Category', 'Balance']
    const actualHeaders = spreadsheetData[0]
    
    expectedHeaders.forEach((header, index) => {
      if (actualHeaders[index] !== header) {
        errors.push(`Header mismatch at column ${index}: expected "${header}", got "${actualHeaders[index]}"`)
      }
    })

    // Check transaction count
    const dataRows = spreadsheetData.slice(1)
    if (dataRows.length !== expectedTransactions.length) {
      errors.push(`Row count mismatch: expected ${expectedTransactions.length}, got ${dataRows.length}`)
    }

    // Validate each transaction
    dataRows.forEach((row, index) => {
      const expected = expectedTransactions[index]
      if (!expected) return

      if (row[0] !== expected.date) {
        errors.push(`Date mismatch at row ${index + 1}: expected "${expected.date}", got "${row[0]}"`)
      }
      
      if (row[1] !== expected.description) {
        errors.push(`Description mismatch at row ${index + 1}: expected "${expected.description}", got "${row[1]}"`)
      }
      
      const actualAmount = parseFloat(row[2])
      if (Math.abs(actualAmount - expected.amount) > 0.01) {
        errors.push(`Amount mismatch at row ${index + 1}: expected ${expected.amount}, got ${actualAmount}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Clean up test data
  cleanup() {
    this.mockTokens.clear()
    this.mockFiles.clear()
    this.requestLog = []
  }

  // Get request statistics
  getRequestStats() {
    const stats = {
      totalRequests: this.requestLog.length,
      byEndpoint: {},
      byMethod: {},
      avgResponseTime: 0
    }

    this.requestLog.forEach(req => {
      // Count by endpoint
      const endpoint = req.endpoint.split('?')[0]
      stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1

      // Count by method
      stats.byMethod[req.method] = (stats.byMethod[req.method] || 0) + 1
    })

    return stats
  }
}

// Export singleton instance
export const googleTestUtils = new GoogleTestUtils()