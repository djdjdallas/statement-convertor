/**
 * Conversion Funnel Tracker
 *
 * Tracks user progress through conversion funnels.
 * Helps identify where users drop off in the journey.
 *
 * Example usage:
 *   import { funnelTracker } from '@/lib/analytics/funnel-tracker'
 *
 *   // Track funnel step
 *   await funnelTracker.trackStep('onboarding', 'viewed_landing', metadata)
 *   await funnelTracker.trackStep('onboarding', 'started_signup', metadata)
 *   await funnelTracker.trackStep('onboarding', 'completed_signup', metadata)
 */

import { createClient } from '@/lib/supabase/client'
import analyticsService from './analytics-service'

class FunnelTracker {
  constructor() {
    this.supabase = null
    this.initialized = false
  }

  /**
   * Initialize the funnel tracker
   */
  async init() {
    if (this.initialized) return

    try {
      this.supabase = createClient()
      this.initialized = true
    } catch (error) {
      console.error('[FunnelTracker] Initialization error:', error)
    }
  }

  /**
   * Track a funnel step
   *
   * @param {string} funnelName - Name of the funnel (e.g., 'onboarding', 'export_flow')
   * @param {string} stepName - Name of the step (e.g., 'viewed_landing', 'completed_signup')
   * @param {object} metadata - Additional data about this step
   */
  async trackStep(funnelName, stepName, metadata = {}) {
    if (!this.initialized) {
      await this.init()
    }

    try {
      // Track as analytics event with special naming convention
      const eventName = `funnel_${funnelName}_${stepName}`

      await analyticsService.trackEvent(
        eventName,
        'conversion_funnel',
        funnelName,
        null,
        {
          funnel_name: funnelName,
          step_name: stepName,
          ...metadata
        }
      )

      console.log('[FunnelTracker] Step tracked:', funnelName, '->', stepName)
    } catch (error) {
      console.error('[FunnelTracker] Error tracking step:', error)
    }
  }

  /**
   * Get funnel completion data for a user
   * Shows which steps the user has completed
   *
   * @param {string} userId - User ID
   * @param {string} funnelName - Funnel name
   * @returns {Promise<Object>} Object with completion status for each step
   */
  async getUserFunnelProgress(userId, funnelName) {
    if (!this.initialized) {
      await this.init()
    }

    try {
      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('event_name, created_at, metadata')
        .eq('user_id', userId)
        .eq('event_category', 'conversion_funnel')
        .like('event_name', `funnel_${funnelName}_%`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[FunnelTracker] Error fetching funnel progress:', error)
        return {}
      }

      // Convert to a map of step name -> completion data
      const progress = {}
      data.forEach(event => {
        const stepName = event.event_name.replace(`funnel_${funnelName}_`, '')
        progress[stepName] = {
          completed: true,
          timestamp: event.created_at,
          metadata: event.metadata
        }
      })

      return progress
    } catch (error) {
      console.error('[FunnelTracker] Error getting funnel progress:', error)
      return {}
    }
  }

  /**
   * Check if user completed a specific funnel step
   *
   * @param {string} userId - User ID
   * @param {string} funnelName - Funnel name
   * @param {string} stepName - Step name
   * @returns {Promise<boolean>} True if step completed
   */
  async hasCompletedStep(userId, funnelName, stepName) {
    const progress = await this.getUserFunnelProgress(userId, funnelName)
    return progress[stepName]?.completed || false
  }
}

// Export singleton instance
export const funnelTracker = new FunnelTracker()

// Predefined funnels for Statement Desk
export const FUNNELS = {
  ONBOARDING: {
    name: 'onboarding',
    steps: [
      { name: 'visited_landing', label: 'Visited Landing Page' },
      { name: 'started_signup', label: 'Started Signup' },
      { name: 'completed_signup', label: 'Completed Signup' },
      { name: 'verified_email', label: 'Verified Email' },
      { name: 'visited_dashboard', label: 'Visited Dashboard' }
    ]
  },

  FIRST_CONVERSION: {
    name: 'first_conversion',
    steps: [
      { name: 'viewed_upload_page', label: 'Viewed Upload Page' },
      { name: 'uploaded_file', label: 'Uploaded First File' },
      { name: 'processed_file', label: 'Processed File' },
      { name: 'viewed_results', label: 'Viewed Results' },
      { name: 'exported_data', label: 'Exported Data' }
    ]
  },

  SUBSCRIPTION: {
    name: 'subscription',
    steps: [
      { name: 'viewed_pricing', label: 'Viewed Pricing' },
      { name: 'selected_plan', label: 'Selected Plan' },
      { name: 'started_checkout', label: 'Started Checkout' },
      { name: 'completed_payment', label: 'Completed Payment' },
      { name: 'subscription_active', label: 'Subscription Active' }
    ]
  },

  AI_ADOPTION: {
    name: 'ai_adoption',
    steps: [
      { name: 'viewed_ai_features', label: 'Viewed AI Features' },
      { name: 'first_ai_processing', label: 'First AI Processing' },
      { name: 'viewed_ai_insights', label: 'Viewed AI Insights' },
      { name: 'used_ai_chat', label: 'Used AI Chat' },
      { name: 'ai_power_user', label: 'AI Power User (10+ queries)' }
    ]
  }
}

/**
 * Helper function to track common funnel steps
 */
export const trackFunnelStep = async (funnelName, stepName, metadata = {}) => {
  return funnelTracker.trackStep(funnelName, stepName, metadata)
}

/**
 * Example usage in components:
 *
 * // In landing page
 * trackFunnelStep('onboarding', 'visited_landing')
 *
 * // In signup form
 * trackFunnelStep('onboarding', 'started_signup')
 *
 * // After successful signup
 * trackFunnelStep('onboarding', 'completed_signup', { plan: 'free' })
 *
 * // In upload page
 * trackFunnelStep('first_conversion', 'viewed_upload_page')
 *
 * // After file upload
 * trackFunnelStep('first_conversion', 'uploaded_file', { fileId: '...' })
 */
