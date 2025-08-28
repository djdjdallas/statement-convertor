'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
      {/* Unified Header with Glass Morphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Statement Desk</span>
              </Link>
              <Badge 
                variant="outline" 
                className={`capitalize px-3 py-1 text-xs font-medium border ${
                  (userProfile?.subscription_tier || 'free') === 'premium' 
                    ? 'border-purple-500 text-purple-700 bg-purple-50' 
                    : (userProfile?.subscription_tier || 'free') === 'basic'
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-gray-300 text-gray-600 bg-gray-50'
                }`}
              >
                {userProfile?.subscription_tier || 'free'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-white/60">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with Glass Effect */}
        <div className="mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent mb-4">
                  AI Financial Assistant
                </h1>
                <p className="text-gray-600 text-lg max-w-2xl">
                  Ask questions about your finances and get intelligent insights powered by Claude AI
                </p>
                <div className="flex items-center space-x-6 mt-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    {stats.totalFiles} files
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                    {stats.totalTransactions.toLocaleString()} transactions
                  </div>
                  {stats.aiEnhanced > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Brain className="h-4 w-4 mr-2 text-purple-600" />
                      {stats.aiEnhanced} AI enhanced
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-2xl shadow-xl">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4">
                    <MessageCircle className="h-16 w-16 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text" style={{fill: 'url(#gradient)'}} />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#9333ea" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards with Glass Effect and Animations */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Files Available</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mt-1">
                  {stats.totalFiles}
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mt-1">
                  {stats.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Enhanced</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mt-1">
                  {stats.aiEnhanced}
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Date Range</p>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {stats.dateRange ? (
                    <>
                      <span className="block">{formatDate(stats.dateRange.from)}</span>
                      <span className="text-xs text-gray-500">to {formatDate(stats.dateRange.to)}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-xl shadow-lg hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
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

          {/* Sidebar with Glass Effect */}
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 shadow-xl">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg shadow-md mr-2">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  Chat Tips
                </h3>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <p className="font-medium text-gray-900">Be specific with time</p>
                  <p className="text-gray-600">Try "last month" or "this week"</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <p className="font-medium text-gray-900">Ask about categories</p>
                  <p className="text-gray-600">Like "restaurants" or "groceries"</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <p className="font-medium text-gray-900">Request comparisons</p>
                  <p className="text-gray-600">"Compare this month to last month"</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                  <p className="font-medium text-gray-900">Get forecasts</p>
                  <p className="text-gray-600">"Predict next month's expenses"</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 shadow-xl">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg shadow-md mr-2">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  Example Questions
                </h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  "What's my biggest expense category?"
                </div>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  "How much did I spend on food last month?"
                </div>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  "Show me unusual transactions"
                </div>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  "Help me create a budget"
                </div>
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  "What's my average daily spending?"
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 shadow-xl">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-3">
                <Link href="/analytics" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    View Analytics
                  </Button>
                </Link>
                <Link href="/upload" className="block">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    Upload More Files
                  </Button>
                </Link>
                <Link href="/pricing" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt for Free Users with Glass Effect */}
        {userProfile?.subscription_tier === 'free' && (
          <div className="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center text-lg">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg shadow-md mr-3">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Unlock Advanced AI Features
                </h3>
                <p className="text-gray-600">
                  Get unlimited chat sessions, extended conversation memory, and premium insights
                </p>
              </div>
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}