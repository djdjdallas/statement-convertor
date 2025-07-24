'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import FileUploader from '@/components/FileUploader'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  FileText, 
  Settings, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    fetchUserProfile()
  }, [user, router])

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
        // Set default profile on error to prevent blocking
        setUserProfile({ subscription_tier: 'free' })
        return
      }

      setUserProfile(data || { subscription_tier: 'free' })
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleFileUpload = async (file, onProgress) => {
    try {
      // Let Supabase generate the UUID
      const fileId = crypto.randomUUID()
      
      // Create file record in database
      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          user_id: user.id,
          filename: `${fileId}.pdf`,
          original_filename: file.name,
          file_size: file.size,
          processing_status: 'pending'
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('statement-files')
        .upload(`${user.id}/${fileId}.pdf`, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // Clean up database record if upload fails
        await supabase.from('files').delete().eq('id', fileId)
        throw new Error(`Upload error: ${uploadError.message}`)
      }

      // Update file record with path
      await supabase
        .from('files')
        .update({ file_path: uploadData.path })
        .eq('id', fileId)

      onProgress(100)

      // Add to uploaded files list
      const newFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: 'uploaded',
        uploadedAt: new Date().toISOString()
      }

      setUploadedFiles(prev => [...prev, newFile])

      // Log usage
      await supabase.from('usage_tracking').insert({
        user_id: user.id,
        action: 'file_upload',
        details: {
          filename: file.name,
          file_size: file.size,
          file_id: fileId
        }
      })

      return newFile
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  const handleFileRemove = async (fileId) => {
    try {
      // Remove from state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId))

      // Delete from storage and database
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting file:', deleteError)
      }

      // Also delete from storage
      await supabase.storage
        .from('statement-files')
        .remove([`${user.id}/${fileId}.pdf`])

    } catch (error) {
      console.error('Error removing file:', error)
    }
  }

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return

    setProcessing(true)

    try {
      // Update all files to processing status
      setUploadedFiles(prev => 
        prev.map(file => ({ ...file, status: 'processing' }))
      )

      // Process each file using the PDF processing API
      for (const file of uploadedFiles) {
        try {
          const response = await fetch('/api/process-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileId: file.id })
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Processing failed')
          }

          if (result.success) {
            setUploadedFiles(prev => 
              prev.map(f => f.id === file.id ? { 
                ...f, 
                status: 'completed',
                transactionCount: result.data.transactionCount,
                bankType: result.data.bankType
              } : f)
            )
          } else {
            throw new Error(result.error || 'Processing failed')
          }

        } catch (error) {
          console.error(`Error processing file ${file.id}:`, error)
          
          setUploadedFiles(prev => 
            prev.map(f => f.id === file.id ? { 
              ...f, 
              status: 'failed',
              error: error.message
            } : f)
          )
        }
      }

    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to upload files</p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  const completedFiles = uploadedFiles.filter(file => file.status === 'completed')
  const canProcess = uploadedFiles.length > 0 && !processing

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-3xl font-bold text-gray-900">Upload Bank Statements</h1>
              <p className="text-gray-600 mt-2">
                Upload your PDF bank statements to convert them to Excel or CSV format
              </p>
            </div>
            {userProfile && (
              <Badge variant="outline" className="capitalize">
                {userProfile.subscription_tier} Plan
              </Badge>
            )}
          </div>
        </div>

        {/* How it works steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              How it works
            </CardTitle>
            <CardDescription>
              Follow these simple steps to convert your bank statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">1. Upload Files</h3>
                <p className="text-sm text-gray-600">Drag and drop your PDF bank statements</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">2. Process</h3>
                <p className="text-sm text-gray-600">Our AI extracts transaction data</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">3. Download</h3>
                <p className="text-sm text-gray-600">Get your Excel or CSV files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Uploader */}
        <FileUploader
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          uploadedFiles={uploadedFiles}
          userTier={userProfile?.subscription_tier || 'free'}
          disabled={processing}
        />

        {/* Process Files Section */}
        {uploadedFiles.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Ready to Process</CardTitle>
              <CardDescription>
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ready for conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing files...</span>
                      <span>{completedFiles.length} / {uploadedFiles.length} completed</span>
                    </div>
                    <Progress value={(completedFiles.length / uploadedFiles.length) * 100} />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                            {file.bankType && (
                              <span>• {file.bankType === 'generic' ? 'Bank Statement' : file.bankType}</span>
                            )}
                            {file.transactionCount && (
                              <span>• {file.transactionCount} transactions</span>
                            )}
                          </div>
                          {file.error && (
                            <p className="text-sm text-red-600 mt-1">{file.error}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(file.status)}>
                        {file.status || 'uploaded'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={processFiles}
                    disabled={!canProcess}
                    className="flex-1"
                  >
                    {processing ? 'Processing...' : `Process ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`}
                  </Button>
                  {completedFiles.length > 0 && (
                    <Link href="/dashboard">
                      <Button variant="outline">
                        View Results
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}