import { loadStripe } from '@stripe/stripe-js'

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
let stripePromise

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

/**
 * Redirect to Stripe checkout
 */
export async function redirectToCheckout(tier, billingPeriod = 'monthly') {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tier, billingPeriod }),
      credentials: 'same-origin'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session')
    }

    // Redirect to Stripe checkout
    window.location.href = data.checkoutUrl
    
  } catch (error) {
    console.error('Checkout error:', error)
    throw error
  }
}

/**
 * Redirect to Stripe customer portal
 */
export async function redirectToPortal() {
  try {
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create portal session')
    }

    // Redirect to Stripe portal
    window.location.href = data.portalUrl
    
  } catch (error) {
    console.error('Portal error:', error)
    throw error
  }
}

export default getStripe