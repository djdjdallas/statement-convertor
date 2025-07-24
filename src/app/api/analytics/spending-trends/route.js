import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { financialAnalytics } from '@/lib/analytics/financial-analytics'

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

    const { transactions, period = 'monthly', includeAllFiles = false } = await request.json()
    
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
        { error: 'No transactions available for trend analysis' },
        { status: 400 }
      )
    }

    // Analyze spending trends
    const trends = financialAnalytics.analyzeSpendingTrends(transactionData, period)

    // Detect duplicates across all transactions
    const duplicates = financialAnalytics.detectDuplicateTransactions(transactionData)

    // Log analytics usage
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action: 'spending_trends',
      details: {
        transaction_count: transactionData.length,
        period,
        include_all_files: includeAllFiles,
        duplicates_found: duplicates.length,
        generated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        trends,
        duplicates: {
          count: duplicates.length,
          items: duplicates.slice(0, 20) // Return top 20 duplicates
        },
        summary: {
          totalTransactions: transactionData.length,
          analysisPeriod: period,
          monthsAnalyzed: Object.keys(trends.monthly).length,
          categoriesFound: Object.keys(trends.categoryTrends).length
        }
      }
    })

  } catch (error) {
    console.error('Spending trends API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}