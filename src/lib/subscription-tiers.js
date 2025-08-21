import { STRIPE_PRODUCTS } from './stripe/config'

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
    features: [
      '10 conversions per month',
      'Files up to 10MB',
      'Basic CSV export',
      'Email support',
      'Basic AI recognition'
    ],
    limits: {
      monthlyConversions: 10,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      exportFormats: ['csv'],
      apiAccess: false,
      bulkUploadLimit: 1,
      teamMembers: 1
    }
  },
  professional: {
    name: 'Professional',
    price: 49,
    monthlyPriceId: STRIPE_PRODUCTS.professional.prices.monthly.id,
    yearlyPriceId: STRIPE_PRODUCTS.professional.prices.yearly.id,
    stripePriceId: STRIPE_PRODUCTS.professional.prices.monthly.id, // Default to monthly for backwards compatibility
    features: STRIPE_PRODUCTS.professional.features,
    limits: {
      monthlyConversions: STRIPE_PRODUCTS.professional.limits.conversionsPerMonth,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      exportFormats: ['csv', 'xlsx'],
      apiAccess: true,
      apiCallsPerMonth: STRIPE_PRODUCTS.professional.limits.apiCallsPerMonth,
      bulkUploadLimit: STRIPE_PRODUCTS.professional.limits.bulkUploadLimit,
      teamMembers: STRIPE_PRODUCTS.professional.limits.teamMembers
    }
  },
  business: {
    name: 'Business',
    price: 99,
    monthlyPriceId: STRIPE_PRODUCTS.business.prices.monthly.id,
    yearlyPriceId: STRIPE_PRODUCTS.business.prices.yearly.id,
    stripePriceId: STRIPE_PRODUCTS.business.prices.monthly.id, // Default to monthly for backwards compatibility
    features: STRIPE_PRODUCTS.business.features,
    limits: {
      monthlyConversions: STRIPE_PRODUCTS.business.limits.conversionsPerMonth,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      exportFormats: ['csv', 'xlsx', 'json'],
      apiAccess: true,
      apiCallsPerMonth: STRIPE_PRODUCTS.business.limits.apiCallsPerMonth,
      bulkUploadLimit: STRIPE_PRODUCTS.business.limits.bulkUploadLimit,
      teamMembers: STRIPE_PRODUCTS.business.limits.teamMembers
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    stripePriceId: null, // Custom pricing through sales
    features: STRIPE_PRODUCTS.enterprise.features,
    limits: {
      monthlyConversions: -1, // unlimited
      maxFileSize: 500 * 1024 * 1024, // 500MB
      exportFormats: ['csv', 'xlsx', 'json', 'xml'],
      apiAccess: true,
      apiCallsPerMonth: -1, // unlimited
      bulkUploadLimit: -1, // unlimited
      teamMembers: -1 // unlimited
    }
  }
}

// Backwards compatibility aliases
export const SUBSCRIPTION_TIERS_LEGACY = {
  basic: SUBSCRIPTION_TIERS.professional,
  premium: SUBSCRIPTION_TIERS.business
}

export function getTierLimits(tierName) {
  // Check for legacy tier names
  if (tierName === 'basic') tierName = 'professional'
  if (tierName === 'premium') tierName = 'business'
  
  return SUBSCRIPTION_TIERS[tierName]?.limits || SUBSCRIPTION_TIERS.free.limits
}

export function checkUsageLimit(tierName, currentUsage) {
  const limits = getTierLimits(tierName)
  
  if (limits.monthlyConversions === -1) return true // unlimited
  
  return currentUsage < limits.monthlyConversions
}

export function checkApiUsageLimit(tierName, currentApiCalls) {
  const limits = getTierLimits(tierName)
  
  if (!limits.apiAccess) return false
  if (limits.apiCallsPerMonth === -1) return true // unlimited
  
  return currentApiCalls < limits.apiCallsPerMonth
}

export function getMaxFileSize(tierName) {
  return getTierLimits(tierName).maxFileSize
}

export function getBulkUploadLimit(tierName) {
  const limits = getTierLimits(tierName)
  return limits.bulkUploadLimit || 1
}

export function getTeamMemberLimit(tierName) {
  const limits = getTierLimits(tierName)
  return limits.teamMembers || 1
}

// Helper to get the appropriate price ID based on billing period
export function getPriceId(tierName, billingPeriod = 'monthly') {
  // Check for legacy tier names
  if (tierName === 'basic') tierName = 'professional'
  if (tierName === 'premium') tierName = 'business'
  
  const tier = SUBSCRIPTION_TIERS[tierName]
  if (!tier) return null
  
  if (tierName === 'free' || tierName === 'enterprise') return null
  
  if (billingPeriod === 'yearly' && tier.yearlyPriceId) {
    return tier.yearlyPriceId
  }
  
  return tier.monthlyPriceId || tier.stripePriceId
}