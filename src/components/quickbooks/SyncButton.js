'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import SyncProgressModal from './SyncProgressModal';

export default function SyncButton({ fileId, fileName, transactions = [], onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [syncJobId, setSyncJobId] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const startSync = async () => {
    if (!fileId || !transactions || transactions.length === 0) {
      toast({
        title: 'No Transactions',
        description: 'This file has no transactions to sync',
        variant: 'destructive',
      });
      return;
    }

    setSyncing(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/quickbooks/sync/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          settings: {
            // Default settings - can be customized
            minConfidence: 70,
            includeOriginalDescription: true,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSyncJobId(data.job.id);
        setShowModal(true);

        toast({
          title: 'Sync Started',
          description: `Syncing ${data.job.total_transactions} transactions to QuickBooks`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start sync');
      }
    } catch (error) {
      console.error('Error starting sync:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to start QuickBooks sync',
        variant: 'destructive',
      });
      setSyncing(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSyncing(false);
    setSyncJobId(null);
    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  return (
    <>
      <Button
        onClick={startSync}
        disabled={syncing || !transactions || transactions.length === 0}
        className="bg-[#2CA01C] hover:bg-[#248517]"
      >
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync to QuickBooks
          </>
        )}
      </Button>

      {showModal && syncJobId && (
        <SyncProgressModal
          jobId={syncJobId}
          fileName={fileName}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
