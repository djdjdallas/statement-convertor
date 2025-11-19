'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function SyncHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/sync/history', {
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching sync history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sync history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sync History
            </CardTitle>
            <CardDescription>
              View your recent QuickBooks sync jobs
            </CardDescription>
          </div>
          <Button
            onClick={fetchHistory}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No sync history yet</p>
            <p className="text-sm">Sync a file to see its history here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((job) => (
              <div
                key={job.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium truncate">
                        {job.files?.filename || 'Unknown File'}
                      </span>
                      {getStatusBadge(job.status)}
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-lg font-semibold">{job.total_transactions}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Synced</div>
                        <div className="text-lg font-semibold text-green-600">
                          {job.synced_transactions}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Failed</div>
                        <div className="text-lg font-semibold text-red-600">
                          {job.failed_transactions}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Skipped</div>
                        <div className="text-lg font-semibold text-yellow-600">
                          {job.skipped_transactions}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(job.started_at).toLocaleString()}
                      {job.completed_at && (
                        <> • Took {Math.round((new Date(job.completed_at) - new Date(job.started_at)) / 1000)}s</>
                      )}
                    </div>
                  </div>
                </div>

                {job.error_log && job.error_log.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="font-medium mb-1">Errors:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {job.error_log.slice(0, 2).map((error, i) => (
                        <li key={i}>{error.error || 'Unknown error'}</li>
                      ))}
                      {job.error_log.length > 2 && (
                        <li>...and {job.error_log.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
