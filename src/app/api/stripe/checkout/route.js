import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, getOrCreateCustomer, STRIPE_PRICES } from '@/lib/stripe'

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

    const { tier } = await request.json()
    
    if (!tier || !['basic', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
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

    // Create checkout session
    const priceId = STRIPE_PRICES[tier]
    const { session, error: sessionError } = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    })

    if (sessionError) {
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