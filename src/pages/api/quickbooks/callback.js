/**
 * API Route: /api/quickbooks/callback
 *
 * Handles OAuth callback from QuickBooks after user authorization
 */

import {
  exchangeCodeForTokens,
  saveConnection,
  verifyState,
} from '@/lib/quickbooks/auth-service';
import { getCompanyInfo } from '@/lib/quickbooks/api-client';
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
    const { code, state, realmId, error } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`/settings?qb_error=${encodeURIComponent(error)}`);
    }

    // Validate required parameters
    if (!code || !state || !realmId) {
      return res.redirect('/settings?qb_error=missing_parameters');
    }

    // Decode state to get user ID
    let userId;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = decoded.userId;
    } catch (err) {
      return res.redirect('/settings?qb_error=invalid_state');
    }

    // Verify state parameter
    if (!verifyState(state, userId)) {
      return res.redirect('/settings?qb_error=invalid_state');
    }

    // Exchange authorization code for tokens
    // Build full callback URL for the OAuth library
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const fullUrl = `${protocol}://${host}${req.url}`;

    console.log('Attempting token exchange with full URL');
    const tokenData = await exchangeCodeForTokens(fullUrl, realmId);

    // Get company information
    let companyInfo;
    try {
      // Temporarily save connection to use API client
      await saveConnection(userId, tokenData, { CompanyName: 'QuickBooks Company' });

      // Fetch company info
      companyInfo = await getCompanyInfo(userId);
    } catch (err) {
      console.error('Error fetching company info:', err);
      companyInfo = { CompanyName: 'QuickBooks Company' };
    }

    // Save connection with company info
    const connection = await saveConnection(userId, tokenData, companyInfo);

    console.log('QuickBooks connection established:', {
      userId,
      companyId: connection.company_id,
      companyName: connection.company_name,
    });

    // Redirect to settings page with success message
    return res.redirect('/settings?qb_connected=true');
  } catch (error) {
    console.error('Error in QB callback:', error);
    return res.redirect(`/settings?qb_error=${encodeURIComponent(error.message)}`);
  }
}
