'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  PieChart,
  BarChart3,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export default function SpendingTrends({ transactions }) {
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    monthly: true,
    categories: false,
    seasonal: false,
    duplicates: false
  })

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      generateTrends()
    }
  }, [transactions])

  const generateTrends = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/spending-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions,
          period: 'monthly',
          includeAllFiles: false
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate trends')
      }

      setTrends(result.data)
    } catch (error) {
      console.error('Trends generation error:', error)
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getTrendDirection = (current, previous) => {
    if (current > previous) {
      return { icon: TrendingUp, color: 'text-red-600', direction: 'up', change: ((current - previous) / previous * 100).toFixed(1) }
    } else if (current < previous) {
      return { icon: TrendingDown, color: 'text-green-600', direction: 'down', change: ((previous - current) / previous * 100).toFixed(1) }
    }
    return { icon: BarChart3, color: 'text-gray-600', direction: 'stable', change: '0' }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Spending Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Analyzing spending patterns...</p>
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
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Spending Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generateTrends} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!trends) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Spending Trends
          </CardTitle>
          <CardDescription>
            Analyze your spending patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No trend data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const monthlyEntries = Object.entries(trends.trends.monthly).sort()
  const categoryEntries = Object.entries(trends.trends.categoryTrends)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Spending Trends Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of your spending patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {trends.summary.monthsAnalyzed}
              </p>
              <p className="text-sm text-gray-600">Months Analyzed</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <PieChart className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {trends.summary.categoriesFound}
              </p>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {trends.summary.totalTransactions.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Transactions</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {trends.duplicates.count}
              </p>
              <p className="text-sm text-gray-600">Duplicates Found</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('monthly')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Monthly Spending Trends
            </div>
            {expandedSections.monthly ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {expandedSections.monthly && (
          <CardContent>
            <div className="space-y-4">
              {monthlyEntries.map(([month, data], index) => {
                const previousMonth = index > 0 ? monthlyEntries[index - 1][1] : null
                const expenseTrend = previousMonth ? getTrendDirection(data.expenses, previousMonth.expenses) : null
                
                return (
                  <div key={month} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {new Date(month + '-01').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </h4>
                      {expenseTrend && (
                        <div className={`flex items-center space-x-1 ${expenseTrend.color}`}>
                          <expenseTrend.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {expenseTrend.change}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Income</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(data.income)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Expenses</p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(data.expenses)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Net Flow</p>
                        <p className={`text-lg font-semibold ${
                          (data.income - data.expenses) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(data.income - data.expenses)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{data.transactions} transactions</span>
                        <span>Avg per transaction: {formatCurrency(data.expenses / data.transactions)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Category Trends */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('categories')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-green-600" />
              Category Spending Patterns
            </div>
            {expandedSections.categories ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {expandedSections.categories && (
          <CardContent>
            <div className="space-y-4">
              {categoryEntries.map(([category, data]) => {
                const avgPerTransaction = data.total / data.count
                const monthlyEntries = Object.entries(data.monthly || {}).sort()
                
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{category}</h4>
                      <Badge variant="outline">
                        {data.count} transactions
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(data.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg per Transaction</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(avgPerTransaction)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monthly Average</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(data.total / Math.max(monthlyEntries.length, 1))}
                        </p>
                      </div>
                    </div>
                    
                    {monthlyEntries.length > 1 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600 mb-2">Monthly breakdown:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {monthlyEntries.slice(-4).map(([month, amount]) => (
                            <div key={month} className="text-center p-2 bg-gray-50 rounded">
                              <p className="font-medium">{month}</p>
                              <p className="text-gray-600">{formatCurrency(amount)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Seasonal Patterns */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('seasonal')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Seasonal Spending Patterns
            </div>
            {expandedSections.seasonal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {expandedSections.seasonal && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(trends.trends.seasonalPatterns).map(([season, data]) => (
                <div key={season} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{season}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Spent</span>
                      <span className="font-semibold">{formatCurrency(data.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transactions</span>
                      <span className="font-semibold">{data.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg per Transaction</span>
                      <span className="font-semibold">{formatCurrency(data.total / data.count)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Duplicates Detection */}
      {trends.duplicates.count > 0 && (
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('duplicates')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Potential Duplicates
                <Badge variant="outline" className="ml-2">{trends.duplicates.count}</Badge>
              </div>
              {expandedSections.duplicates ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.duplicates && (
            <CardContent>
              <div className="space-y-3">
                {trends.duplicates.items.slice(0, 10).map((duplicate, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-orange-100 text-orange-800">
                        {(duplicate.confidence * 100).toFixed(0)}% match
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(duplicate.original.amount)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">Original</p>
                        <p className="text-gray-600">{duplicate.original.description}</p>
                        <p className="text-gray-500">{duplicate.original.date}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Potential Duplicate</p>
                        <p className="text-gray-600">{duplicate.duplicate.description}</p>
                        <p className="text-gray-500">{duplicate.duplicate.date}</p>
                      </div>
                    </div>
                    
                    {duplicate.reasons && duplicate.reasons.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-orange-200">
                        <p className="text-xs text-orange-700">
                          Match reasons: {duplicate.reasons.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}