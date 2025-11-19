/**
 * API Route: /api/quickbooks/mappings/validate
 *
 * Validate mappings against transactions before sync
 */

import { validateMappings } from '@/lib/quickbooks/mapping-service';
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

    const { fileId, transactions } = req.body;

    let txnsToValidate = transactions;

    // If fileId provided, fetch transactions from that file
    if (fileId && !transactions) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('file_id', fileId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error('Failed to fetch file transactions');
      }

      txnsToValidate = data;
    }

    if (!txnsToValidate || txnsToValidate.length === 0) {
      return res.status(400).json({
        error: 'No transactions provided',
        message: 'Please provide transactions array or fileId',
      });
    }

    // Validate mappings
    const validation = await validateMappings(connection.id, txnsToValidate);

    return res.status(200).json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error('Error validating mappings:', error);
    return res.status(500).json({
      error: 'Failed to validate mappings',
      message: error.message,
    });
  }
}
