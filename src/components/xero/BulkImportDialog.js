'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { 
  Zap, 
  FileText, 
  Building, 
  Users,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'

export default function BulkImportDialog({ isOpen, onClose, availableFiles = [] }) {
  const [step, setStep] = useState(1) // 1: Select files, 2: Configure, 3: Processing
  const [selectedFiles, setSelectedFiles] = useState([])
  const [jobConfig, setJobConfig] = useState({
    name: '',
    description: '',
    clientId: 'none',
    tenantId: '',
    bankAccountId: ''
  })
  const [loading, setLoading] = useState(false)
  const [connections, setConnections] = useState([])
  const [clients, setClients] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [bulkJob, setBulkJob] = useState(null)
  const [jobProgress, setJobProgress] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen])

  // Poll for job status when in processing step
  useEffect(() => {
    if (step === 3 && bulkJob?.id) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/xero/bulk-import?jobId=${bulkJob.id}`)
          if (response.ok) {
            const { job } = await response.json()
            setJobProgress(job.progress)
            
            // Check if any files failed due to token expiration
            if (job.bulk_import_files) {
              const tokenExpiredFiles = job.bulk_import_files.filter(
                f => f.error_message?.includes('Xero session expired') || 
                    f.error_message?.includes('Refresh token has expired')
              )
              
              if (tokenExpiredFiles.length > 0) {
                clearInterval(pollInterval)
                toast({
                  title: 'Xero Session Expired',
                  description: 'Your Xero session expired during the import. Please reconnect your Xero account and retry.',
                  variant: 'destructive',
                  action: (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = '/settings?tab=integrations'}
                    >
                      Go to Settings
                    </Button>
                  )
                })
              }
            }
            
            // Stop polling if job is complete
            if (job.status === 'completed' || job.status === 'failed') {
              clearInterval(pollInterval)
            }
          }
        } catch (error) {
          console.error('Failed to fetch job status:', error)
        }
      }, 2000) // Poll every 2 seconds

      return () => clearInterval(pollInterval)
    }
  }, [step, bulkJob])

  const fetchInitialData = async () => {
    try {
      // Fetch connections and clients
      const [connectionsRes, clientsRes] = await Promise.all([
        fetch('/api/xero/connections'),
        fetch('/api/clients')
      ])

      if (connectionsRes.ok) {
        const { connections: conns } = await connectionsRes.json()
        setConnections(conns.filter(c => c.is_active))
      }

      if (clientsRes.ok) {
        const { clients: cls } = await clientsRes.json()
        setClients(cls)
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    }
  }

  const handleFileToggle = (fileId, checked) => {
    setSelectedFiles(prev => 
      checked 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    )
  }

  const handleTenantSelect = async (tenantId) => {
    setJobConfig(prev => ({ ...prev, tenantId, bankAccountId: '' }))
    setBankAccounts([]) // Clear previous accounts
    
    // Fetch bank accounts for selected tenant
    try {
      console.log('Fetching bank accounts for tenant:', tenantId)
      const response = await fetch(`/api/xero/accounts?tenantId=${tenantId}&type=BANK`)
      
      if (response.ok) {
        const { accounts } = await response.json()
        console.log('Bank accounts received:', accounts)
        setBankAccounts(accounts || [])
      } else {
        const error = await response.json()
        console.error('Failed to fetch bank accounts:', error)
        
        // Check if it's a token expiration error
        if (error.code === 'XERO_TOKEN_EXPIRED' || error.requiresReconnect) {
          toast({
            title: 'Xero Session Expired',
            description: 'Your Xero session has expired. Please reconnect your Xero account in Settings.',
            variant: 'destructive',
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/settings?tab=integrations'}
              >
                Go to Settings
              </Button>
            )
          })
        } else {
          toast({
            title: 'Error',
            description: error.error || 'Failed to fetch bank accounts',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch bank accounts from Xero',
        variant: 'destructive'
      })
    }
  }

  const startBulkImport = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/xero/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobConfig,
          fileIds: selectedFiles
        })
      })

      if (response.ok) {
        const job = await response.json()
        setBulkJob(job)
        setStep(3)
      }
    } catch (error) {
      console.error('Failed to start bulk import:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Select Files to Import</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3 p-2 border rounded">
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={(checked) => handleFileToggle(file.id, checked)}
                    />
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.original_filename}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.created_at).toLocaleDateString()}
                        {file.client_name && ` • ${file.client_name}`}
                      </p>
                    </div>
                    {file.has_xero_import && (
                      <Badge variant="outline">Already imported</Badge>
                    )}
                  </div>
                ))}
              </div>
              
              {availableFiles.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No files available for bulk import. Upload some bank statements first.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  {selectedFiles.length} of {availableFiles.length} files selected
                </p>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedFiles(availableFiles.map(f => f.id))}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)} 
                disabled={selectedFiles.length === 0}
              >
                Next: Configure Import
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Job Name</label>
                <Input
                  value={jobConfig.name}
                  onChange={(e) => setJobConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Q1 2024 Bank Statements"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Client (Optional)</label>
                <Select 
                  value={jobConfig.clientId} 
                  onValueChange={(value) => setJobConfig(prev => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {client.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Description</label>
              <Textarea
                value={jobConfig.description}
                onChange={(e) => setJobConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this bulk import..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Xero Organization</label>
                <Select 
                  value={jobConfig.tenantId} 
                  onValueChange={handleTenantSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.tenant_id} value={conn.tenant_id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {conn.tenant_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Bank Account</label>
                <Select 
                  value={jobConfig.bankAccountId} 
                  onValueChange={(value) => setJobConfig(prev => ({ ...prev, bankAccountId: value }))}
                  disabled={!jobConfig.tenantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.accountID} value={account.accountID}>
                        {account.name} ({account.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedFiles.length} files</strong> will be processed with AI-powered categorization.
                Each file will be imported as a separate batch to maintain traceability.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={startBulkImport} 
                disabled={loading || !jobConfig.name || !jobConfig.tenantId || !jobConfig.bankAccountId}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Bulk Import
              </Button>
            </div>
          </div>
        )

      case 3:
        const progress = jobProgress || { 
          total: selectedFiles.length, 
          processed: 0, 
          successful: 0, 
          failed: 0, 
          percentComplete: 0 
        }
        
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              {progress.percentComplete === 100 ? (
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              ) : (
                <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              )}
              <h4 className="font-medium mb-2">
                {progress.percentComplete === 100 ? 'Bulk Import Completed' : 'Bulk Import Processing'}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Your bulk import job "{jobConfig.name}" is {
                  progress.percentComplete === 100 ? 'complete' : 'processing in the background'
                }.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Processing Progress</span>
                  <span className="text-sm text-gray-600">
                    {progress.processed} of {progress.total} files
                  </span>
                </div>
                <Progress value={progress.percentComplete} className="mb-2" />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>{progress.successful} successful</span>
                  {progress.failed > 0 && (
                    <span className="text-red-600">{progress.failed} failed</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {progress.percentComplete < 100 
                    ? "Processing files... This may take a few minutes."
                    : "All files have been processed."
                  }
                </p>
              </div>
              
              <p className="text-xs text-gray-500">
                {progress.percentComplete < 100 
                  ? "You can close this dialog and continue working. Check the Bulk Import dashboard for updates."
                  : "View the imported transactions in Xero to verify the results."
                }
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Bulk Export to Xero
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3: {
              step === 1 ? 'Select Files' :
              step === 2 ? 'Configure Import' :
              'Processing Started'
            }
          </DialogDescription>
        </DialogHeader>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  )
}