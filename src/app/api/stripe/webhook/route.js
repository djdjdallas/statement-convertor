import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe, handleSubscriptionCreated, handleSubscriptionUpdated } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    let event
    try {
      const stripe = getStripe()
      if (!stripe) {
        throw new Error('Stripe is not configured')
      }
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        
        // Only handle subscription checkouts
        if (session.mode === 'subscription') {
          console.log('Checkout session completed:', session.id)
          
          // The subscription will be handled by customer.subscription.created
          // Just log for now
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('Subscription created:', subscription.id)

        const result = await handleSubscriptionCreated(subscription)
        
        if (result.error) {
          console.error('Error handling subscription created:', result.error)
          break
        }

        // Check if this was a trial user upgrading
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('signup_intent, trial_start_date, trial_end_date')
          .eq('id', result.userId)
          .single()
        
        // Update user profile in database
        const updateData = {
          id: result.userId,
          stripe_customer_id: result.customerId,
          subscription_id: result.subscriptionId,
          subscription_tier: result.tier,
          subscription_status: result.status,
          current_period_end: result.currentPeriodEnd
        }
        
        // If this was a trial user who upgraded, preserve their trial data
        if (existingProfile?.signup_intent === 'trial') {
          console.log(`Trial user ${result.userId} upgraded to ${result.tier}`)
        }
        
        await supabase
          .from('user_profiles')
          .upsert(updateData)

        console.log(`Updated user ${result.userId} to ${result.tier} tier`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id)

        const result = await handleSubscriptionUpdated(subscription)
        
        if (result.error) {
          console.error('Error handling subscription updated:', result.error)
          break
        }

        // Update user profile in database
        await supabase
          .from('user_profiles')
          .update({
            subscription_tier: result.tier,
            subscription_status: result.status,
            current_period_end: result.currentPeriodEnd
          })
          .eq('id', result.userId)

        console.log(`Updated user ${result.userId} subscription status to ${result.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)

        // Downgrade user to free tier
        const stripe = getStripe()
        if (!stripe) {
          console.error('Stripe is not configured')
          break
        }
        const customer = await stripe.customers.retrieve(subscription.customer)
        const userId = customer.metadata.userId

        if (userId) {
          await supabase
            .from('user_profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              subscription_id: null,
              current_period_end: null
            })
            .eq('id', userId)

          console.log(`Downgraded user ${userId} to free tier`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        
        if (invoice.subscription) {
          console.log('Payment succeeded for subscription:', invoice.subscription)
          
          // Log successful payment
          const stripe = getStripe()
          if (!stripe) {
            console.error('Stripe is not configured')
            break
          }
          const customer = await stripe.customers.retrieve(invoice.customer)
          const userId = customer.metadata.userId

          if (userId) {
            // You could log this payment in a payments table if needed
            console.log(`Payment successful for user ${userId}: ${invoice.amount_paid / 100} ${invoice.currency}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        
        if (invoice.subscription) {
          console.log('Payment failed for subscription:', invoice.subscription)
          
          // Handle failed payment - you might want to send an email or update status
          const stripe = getStripe()
          if (!stripe) {
            console.error('Stripe is not configured')
            break
          }
          const customer = await stripe.customers.retrieve(invoice.customer)
          const userId = customer.metadata.userId

          if (userId) {
            console.log(`Payment failed for user ${userId}`)
            // Could update user status or send notification
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
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
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  })
}