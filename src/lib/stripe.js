import Stripe from 'stripe'
import { STRIPE_PRODUCTS } from './stripe/config'

// Server-side Stripe instance - lazy initialization to avoid build errors
let stripeInstance = null

function getStripe() {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })
  }
  return stripeInstance
}

// Export the getStripe function for internal use
export { getStripe }

// Price IDs for subscription tiers - Import from centralized config
export const STRIPE_PRICES = {
  // Professional tier (new)
  professional_monthly: STRIPE_PRODUCTS.professional.prices.monthly.id,
  professional_yearly: STRIPE_PRODUCTS.professional.prices.yearly.id,
  // Business tier (new)
  business_monthly: STRIPE_PRODUCTS.business.prices.monthly.id,
  business_yearly: STRIPE_PRODUCTS.business.prices.yearly.id,
  // Legacy mappings (backwards compatibility)
  basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_monthly',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly'
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
  trialPeriodDays = null
}) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId
      },
      subscription_data: {
        metadata: {
          userId: userId
        }
      }
    }
    
    // Add trial period if specified
    if (trialPeriodDays) {
      sessionConfig.subscription_data.trial_period_days = trialPeriodDays
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig)

    return { session, error: null }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { session: null, error: error.message }
  }
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(customerId, returnUrl) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { session, error: null }
  } catch (error) {
    console.error('Error creating portal session:', error)
    return { session: null, error: error.message }
  }
}

/**
 * Get or create a Stripe customer
 */
export async function getOrCreateCustomer(userId, email, name = null) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0]
      
      // Update metadata if needed
      if (customer.metadata.userId !== userId) {
        await stripe.customers.update(customer.id, {
          metadata: { userId }
        })
      }
      
      return { customer, error: null }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    })

    return { customer, error: null }
  } catch (error) {
    console.error('Error managing customer:', error)
    return { customer: null, error: error.message }
  }
}

/**
 * Get subscription details by customer ID
 */
export async function getSubscription(customerId) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      return { subscription: null, error: null }
    }

    return { subscription: subscriptions.data[0], error: null }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return { subscription: null, error: error.message }
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    return { subscription, error: null }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return { subscription: null, error: error.message }
  }
}

/**
 * Reactivate a subscription
 */
export async function reactivateSubscription(subscriptionId) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })

    return { subscription, error: null }
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return { subscription: null, error: error.message }
  }
}

/**
 * Get price information
 */
export async function getPrice(priceId) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    })

    return { price, error: null }
  } catch (error) {
    console.error('Error fetching price:', error)
    return { price: null, error: error.message }
  }
}

/**
 * Handle successful subscription creation
 */
export async function handleSubscriptionCreated(subscription) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const customer = await stripe.customers.retrieve(subscription.customer)
    const userId = customer.metadata.userId || subscription.metadata.userId

    if (!userId) {
      throw new Error('No userId found in subscription or customer metadata')
    }

    // Determine subscription tier based on price
    let tier = 'free'
    const priceId = subscription.items.data[0].price.id

    // Check for new tier price IDs (professional and business)
    if (priceId === STRIPE_PRICES.professional_monthly || priceId === STRIPE_PRICES.professional_yearly) {
      tier = 'professional'
    } else if (priceId === STRIPE_PRICES.business_monthly || priceId === STRIPE_PRICES.business_yearly) {
      tier = 'business'
    }
    // Legacy tier mappings (backwards compatibility)
    else if (priceId === STRIPE_PRICES.basic) {
      tier = 'professional' // Map old 'basic' to new 'professional'
    } else if (priceId === STRIPE_PRICES.premium) {
      tier = 'business' // Map old 'premium' to new 'business'
    }

    return {
      userId,
      customerId: subscription.customer,
      subscriptionId: subscription.id,
      tier,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      error: null
    }
  } catch (error) {
    console.error('Error handling subscription created:', error)
    return { error: error.message }
  }
}

/**
 * Handle subscription status updates
 */
export async function handleSubscriptionUpdated(subscription) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }
    const customer = await stripe.customers.retrieve(subscription.customer)
    const userId = customer.metadata.userId || subscription.metadata.userId

    if (!userId) {
      throw new Error('No userId found in subscription or customer metadata')
    }

    // Determine subscription tier
    let tier = 'free'
    if (subscription.status === 'active' && subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id

      // Check for new tier price IDs (professional and business)
      if (priceId === STRIPE_PRICES.professional_monthly || priceId === STRIPE_PRICES.professional_yearly) {
        tier = 'professional'
      } else if (priceId === STRIPE_PRICES.business_monthly || priceId === STRIPE_PRICES.business_yearly) {
        tier = 'business'
      }
      // Legacy tier mappings (backwards compatibility)
      else if (priceId === STRIPE_PRICES.basic) {
        tier = 'professional' // Map old 'basic' to new 'professional'
      } else if (priceId === STRIPE_PRICES.premium) {
        tier = 'business' // Map old 'premium' to new 'business'
      }
    }

    return {
      userId,
      customerId: subscription.customer,
      subscriptionId: subscription.id,
      tier,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      error: null
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    return { error: error.message }
  }
}