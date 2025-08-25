'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  Building, 
  FileText, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react'
import { ClientService } from '@/lib/clients/client-service'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientDashboard() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientFiles, setClientFiles] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadClients()
    }
  }, [user])

  const loadClients = async () => {
    try {
      const clientService = new ClientService()
      const data = await clientService.getClients(user.id)
      setClients(data)
    } catch (error) {
      console.error('Failed to load clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClientFiles = async (clientId) => {
    try {
      const clientService = new ClientService()
      const files = await clientService.getClientFiles(clientId, user.id)
      setClientFiles(files)
    } catch (error) {
      console.error('Failed to load client files:', error)
    }
  }

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    loadClientFiles(client.id)
  }

  const getClientStats = (client) => {
    const files = clientFiles.filter(f => f.client_id === client.id)
    const totalImports = files.reduce((sum, f) => sum + (f.xero_imports?.length || 0), 0)
    const lastActivity = files.length > 0 ? new Date(Math.max(...files.map(f => new Date(f.created_at)))) : null
    
    return {
      totalFiles: files.length,
      totalImports,
      lastActivity: lastActivity?.toLocaleDateString(),
      hasXeroConnection: client.client_xero_connections?.length > 0
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Clock className="h-6 w-6 animate-spin mr-2" />
          Loading clients...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Client Management
          </h1>
          <p className="text-gray-600">Manage your accounting firm's clients and their Xero integrations</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new client profile to organize their financial documents
              </DialogDescription>
            </DialogHeader>
            <CreateClientForm 
              userId={user?.id}
              onSuccess={() => {
                setShowCreateDialog(false)
                loadClients()
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Overview */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first client to start organizing their financial documents
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Client List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clients ({clients.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {clients.map((client) => {
                  const stats = getClientStats(client)
                  return (
                    <div
                      key={client.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedClient?.id === client.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{client.name}</h4>
                          <p className="text-xs text-gray-500">{client.industry || 'No industry set'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {stats.hasXeroConnection && (
                            <Badge variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              Xero
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{stats.totalFiles} files</span>
                        <span>{stats.totalImports} imports</span>
                        {stats.lastActivity && (
                          <span>Last: {stats.lastActivity}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <ClientDetailView 
                client={selectedClient} 
                files={clientFiles}
                onUpdate={loadClients}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a client</h3>
                  <p className="text-gray-600">
                    Choose a client from the list to view their details and manage their Xero integration
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CreateClientForm({ userId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessType: '',
    industry: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const clientService = new ClientService()
      await clientService.createClient(userId, formData)
      onSuccess()
    } catch (error) {
      console.error('Failed to create client:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Business Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter business name"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="contact@business.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Phone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Business Type</label>
          <Select value={formData.businessType} onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llc">LLC</SelectItem>
              <SelectItem value="corporation">Corporation</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
              <SelectItem value="nonprofit">Non-Profit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Industry</label>
          <Input
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            placeholder="e.g. Retail, Construction"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this client..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setFormData({
          name: '', email: '', phone: '', businessType: '', industry: '', notes: ''
        })}>
          Clear
        </Button>
        <Button type="submit" disabled={saving || !formData.name}>
          {saving ? 'Creating...' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}

function ClientDetailView({ client, files, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {client.name}
            </CardTitle>
            <CardDescription>
              {client.industry} • Created {new Date(client.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
            <TabsTrigger value="xero">Xero Integration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Information</label>
                <div className="mt-1">
                  {client.email && <p className="text-sm">{client.email}</p>}
                  {client.phone && <p className="text-sm">{client.phone}</p>}
                  {!client.email && !client.phone && (
                    <p className="text-sm text-gray-400">No contact info</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Business Details</label>
                <div className="mt-1">
                  {client.business_type && <p className="text-sm">{client.business_type}</p>}
                  {client.industry && <p className="text-sm">{client.industry}</p>}
                </div>
              </div>
            </div>
            
            {client.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{client.notes}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{files.length}</p>
                      <p className="text-xs text-gray-500">Files processed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {files.reduce((sum, f) => sum + (f.xero_imports?.length || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-500">Xero imports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {client.client_xero_connections?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500">Xero orgs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <ClientFilesList files={files} />
          </TabsContent>
          
          <TabsContent value="xero">
            <ClientXeroIntegration client={client} onUpdate={onUpdate} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ClientFilesList({ files }) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No files uploaded for this client yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-medium text-sm">{file.original_filename}</p>
              <p className="text-xs text-gray-500">
                {new Date(file.created_at).toLocaleDateString()} • {file.processing_status}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {file.xero_imports?.map((importRecord) => (
              <Badge key={importRecord.id} variant={
                importRecord.status === 'completed' ? 'default' : 
                importRecord.status === 'failed' ? 'destructive' : 'secondary'
              }>
                {importRecord.status}
              </Badge>
            ))}
            
            <Button variant="ghost" size="sm">
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ClientXeroIntegration({ client, onUpdate }) {
  return (
    <div className="space-y-4">
      {client.client_xero_connections?.length > 0 ? (
        <div className="space-y-3">
          {client.client_xero_connections.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium text-sm">{connection.tenant_name}</p>
                  <p className="text-xs text-gray-500">
                    Auto-import: {connection.auto_import_enabled ? 'Enabled' : 'Disabled'} • 
                    Last import: {connection.last_import_at ? new Date(connection.last_import_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">Connected</Badge>
                <Button variant="ghost" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No Xero integration set up for this client</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Connect Xero Organization
          </Button>
        </div>
      )}
    </div>
  )
}