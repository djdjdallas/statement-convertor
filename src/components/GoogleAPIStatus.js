'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { useGoogleQuotaCheck } from '@/hooks/useGoogleOperation';
import { useToast } from '@/hooks/use-toast';

export function GoogleAPIStatus({ userId }) {
  const [apiStatus, setApiStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const { quota, isChecking, checkQuota } = useGoogleQuotaCheck();
  const { toast } = useToast();

  useEffect(() => {
    checkAPIStatus();
    const interval = setInterval(checkAPIStatus, 300000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const checkAPIStatus = async () => {
    try {
      // Check Google API status
      const response = await fetch('/api/google/status');
      const data = await response.json();
      
      if (response.ok) {
        setApiStatus(data);
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error('Failed to check API status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const formatQuotaUsage = () => {
    if (!quota) return null;
    
    const usagePercent = parseFloat(quota.percentUsed);
    let variant = 'default';
    let message = '';
    
    if (usagePercent > 90) {
      variant = 'destructive';
      message = 'Critical: Storage almost full';
    } else if (usagePercent > 75) {
      variant = 'warning';
      message = 'Warning: Storage filling up';
    } else {
      variant = 'default';
      message = 'Storage usage normal';
    }
    
    return { usagePercent, variant, message };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Google API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const quotaInfo = formatQuotaUsage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Google API Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              checkAPIStatus();
              checkQuota();
            }}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Connection Status</span>
            <div className={`flex items-center gap-1 ${getStatusColor(apiStatus?.connectionStatus || 'unknown')}`}>
              {getStatusIcon(apiStatus?.connectionStatus || 'unknown')}
              <span className="capitalize">{apiStatus?.connectionStatus || 'Unknown'}</span>
            </div>
          </div>
          
          {apiStatus?.lastTokenRefresh && (
            <p className="text-xs text-muted-foreground">
              Token refreshed: {new Date(apiStatus.lastTokenRefresh).toLocaleString()}
            </p>
          )}
        </div>

        {/* Drive Storage */}
        {quota && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Drive Storage
              </span>
              <span className="text-xs text-muted-foreground">
                {quota.usageFormatted} / {quota.unlimited ? 'Unlimited' : quota.limitFormatted}
              </span>
            </div>
            
            {!quota.unlimited && quotaInfo && (
              <>
                <Progress value={quotaInfo.usagePercent} className="h-2" />
                <Badge variant={quotaInfo.variant} className="text-xs">
                  {quotaInfo.message} ({quotaInfo.usagePercent.toFixed(1)}%)
                </Badge>
              </>
            )}
          </div>
        )}

        {/* API Quota Usage */}
        {apiStatus?.quotaUsage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                API Quota
              </span>
              <span className="text-xs text-muted-foreground">
                {apiStatus.quotaUsage.used} / {apiStatus.quotaUsage.limit} requests
              </span>
            </div>
            
            <Progress 
              value={(apiStatus.quotaUsage.used / apiStatus.quotaUsage.limit) * 100} 
              className="h-2" 
            />
            
            {apiStatus.quotaUsage.resetTime && (
              <p className="text-xs text-muted-foreground">
                Resets: {new Date(apiStatus.quotaUsage.resetTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {apiStatus?.recentActivity && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="space-y-1">
              {apiStatus.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{activity.action}</span>
                  <span className={activity.success ? 'text-green-600' : 'text-red-600'}>
                    {activity.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Warnings */}
        {apiStatus?.warnings && apiStatus.warnings.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-sm space-y-1">
                {apiStatus.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Last Checked */}
        {lastChecked && (
          <p className="text-xs text-muted-foreground text-center">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Mini status indicator for use in headers/navigation
export function GoogleAPIStatusIndicator() {
  const [status, setStatus] = useState('unknown');
  const { quota } = useGoogleQuotaCheck();
  
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 300000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/google/status', { 
        method: 'GET',
        credentials: 'include' 
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.connectionStatus || 'unknown');
      }
    } catch (error) {
      setStatus('error');
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getTooltip = () => {
    switch (status) {
      case 'operational':
        return 'Google API: Operational';
      case 'degraded':
        return 'Google API: Degraded Performance';
      case 'error':
        return 'Google API: Connection Error';
      default:
        return 'Google API: Status Unknown';
    }
  };
  
  // Check for storage warnings
  const hasStorageWarning = quota && parseFloat(quota.percentUsed) > 75;
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className="relative group"
        title={getTooltip()}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        {hasStorageWarning && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        )}
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {getTooltip()}
          {hasStorageWarning && ' (Storage Warning)'}
        </div>
      </div>
    </div>
  );
}