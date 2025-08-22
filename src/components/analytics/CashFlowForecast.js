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
  DollarSign,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Loader2,
  RefreshCw
} from 'lucide-react'

export default function CashFlowForecast({ transactions, onRefresh }) {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(3)

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      generateForecast()
    }
  }, [transactions, selectedPeriod])

  const generateBasicForecast = (transactions, months) => {
    if (!transactions || transactions.length === 0) {
      return null
    }

    // Calculate monthly averages from transaction data
    const monthlyData = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 }
      }
      
      if (transaction.amount > 0) {
        monthlyData[monthKey].income += transaction.amount
      } else {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount)
      }
    })

    const monthlyAverages = Object.values(monthlyData)
    const avgIncome = monthlyAverages.reduce((sum, m) => sum + m.income, 0) / monthlyAverages.length || 0
    const avgExpenses = monthlyAverages.reduce((sum, m) => sum + m.expenses, 0) / monthlyAverages.length || 0

    // Generate forecast for upcoming months
    const forecast = []
    const currentDate = new Date()
    
    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
      const monthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`
      
      forecast.push({
        month: monthKey,
        projectedIncome: Math.round(avgIncome * 100) / 100,
        projectedExpenses: Math.round(avgExpenses * 100) / 100,
        projectedNetFlow: Math.round((avgIncome - avgExpenses) * 100) / 100,
        confidence: 65 // Basic confidence score
      })
    }

    return {
      forecast,
      summary: {
        avgMonthlyIncome: avgIncome,
        avgMonthlyExpenses: avgExpenses,
        avgNetFlow: avgIncome - avgExpenses,
        confidence: 65
      }
    }
  }

  const generateForecast = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/cash-flow-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions,
          forecastPeriod: selectedPeriod
        }),
        credentials: 'same-origin'
      })

      if (!response.ok) {
        if (response.status === 404) {
          // API endpoint not implemented yet, use mock data
          console.log('Forecast API not available, using basic calculations')
          const mockForecast = generateBasicForecast(transactions, selectedPeriod)
          setForecast(mockForecast)
          return
        }
        throw new Error('Failed to generate forecast')
      }

      const result = await response.json()
      setForecast(result.data)
    } catch (error) {
      console.error('Forecast generation error:', error)
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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getTrendIcon = (current, previous) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <BarChart3 className="h-4 w-4 text-gray-600" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Cash Flow Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Generating forecast...</p>
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
            Cash Flow Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generateForecast} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Cash Flow Forecast
          </CardTitle>
          <CardDescription>
            AI-powered cash flow predictions based on your transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No data available for forecast</p>
            <p className="text-sm text-gray-500">Upload more bank statements to generate predictions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Cash Flow Forecast
              </CardTitle>
              <CardDescription>
                AI-powered predictions for the next {selectedPeriod} months
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[3, 6, 12].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period}M
                  </Button>
                ))}
              </div>
              <Button onClick={generateForecast} variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Confidence */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Badge className={`${getConfidenceColor(forecast.confidence)} mb-2`}>
                {forecast.confidence}% Confidence
              </Badge>
              <p className="text-sm text-gray-600">Forecast Accuracy</p>
            </div>
            
            {/* Historical Average */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(forecast.monthlyAverages?.netFlow || 0)}
              </p>
              <p className="text-sm text-gray-600">Monthly Avg Net Flow</p>
            </div>
            
            {/* Forecast Period */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {forecast.forecastPeriod}
              </p>
              <p className="text-sm text-gray-600">Months Forecasted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Forecast Details */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Projections</CardTitle>
          <CardDescription>
            Detailed breakdown for each forecasted month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(forecast?.forecast) ? forecast.forecast.map((month, index) => {
              const forecastData = forecast.forecast
              const previousMonth = index > 0 ? forecastData[index - 1] : null
              const netFlow = month.projectedIncome - month.projectedExpenses
              
              return (
                <div key={month.month} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </h4>
                      {previousMonth && getTrendIcon(netFlow, previousMonth.projectedNetFlow)}
                    </div>
                    <Badge className={getConfidenceColor(month.confidence)}>
                      {month.confidence}%
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Projected Income</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(month.projectedIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Projected Expenses</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(month.projectedExpenses)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Flow</p>
                      <p className={`text-lg font-semibold ${
                        netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(netFlow)}
                      </p>
                    </div>
                  </div>
                  
                  {month.keyFactors && month.keyFactors.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-1">Key Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {month.keyFactors.map((factor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            }) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No forecast data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assumptions and Risk Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assumptions */}
        {forecast.assumptions && forecast.assumptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                Forecast Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {forecast.assumptions.map((assumption, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <span className="text-sm text-gray-700">{assumption}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Factors */}
        {forecast.riskFactors && forecast.riskFactors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {forecast.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{risk}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Historical Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Baseline</CardTitle>
          <CardDescription>
            Your spending patterns that inform this forecast
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(forecast.monthlyAverages?.income || 0)}
              </p>
              <p className="text-sm text-gray-600">Avg Monthly Income</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(forecast.monthlyAverages?.expenses || 0)}
              </p>
              <p className="text-sm text-gray-600">Avg Monthly Expenses</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className={`text-2xl font-bold ${
                (forecast.monthlyAverages?.netFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(forecast.monthlyAverages?.netFlow || 0)}
              </p>
              <p className="text-sm text-gray-600">Avg Net Flow</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}