// Mock PDF parsing responses for different bank formats
export const mockPDFContent = {
  // Standard bank statement format
  standard: {
    text: `
BANK OF AMERICA
Statement Period: January 1 - January 31, 2024
Account Number: ****1234

Beginning Balance: $5,000.00
Ending Balance: $4,850.00

TRANSACTIONS

Date        Description                          Amount      Balance
01/05/2024  WALMART SUPERCENTER #1234          -$125.50    $4,874.50
01/10/2024  DIRECT DEPOSIT - PAYROLL           $3,500.00   $8,374.50
01/15/2024  AMAZON.COM*ABC123                  -$89.99     $8,284.51
01/20/2024  TRANSFER TO SAVINGS                -$1,000.00  $7,284.51
01/25/2024  NETFLIX MONTHLY                    -$15.99     $7,268.52
01/28/2024  ATM WITHDRAWAL                     -$200.00    $7,068.52
    `,
    numPages: 1,
    info: {
      Title: 'Bank Statement',
      Producer: 'Bank PDF Generator'
    }
  },
  
  // Complex multi-page statement
  multiPage: {
    text: `
CHASE BANK
Statement Period: January 1 - January 31, 2024
Page 1 of 3

[Multiple transactions across 3 pages]
    `,
    numPages: 3,
    info: {
      Title: 'Chase Statement',
      Producer: 'Chase PDF System'
    }
  },

  // Statement with unusual formats
  unusual: {
    text: `
REGIONAL CREDIT UNION
Member Statement

Transaction Log:
• 01/05 | Grocery Store Purchase | Debit: 125.50
• 01/10 | Employer Deposit | Credit: 3500.00
• 01/15 | Online Purchase | Debit: 89.99
    `,
    numPages: 1,
    info: {}
  },

  // Corrupted/Invalid PDF
  corrupted: {
    text: '',
    error: 'Invalid PDF structure'
  },

  // Scanned statement (no selectable text)
  scanned: {
    text: '',
    numPages: 2,
    info: {
      Title: 'Scanned Document'
    }
  }
}

// Mock transaction extraction results
export const mockExtractedTransactions = {
  standard: [
    {
      date: '2024-01-05',
      description: 'WALMART SUPERCENTER #1234',
      amount: -125.50,
      balance: 4874.50,
      category: 'Shopping',
      confidence: 95
    },
    {
      date: '2024-01-10',
      description: 'DIRECT DEPOSIT - PAYROLL',
      amount: 3500.00,
      balance: 8374.50,
      category: 'Income',
      confidence: 100
    },
    {
      date: '2024-01-15',
      description: 'AMAZON.COM*ABC123',
      amount: -89.99,
      balance: 8284.51,
      category: 'Shopping',
      confidence: 90
    },
    {
      date: '2024-01-20',
      description: 'TRANSFER TO SAVINGS',
      amount: -1000.00,
      balance: 7284.51,
      category: 'Transfer',
      confidence: 100
    },
    {
      date: '2024-01-25',
      description: 'NETFLIX MONTHLY',
      amount: -15.99,
      balance: 7268.52,
      category: 'Entertainment',
      confidence: 95
    },
    {
      date: '2024-01-28',
      description: 'ATM WITHDRAWAL',
      amount: -200.00,
      balance: 7068.52,
      category: 'Cash',
      confidence: 100
    }
  ],
  empty: [],
  duplicates: [
    {
      date: '2024-01-05',
      description: 'DUPLICATE TXN',
      amount: -50.00,
      category: 'Shopping'
    },
    {
      date: '2024-01-05',
      description: 'DUPLICATE TXN',
      amount: -50.00,
      category: 'Shopping'
    }
  ]
}

// Mock AI enhancement results
export const mockAIEnhancements = {
  categorized: {
    'WALMART SUPERCENTER #1234': {
      category: 'Groceries',
      subcategory: 'Supermarket',
      normalized_merchant: 'Walmart',
      confidence: 95,
      ai_reasoning: 'Identified as grocery purchase based on merchant name pattern'
    },
    'NETFLIX MONTHLY': {
      category: 'Entertainment',
      subcategory: 'Streaming Services',
      normalized_merchant: 'Netflix',
      confidence: 100,
      ai_reasoning: 'Known streaming service subscription'
    },
    'SUSPICIOUS CHARGE': {
      category: 'Unknown',
      subcategory: null,
      normalized_merchant: null,
      confidence: 30,
      ai_reasoning: 'Unusual pattern detected - possible fraud',
      anomaly_data: {
        type: 'suspicious',
        risk_score: 85,
        reasons: ['Unusual merchant name', 'Time of transaction']
      }
    }
  }
}

// Mock PDF parsing service
jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation((buffer) => {
    // Simulate different PDF scenarios based on buffer content
    const content = buffer.toString()
    
    if (content.includes('standard')) {
      return Promise.resolve(mockPDFContent.standard)
    } else if (content.includes('corrupted')) {
      return Promise.reject(new Error('Invalid PDF structure'))
    } else if (content.includes('scanned')) {
      return Promise.resolve(mockPDFContent.scanned)
    }
    
    return Promise.resolve(mockPDFContent.standard)
  })
})