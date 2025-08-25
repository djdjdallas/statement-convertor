'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Building, 
  FileText, 
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function EnhancedDashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalFiles: 0,
    totalImports: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const [clientsRes, filesRes, importsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/files?summary=true'),
        fetch('/api/xero/imports?summary=true')
      ])

      if (clientsRes.ok) {
        const { clients } = await clientsRes.json()
        setStats(prev => ({ ...prev, totalClients: clients?.length || 0 }))
      }

      // Process other responses and update stats
      // Implementation details...
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Overview of your accounting firm's operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xero Imports</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImports}</div>
            <p className="text-xs text-muted-foreground">
              98.5% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23s</div>
            <p className="text-xs text-muted-foreground">
              Average per statement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest file processing and imports</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityList activities={stats.recentActivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/upload">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Upload Bank Statements
              </Button>
            </Link>
            <Link href="/clients">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Add New Client
              </Button>
            </Link>
            <Button className="w-full justify-start" variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Start Bulk Import
            </Button>
            <Link href="/settings/integrations">
              <Button className="w-full justify-start" variant="outline">
                <Building className="mr-2 h-4 w-4" />
                Connect Xero Organization
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        isOpen={showBulkImport}
        onClose={() => {
          setShowBulkImport(false)
          loadDashboardData() // Refresh data after closing
        }}
        availableFiles={availableFiles}
      />
    </div>
  )
}

function RecentActivityList({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center gap-3 p-2 rounded-lg border">
          <div className="flex-shrink-0">
            {activity.type === 'import_success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {activity.type === 'import_failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
            {activity.type === 'file_uploaded' && <FileText className="h-4 w-4 text-blue-500" />}
            {activity.type === 'client_added' && <Users className="h-4 w-4 text-purple-500" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-gray-500">{activity.description}</p>
          </div>
          <div className="text-xs text-gray-400">
            {activity.timestamp}
          </div>
        </div>
      ))}
    </div>
  )
}