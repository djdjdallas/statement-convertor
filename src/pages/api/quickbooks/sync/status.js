/**
 * API Route: /api/quickbooks/sync/status
 *
 * Get sync job status and progress
 */

import { getSyncJobStatus } from '@/lib/quickbooks/sync-service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Get job status
    const status = await getSyncJobStatus(jobId, user.id);

    return res.status(200).json({
      success: true,
      job: status,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return res.status(500).json({
      error: 'Failed to fetch sync status',
      message: error.message,
    });
  }
}
