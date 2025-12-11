import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { XeroService } from '@/lib/xero/xero-service'
import { hasXeroAccess } from '@/lib/subscription-tiers'
import { trackSync, trackError } from '@/lib/posthog-server'

export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user's subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single()

    if (!hasXeroAccess(profile?.subscription_tier || 'free')) {
      return NextResponse.json({ 
        error: 'Xero export requires a Professional subscription or higher' 
      }, { status: 403 })
    }

    const { fileId, tenantId, bankAccountId } = await req.json()

    if (!fileId || !tenantId || !bankAccountId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileId, tenantId, and bankAccountId are required' 
      }, { status: 400 })
    }

    // Fetch the file and its transactions
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select(`
        *,
        transactions(*)
      `)
      .eq('id', fileId)
      .eq('user_id', session.user.id)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ 
        error: 'File not found or access denied' 
      }, { status: 404 })
    }

    if (!file.transactions || file.transactions.length === 0) {
      return NextResponse.json({ 
        error: 'No transactions found in this file' 
      }, { status: 400 })
    }

    // Get Xero access token for this tenant
    const { data: connection, error: connError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ 
        error: 'Xero connection not found or inactive' 
      }, { status: 404 })
    }

    // Initialize Xero service
    const xeroService = new XeroService()
    
    // Import transactions to Xero
    const result = await xeroService.importTransactions(
      connection.access_token,
      connection.refresh_token,
      tenantId,
      bankAccountId,
      file.transactions,
      {
        description: `Import from ${file.original_filename}`,
        reference: file.id
      }
    )

    // If token was refreshed, update it
    if (result.newTokens) {
      await supabase
        .from('xero_connections')
        .update({
          access_token: result.newTokens.access_token,
          refresh_token: result.newTokens.refresh_token,
          expires_at: new Date(Date.now() + result.newTokens.expires_in * 1000).toISOString()
        })
        .eq('id', connection.id)
    }

    // Record the import
    const { data: importRecord, error: importError } = await supabase
      .from('xero_imports')
      .insert({
        user_id: session.user.id,
        file_id: fileId,
        tenant_id: tenantId,
        bank_account_id: bankAccountId,
        transaction_count: file.transactions.length,
        status: 'completed',
        xero_bank_transaction_ids: result.bankTransactionIds,
        import_summary: result.summary
      })
      .select()
      .single()

    if (importError) {
      console.error('Failed to record import:', importError)
    }

    // Update file to mark it as imported
    await supabase
      .from('files')
      .update({ 
        xero_import_id: importRecord?.id,
        xero_imported_at: new Date().toISOString()
      })
      .eq('id', fileId)

    // Track successful Xero sync in PostHog
    trackSync(session.user.id, {
      platform: 'xero',
      transactionCount: file.transactions.length,
      success: true
    })

    return NextResponse.json({
      success: true,
      importId: importRecord?.id,
      transactionCount: file.transactions.length,
      summary: result.summary
    })

  } catch (error) {
    console.error('Xero export error:', error)

    // Track Xero sync error in PostHog
    trackError(null, {
      type: 'xero_sync_failed',
      message: error.message,
      endpoint: '/api/xero/export'
    })
    
    // Check for refresh token expired error
    if (error.message?.includes('Refresh token has expired') || error.code === 'XERO_TOKEN_EXPIRED') {
      return NextResponse.json({ 
        error: 'Xero session expired. Please reconnect your Xero account.',
        code: 'XERO_TOKEN_EXPIRED',
        requiresReconnect: true
      }, { status: 401 })
    }
    
    // Handle specific Xero errors
    if (error.response?.statusCode === 401) {
      return NextResponse.json({ 
        error: 'Xero authentication failed. Please reconnect your Xero account.',
        code: 'XERO_AUTH_FAILED',
        requiresReconnect: true
      }, { status: 401 })
    }
    
    if (error.response?.statusCode === 403) {
      return NextResponse.json({ 
        error: 'Access denied. Please check your Xero permissions.' 
      }, { status: 403 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to export to Xero' 
    }, { status: 500 })
  }
}