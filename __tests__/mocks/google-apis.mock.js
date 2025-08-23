// Mock for Google Drive API
export const mockDriveAPI = {
  files: {
    create: jest.fn().mockResolvedValue({
      data: {
        id: 'mock-file-id',
        name: 'test-file.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        webViewLink: 'https://drive.google.com/file/d/mock-file-id/view'
      }
    }),
    get: jest.fn().mockResolvedValue({
      data: {
        id: 'mock-file-id',
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        modifiedTime: new Date().toISOString()
      }
    }),
    list: jest.fn().mockResolvedValue({
      data: {
        files: [
          {
            id: 'file-1',
            name: 'statement-jan.pdf',
            mimeType: 'application/pdf',
            modifiedTime: new Date().toISOString()
          },
          {
            id: 'file-2', 
            name: 'statement-feb.pdf',
            mimeType: 'application/pdf',
            modifiedTime: new Date().toISOString()
          }
        ],
        nextPageToken: null
      }
    }),
    export: jest.fn().mockResolvedValue({
      data: Buffer.from('mock pdf content')
    }),
    update: jest.fn().mockResolvedValue({
      data: { id: 'mock-file-id' }
    }),
    delete: jest.fn().mockResolvedValue({})
  },
  about: {
    get: jest.fn().mockResolvedValue({
      data: {
        storageQuota: {
          limit: '15000000000',
          usage: '5000000000',
          usageInDrive: '4000000000'
        },
        user: {
          displayName: 'Test User',
          emailAddress: 'test@example.com'
        }
      }
    })
  }
}

// Mock for Google Sheets API
export const mockSheetsAPI = {
  spreadsheets: {
    create: jest.fn().mockResolvedValue({
      data: {
        spreadsheetId: 'mock-spreadsheet-id',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/mock-spreadsheet-id/edit',
        properties: {
          title: 'Bank Statement Export'
        }
      }
    }),
    values: {
      update: jest.fn().mockResolvedValue({
        data: {
          updatedCells: 100,
          updatedColumns: 5,
          updatedRows: 20
        }
      }),
      batchUpdate: jest.fn().mockResolvedValue({
        data: {
          responses: [{
            updatedCells: 500
          }]
        }
      }),
      get: jest.fn().mockResolvedValue({
        data: {
          values: [
            ['Date', 'Description', 'Amount', 'Category'],
            ['2024-01-01', 'Test Transaction', '100.00', 'Shopping']
          ]
        }
      })
    },
    batchUpdate: jest.fn().mockResolvedValue({
      data: {
        replies: [{
          addSheet: {
            properties: {
              sheetId: 12345,
              title: 'Transactions'
            }
          }
        }]
      }
    })
  }
}

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client),
      JWT: jest.fn().mockImplementation(() => mockJWT)
    },
    drive: jest.fn().mockReturnValue(mockDriveAPI),
    sheets: jest.fn().mockReturnValue(mockSheetsAPI)
  }
}))

// Mock API error scenarios
export const mockAPIErrors = {
  quotaExceeded: {
    code: 403,
    message: 'User rate limit exceeded',
    errors: [{
      domain: 'usageLimits',
      reason: 'userRateLimitExceeded'
    }]
  },
  invalidToken: {
    code: 401,
    message: 'Invalid Credentials',
    errors: [{
      domain: 'global',
      reason: 'authError'
    }]
  },
  insufficientPermissions: {
    code: 403,
    message: 'Insufficient Permission',
    errors: [{
      domain: 'global',
      reason: 'insufficientPermissions'
    }]
  },
  notFound: {
    code: 404,
    message: 'File not found',
    errors: [{
      domain: 'global',
      reason: 'notFound'
    }]
  },
  networkError: {
    code: 'ECONNREFUSED',
    message: 'Network connection refused'
  }
}

// Mock file upload scenarios
export const mockFileUploadScenarios = {
  smallPDF: {
    name: 'small-statement.pdf',
    size: 500000, // 500KB
    type: 'application/pdf',
    content: Buffer.from('small pdf content')
  },
  largePDF: {
    name: 'large-statement.pdf',
    size: 25000000, // 25MB
    type: 'application/pdf',
    content: Buffer.from('large pdf content')
  },
  corruptedPDF: {
    name: 'corrupted.pdf',
    size: 1000,
    type: 'application/pdf',
    content: Buffer.from('invalid pdf content')
  },
  nonPDF: {
    name: 'document.docx',
    size: 100000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    content: Buffer.from('docx content')
  }
}