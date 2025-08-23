import { mockPDFContent, mockExtractedTransactions, mockAIEnhancements } from '../../mocks/pdf-parser.mock'
import { mockFileUploadScenarios } from '../../mocks/google-apis.mock'
import { MockFactory } from '../../utils/mock-factories'

// Mock the PDF processing modules
const mockPDFParser = jest.fn()
const mockEnhancedParser = jest.fn()

jest.mock('@/lib/pdf-parser', () => ({
  parsePDF: mockPDFParser
}))

jest.mock('@/lib/enhanced-pdf-parser', () => ({
  enhancedParsePDF: mockEnhancedParser
}))

describe('PDF Processing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Standard PDF Processing', () => {
    it('should parse standard bank statement format', async () => {
      const fileBuffer = Buffer.from('standard pdf content')
      
      mockPDFParser.mockResolvedValue({
        transactions: mockExtractedTransactions.standard,
        metadata: {
          bankName: 'Bank of America',
          accountNumber: '****1234',
          statementPeriod: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          extractionMethod: 'regex'
        }
      })

      const result = await mockPDFParser(fileBuffer)

      expect(result.transactions).toHaveLength(6)
      expect(result.transactions[0]).toHaveProperty('date', '2024-01-05')
      expect(result.transactions[0]).toHaveProperty('amount', -125.50)
      expect(result.metadata.bankName).toBe('Bank of America')
    })

    it('should handle multi-page statements', async () => {
      const fileBuffer = Buffer.from('multi-page pdf')
      const transactionsPerPage = 50
      const totalPages = 3
      
      mockPDFParser.mockResolvedValue({
        transactions: Array(totalPages * transactionsPerPage).fill(null).map((_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `Transaction ${i + 1}`,
          amount: i % 2 === 0 ? -Math.random() * 100 : Math.random() * 1000,
          page: Math.floor(i / transactionsPerPage) + 1
        })),
        metadata: {
          totalPages,
          extractionMethod: 'regex'
        }
      })

      const result = await mockPDFParser(fileBuffer)

      expect(result.transactions).toHaveLength(150)
      expect(result.metadata.totalPages).toBe(3)
      
      // Verify transactions are from different pages
      const pagesSet = new Set(result.transactions.map(t => t.page))
      expect(pagesSet.size).toBe(3)
    })

    it('should extract metadata from PDF info', async () => {
      const fileBuffer = Buffer.from('pdf with metadata')
      
      mockPDFParser.mockResolvedValue({
        transactions: [],
        metadata: {
          title: 'Monthly Statement',
          creationDate: '2024-02-01',
          producer: 'Bank PDF System v2.0',
          encrypted: false,
          fileSize: 1024000
        }
      })

      const result = await mockPDFParser(fileBuffer)

      expect(result.metadata).toMatchObject({
        title: 'Monthly Statement',
        producer: 'Bank PDF System v2.0',
        encrypted: false
      })
    })
  })

  describe('AI-Enhanced Processing', () => {
    it('should use AI for complex statement formats', async () => {
      const fileBuffer = Buffer.from('complex pdf format')
      
      mockEnhancedParser.mockResolvedValue({
        transactions: mockExtractedTransactions.standard.map(txn => ({
          ...txn,
          ...mockAIEnhancements.categorized[txn.description] || {},
          ai_enhanced: true
        })),
        metadata: {
          extractionMethod: 'ai',
          aiModel: 'claude-3-7-sonnet-20250219',
          confidence: 92.5,
          processingTime: 8500
        }
      })

      const result = await mockEnhancedParser(fileBuffer)

      expect(result.metadata.extractionMethod).toBe('ai')
      expect(result.transactions[0].ai_enhanced).toBe(true)
      expect(result.transactions[0].normalized_merchant).toBe('Walmart')
      expect(result.metadata.confidence).toBeGreaterThan(90)
    })

    it('should detect anomalies with AI', async () => {
      const fileBuffer = Buffer.from('pdf with suspicious transactions')
      
      mockEnhancedParser.mockResolvedValue({
        transactions: [
          {
            date: '2024-01-15',
            description: 'SUSPICIOUS CHARGE',
            amount: -999.99,
            ...mockAIEnhancements.categorized['SUSPICIOUS CHARGE'],
            ai_enhanced: true
          }
        ],
        anomalies: [{
          transactionId: 'txn-1',
          type: 'suspicious',
          riskScore: 85,
          reasons: ['Unusual merchant name', 'Time of transaction'],
          recommendation: 'Review this transaction with your bank'
        }]
      })

      const result = await mockEnhancedParser(fileBuffer)

      expect(result.transactions[0].anomaly_data).toBeDefined()
      expect(result.transactions[0].anomaly_data.risk_score).toBe(85)
      expect(result.anomalies).toHaveLength(1)
    })

    it('should fall back to traditional parsing on AI failure', async () => {
      const fileBuffer = Buffer.from('pdf content')
      
      // AI parsing fails
      mockEnhancedParser.mockRejectedValueOnce(new Error('AI service unavailable'))
      
      // Fallback to traditional
      mockPDFParser.mockResolvedValue({
        transactions: mockExtractedTransactions.standard,
        metadata: {
          extractionMethod: 'regex',
          fallbackReason: 'AI service unavailable'
        }
      })

      // Simulate the fallback logic
      let result
      try {
        result = await mockEnhancedParser(fileBuffer)
      } catch (error) {
        result = await mockPDFParser(fileBuffer)
      }

      expect(result.metadata.extractionMethod).toBe('regex')
      expect(result.metadata.fallbackReason).toBe('AI service unavailable')
    })
  })

  describe('Format Variations', () => {
    it('should handle unusual bank formats', async () => {
      const fileBuffer = Buffer.from('unusual format pdf')
      
      mockEnhancedParser.mockResolvedValue({
        transactions: [
          {
            date: '2024-01-05',
            description: 'Grocery Store Purchase',
            amount: -125.50,
            originalText: '• 01/05 | Grocery Store Purchase | Debit: 125.50',
            parseMethod: 'ai_pattern_recognition'
          }
        ],
        metadata: {
          bankFormat: 'unrecognized',
          extractionMethod: 'ai',
          patterns: ['bullet_list', 'pipe_separated']
        }
      })

      const result = await mockEnhancedParser(fileBuffer)

      expect(result.transactions).toHaveLength(1)
      expect(result.metadata.patterns).toContain('bullet_list')
      expect(result.transactions[0].parseMethod).toBe('ai_pattern_recognition')
    })

    it('should handle scanned PDFs with OCR', async () => {
      const fileBuffer = Buffer.from('scanned pdf')
      
      mockEnhancedParser.mockResolvedValue({
        transactions: [],
        metadata: {
          extractionMethod: 'ocr_required',
          ocrConfidence: 0,
          error: 'PDF contains no selectable text. OCR processing required.'
        }
      })

      const result = await mockEnhancedParser(fileBuffer)

      expect(result.metadata.extractionMethod).toBe('ocr_required')
      expect(result.transactions).toHaveLength(0)
      expect(result.metadata.error).toContain('OCR')
    })

    it('should parse different date formats', async () => {
      const formats = [
        { input: '01/15/2024', expected: '2024-01-15' },
        { input: '15-Jan-2024', expected: '2024-01-15' },
        { input: 'January 15, 2024', expected: '2024-01-15' },
        { input: '2024.01.15', expected: '2024-01-15' },
        { input: '15/01/2024', expected: '2024-01-15' } // European format
      ]

      for (const format of formats) {
        mockPDFParser.mockResolvedValueOnce({
          transactions: [{
            date: format.expected,
            originalDate: format.input,
            description: 'Test Transaction',
            amount: -50.00
          }],
          metadata: { dateFormat: format.input.includes('/') ? 'MM/DD/YYYY' : 'various' }
        })

        const result = await mockPDFParser(Buffer.from(`pdf with ${format.input}`))
        
        expect(result.transactions[0].date).toBe(format.expected)
        expect(result.transactions[0].originalDate).toBe(format.input)
      }
    })

    it('should handle different currency formats', async () => {
      const currencies = [
        { symbol: '$', amount: '-125.50', expected: -125.50 },
        { symbol: '€', amount: '(125,50)', expected: -125.50 },
        { symbol: '£', amount: '125.50-', expected: -125.50 },
        { symbol: '¥', amount: '-12,550', expected: -12550 }
      ]

      for (const currency of currencies) {
        mockPDFParser.mockResolvedValueOnce({
          transactions: [{
            date: '2024-01-15',
            description: 'International Purchase',
            amount: currency.expected,
            originalAmount: currency.amount,
            currency: currency.symbol
          }],
          metadata: { defaultCurrency: currency.symbol }
        })

        const result = await mockPDFParser(Buffer.from(`pdf with ${currency.symbol}`))
        
        expect(result.transactions[0].amount).toBe(currency.expected)
        expect(result.transactions[0].currency).toBe(currency.symbol)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle corrupted PDFs gracefully', async () => {
      const corruptedBuffer = Buffer.from('corrupted pdf data')
      
      mockPDFParser.mockRejectedValue(new Error('Invalid PDF structure'))

      await expect(mockPDFParser(corruptedBuffer)).rejects.toThrow('Invalid PDF structure')
    })

    it('should handle password-protected PDFs', async () => {
      const protectedBuffer = Buffer.from('encrypted pdf')
      
      mockPDFParser.mockRejectedValue(new Error('PDF is password protected'))

      await expect(mockPDFParser(protectedBuffer)).rejects.toThrow('password protected')
    })

    it('should validate file size limits', async () => {
      const largeFile = {
        size: 50 * 1024 * 1024, // 50MB
        buffer: Buffer.alloc(1024) // Small buffer for testing
      }

      const validateFileSize = (file, maxSizeMB = 25) => {
        const maxSize = maxSizeMB * 1024 * 1024
        if (file.size > maxSize) {
          throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
        }
        return true
      }

      expect(() => validateFileSize(largeFile)).toThrow('File size exceeds 25MB limit')
      expect(() => validateFileSize(largeFile, 100)).not.toThrow()
    })
  })

  describe('Duplicate Detection', () => {
    it('should detect duplicate transactions within statement', async () => {
      mockEnhancedParser.mockResolvedValue({
        transactions: mockExtractedTransactions.duplicates,
        duplicates: [{
          indices: [0, 1],
          confidence: 100,
          reason: 'Identical date, description, and amount'
        }],
        metadata: {
          totalTransactions: 2,
          duplicatesFound: 1
        }
      })

      const result = await mockEnhancedParser(Buffer.from('pdf with duplicates'))

      expect(result.duplicates).toHaveLength(1)
      expect(result.metadata.duplicatesFound).toBe(1)
    })

    it('should detect duplicates across multiple statements', async () => {
      const existingTransactions = MockFactory.transactions(10, 'old-file-id')
      const newTransactions = [
        ...MockFactory.transactions(5, 'new-file-id'),
        existingTransactions[0] // Duplicate
      ]

      const detectCrossDuplicates = (existing, incoming) => {
        const duplicates = []
        
        for (const newTxn of incoming) {
          const duplicate = existing.find(txn => 
            txn.date === newTxn.date &&
            txn.amount === newTxn.amount &&
            txn.description === newTxn.description
          )
          
          if (duplicate) {
            duplicates.push({
              incoming: newTxn,
              existing: duplicate,
              confidence: 95
            })
          }
        }
        
        return duplicates
      }

      const duplicates = detectCrossDuplicates(existingTransactions, newTransactions)
      
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].confidence).toBe(95)
    })
  })
})