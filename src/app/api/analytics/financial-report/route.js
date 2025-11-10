import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { financialAnalytics } from '@/lib/analytics/financial-analytics'

// Configure extended timeout for AI analytics
export const maxDuration = 300 // 5 minutes for Pro/Enterprise plans

export async function POST(request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { transactions, timeframe = 'monthly', includeAllFiles = false } = await request.json()
    
    let transactionData = transactions

    // If includeAllFiles is true, fetch all user transactions
    if (includeAllFiles) {
      const { data: allTransactions, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          files!inner(user_id)
        `)
        .eq('files.user_id', user.id)
        .order('date', { ascending: true })

      if (fetchError) {
        console.error('Error fetching transactions:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch transaction data' },
          { status: 500 }
        )
      }

      transactionData = allTransactions || []
    }
    
    if (!transactionData || !Array.isArray(transactionData)) {
      return NextResponse.json(
        { error: 'Valid transactions array is required' },
        { status: 400 }
      )
    }

    if (transactionData.length === 0) {
      return NextResponse.json(
        { error: 'No transactions available for report generation' },
        { status: 400 }
      )
    }

    // Generate comprehensive financial report
    const reportResult = await financialAnalytics.generateFinancialReport(
      transactionData, 
      timeframe
    )

    if (!reportResult.success) {
      return NextResponse.json(
        { error: reportResult.error },
        { status: 500 }
      )
    }

    // Log analytics usage
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action: 'financial_report',
      details: {
        transaction_count: transactionData.length,
        timeframe,
        include_all_files: includeAllFiles,
        generated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: reportResult.data
    })

  } catch (error) {
    console.error('Financial report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}