'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  X,
  Loader2
} from 'lucide-react'
import { getMaxFileSize } from '@/lib/subscription-tiers'

export default function FileUploader({ 
  onFileUpload, 
  onFileRemove, 
  uploadedFiles = [],
  maxFiles = 5,
  userTier = 'free',
  disabled = false 
}) {
  const [uploadProgress, setUploadProgress] = useState({})
  const [errors, setErrors] = useState({})

  const maxFileSize = getMaxFileSize(userTier)

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
        setErrors(prev => ({
          ...prev,
          [fileId]: {
            fileName: file.name,
            message: error.message || 'Upload failed. Please try again.'
          }
        }))
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
                  <Button variant="outline" disabled={disabled}>
                    Choose Files
                  </Button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uploading Files</h3>
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
                  <span className="text-sm text-gray-500 flex-shrink-0">
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
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
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