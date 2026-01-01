import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { XeroService } from '@/lib/xero/xero-service'
import { hasXeroAccess } from '@/lib/subscription-tiers'
import { trackSync, trackError, trackXeroExport, trackXeroConnection } from '@/lib/posthog-server'

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
    const exportStartTime = Date.now()

    if (!fileId || !tenantId || !bankAccountId) {
      trackXeroExport(session.user.id, {
        action: 'failed',
        error: 'Missing required parameters',
        errorCode: 'MISSING_PARAMS'
      })
      return NextResponse.json({
        error: 'Missing required parameters: fileId, tenantId, and bankAccountId are required'
      }, { status: 400 })
    }

    // Track export started
    trackXeroExport(session.user.id, {
      action: 'started',
      fileId,
      tenantId
    })

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

    // Track successful Xero export in PostHog
    const exportDuration = Date.now() - exportStartTime
    trackXeroExport(session.user.id, {
      action: 'completed',
      fileId,
      tenantId,
      transactionCount: file.transactions.length,
      duration: exportDuration
    })

    // Also track sync for backward compatibility
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

    // Determine error code based on error type
    let errorCode = 'EXPORT_ERROR'
    if (error.message?.includes('Refresh token has expired') || error.code === 'XERO_TOKEN_EXPIRED') {
      errorCode = 'TOKEN_EXPIRED'
    } else if (error.response?.statusCode === 401) {
      errorCode = 'AUTH_FAILED'
    } else if (error.response?.statusCode === 403) {
      errorCode = 'ACCESS_DENIED'
    } else if (error.response?.statusCode === 429) {
      errorCode = 'RATE_LIMITED'
    }

    // Track Xero export failure in PostHog
    trackXeroExport(null, {
      action: 'failed',
      error: error.message,
      errorCode
    })

    // Track token refresh failures separately for connection monitoring
    if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'AUTH_FAILED') {
      trackXeroConnection('unknown', {
        action: 'token_refresh_failed',
        error: error.message,
        errorCode
      })
    }

    // Also track as general error for backward compatibility
    trackError(null, {
      type: 'xero_export_failed',
      message: error.message,
      endpoint: '/api/xero/export',
      context: { errorCode }
    })

    // Check for refresh token expired error
    if (errorCode === 'TOKEN_EXPIRED') {
      return NextResponse.json({
        error: 'Xero session expired. Please reconnect your Xero account.',
        code: 'XERO_TOKEN_EXPIRED',
        requiresReconnect: true
      }, { status: 401 })
    }

    // Handle specific Xero errors
    if (errorCode === 'AUTH_FAILED') {
      return NextResponse.json({
        error: 'Xero authentication failed. Please reconnect your Xero account.',
        code: 'XERO_AUTH_FAILED',
        requiresReconnect: true
      }, { status: 401 })
    }

    if (errorCode === 'ACCESS_DENIED') {
      return NextResponse.json({
        error: 'Access denied. Please check your Xero permissions.'
      }, { status: 403 })
    }

    if (errorCode === 'RATE_LIMITED') {
      return NextResponse.json({
        error: 'Xero API rate limit reached. Please try again in a few minutes.'
      }, { status: 429 })
    }

    return NextResponse.json({
      error: error.message || 'Failed to export to Xero'
    }, { status: 500 })
  }
}