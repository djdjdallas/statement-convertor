# Stripe Setup Guide

This guide will help you set up Stripe payment processing for the Bank Statement Converter application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard
3. The application already deployed or running locally

## Step 1: Get Your Stripe Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers > API keys**
3. Copy your **Publishable key** and **Secret key**
4. For testing, use the test keys. For production, use live keys.

## Step 2: Create Products and Prices

### Create Basic Plan
1. Go to **Products** in your Stripe Dashboard
2. Click **Add product**
3. Fill in:
   - **Name**: "Basic Plan"
   - **Description**: "Unlimited conversions with basic features"
4. Click **Add pricing**
5. Set:
   - **Price**: $9.99
   - **Billing period**: Monthly
   - **Currency**: USD
6. Save and copy the **Price ID** (starts with `price_`)

### Create Premium Plan
1. Create another product called "Premium Plan"
2. Set price to $19.99/month
3. Copy the **Price ID**

## Step 3: Set Up Webhook

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL** to: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook secret** (starts with `whsec_`)

## Step 4: Update Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_BASIC_PRICE_ID=price_your_basic_price_id_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
```

## Step 5: Configure Customer Portal

1. Go to **Settings > Billing > Customer portal**
2. Enable the customer portal
3. Configure settings:
   - Allow customers to update payment methods: ✓
   - Allow customers to view invoice history: ✓
   - Allow customers to download invoices: ✓
   - Allow customers to cancel subscriptions: ✓ (optional)
4. Set the default return URL to: `https://yourdomain.com/dashboard`

## Step 6: Test the Integration

### Test Checkout Flow
1. Go to your pricing page
2. Click on a paid plan
3. Use Stripe's test card numbers:
   - **Success**: `4242424242424242`
   - **Decline**: `4000000000000002`
4. Complete the checkout process
5. Verify the webhook receives the events
6. Check that the user's subscription is updated in Supabase

### Test Customer Portal
1. Subscribe to a plan (using test mode)
2. Go to your dashboard
3. Click "Manage" on the subscription card
4. Verify you can update payment methods and view invoices

## Step 7: Production Setup

### For Production:
1. Switch to **Live mode** in Stripe Dashboard
2. Get your live API keys
3. Create live products and prices
4. Update webhook endpoint to production URL
5. Update environment variables with live keys
6. Test thoroughly before launch

## Troubleshooting

### Common Issues:

1. **Webhook not receiving events**
   - Check webhook URL is correct and accessible
   - Verify webhook secret matches
   - Check webhook logs in Stripe Dashboard

2. **Subscription not updating in database**
   - Check webhook handler logs
   - Verify Supabase connection
   - Ensure user metadata is correctly set

3. **Customer portal not working**
   - Verify customer has a valid Stripe customer ID
   - Check portal configuration in Stripe Dashboard
   - Ensure return URL is correct

### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Use the webhook secret provided by the CLI
```

## Security Notes

- Never expose your secret key in client-side code
- Always validate webhook signatures
- Use HTTPS in production
- Regularly rotate your API keys
- Monitor webhook delivery in production

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)