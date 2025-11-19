/**
 * API Route: /api/quickbooks/accounts
 *
 * Fetch Chart of Accounts from QuickBooks for mapping
 */

import { fetchAccounts, fetchVendors, fetchCustomers } from '@/lib/quickbooks/api-client';
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

    const { type } = req.query;

    // Fetch requested data type
    let data;
    switch (type) {
      case 'vendors':
        data = await fetchVendors(user.id);
        break;
      case 'customers':
        data = await fetchCustomers(user.id);
        break;
      case 'accounts':
      default:
        data = await fetchAccounts(user.id);
        break;
    }

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error fetching QB data:', error);
    return res.status(500).json({
      error: `Failed to fetch QuickBooks ${req.query.type || 'accounts'}`,
      message: error.message,
    });
  }
}
