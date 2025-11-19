/**
 * API Route: /api/quickbooks/mappings/merchants
 *
 * Save or delete merchant mappings
 */

import {
  saveMerchantMappings,
  deleteMerchantMapping,
  getMerchantMappings,
} from '@/lib/quickbooks/mapping-service';
import { getConnection } from '@/lib/quickbooks/auth-service';
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

    // Get QB connection
    const connection = await getConnection(user.id);
    if (!connection) {
      return res.status(404).json({ error: 'No QuickBooks connection found' });
    }

    if (req.method === 'GET') {
      // Get merchant mappings
      const mappings = await getMerchantMappings(connection.id);

      return res.status(200).json({
        success: true,
        mappings,
        count: mappings.length,
      });
    } else if (req.method === 'POST') {
      // Save merchant mappings
      const { mappings } = req.body;

      if (!Array.isArray(mappings) || mappings.length === 0) {
        return res.status(400).json({ error: 'Mappings array is required' });
      }

      const savedMappings = await saveMerchantMappings(connection.id, mappings);

      return res.status(200).json({
        success: true,
        mappings: savedMappings,
        count: savedMappings.length,
      });
    } else if (req.method === 'DELETE') {
      // Delete a merchant mapping
      const { mappingId } = req.query;

      if (!mappingId) {
        return res.status(400).json({ error: 'Mapping ID is required' });
      }

      await deleteMerchantMapping(mappingId);

      return res.status(200).json({
        success: true,
        message: 'Mapping deleted successfully',
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing merchant mappings:', error);
    return res.status(500).json({
      error: 'Failed to manage merchant mappings',
      message: error.message,
    });
  }
}
