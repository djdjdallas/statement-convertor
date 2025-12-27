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
  Eye,
  ChevronDown
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import posthog from 'posthog-js'
import Link from 'next/link'

// Number of transactions to show in preview
const PREVIEW_LIMIT = 5

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

  // Get preview transactions from file prop
  const previewTransactions = file?.previewTransactions || []
  const displayedTransactions = previewTransactions.slice(0, PREVIEW_LIMIT)
  const remainingCount = (file?.transactionCount || 0) - displayedTransactions.length

  // Format currency amount with color
  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount)
    const isPositive = numAmount >= 0
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(numAmount))

    return {
      value: isPositive ? `+${formatted}` : `-${formatted}`,
      className: isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
    }
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Truncate long descriptions
  const truncateDescription = (desc, maxLength = 35) => {
    if (!desc) return '-'
    return desc.length > maxLength ? desc.substring(0, maxLength) + '...' : desc
  }

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="text-center pb-2 flex-shrink-0">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            Extracted {file.transactionCount} transactions from {file.name}
          </DialogTitle>
          {file.bankType && file.bankType !== 'generic' && (
            <div className="flex justify-center mt-1">
              <Badge variant="outline" className="text-xs">
                {file.bankType}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {/* Transaction Preview Table */}
          {displayedTransactions.length > 0 && (
            <div className="border rounded-lg overflow-hidden flex-shrink-0">
              <div className="bg-gray-50 px-3 py-2 border-b">
                <p className="text-sm font-medium text-gray-700">Preview of extracted transactions</p>
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Description</th>
                      <th className="px-3 py-2 font-medium text-right">Amount</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedTransactions.map((tx, index) => {
                      const amount = formatAmount(tx.amount)
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-3 py-2 text-gray-900" title={tx.description}>
                            {truncateDescription(tx.normalizedMerchant || tx.description)}
                          </td>
                          <td className={`px-3 py-2 text-right whitespace-nowrap ${amount.className}`}>
                            {amount.value}
                          </td>
                          <td className="px-3 py-2">
                            {tx.category ? (
                              <Badge variant="secondary" className="text-xs font-normal">
                                {tx.category}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {remainingCount > 0 && (
                <Link href={`/preview/${file.id}`} onClick={handleViewDetails}>
                  <div className="px-3 py-2 bg-gray-50 border-t text-center hover:bg-gray-100 transition-colors cursor-pointer">
                    <span className="text-sm text-blue-600 font-medium flex items-center justify-center gap-1">
                      <ChevronDown className="h-4 w-4" />
                      {remainingCount} more transactions...
                    </span>
                  </div>
                </Link>
              )}
            </div>
          )}
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
