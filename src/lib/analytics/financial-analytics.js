import { claudeAI } from '../ai/claude-service.js'

/**
 * Financial Analytics Service
 * Provides advanced analytics including cash flow forecasting, trend analysis, and budget recommendations
 */
export class FinancialAnalyticsService {
  constructor() {
    this.categoryMappings = {
      // Income categories
      income: ['Income', 'Salary', 'Direct Deposit', 'Payroll', 'Dividend', 'Interest'],
      // Essential expenses
      essentials: ['Utilities', 'Rent', 'Mortgage', 'Insurance', 'Healthcare', 'Banking Fees'],
      // Discretionary spending
      discretionary: ['Restaurants', 'Entertainment', 'Shopping', 'Travel', 'Subscriptions'],
      // Transportation
      transportation: ['Gas & Fuel', 'Public Transport', 'Parking', 'Car Payment', 'Maintenance'],
      // Food & Groceries
      food: ['Groceries', 'Food & Dining', 'Coffee Shops'],
      // Other
      other: ['Other', 'Transfers', 'ATM/Cash', 'Check']
    }
  }

  /**
   * Generate cash flow forecast based on historical transaction data
   */
  async generateCashFlowForecast(transactions, forecastPeriod = 3) {
    try {
      // Group transactions by month
      const monthlyData = this.groupTransactionsByMonth(transactions)
      
      // Calculate monthly averages
      const monthlyAverages = this.calculateMonthlyAverages(monthlyData)
      
      // Generate forecast using AI-enhanced pattern recognition
      const forecast = await this.generateAIForecast(transactions, monthlyAverages, forecastPeriod)
      
      return {
        success: true,
        data: {
          historicalData: monthlyData,
          monthlyAverages,
          forecast,
          forecastPeriod,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Cash flow forecast error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate personalized budget recommendations
   */
  async generateBudgetRecommendations(transactions, userProfile = null) {
    try {
      // Analyze current spending patterns
      const spendingAnalysis = this.analyzeSpendingPatterns(transactions)
      
      // Calculate income and expense ratios
      const financialRatios = this.calculateFinancialRatios(spendingAnalysis)
      
      // Generate AI-powered budget recommendations
      const budgetRecommendations = await this.generateAIBudgetRecommendations(
        spendingAnalysis, 
        financialRatios, 
        userProfile
      )
      
      return {
        success: true,
        data: {
          currentSpending: spendingAnalysis,
          financialRatios,
          recommendations: budgetRecommendations,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Budget recommendations error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Analyze spending trends over time
   */
  analyzeSpendingTrends(transactions, period = 'monthly') {
    const trends = {
      monthly: {},
      weekly: {},
      categoryTrends: {},
      seasonalPatterns: {}
    }

    // Group transactions by time periods
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const weekKey = this.getWeekKey(date)
      const category = transaction.category || 'Other'

      // Monthly trends
      if (!trends.monthly[monthKey]) {
        trends.monthly[monthKey] = { income: 0, expenses: 0, transactions: 0 }
      }
      
      if (transaction.amount > 0) {
        trends.monthly[monthKey].income += transaction.amount
      } else {
        trends.monthly[monthKey].expenses += Math.abs(transaction.amount)
      }
      trends.monthly[monthKey].transactions++

      // Weekly trends
      if (!trends.weekly[weekKey]) {
        trends.weekly[weekKey] = { income: 0, expenses: 0, transactions: 0 }
      }
      
      if (transaction.amount > 0) {
        trends.weekly[weekKey].income += transaction.amount
      } else {
        trends.weekly[weekKey].expenses += Math.abs(transaction.amount)
      }
      trends.weekly[weekKey].transactions++

      // Category trends
      if (!trends.categoryTrends[category]) {
        trends.categoryTrends[category] = { total: 0, count: 0, monthly: {} }
      }
      
      trends.categoryTrends[category].total += Math.abs(transaction.amount)
      trends.categoryTrends[category].count++
      
      if (!trends.categoryTrends[category].monthly[monthKey]) {
        trends.categoryTrends[category].monthly[monthKey] = 0
      }
      trends.categoryTrends[category].monthly[monthKey] += Math.abs(transaction.amount)

      // Seasonal patterns
      const season = this.getSeason(date)
      if (!trends.seasonalPatterns[season]) {
        trends.seasonalPatterns[season] = { total: 0, count: 0 }
      }
      trends.seasonalPatterns[season].total += Math.abs(transaction.amount)
      trends.seasonalPatterns[season].count++
    })

    return trends
  }

  /**
   * Detect duplicate transactions across multiple statements
   */
  detectDuplicateTransactions(allTransactions) {
    const duplicates = []
    const transactionMap = new Map()

    allTransactions.forEach((transaction, index) => {
      // Create a signature for the transaction
      const signature = this.createTransactionSignature(transaction)
      
      if (transactionMap.has(signature)) {
        // Potential duplicate found
        const original = transactionMap.get(signature)
        const duplicate = {
          original: original.transaction,
          duplicate: transaction,
          confidence: this.calculateDuplicateConfidence(original.transaction, transaction),
          reasons: this.getDuplicateReasons(original.transaction, transaction)
        }
        
        if (duplicate.confidence > 0.8) {
          duplicates.push(duplicate)
        }
      } else {
        transactionMap.set(signature, { transaction, index })
      }
    })

    return duplicates
  }

  /**
   * Generate comprehensive financial report
   */
  async generateFinancialReport(transactions, timeframe = 'monthly') {
    try {
      const spendingAnalysis = this.analyzeSpendingPatterns(transactions)
      const trends = this.analyzeSpendingTrends(transactions, timeframe)
      const duplicates = this.detectDuplicateTransactions(transactions)
      
      // Get AI insights for the report
      const aiInsights = await claudeAI.generateSpendingInsights(transactions, timeframe)
      
      const report = {
        summary: {
          totalTransactions: transactions.length,
          totalIncome: spendingAnalysis.totalIncome,
          totalExpenses: spendingAnalysis.totalExpenses,
          netFlow: spendingAnalysis.totalIncome - spendingAnalysis.totalExpenses,
          averageTransactionSize: spendingAnalysis.averageTransactionSize,
          timeframe,
          reportPeriod: {
            from: transactions.length > 0 ? Math.min(...transactions.map(t => new Date(t.date))) : null,
            to: transactions.length > 0 ? Math.max(...transactions.map(t => new Date(t.date))) : null
          }
        },
        categoryBreakdown: spendingAnalysis.categoryBreakdown,
        trends,
        duplicates: {
          count: duplicates.length,
          items: duplicates.slice(0, 10) // Top 10 duplicates
        },
        aiInsights,
        recommendations: await this.generateReportRecommendations(spendingAnalysis, trends),
        generatedAt: new Date().toISOString()
      }

      return {
        success: true,
        data: report
      }
    } catch (error) {
      console.error('Financial report generation error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Helper: Group transactions by month
   */
  groupTransactionsByMonth(transactions) {
    const monthlyData = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          income: 0,
          expenses: 0,
          transactions: [],
          categories: {}
        }
      }
      
      monthlyData[monthKey].transactions.push(transaction)
      
      if (transaction.amount > 0) {
        monthlyData[monthKey].income += transaction.amount
      } else {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount)
      }
      
      const category = transaction.category || 'Other'
      if (!monthlyData[monthKey].categories[category]) {
        monthlyData[monthKey].categories[category] = 0
      }
      monthlyData[monthKey].categories[category] += Math.abs(transaction.amount)
    })
    
    return monthlyData
  }

  /**
   * Helper: Calculate monthly averages
   */
  calculateMonthlyAverages(monthlyData) {
    const months = Object.keys(monthlyData)
    if (months.length === 0) return { income: 0, expenses: 0 }
    
    const totals = months.reduce((acc, month) => {
      acc.income += monthlyData[month].income
      acc.expenses += monthlyData[month].expenses
      return acc
    }, { income: 0, expenses: 0 })
    
    return {
      income: totals.income / months.length,
      expenses: totals.expenses / months.length,
      netFlow: (totals.income - totals.expenses) / months.length
    }
  }

  /**
   * Helper: Generate AI-enhanced forecast
   */
  async generateAIForecast(transactions, monthlyAverages, forecastPeriod) {
    try {
      const prompt = `You are a financial forecasting expert. Based on the following transaction history and monthly averages, provide a cash flow forecast for the next ${forecastPeriod} months.

Monthly Averages:
- Income: $${monthlyAverages.income?.toFixed(2) || '0.00'}
- Expenses: $${monthlyAverages.expenses?.toFixed(2) || '0.00'}
- Net Flow: $${monthlyAverages.netFlow?.toFixed(2) || '0.00'}

Recent Transactions (last 20):
${JSON.stringify(transactions.slice(-20), null, 2)}

Provide a JSON response with:
{
  "forecast": [
    {
      "month": "2024-02",
      "projectedIncome": 5000,
      "projectedExpenses": 4000,
      "projectedNetFlow": 1000,
      "confidence": 85,
      "keyFactors": ["seasonal adjustment", "trend analysis"]
    }
  ],
  "assumptions": ["assumption1", "assumption2"],
  "riskFactors": ["risk1", "risk2"],
  "confidence": 80
}`

      const response = await claudeAI.anthropic.messages.create({
        model: claudeAI.model,
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })

      const forecast = JSON.parse(response.content[0].text)
      return forecast
    } catch (error) {
      console.error('AI forecast generation error:', error)
      
      // Fallback to simple mathematical projection
      return this.generateSimpleForecast(monthlyAverages, forecastPeriod)
    }
  }

  /**
   * Helper: Analyze spending patterns
   */
  analyzeSpendingPatterns(transactions) {
    const analysis = {
      totalIncome: 0,
      totalExpenses: 0,
      categoryBreakdown: {},
      averageTransactionSize: 0,
      transactionCount: transactions.length
    }

    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount)
      const category = transaction.category || 'Other'
      
      if (transaction.amount > 0) {
        analysis.totalIncome += transaction.amount
      } else {
        analysis.totalExpenses += amount
      }
      
      if (!analysis.categoryBreakdown[category]) {
        analysis.categoryBreakdown[category] = {
          total: 0,
          count: 0,
          percentage: 0
        }
      }
      
      analysis.categoryBreakdown[category].total += amount
      analysis.categoryBreakdown[category].count++
    })

    // Calculate percentages and average transaction size
    const totalSpent = analysis.totalExpenses
    Object.keys(analysis.categoryBreakdown).forEach(category => {
      analysis.categoryBreakdown[category].percentage = 
        (analysis.categoryBreakdown[category].total / totalSpent) * 100
    })
    
    analysis.averageTransactionSize = totalSpent / transactions.length

    return analysis
  }

  /**
   * Helper: Calculate financial ratios
   */
  calculateFinancialRatios(spendingAnalysis) {
    const { totalIncome, totalExpenses, categoryBreakdown } = spendingAnalysis
    
    return {
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      expenseRatio: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
      essentialExpenseRatio: this.calculateEssentialExpenseRatio(categoryBreakdown, totalExpenses),
      discretionaryExpenseRatio: this.calculateDiscretionaryExpenseRatio(categoryBreakdown, totalExpenses)
    }
  }

  /**
   * Helper: Generate AI budget recommendations
   */
  async generateAIBudgetRecommendations(spendingAnalysis, financialRatios, userProfile) {
    try {
      const prompt = `You are a personal finance advisor. Based on the spending analysis and financial ratios below, provide personalized budget recommendations.

Spending Analysis:
${JSON.stringify(spendingAnalysis, null, 2)}

Financial Ratios:
${JSON.stringify(financialRatios, null, 2)}

User Profile:
${JSON.stringify(userProfile, null, 2)}

Provide JSON response with:
{
  "budgetAllocations": {
    "essentials": 50,
    "discretionary": 30,
    "savings": 20
  },
  "categoryLimits": {
    "Restaurants": 300,
    "Shopping": 200
  },
  "recommendations": ["recommendation1", "recommendation2"],
  "priority": "high|medium|low",
  "reasoning": "explanation of recommendations"
}`

      const response = await claudeAI.anthropic.messages.create({
        model: claudeAI.model,
        max_tokens: 1500,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })

      return JSON.parse(response.content[0].text)
    } catch (error) {
      console.error('AI budget recommendations error:', error)
      return this.generateDefaultBudgetRecommendations(spendingAnalysis, financialRatios)
    }
  }

  /**
   * Helper: Generate simple forecast (fallback)
   */
  generateSimpleForecast(monthlyAverages, forecastPeriod) {
    const forecast = []
    const currentDate = new Date()
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`
      
      forecast.push({
        month: monthKey,
        projectedIncome: monthlyAverages.income,
        projectedExpenses: monthlyAverages.expenses,
        projectedNetFlow: monthlyAverages.netFlow,
        confidence: 70,
        keyFactors: ['historical average']
      })
    }
    
    return {
      forecast,
      assumptions: ['Based on historical averages'],
      riskFactors: ['Market volatility', 'Unexpected expenses'],
      confidence: 70
    }
  }

  /**
   * Helper: Create transaction signature for duplicate detection
   */
  createTransactionSignature(transaction) {
    const amount = Math.abs(transaction.amount).toFixed(2)
    const date = transaction.date
    const description = transaction.description?.toLowerCase().trim() || ''
    
    return `${amount}-${date}-${description.substring(0, 20)}`
  }

  /**
   * Helper: Calculate duplicate confidence
   */
  calculateDuplicateConfidence(tx1, tx2) {
    let confidence = 0
    
    // Amount match (50% weight)
    if (Math.abs(tx1.amount - tx2.amount) < 0.01) {
      confidence += 0.5
    }
    
    // Date proximity (30% weight)
    const dateDiff = Math.abs(new Date(tx1.date) - new Date(tx2.date)) / (1000 * 60 * 60 * 24)
    if (dateDiff <= 1) confidence += 0.3
    else if (dateDiff <= 3) confidence += 0.15
    
    // Description similarity (20% weight)
    const desc1 = tx1.description?.toLowerCase() || ''
    const desc2 = tx2.description?.toLowerCase() || ''
    const similarity = this.calculateStringSimilarity(desc1, desc2)
    confidence += similarity * 0.2
    
    return confidence
  }

  /**
   * Helper: Calculate string similarity
   */
  calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1
    if (str1.length === 0 || str2.length === 0) return 0
    
    const maxLength = Math.max(str1.length, str2.length)
    let matches = 0
    
    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
      if (str1[i] === str2[i]) matches++
    }
    
    return matches / maxLength
  }

  /**
   * Helper: Get duplicate reasons
   */
  getDuplicateReasons(tx1, tx2) {
    const reasons = []
    
    if (Math.abs(tx1.amount - tx2.amount) < 0.01) {
      reasons.push('Identical amounts')
    }
    
    const dateDiff = Math.abs(new Date(tx1.date) - new Date(tx2.date)) / (1000 * 60 * 60 * 24)
    if (dateDiff <= 1) {
      reasons.push('Same date')
    } else if (dateDiff <= 3) {
      reasons.push('Very close dates')
    }
    
    const desc1 = tx1.description?.toLowerCase() || ''
    const desc2 = tx2.description?.toLowerCase() || ''
    if (desc1 === desc2) {
      reasons.push('Identical descriptions')
    } else if (this.calculateStringSimilarity(desc1, desc2) > 0.8) {
      reasons.push('Very similar descriptions')
    }
    
    return reasons
  }

  /**
   * Helper: Get week key for grouping
   */
  getWeekKey(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24))
    const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7)
    return `${date.getFullYear()}-W${weekNumber}`
  }

  /**
   * Helper: Get season for seasonal analysis
   */
  getSeason(date) {
    const month = date.getMonth()
    if (month >= 2 && month <= 4) return 'Spring'
    if (month >= 5 && month <= 7) return 'Summer'
    if (month >= 8 && month <= 10) return 'Fall'
    return 'Winter'
  }

  /**
   * Helper: Calculate essential expense ratio
   */
  calculateEssentialExpenseRatio(categoryBreakdown, totalExpenses) {
    let essentialTotal = 0
    this.categoryMappings.essentials.forEach(category => {
      if (categoryBreakdown[category]) {
        essentialTotal += categoryBreakdown[category].total
      }
    })
    return totalExpenses > 0 ? (essentialTotal / totalExpenses) * 100 : 0
  }

  /**
   * Helper: Calculate discretionary expense ratio
   */
  calculateDiscretionaryExpenseRatio(categoryBreakdown, totalExpenses) {
    let discretionaryTotal = 0
    this.categoryMappings.discretionary.forEach(category => {
      if (categoryBreakdown[category]) {
        discretionaryTotal += categoryBreakdown[category].total
      }
    })
    return totalExpenses > 0 ? (discretionaryTotal / totalExpenses) * 100 : 0
  }

  /**
   * Helper: Generate default budget recommendations
   */
  generateDefaultBudgetRecommendations(spendingAnalysis, financialRatios) {
    return {
      budgetAllocations: {
        essentials: 50,
        discretionary: 30,
        savings: 20
      },
      categoryLimits: {},
      recommendations: [
        'Follow the 50/30/20 rule for budgeting',
        'Track your spending to identify areas for improvement',
        'Build an emergency fund with 3-6 months of expenses'
      ],
      priority: 'medium',
      reasoning: 'Standard budgeting recommendations based on general financial principles'
    }
  }

  /**
   * Helper: Generate report recommendations
   */
  async generateReportRecommendations(spendingAnalysis, trends) {
    const recommendations = []
    
    // High expense categories
    const sortedCategories = Object.entries(spendingAnalysis.categoryBreakdown)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 3)
    
    recommendations.push(`Your top spending categories are: ${sortedCategories.map(([cat]) => cat).join(', ')}`)
    
    // Savings rate analysis
    const savingsRate = ((spendingAnalysis.totalIncome - spendingAnalysis.totalExpenses) / spendingAnalysis.totalIncome) * 100
    if (savingsRate < 10) {
      recommendations.push('Consider increasing your savings rate to at least 10% of income')
    } else if (savingsRate > 20) {
      recommendations.push('Great job maintaining a healthy savings rate!')
    }
    
    return recommendations
  }
}

// Export singleton instance
export const financialAnalytics = new FinancialAnalyticsService()