'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function SyncProgressModal({ jobId, fileName, onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchStatus = useCallback(async () => {
    try {
      const token = await user.getSession();
      const response = await fetch(`/api/quickbooks/sync/status?jobId=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.job);
        setLoading(false);

        // Stop polling if job is complete
        if (['completed', 'failed', 'partial'].includes(data.job.status)) {
          return true; // Signal to stop polling
        }
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
    return false; // Continue polling
  }, [jobId, user]);

  useEffect(() => {
    let interval;
    let stopPolling = false;

    const pollStatus = async () => {
      const shouldStop = await fetchStatus();
      if (shouldStop) {
        stopPolling = true;
        if (interval) clearInterval(interval);
      }
    };

    // Initial fetch
    pollStatus();

    // Poll every 2 seconds if not stopped
    interval = setInterval(() => {
      if (!stopPolling) {
        pollStatus();
      }
    }, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchStatus]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/sync/retry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        toast({
          title: 'Retry Started',
          description: 'Retrying failed transactions',
        });
        // Reset status and start polling again
        setLoading(true);
        fetchStatus();
      } else {
        throw new Error('Failed to retry');
      }
    } catch (error) {
      console.error('Error retrying sync:', error);
      toast({
        title: 'Retry Failed',
        description: 'Failed to retry transactions',
        variant: 'destructive',
      });
    } finally {
      setRetrying(false);
    }
  };

  if (loading && !status) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Syncing to QuickBooks</DialogTitle>
            <DialogDescription>
              Please wait while we sync your transactions...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'failed':
        return <XCircle className="h-12 w-12 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="h-12 w-12 text-yellow-600" />;
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (status?.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  const getStatusMessage = () => {
    if (status?.status === 'completed') {
      return 'All transactions synced successfully!';
    } else if (status?.status === 'failed') {
      return 'Sync failed. Please review the errors below.';
    } else if (status?.status === 'partial') {
      return 'Some transactions failed to sync. You can retry the failed ones.';
    } else {
      return 'Syncing transactions to QuickBooks...';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {fileName || 'QuickBooks Sync'}
          </DialogTitle>
          <DialogDescription>
            {getStatusMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center py-4">
            {getStatusIcon()}
          </div>

          {/* Progress Bar */}
          {status && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-2" />
            </div>
          )}

          {/* Statistics Grid */}
          {status && (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {status.total_transactions}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {status.synced_transactions}
                </div>
                <div className="text-xs text-green-700">Synced</div>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {status.failed_transactions}
                </div>
                <div className="text-xs text-red-700">Failed</div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {status.skipped_transactions}
                </div>
                <div className="text-xs text-yellow-700">Skipped</div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {status && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Sync Status</span>
              {getStatusBadge()}
            </div>
          )}

          {/* Error Messages */}
          {status && status.error_log && status.error_log.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Errors occurred during sync:</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {status.error_log.slice(0, 5).map((error, i) => (
                    <li key={i}>{error.error || error.errors?.[0] || 'Unknown error'}</li>
                  ))}
                  {status.error_log.length > 5 && (
                    <li className="text-gray-500">
                      ...and {status.error_log.length - 5} more
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {status && status.failed_transactions > 0 && (
              <Button
                onClick={handleRetry}
                disabled={retrying || status.status === 'processing'}
                variant="outline"
              >
                {retrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Failed
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={onClose}
              disabled={status?.status === 'processing'}
            >
              {status?.status === 'processing' ? 'Syncing...' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
