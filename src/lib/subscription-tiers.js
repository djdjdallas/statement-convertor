export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
    features: [
      '3 file conversions per month',
      'Files up to 10MB',
      'Basic CSV export',
      'Email support'
    ],
    limits: {
      monthlyConversions: 3,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      exportFormats: ['csv']
    }
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      'Unlimited file conversions',
      'Files up to 50MB',
      'CSV & Excel export',
      'Priority email support',
      'Bulk processing'
    ],
    limits: {
      monthlyConversions: -1, // unlimited
      maxFileSize: 50 * 1024 * 1024, // 50MB
      exportFormats: ['csv', 'xlsx']
    }
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Everything in Basic',
      'Files up to 100MB',
      'Custom transaction categories',
      'Advanced data filtering',
      'API access',
      'Priority support'
    ],
    limits: {
      monthlyConversions: -1, // unlimited
      maxFileSize: 100 * 1024 * 1024, // 100MB
      exportFormats: ['csv', 'xlsx'],
      apiAccess: true
    }
  }
}

export function getTierLimits(tierName) {
  return SUBSCRIPTION_TIERS[tierName]?.limits || SUBSCRIPTION_TIERS.free.limits
}

export function checkUsageLimit(tierName, currentUsage) {
  const limits = getTierLimits(tierName)
  
  if (limits.monthlyConversions === -1) return true // unlimited
  
  return currentUsage < limits.monthlyConversions
}

export function getMaxFileSize(tierName) {
  return getTierLimits(tierName).maxFileSize
}