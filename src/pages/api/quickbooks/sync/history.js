/**
 * API Route: /api/quickbooks/sync/history
 *
 * Get sync job history for user
 */

import { getSyncJobHistory, cancelSyncJob } from '@/lib/quickbooks/sync-service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
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

    if (req.method === 'GET') {
      // Get sync history
      const limit = parseInt(req.query.limit) || 20;
      const history = await getSyncJobHistory(user.id, limit);

      return res.status(200).json({
        success: true,
        history,
        count: history.length,
      });
    } else if (req.method === 'DELETE') {
      // Cancel sync job
      const { jobId } = req.query;

      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is required' });
      }

      await cancelSyncJob(jobId, user.id);

      return res.status(200).json({
        success: true,
        message: 'Sync job cancelled',
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing sync history:', error);
    return res.status(500).json({
      error: 'Failed to manage sync history',
      message: error.message,
    });
  }
}
