// Use a conditional import to avoid module initialization issues
let pdfParse;

// Safely import pdf-parse only when needed
async function getPdfParser() {
  if (!pdfParse) {
    try {
      // Import the core functionality without triggering debug code
      const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
      pdfParse = pdfParseModule.default || pdfParseModule;
    } catch (error) {
      console.error('Failed to load pdf-parse:', error);
      throw new Error('PDF parsing library not available');
    }
  }
  return pdfParse;
}

/**
 * Bank statement PDF parser with pattern recognition for major banks
 */
export class BankStatementParser {
  constructor() {
    // Common transaction patterns for different banks
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
   * Parse PDF buffer and extract transaction data
   */
  async parsePDF(pdfBuffer) {
    try {
      console.log('Starting PDF parsing, buffer size:', pdfBuffer.length)
      
      // Get PDF parser dynamically
      const parser = await getPdfParser()
      
      // Parse PDF using pdf-parse
      const pdfData = await parser(pdfBuffer)
      const text = pdfData.text
      const numPages = pdfData.numpages
      
      console.log('Extracted text length:', text.length)
      
      // Detect bank type
      const bankType = this.detectBankType(text)
      console.log('Detected bank type:', bankType)
      
      // Extract basic info
      const accountInfo = this.extractAccountInfo(text, bankType)
      
      // Extract transactions
      const transactions = this.extractTransactions(text, bankType)
      console.log('Found transactions:', transactions.length)
      
      // Clean and validate transactions
      const cleanedTransactions = this.cleanTransactions(transactions)
      
      return {
        success: true,
        data: {
          bankType,
          accountInfo,
          transactions: cleanedTransactions,
          totalTransactions: cleanedTransactions.length,
          statementPeriod: this.extractStatementPeriod(text),
          metadata: {
            pages: numPages,
            parsedAt: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      console.error('PDF parsing error:', error)
      return {
        success: false,
        error: error.message || 'Failed to parse PDF'
      }
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
   * Extract account information from statement
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
   * Extract transaction data from statement text
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
   * Parse individual transaction match
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
   * Alternative transaction extraction for complex formats
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
   * Categorize transaction based on description
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

// Export default instance
export const bankStatementParser = new BankStatementParser()