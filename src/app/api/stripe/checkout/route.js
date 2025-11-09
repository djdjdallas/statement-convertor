import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe'
import { getPriceId } from '@/lib/subscription-tiers'

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

    const { tier, billingPeriod = 'monthly' } = await request.json()
    
    // Validate tier - now includes professional, business, not basic/premium
    const validTiers = ['professional', 'business', 'basic', 'premium'] // Include legacy names
    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    // Validate billing period
    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'Invalid billing period' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Get or create Stripe customer
    const { customer, error: customerError } = await getOrCreateCustomer(
      user.id,
      user.email,
      userProfile?.full_name
    )

    if (customerError) {
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    // Update user profile with Stripe customer ID
    await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        stripe_customer_id: customer.id
      })

    // Get the appropriate price ID based on tier and billing period
    const priceId = getPriceId(tier, billingPeriod)
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid price configuration' },
        { status: 400 }
      )
    }

    // Determine trial period based on tier
    // Professional gets 7-day trial, Business gets no trial
    let trialPeriodDays = null
    if (tier === 'professional' || tier === 'basic') {
      trialPeriodDays = 7
    }
    // business tier gets no trial (null)

    // Create checkout session with trial period
    const { session, error: sessionError } = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      trialPeriodDays
    })

    if (sessionError) {
      console.error('Checkout session error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      checkoutUrl: session.url
    })

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}