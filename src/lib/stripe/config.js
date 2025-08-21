// Stripe Products & Pricing Configuration

export const STRIPE_PRODUCTS = {
  // Professional Plan
  professional: {
    productId: 'prod_SsWqt9lxfaItVe',
    name: 'Statement Converter - Professional',
    prices: {
      monthly: {
        id: 'price_1RwlmXANbh9FIPlH8aJ46s1s',
        amount: 4900, // $49.00
        interval: 'month'
      },
      yearly: {
        id: 'price_1RwlnAANbh9FIPlH9puYXjoF',
        amount: 47000, // $470.00 (20% discount)
        interval: 'year'
      }
    },
    features: [
      '500 conversions/month',
      'Advanced AI recognition',
      'Google Sheets integration',
      'Bulk processing (up to 10 files)',
      'Transaction categorization',
      'Priority support',
      'API access (100 calls/month)'
    ],
    limits: {
      conversionsPerMonth: 500,
      apiCallsPerMonth: 100,
      bulkUploadLimit: 10,
      teamMembers: 1
    }
  },

  // Business Plan
  business: {
    productId: 'prod_SsWqa9NJI5aXbG',
    name: 'Statement Converter - Business',
    prices: {
      monthly: {
        id: 'price_1RwlmoANbh9FIPlHw0jOA66A',
        amount: 9900, // $99.00
        interval: 'month'
      },
      yearly: {
        id: 'price_1RwlnIANbh9FIPlHTulM4kCC',
        amount: 95000, // $950.00 (20% discount)
        interval: 'year'
      }
    },
    features: [
      '2000 conversions/month',
      'Everything in Professional',
      'White-label options',
      'Team collaboration (5 users)',
      'Advanced API (1000 calls/month)',
      'Custom integrations',
      'Dedicated support',
      'Training session included'
    ],
    limits: {
      conversionsPerMonth: 2000,
      apiCallsPerMonth: 1000,
      bulkUploadLimit: 50,
      teamMembers: 5
    }
  },

  // Enterprise Plan (Custom Pricing)
  enterprise: {
    productId: 'prod_SsWq8KPnOoSGoq',
    name: 'Statement Converter - Enterprise',
    prices: {
      custom: true
    },
    features: [
      'Unlimited conversions',
      'Unlimited users',
      'SLA guarantees',
      'Custom development',
      'On-premise option',
      'Dedicated account manager'
    ],
    limits: {
      conversionsPerMonth: null, // Unlimited
      apiCallsPerMonth: null, // Unlimited
      bulkUploadLimit: null, // Unlimited
      teamMembers: null // Unlimited
    }
  }
};

// Helper function to get price by plan and billing period
export function getPrice(planType, billingPeriod) {
  const plan = STRIPE_PRODUCTS[planType];
  if (!plan) return null;
  
  if (plan.prices.custom) {
    return { custom: true };
  }
  
  return plan.prices[billingPeriod];
}

// Helper function to check if user has access to a feature
export function hasFeatureAccess(userPlan, feature) {
  const plan = STRIPE_PRODUCTS[userPlan];
  if (!plan) return false;
  
  return plan.features.includes(feature);
}

// Helper function to check usage limits
export function checkUsageLimit(userPlan, limitType, currentUsage) {
  const plan = STRIPE_PRODUCTS[userPlan];
  if (!plan || !plan.limits) return false;
  
  const limit = plan.limits[limitType];
  if (limit === null) return true; // Unlimited
  
  return currentUsage < limit;
}