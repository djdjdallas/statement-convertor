/**
 * Admin Analytics Dashboard
 *
 * Displays comprehensive analytics metrics including:
 * - Daily active users
 * - Top pages by traffic
 * - Traffic sources breakdown
 * - Custom event statistics
 * - Real-time active users
 * - Conversion funnel
 *
 * Only accessible to admin users.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Users,
  Eye,
  TrendingUp,
  Download,
  Activity,
  Globe,
  MousePointerClick,
  Zap,
  RefreshCw,
} from 'lucide-react'

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // 7, 30, or 90 days
  const [dailyUsers, setDailyUsers] = useState([])
  const [topPages, setTopPages] = useState([])
  const [trafficSources, setTrafficSources] = useState([])
  const [eventStats, setEventStats] = useState([])
  const [realtimeUsers, setRealtimeUsers] = useState(0)
  const [conversionFunnel, setConversionFunnel] = useState([])
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    avgPagesPerVisitor: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    loadAnalyticsData()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadRealtimeUsers()
    }, 30000)

    return () => clearInterval(interval)
  }, [dateRange])

  /**
   * Load all analytics data based on selected date range
   */
  async function loadAnalyticsData() {
    setLoading(true)

    try {
      // Calculate date range
      const endDate = new Date().toISOString()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))
      const startDateStr = startDate.toISOString()

      // Load all analytics data in parallel
      await Promise.all([
        loadDailyActiveUsers(startDateStr, endDate),
        loadTopPages(startDateStr, endDate),
        loadTrafficSources(startDateStr, endDate),
        loadEventStats(startDateStr, endDate),
        loadRealtimeUsers(),
        loadConversionFunnel(startDateStr, endDate),
        loadSummaryMetrics(startDateStr, endDate),
      ])
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load daily active users using RPC function
   */
  async function loadDailyActiveUsers(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_daily_active_users', {
      start_date: startDate,
      end_date: endDate,
    })

    if (error) {
      console.error('Error loading daily users:', error)
      return
    }

    // Format for chart (reverse to show oldest first)
    const formatted = data.reverse().map((row) => ({
      date: new Date(row.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      visitors: row.unique_visitors,
      users: row.unique_users,
      views: row.total_page_views,
    }))

    setDailyUsers(formatted)
  }

  /**
   * Load top pages by views
   */
  async function loadTopPages(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_top_pages', {
      start_date: startDate,
      end_date: endDate,
      limit_count: 10,
    })

    if (error) {
      console.error('Error loading top pages:', error)
      return
    }

    setTopPages(data)
  }

  /**
   * Load traffic sources
   */
  async function loadTrafficSources(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_traffic_sources', {
      start_date: startDate,
      end_date: endDate,
    })

    if (error) {
      console.error('Error loading traffic sources:', error)
      return
    }

    // Format for pie chart
    const formatted = data.map((row) => ({
      name: row.source_name,
      value: row.visitors,
      type: row.source_type,
      percentage: row.percentage,
    }))

    setTrafficSources(formatted)
  }

  /**
   * Load event statistics
   */
  async function loadEventStats(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_event_stats', {
      start_date: startDate,
      end_date: endDate,
    })

    if (error) {
      console.error('Error loading event stats:', error)
      return
    }

    setEventStats(data)
  }

  /**
   * Load real-time active users (last 5 minutes)
   */
  async function loadRealtimeUsers() {
    const { data, error } = await supabase.rpc('get_realtime_active_users')

    if (error) {
      console.error('Error loading realtime users:', error)
      return
    }

    if (data && data.length > 0) {
      setRealtimeUsers(data[0].active_users || 0)
    }
  }

  /**
   * Load conversion funnel data
   */
  async function loadConversionFunnel(startDate, endDate) {
    const { data, error } = await supabase.rpc('get_conversion_funnel', {
      start_date: startDate,
      end_date: endDate,
    })

    if (error) {
      console.error('Error loading conversion funnel:', error)
      return
    }

    setConversionFunnel(data)
  }

  /**
   * Load summary metrics (total views, unique visitors, etc.)
   */
  async function loadSummaryMetrics(startDate, endDate) {
    // Query page views for summary stats
    const { data, error } = await supabase
      .from('page_views')
      .select('visitor_id', { count: 'exact' })
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) {
      console.error('Error loading summary metrics:', error)
      return
    }

    const totalViews = data?.length || 0

    // Count unique visitors
    const uniqueVisitors = new Set(data?.map((v) => v.visitor_id) || []).size

    // Calculate average pages per visitor
    const avgPagesPerVisitor = uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(2) : 0

    setSummaryMetrics({
      totalViews,
      uniqueVisitors,
      avgPagesPerVisitor,
    })
  }

  /**
   * Export analytics data to CSV
   */
  function exportToCSV() {
    try {
      // Combine all data for export
      const csvData = []

      // Add daily users
      csvData.push('Daily Active Users')
      csvData.push('Date,Visitors,Users,Views')
      dailyUsers.forEach((row) => {
        csvData.push(`${row.date},${row.visitors},${row.users},${row.views}`)
      })

      csvData.push('') // Blank line

      // Add top pages
      csvData.push('Top Pages')
      csvData.push('Page,Views,Unique Visitors,Avg Duration (s)')
      topPages.forEach((row) => {
        csvData.push(`${row.page_path},${row.page_views},${row.unique_visitors},${row.avg_duration}`)
      })

      csvData.push('')

      // Add traffic sources
      csvData.push('Traffic Sources')
      csvData.push('Source,Type,Visitors,Page Views,Percentage')
      trafficSources.forEach((row) => {
        csvData.push(`${row.name},${row.type},${row.value},${row.percentage}%`)
      })

      // Create and download CSV file
      const csvContent = csvData.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `analytics_${dateRange}days_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track user behavior, traffic sources, and conversion metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tracked by visitor ID</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Pages/Visitor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.avgPagesPerVisitor}</div>
            <p className="text-xs text-muted-foreground">Engagement metric</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeUsers}</div>
            <p className="text-xs text-muted-foreground">Last 5 minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Active Users</CardTitle>
              <CardDescription>
                Unique visitors and authenticated users per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyUsers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="#0088FE"
                    name="Unique Visitors"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#00C49F"
                    name="Authenticated Users"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Visited Pages</CardTitle>
              <CardDescription>Pages ranked by total page views</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="page_path" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="page_views" fill="#0088FE" name="Page Views" />
                  <Bar dataKey="unique_visitors" fill="#00C49F" name="Unique Visitors" />
                </BarChart>
              </ResponsiveContainer>

              {/* Table view */}
              <div className="mt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Page</th>
                      <th className="text-right py-2">Views</th>
                      <th className="text-right py-2">Visitors</th>
                      <th className="text-right py-2">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((page, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 font-mono text-xs">{page.page_path}</td>
                        <td className="text-right">{page.page_views.toLocaleString()}</td>
                        <td className="text-right">{page.unique_visitors.toLocaleString()}</td>
                        <td className="text-right">{page.avg_duration}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Sources Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources Distribution</CardTitle>
                <CardDescription>Where visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trafficSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trafficSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Source Details</CardTitle>
                <CardDescription>Breakdown by source and type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trafficSources.map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-xs text-muted-foreground">{source.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{source.value}</div>
                        <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Events</CardTitle>
              <CardDescription>
                Track user interactions and feature usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No events tracked yet. Events will appear here as users interact with the app.
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Event Name</th>
                        <th className="text-right py-2">Count</th>
                        <th className="text-right py-2">Unique Users</th>
                        <th className="text-right py-2">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventStats.map((event, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{event.event_name}</span>
                            </div>
                          </td>
                          <td className="text-right">{event.event_count.toLocaleString()}</td>
                          <td className="text-right">{event.unique_users.toLocaleString()}</td>
                          <td className="text-right">
                            {event.total_value > 0 ? `$${event.total_value.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Track user journey from visitor to subscriber
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((step, idx) => {
                  const prevStep = idx > 0 ? conversionFunnel[idx - 1] : null
                  const dropoffRate = prevStep
                    ? ((1 - step.unique_users / prevStep.unique_users) * 100).toFixed(1)
                    : 0

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{step.step_order}</Badge>
                          <span className="font-medium">{step.step_name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {step.unique_users.toLocaleString()} users
                          </span>
                          <Badge>{step.conversion_rate}%</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-primary h-full flex items-center justify-end px-4 text-white text-sm font-medium transition-all"
                          style={{ width: `${step.conversion_rate}%` }}
                        >
                          {step.conversion_rate}%
                        </div>
                      </div>
                      {prevStep && dropoffRate > 0 && (
                        <p className="text-xs text-muted-foreground ml-12">
                          ↓ {dropoffRate}% drop-off from previous step
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
