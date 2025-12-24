'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import FileUploader from '@/components/FileUploader'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/hooks/useUserProfile'
import { hasXeroAccess } from '@/lib/subscription-tiers'
import { 
  ArrowLeft, 
  FileText, 
  Settings, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Zap,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { toast } from '@/hooks/use-toast'
import analyticsService from '@/lib/analytics/analytics-service'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import ExportSuccessModal from '@/components/ExportSuccessModal'
import posthog from 'posthog-js'

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(null) // Track current AI processing step
  const [userProfile, setUserProfile] = useState(null)
  const [hasGoogleDrive, setHasGoogleDrive] = useState(false)
  const [xeroConnections, setXeroConnections] = useState([])
  const [autoSendToXero, setAutoSendToXero] = useState(false)
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    fileToDelete: null,
    isDeleting: false
  })
  const [exportModalState, setExportModalState] = useState({
    isOpen: false,
    completedFile: null
  })
  const { user } = useAuth()
  const { profile: userProfileFromHook, subscriptionTier } = useUserProfile()
  const router = useRouter()
  const supabase = createClient()

  // Ref for auto-scrolling to "Ready to Process" section
  const readyToProcessRef = useRef(null)

  // Check if user has Xero access
  const userHasXeroAccess = hasXeroAccess(subscriptionTier)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    fetchUserProfile()
  }, [user, router])

  // Auto-scroll to "Ready to Process" card when files are added
  useEffect(() => {
    if (uploadedFiles.length > 0 && readyToProcessRef.current) {
      setTimeout(() => {
        readyToProcessRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }, 300) // Small delay to ensure DOM is updated
    }
  }, [uploadedFiles.length])

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

    // Check Google Drive connection
    try {
      const response = await fetch('/api/auth/google/link')
      if (response.ok) {
        const data = await response.json()
        setHasGoogleDrive(data.linked)
      }
    } catch (err) {
      console.log('Could not check Google Drive status')
    }

    // Check Xero connections
    try {
      const xeroResponse = await fetch('/api/xero/connections')
      if (xeroResponse.ok) {
        const { connections } = await xeroResponse.json()
        setXeroConnections(connections?.filter(c => c.is_active) || [])
      }
    } catch (err) {
      console.log('Could not check Xero connection status')
    }
  }

  const handleFileUpload = async (file, onProgress) => {
    try {
      // Check if file is from Google Drive (already imported)
      if (file.isFromGoogleDrive && file.id) {
        // File is already imported from Google Drive
        onProgress(100)
        
        // Add to uploaded files list
        const newFile = {
          id: file.id,
          name: file.name,
          size: file.size,
          status: file.status || 'uploaded',
          uploadedAt: new Date().toISOString(),
          isFromGoogleDrive: true
        }

        setUploadedFiles(prev => [...prev, newFile])
        
        return newFile
      }
      
      // Regular file upload flow
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

      // Track analytics event
      analyticsService.trackEvent('pdf_upload', 'conversion', 'File uploaded', file.size, {
        filename: file.name,
        file_size: file.size,
        file_id: fileId
      })

      // PostHog: Capture PDF upload event
      posthog.capture('pdf_uploaded', {
        file_id: fileId,
        file_name: file.name,
        file_size: file.size,
      })

      return newFile
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  const handleFileRemove = (fileId) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId)
    setDeleteModalState({
      isOpen: true,
      fileToDelete: fileToRemove,
      isDeleting: false
    })
  }

  const confirmFileRemove = async () => {
    const fileToRemove = deleteModalState.fileToDelete
    if (!fileToRemove) return

    setDeleteModalState(prev => ({ ...prev, isDeleting: true }))

    try {
      // Remove from state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileToRemove.id))

      // Delete from storage and database
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileToRemove.id)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting file:', deleteError)
        toast({
          title: "Error",
          description: "Failed to remove file. Please try again.",
          variant: "destructive"
        })
      }

      // Also delete from storage
      await supabase.storage
        .from('statement-files')
        .remove([`${user.id}/${fileToRemove.id}.pdf`])

      // Close modal
      setDeleteModalState({
        isOpen: false,
        fileToDelete: null,
        isDeleting: false
      })

      toast({
        title: "File Removed",
        description: "The file has been removed successfully.",
        variant: "success"
      })

    } catch (error) {
      console.error('Error removing file:', error)
      toast({
        title: "Error",
        description: "Failed to remove file. Please try again.",
        variant: "destructive"
      })
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }))
    }
  }

  // AI Processing steps for progress indication
  const PROCESSING_STEPS = [
    { id: 'extracting', label: 'Extracting text from PDF...', icon: '📄' },
    { id: 'analyzing', label: 'AI analyzing transactions...', icon: '🤖' },
    { id: 'categorizing', label: 'Categorizing transactions...', icon: '🏷️' },
    { id: 'normalizing', label: 'Normalizing merchant names...', icon: '✨' },
    { id: 'detecting', label: 'Detecting anomalies...', icon: '🔍' },
    { id: 'insights', label: 'Generating financial insights...', icon: '📊' },
    { id: 'saving', label: 'Saving results...', icon: '💾' },
  ]

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return

    setProcessing(true)
    setProcessingStep(0)

    // PostHog: Capture processing started event
    posthog.capture('pdf_processing_started', {
      file_count: uploadedFiles.length,
      file_ids: uploadedFiles.map(f => f.id),
    })

    try {
      // Update all files to processing status
      setUploadedFiles(prev =>
        prev.map(file => ({ ...file, status: 'processing' }))
      )

      // Simulate progress steps (the API doesn't report granular progress, so we estimate)
      const stepInterval = setInterval(() => {
        setProcessingStep(prev => {
          if (prev < PROCESSING_STEPS.length - 1) {
            return prev + 1
          }
          return prev
        })
      }, 8000) // Move to next step every ~8 seconds (total ~56 seconds for all steps)

      // Process each file using the PDF processing API
      for (const file of uploadedFiles) {
        try {
          // Reset step for each file
          setProcessingStep(0)

          const response = await fetch('/api/process-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileId: file.id }),
            credentials: 'same-origin' // Ensure cookies are sent with same-origin requests
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Processing failed')
          }

          if (result.success) {
            const completedFileData = {
              ...file,
              status: 'completed',
              transactionCount: result.data.transactionCount,
              bankType: result.data.bankType
            }

            setUploadedFiles(prev =>
              prev.map(f => f.id === file.id ? completedFileData : f)
            )

            // Track processing completion event
            analyticsService.trackEvent('pdf_processed', 'feature_usage', 'File processed successfully', result.data.transactionCount, {
              file_id: file.id,
              transaction_count: result.data.transactionCount,
              bank_type: result.data.bankType
            })

            // PostHog: Capture processing completed event
            posthog.capture('pdf_processing_completed', {
              file_id: file.id,
              transaction_count: result.data.transactionCount,
              bank_type: result.data.bankType,
            })

            // Show export success modal immediately for the first completed file
            // This reduces friction - users can export in 1 click after processing
            setExportModalState({
              isOpen: true,
              completedFile: completedFileData
            })

            // Auto-send to Xero if enabled and user has access
            if (autoSendToXero && xeroConnections.length > 0 && userHasXeroAccess) {
              // TODO: Implement actual Xero export
              toast({
                title: "Xero Export",
                description: `File ${file.name} ready for Xero import. Use Bulk Import from the dashboard.`
              })
            }
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

      // Clear the step progress interval
      clearInterval(stepInterval)

    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setProcessing(false)
      setProcessingStep(null)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glass Effect */}
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
                      Statement Desk
                    </span>
                    <div className="text-xs text-gray-500 -mt-1">AI-Powered Analytics</div>
                  </div>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasGoogleDrive && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z"/>
                  </svg>
                  Google Connected
                </Badge>
              )}
              {xeroConnections.length > 0 && userHasXeroAccess && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  <Building className="w-3 h-3 mr-1" />
                  Xero Connected
                </Badge>
              )}
              {userProfile && (
                <Badge 
                  variant="outline" 
                  className={`capitalize px-3 py-1 font-medium border-2 ${
                    userProfile.subscription_tier === 'premium' 
                      ? 'border-gradient-to-r from-purple-500 to-pink-500 text-purple-700 bg-purple-50' 
                      : userProfile.subscription_tier === 'basic'
                      ? 'border-blue-500 text-blue-700 bg-blue-50'
                      : 'border-gray-300 text-gray-600 bg-gray-50'
                  }`}
                >
                  ✨ {userProfile.subscription_tier} Plan
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Modern Welcome Section */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Upload Bank Statements
            </h1>
            <p className="text-gray-600 mt-3 text-lg">
              Transform your PDF bank statements into structured Excel or CSV data with AI-powered accuracy
            </p>
          </div>
        </div>

        {/* How it works steps */}
        <Card className="mb-8 bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              <Settings className="h-6 w-6 mr-2 text-gray-700" />
              How it works
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Follow these simple steps to convert your bank statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">1. Upload Files</h3>
                <p className="text-sm text-gray-600">Drag and drop your PDF bank statements</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">2. Process</h3>
                <p className="text-sm text-gray-600">Our AI extracts transaction data</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">3. Download</h3>
                <p className="text-sm text-gray-600">Get your Excel or CSV files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Xero Integration Options */}
        {xeroConnections.length > 0 && (
          userHasXeroAccess ? (
            <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-md">
                      <Building className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Xero Integration</CardTitle>
                      <CardDescription>
                        Connected to {xeroConnections.length} organization{xeroConnections.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="auto-xero" 
                    checked={autoSendToXero}
                    onCheckedChange={setAutoSendToXero}
                  />
                  <label 
                    htmlFor="auto-xero" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Automatically prepare files for Xero export after processing
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-6">
                  Files will be marked for bulk export to Xero. You can review and complete the export from the dashboard.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <CardTitle>Xero Integration</CardTitle>
                      <CardDescription>
                        Professional feature - Upgrade to use Xero integration
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Pro</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="opacity-50">
                      <Checkbox 
                        id="auto-xero" 
                        checked={false}
                        disabled={true}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Automatically prepare files for Xero export
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Available on Professional plans and above
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/pricing')}
                  >
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}

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
          <Card ref={readyToProcessRef} className="mt-8 bg-white/70 backdrop-blur-sm border-white/30 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                🚀 Ready to Process
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ready for conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processing && (
                  <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    {/* Current Step Indicator */}
                    {processingStep !== null && PROCESSING_STEPS[processingStep] && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                          <span className="text-lg">{PROCESSING_STEPS[processingStep].icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-blue-800 font-semibold text-lg">
                            {PROCESSING_STEPS[processingStep].label}
                          </p>
                          <p className="text-blue-600 text-sm">
                            Step {processingStep + 1} of {PROCESSING_STEPS.length}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </div>
                    )}

                    {/* Step Progress Pills */}
                    <div className="flex flex-wrap gap-2">
                      {PROCESSING_STEPS.map((step, index) => (
                        <div
                          key={step.id}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                            index < processingStep
                              ? 'bg-green-100 text-green-700'
                              : index === processingStep
                              ? 'bg-blue-600 text-white animate-pulse'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {index < processingStep ? '✓' : step.icon} {step.id}
                        </div>
                      ))}
                    </div>

                    {/* Overall Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 font-medium">Overall Progress</span>
                        <span className="text-blue-600">{completedFiles.length} / {uploadedFiles.length} files completed</span>
                      </div>
                      <Progress value={(completedFiles.length / uploadedFiles.length) * 100} className="h-2" />
                    </div>

                    {/* Estimated Time */}
                    <p className="text-center text-sm text-blue-600/80 italic">
                      AI processing typically takes 1-2 minutes per file
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(file.status)}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{file.name}</p>
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
                      <Badge className={`${getStatusColor(file.status)} font-medium`}>
                        {file.status || 'uploaded'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button 
                    onClick={processFiles}
                    disabled={!canProcess}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {processing ? 'Processing...' : `Process ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`}
                  </Button>
                  {completedFiles.length > 0 && (
                    <Link href="/dashboard">
                      <Button variant="outline" className="border-2 border-indigo-200 hover:bg-indigo-50 transition-all duration-300">
                        View Results
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalState.isOpen}
          onClose={() => setDeleteModalState({
            isOpen: false,
            fileToDelete: null,
            isDeleting: false
          })}
          onConfirm={confirmFileRemove}
          title="Remove File"
          description="Are you sure you want to remove this file? It will be deleted from the upload queue."
          itemName={deleteModalState.fileToDelete?.name}
          itemDetails={{
            size: deleteModalState.fileToDelete?.size
          }}
          isDeleting={deleteModalState.isDeleting}
          confirmButtonText="Remove"
          showWarning={false}
        />

        {/* Export Success Modal - Shows immediately after processing completes */}
        <ExportSuccessModal
          isOpen={exportModalState.isOpen}
          onClose={() => setExportModalState({
            isOpen: false,
            completedFile: null
          })}
          file={exportModalState.completedFile}
          hasGoogleDrive={hasGoogleDrive}
          xeroConnections={xeroConnections}
          userHasXeroAccess={userHasXeroAccess}
        />
      </div>
    </div>
  )
}