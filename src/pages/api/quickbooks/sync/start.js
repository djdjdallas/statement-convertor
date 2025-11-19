/**
 * API Route: /api/quickbooks/sync/start
 *
 * Start a new sync job for a file
 */

import { createSyncJob, processSyncJob } from '@/lib/quickbooks/sync-service';
import { getConnection } from '@/lib/quickbooks/auth-service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get QB connection
    const connection = await getConnection(user.id);
    if (!connection) {
      return res.status(404).json({ error: 'No QuickBooks connection found' });
    }

    const { fileId, settings = {} } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Verify file belongs to user
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single();

    if (fileError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Create sync job
    const job = await createSyncJob(user.id, connection.id, fileId, settings);

    // Process sync job asynchronously
    // Note: In production, this should be handled by a background worker
    processSyncJob(job.id, user.id).catch(error => {
      console.error('Background sync failed:', error);
    });

    return res.status(200).json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        total_transactions: job.total_transactions,
      },
      message: 'Sync job started',
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    return res.status(500).json({
      error: 'Failed to start sync',
      message: error.message,
    });
  }
}
