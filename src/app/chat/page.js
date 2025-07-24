'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import FinancialChat from '@/components/chat/FinancialChat'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft,
  MessageCircle,
  Brain,
  Loader2,
  AlertTriangle,
  Sparkles,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'

export default function ChatPage() {
  const [transactions, setTransactions] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
    
    fetchChatData()
  }, [user, router])

  const fetchChatData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile || { subscription_tier: 'free' })

      // Fetch all user files first - start with basic query to check table structure
      console.log('Fetching files for user:', user.id)
      
      // First, try a simple query to see what columns exist
      const { data: userFiles, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .limit(10)

      if (filesError) {
        console.error('Files fetch error:', filesError)
        console.error('Error details:', JSON.stringify(filesError, null, 2))
        
        // Try to continue without files data for now
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
      console.log('Sample file structure:', userFiles?.[0] || 'No files found')

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

      // Calculate stats for display
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
      console.error('Error fetching chat data:', error)
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
            <p className="text-gray-600 mb-4">Please sign in to access the AI assistant</p>
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
              <p className="text-gray-700 text-lg">Loading your financial data...</p>
              <p className="text-gray-500 text-sm mt-2">Preparing AI assistant</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-6 text-lg">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={fetchChatData}
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
                <MessageCircle className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                🤖 AI Assistant Ready
              </h3>
              <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto">
                Upload and process bank statements to start chatting with your AI financial assistant. 
                Get instant insights, spending analysis, and personalized recommendations.
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent flex items-center">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg mr-4">
                    <MessageCircle className="h-8 w-8 text-white" />
                  </div>
                  AI Financial Assistant
                  <Sparkles className="h-8 w-8 ml-3 text-purple-500" />
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                  Ask questions about your finances and get intelligent insights powered by AI
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-1" />
                    {stats.totalFiles} files
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {stats.totalTransactions.toLocaleString()} transactions
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
                      AI Enhanced
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Files Available</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
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

        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="h-[700px]">
              <FinancialChat 
                transactions={transactions}
                userProfile={userProfile}
                className="h-full"
              />
            </div>
          </div>

          {/* Sidebar with tips and info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Chat Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Be specific with time</p>
                  <p className="text-gray-600">Try "last month" or "this week"</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Ask about categories</p>
                  <p className="text-gray-600">Like "restaurants" or "groceries"</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Request comparisons</p>
                  <p className="text-gray-600">"Compare this month to last month"</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Get forecasts</p>
                  <p className="text-gray-600">"Predict next month's expenses"</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🚀 Example Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-gray-50 rounded text-gray-700">
                  "What's my biggest expense category?"
                </div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">
                  "How much did I spend on food last month?"
                </div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">
                  "Show me unusual transactions"
                </div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">
                  "Help me create a budget"
                </div>
                <div className="p-2 bg-gray-50 rounded text-gray-700">
                  "What's my average daily spending?"
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/analytics" className="block">
                  <Button variant="outline" className="w-full text-sm h-9">
                    View Analytics
                  </Button>
                </Link>
                <Link href="/upload" className="block">
                  <Button variant="outline" className="w-full text-sm h-9">
                    Upload More Files
                  </Button>
                </Link>
                <Link href="/pricing" className="block">
                  <Button variant="outline" className="w-full text-sm h-9">
                    Upgrade Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {userProfile?.subscription_tier === 'free' && (
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 mb-1 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Unlock Advanced AI Features
                  </h3>
                  <p className="text-sm text-blue-700">
                    Get unlimited chat sessions, extended conversation memory, and premium insights
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