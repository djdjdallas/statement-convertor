'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Building,
  ExternalLink,
  Loader2,
  Eye
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import posthog from 'posthog-js'
import Link from 'next/link'

export default function ExportSuccessModal({
  isOpen,
  onClose,
  file,
  hasGoogleDrive = false,
  xeroConnections = [],
  userHasXeroAccess = false
}) {
  const [exporting, setExporting] = useState({ xlsx: false, csv: false })
  const [exportComplete, setExportComplete] = useState({ xlsx: false, csv: false })

  // Track modal view when it opens
  useEffect(() => {
    if (isOpen && file) {
      posthog.capture('export_modal_viewed', {
        file_id: file.id,
        file_name: file.name,
        transaction_count: file.transactionCount,
        bank_type: file.bankType,
        source: 'post_processing'
      })
    }
  }, [isOpen, file])

  const handleExport = async (format) => {
    if (!file?.id) return

    // Track button click
    posthog.capture('export_button_clicked', {
      file_id: file.id,
      export_type: format,
      transaction_count: file.transactionCount,
      source: 'export_success_modal'
    })

    setExporting(prev => ({ ...prev, [format]: true }))

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: file.id,
          format,
          destination: 'local'
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Export failed')
      }

      // Get filename from headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `${file.name?.replace('.pdf', '') || 'transactions'}.${format}`

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

      // Track successful export
      posthog.capture('export_completed', {
        file_id: file.id,
        export_type: format,
        transaction_count: file.transactionCount,
        source: 'export_success_modal'
      })

      setExportComplete(prev => ({ ...prev, [format]: true }))

      toast({
        title: 'Download Started',
        description: `Your ${format.toUpperCase()} file is downloading.`,
        variant: 'success'
      })

    } catch (error) {
      console.error('Export error:', error)

      // Track failed export
      posthog.capture('export_failed', {
        file_id: file.id,
        export_type: format,
        error_message: error.message,
        source: 'export_success_modal'
      })

      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export file. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }))
    }
  }

  const handleViewDetails = () => {
    posthog.capture('export_modal_view_details_clicked', {
      file_id: file?.id,
      transaction_count: file?.transactionCount
    })
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Statement Processed Successfully!
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            <span className="font-medium text-gray-900">{file.name}</span>
            <br />
            <span className="text-green-600 font-semibold">
              {file.transactionCount} transactions
            </span> extracted
            {file.bankType && file.bankType !== 'generic' && (
              <Badge variant="outline" className="ml-2 text-xs">
                {file.bankType}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Primary Export Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 text-center">
              Download your converted file:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleExport('xlsx')}
                disabled={exporting.xlsx}
                className="h-20 flex flex-col items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
              >
                {exporting.xlsx ? (
                  <Loader2 className="h-6 w-6 animate-spin mb-1" />
                ) : exportComplete.xlsx ? (
                  <CheckCircle className="h-6 w-6 mb-1" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6 mb-1" />
                )}
                <span className="font-medium">
                  {exporting.xlsx ? 'Downloading...' : exportComplete.xlsx ? 'Downloaded!' : 'Download Excel'}
                </span>
                <span className="text-xs opacity-80">.xlsx with summary</span>
              </Button>

              <Button
                onClick={() => handleExport('csv')}
                disabled={exporting.csv}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center border-2 hover:bg-gray-50"
              >
                {exporting.csv ? (
                  <Loader2 className="h-6 w-6 animate-spin mb-1 text-gray-600" />
                ) : exportComplete.csv ? (
                  <CheckCircle className="h-6 w-6 mb-1 text-green-600" />
                ) : (
                  <FileText className="h-6 w-6 mb-1 text-gray-600" />
                )}
                <span className="font-medium text-gray-700">
                  {exporting.csv ? 'Downloading...' : exportComplete.csv ? 'Downloaded!' : 'Download CSV'}
                </span>
                <span className="text-xs text-gray-500">Simple format</span>
              </Button>
            </div>
          </div>

          {/* Secondary Options */}
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-gray-700 text-center mb-3">
              Or export to:
            </p>

            <div className="space-y-2">
              {/* Google Drive Option */}
              {hasGoogleDrive ? (
                <Link href={`/preview/${file.id}`} onClick={handleViewDetails}>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 border-blue-200 hover:bg-blue-50"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z" fill="#4285F4"/>
                      <path d="M7.71 3.5h8.58L22.85 15H9.71z" fill="#34A853"/>
                      <path d="M1.15 15l6.56-11.5L14.27 15H1.15z" fill="#FBBC04"/>
                      <path d="M14.27 15l-6.56 7.5L1.15 15h13.12z" fill="#EA4335"/>
                    </svg>
                    <span className="flex-1 text-left">Export to Google Drive / Sheets</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 opacity-60"
                  disabled
                >
                  <svg className="w-5 h-5 mr-3 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.71 3.5L1.15 15l4.58 7.5h12.54l4.58-7.5L16.29 3.5z"/>
                  </svg>
                  <span className="flex-1 text-left text-gray-500">
                    Google Drive (Connect in Settings)
                  </span>
                </Button>
              )}

              {/* Xero Option */}
              {xeroConnections.length > 0 && userHasXeroAccess ? (
                <Link href={`/preview/${file.id}`} onClick={handleViewDetails}>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 border-green-200 hover:bg-green-50"
                  >
                    <Building className="h-5 w-5 mr-3 text-green-600" />
                    <span className="flex-1 text-left">Export to Xero</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Button>
                </Link>
              ) : xeroConnections.length > 0 ? (
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 opacity-60"
                  disabled
                >
                  <Building className="h-5 w-5 mr-3 text-gray-400" />
                  <span className="flex-1 text-left text-gray-500">
                    Export to Xero (Pro Plan)
                  </span>
                  <Badge variant="secondary" className="text-xs">Pro</Badge>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Link href={`/preview/${file.id}`} onClick={handleViewDetails}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All Transactions
            </Button>
          </Link>

          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
