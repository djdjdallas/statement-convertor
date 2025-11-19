/**
 * API Route: /api/quickbooks/mappings/auto-suggest
 *
 * Generate AI-powered mapping suggestions for categories and merchants
 */

import {
  generateCategoryMappings,
  generateMerchantMappings,
  getUserCategories,
  getUserMerchants,
} from '@/lib/quickbooks/mapping-service';
import { getConnection } from '@/lib/quickbooks/auth-service';
import { fetchAccounts, fetchVendors, fetchCustomers } from '@/lib/quickbooks/api-client';
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

    const { type } = req.body; // 'categories' or 'merchants'

    if (type === 'categories') {
      // Generate category mappings
      const [categories, qbAccounts] = await Promise.all([
        getUserCategories(user.id),
        fetchAccounts(user.id),
      ]);

      if (categories.length === 0) {
        return res.status(200).json({
          success: true,
          mappings: [],
          message: 'No categories found in your transactions',
        });
      }

      const suggestions = await generateCategoryMappings(
        categories,
        qbAccounts,
        connection.id
      );

      return res.status(200).json({
        success: true,
        type: 'categories',
        mappings: suggestions,
        count: suggestions.length,
      });
    } else if (type === 'merchants') {
      // Generate merchant mappings
      const [merchants, qbVendors, qbCustomers] = await Promise.all([
        getUserMerchants(user.id),
        fetchVendors(user.id),
        fetchCustomers(user.id),
      ]);

      if (merchants.length === 0) {
        return res.status(200).json({
          success: true,
          mappings: [],
          message: 'No merchants found in your transactions',
        });
      }

      const suggestions = await generateMerchantMappings(
        merchants,
        qbVendors,
        qbCustomers,
        connection.id
      );

      return res.status(200).json({
        success: true,
        type: 'merchants',
        mappings: suggestions,
        count: suggestions.length,
      });
    } else {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be "categories" or "merchants"',
      });
    }
  } catch (error) {
    console.error('Error generating mapping suggestions:', error);
    return res.status(500).json({
      error: 'Failed to generate mapping suggestions',
      message: error.message,
    });
  }
}
