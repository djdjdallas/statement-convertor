/**
 * API Route: /api/quickbooks/disconnect
 *
 * Disconnect QuickBooks connection for the current user
 */

import { disconnectConnection } from '@/lib/quickbooks/auth-service';
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

    // Disconnect
    const success = await disconnectConnection(user.id);

    if (!success) {
      return res.status(404).json({ error: 'No active connection found' });
    }

    return res.status(200).json({
      success: true,
      message: 'QuickBooks disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting QB:', error);
    return res.status(500).json({
      error: 'Failed to disconnect QuickBooks',
      message: error.message,
    });
  }
}
