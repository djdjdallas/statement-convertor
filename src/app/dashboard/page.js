'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { SUBSCRIPTION_TIERS, checkUsageLimit } from '@/lib/subscription-tiers'
import SubscriptionCard from '@/components/SubscriptionCard'
import CheckoutSuccess from '@/components/CheckoutSuccess'
import { 
  Upload, 
  FileText, 
  Download, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  BarChart3,
  Calendar,
  User,
  LogOut,
  Settings,
  MessageCircle,
  Sheet,
  Sparkles
} from 'lucide-react'

export default function DashboardPage() {
  const [files, setFiles] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [stats, setStats] = useState({
    thisMonth: 0,
    totalFiles: 0,
    totalTransactions: 0,
    totalExports: 0
  })
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile || { subscription_tier: 'free' })

      // Fetch files with transaction counts
      const { data: filesData } = await supabase
        .from('files')
        .select(`
          *,
          transactions(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setFiles(filesData || [])

      // Fetch usage statistics
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      const { data: monthlyUsage } = await supabase
        .from('usage_tracking')
        .select('action')
        .eq('user_id', user.id)
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-32`)

      const { data: exports } = await supabase
        .from('file_exports')
        .select('id')
        .eq('user_id', user.id)

      const totalTransactions = filesData?.reduce((sum, file) => 
        sum + (file.transactions?.[0]?.count || 0), 0) || 0

      setStats({
        thisMonth: monthlyUsage?.filter(u => u.action === 'pdf_process').length || 0,
        totalFiles: filesData?.length || 0,
        totalTransactions,
        totalExports: exports?.length || 0
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from local state
      setFiles(prev => prev.filter(file => file.id !== fileId))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalFiles: prev.totalFiles - 1
      }))

    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file. Please try again.')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const userTier = userProfile?.subscription_tier || 'free'
  const tierInfo = SUBSCRIPTION_TIERS[userTier]
  const monthlyLimit = tierInfo?.limits.monthlyConversions
  const canProcess = monthlyLimit === -1 || stats.thisMonth < monthlyLimit

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to access your dashboard</p>
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glass Effect */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  StatementConverter
                </span>
                <div className="text-xs text-gray-500 -mt-1">AI-Powered Analytics</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge 
                variant="outline" 
                className={`capitalize px-3 py-1 font-medium border-2 ${
                  userTier === 'premium' 
                    ? 'border-gradient-to-r from-purple-500 to-pink-500 text-purple-700 bg-purple-50' 
                    : userTier === 'basic'
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-gray-300 text-gray-600 bg-gray-50'
                }`}
              >
                ✨ {userTier} Plan
              </Badge>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="hover:bg-white/60 transition-all duration-200">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="hover:bg-red-50 hover:text-red-600 transition-all duration-200">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Checkout Success Message */}
        <CheckoutSuccess />

        {/* Modern Welcome Section with Bento Box Layout */}
        <div className="mb-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  Welcome back, {userProfile?.full_name || user.email?.split('@')[0]}! 👋
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                  Transform your financial data with AI-powered insights
                </p>
              </div>
              <div className="mt-6 md:mt-0 flex space-x-3">
                <Link href="/analytics">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" className="border-2 border-indigo-200 hover:bg-indigo-50 transition-all duration-300">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    AI Chat
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards with Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <div className="flex items-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stats.thisMonth}
                    </p>
                    {monthlyLimit !== -1 && (
                      <p className="text-sm text-gray-500 ml-1">
                        / {monthlyLimit}
                      </p>
                    )}
                  </div>
                  {monthlyLimit !== -1 && (
                    <div className="mt-3">
                      <Progress 
                        value={(stats.thisMonth / monthlyLimit) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((stats.thisMonth / monthlyLimit) * 100)}% used
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.totalFiles}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Successfully processed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    {stats.totalTransactions.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Extracted & analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Exports</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {stats.totalExports}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Downloads completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Quick Actions with Bento Box Design */}
        <Card className="mb-12 bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              🚀 Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Get started with your most common tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Link href="/upload">
                <Button 
                  className={`w-full h-32 flex flex-col space-y-3 text-lg font-medium transition-all duration-300 hover:scale-105 ${
                    canProcess 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-2xl' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`} 
                  disabled={!canProcess}
                >
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Plus className="h-8 w-8" />
                  </div>
                  <span>Upload New File</span>
                  {!canProcess && (
                    <span className="text-xs opacity-75">Limit Reached</span>
                  )}
                </Button>
              </Link>
              
              <Link href="#pricing">
                <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer h-32">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center h-full">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Upgrade Plan
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Get unlimited access</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/analytics">
                <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer h-32">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center h-full">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          View Analytics
                        </p>
                        <p className="text-sm text-gray-500 mt-1">AI-powered insights</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/chat">
                <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer h-32">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center h-full">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          AI Assistant
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Ask about finances</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <SubscriptionCard 
              userProfile={userProfile} 
              monthlyUsage={stats.thisMonth} 
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Supported Banks</h4>
                  <p className="text-gray-600">
                    We support statements from Chase, Bank of America, Wells Fargo, Citibank, and 200+ more banks.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">File Formats</h4>
                  <p className="text-gray-600">
                    Upload PDF files up to {userTier === 'free' ? '10MB' : userTier === 'basic' ? '50MB' : '100MB'}. Export as Excel or CSV.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Security</h4>
                  <p className="text-gray-600">
                    All files are automatically deleted after 7 days. We use bank-level encryption.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Files</CardTitle>
                <CardDescription>
                  Your uploaded and processed bank statements
                </CardDescription>
              </div>
              <Link href="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No files uploaded yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by uploading your first bank statement
                </p>
                <Link href="/upload">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First File
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(file.processing_status)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {file.original_filename}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(file.created_at)}</span>
                          {file.transactions?.[0]?.count && (
                            <>
                              <span>•</span>
                              <span>{file.transactions[0].count} transactions</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(file.processing_status)}>
                        {file.processing_status}
                      </Badge>
                      
                      {file.processing_status === 'completed' && (
                        <Link href={`/preview/${file.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Limits Warning */}
        {!canProcess && monthlyLimit !== -1 && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-medium text-orange-900">
                    Monthly limit reached
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    You've processed {stats.thisMonth} out of {monthlyLimit} files this month. 
                    Upgrade your plan to continue processing files.
                  </p>
                  <Link href="#pricing" className="inline-block mt-3">
                    <Button size="sm">
                      Upgrade Plan
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}