'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default function AIInsights({ insights, transactions = [] }) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    trends: false,
    anomalies: false,
    recommendations: false
  })

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis not available for this statement
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Get transactions with anomalies
  const anomalousTransactions = transactions.filter(tx => 
    tx.anomaly_data && tx.anomaly_data !== 'null'
  )

  // Get confidence distribution
  const confidenceDistribution = transactions.reduce((acc, tx) => {
    const confidence = tx.confidence || 0
    if (confidence >= 90) acc.high++
    else if (confidence >= 70) acc.medium++
    else acc.low++
    return acc
  }, { high: 0, medium: 0, low: 0 })

  const totalTransactions = transactions.length

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
            AI-Enhanced Analysis
          </CardTitle>
          <CardDescription>
            Intelligent insights powered by Claude AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-sm text-gray-600">{insights.summary}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  ${insights.totalSpent?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600">Total Spent</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  ${insights.averageTransaction?.toFixed(2) || '0'}
                </p>
                <p className="text-xs text-gray-600">Avg Transaction</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {insights.topCategories?.length || 0}
                </p>
                <p className="text-xs text-gray-600">Categories</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">
                  {anomalousTransactions.length}
                </p>
                <p className="text-xs text-gray-600">Anomalies</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Confidence Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Brain className="h-4 w-4 mr-2" />
            AI Analysis Confidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">High Confidence (90%+)</span>
              <span className="text-sm font-medium">{confidenceDistribution.high} transactions</span>
            </div>
            <Progress 
              value={totalTransactions > 0 ? (confidenceDistribution.high / totalTransactions) * 100 : 0} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Medium Confidence (70-89%)</span>
              <span className="text-sm font-medium">{confidenceDistribution.medium} transactions</span>
            </div>
            <Progress 
              value={totalTransactions > 0 ? (confidenceDistribution.medium / totalTransactions) * 100 : 0} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Needs Review (&lt;70%)</span>
              <span className="text-sm font-medium">{confidenceDistribution.low} transactions</span>
            </div>
            <Progress 
              value={totalTransactions > 0 ? (confidenceDistribution.low / totalTransactions) * 100 : 0} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('categories')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Top Spending Categories
            </div>
            {expandedSections.categories ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {expandedSections.categories && (
          <CardContent>
            <div className="space-y-3">
              {insights.topCategories?.slice(0, 5).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{category.category}</span>
                      <span className="text-sm text-gray-600">{category.percentage?.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">${category.amount?.toLocaleString()}</span>
                      <Progress value={category.percentage || 0} className="h-1 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Trends & Patterns */}
      {insights.trends && insights.trends.length > 0 && (
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('trends')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-blue-600" />
                Spending Trends
              </div>
              {expandedSections.trends ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.trends && (
            <CardContent>
              <div className="space-y-2">
                {insights.trends.map((trend, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm text-gray-700">{trend}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Anomalies */}
      {anomalousTransactions.length > 0 && (
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('anomalies')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Anomalies Detected
                <Badge variant="outline" className="ml-2">{anomalousTransactions.length}</Badge>
              </div>
              {expandedSections.anomalies ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.anomalies && (
            <CardContent>
              <div className="space-y-3">
                {anomalousTransactions.slice(0, 5).map((transaction, index) => {
                  let anomaly
                  try {
                    anomaly = typeof transaction.anomaly_data === 'string' 
                      ? JSON.parse(transaction.anomaly_data) 
                      : transaction.anomaly_data
                  } catch (e) {
                    anomaly = null
                  }

                  if (!anomaly) return null

                  const severityColor = {
                    high: 'bg-red-100 text-red-800 border-red-200',
                    medium: 'bg-orange-100 text-orange-800 border-orange-200',
                    low: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }[anomaly.severity] || 'bg-gray-100 text-gray-800 border-gray-200'

                  return (
                    <div key={index} className={`p-3 rounded-lg border ${severityColor}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm opacity-75">${transaction.amount} on {transaction.date}</p>
                        </div>
                        <Badge variant="outline" className={`${severityColor} border-0`}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p className="text-sm">{anomaly.description}</p>
                      {anomaly.recommendation && (
                        <p className="text-sm mt-1 font-medium">
                          Recommendation: {anomaly.recommendation}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <Card>
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('recommendations')}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                AI Recommendations
              </div>
              {expandedSections.recommendations ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.recommendations && (
            <CardContent>
              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <Target className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Savings Opportunities */}
      {insights.savingsOpportunities && insights.savingsOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Savings Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.savingsOpportunities.map((opportunity, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg">
                  <Target className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{opportunity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Flags */}
      {insights.flags && insights.flags.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-900">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Important Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.flags.map((flag, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <span className="text-sm text-orange-800">{flag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}