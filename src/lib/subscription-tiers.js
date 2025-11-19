import { STRIPE_PRODUCTS } from './stripe/config'

// Centralized Subscription Tiers Configuration
// Updated: January 2025 - New market-validated pricing structure

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
    features: [
      '5 conversions per month', // UPDATED: Was 10, now 5
      'Files up to 10MB',
      'Basic CSV export',
      'Email support',
      'Basic AI recognition'
    ],
    limits: {
      monthlyConversions: 5, // UPDATED: Was 10, now 5
      maxFileSize: 10 * 1024 * 1024, // 10MB
      exportFormats: ['csv'],
      bulkUploadLimit: 1,
      teamMembers: 1,
      xeroAccess: false,
      bulkXeroExport: false,
      quickbooksAccess: false
    }
  },
  professional: {
    name: 'Professional',
    price: 19, // UPDATED: Was 49, now 19
    yearlyPrice: 182.40, // UPDATED: Was 470, now 182.40 (save 20%)
    monthlyPriceId: 'price_1SRj6zCXTM9N40b8nYW5rOQ8', // NEW price ID
    yearlyPriceId: 'price_1SRj74CXTM9N40b8lZq75u6Q', // NEW price ID
    stripePriceId: 'price_1SRj6zCXTM9N40b8nYW5rOQ8', // Default to monthly
    popular: true, // NEW: Mark as most popular tier
    features: STRIPE_PRODUCTS.professional.features,
    limits: {
      monthlyConversions: STRIPE_PRODUCTS.professional.limits.conversionsPerMonth, // 500
      maxFileSize: 50 * 1024 * 1024, // 50MB
      exportFormats: ['csv', 'xlsx'],
      bulkUploadLimit: STRIPE_PRODUCTS.professional.limits.bulkUploadLimit, // 10
      teamMembers: STRIPE_PRODUCTS.professional.limits.teamMembers, // 1
      xeroAccess: true,
      bulkXeroExport: false,
      quickbooksAccess: true
    },
    trial: {
      days: 7,
      requiresCreditCard: true
    }
  },
  business: {
    name: 'Business',
    price: 49, // UPDATED: Was 99, now 49
    yearlyPrice: 470, // UPDATED: Was 950, now 470 (save 20%)
    monthlyPriceId: STRIPE_PRODUCTS.business.prices.monthly.id,
    yearlyPriceId: STRIPE_PRODUCTS.business.prices.yearly.id,
    stripePriceId: STRIPE_PRODUCTS.business.prices.monthly.id,
    features: STRIPE_PRODUCTS.business.features,
    limits: {
      monthlyConversions: STRIPE_PRODUCTS.business.limits.conversionsPerMonth, // 2000
      maxFileSize: 100 * 1024 * 1024, // 100MB
      exportFormats: ['csv', 'xlsx', 'json'],
      bulkUploadLimit: STRIPE_PRODUCTS.business.limits.bulkUploadLimit, // 50
      teamMembers: STRIPE_PRODUCTS.business.limits.teamMembers, // 5 - UPDATED: Multi-user access
      xeroAccess: true,
      bulkXeroExport: true,
      quickbooksAccess: true
    },
    trial: {
      days: 7,
      requiresCreditCard: true
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    stripePriceId: null,
    features: STRIPE_PRODUCTS.enterprise.features,
    limits: {
      monthlyConversions: -1, // unlimited
      maxFileSize: 500 * 1024 * 1024, // 500MB
      exportFormats: ['csv', 'xlsx', 'json', 'xml'],
      bulkUploadLimit: -1, // unlimited
      teamMembers: -1, // unlimited
      xeroAccess: true,
      bulkXeroExport: true,
      xeroOrganizations: -1, // unlimited
      quickbooksAccess: true
    },
    contactSales: true
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
  if (isLocalDev()) return true // Bypass for local development

  const limits = getTierLimits(tierName)

  if (limits.monthlyConversions === -1) return true // unlimited

  return currentUsage < limits.monthlyConversions
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

// Local development bypass
const isLocalDev = () => {
  return process.env.NODE_ENV === 'development' ||
         process.env.NEXT_PUBLIC_BYPASS_PREMIUM === 'true'
}

// Helper to check Xero access
export function hasXeroAccess(tierName) {
  if (isLocalDev()) return true // Bypass for local development
  const limits = getTierLimits(tierName)
  return limits.xeroAccess === true
}

// Helper to check bulk Xero export access
export function hasBulkXeroExport(tierName) {
  if (isLocalDev()) return true // Bypass for local development
  const limits = getTierLimits(tierName)
  return limits.bulkXeroExport === true
}

// Helper to get Xero organization limit
export function getXeroOrganizationLimit(tierName) {
  const limits = getTierLimits(tierName)
  return limits.xeroOrganizations || 1
}

// Helper to get monthly equivalent for yearly plans
export function getMonthlyEquivalent(tierName) {
  const tier = SUBSCRIPTION_TIERS[tierName]
  if (!tier || !tier.yearlyPrice || typeof tier.yearlyPrice !== 'number') return null

  return (tier.yearlyPrice / 12).toFixed(2)
}

// Helper to check if tier has trial period
export function hasTrialPeriod(tierName) {
  const tier = SUBSCRIPTION_TIERS[tierName]
  return tier?.trial?.days > 0
}

// Helper to get trial days
export function getTrialDays(tierName) {
  const tier = SUBSCRIPTION_TIERS[tierName]
  return tier?.trial?.days || 0
}

// Helper to check QuickBooks access
export function hasQuickBooksAccess(tierName) {
  if (isLocalDev()) return true // Bypass for local development
  const limits = getTierLimits(tierName)
  return limits.quickbooksAccess === true
}
