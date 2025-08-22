'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Download, 
  Search, 
  Filter,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Brain,
  AlertTriangle,
  Star
} from 'lucide-react'

export default function DataPreview({ 
  fileId, 
  onExport, 
  exportFormats = ['csv', 'xlsx'],
  transactions: propTransactions = null
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 25
  })

  useEffect(() => {
    if (fileId) {
      fetchTransactions()
    }
  }, [fileId, filters])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        fileId,
        ...filters,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })

      const response = await fetch(`/api/transactions?${params}`, {
        credentials: 'same-origin'
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch transactions')
      }

      setData(result.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }))
  }

  const handleSort = (column) => {
    const newOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: newOrder,
      page: 1
    }))
  }

  const handleEditTransaction = async (transactionId, updates) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionId, updates }),
        credentials: 'same-origin'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update transaction')
      }

      // Update local data
      setData(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === transactionId ? { ...t, ...updates } : t
        )
      }))

      setEditingTransaction(null)
    } catch (err) {
      console.error('Error updating transaction:', err)
      alert(err.message)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />
    }
    return filters.sortOrder === 'asc' ? 
      <TrendingUp className="h-4 w-4" /> : 
      <TrendingDown className="h-4 w-4" />
  }

  const categories = useMemo(() => {
    return data?.categories || []
  }, [data?.categories])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transaction data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading data: {error}</p>
            <Button onClick={fetchTransactions} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const { file, transactions, pagination, stats } = data

  return (
    <div className="space-y-6">
      {/* File Info & Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {file.original_filename}
                <Badge variant="outline">
                  {stats.totalTransactions} transactions
                </Badge>
              </CardTitle>
              <CardDescription>
                Extracted transaction data ready for export
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {exportFormats.includes('csv') && (
                <Button onClick={() => onExport('csv')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
              {exportFormats.includes('xlsx') && (
                <Button onClick={() => onExport('xlsx')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalCredits)}
              </div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalDebits)}
              </div>
              <div className="text-sm text-gray-600">Total Debits</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.netAmount)}
              </div>
              <div className="text-sm text-gray-600">Net Amount</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {formatCurrency(stats.averageTransaction)}
              </div>
              <div className="text-sm text-gray-600">Average Transaction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Search
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search descriptions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Category
              </label>
              <Select 
                value={filters.category} 
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Sort By
              </label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Per Page
              </label>
              <Select 
                value={filters.limit.toString()} 
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('date')}
                      className="font-semibold"
                    >
                      Date {getSortIcon('date')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('description')}
                      className="font-semibold"
                    >
                      Description {getSortIcon('description')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('category')}
                      className="font-semibold"
                    >
                      Category {getSortIcon('category')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('amount')}
                      className="font-semibold"
                    >
                      Amount {getSortIcon('amount')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center w-16">AI</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      {editingTransaction === transaction.id ? (
                        <Input
                          defaultValue={transaction.description}
                          onBlur={(e) => handleEditTransaction(transaction.id, { description: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditTransaction(transaction.id, { description: e.target.value })
                            } else if (e.key === 'Escape') {
                              setEditingTransaction(null)
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="space-y-1">
                          <span className="truncate max-w-xs block">
                            {transaction.normalized_merchant || transaction.description}
                          </span>
                          {transaction.normalized_merchant && transaction.normalized_merchant !== transaction.description && (
                            <span className="text-xs text-gray-500 truncate max-w-xs block">
                              Original: {transaction.description}
                            </span>
                          )}
                          {transaction.anomaly_data && transaction.anomaly_data !== 'null' && (
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-orange-600">Anomaly detected</span>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {transaction.category}
                        </Badge>
                        {transaction.subcategory && (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.subcategory}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-mono ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-600">
                      {transaction.balance ? formatCurrency(transaction.balance) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.confidence ? (
                        <div className="flex flex-col items-center">
                          <div className={`flex items-center space-x-1 ${
                            transaction.confidence >= 90 ? 'text-green-600' :
                            transaction.confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {transaction.confidence >= 90 ? (
                              <Star className="h-3 w-3 fill-current" />
                            ) : transaction.confidence >= 70 ? (
                              <Brain className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {transaction.confidence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTransaction(
                          editingTransaction === transaction.id ? null : transaction.id
                        )}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} transactions
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}