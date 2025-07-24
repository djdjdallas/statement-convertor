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

    const { transactions, forecastPeriod = 3 } = await request.json()
    
    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Valid transactions array is required' },
        { status: 400 }
      )
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided for analysis' },
        { status: 400 }
      )
    }

    // Generate cash flow forecast
    const forecastResult = await financialAnalytics.generateCashFlowForecast(
      transactions, 
      forecastPeriod
    )

    if (!forecastResult.success) {
      return NextResponse.json(
        { error: forecastResult.error },
        { status: 500 }
      )
    }

    // Log analytics usage
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action: 'cash_flow_forecast',
      details: {
        transaction_count: transactions.length,
        forecast_period: forecastPeriod,
        generated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: forecastResult.data
    })

  } catch (error) {
    console.error('Cash flow forecast API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}