'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target, 
  PieChart, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Calculator,
  Loader2,
  RefreshCw
} from 'lucide-react'

export default function BudgetRecommendations({ transactions, userProfile }) {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedBudget, setSelectedBudget] = useState('recommended')

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      generateRecommendations()
    }
  }, [transactions, userProfile])

  const generateRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/budget-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions,
          userProfile
        }),
        credentials: 'same-origin'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate recommendations')
      }

      setRecommendations(result.data)
    } catch (error) {
      console.error('Budget recommendations error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculateCategoryStatus = (current, recommended) => {
    const ratio = current / recommended
    if (ratio <= 1.1) return { status: 'good', color: 'text-green-600', icon: CheckCircle }
    if (ratio <= 1.3) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle }
    return { status: 'over', color: 'text-red-600', icon: AlertTriangle }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Budget Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Analyzing your spending patterns...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Budget Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generateRecommendations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!recommendations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Budget Recommendations
          </CardTitle>
          <CardDescription>
            Personalized budget advice based on your spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No data available for budget analysis</p>
            <p className="text-sm text-gray-500">Upload bank statements to get personalized recommendations</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalIncome = recommendations.currentSpending.totalIncome
  const totalExpenses = recommendations.currentSpending.totalExpenses

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Budget Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered budget analysis with personalized recommendations
              </CardDescription>
            </div>
            <Badge className={`${getPriorityColor(recommendations.recommendations?.priority)} border`}>
              {recommendations.recommendations?.priority} Priority
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-sm text-gray-600">Monthly Income</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-sm text-gray-600">Monthly Expenses</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <PieChart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {recommendations.financialRatios.savingsRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Savings Rate</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {recommendations.financialRatios.expenseRatio.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Expense Ratio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Allocation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Budget Allocation</CardTitle>
          <CardDescription>
            Optimal distribution of your income based on financial best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.recommendations?.budgetAllocations && (
            <div className="space-y-4">
              {Object.entries(recommendations.recommendations.budgetAllocations).map(([category, percentage]) => {
                const recommendedAmount = (totalIncome * percentage) / 100
                const currentCategory = category === 'essentials' ? 'Essential Expenses' : 
                                      category === 'discretionary' ? 'Discretionary Spending' : 
                                      'Savings & Investments'
                
                // Calculate current spending in this category
                const currentAmount = category === 'savings' ? 
                  (totalIncome - totalExpenses) : 
                  (totalExpenses * (category === 'essentials' ? 
                    recommendations.financialRatios.essentialExpenseRatio : 
                    recommendations.financialRatios.discretionaryExpenseRatio) / 100)

                const status = calculateCategoryStatus(currentAmount, recommendedAmount)
                const StatusIcon = status.icon

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{currentCategory}</h4>
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{percentage}%</p>
                        <p className="text-sm text-gray-600">{formatCurrency(recommendedAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Current: {formatCurrency(currentAmount)}</span>
                        <span>Target: {formatCurrency(recommendedAmount)}</span>
                      </div>
                      <Progress 
                        value={Math.min((currentAmount / recommendedAmount) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs">
                        <span className={currentAmount <= recommendedAmount ? 'text-green-600' : 'text-red-600'}>
                          {currentAmount > recommendedAmount ? 'Over' : 'Under'} by {formatCurrency(Math.abs(currentAmount - recommendedAmount))}
                        </span>
                        <span className="text-gray-500">
                          {((currentAmount / recommendedAmount) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category-Specific Limits */}
      {recommendations.recommendations?.categoryLimits && Object.keys(recommendations.recommendations.categoryLimits).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Spending Limits</CardTitle>
            <CardDescription>
              Recommended monthly limits for your highest spending categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(recommendations.recommendations.categoryLimits).map(([category, limit]) => {
                const currentSpending = recommendations.currentSpending.categoryBreakdown[category]?.total || 0
                const status = calculateCategoryStatus(currentSpending, limit)
                const StatusIcon = status.icon

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{category}</h4>
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      </div>
                      <Badge variant="outline">
                        {formatCurrency(limit)} limit
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current</span>
                        <span className={currentSpending <= limit ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(currentSpending)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((currentSpending / limit) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500 text-right">
                        {formatCurrency(Math.max(0, limit - currentSpending))} remaining
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations.recommendations?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              {recommendations.recommendations.reasoning}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.recommendations.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Indicators</CardTitle>
          <CardDescription>
            Key metrics to track your financial wellness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Savings Rate</span>
                <span className={`text-sm font-semibold ${
                  recommendations.financialRatios.savingsRate >= 20 ? 'text-green-600' :
                  recommendations.financialRatios.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {recommendations.financialRatios.savingsRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(recommendations.financialRatios.savingsRate, 30)} className="h-2" />
              <p className="text-xs text-gray-500">Target: 20%+ (Excellent), 10-20% (Good)</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Essential Expenses</span>
                <span className={`text-sm font-semibold ${
                  recommendations.financialRatios.essentialExpenseRatio <= 50 ? 'text-green-600' :
                  recommendations.financialRatios.essentialExpenseRatio <= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {recommendations.financialRatios.essentialExpenseRatio.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(recommendations.financialRatios.essentialExpenseRatio, 80)} className="h-2" />
              <p className="text-xs text-gray-500">Target: &lt;50% (Excellent), 50-60% (Good)</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Discretionary Spending</span>
                <span className={`text-sm font-semibold ${
                  recommendations.financialRatios.discretionaryExpenseRatio <= 30 ? 'text-green-600' :
                  recommendations.financialRatios.discretionaryExpenseRatio <= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {recommendations.financialRatios.discretionaryExpenseRatio.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(recommendations.financialRatios.discretionaryExpenseRatio, 50)} className="h-2" />
              <p className="text-xs text-gray-500">Target: &lt;30% (Excellent), 30-40% (Good)</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Expense Ratio</span>
                <span className={`text-sm font-semibold ${
                  recommendations.financialRatios.expenseRatio <= 80 ? 'text-green-600' :
                  recommendations.financialRatios.expenseRatio <= 90 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {recommendations.financialRatios.expenseRatio.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(recommendations.financialRatios.expenseRatio, 100)} className="h-2" />
              <p className="text-xs text-gray-500">Target: &lt;80% (Excellent), 80-90% (Good)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}