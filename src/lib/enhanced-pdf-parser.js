// Use pdfjs-dist for reliable PDF text extraction
import * as pdfjsLib from 'pdfjs-dist'
import { claudeAI } from './ai/claude-service.js'

// Configure worker - disable worker for server-side usage
pdfjsLib.GlobalWorkerOptions.workerSrc = null

/**
 * Enhanced Bank statement PDF parser with AI integration
 * Combines traditional pattern matching with Claude AI for superior accuracy
 */
export class EnhancedBankStatementParser {
  constructor() {
    // Common transaction patterns for different banks (fallback)
    this.patterns = {
      // Generic patterns that work across most banks
      generic: {
        transaction: /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})\s*([-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})?/g,
        date: /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
        amount: /([-]?\$?\d{1,3}(?:,\d{3})*\.?\d{0,2})/,
        balance: /balance[:\s]+\$?([\d,]+\.?\d{0,2})/i
      },
      
      // Chase Bank patterns
      chase: {
        transaction: /(\d{2}\/\d{2})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})\s*([\d,]+\.?\d{0,2})?/g,
        dateFormat: 'MM/DD',
        header: /chase/i
      },
      
      // Bank of America patterns
      bankOfAmerica: {
        transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})\s*([\d,]+\.?\d{0,2})?/g,
        dateFormat: 'MM/DD/YYYY',
        header: /bank\s+of\s+america/i
      },
      
      // Wells Fargo patterns
      wellsFargo: {
        transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})\s*([\d,]+\.?\d{0,2})?/g,
        dateFormat: 'MM/DD/YYYY',
        header: /wells\s+fargo/i
      },
      
      // Citibank patterns
      citibank: {
        transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})\s*([\d,]+\.?\d{0,2})?/g,
        dateFormat: 'MM/DD/YYYY',
        header: /citi/i
      }
    }
  }

  /**
   * Parse PDF buffer and extract transaction data with AI enhancement
   */
  async parsePDF(pdfBuffer, useAI = true) {
    try {
      console.log('Starting enhanced PDF parsing, buffer size:', pdfBuffer.length)
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer })
      const pdfDoc = await loadingTask.promise
      
      let fullText = ''
      const numPages = pdfDoc.numPages
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + '\n'
      }
      
      const text = fullText
      console.log('Extracted text length:', text.length)
      
      // Detect bank type using traditional method
      const bankType = this.detectBankType(text)
      console.log('Detected bank type:', bankType)
      
      let extractedData
      
      // Try AI-enhanced extraction first if enabled
      if (useAI && process.env.ANTHROPIC_API_KEY) {
        try {
          console.log('Attempting AI-enhanced extraction...')
          extractedData = await claudeAI.enhancePDFExtraction(text, bankType)
          
          if (extractedData && extractedData.transactions && extractedData.transactions.length > 0) {
            console.log('AI extraction successful, found', extractedData.transactions.length, 'transactions')
            
            // Enhance transactions with AI categorization and analysis
            const enhancedTransactions = await this.enhanceTransactions(extractedData.transactions)
            
            return {
              success: true,
              data: {
                bankType,
                accountInfo: extractedData.accountInfo,
                transactions: enhancedTransactions,
                totalTransactions: enhancedTransactions.length,
                statementPeriod: extractedData.statementPeriod,
                metadata: {
                  pages: numPages,
                  parsedAt: new Date().toISOString(),
                  aiEnhanced: true,
                  extractionMethod: 'AI'
                },
                aiInsights: await this.generateAIInsights(enhancedTransactions)
              }
            }
          } else {
            console.log('AI extraction failed or returned no transactions, falling back to traditional parsing')
          }
        } catch (error) {
          console.error('AI extraction failed:', error)
          console.log('Falling back to traditional parsing')
        }
      }
      
      // Fallback to traditional extraction
      console.log('Using traditional extraction method')
      const accountInfo = this.extractAccountInfo(text, bankType)
      const transactions = this.extractTransactions(text, bankType)
      const cleanedTransactions = this.cleanTransactions(transactions)
      
      // Enhance with AI if available
      let enhancedTransactions = cleanedTransactions
      let aiInsights = null
      
      if (useAI && process.env.ANTHROPIC_API_KEY && cleanedTransactions.length > 0) {
        try {
          enhancedTransactions = await this.enhanceTransactions(cleanedTransactions)
          aiInsights = await this.generateAIInsights(enhancedTransactions)
        } catch (error) {
          console.error('AI enhancement failed:', error)
        }
      }
      
      return {
        success: true,
        data: {
          bankType,
          accountInfo,
          transactions: enhancedTransactions,
          totalTransactions: enhancedTransactions.length,
          statementPeriod: this.extractStatementPeriod(text),
          metadata: {
            pages: numPages,
            parsedAt: new Date().toISOString(),
            aiEnhanced: useAI && process.env.ANTHROPIC_API_KEY,
            extractionMethod: 'Traditional'
          },
          aiInsights
        }
      }
    } catch (error) {
      console.error('Enhanced PDF parsing error:', error)
      return {
        success: false,
        error: error.message || 'Failed to parse PDF'
      }
    }
  }

  /**
   * Enhance transactions with AI categorization and normalization
   */
  async enhanceTransactions(transactions) {
    try {
      console.log('Enhancing transactions with AI...')
      
      // Get AI categorization
      const aiCategories = await claudeAI.categorizeTransactions(transactions)
      
      // Get merchant normalization
      const merchantNames = transactions.map(t => t.description)
      const normalizedMerchants = await claudeAI.normalizeMerchantNames(merchantNames)
      
      // Detect anomalies
      const anomalies = await claudeAI.detectAnomalies(transactions)
      
      // Combine traditional and AI data
      const enhancedTransactions = transactions.map((transaction, index) => {
        const aiData = aiCategories[index] || {}
        const anomaly = anomalies.find(a => a.transactionIndex === index)
        
        return {
          ...transaction,
          // Keep original category as fallback
          originalCategory: transaction.category,
          // Use AI category if available and confident
          category: aiData.confidence > 70 ? aiData.category : transaction.category,
          subcategory: aiData.subcategory,
          confidence: aiData.confidence || 0,
          normalizedMerchant: normalizedMerchants[transaction.description] || transaction.description,
          aiReasoning: aiData.reasoning,
          anomaly: anomaly ? {
            type: anomaly.anomalyType,
            severity: anomaly.severity,
            description: anomaly.description,
            recommendation: anomaly.recommendation
          } : null
        }
      })
      
      console.log('AI enhancement completed')
      return enhancedTransactions
    } catch (error) {
      console.error('Transaction enhancement error:', error)
      return transactions
    }
  }

  /**
   * Generate AI insights for the statement
   */
  async generateAIInsights(transactions) {
    try {
      const insights = await claudeAI.generateSpendingInsights(transactions)
      return insights
    } catch (error) {
      console.error('AI insights generation error:', error)
      return null
    }
  }

  /**
   * Detect which bank issued the statement
   */
  detectBankType(text) {
    const lowerText = text.toLowerCase()
    
    if (this.patterns.chase.header.test(lowerText)) return 'chase'
    if (this.patterns.bankOfAmerica.header.test(lowerText)) return 'bankOfAmerica'
    if (this.patterns.wellsFargo.header.test(lowerText)) return 'wellsFargo'
    if (this.patterns.citibank.header.test(lowerText)) return 'citibank'
    
    return 'generic'
  }

  /**
   * Extract account information from statement (traditional method)
   */
  extractAccountInfo(text, bankType) {
    const info = {}
    
    // Extract account number (last 4 digits usually shown)
    const accountMatch = text.match(/account\s*(?:number|#)?[:\s]*\*+(\d{4})/i)
    if (accountMatch) {
      info.accountNumber = `****${accountMatch[1]}`
    }
    
    // Extract account holder name
    const nameMatch = text.match(/(?:account\s+holder|name)[:\s]+([A-Z][A-Z\s]+)/i)
    if (nameMatch) {
      info.accountHolder = nameMatch[1].trim()
    }
    
    // Extract opening and closing balance
    const openingBalanceMatch = text.match(/(?:opening|beginning)\s+balance[:\s]+\$?([\d,]+\.?\d{0,2})/i)
    if (openingBalanceMatch) {
      info.openingBalance = this.parseAmount(openingBalanceMatch[1])
    }
    
    const closingBalanceMatch = text.match(/(?:closing|ending)\s+balance[:\s]+\$?([\d,]+\.?\d{0,2})/i)
    if (closingBalanceMatch) {
      info.closingBalance = this.parseAmount(closingBalanceMatch[1])
    }
    
    return info
  }

  /**
   * Extract transaction data from statement text (traditional method)
   */
  extractTransactions(text, bankType) {
    const transactions = []
    const pattern = this.patterns[bankType]?.transaction || this.patterns.generic.transaction
    
    // Split text into lines for better parsing
    const lines = text.split('\n')
    
    for (const line of lines) {
      const matches = [...line.matchAll(pattern)]
      
      for (const match of matches) {
        const transaction = this.parseTransactionMatch(match, bankType)
        if (transaction) {
          transactions.push(transaction)
        }
      }
    }
    
    // If generic pattern didn't work well, try alternative parsing
    if (transactions.length === 0) {
      return this.alternativeTransactionExtraction(text)
    }
    
    return transactions
  }

  /**
   * Parse individual transaction match (traditional method)
   */
  parseTransactionMatch(match, bankType) {
    try {
      const [fullMatch, date, description, amount, balance] = match
      
      // Parse date
      const parsedDate = this.parseDate(date, bankType)
      if (!parsedDate) return null
      
      // Parse amount
      const parsedAmount = this.parseAmount(amount)
      if (parsedAmount === null) return null
      
      // Parse balance (if available)
      const parsedBalance = balance ? this.parseAmount(balance) : null
      
      // Clean description
      const cleanDescription = this.cleanDescription(description)
      
      // Determine transaction type
      const transactionType = this.determineTransactionType(cleanDescription, parsedAmount)
      
      return {
        date: parsedDate,
        description: cleanDescription,
        amount: parsedAmount,
        balance: parsedBalance,
        type: transactionType,
        category: this.categorizeTransaction(cleanDescription)
      }
    } catch (error) {
      console.error('Error parsing transaction match:', error)
      return null
    }
  }

  /**
   * Alternative transaction extraction for complex formats (traditional method)
   */
  alternativeTransactionExtraction(text) {
    const transactions = []
    const lines = text.split('\n')
    
    // Look for lines that might contain transaction data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines and headers
      if (!line || this.isHeaderLine(line)) continue
      
      // Look for date patterns
      const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/?\d{0,4})/g)
      if (!dateMatch) continue
      
      // Look for amount patterns
      const amountMatch = line.match(/([-]?\$?[\d,]+\.?\d{0,2})/g)
      if (!amountMatch || amountMatch.length < 1) continue
      
      // Extract transaction components
      const date = this.parseDate(dateMatch[0])
      if (!date) continue
      
      // Find description (text between date and first amount)
      const dateIndex = line.indexOf(dateMatch[0])
      const firstAmountIndex = line.indexOf(amountMatch[0])
      
      if (dateIndex >= firstAmountIndex) continue
      
      const description = line.substring(dateIndex + dateMatch[0].length, firstAmountIndex).trim()
      const amount = this.parseAmount(amountMatch[0])
      const balance = amountMatch.length > 1 ? this.parseAmount(amountMatch[amountMatch.length - 1]) : null
      
      if (amount !== null && description) {
        transactions.push({
          date,
          description: this.cleanDescription(description),
          amount,
          balance,
          type: this.determineTransactionType(description, amount),
          category: this.categorizeTransaction(description)
        })
      }
    }
    
    return transactions
  }

  /**
   * Parse date string to ISO format
   */
  parseDate(dateStr, bankType) {
    try {
      // Remove any extra whitespace
      dateStr = dateStr.trim()
      
      // Handle different date formats
      if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        // MM/DD/YYYY or M/D/YYYY
        const [month, day, year] = dateStr.split('/')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString().split('T')[0]
      } else if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
        // MM/DD (assume current year)
        const [month, day] = dateStr.split('/')
        const year = new Date().getFullYear()
        return new Date(year, parseInt(month) - 1, parseInt(day)).toISOString().split('T')[0]
      }
      
      return null
    } catch (error) {
      console.error('Date parsing error:', error)
      return null
    }
  }

  /**
   * Parse amount string to number
   */
  parseAmount(amountStr) {
    try {
      if (!amountStr) return null
      
      // Remove currency symbols and spaces
      let cleaned = amountStr.replace(/[\$\s]/g, '')
      
      // Handle negative amounts in parentheses
      if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
        cleaned = '-' + cleaned.slice(1, -1)
      }
      
      // Remove commas
      cleaned = cleaned.replace(/,/g, '')
      
      // Parse to float
      const amount = parseFloat(cleaned)
      
      return isNaN(amount) ? null : amount
    } catch (error) {
      console.error('Amount parsing error:', error)
      return null
    }
  }

  /**
   * Clean and normalize transaction description
   */
  cleanDescription(description) {
    return description
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-&.]/g, '')
      .trim()
      .substring(0, 100) // Limit length
  }

  /**
   * Determine transaction type (debit/credit)
   */
  determineTransactionType(description, amount) {
    if (amount > 0) {
      return 'credit'
    } else if (amount < 0) {
      return 'debit'
    }
    
    // Check description for clues
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('deposit') || lowerDesc.includes('credit')) {
      return 'credit'
    } else if (lowerDesc.includes('withdrawal') || lowerDesc.includes('debit') || lowerDesc.includes('fee')) {
      return 'debit'
    }
    
    return 'unknown'
  }

  /**
   * Categorize transaction based on description (basic categorization)
   */
  categorizeTransaction(description) {
    const lowerDesc = description.toLowerCase()
    
    // Banking fees
    if (lowerDesc.includes('fee') || lowerDesc.includes('charge')) {
      return 'Banking Fees'
    }
    
    // ATM transactions
    if (lowerDesc.includes('atm') || lowerDesc.includes('withdrawal')) {
      return 'ATM/Cash'
    }
    
    // Direct deposit/salary
    if (lowerDesc.includes('direct deposit') || lowerDesc.includes('payroll') || lowerDesc.includes('salary')) {
      return 'Income'
    }
    
    // Transfers
    if (lowerDesc.includes('transfer') || lowerDesc.includes('tfr')) {
      return 'Transfers'
    }
    
    // Online/electronic payments
    if (lowerDesc.includes('online') || lowerDesc.includes('electronic') || lowerDesc.includes('ach')) {
      return 'Online Payment'
    }
    
    // Check payments
    if (lowerDesc.includes('check') || lowerDesc.includes('chk')) {
      return 'Check'
    }
    
    // Debit card purchases
    if (lowerDesc.includes('debit') || lowerDesc.includes('purchase') || lowerDesc.includes('pos')) {
      return 'Debit Card'
    }
    
    return 'Other'
  }

  /**
   * Extract statement period from text
   */
  extractStatementPeriod(text) {
    const periodMatch = text.match(/statement\s+period[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)
    
    if (periodMatch) {
      return {
        from: this.parseDate(periodMatch[1]),
        to: this.parseDate(periodMatch[2])
      }
    }
    
    return null
  }

  /**
   * Clean and validate extracted transactions
   */
  cleanTransactions(transactions) {
    return transactions
      .filter(tx => tx && tx.date && tx.description && tx.amount !== null)
      .map(tx => ({
        ...tx,
        description: tx.description.trim(),
        amount: Math.round(tx.amount * 100) / 100, // Round to 2 decimal places
        balance: tx.balance ? Math.round(tx.balance * 100) / 100 : null
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  /**
   * Check if line is likely a header/footer line
   */
  isHeaderLine(line) {
    const lowerLine = line.toLowerCase()
    const headerPatterns = [
      /page\s+\d+/,
      /statement/,
      /account\s+summary/,
      /transaction\s+history/,
      /date\s+description/,
      /beginning\s+balance/,
      /ending\s+balance/
    ]
    
    return headerPatterns.some(pattern => pattern.test(lowerLine))
  }
}

// Export enhanced parser instance
export const enhancedBankStatementParser = new EnhancedBankStatementParser()