import { claudeAI } from './claude-service.js'

/**
 * Financial Assistant Service
 * Provides conversational AI for financial Q&A, natural language queries, and contextual help
 */
export class FinancialAssistantService {
  constructor() {
    this.conversationHistory = new Map() // Store conversations by user ID
    this.maxHistoryLength = 20 // Keep last 20 messages
    
    // Common financial question patterns
    this.questionPatterns = {
      spending: ['spend', 'spent', 'expense', 'cost', 'money on', 'paid for'],
      income: ['income', 'salary', 'earned', 'made', 'deposit', 'revenue'],  
      categories: ['category', 'categories', 'type of', 'kind of'],
      trends: ['trend', 'pattern', 'over time', 'monthly', 'weekly', 'increase', 'decrease'],
      budget: ['budget', 'limit', 'allowance', 'should spend', 'recommended'],
      forecast: ['predict', 'forecast', 'future', 'next month', 'upcoming'],
      comparison: ['compare', 'vs', 'versus', 'difference', 'more than', 'less than']
    }

    // Suggested prompts for users
    this.suggestedPrompts = [
      "How much did I spend on restaurants last month?",
      "What's my biggest spending category?",
      "Show me my income vs expenses trend",
      "How does my spending compare to my budget?",
      "What are some ways I can save money?",
      "Predict my cash flow for next month",
      "Find any unusual transactions",
      "How much do I spend on average per day?"
    ]
  }

  /**
   * Process a natural language query about financial data
   */
  async processFinancialQuery(userId, query, transactionData, userProfile = null, conversationId = null) {
    try {
      // Get or create conversation history
      const conversationKey = `${userId}-${conversationId || 'default'}`
      if (!this.conversationHistory.has(conversationKey)) {
        this.conversationHistory.set(conversationKey, [])
      }
      
      const history = this.conversationHistory.get(conversationKey)
      
      // Analyze the query to understand intent
      const queryAnalysis = this.analyzeQuery(query)
      
      // Generate context-aware response
      const response = await this.generateContextualResponse(
        query,
        queryAnalysis,
        transactionData,
        userProfile,
        history
      )
      
      // Update conversation history
      history.push({
        type: 'user',
        message: query,
        timestamp: new Date().toISOString(),
        intent: queryAnalysis.intent
      })
      
      history.push({
        type: 'assistant',
        message: response.message,
        timestamp: new Date().toISOString(),
        data: response.data,
        suggestions: response.suggestions
      })
      
      // Trim history if too long
      if (history.length > this.maxHistoryLength) {
        history.splice(0, history.length - this.maxHistoryLength)
      }
      
      return {
        success: true,
        response: response.message,
        data: response.data,
        suggestions: response.suggestions,
        intent: queryAnalysis.intent,
        conversationId: conversationId || 'default'
      }
      
    } catch (error) {
      console.error('Financial query processing error:', error)
      return {
        success: false,
        error: error.message,
        response: "I'm sorry, I encountered an error processing your question. Please try rephrasing it or contact support if the issue persists."
      }
    }
  }

  /**
   * Analyze user query to understand intent and extract parameters
   */
  analyzeQuery(query) {
    const lowerQuery = query.toLowerCase()
    const analysis = {
      intent: 'general',
      parameters: {},
      confidence: 0
    }

    // Check for question patterns
    for (const [intent, patterns] of Object.entries(this.questionPatterns)) {
      const matches = patterns.filter(pattern => lowerQuery.includes(pattern))
      if (matches.length > 0) {
        analysis.intent = intent
        analysis.confidence = matches.length / patterns.length
        break
      }
    }

    // Extract time periods
    const timePatterns = {
      'last month': { period: 'month', offset: -1 },
      'this month': { period: 'month', offset: 0 },
      'last week': { period: 'week', offset: -1 },
      'this week': { period: 'week', offset: 0 },
      'last year': { period: 'year', offset: -1 },
      'this year': { period: 'year', offset: 0 },
      'yesterday': { period: 'day', offset: -1 },
      'today': { period: 'day', offset: 0 }
    }

    for (const [phrase, timeInfo] of Object.entries(timePatterns)) {
      if (lowerQuery.includes(phrase)) {
        analysis.parameters.timeFilter = timeInfo
        break
      }
    }

    // Extract categories (if mentioned)
    const commonCategories = [
      'restaurant', 'food', 'grocery', 'gas', 'fuel', 'shopping', 'entertainment',
      'utilities', 'rent', 'mortgage', 'insurance', 'healthcare', 'transport'
    ]
    
    for (const category of commonCategories) {
      if (lowerQuery.includes(category)) {
        analysis.parameters.category = category
        break
      }
    }

    // Extract amounts
    const amountMatch = lowerQuery.match(/\$?([\d,]+\.?\d*)/)
    if (amountMatch) {
      analysis.parameters.amount = parseFloat(amountMatch[1].replace(/,/g, ''))
    }

    return analysis
  }

  /**
   * Generate contextual response using Claude AI
   */
  async generateContextualResponse(query, analysis, transactionData, userProfile, history) {
    try {
      // Prepare relevant transaction data based on query
      const relevantData = this.filterRelevantData(transactionData, analysis.parameters)
      
      // Build context for Claude
      const context = this.buildQueryContext(relevantData, userProfile, history)
      
      const prompt = `You are a helpful financial assistant with access to the user's bank transaction data. Answer their question in a conversational, helpful manner.

User Question: "${query}"

Query Analysis:
- Intent: ${analysis.intent}
- Confidence: ${analysis.confidence}
- Parameters: ${JSON.stringify(analysis.parameters)}

Transaction Data Context:
${context.transactionSummary}

User Profile:
${context.userSummary}

Recent Conversation:
${context.conversationSummary}

Please provide:
1. A clear, conversational answer to their question
2. Specific data/numbers when relevant
3. Helpful insights or observations
4. 2-3 follow-up question suggestions

Format your response as JSON:
{
  "message": "Your conversational response here",
  "data": {
    "key_metrics": {},
    "transactions": [],
    "insights": []
  },
  "suggestions": [
    "Follow-up question 1",
    "Follow-up question 2", 
    "Follow-up question 3"
  ]
}

Be specific with numbers, dates, and actionable insights. Keep the tone friendly and helpful.`

      const response = await claudeAI.anthropic.messages.create({
        model: claudeAI.model,
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })

      // Extract JSON from Claude's response, handling markdown code blocks
      let responseText = response.content[0].text

      // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
      const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (jsonMatch) {
        responseText = jsonMatch[1].trim()
      }

      const result = JSON.parse(responseText)
      return result

    } catch (error) {
      console.error('Claude response generation error:', error)
      
      // Fallback to simple response
      return this.generateSimpleResponse(query, analysis, transactionData)
    }
  }

  /**
   * Filter transaction data based on query parameters
   */
  filterRelevantData(transactions, parameters) {
    let filtered = [...transactions]

    // Apply time filter
    if (parameters.timeFilter) {
      const now = new Date()
      const { period, offset } = parameters.timeFilter
      
      let startDate, endDate
      
      switch (period) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
          break
        case 'week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay() + (offset * 7))
          startDate = weekStart
          endDate = new Date(weekStart)
          endDate.setDate(weekStart.getDate() + 6)
          break
        case 'year':
          startDate = new Date(now.getFullYear() + offset, 0, 1)
          endDate = new Date(now.getFullYear() + offset, 11, 31)
          break
        case 'day':
          startDate = new Date(now)
          startDate.setDate(now.getDate() + offset)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(startDate)
          endDate.setHours(23, 59, 59, 999)
          break
      }
      
      if (startDate && endDate) {
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startDate && transactionDate <= endDate
        })
      }
    }

    // Apply category filter
    if (parameters.category) {
      const categoryLower = parameters.category.toLowerCase()
      filtered = filtered.filter(t => 
        t.category?.toLowerCase().includes(categoryLower) ||
        t.description?.toLowerCase().includes(categoryLower)
      )
    }

    // Apply amount filter (for questions like "transactions over $500")
    if (parameters.amount) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= parameters.amount)
    }

    return filtered
  }

  /**
   * Build context summary for Claude
   */
  buildQueryContext(transactions, userProfile, history) {
    const context = {
      transactionSummary: '',
      userSummary: '',
      conversationSummary: ''
    }

    // Transaction summary
    if (transactions.length > 0) {
      const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      const categories = {}
      transactions.forEach(t => {
        const cat = t.category || 'Other'
        categories[cat] = (categories[cat] || 0) + Math.abs(t.amount)
      })

      const topCategories = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)

      context.transactionSummary = `
Total Transactions: ${transactions.length}
Total Income: $${totalIncome.toFixed(2)}
Total Expenses: $${totalExpenses.toFixed(2)}
Net Flow: $${(totalIncome - totalExpenses).toFixed(2)}
Top Categories: ${topCategories.map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`).join(', ')}
Date Range: ${transactions[0]?.date} to ${transactions[transactions.length - 1]?.date}
Sample Transactions: ${JSON.stringify(transactions.slice(0, 3), null, 2)}
      `.trim()
    } else {
      context.transactionSummary = 'No transactions found matching the query criteria.'
    }

    // User profile summary
    if (userProfile) {
      context.userSummary = `
Subscription: ${userProfile.subscription_tier || 'free'}
Member since: ${userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}
      `.trim()
    }

    // Conversation history
    if (history.length > 0) {
      const recentMessages = history.slice(-6) // Last 3 exchanges
      context.conversationSummary = recentMessages
        .map(msg => `${msg.type}: ${msg.message}`)
        .join('\n')
    }

    return context
  }

  /**
   * Generate simple fallback response
   */
  generateSimpleResponse(query, analysis, transactions) {
    const response = {
      message: "I understand you're asking about your financial data. Let me help you with that.",
      data: {},
      suggestions: this.suggestedPrompts.slice(0, 3)
    }

    // Basic analysis based on intent
    switch (analysis.intent) {
      case 'spending':
        const totalExpenses = transactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        response.message = `Based on your transaction data, your total expenses are $${totalExpenses.toFixed(2)}.`
        response.data.totalExpenses = totalExpenses
        break

      case 'income':
        const totalIncome = transactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0)
        response.message = `Your total income from the available data is $${totalIncome.toFixed(2)}.`
        response.data.totalIncome = totalIncome
        break

      case 'categories':
        const categories = {}
        transactions.forEach(t => {
          const cat = t.category || 'Other'
          categories[cat] = (categories[cat] || 0) + Math.abs(t.amount)
        })
        const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0]
        response.message = `Your top spending category is ${topCategory[0]} with $${topCategory[1].toFixed(2)} spent.`
        response.data.categories = categories
        break

      default:
        response.message = "I can help you analyze your spending, income, categories, trends, and more. What would you like to know about your finances?"
    }

    return response
  }

  /**
   * Get conversation history for a user
   */
  getConversationHistory(userId, conversationId = 'default') {
    const conversationKey = `${userId}-${conversationId}`
    return this.conversationHistory.get(conversationKey) || []
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(userId, conversationId = 'default') {
    const conversationKey = `${userId}-${conversationId}`
    this.conversationHistory.delete(conversationKey)
  }

  /**
   * Get suggested prompts based on user data
   */
  getSuggestedPrompts(transactions, userProfile) {
    const prompts = [...this.suggestedPrompts]
    
    // Add contextual prompts based on data
    if (transactions.length > 0) {
      const categories = new Set(transactions.map(t => t.category).filter(Boolean))
      const topCategory = Array.from(categories)[0]
      
      if (topCategory) {
        prompts.push(`How much did I spend on ${topCategory} this month?`)
      }
      
      // Add time-based prompts
      const hasRecentData = transactions.some(t => {
        const transactionDate = new Date(t.date)
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        return transactionDate >= oneMonthAgo
      })
      
      if (hasRecentData) {
        prompts.push("Compare this month's spending to last month")
      }
    }

    // Shuffle and return first 6
    return prompts.sort(() => 0.5 - Math.random()).slice(0, 6)
  }

  /**
   * Process natural language commands for data export
   */
  async processExportCommand(query, transactions) {
    const lowerQuery = query.toLowerCase()
    
    // Check if it's an export command
    const exportKeywords = ['export', 'download', 'save', 'send me', 'generate report']
    if (!exportKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return null
    }

    // Determine format
    let format = 'csv'
    if (lowerQuery.includes('excel') || lowerQuery.includes('xlsx')) {
      format = 'xlsx'
    }

    // Determine data scope
    let dataScope = 'all'
    if (lowerQuery.includes('last month')) {
      dataScope = 'last_month'
    } else if (lowerQuery.includes('this month')) {
      dataScope = 'this_month'
    }

    return {
      action: 'export',
      format,
      dataScope,
      message: `I'll help you export your transaction data as ${format.toUpperCase()}. Processing your request...`
    }
  }

  /**
   * Generate help message for new users
   */
  generateHelpMessage(userProfile) {
    return {
      message: `Hi! I'm your AI financial assistant. I can help you understand your spending, analyze trends, and answer questions about your finances. Here are some things you can ask me:`,
      suggestions: [
        "How much did I spend last month?",
        "What's my biggest expense category?", 
        "Show me unusual transactions",
        "Compare my income vs expenses",
        "Help me create a budget",
        "Predict my next month's cash flow"
      ],
      tips: [
        "Be specific with time periods (e.g., 'last month', 'this week')",
        "Ask about specific categories (e.g., 'restaurants', 'gas')",
        "I can help you export data or generate reports",
        "Try asking follow-up questions for deeper insights"
      ]
    }
  }
}

// Export singleton instance
export const financialAssistant = new FinancialAssistantService()