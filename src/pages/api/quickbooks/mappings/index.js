/**
 * API Route: /api/quickbooks/mappings
 *
 * Get all mappings for the current user's QB connection
 */

import { getCategoryMappings, getMerchantMappings, getMappingStats } from '@/lib/quickbooks/mapping-service';
import { getConnection } from '@/lib/quickbooks/auth-service';
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

    // Get QB connection
    const connection = await getConnection(user.id);
    if (!connection) {
      return res.status(404).json({ error: 'No QuickBooks connection found' });
    }

    // Fetch all mappings
    const [categoryMappings, merchantMappings, stats] = await Promise.all([
      getCategoryMappings(connection.id),
      getMerchantMappings(connection.id),
      getMappingStats(connection.id),
    ]);

    return res.status(200).json({
      success: true,
      categoryMappings,
      merchantMappings,
      stats,
    });
  } catch (error) {
    console.error('Error fetching mappings:', error);
    return res.status(500).json({
      error: 'Failed to fetch mappings',
      message: error.message,
    });
  }
}
