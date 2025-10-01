/**
 * Analytics Service for Statement Desk
 *
 * Handles all analytics tracking including:
 * - Page view tracking
 * - Session management
 * - Custom event tracking
 * - Device/browser detection
 * - UTM parameter extraction
 *
 * This service is designed to be privacy-friendly and non-blocking.
 * All tracking happens asynchronously and failures are silently handled.
 */

import { createClient } from '@/lib/supabase/client'

class AnalyticsService {
  constructor() {
    this.supabase = null
    this.initialized = false
    this.sessionId = null
    this.visitorId = null
    this.currentUserId = null
    this.currentPagePath = null
    this.pageStartTime = null

    // Configuration
    this.enableTracking = true // Set to false to disable all tracking
    this.sessionTimeout = 30 * 60 * 1000 // 30 minutes in milliseconds
  }

  /**
   * Initialize the analytics service
   * Should be called once when the app loads
   */
  async init() {
    if (this.initialized) return

    try {
      // Initialize Supabase client
      this.supabase = createClient()

      // Get or create visitor ID (persistent across sessions)
      this.visitorId = this.getOrCreateVisitorId()

      // Get or create session ID (expires after 30 min of inactivity)
      this.sessionId = this.getOrCreateSessionId()

      // Get current user if authenticated
      await this.updateCurrentUser()

      this.initialized = true
      console.log('[Analytics] Service initialized', {
        visitorId: this.visitorId,
        sessionId: this.sessionId
      })
    } catch (error) {
      console.error('[Analytics] Initialization error:', error)
      // Don't throw - analytics should never break the app
    }
  }

  /**
   * Get or create a persistent visitor ID
   * Stored in localStorage, persists across sessions
   */
  getOrCreateVisitorId() {
    if (typeof window === 'undefined') return null

    let visitorId = localStorage.getItem('sd_visitor_id')

    if (!visitorId) {
      visitorId = this.generateId()
      localStorage.setItem('sd_visitor_id', visitorId)
    }

    return visitorId
  }

  /**
   * Get or create a session ID
   * Stored in sessionStorage, expires when browser tab closes
   * Also implements timeout-based expiration
   */
  getOrCreateSessionId() {
    if (typeof window === 'undefined') return null

    // Check for existing session
    const storedSession = sessionStorage.getItem('sd_session')

    if (storedSession) {
      try {
        const { id, timestamp } = JSON.parse(storedSession)
        const now = Date.now()

        // Check if session is still valid (within timeout period)
        if (now - timestamp < this.sessionTimeout) {
          // Update timestamp to extend session
          sessionStorage.setItem('sd_session', JSON.stringify({
            id,
            timestamp: now
          }))
          return id
        }
      } catch (error) {
        console.error('[Analytics] Session parse error:', error)
      }
    }

    // Create new session
    const newSessionId = this.generateId()
    sessionStorage.setItem('sd_session', JSON.stringify({
      id: newSessionId,
      timestamp: Date.now()
    }))

    return newSessionId
  }

  /**
   * Generate a unique ID for visitor/session
   * Uses crypto API for randomness
   */
  generateId() {
    if (typeof window === 'undefined') return null

    // Use crypto.randomUUID if available (modern browsers)
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }

    // Fallback: generate random string
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Update the current user ID from Supabase auth
   */
  async updateCurrentUser() {
    if (!this.supabase) return

    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      this.currentUserId = user?.id || null
    } catch (error) {
      console.error('[Analytics] Error fetching user:', error)
    }
  }

  /**
   * Track a page view
   * Called automatically on route changes
   *
   * @param {string} pagePath - The current page path (e.g., '/dashboard')
   * @param {string} pageTitle - The page title
   */
  async trackPageView(pagePath, pageTitle = '') {
    if (!this.enableTracking || !this.initialized) return

    try {
      // Update current user (in case they just logged in)
      await this.updateCurrentUser()

      // Save previous page duration if exists
      if (this.currentPagePath && this.pageStartTime) {
        await this.updatePageDuration(
          this.currentPagePath,
          Math.floor((Date.now() - this.pageStartTime) / 1000)
        )
      }

      // Extract UTM parameters from URL
      const utmParams = this.extractUtmParams()

      // Get device/browser info
      const deviceInfo = this.getDeviceInfo()

      // Get referrer
      const referrer = typeof window !== 'undefined' ? document.referrer : ''

      // Insert page view
      const { error: pageViewError } = await this.supabase
        .from('page_views')
        .insert({
          user_id: this.currentUserId,
          session_id: this.sessionId,
          visitor_id: this.visitorId,
          page_path: pagePath,
          page_title: pageTitle,
          referrer: referrer,
          ...utmParams,
          ...deviceInfo,
        })

      if (pageViewError) {
        console.error('[Analytics] Page view insert error:', pageViewError)
      }

      // Update session stats using RPC function
      // This is more efficient than doing multiple queries
      const { error: sessionError } = await this.supabase
        .rpc('update_session_stats', {
          p_session_id: this.sessionId,
          p_visitor_id: this.visitorId,
          p_user_id: this.currentUserId,
          p_page_path: pagePath,
          p_utm_source: utmParams.utm_source,
          p_utm_medium: utmParams.utm_medium,
          p_utm_campaign: utmParams.utm_campaign,
          p_referrer: referrer,
          p_device_type: deviceInfo.device_type,
          p_browser: deviceInfo.browser,
          p_operating_system: deviceInfo.operating_system,
        })

      if (sessionError) {
        console.error('[Analytics] Session update error:', sessionError)
      }

      // Update tracking state
      this.currentPagePath = pagePath
      this.pageStartTime = Date.now()

    } catch (error) {
      console.error('[Analytics] Track page view error:', error)
      // Never throw - analytics should not break the app
    }
  }

  /**
   * Update the duration of the previous page view
   * Called when navigating to a new page
   */
  async updatePageDuration(pagePath, duration) {
    if (!this.supabase) return

    try {
      // Find the most recent page view for this session/page
      const { error } = await this.supabase
        .from('page_views')
        .update({ view_duration: duration })
        .eq('session_id', this.sessionId)
        .eq('page_path', pagePath)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('[Analytics] Duration update error:', error)
      }
    } catch (error) {
      console.error('[Analytics] Duration update error:', error)
    }
  }

  /**
   * Track a custom event
   *
   * @param {string} eventName - Name of the event (e.g., 'pdf_upload')
   * @param {string} eventCategory - Category (e.g., 'conversion', 'engagement')
   * @param {string} eventLabel - Optional label for additional context
   * @param {number} eventValue - Optional numeric value
   * @param {object} metadata - Optional additional data
   */
  async trackEvent(eventName, eventCategory = 'general', eventLabel = '', eventValue = null, metadata = {}) {
    if (!this.enableTracking || !this.initialized) return

    try {
      await this.updateCurrentUser()

      const { error } = await this.supabase
        .from('analytics_events')
        .insert({
          user_id: this.currentUserId,
          session_id: this.sessionId,
          visitor_id: this.visitorId,
          event_name: eventName,
          event_category: eventCategory,
          event_label: eventLabel,
          event_value: eventValue,
          metadata: metadata,
          page_path: this.currentPagePath,
        })

      if (error) {
        console.error('[Analytics] Event tracking error:', error)
      }

      console.log('[Analytics] Event tracked:', eventName)
    } catch (error) {
      console.error('[Analytics] Track event error:', error)
    }
  }

  /**
   * Extract UTM parameters from current URL
   * Returns object with utm_source, utm_medium, etc.
   */
  extractUtmParams() {
    if (typeof window === 'undefined') return {}

    const params = new URLSearchParams(window.location.search)

    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_term: params.get('utm_term') || null,
      utm_content: params.get('utm_content') || null,
    }
  }

  /**
   * Get device and browser information
   * Uses User-Agent parsing (simple approach)
   */
  getDeviceInfo() {
    if (typeof window === 'undefined') {
      return {
        device_type: 'unknown',
        browser: 'unknown',
        operating_system: 'unknown',
        screen_resolution: null,
      }
    }

    const ua = window.navigator.userAgent

    // Detect device type
    let deviceType = 'desktop'
    if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
      deviceType = 'mobile'
    } else if (/iPad|Tablet/i.test(ua)) {
      deviceType = 'tablet'
    }

    // Detect browser
    let browser = 'unknown'
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'chrome'
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'safari'
    } else if (ua.includes('Firefox')) {
      browser = 'firefox'
    } else if (ua.includes('Edg')) {
      browser = 'edge'
    }

    // Detect OS
    let os = 'unknown'
    if (ua.includes('Windows')) {
      os = 'windows'
    } else if (ua.includes('Mac OS')) {
      os = 'macos'
    } else if (ua.includes('Linux')) {
      os = 'linux'
    } else if (ua.includes('Android')) {
      os = 'android'
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'ios'
    }

    // Get screen resolution
    const screenResolution = window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : null

    return {
      device_type: deviceType,
      browser: browser,
      operating_system: os,
      screen_resolution: screenResolution,
    }
  }

  /**
   * Helper: Track conversion events (sign up, upload, export, subscribe)
   * These are important for funnel analysis
   */
  async trackConversion(conversionType, metadata = {}) {
    return this.trackEvent(
      conversionType,
      'conversion',
      '',
      null,
      metadata
    )
  }

  /**
   * Helper: Track feature usage
   */
  async trackFeatureUsage(featureName, metadata = {}) {
    return this.trackEvent(
      featureName,
      'feature_usage',
      '',
      null,
      metadata
    )
  }

  /**
   * Helper: Track engagement events (time spent, interactions, etc.)
   */
  async trackEngagement(engagementType, value = null, metadata = {}) {
    return this.trackEvent(
      engagementType,
      'engagement',
      '',
      value,
      metadata
    )
  }

  /**
   * Clean up when user leaves the page
   * Updates final page duration
   */
  async cleanup() {
    if (this.currentPagePath && this.pageStartTime) {
      const duration = Math.floor((Date.now() - this.pageStartTime) / 1000)
      await this.updatePageDuration(this.currentPagePath, duration)
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService()

// Initialize on import (client-side only)
if (typeof window !== 'undefined') {
  analyticsService.init()

  // Track page unload to capture final duration
  window.addEventListener('beforeunload', () => {
    analyticsService.cleanup()
  })
}

export default analyticsService
