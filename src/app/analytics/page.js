'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CashFlowForecast from '@/components/analytics/CashFlowForecast'
import BudgetRecommendations from '@/components/analytics/BudgetRecommendations'
import FinancialChat from '@/components/chat/FinancialChat'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  BarChart3,
  TrendingUp,
  Target,
  FileText,
  Brain,
  Loader2,
  AlertTriangle,
  Calendar,
  DollarSign,
  MessageCircle
} from 'lucide-react'

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('forecast')
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTransactions: 0,
    aiEnhanced: 0,
    dateRange: null
  })
  
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    
    fetchAnalyticsData()
  }, [user, router])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)

      // Fetch all user files first - start with basic query to check table structure
      console.log('Fetching files for user:', user.id)
      
      const { data: userFiles, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .limit(50)

      if (filesError) {
        console.error('Files fetch error:', filesError)
        console.error('Error details:', JSON.stringify(filesError, null, 2))
        
        // Try to continue without files data
        console.log('Continuing without files data...')
        setTransactions([])
        setStats({
          totalFiles: 0,
          totalTransactions: 0,
          aiEnhanced: 0,
          dateRange: null
        })
        setLoading(false)
        return
      }

      console.log('Found files:', userFiles?.length || 0)
      
      // Filter only completed files if processing_status column exists
      const completedFiles = userFiles?.filter(f => 
        !f.processing_status || f.processing_status === 'completed'
      ) || []

      const fileIds = completedFiles?.map(f => f.id) || []

      // Fetch transactions for user's files
      let transactionsData = []
      if (fileIds.length > 0) {
        const { data, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .in('file_id', fileIds)
          .order('date', { ascending: true })

        if (transactionsError) {
          console.error('Transactions fetch error:', transactionsError)
          throw new Error('Failed to fetch transaction data')
        }

        // Merge file info with transactions
        transactionsData = (data || []).map(transaction => ({
          ...transaction,
          files: completedFiles.find(f => f.id === transaction.file_id)
        })).filter(t => t.files) // Only include transactions with valid file references
      }

      setTransactions(transactionsData || [])

      // Calculate stats
      const uniqueFiles = new Set(transactionsData?.map(t => t.files.id) || [])
      const aiEnhancedFiles = new Set(
        transactionsData?.filter(t => t.files.ai_enhanced).map(t => t.files.id) || []
      )
      
      const dates = transactionsData?.map(t => new Date(t.date)) || []
      const dateRange = dates.length > 0 ? {
        from: new Date(Math.min(...dates)),
        to: new Date(Math.max(...dates))
      } : null

      setStats({
        totalFiles: uniqueFiles.size,
        totalTransactions: transactionsData?.length || 0,
        aiEnhanced: aiEnhancedFiles.size,
        dateRange
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to access analytics</p>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-700 text-lg">Loading analytics data...</p>
              <p className="text-gray-500 text-sm mt-2">Preparing AI insights</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 rounded-xl shadow-lg w-fit mx-auto mb-4">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Error</h3>
              <p className="text-red-600 mb-6 text-lg">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={fetchAnalyticsData}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Try Again
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline" className="border-2 border-gray-200 hover:bg-gray-50 transition-all duration-300">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl shadow-lg w-fit mx-auto mb-6">
                <BarChart3 className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                📊 Analytics Ready
              </h3>
              <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
                Upload and process bank statements to access AI-powered analytics, cash flow forecasting, 
                budget recommendations, and intelligent financial insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/upload">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg">
                    <FileText className="h-5 w-5 mr-2" />
                    Upload Bank Statement
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="border-2 border-indigo-200 hover:bg-indigo-50 transition-all duration-300 px-8 py-3 text-lg">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent flex items-center">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl shadow-lg mr-4">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  AI Financial Analytics
                  <TrendingUp className="h-8 w-8 ml-3 text-green-500" />
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                  Advanced insights and forecasting powered by artificial intelligence
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-1" />
                    {stats.totalFiles} files analyzed
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {stats.dateRange ? `${formatDate(stats.dateRange.from)} - ${formatDate(stats.dateRange.to)}` : 'No date range'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0 flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant="outline" 
                    className={`capitalize px-3 py-1 font-medium border-2 ${
                      (userProfile?.subscription_tier || 'free') === 'premium' 
                        ? 'border-purple-500 text-purple-700 bg-purple-50' 
                        : (userProfile?.subscription_tier || 'free') === 'basic'
                        ? 'border-blue-500 text-blue-700 bg-blue-50'
                        : 'border-gray-300 text-gray-600 bg-gray-50'
                    }`}
                  >
                    ✨ {userProfile?.subscription_tier || 'free'} Plan
                  </Badge>
                  {stats.aiEnhanced > 0 && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 shadow-lg">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Enhanced ({stats.aiEnhanced} files)
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Link href="/chat">
                    <Button variant="outline" className="border-2 border-orange-200 hover:bg-orange-50 transition-all duration-300">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      AI Chat
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Files Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI Enhanced</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.aiEnhanced}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Date Range</p>
                  <p className="text-sm font-bold text-gray-900">
                    {stats.dateRange ? (
                      <>
                        {formatDate(stats.dateRange.from)}
                        <br />
                        <span className="text-xs text-gray-500">to {formatDate(stats.dateRange.to)}</span>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('forecast')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'forecast'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Cash Flow Forecast
              </button>
              
              <button
                onClick={() => setActiveTab('budget')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'budget'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Target className="h-4 w-4 mr-2" />
                Budget Recommendations
              </button>
              
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Assistant
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'forecast' && (
          <CashFlowForecast 
            transactions={transactions}
            onRefresh={fetchAnalyticsData}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetRecommendations 
            transactions={transactions}
            userProfile={userProfile}
          />
        )}

        {activeTab === 'chat' && (
          <div className="h-[600px]">
            <FinancialChat 
              transactions={transactions}
              userProfile={userProfile}
              className="h-full"
            />
          </div>
        )}

        {/* Upgrade Prompt for Free Users */}
        {userProfile?.subscription_tier === 'free' && (
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">
                    Unlock Advanced Analytics
                  </h3>
                  <p className="text-sm text-blue-700">
                    Upgrade to get unlimited AI insights, extended forecasts, and premium recommendations
                  </p>
                </div>
                <Link href="/pricing">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}