'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DataPreview from '@/components/DataPreview'
import AIInsights from '@/components/AIInsights'
import FinancialChat from '@/components/chat/FinancialChat'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/hooks/useUserProfile'
import { hasXeroAccess } from '@/lib/subscription-tiers'
import { ArrowLeft, Download, Loader2, Brain, MessageCircle, Building, Zap } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export default function PreviewPage() {
  const { fileId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { profile, subscriptionTier } = useUserProfile()
  const [fileInfo, setFileInfo] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [aiInsights, setAiInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState({ csv: false, xlsx: false, xero: false })
  const [activeTab, setActiveTab] = useState('data')
  const [xeroConnections, setXeroConnections] = useState([])
  const [showXeroExport, setShowXeroExport] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedBankAccount, setSelectedBankAccount] = useState('')
  const [bankAccounts, setBankAccounts] = useState([])
  const supabase = createClient()

  // Check if user has Xero access
  const userHasXeroAccess = hasXeroAccess(subscriptionTier)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    if (fileId) {
      fetchFileInfo()
    }

    // Fetch Xero connections if user has access
    if (userHasXeroAccess) {
      fetchXeroConnections()
    }
  }, [user, fileId, router, userHasXeroAccess])

  const fetchFileInfo = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('File not found')
        } else {
          setError('Failed to load file information')
        }
        return
      }

      if (data.processing_status !== 'completed') {
        setError('File processing not completed yet')
        return
      }

      setFileInfo(data)
      
      // Fetch transactions with AI enhancements
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('file_id', fileId)
        .order('date', { ascending: true })

      if (transactionsData) {
        setTransactions(transactionsData)
      }

      // Fetch AI insights if available
      if (data.ai_enhanced) {
        const { data: insightsData } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('file_id', fileId)
          .eq('user_id', user.id)
          .single()

        if (insightsData?.insights_data) {
          setAiInsights(insightsData.insights_data)
        }
      }
      
      setError(null)
    } catch (err) {
      console.error('Error fetching file info:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchXeroConnections = async () => {
    try {
      const response = await fetch('/api/xero/connections')
      if (response.ok) {
        const { connections } = await response.json()
        setXeroConnections(connections?.filter(c => c.is_active) || [])
      }
    } catch (error) {
      console.error('Failed to fetch Xero connections:', error)
    }
  }

  const fetchBankAccounts = async (tenantId) => {
    try {
      const response = await fetch(`/api/xero/accounts?tenantId=${tenantId}&type=BANK`)
      if (response.ok) {
        const { accounts } = await response.json()
        setBankAccounts(accounts || [])
      } else {
        const error = await response.json()
        
        // Check if it's a token expiration error
        if (error.code === 'XERO_TOKEN_EXPIRED' || error.requiresReconnect) {
          toast({
            title: 'Xero Session Expired',
            description: 'Your Xero session has expired. Please reconnect your Xero account in Settings.',
            variant: 'destructive',
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/settings?tab=integrations')}
              >
                Go to Settings
              </Button>
            )
          })
          setShowXeroExport(false)
        }
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error)
    }
  }

  const handleXeroExport = async () => {
    if (!selectedTenant || !selectedBankAccount) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a Xero organization and bank account',
        variant: 'destructive'
      })
      return
    }

    try {
      setExporting(prev => ({ ...prev, xero: true }))
      
      const response = await fetch('/api/xero/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          tenantId: selectedTenant,
          bankAccountId: selectedBankAccount
        }),
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Export to Xero failed')
      }

      toast({
        title: 'Success!',
        description: `${result.transactionCount} transactions exported to Xero successfully`,
        variant: 'success'
      })

      setShowXeroExport(false)
      // Refresh file info to show Xero import status
      fetchFileInfo()

    } catch (error) {
      console.error('Xero export error:', error)
      
      // Check if it's a token expiration error
      if (error.message?.includes('Xero session expired') || 
          error.message?.includes('authentication failed')) {
        toast({
          title: 'Xero Session Expired',
          description: 'Your Xero session has expired. Please reconnect your Xero account in Settings.',
          variant: 'destructive',
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/settings?tab=integrations')}
            >
              Go to Settings
            </Button>
          )
        })
      } else {
        toast({
          title: 'Export Failed',
          description: error.message || 'Failed to export to Xero. Please try again.',
          variant: 'destructive'
        })
      }
    } finally {
      setExporting(prev => ({ ...prev, xero: false }))
    }
  }

  const handleExport = async (format) => {
    try {
      setExporting(prev => ({ ...prev, [format]: true }))

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          format
        }),
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Export failed')
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `transactions.${format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export file. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }))
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to access this page</p>
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
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading file information...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <p className="text-lg font-medium">Unable to load file</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
              <div className="space-x-4">
                <Button onClick={fetchFileInfo}>
                  Try Again
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Preview</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-gray-600">
                  Review your extracted transaction data and export to Excel or CSV
                </p>
                {fileInfo?.source === 'google_drive' && (
                  <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z"/>
                    </svg>
                    Imported from Drive
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => handleExport('csv')}
                disabled={exporting.csv}
                variant="outline"
              >
                {exporting.csv ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </Button>
              
              <Button
                onClick={() => handleExport('xlsx')}
                disabled={exporting.xlsx}
              >
                {exporting.xlsx ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Excel
              </Button>
              
              {xeroConnections.length > 0 && !fileInfo?.xero_import_id && (
                userHasXeroAccess ? (
                  <Button
                    onClick={() => setShowXeroExport(true)}
                    variant="outline"
                    className="border-green-300 hover:bg-green-50"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Export to Xero
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      toast({
                        title: "Premium Feature",
                        description: "Xero export is available on Professional plans and above. Upgrade to export directly to Xero.",
                        variant: "default",
                        action: (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => router.push('/pricing')}
                          >
                            View Plans
                          </Button>
                        )
                      })
                    }}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Export to Xero
                    <Badge className="ml-2" variant="secondary">Pro</Badge>
                  </Button>
                )
              )}
              
              {fileInfo?.xero_import_id && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 px-3 py-2">
                  <Zap className="h-4 w-4 mr-1" />
                  Exported to Xero
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('data')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transaction Data
              </button>
              {fileInfo?.ai_enhanced && (
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'insights'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Brain className="h-4 w-4 mr-1" />
                  AI Insights
                </button>
              )}
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Ask AI
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'data' && (
          <DataPreview
            fileId={fileId}
            onExport={handleExport}
            exportFormats={['csv', 'xlsx']}
            transactions={transactions}
            user={user}
          />
        )}

        {activeTab === 'insights' && fileInfo?.ai_enhanced && (
          <AIInsights 
            insights={aiInsights}
            transactions={transactions}
          />
        )}

        {activeTab === 'chat' && (
          <div className="h-[600px]">
            <FinancialChat 
              transactions={transactions}
              userProfile={{ subscription_tier: 'free' }} // Default for preview page
              className="h-full"
            />
          </div>
        )}

        {/* Additional Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              What would you like to do next with your converted data?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Process More Files</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload and convert additional bank statements
                </p>
                <Link href="/upload">
                  <Button variant="outline" className="w-full">
                    Upload More
                  </Button>
                </Link>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">View Dashboard</h3>
                <p className="text-sm text-gray-600 mb-4">
                  See all your processed files and exports
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Dashboard
                  </Button>
                </Link>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Upgrade Plan</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get unlimited conversions and more features
                </p>
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Xero Export Dialog */}
        <Dialog open={showXeroExport} onOpenChange={setShowXeroExport}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                Export to Xero
              </DialogTitle>
              <DialogDescription>
                Select the Xero organization and bank account to export these transactions
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Xero Organization</label>
                <Select 
                  value={selectedTenant} 
                  onValueChange={(value) => {
                    setSelectedTenant(value)
                    setSelectedBankAccount('')
                    setBankAccounts([])
                    if (value) fetchBankAccounts(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {xeroConnections.map((conn) => (
                      <SelectItem key={conn.tenant_id} value={conn.tenant_id}>
                        {conn.tenant_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank Account</label>
                <Select 
                  value={selectedBankAccount} 
                  onValueChange={setSelectedBankAccount}
                  disabled={!selectedTenant}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.accountID} value={account.accountID}>
                        {account.name} ({account.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>{transactions.length} transactions</strong> will be exported to Xero.
                  Each transaction will be matched to the bank account and categorized automatically.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowXeroExport(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleXeroExport}
                disabled={!selectedTenant || !selectedBankAccount || exporting.xero}
                className="bg-green-600 hover:bg-green-700"
              >
                {exporting.xero ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Export to Xero
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}