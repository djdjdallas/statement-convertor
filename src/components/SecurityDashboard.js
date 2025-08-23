'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Shield, Activity, Clock, Lock, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function SecurityDashboard({ userId }) {
  const [loading, setLoading] = useState(true)
  const [securityData, setSecurityData] = useState({
    summary: {},
    recentEvents: [],
    incidents: [],
    trends: {},
    tokenHealth: {}
  })

  useEffect(() => {
    fetchSecurityData()
    const interval = setInterval(fetchSecurityData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [userId])

  const fetchSecurityData = async () => {
    try {
      const [auditLogs, tokenHealth, trends] = await Promise.all([
        fetch(`/api/security/audit-logs?userId=${userId}&limit=10`).then(r => r.json()),
        fetch(`/api/auth/token-health`).then(r => r.json()),
        fetch(`/api/security/trends?timeRange=24h`).then(r => r.json())
      ])

      setSecurityData({
        summary: trends.summary || {},
        recentEvents: auditLogs.data || [],
        incidents: trends.incidents || [],
        trends: trends,
        tokenHealth: tokenHealth
      })
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900'
    }
    return colors[severity] || colors.info
  }

  const getEventIcon = (eventType) => {
    if (eventType.startsWith('auth.')) return <Lock className="h-4 w-4" />
    if (eventType.startsWith('file.')) return <FileText className="h-4 w-4" />
    if (eventType.startsWith('security.')) return <Shield className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityData.summary.suspicious_activities === 0 ? 'Secure' : 'Alert'}
            </div>
            <p className="text-xs text-muted-foreground">
              {securityData.summary.suspicious_activities || 0} suspicious activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Auth</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityData.summary.failed_auth_attempts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((securityData.trends.api_usage?.current || 0) / 
                (securityData.trends.api_usage?.limit || 1000) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of daily limit used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Health</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={
                securityData.tokenHealth.status === 'healthy' ? 'default' :
                securityData.tokenHealth.status === 'expiring_soon' ? 'warning' :
                'destructive'
              }>
                {securityData.tokenHealth.status || 'Unknown'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {securityData.tokenHealth.message}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Incidents */}
      {securityData.incidents.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Security Incidents</AlertTitle>
          <AlertDescription>
            {securityData.incidents.length} active incident(s) require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Security Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Last 10 security-related activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {securityData.recentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent events</p>
                ) : (
                  securityData.recentEvents.map((event, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(event.event_type)}
                        <div>
                          <p className="text-sm font-medium">{event.event_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Activity Log</CardTitle>
              <CardDescription>
                Complete audit trail of your account activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-4">
                  <input
                    type="search"
                    placeholder="Search events..."
                    className="px-3 py-2 border rounded-md"
                  />
                  <select className="px-3 py-2 border rounded-md">
                    <option value="">All Events</option>
                    <option value="auth">Authentication</option>
                    <option value="file">File Operations</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div className="text-sm text-muted-foreground">
                  View detailed logs in the admin panel
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Permissions</CardTitle>
              <CardDescription>
                Manage your Google Workspace permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Google Drive Access</p>
                    <p className="text-sm text-muted-foreground">
                      Read and write files in your Google Drive
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Google Sheets</p>
                    <p className="text-sm text-muted-foreground">
                      Create and modify spreadsheets
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Profile Information</p>
                    <p className="text-sm text-muted-foreground">
                      View your email address and profile info
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>
            Steps to improve your account security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm">Enable two-factor authentication</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm">Review connected applications regularly</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm">Use strong, unique passwords</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}