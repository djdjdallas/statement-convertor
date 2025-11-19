/**
 * API Route: /api/quickbooks/connect
 *
 * Initiates OAuth flow by redirecting to QuickBooks authorization page
 */

import { generateAuthUrl } from '@/lib/quickbooks/auth-service';
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

    // Generate authorization URL
    const { authUri, state } = generateAuthUrl(user.id);

    // Return URL to frontend for redirect
    return res.status(200).json({
      authUrl: authUri,
      state,
    });
  } catch (error) {
    console.error('Error initiating QB connection:', error);
    return res.status(500).json({
      error: 'Failed to initiate QuickBooks connection',
      message: error.message,
    });
  }
}
