'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Loader2, 
  RefreshCw, 
  Trash2, 
  Download, 
  ExternalLink,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { formatBytes } from '@/lib/utils'
import { hasGoogleIntegration } from '@/lib/google/auth'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function GoogleDriveFiles() {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [deletingFileIds, setDeletingFileIds] = useState(new Set())

  // Check Google integration and load files
  useEffect(() => {
    const loadFiles = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        // Check Google integration
        const connected = await hasGoogleIntegration(user.id)
        setHasGoogle(connected)

        if (!connected) {
          setIsLoading(false)
          return
        }

        // Fetch files
        const response = await fetch('/api/google/drive/files?pageSize=50')
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please reconnect your Google account')
          }
          throw new Error('Failed to load files from Google Drive')
        }

        const data = await response.json()
        setFiles(data.data.files || [])
        setNextPageToken(data.data.nextPageToken)
        
        if ((data.data.files || []).length === 0) {
          toast({
            title: 'No Files Found',
            description: 'No files found in your Statement Converter folder yet.',
          })
        }
      } catch (err) {
        console.error('Error loading files:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadFiles()
  }, [user])

  const handleRefresh = async () => {
    if (!user || !hasGoogle) return
    
    setIsLoading(true)
    setError(null)
    setSelectedFiles([])
    
    toast({
      title: 'Refreshing Files',
      description: 'Loading your latest files from Google Drive...',
    })

    try {
      const response = await fetch('/api/google/drive/files?pageSize=50')
      if (!response.ok) {
        throw new Error('Failed to refresh files')
      }

      const data = await response.json()
      setFiles(data.data.files || [])
      setNextPageToken(data.data.nextPageToken)
      
      toast({
        title: 'Files Refreshed',
        description: `Found ${data.data.files?.length || 0} files in your folder.`,
        variant: 'success'
      })
    } catch (err) {
      console.error('Error refreshing files:', err)
      setError(err.message)
      toast({
        title: 'Refresh Failed',
        description: err.message || 'Could not refresh files. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId)
      }
      return [...prev, fileId]
    })
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map(file => file.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedFiles.length} file(s) from Google Drive?`
    )
    if (!confirmDelete) return

    setIsDeleting(true)
    setError(null)
    setDeletingFileIds(new Set(selectedFiles))

    try {
      const response = await fetch('/api/google/drive/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: selectedFiles }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete files')
      }

      const result = await response.json()
      
      // Remove deleted files from the list
      setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)))
      setSelectedFiles([])
      setDeletingFileIds(new Set())

      if (result.data.failed > 0) {
        toast({
          title: 'Partial Success',
          description: `Deleted ${result.data.successful} files, ${result.data.failed} failed to delete.`,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Files Deleted',
          description: `Successfully deleted ${result.data.successful} file${result.data.successful > 1 ? 's' : ''}.`,
          variant: 'success'
        })
      }
    } catch (err) {
      console.error('Error deleting files:', err)
      setError(err.message)
      toast({
        title: 'Delete Failed',
        description: err.message || 'Could not delete files. Please try again.',
        variant: 'destructive'
      })
      setDeletingFileIds(new Set())
    } finally {
      setIsDeleting(false)
    }
  }

  if (!hasGoogle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Drive Files</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your Google account to manage your exported files in Google Drive.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Google Drive Files</CardTitle>
        <div className="flex gap-2">
          {selectedFiles.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedFiles.length})
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh files"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh files</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && files.length === 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No files found in your Statement Converter folder
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedFiles.length === files.length && files.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow 
                    key={file.id} 
                    className={deletingFileIds.has(file.id) ? 'opacity-50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => handleSelectFile(file.id)}
                        disabled={deletingFileIds.has(file.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(file.modifiedTime), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Open
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {nextPageToken && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                setIsLoadingMore(true)
                try {
                  const response = await fetch(`/api/google/drive/files?pageSize=50&pageToken=${nextPageToken}`)
                  if (!response.ok) throw new Error('Failed to load more files')
                  
                  const data = await response.json()
                  setFiles(prev => [...prev, ...(data.data.files || [])])
                  setNextPageToken(data.data.nextPageToken)
                  
                  toast({
                    title: 'More Files Loaded',
                    description: `Loaded ${data.data.files?.length || 0} more files.`,
                    variant: 'success'
                  })
                } catch (err) {
                  toast({
                    title: 'Failed to Load More',
                    description: 'Could not load additional files.',
                    variant: 'destructive'
                  })
                } finally {
                  setIsLoadingMore(false)
                }
              }}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}