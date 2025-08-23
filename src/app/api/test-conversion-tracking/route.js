import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Debug info
    const debug = {
      userId: user.id,
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear()
    }

    // Test 1: Check usage_tracking
    const { data: usageTracking, error: trackingError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('action', 'pdf_process')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    
    debug.usageTrackingCount = usageTracking?.length || 0
    debug.usageTrackingError = trackingError?.message

    // Test 2: Check conversion_usage directly
    const { data: conversionUsage, error: conversionError } = await supabase
      .from('conversion_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', debug.currentMonth)
      .eq('year', debug.currentYear)
      .single()
    
    debug.conversionUsageData = conversionUsage
    debug.conversionUsageError = conversionError?.message

    // Test 3: Test the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_user_monthly_usage', { p_user_id: user.id })
      .single()
    
    debug.rpcData = rpcData
    debug.rpcError = rpcError?.message

    // Test 4: Try to increment (won't actually change data, just test)
    const { error: incrementError } = await supabase
      .rpc('increment_user_usage', {
        p_user_id: user.id,
        p_usage_type: 'conversion',
        p_amount: 0  // Use 0 to test without changing data
      })
    
    debug.incrementTestError = incrementError?.message

    return NextResponse.json({
      success: true,
      debug,
      summary: {
        monthlyUsageFromTracking: debug.usageTrackingCount,
        monthlyUsageFromConversionTable: conversionUsage?.conversions_count || 0,
        monthlyUsageFromRPC: rpcData?.conversions_count || 0
      }
    })

  } catch (error) {
    console.error('Test conversion tracking error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}