// Stripe Products & Pricing Configuration
// Updated: January 2025 - New market-validated pricing structure

export const STRIPE_PRODUCTS = {
  // Professional Plan - MOST POPULAR ⭐
  // NEW PRICING: $19/month (was $49)
  professional: {
    productId: 'prod_SvAiSMpM6lf588',
    name: 'Statement Converter - Professional',
    prices: {
      monthly: {
        id: 'price_1SRj6zCXTM9N40b8nYW5rOQ8', // NEW: $19/month
        amount: 1900, // $19.00
        interval: 'month'
      },
      yearly: {
        id: 'price_1SRj74CXTM9N40b8lZq75u6Q', // NEW: $182.40/year (save 20%)
        amount: 18240, // $182.40 ($15.20/month)
        interval: 'year'
      }
    },
    features: [
      '500 conversions/month',
      'Advanced AI recognition',
      'Google Sheets integration',
      'Xero integration (single file export)',
      'Bulk processing (up to 10 files)',
      'AI transaction categorization',
      'Merchant name normalization',
      'Priority support'
    ],
    limits: {
      conversionsPerMonth: 500,
      bulkUploadLimit: 10,
      teamMembers: 1
    },
    trial: {
      days: 7,
      requiresCreditCard: true
    },
    popular: true // Mark as most popular tier
  },

  // Business Plan
  // NEW PRICING: $49/month (was $99)
  business: {
    productId: 'prod_SvAiCrAtIqAEhn',
    name: 'Statement Converter - Business',
    prices: {
      monthly: {
        id: 'price_1RzKNRCXTM9N40b8opWJUOtu', // $49/month
        amount: 4900, // $49.00
        interval: 'month'
      },
      yearly: {
        id: 'price_1RzKNYCXTM9N40b8km4hhRkP', // $470/year (save 20%)
        amount: 47000, // $470.00 ($39.17/month)
        interval: 'year'
      }
    },
    features: [
      '2000 conversions/month',
      'Everything in Professional',
      'AI cash flow forecasting',
      'AI budget recommendations',
      'Spending trend analysis',
      'Financial assistant chatbot',
      'Multi-user access (up to 5 users)',
      'Bulk export to Xero (multiple files)',
      'Dedicated support'
    ],
    limits: {
      conversionsPerMonth: 2000,
      bulkUploadLimit: 50,
      teamMembers: 5 // NEW: Multi-user access
    },
    trial: {
      days: 7,
      requiresCreditCard: true
    }
  },

  // Enterprise Plan (Custom Pricing)
  enterprise: {
    productId: 'prod_SvAj60HACNgwDc',
    name: 'Statement Converter - Enterprise',
    prices: {
      custom: true
    },
    features: [
      'Unlimited conversions',
      'Everything in Business',
      'White-label options',
      'Custom integrations',
      'API access',
      'Training session included',
      'Dedicated account manager',
      'SLA guarantees'
    ],
    limits: {
      conversionsPerMonth: null, // Unlimited
      apiCallsPerMonth: null, // Unlimited
      bulkUploadLimit: null, // Unlimited
      teamMembers: null // Unlimited
    },
    contactSales: true
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

// Helper to get monthly equivalent price for yearly plans
export function getMonthlyEquivalent(planType) {
  const plan = STRIPE_PRODUCTS[planType];
  if (!plan || plan.prices.custom) return null;

  const yearlyAmount = plan.prices.yearly?.amount;
  if (!yearlyAmount) return null;

  return (yearlyAmount / 12 / 100).toFixed(2); // Convert cents to dollars
}
