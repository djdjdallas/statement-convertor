'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Building, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function XeroConnectionStatus() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConnections();
    
    // Check for OAuth callback results
    const params = new URLSearchParams(window.location.search);
    if (params.get('xero_success') === 'connected') {
      toast({
        title: 'Success',
        description: 'Successfully connected to Xero!',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('xero_error')) {
      const errorType = params.get('xero_error');
      const errorMessages = {
        missing_params: 'Missing required parameters',
        invalid_state: 'Invalid authentication state',
        callback_failed: 'Failed to complete Xero connection'
      };
      toast({
        title: 'Connection Failed',
        description: errorMessages[errorType] || 'Failed to connect to Xero',
        variant: 'destructive',
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/xero/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      } else {
        throw new Error('Failed to fetch connections');
      }
    } catch (error) {
      console.error('Failed to fetch Xero connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Xero connections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateConnection = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/xero/auth');
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        throw new Error('Failed to initiate connection');
      }
    } catch (error) {
      console.error('Failed to initiate Xero connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to Xero. Please try again.',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const disconnectTenant = async (tenantId, tenantName) => {
    try {
      const response = await fetch(`/api/xero/connections?tenantId=${tenantId}`, { 
        method: 'DELETE' 
      });
      
      if (response.ok) {
        toast({
          title: 'Disconnected',
          description: `Successfully disconnected from ${tenantName}`,
        });
        await fetchConnections();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect Xero tenant:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect from Xero',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading Xero connections...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Xero Integration
        </CardTitle>
        <CardDescription>
          Connect your Xero organizations to automatically import bank statement transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <div className="text-center py-6">
            <div className="mb-4">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No Xero connections found</p>
              <p className="text-sm text-gray-400 mt-1">
                Connect your Xero organization to start importing transactions
              </p>
            </div>
            <Button onClick={initiateConnection} disabled={connecting}>
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Xero Organization
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div 
                key={connection.tenant_id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {connection.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{connection.tenant_name}</h4>
                    <p className="text-sm text-gray-500">
                      {connection.tenant_type} • Last sync: {
                        connection.last_sync_at 
                          ? new Date(connection.last_sync_at).toLocaleDateString()
                          : 'Never'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={connection.is_active ? 'default' : 'secondary'}>
                    {connection.is_active ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectTenant(connection.tenant_id, connection.tenant_name)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={initiateConnection} 
                disabled={connecting}
                className="w-full sm:w-auto"
              >
                {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Another Organization
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}