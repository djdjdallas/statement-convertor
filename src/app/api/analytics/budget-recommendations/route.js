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

    const { transactions, userProfile } = await request.json()
    
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

    // Get user profile if not provided
    let profile = userProfile
    if (!profile) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      profile = profileData
    }

    // Generate budget recommendations
    const recommendationsResult = await financialAnalytics.generateBudgetRecommendations(
      transactions, 
      profile
    )

    if (!recommendationsResult.success) {
      return NextResponse.json(
        { error: recommendationsResult.error },
        { status: 500 }
      )
    }

    // Log analytics usage
    await supabase.from('usage_tracking').insert({
      user_id: user.id,
      action: 'budget_recommendations',
      details: {
        transaction_count: transactions.length,
        user_tier: profile?.subscription_tier || 'free',
        generated_at: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: recommendationsResult.data
    })

  } catch (error) {
    console.error('Budget recommendations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}