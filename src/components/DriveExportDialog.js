'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertCircle, ExternalLink, CloudUpload } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

export default function DriveExportDialog({ 
  isOpen, 
  onClose, 
  fileId, 
  onExportComplete,
  fileName = 'Statement'
}) {
  const { user } = useAuth()
  const [format, setFormat] = useState('xlsx')
  const [destination, setDestination] = useState('local')
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState(null)
  const [error, setError] = useState(null)
  const [hasGoogle, setHasGoogle] = useState(false)
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true)
  const [exportProgress, setExportProgress] = useState(0)

  // Check Google integration status when dialog opens
  useEffect(() => {
    const checkGoogle = async () => {
      if (user && isOpen) {
        setIsCheckingGoogle(true)
        try {
          const response = await fetch('/api/auth/google/link')
          if (response.ok) {
            const data = await response.json()
            setHasGoogle(data.linked)
          } else {
            setHasGoogle(false)
          }
        } catch (err) {
          console.error('Error checking Google integration:', err)
          setHasGoogle(false)
        } finally {
          setIsCheckingGoogle(false)
        }
      }
    }
    checkGoogle()
  }, [user, isOpen])

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setExportResult(null)
    setExportProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          format,
          destination
        }),
      })

      if (destination === 'local') {
        // Handle local download
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${fileName}_transactions.${format}`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          
          clearInterval(progressInterval)
          setExportProgress(100)
          setExportResult({ type: 'local', success: true })
          toast({
            title: 'Export Successful',
            description: `Your ${format.toUpperCase()} file has been downloaded.`,
            variant: 'success'
          })
          if (onExportComplete) {
            onExportComplete({ format, destination: 'local' })
          }
        } else {
          clearInterval(progressInterval)
          const errorData = await response.json()
          throw new Error(errorData.error || 'Export failed')
        }
      } else {
        // Handle Google Drive upload
        const data = await response.json()
        if (response.ok && data.success) {
          clearInterval(progressInterval)
          setExportProgress(100)
          setExportResult({
            type: 'drive',
            success: true,
            data: data.data
          })
          toast({
            title: 'Upload Successful',
            description: 'Your file has been uploaded to Google Drive.',
            variant: 'success'
          })
          if (onExportComplete) {
            onExportComplete({ format, destination: 'drive', driveData: data.data })
          }
        } else {
          clearInterval(progressInterval)
          throw new Error(data.error || 'Failed to upload to Google Drive')
        }
      }
    } catch (err) {
      console.error('Export error:', err)
      setError(err.message)
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleDestinationChange = (newDestination) => {
    setDestination(newDestination)
    // Default to Google Sheets when switching to Drive
    if (newDestination === 'drive' && format !== 'sheets') {
      setFormat('sheets')
    }
    // Switch back to xlsx when going to local
    if (newDestination === 'local' && format === 'sheets') {
      setFormat('xlsx')
    }
  }

  const handleClose = () => {
    setExportResult(null)
    setError(null)
    setExportProgress(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>
            Choose your export format and destination
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="cursor-pointer">
                  Excel (.xlsx) - Includes summary sheet
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="cursor-pointer">
                  CSV (.csv) - Simple comma-separated format
                </Label>
              </div>
              {destination === 'drive' && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sheets" id="sheets" />
                  <Label htmlFor="sheets" className="cursor-pointer">
                    Google Sheets - Interactive spreadsheet with AI insights & charts
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Destination Selection */}
          <div className="space-y-3">
            <Label>Save Location</Label>
            <RadioGroup value={destination} onValueChange={handleDestinationChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="cursor-pointer">
                  Download to Computer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="drive" 
                  id="drive" 
                  disabled={!hasGoogle || isCheckingGoogle}
                />
                <Label 
                  htmlFor="drive" 
                  className={`cursor-pointer ${!hasGoogle ? 'text-muted-foreground' : ''}`}
                >
                  {isCheckingGoogle ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking Google Drive connection...
                    </span>
                  ) : (
                    <>
                      Save to Google Drive
                      {!hasGoogle && ' (Connect Google account first)'}
                    </>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {exportResult && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {exportResult.type === 'local' ? (
                  'File downloaded successfully!'
                ) : (
                  <div className="space-y-2">
                    <p>File uploaded to Google Drive!</p>
                    <a
                      href={exportResult.data.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    >
                      Open in Google Drive
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {exportResult ? 'Close' : 'Cancel'}
          </Button>
          {!exportResult && (
            <Button 
              onClick={handleExport} 
              disabled={isExporting || (!hasGoogle && destination === 'drive')}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {destination === 'drive' ? 'Uploading' : 'Exporting'}... {exportProgress > 0 && `${exportProgress}%`}
                </>
              ) : (
                <>
                  {destination === 'drive' ? (
                    <>
                      <CloudUpload className="mr-2 h-4 w-4" />
                      Upload to Drive
                    </>
                  ) : (
                    'Export'
                  )}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}