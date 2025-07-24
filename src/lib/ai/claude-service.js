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
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'
  }

  /**
   * Enhance transaction categorization using Claude's NLP
   */
  async categorizeTransactions(transactions) {
    try {
      const prompt = `You are a financial AI assistant specializing in transaction categorization. Analyze the following bank transactions and provide enhanced categorization with confidence scores.

For each transaction, provide:
1. Primary category (e.g., "Groceries", "Gas & Fuel", "Restaurants", "Utilities", "Healthcare", etc.)
2. Subcategory if applicable
3. Confidence score (0-100)
4. Normalized merchant name
5. Any anomaly flags (unusual amount, suspicious pattern, etc.)

Transactions to analyze:
${JSON.stringify(transactions.slice(0, 50), null, 2)}

Respond with a JSON array matching the input order with these fields:
{
  "category": "Primary Category",
  "subcategory": "Subcategory or null",
  "confidence": 95,
  "normalizedMerchant": "Cleaned merchant name",
  "anomalyFlags": ["flag1", "flag2"] or [],
  "reasoning": "Brief explanation"
}

Focus on accuracy and be conservative with confidence scores. Flag anything unusual.`

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })

      const result = JSON.parse(response.content[0].text)
      return result
    } catch (error) {
      console.error('Claude categorization error:', error)
      return transactions.map(() => ({
        category: 'Other',
        subcategory: null,
        confidence: 0,
        normalizedMerchant: null,
        anomalyFlags: [],
        reasoning: 'AI processing failed'
      }))
    }
  }

  /**
   * Normalize merchant names using Claude's understanding
   */
  async normalizeMerchantNames(merchantNames) {
    try {
      const uniqueMerchants = [...new Set(merchantNames)]
      
      const prompt = `You are a financial data specialist. Normalize these merchant names to clean, standardized formats.

Examples:
- "WALMART #1234 SUPERCENTER" -> "Walmart"
- "SQ *COFFEE SHOP NYC" -> "Coffee Shop"
- "AMZN MKTP US*ABC123" -> "Amazon"
- "TST* STARBUCKS #123" -> "Starbucks"

Merchant names to normalize:
${JSON.stringify(uniqueMerchants, null, 2)}

Return a JSON object mapping original names to normalized names:
{
  "original_name": "normalized_name"
}`

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })

      const normalizedMap = JSON.parse(response.content[0].text)
      return normalizedMap
    } catch (error) {
      console.error('Claude merchant normalization error:', error)
      return {}
    }
  }

  /**
   * Detect anomalies in transaction patterns
   */
  async detectAnomalies(transactions, accountHistory = []) {
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

Current transactions:
${JSON.stringify(transactions.slice(0, 30), null, 2)}

${accountHistory.length > 0 ? `Historical context:
${JSON.stringify(accountHistory.slice(0, 20), null, 2)}` : ''}

For each anomaly found, provide:
{
  "transactionIndex": 0,
  "anomalyType": "unusual_amount|suspicious_merchant|duplicate|frequency|geographic|timing",
  "severity": "low|medium|high",
  "description": "Clear explanation of the anomaly",
  "recommendation": "suggested action"
}

Return a JSON array of anomalies found, or empty array if none.`

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 3000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })

      const anomalies = JSON.parse(response.content[0].text)
      return Array.isArray(anomalies) ? anomalies : []
    } catch (error) {
      console.error('Claude anomaly detection error:', error)
      return []
    }
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

      const insights = JSON.parse(response.content[0].text)
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
   * Enhanced PDF text analysis for better transaction extraction
   */
  async enhancePDFExtraction(pdfText, bankType = 'unknown') {
    try {
      const prompt = `You are a bank statement parsing expert. Analyze this PDF text and extract transaction data with high accuracy.

Bank type: ${bankType}
PDF Text:
${pdfText.slice(0, 8000)}

Extract:
1. All transactions with dates, descriptions, amounts, and balances
2. Account information (account number, holder name, balances)
3. Statement period
4. Any fees or charges
5. Categorize each transaction

Return structured JSON:
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

      const extractedData = JSON.parse(response.content[0].text)
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
    const batchSize = 50
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