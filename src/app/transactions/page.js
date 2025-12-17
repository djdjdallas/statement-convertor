'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import posthog from 'posthog-js'
import {
  ArrowLeft,
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  SortDesc,
  Loader2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  CheckCircle,
  ArrowUpDown
} from 'lucide-react'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [fileFilter, setFileFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [selectedTransactions, setSelectedTransactions] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    fetchData()
  }, [user, authLoading, router])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all completed files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('id, original_filename, created_at')
        .eq('user_id', user.id)
        .eq('processing_status', 'completed')
        .order('created_at', { ascending: false })

      if (filesError) throw filesError
      setFiles(filesData || [])

      // Fetch all transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          files!inner(original_filename, user_id)
        `)
        .eq('files.user_id', user.id)
        .order('date', { ascending: false })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load transactions. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories from transactions
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [transactions])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.description?.toLowerCase().includes(query) ||
        t.normalized_merchant?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter)
    }

    // File filter
    if (fileFilter !== 'all') {
      result = result.filter(t => t.file_id === fileFilter)
    }

    // Type filter (income/expense)
    if (typeFilter === 'income') {
      result = result.filter(t => t.amount > 0)
    } else if (typeFilter === 'expense') {
      result = result.filter(t => t.amount < 0)
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date) - new Date(b.date)
        case 'date_desc':
          return new Date(b.date) - new Date(a.date)
        case 'amount_desc':
          return Math.abs(b.amount) - Math.abs(a.amount)
        case 'amount_asc':
          return Math.abs(a.amount) - Math.abs(b.amount)
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        default:
          return 0
      }
    })

    return result
  }, [transactions, searchQuery, categoryFilter, fileFilter, typeFilter, sortBy])

  // Stats
  const stats = useMemo(() => {
    const total = filteredTransactions.length
    const income = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const expenses = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { total, income, expenses, net: income - expenses }
  }, [filteredTransactions])

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)))
    } else {
      setSelectedTransactions(new Set())
    }
  }, [selectAll, filteredTransactions])

  const toggleTransaction = (id) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTransactions(newSelected)
    setSelectAll(newSelected.size === filteredTransactions.length)
  }

  const handleExportAll = async (format) => {
    const transactionsToExport = selectedTransactions.size > 0
      ? filteredTransactions.filter(t => selectedTransactions.has(t.id))
      : filteredTransactions

    if (transactionsToExport.length === 0) {
      toast({
        title: 'No Transactions',
        description: 'There are no transactions to export.',
        variant: 'destructive'
      })
      return
    }

    posthog.capture('export_all_clicked', {
      export_type: format,
      transaction_count: transactionsToExport.length,
      selected_only: selectedTransactions.size > 0,
      source: 'transactions_page'
    })

    setExporting(true)

    try {
      const response = await fetch('/api/export/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionIds: transactionsToExport.map(t => t.id),
          format
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `all_transactions_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      posthog.capture('export_all_completed', {
        export_type: format,
        transaction_count: transactionsToExport.length,
        source: 'transactions_page'
      })

      toast({
        title: 'Export Successful',
        description: `${transactionsToExport.length} transactions exported to ${format.toUpperCase()}.`,
        variant: 'success'
      })

    } catch (error) {
      console.error('Export error:', error)

      posthog.capture('export_all_failed', {
        export_type: format,
        error_message: error.message,
        source: 'transactions_page'
      })

      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export transactions.',
        variant: 'destructive'
      })
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-2 rounded-xl shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      All Transactions
                    </span>
                    <div className="text-xs text-gray-500 -mt-1">View & export all extractions</div>
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => handleExportAll('xlsx')}
                disabled={exporting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                {selectedTransactions.size > 0
                  ? `Export Selected (${selectedTransactions.size})`
                  : 'Export All Excel'}
              </Button>
              <Button
                onClick={() => handleExportAll('csv')}
                disabled={exporting}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-red-500 to-rose-500 p-3 rounded-xl shadow-lg">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.expenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl shadow-lg ${stats.net >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Net</p>
                  <p className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.net)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search description, merchant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={fileFilter} onValueChange={setFileFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="File" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  {files.map(file => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.original_filename?.substring(0, 25)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SortDesc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="amount_desc">Highest Amount</SelectItem>
                  <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transactions ({filteredTransactions.length.toLocaleString()})</CardTitle>
                <CardDescription>
                  {selectedTransactions.size > 0
                    ? `${selectedTransactions.size} selected`
                    : 'All extracted transactions across your files'}
                </CardDescription>
              </div>
              {filteredTransactions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={setSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
                    Select All
                  </label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {transactions.length === 0
                    ? 'Process some bank statements to see transactions here'
                    : 'Try adjusting your search or filters'}
                </p>
                {transactions.length === 0 && (
                  <Link href="/upload">
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Bank Statement
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 w-8"></th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">File</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 500).map((transaction) => (
                      <tr
                        key={transaction.id}
                        className={`border-b border-gray-100 hover:bg-white/50 transition-colors ${
                          selectedTransactions.has(transaction.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="py-3 px-2">
                          <Checkbox
                            checked={selectedTransactions.has(transaction.id)}
                            onCheckedChange={() => toggleTransaction(transaction.id)}
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {transaction.normalized_merchant || transaction.description}
                            </p>
                            {transaction.normalized_merchant && transaction.description !== transaction.normalized_merchant && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {transaction.category && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 truncate max-w-[150px]">
                          {transaction.files?.original_filename}
                        </td>
                        <td className={`py-3 px-4 text-sm font-medium text-right ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTransactions.length > 500 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Showing first 500 of {filteredTransactions.length.toLocaleString()} transactions.
                    Use filters to narrow down or export all.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
