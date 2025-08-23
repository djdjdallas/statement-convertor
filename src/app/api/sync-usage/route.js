import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Count conversions from usage_tracking for current month
    const { data: trackingData, error: trackingError } = await supabase
      .from('usage_tracking')
      .select('id')
      .eq('user_id', user.id)
      .eq('action', 'pdf_process')
      .gte('created_at', new Date(currentYear, currentMonth - 1, 1).toISOString())
      .lt('created_at', new Date(currentYear, currentMonth, 1).toISOString())

    if (trackingError) {
      console.error('Error counting usage_tracking:', trackingError)
      return NextResponse.json({ error: trackingError.message }, { status: 500 })
    }

    const conversionCount = trackingData?.length || 0

    // Update conversion_usage table
    const { data: upsertData, error: upsertError } = await supabase
      .from('conversion_usage')
      .upsert({
        user_id: user.id,
        month: currentMonth,
        year: currentYear,
        conversions_count: conversionCount,
        api_calls_count: 0
      }, {
        onConflict: 'user_id,month,year'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting conversion_usage:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Usage synced successfully',
      data: {
        userId: user.id,
        month: currentMonth,
        year: currentYear,
        conversionsTracked: conversionCount,
        conversionUsageRecord: upsertData
      }
    })

  } catch (error) {
    console.error('Sync usage error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}