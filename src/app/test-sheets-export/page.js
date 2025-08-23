'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function TestSheetsExport() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const testSheetsExport = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Mock transaction data for testing
      const mockTransactions = [
        {
          date: '2024-01-15',
          description: 'WALMART SUPERCENTER #1234',
          normalized_merchant: 'Walmart',
          category: 'Groceries',
          subcategory: 'Food & Supplies',
          amount: 125.67,
          balance: 2500.00,
          transaction_type: 'debit',
          confidence: 95,
          ai_reasoning: 'Identified as grocery purchase based on merchant',
          anomaly_data: null
        },
        {
          date: '2024-01-14',
          description: 'DIRECT DEPOSIT - EMPLOYER',
          normalized_merchant: 'Employer Deposit',
          category: 'Income',
          subcategory: 'Salary',
          amount: 3000.00,
          balance: 2625.67,
          transaction_type: 'credit',
          confidence: 98,
          ai_reasoning: 'Regular salary deposit pattern detected',
          anomaly_data: null
        },
        {
          date: '2024-01-12',
          description: 'SUSPICIOUS CHARGE INTL',
          normalized_merchant: 'Unknown International',
          category: 'Other',
          subcategory: null,
          amount: 999.99,
          balance: 625.67,
          transaction_type: 'debit',
          confidence: 45,
          ai_reasoning: 'Unusual international transaction pattern',
          anomaly_data: JSON.stringify({
            severity: 'high',
            description: 'Large international transaction from unknown merchant',
            recommendation: 'Contact bank to verify this transaction'
          })
        }
      ]

      const mockInsights = {
        summary: 'Test statement shows mixed spending patterns with one suspicious transaction detected.',
        totalSpent: 1125.66,
        averageTransaction: 375.22,
        topCategories: [
          { category: 'Groceries', amount: 125.67, percentage: 11.2 },
          { category: 'Other', amount: 999.99, percentage: 88.8 }
        ],
        trends: [
          'Irregular spending pattern detected',
          'One large unusual transaction dominates spending'
        ],
        recommendations: [
          'Review and verify the international transaction',
          'Consider setting up transaction alerts for amounts over $500'
        ],
        savingsOpportunities: [
          'Regular income detected - consider automatic savings transfers'
        ]
      }

      // Test the sheets service directly
      const response = await fetch('/api/test-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: mockTransactions,
          insights: mockInsights
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Google Sheets Export</CardTitle>
          <CardDescription>
            Test the Google Sheets export functionality with mock data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testSheetsExport} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Sheets Export'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p>Google Sheets created successfully!</p>
                  {result.webViewLink && (
                    <a
                      href={result.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm block"
                    >
                      Open in Google Sheets →
                    </a>
                  )}
                  <pre className="text-xs mt-2 bg-white p-2 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}