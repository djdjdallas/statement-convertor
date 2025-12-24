import Anthropic from '@anthropic-ai/sdk'

/**
 * Claude AI Service for financial data analysis
 * Provides intelligent transaction categorization, merchant normalization, and anomaly detection
 */
export class ClaudeAIService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    this.model = process.env.CLAUDE_MODEL || 'claude-3-7-sonnet-20250219'
  }

  /**
   * Enhance transaction categorization using Claude's NLP
   * Automatically batches large transaction sets for reliability
   */
  async categorizeTransactions(transactions) {
    const BATCH_SIZE = 25 // Optimal size to stay within token limits
    const allResults = []

    // Process in batches if more than batch size
    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(transactions.length / BATCH_SIZE)

      console.log(`Categorizing batch ${batchNum}/${totalBatches} (${batch.length} transactions)`)

      try {
        const prompt = `You are a financial AI assistant specializing in transaction categorization. Analyze the following bank transactions and provide enhanced categorization with confidence scores.

For each transaction, provide:
1. Primary category (e.g., "Groceries", "Gas & Fuel", "Restaurants", "Utilities", "Healthcare", etc.)
2. Subcategory if applicable
3. Confidence score (0-100)
4. Normalized merchant name
5. Any anomaly flags (unusual amount, suspicious pattern, etc.)

Transactions to analyze:
${JSON.stringify(batch, null, 2)}

Respond with a JSON array matching the input order with these fields:
{
  "category": "Primary Category",
  "subcategory": "Subcategory or null",
  "confidence": 95,
  "normalizedMerchant": "Cleaned merchant name",
  "anomalyFlags": ["flag1", "flag2"] or [],
  "reasoning": "Brief explanation"
}

Focus on accuracy and be conservative with confidence scores. Flag anything unusual.

CRITICAL: You MUST return complete, valid JSON. Do not truncate any fields. Return exactly ${batch.length} items in the array.`

        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 8000,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        })

        const result = this.extractJSON(response.content[0].text)
        allResults.push(...(Array.isArray(result) ? result : [result]))

        // Rate limiting between batches
        if (i + BATCH_SIZE < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Claude categorization error for batch ${batchNum}:`, error)
        // Add fallback results for failed batch
        allResults.push(...batch.map(() => ({
          category: 'Other',
          subcategory: null,
          confidence: 0,
          normalizedMerchant: null,
          anomalyFlags: [],
          reasoning: 'AI processing failed for this batch'
        })))
      }
    }

    return allResults
  }

  /**
   * Normalize merchant names using Claude's understanding
   * Processes in batches for larger merchant sets
   */
  async normalizeMerchantNames(merchantNames) {
    const BATCH_SIZE = 50 // Merchant names are short, can do more per batch
    const uniqueMerchants = [...new Set(merchantNames)]
    const allNormalized = {}

    for (let i = 0; i < uniqueMerchants.length; i += BATCH_SIZE) {
      const batch = uniqueMerchants.slice(i, i + BATCH_SIZE)

      try {
        const prompt = `You are a financial data specialist. Normalize these merchant names to clean, standardized formats.

Examples:
- "WALMART #1234 SUPERCENTER" -> "Walmart"
- "SQ *COFFEE SHOP NYC" -> "Coffee Shop"
- "AMZN MKTP US*ABC123" -> "Amazon"
- "TST* STARBUCKS #123" -> "Starbucks"

Merchant names to normalize:
${JSON.stringify(batch, null, 2)}

CRITICAL: Return ONLY valid JSON with no explanations or formatting. Just the raw JSON object mapping original names to normalized names:
{
  "original_name": "normalized_name"
}`

        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4000,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        })

        const normalizedMap = this.extractJSON(response.content[0].text)
        Object.assign(allNormalized, normalizedMap)

        // Rate limiting between batches
        if (i + BATCH_SIZE < uniqueMerchants.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Claude merchant normalization error for batch starting at ${i}:`, error)
        // Continue with next batch
      }
    }

    return allNormalized
  }

  /**
   * Detect anomalies in transaction patterns
   * Processes in batches for larger transaction sets
   */
  async detectAnomalies(transactions, accountHistory = []) {
    const BATCH_SIZE = 30 // Slightly larger for anomaly detection
    const allAnomalies = []

    for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
      const batch = transactions.slice(i, i + BATCH_SIZE)
      const batchOffset = i // Used to adjust transaction indices in results

      try {
        const prompt = `You are a fraud detection specialist. Analyze these transactions for anomalies and suspicious patterns.

Look for:
1. Unusual amounts compared to typical spending
2. Suspicious merchant names or descriptions
3. Frequency anomalies (too many transactions in short time)
4. Geographic inconsistencies
5. Round number transactions that seem suspicious
6. Duplicate or near-duplicate transactions
7. Time-based anomalies (transactions at unusual hours)

Current transactions (indices ${i} to ${i + batch.length - 1}):
${JSON.stringify(batch, null, 2)}

${accountHistory.length > 0 ? `Historical context:
${JSON.stringify(accountHistory.slice(0, 20), null, 2)}` : ''}

For each anomaly found, provide:
{
  "transactionIndex": <use indices ${i} to ${i + batch.length - 1}>,
  "anomalyType": "unusual_amount|suspicious_merchant|duplicate|frequency|geographic|timing",
  "severity": "low|medium|high",
  "description": "Clear explanation of the anomaly",
  "recommendation": "suggested action"
}

CRITICAL: Return ONLY valid JSON array with no explanations or formatting. Just the raw JSON. Do not truncate.
[anomalies] or [] if none found.`

        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4000,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        })

        const anomalies = this.extractJSON(response.content[0].text)
        if (Array.isArray(anomalies)) {
          allAnomalies.push(...anomalies)
        }

        // Rate limiting between batches
        if (i + BATCH_SIZE < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`Claude anomaly detection error for batch starting at ${i}:`, error)
        // Continue with next batch
      }
    }

    return allAnomalies
  }

  /**
   * Generate financial insights and spending analysis
   */
  async generateSpendingInsights(transactions, timeframe = 'monthly') {
    try {
      const prompt = `You are a financial advisor AI. Analyze this transaction data and provide actionable spending insights.

Transaction data:
${JSON.stringify(transactions.slice(0, 100), null, 2)}

Provide insights on:
1. Top spending categories
2. Spending trends and patterns
3. Unusual or noteworthy transactions
4. Budget recommendations
5. Potential savings opportunities
6. Cash flow patterns

Return a JSON object with:
{
  "summary": "Brief overview of spending patterns",
  "topCategories": [{"category": "Category", "amount": 1234.56, "percentage": 15.5}],
  "trends": ["trend1", "trend2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "savingsOpportunities": ["opportunity1", "opportunity2"],
  "totalSpent": 1234.56,
  "averageTransaction": 45.67,
  "flags": ["important observation1", "important observation2"]
}`

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })

      const insights = this.extractJSON(response.content[0].text)
      return insights
    } catch (error) {
      console.error('Claude insights error:', error)
      return {
        summary: 'Unable to generate insights',
        topCategories: [],
        trends: [],
        recommendations: [],
        savingsOpportunities: [],
        totalSpent: 0,
        averageTransaction: 0,
        flags: ['AI analysis unavailable']
      }
    }
  }

  /**
   * Extract JSON from Claude response, handling markdown code blocks and other formatting
   */
  extractJSON(text) {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').replace(/```/g, '')

      // Find JSON content (objects or arrays)
      const objectMatch = cleanText.match(/\{[\s\S]*\}/)
      const arrayMatch = cleanText.match(/\[[\s\S]*\]/)

      if (objectMatch && arrayMatch) {
        // Choose the longer match (likely the complete JSON)
        cleanText = objectMatch[0].length > arrayMatch[0].length ? objectMatch[0] : arrayMatch[0]
      } else if (objectMatch) {
        cleanText = objectMatch[0]
      } else if (arrayMatch) {
        cleanText = arrayMatch[0]
      }

      // Remove any leading/trailing non-JSON text
      cleanText = cleanText.trim()

      // Try to repair truncated JSON arrays
      if (cleanText.startsWith('[') && !cleanText.endsWith(']')) {
        console.warn('Detected truncated JSON array, attempting repair...')
        // Find the last complete object (ends with })
        const lastCompleteObject = cleanText.lastIndexOf('}')
        if (lastCompleteObject > 0) {
          cleanText = cleanText.substring(0, lastCompleteObject + 1) + ']'
          console.log('Repaired JSON array by truncating incomplete entries')
        }
      }

      // Try to repair truncated JSON objects
      if (cleanText.startsWith('{') && !cleanText.endsWith('}')) {
        console.warn('Detected truncated JSON object, attempting repair...')
        // Count brackets to find where to close
        let depth = 0
        let lastValidPos = 0
        for (let i = 0; i < cleanText.length; i++) {
          if (cleanText[i] === '{') depth++
          if (cleanText[i] === '}') {
            depth--
            lastValidPos = i + 1
          }
        }
        if (lastValidPos > 0) {
          cleanText = cleanText.substring(0, lastValidPos)
          console.log('Repaired JSON object by truncating incomplete entries')
        }
      }

      return JSON.parse(cleanText)
    } catch (error) {
      console.error('JSON extraction error:', error)
      console.error('Raw text:', text.substring(0, 500))
      throw error
    }
  }

  /**
   * Enhanced PDF text analysis for better transaction extraction
   */
  async enhancePDFExtraction(pdfText, bankType = 'unknown') {
    try {
      const prompt = `You are a financial document parsing expert. Analyze this PDF text and extract ALL transaction data with high accuracy. This document may contain multiple formats:

1. Bank statement format: Date, Description, Amount, Balance
2. Ledger format: Date, Description, Credits, Debits, Running Profit, Balance

Bank type: ${bankType}
PDF Text:
${pdfText.slice(0, 12000)}

Extract ALL transactions from ALL pages and formats including:
1. Bank statement transactions (deposits, withdrawals, fees, etc.)
2. Ledger transactions (credits, debits, sales, purchases, labor, supplies)
3. Account information (account number, holder name, balances)
4. Statement period
5. Categorize each transaction appropriately

IMPORTANT: For the amount field:
- Debits/withdrawals/expenses should be NEGATIVE numbers (e.g., -45.67)
- Credits/deposits/income should be POSITIVE numbers (e.g., 100.00)
- For ledger entries: Credits = positive amounts, Debits = negative amounts
- Look for indicators in the description to determine if it's a debit or credit

CRITICAL: Return ONLY valid JSON with no explanations, comments, or additional text. Do not include markdown formatting or code blocks. Just the raw JSON:
{
  "accountInfo": {
    "accountNumber": "****1234",
    "accountHolder": "Name",
    "openingBalance": 1234.56,
    "closingBalance": 1234.56
  },
  "statementPeriod": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "WALMART SUPERCENTER",
      "amount": -45.67,
      "balance": 1000.00,
      "category": "Groceries",
      "type": "debit"
    },
    {
      "date": "2024-01-20",
      "description": "DIRECT DEPOSIT - PAYROLL",
      "amount": 2500.00,
      "balance": 3500.00,
      "category": "Income",
      "type": "credit"
    }
  ],
  "summary": {
    "totalTransactions": 25,
    "totalDebits": -1234.56,
    "totalCredits": 2000.00
  }
}`

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })

      const extractedData = this.extractJSON(response.content[0].text)
      return extractedData
    } catch (error) {
      console.error('Claude PDF extraction error:', error)
      return null
    }
  }

  /**
   * Process transactions in batches to handle API limits
   */
  async processBatch(transactions, operation = 'categorize') {
    const batchSize = 25 // Reduced from 50 to prevent response truncation
    const results = []

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      
      try {
        let batchResult
        switch (operation) {
          case 'categorize':
            batchResult = await this.categorizeTransactions(batch)
            break
          case 'anomalies':
            batchResult = await this.detectAnomalies(batch)
            break
          default:
            throw new Error(`Unknown operation: ${operation}`)
        }
        
        results.push(...batchResult)
        
        // Rate limiting - wait between batches
        if (i + batchSize < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Batch processing error for batch ${i}:`, error)
        // Add empty results for failed batch
        results.push(...batch.map(() => null))
      }
    }

    return results
  }
}

// Export singleton instance
export const claudeAI = new ClaudeAIService()