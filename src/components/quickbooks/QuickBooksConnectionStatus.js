'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Building, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function QuickBooksConnectionStatus() {
  const router = useRouter();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConnectionStatus();
    }

    // Check for OAuth callback results
    const params = new URLSearchParams(window.location.search);
    if (params.get('qb_connected') === 'true') {
      toast({
        title: 'Success',
        description: 'Successfully connected to QuickBooks!',
      });
      // Refresh connection status
      fetchConnectionStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('qb_error')) {
      const errorType = params.get('qb_error');
      const errorMessages = {
        missing_parameters: 'Missing required parameters',
        invalid_state: 'Invalid authentication state',
      };
      toast({
        title: 'Connection Failed',
        description: errorMessages[errorType] || decodeURIComponent(params.get('qb_error')),
        variant: 'destructive',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, toast]);

  const fetchConnectionStatus = async () => {
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/status', {
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnection(data);
      } else {
        console.error('Failed to fetch connection status');
      }
    } catch (error) {
      console.error('Error fetching QuickBooks status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load QuickBooks connection status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateConnection = async () => {
    setConnecting(true);
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate connection');
      }
    } catch (error) {
      console.error('Failed to initiate QuickBooks connection:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect to QuickBooks. Please try again.',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const disconnectQuickBooks = async () => {
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from QuickBooks',
        });
        setConnection(null);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect QuickBooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect from QuickBooks',
        variant: 'destructive',
      });
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const token = await user.getSession();
      const response = await fetch('/api/quickbooks/status?test=true', {
        headers: {
          'Authorization': `Bearer ${token.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.testResult?.success) {
          toast({
            title: 'Connection Test Successful',
            description: `Connected to ${data.testResult.companyName}`,
          });
        } else {
          toast({
            title: 'Connection Test Failed',
            description: data.testResult?.error || 'Unable to connect to QuickBooks',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Failed to test QuickBooks connection',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-6 w-6" viewBox="0 0 32 32" fill="#2CA01C">
              <circle cx="16" cy="16" r="16" fill="#2CA01C"/>
              <path d="M22 11h-3V8h-6v3H10v10h3v3h6v-3h3V11zm-8 9h-2v-6h2v6zm6 0h-2v-6h2v6z" fill="white"/>
            </svg>
            QuickBooks Online Integration
          </CardTitle>
          <CardDescription>
            Sync your bank statement transactions to QuickBooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-6 w-6" viewBox="0 0 32 32" fill="#2CA01C">
            <circle cx="16" cy="16" r="16" fill="#2CA01C"/>
            <path d="M22 11h-3V8h-6v3H10v10h3v3h6v-3h3V11zm-8 9h-2v-6h2v6zm6 0h-2v-6h2v6z" fill="white"/>
          </svg>
          QuickBooks Online Integration
        </CardTitle>
        <CardDescription>
          Sync your bank statement transactions to QuickBooks automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection?.connected ? (
          <>
            {/* Connection Status */}
            <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-green-900">Connected to QuickBooks</h4>
                <div className="mt-2 space-y-1 text-sm text-green-800">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{connection.companyName}</span>
                  </div>
                  {connection.connectedAt && (
                    <p className="text-green-700">
                      Connected on {new Date(connection.connectedAt).toLocaleDateString()}
                    </p>
                  )}
                  {connection.lastSynced && (
                    <p className="text-green-700">
                      Last synced: {new Date(connection.lastSynced).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                Active
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/quickbooks')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectQuickBooks}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Disconnect
              </Button>
            </div>

            {/* Next Steps */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Next Steps:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Configure account mappings for transaction categories</li>
                    <li>Set up automatic sync preferences</li>
                    <li>Start syncing your bank statements to QuickBooks</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Not Connected */}
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Not Connected</h4>
              <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                Connect your QuickBooks Online account to automatically sync bank statement
                transactions with AI-powered categorization and merchant mapping.
              </p>
              <Button
                onClick={initiateConnection}
                disabled={connecting}
                className="bg-[#2CA01C] hover:bg-[#248517]"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect QuickBooks'
                )}
              </Button>
            </div>

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  AI-Powered Mapping
                </h5>
                <p className="text-sm text-gray-600">
                  Automatically map categories and merchants with 90%+ accuracy
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Bulk Sync
                </h5>
                <p className="text-sm text-gray-600">
                  Sync hundreds of transactions in seconds with smart batching
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Error Handling
                </h5>
                <p className="text-sm text-gray-600">
                  Automatic retry and detailed error reporting for failed transactions
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Secure & Reliable
                </h5>
                <p className="text-sm text-gray-600">
                  OAuth 2.0 security with automatic token refresh
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
