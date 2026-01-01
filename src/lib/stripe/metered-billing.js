/**
 * Stripe Metered Billing for API Usage
 *
 * Handles recording usage events to Stripe for metered billing.
 * Supports both subscription tiers with included usage and pay-as-you-go pricing.
 *
 * Setup in Stripe Dashboard:
 * 1. Create a meter: "Bank Statement Conversions"
 * 2. Create products with tiered pricing:
 *    - Starter: $29/mo (100 included conversions)
 *    - Growth: $99/mo (500 included conversions)
 *    - Scale: $299/mo (2000 included conversions)
 *    - Enterprise: Custom (unlimited)
 *    - Pay-as-you-go: $0.15/conversion (no monthly fee)
 * 3. Add overage pricing for tiered plans
 */

import { getStripe } from '@/lib/stripe';

// Meter event name in Stripe
const METER_EVENT_NAME = 'bank_statement_conversion';

// API plan price IDs (you'll create these in Stripe Dashboard)
export const API_PRICE_IDS = {
  starter: process.env.STRIPE_API_STARTER_PRICE_ID || 'price_api_starter',
  growth: process.env.STRIPE_API_GROWTH_PRICE_ID || 'price_api_growth',
  scale: process.env.STRIPE_API_SCALE_PRICE_ID || 'price_api_scale',
  enterprise: process.env.STRIPE_API_ENTERPRISE_PRICE_ID || 'price_api_enterprise',
  payg: process.env.STRIPE_API_PAYG_PRICE_ID || 'price_api_payg'
};

// Plan configurations
export const API_PLAN_CONFIGS = {
  starter: {
    name: 'Starter',
    price: 29,
    currency: 'usd',
    interval: 'month',
    included_conversions: 100,
    overage_rate: 0.20, // $0.20 per conversion over limit
    rate_limit: 10 // requests per minute
  },
  growth: {
    name: 'Growth',
    price: 99,
    currency: 'usd',
    interval: 'month',
    included_conversions: 500,
    overage_rate: 0.18,
    rate_limit: 30
  },
  scale: {
    name: 'Scale',
    price: 299,
    currency: 'usd',
    interval: 'month',
    included_conversions: 2000,
    overage_rate: 0.15,
    rate_limit: 60
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Custom pricing
    currency: 'usd',
    interval: 'month',
    included_conversions: -1, // Unlimited
    overage_rate: 0,
    rate_limit: 120
  },
  payg: {
    name: 'Pay-as-you-go',
    price: 0,
    currency: 'usd',
    interval: 'month',
    included_conversions: 0,
    overage_rate: 0.15, // $0.15 per conversion
    rate_limit: 20
  }
};

/**
 * Records a usage event to Stripe
 * @param {object} params - Usage event parameters
 * @param {string} params.userId - User ID (Stripe customer ID)
 * @param {string} params.eventName - Meter event name
 * @param {number} params.value - Usage value (default: 1)
 * @param {string} params.idempotencyKey - Unique key to prevent duplicates
 * @returns {Promise<object>} Stripe meter event response
 */
export async function recordMeterEvent({
  userId,
  eventName = METER_EVENT_NAME,
  value = 1,
  idempotencyKey = null
}) {
  const stripe = getStripe();

  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }

  try {
    // Generate idempotency key if not provided
    const idemKey = idempotencyKey || `${userId}_${eventName}_${Date.now()}_${Math.random()}`;

    // Record meter event
    // Note: Stripe Billing Meters API (as of 2024)
    // https://stripe.com/docs/billing/subscriptions/usage-based/recording-usage
    const event = await stripe.billing.meterEvents.create({
      event_name: eventName,
      payload: {
        stripe_customer_id: userId, // Must be Stripe customer ID
        value: value.toString()
      }
    }, {
      idempotencyKey: idemKey
    });

    console.log(`Recorded meter event for user ${userId}: ${value} ${eventName}`);
    return event;

  } catch (error) {
    console.error('Error recording meter event to Stripe:', error);

    // Don't throw - billing failures shouldn't break API functionality
    // Log error for monitoring
    return null;
  }
}

/**
 * Records an API conversion to Stripe
 * @param {object} params - Conversion parameters
 * @param {string} params.userId - User ID
 * @param {string} params.stripeCustomerId - Stripe customer ID
 * @param {number} params.quantity - Number of conversions (default: 1)
 * @param {string} params.conversionId - Unique conversion ID for idempotency
 * @returns {Promise<object>} Meter event response
 */
export async function recordApiConversion({
  userId,
  stripeCustomerId,
  quantity = 1,
  conversionId
}) {
  if (!stripeCustomerId) {
    console.warn(`No Stripe customer ID for user ${userId}, skipping meter event`);
    return null;
  }

  return await recordMeterEvent({
    userId: stripeCustomerId,
    eventName: METER_EVENT_NAME,
    value: quantity,
    idempotencyKey: `conv_${conversionId}`
  });
}

/**
 * Creates a Stripe checkout session for API subscription
 * @param {object} params - Checkout parameters
 * @param {string} params.userId - Supabase user ID
 * @param {string} params.userEmail - User email
 * @param {string} params.planTier - Plan tier (starter, growth, scale, enterprise, payg)
 * @param {string} params.successUrl - URL to redirect after success
 * @param {string} params.cancelUrl - URL to redirect after cancel
 * @returns {Promise<object>} Checkout session
 */
export async function createApiCheckoutSession({
  userId,
  userEmail,
  customerId,
  planTier,
  successUrl,
  cancelUrl
}) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const priceId = API_PRICE_IDS[planTier];
  if (!priceId) {
    throw new Error(`Invalid plan tier: ${planTier}`);
  }

  const config = API_PLAN_CONFIGS[planTier];

  try {
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_tier: planTier,
          included_conversions: config.included_conversions
        }
      },
      metadata: {
        user_id: userId,
        plan_tier: planTier
      }
    };

    // Use existing customer if available, otherwise fall back to email
    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
      sessionConfig.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return session;

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}

/**
 * Creates a billing portal session for managing API subscription
 * @param {string} customerId - Stripe customer ID
 * @param {string} returnUrl - URL to return to after portal session
 * @returns {Promise<string>} Portal session URL
 */
export async function createBillingPortalSession(customerId, returnUrl) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return session.url;

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw new Error(`Failed to create billing portal session: ${error.message}`);
  }
}

/**
 * Gets customer's current subscription information
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<object>} Subscription details
 */
export async function getCustomerSubscription(customerId) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subscription = subscriptions.data[0];
    const planTier = subscription.metadata?.plan_tier || 'unknown';

    return {
      id: subscription.id,
      status: subscription.status,
      plan_tier: planTier,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      items: subscription.items.data.map(item => ({
        id: item.id,
        price_id: item.price.id,
        quantity: item.quantity
      }))
    };

  } catch (error) {
    console.error('Error fetching customer subscription:', error);
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }
}

/**
 * Retrieves usage records for a customer
 * @param {string} subscriptionItemId - Subscription item ID
 * @param {Date} startDate - Start date for usage
 * @param {Date} endDate - End date for usage
 * @returns {Promise<Array>} Usage records
 */
export async function getUsageRecords(subscriptionItemId, startDate, endDate) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId,
      {
        start_date: Math.floor(startDate.getTime() / 1000),
        end_date: Math.floor(endDate.getTime() / 1000)
      }
    );

    return usageRecords.data;

  } catch (error) {
    console.error('Error fetching usage records:', error);
    throw new Error(`Failed to fetch usage records: ${error.message}`);
  }
}

/**
 * Webhook handler for Stripe events
 * Call this from your Stripe webhook endpoint
 *
 * Handles events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function handleStripeWebhook(event) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  console.log(`Processing Stripe webhook: ${event.type}`);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // Handle subscription creation/update
      const subscription = event.data.object;
      // Update user's quota in database
      // This would sync with your api_quotas table
      console.log(`Subscription ${event.type}:`, subscription.id);
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      const deletedSub = event.data.object;
      // Disable API access or downgrade to free tier
      console.log(`Subscription deleted:`, deletedSub.id);
      break;

    case 'invoice.payment_succeeded':
      // Payment successful
      const invoice = event.data.object;
      console.log(`Invoice paid:`, invoice.id);
      break;

    case 'invoice.payment_failed':
      // Payment failed
      const failedInvoice = event.data.object;
      console.log(`Invoice payment failed:`, failedInvoice.id);
      // Notify user or suspend API access
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true };
}

/**
 * Calculates estimated cost for a given usage
 * @param {string} planTier - Plan tier
 * @param {number} conversions - Number of conversions
 * @returns {object} Cost breakdown
 */
export function calculateCost(planTier, conversions) {
  const config = API_PLAN_CONFIGS[planTier];

  if (!config) {
    throw new Error(`Invalid plan tier: ${planTier}`);
  }

  const baseCost = config.price || 0;
  const includedConversions = config.included_conversions;

  let overageConversions = 0;
  let overageCost = 0;

  if (includedConversions >= 0 && conversions > includedConversions) {
    overageConversions = conversions - includedConversions;
    overageCost = overageConversions * config.overage_rate;
  } else if (includedConversions === 0) {
    // Pay-as-you-go
    overageConversions = conversions;
    overageCost = conversions * config.overage_rate;
  }

  const totalCost = baseCost + overageCost;

  return {
    base_cost: baseCost,
    included_conversions: includedConversions,
    actual_conversions: conversions,
    overage_conversions: overageConversions,
    overage_rate: config.overage_rate,
    overage_cost: overageCost,
    total_cost: totalCost,
    currency: config.currency
  };
}
