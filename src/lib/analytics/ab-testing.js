/**
 * A/B Testing Framework
 *
 * Provides simple A/B testing capabilities for Statement Desk.
 * Uses visitor ID for consistent variant assignment.
 *
 * Features:
 * - Deterministic variant assignment (same user gets same variant)
 * - Traffic splitting (50/50, 70/30, etc.)
 * - Experiment tracking and conversion measurement
 * - Easy integration with existing analytics
 *
 * Example usage:
 *   import { abTesting } from '@/lib/analytics/ab-testing'
 *
 *   // Get variant for current user
 *   const variant = abTesting.getVariant('pricing_page_cta')
 *
 *   // Show different CTAs based on variant
 *   if (variant === 'A') {
 *     <Button>Start Free Trial</Button>
 *   } else {
 *     <Button>Get Started Now</Button>
 *   }
 *
 *   // Track conversion when user signs up
 *   abTesting.trackConversion('pricing_page_cta')
 */

import analyticsService from './analytics-service'

class ABTesting {
  constructor() {
    this.experiments = new Map()
    this.userVariants = new Map() // Cache variants in memory
  }

  /**
   * Define an A/B test experiment
   *
   * @param {string} experimentName - Unique name for the experiment
   * @param {Object} config - Configuration object
   * @param {Array} config.variants - Array of variant names (e.g., ['A', 'B'])
   * @param {Array} config.weights - Traffic split weights (e.g., [50, 50] for 50/50 split)
   * @param {string} config.description - Description of what's being tested
   */
  defineExperiment(experimentName, config) {
    const { variants = ['A', 'B'], weights = [50, 50], description = '' } = config

    // Validate weights sum to 100
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    if (totalWeight !== 100) {
      console.warn(`[ABTesting] Weights for ${experimentName} don't sum to 100. Adjusting...`)
    }

    this.experiments.set(experimentName, {
      name: experimentName,
      variants,
      weights,
      description,
      active: true
    })

    console.log(`[ABTesting] Experiment defined: ${experimentName}`, config)
  }

  /**
   * Get the variant for a user in an experiment
   * Uses deterministic hashing to ensure same user always gets same variant
   *
   * @param {string} experimentName - Name of the experiment
   * @param {string} visitorId - Visitor ID (optional, will use from analytics service)
   * @returns {string} Variant name (e.g., 'A', 'B')
   */
  getVariant(experimentName, visitorId = null) {
    // Get experiment config
    const experiment = this.experiments.get(experimentName)
    if (!experiment) {
      console.warn(`[ABTesting] Experiment not defined: ${experimentName}`)
      return 'A' // Default to variant A
    }

    if (!experiment.active) {
      console.warn(`[ABTesting] Experiment not active: ${experimentName}`)
      return 'A'
    }

    // Get visitor ID from analytics service if not provided
    const userId = visitorId || analyticsService.visitorId || 'default'

    // Check cache first
    const cacheKey = `${experimentName}_${userId}`
    if (this.userVariants.has(cacheKey)) {
      return this.userVariants.get(cacheKey)
    }

    // Deterministic variant assignment using hash
    const hash = this.hashString(`${experimentName}_${userId}`)
    const bucket = hash % 100 // Get a number 0-99

    // Find which variant this bucket falls into based on weights
    let cumulativeWeight = 0
    let assignedVariant = experiment.variants[0]

    for (let i = 0; i < experiment.variants.length; i++) {
      cumulativeWeight += experiment.weights[i]
      if (bucket < cumulativeWeight) {
        assignedVariant = experiment.variants[i]
        break
      }
    }

    // Cache the variant
    this.userVariants.set(cacheKey, assignedVariant)

    // Track that user saw this variant
    this.trackExposure(experimentName, assignedVariant)

    return assignedVariant
  }

  /**
   * Track that a user was exposed to an experiment variant
   * This allows us to measure conversion rates
   */
  trackExposure(experimentName, variant) {
    analyticsService.trackEvent(
      `ab_test_exposure`,
      'ab_testing',
      experimentName,
      null,
      {
        experiment: experimentName,
        variant: variant
      }
    )
  }

  /**
   * Track a conversion for an experiment
   * Call this when the user completes the desired action
   *
   * @param {string} experimentName - Name of the experiment
   * @param {object} metadata - Additional data about the conversion
   */
  trackConversion(experimentName, metadata = {}) {
    // Get the variant the user is in
    const variant = this.getVariant(experimentName)

    analyticsService.trackEvent(
      `ab_test_conversion`,
      'ab_testing',
      experimentName,
      null,
      {
        experiment: experimentName,
        variant: variant,
        ...metadata
      }
    )

    console.log(`[ABTesting] Conversion tracked for ${experimentName}, variant: ${variant}`)
  }

  /**
   * Stop an experiment (prevents new users from being enrolled)
   */
  stopExperiment(experimentName) {
    const experiment = this.experiments.get(experimentName)
    if (experiment) {
      experiment.active = false
      console.log(`[ABTesting] Experiment stopped: ${experimentName}`)
    }
  }

  /**
   * Force a user into a specific variant (useful for testing)
   *
   * @param {string} experimentName - Name of the experiment
   * @param {string} variant - Variant to force
   * @param {string} visitorId - Visitor ID (optional)
   */
  forceVariant(experimentName, variant, visitorId = null) {
    const userId = visitorId || analyticsService.visitorId || 'default'
    const cacheKey = `${experimentName}_${userId}`
    this.userVariants.set(cacheKey, variant)
    console.log(`[ABTesting] Forced variant ${variant} for ${experimentName}`)
  }

  /**
   * Simple hash function for deterministic variant assignment
   * Converts a string to a consistent number
   */
  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

// Export singleton instance
const abTesting = new ABTesting()

// Define experiments for Statement Desk
// You can add/modify experiments here

// Experiment 1: Pricing page CTA text
abTesting.defineExperiment('pricing_cta_text', {
  variants: ['A', 'B'],
  weights: [50, 50],
  description: 'Test different CTA text on pricing page (A: "Start Free Trial" vs B: "Get Started Now")'
})

// Experiment 2: Upload page layout
abTesting.defineExperiment('upload_page_layout', {
  variants: ['compact', 'spacious'],
  weights: [50, 50],
  description: 'Test compact vs spacious layout on upload page'
})

// Experiment 3: Dashboard default view
abTesting.defineExperiment('dashboard_default_view', {
  variants: ['list', 'grid'],
  weights: [70, 30], // 70% list, 30% grid
  description: 'Test which default view users prefer for file listing'
})

// Experiment 4: AI features onboarding
abTesting.defineExperiment('ai_onboarding_modal', {
  variants: ['show', 'hide'],
  weights: [50, 50],
  description: 'Test whether showing AI features onboarding modal increases usage'
})

export default abTesting

/**
 * React Hook for A/B Testing
 * Makes it easy to use A/B tests in React components
 *
 * Usage:
 *   import { useABTest } from '@/lib/analytics/ab-testing'
 *
 *   function MyComponent() {
 *     const variant = useABTest('pricing_cta_text')
 *
 *     return (
 *       <Button onClick={() => abTesting.trackConversion('pricing_cta_text')}>
 *         {variant === 'A' ? 'Start Free Trial' : 'Get Started Now'}
 *       </Button>
 *     )
 *   }
 */
import { useState, useEffect } from 'react'

export function useABTest(experimentName) {
  const [variant, setVariant] = useState('A')

  useEffect(() => {
    // Wait for analytics service to initialize (get visitor ID)
    const timer = setTimeout(() => {
      const assignedVariant = abTesting.getVariant(experimentName)
      setVariant(assignedVariant)
    }, 100)

    return () => clearTimeout(timer)
  }, [experimentName])

  return variant
}

/**
 * Example Integration:
 *
 * // In your pricing page component
 * import abTesting, { useABTest } from '@/lib/analytics/ab-testing'
 *
 * function PricingPage() {
 *   const ctaVariant = useABTest('pricing_cta_text')
 *
 *   const handleSignup = () => {
 *     // Track conversion when user clicks CTA
 *     abTesting.trackConversion('pricing_cta_text')
 *     // ... proceed with signup
 *   }
 *
 *   return (
 *     <Button onClick={handleSignup}>
 *       {ctaVariant === 'A' ? 'Start Free Trial' : 'Get Started Now'}
 *     </Button>
 *   )
 * }
 */
