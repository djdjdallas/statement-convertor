/**
 * API Route: /api/quickbooks/status
 *
 * Get QuickBooks connection status for the current user
 */

import { checkConnectionStatus } from '@/lib/quickbooks/auth-service';
import { testConnection } from '@/lib/quickbooks/api-client';
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

    // Get connection status
    const status = await checkConnectionStatus(user.id);

    // Optionally test connection if requested
    if (req.query.test === 'true' && status.connected) {
      const testResult = await testConnection(user.id);
      status.testResult = testResult;
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error checking QB status:', error);
    return res.status(500).json({
      error: 'Failed to check QuickBooks status',
      message: error.message,
      connected: false,
    });
  }
}
