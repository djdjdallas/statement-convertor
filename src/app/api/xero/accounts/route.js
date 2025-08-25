import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { XeroService } from '@/lib/xero/xero-service'
import { decrypt } from '@/lib/encryption'

export async function GET(req) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const type = searchParams.get('type') || 'ALL'
    const forTransactions = searchParams.get('forTransactions') === 'true'

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    // Get Xero connection for this tenant
    const { data: connection, error: connError } = await supabase
      .from('xero_connections')
      .select('*')
      .eq('user_id', user.id)
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
    
    // Decrypt tokens
    let accessToken, refreshToken
    try {
      // Check if tokens are base64 encoded (old format) or encrypted JSON
      if (connection.access_token.startsWith('base64-')) {
        // Old base64 format - decode it
        const base64Token = connection.access_token.replace('base64-', '')
        accessToken = Buffer.from(base64Token, 'base64').toString('utf-8')
        refreshToken = Buffer.from(connection.refresh_token.replace('base64-', ''), 'base64').toString('utf-8')
      } else if (connection.access_token.startsWith('eyJ')) {
        // Token looks like a JWT, use as is (unencrypted)
        accessToken = connection.access_token
        refreshToken = connection.refresh_token
      } else if (connection.access_token.startsWith('{')) {
        // Encrypted JSON format
        accessToken = decrypt(connection.access_token)
        refreshToken = decrypt(connection.refresh_token)
      } else {
        // Try to decrypt anyway
        accessToken = decrypt(connection.access_token)
        refreshToken = decrypt(connection.refresh_token)
      }
      
      if (!accessToken || !refreshToken) {
        throw new Error('Failed to decrypt tokens')
      }
    } catch (decryptError) {
      console.error('Token decryption error:', decryptError)
      console.error('Token format:', connection.access_token?.substring(0, 30) + '...')
      return NextResponse.json({ 
        error: 'Invalid token encryption. Please reconnect your Xero account.' 
      }, { status: 401 })
    }
    
    console.log('Fetching accounts for tenant:', tenantId)
    console.log('Token preview:', accessToken?.substring(0, 20) + '...')
    
    // Get accounts from Xero
    const result = await xeroService.getAccounts(
      accessToken,
      refreshToken,
      tenantId,
      type
    )

    // If token was refreshed, update it
    if (result.newTokens) {
      const { encrypt } = await import('@/lib/encryption')
      await supabase
        .from('xero_connections')
        .update({
          access_token: encrypt(result.newTokens.access_token),
          refresh_token: encrypt(result.newTokens.refresh_token),
          token_expires_at: new Date(Date.now() + result.newTokens.expires_in * 1000).toISOString()
        })
        .eq('id', connection.id)
    }

    // If forTransactions flag is set, filter accounts suitable for bank transactions
    let accounts = result.accounts
    if (forTransactions) {
      accounts = result.accounts
        .filter(acc => 
          acc.status === 'ACTIVE' && 
          ['EXPENSE', 'REVENUE', 'DIRECTCOSTS', 'OVERHEADS', 'SALES'].includes(acc.type)
        )
        .map(acc => ({
          code: acc.code,
          name: acc.name,
          type: acc.type,
          taxType: acc.taxType || 'NONE',
          description: acc.description,
          isExpense: ['EXPENSE', 'DIRECTCOSTS', 'OVERHEADS'].includes(acc.type),
          isRevenue: ['REVENUE', 'SALES'].includes(acc.type)
        }))
        .sort((a, b) => a.code.localeCompare(b.code))
        
      return NextResponse.json({
        accounts,
        defaultExpenseCode: accounts.find(acc => acc.isExpense)?.code || '400',
        defaultRevenueCode: accounts.find(acc => acc.isRevenue)?.code || '200'
      })
    }

    return NextResponse.json({ 
      accounts
    })

  } catch (error) {
    console.error('Get accounts error:', error)
    
    if (error.response?.statusCode === 401) {
      return NextResponse.json({ 
        error: 'Xero authentication failed. Please reconnect your Xero account.' 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to get accounts from Xero' 
    }, { status: 500 })
  }
}