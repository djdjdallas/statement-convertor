'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export default function TokenHealthIndicator({ workspaceId = null, showDetails = false }) {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkTokenHealth()
  }, [workspaceId])

  const checkTokenHealth = async () => {
    try {
      const params = new URLSearchParams()
      if (workspaceId) params.append('workspaceId', workspaceId)
      
      const response = await fetch(`/api/auth/token-health?${params}`)
      const data = await response.json()
      
      setHealth(data)
    } catch (error) {
      console.error('Error checking token health:', error)
      setHealth({
        status: 'error',
        message: 'Failed to check token status'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshToken = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/auth/token-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      })
      
      if (response.ok) {
        await checkTokenHealth()
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (!health) return null

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expiring_soon':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-600'
      case 'expiring_soon':
        return 'text-yellow-600'
      case 'expired':
        return 'text-red-600'
      case 'missing':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    switch (health.status) {
      case 'healthy':
        return 'Connected'
      case 'expiring_soon':
        return `Expires in ${health.minutes_until_expiry} min`
      case 'expired':
        return 'Token Expired'
      case 'missing':
        return 'Not Connected'
      default:
        return 'Unknown'
    }
  }

  if (!showDetails) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          Google Drive: {getStatusText()}
        </span>
        {health.status === 'expiring_soon' && !refreshing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={refreshToken}
            disabled={refreshing}
            className="h-6 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`font-medium ${getStatusColor()}`}>
            {health.message}
          </span>
        </div>
        {(health.status === 'expired' || health.status === 'expiring_soon') && 
         health.has_refresh_token && (
          <Button
            size="sm"
            onClick={refreshToken}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Token
              </>
            )}
          </Button>
        )}
      </div>

      {health.recommendations && health.recommendations.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Recommendations</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {health.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm">{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {showDetails && health.status === 'healthy' && (
        <div className="text-sm text-gray-600 space-y-1">
          <p>Token expires: {new Date(health.expires_at).toLocaleString()}</p>
          {health.last_refreshed_at && (
            <p>Last refreshed: {new Date(health.last_refreshed_at).toLocaleString()}</p>
          )}
          {health.refresh_count > 0 && (
            <p>Refresh count: {health.refresh_count}</p>
          )}
        </div>
      )}

      {health.status === 'missing' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Google Drive Not Connected</AlertTitle>
          <AlertDescription>
            Connect your Google account to export files directly to Google Drive and Sheets.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}