'use client'

import { AlertTriangle, FileText, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Reusable delete confirmation modal component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onConfirm - Callback when delete is confirmed
 * @param {string} props.title - Modal title (default: "Delete File")
 * @param {string} props.description - Modal description
 * @param {string} props.itemName - Name of the item being deleted
 * @param {Object} props.itemDetails - Additional details about the item
 * @param {number} props.itemCount - Number of items being deleted (for batch operations)
 * @param {boolean} props.isDeleting - Whether deletion is in progress
 * @param {string} props.confirmButtonText - Text for confirm button (default: "Delete")
 * @param {string} props.cancelButtonText - Text for cancel button (default: "Cancel")
 * @param {string} props.variant - Visual variant (default, danger, warning)
 * @param {boolean} props.showWarning - Whether to show warning alert
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete File',
  description,
  itemName,
  itemDetails = {},
  itemCount = 1,
  isDeleting = false,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  variant = 'danger',
  showWarning = true
}) {
  const handleClose = () => {
    if (!isDeleting) {
      onClose()
    }
  }

  const handleConfirm = async () => {
    await onConfirm()
  }

  // Format file size if provided
  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Format date if provided
  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === 'danger' ? (
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
            ) : (
              <div className="rounded-full bg-yellow-100 p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            )}
            <DialogTitle className="text-xl">
              {itemCount > 1
                ? `${title} (${itemCount} items)`
                : title}
            </DialogTitle>
          </div>

          <DialogDescription className="mt-3 text-sm text-gray-600">
            {description || (
              itemCount > 1
                ? `Are you sure you want to delete these ${itemCount} files? This action cannot be undone.`
                : `Are you sure you want to delete this file? This action cannot be undone.`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {/* Item name display */}
          {itemName && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {itemName}
                  </p>

                  {/* Additional details */}
                  {(itemDetails.size || itemDetails.date || itemDetails.type) && (
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      {itemDetails.size && (
                        <span>Size: {formatFileSize(itemDetails.size)}</span>
                      )}
                      {itemDetails.type && (
                        <span>Type: {itemDetails.type}</span>
                      )}
                      {itemDetails.date && (
                        <span>Modified: {formatDate(itemDetails.date)}</span>
                      )}
                    </div>
                  )}

                  {/* Transaction count or other metadata */}
                  {itemDetails.transactionCount && (
                    <p className="mt-1 text-xs text-gray-500">
                      Contains {itemDetails.transactionCount} transactions
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning alert */}
          {showWarning && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800">
                <strong>Warning:</strong> This action is permanent and cannot be undone.
                {itemDetails.hasExports && (
                  <span> All exported data will also be deleted.</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="sm:flex sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {cancelButtonText}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`w-full sm:w-auto ${getVariantStyles()}`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {confirmButtonText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}