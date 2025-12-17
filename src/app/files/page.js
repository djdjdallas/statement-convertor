'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import posthog from 'posthog-js'
import {
  ArrowLeft,
  FileText,
  Upload,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  SortAsc,
  SortDesc,
  Download,
  Building,
  Send
} from 'lucide-react'

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    fileToDelete: null,
    isDeleting: false
  })
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    fetchFiles()
  }, [user, authLoading, router])

  useEffect(() => {
    filterAndSortFiles()
  }, [files, searchQuery, statusFilter, sortBy])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          transactions(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: 'Error',
        description: 'Failed to load files. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortFiles = () => {
    let result = [...files]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(file =>
        file.original_filename?.toLowerCase().includes(query) ||
        file.bank_type?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(file => file.processing_status === statusFilter)
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'name_asc':
          return (a.original_filename || '').localeCompare(b.original_filename || '')
        case 'name_desc':
          return (b.original_filename || '').localeCompare(a.original_filename || '')
        case 'transactions_desc':
          return (b.transactions?.[0]?.count || 0) - (a.transactions?.[0]?.count || 0)
        case 'transactions_asc':
          return (a.transactions?.[0]?.count || 0) - (b.transactions?.[0]?.count || 0)
        default:
          return 0
      }
    })

    setFilteredFiles(result)
  }

  const handleDeleteFile = (file) => {
    setDeleteModalState({
      isOpen: true,
      fileToDelete: file,
      isDeleting: false
    })
  }

  const confirmDeleteFile = async () => {
    const fileToDelete = deleteModalState.fileToDelete
    if (!fileToDelete) return

    setDeleteModalState(prev => ({ ...prev, isDeleting: true }))

    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileToDelete.id)
        .eq('user_id', user.id)

      if (error) throw error

      setFiles(prev => prev.filter(file => file.id !== fileToDelete.id))

      posthog.capture('file_deleted', {
        file_id: fileToDelete.id,
        source: 'files_page'
      })

      toast({
        title: 'File Deleted',
        description: 'The file has been successfully deleted.',
        variant: 'success'
      })

      setDeleteModalState({
        isOpen: false,
        fileToDelete: null,
        isDeleting: false
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive'
      })
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
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
    if (!bytes) return '0 KB'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Stats
  const completedFiles = files.filter(f => f.processing_status === 'completed').length
  const totalTransactions = files.reduce((sum, f) => sum + (f.transactions?.[0]?.count || 0), 0)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading files...</p>
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
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      All Files
                    </span>
                    <div className="text-xs text-gray-500 -mt-1">Manage your uploads</div>
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/transactions">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
              </Link>
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-3xl font-bold text-gray-900">{files.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{completedFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link href="/transactions">
            <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-3 rounded-xl shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-3xl font-bold text-gray-900">{totalTransactions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SortDesc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="transactions_desc">Most Transactions</SelectItem>
                  <SelectItem value="transactions_asc">Least Transactions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader>
            <CardTitle>Files ({filteredFiles.length})</CardTitle>
            <CardDescription>
              {searchQuery || statusFilter !== 'all'
                ? `Showing ${filteredFiles.length} of ${files.length} files`
                : 'All your uploaded bank statements'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {files.length === 0 ? 'No files uploaded yet' : 'No files match your filters'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {files.length === 0
                    ? 'Get started by uploading your first bank statement'
                    : 'Try adjusting your search or filters'}
                </p>
                {files.length === 0 && (
                  <Link href="/upload">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First File
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/30 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(file.processing_status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {file.original_filename}
                          </h4>
                          {file.source === 'google_drive' && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-300 text-blue-700 bg-blue-50">
                              <svg className="w-3 h-3 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z"/>
                              </svg>
                              Drive
                            </Badge>
                          )}
                          {file.ai_enhanced && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 border-purple-300 text-purple-700 bg-purple-50">
                              AI Enhanced
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(file.created_at)}</span>
                          {file.transactions?.[0]?.count > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">
                                {file.transactions[0].count} transactions
                              </span>
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
                        onClick={() => handleDeleteFile(file)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({
          isOpen: false,
          fileToDelete: null,
          isDeleting: false
        })}
        onConfirm={confirmDeleteFile}
        title="Delete File"
        itemName={deleteModalState.fileToDelete?.original_filename}
        itemDetails={{
          size: deleteModalState.fileToDelete?.file_size,
          date: deleteModalState.fileToDelete?.created_at,
          transactionCount: deleteModalState.fileToDelete?.transactions?.[0]?.count
        }}
        isDeleting={deleteModalState.isDeleting}
      />
    </div>
  )
}
