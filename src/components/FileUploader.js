'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  Loader2,
  Users
} from 'lucide-react'
import { getMaxFileSize } from '@/lib/subscription-tiers'
import GoogleDrivePicker from '@/components/GoogleDrivePicker'
import { toast } from '@/hooks/use-toast'
import { ClientService } from '@/lib/clients/client-service'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

export default function FileUploader({ 
  onFileUpload, 
  onFileRemove, 
  uploadedFiles = [],
  maxFiles = 5,
  userTier = 'free',
  disabled = false,
  selectedClient = null,
  onClientChange = null,
  showClientSelector = false 
}) {
  const [uploadProgress, setUploadProgress] = useState({})
  const [errors, setErrors] = useState({})
  const [isImportingFromDrive, setIsImportingFromDrive] = useState(false)
  const [importingFiles, setImportingFiles] = useState(new Set())
  const [clients, setClients] = useState([])
  const [isAccountingFirm, setIsAccountingFirm] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const maxFileSize = getMaxFileSize(userTier)

  useEffect(() => {
    async function loadClients() {
      if (!user || !showClientSelector) return
      
      try {
        const clientService = new ClientService()
        const userClients = await clientService.getClients(user.id)
        setClients(userClients)
        
        // Check if user is an accounting firm
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_accounting_firm')
          .eq('id', user.id)
          .single()
        
        setIsAccountingFirm(profile?.is_accounting_firm || false)
      } catch (error) {
        console.error('Failed to load clients:', error)
      }
    }

    loadClients()
  }, [user, showClientSelector, supabase])

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    const newErrors = {}
    rejectedFiles.forEach((rejectedFile, index) => {
      const { file, errors } = rejectedFile
      newErrors[`rejected-${index}`] = {
        fileName: file.name,
        message: errors.map(e => e.message).join(', ')
      }
    })
    setErrors(newErrors)

    // Process accepted files
    for (const file of acceptedFiles) {
      if (uploadedFiles.length >= maxFiles) {
        setErrors(prev => ({
          ...prev,
          maxFiles: {
            fileName: file.name,
            message: `Maximum ${maxFiles} files allowed`
          }
        }))
        continue
      }

      const fileId = `${file.name}-${Date.now()}`
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileId] || 0
            if (currentProgress >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return { ...prev, [fileId]: currentProgress + 10 }
          })
        }, 200)

        // Call the upload handler
        await onFileUpload(file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
        })

        // Complete progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
        
        // Show success toast
        toast({
          title: 'Upload Successful',
          description: `${file.name} has been uploaded successfully.`,
          variant: 'success'
        })
        
        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        }, 2000)

      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = error.message || 'Upload failed. Please try again.'
        
        setErrors(prev => ({
          ...prev,
          [fileId]: {
            fileName: file.name,
            message: errorMessage
          }
        }))
        
        toast({
          title: 'Upload Failed',
          description: `${file.name}: ${errorMessage}`,
          variant: 'destructive'
        })
        
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileId]
          return newProgress
        })
      }
    }
  }, [onFileUpload, uploadedFiles.length, maxFiles])

  const { getRootProps, getInputProps, isDragActive, isDragReject, isDragAccept } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: maxFileSize,
    maxFiles: maxFiles - uploadedFiles.length,
    disabled,
    multiple: true
  })

  const removeFile = (fileId) => {
    onFileRemove(fileId)
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fileId]
      return newErrors
    })
  }

  const clearErrors = () => {
    setErrors({})
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleGoogleDriveSelect = useCallback(async (selectedFiles) => {
    // Handle multiple files or single file
    const files = Array.isArray(selectedFiles) ? selectedFiles : [selectedFiles]
    
    for (const driveFile of files) {
      if (uploadedFiles.length >= maxFiles) {
        setErrors(prev => ({
          ...prev,
          maxFiles: {
            fileName: driveFile.name,
            message: `Maximum ${maxFiles} files allowed`
          }
        }))
        continue
      }

      const fileId = `${driveFile.name}-${Date.now()}`
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
        setIsImportingFromDrive(true)
        setImportingFiles(prev => new Set([...prev, driveFile.id]))
        
        // Import file from Google Drive
        const response = await fetch('/api/google/drive/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: driveFile.id,
            fileName: driveFile.name,
            fileSize: driveFile.size
          })
        })

        if (!response.ok) {
          const error = await response.json()
          if (error.error === 'Google Drive not connected') {
            throw new Error('Please connect your Google Drive account in Settings first')
          }
          if (response.status === 413) {
            throw new Error(`File too large. Maximum size is ${formatFileSize(maxFileSize)}`)
          }
          throw new Error(error.error || 'Failed to import file from Google Drive')
        }

        const { file } = await response.json()
        
        // Update progress
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
        
        // Create a File-like object for consistency with the onFileUpload handler
        const importedFile = {
          id: file.id,
          name: file.name,
          size: file.size,
          status: file.status,
          isFromGoogleDrive: true
        }
        
        // Call the upload handler with the imported file
        await onFileUpload(importedFile, (progress) => {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
        })
        
        // Show success toast
        toast({
          title: 'Import Successful',
          description: `${file.name} has been imported from Google Drive.`,
          variant: 'success'
        })
        
        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        }, 2000)

      } catch (error) {
        console.error('Import error:', error)
        const errorMessage = error.message || 'Import failed. Please try again.'
        
        setErrors(prev => ({
          ...prev,
          [fileId]: {
            fileName: driveFile.name,
            message: errorMessage
          }
        }))
        
        toast({
          title: 'Import Failed',
          description: `${driveFile.name}: ${errorMessage}`,
          variant: 'destructive'
        })
        
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileId]
          return newProgress
        })
      } finally {
        setImportingFiles(prev => {
          const next = new Set(prev)
          next.delete(driveFile.id)
          return next
        })
        if (importingFiles.size === 1) {
          setIsImportingFromDrive(false)
        }
      }
    }
  }, [onFileUpload, uploadedFiles.length, maxFiles])

  const getDropzoneClassName = () => {
    let className = "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
    
    if (disabled) {
      className += " border-gray-200 bg-gray-50 cursor-not-allowed"
    } else if (isDragReject) {
      className += " border-red-300 bg-red-50"
    } else if (isDragAccept) {
      className += " border-green-300 bg-green-50"
    } else if (isDragActive) {
      className += " border-blue-300 bg-blue-50"
    } else {
      className += " border-gray-300 hover:border-gray-400 hover:bg-gray-50"
    }
    
    return className
  }

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      {showClientSelector && isAccountingFirm && clients.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Assign to Client (Optional)
                </label>
                <Select value={selectedClient || ''} onValueChange={onClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client or leave blank for general use" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                        {client.industry && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({client.industry})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div {...getRootProps()} className={getDropzoneClassName()}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              
              {isDragActive ? (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragReject ? 'Invalid file type' : 'Drop your files here'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isDragReject ? 'Only PDF files are supported' : 'Release to upload'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drag & drop PDF files here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    or click to browse your computer
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      disabled={disabled}
                      onClick={(e) => {
                        // Let the dropzone handle the click
                        // This button is just visual
                      }}
                    >
                      Choose Files
                    </Button>
                    {/* Google Drive Import temporarily hidden due to API configuration issues */}
                    {/* Export to Google Drive still works from the dashboard */}
                    {/* Uncomment below to re-enable when Google Cloud Console is properly configured */}
                    {/*
                    <div className="relative">
                      <GoogleDrivePicker
                        onFileSelect={handleGoogleDriveSelect}
                        acceptedMimeTypes={['application/pdf']}
                        multipleSelection={true}
                        buttonText="Import from Drive"
                        buttonVariant="outline"
                        disabled={disabled || isImportingFromDrive}
                      />
                      {isImportingFromDrive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    */}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-400 space-y-1 text-center">
                <p>Supported format: PDF</p>
                <p>Max file size: {formatFileSize(maxFileSize)}</p>
                <p>Max files: {maxFiles - uploadedFiles.length} remaining</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isImportingFromDrive ? 'Importing from Google Drive' : 'Uploading Files'}
              </h3>
              <span className="text-sm text-gray-500">
                {Object.keys(uploadProgress).length} file{Object.keys(uploadProgress).length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileId.split('-')[0]}
                    </p>
                    <Progress value={progress} className="h-2 mt-1" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                    {progress}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              {uploadedFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => uploadedFiles.forEach(file => removeFile(file.id))}
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        {file.isFromGoogleDrive && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z"/>
                            </svg>
                            Google Drive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.status || 'Ready'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'processing' && (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    )}
                    {file.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {file.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-medium text-red-900">Upload Errors</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={clearErrors}>
                Clear
              </Button>
            </div>
            <div className="space-y-2">
              {Object.entries(errors).map(([errorId, error]) => (
                <div key={errorId} className="text-sm text-red-700">
                  <span className="font-medium">{error.fileName}:</span> {error.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}