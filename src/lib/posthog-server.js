/**
 * PostHog Server-Side Analytics
 *
 * Use this for tracking events from API routes and server-side functions.
 * This helps monitor when key functions are working correctly for users.
 */

import { PostHog } from 'posthog-node'

let posthogClient = null

function getPostHogClient() {
  if (!posthogClient && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1, // Send events immediately
      flushInterval: 0
    })
  }
  return posthogClient
}

/**
 * Track a server-side event
 * @param {string} distinctId - User ID or anonymous ID
 * @param {string} event - Event name
 * @param {object} properties - Event properties
 */
export function trackServerEvent(distinctId, event, properties = {}) {
  const client = getPostHogClient()
  if (!client) {
    console.log('[PostHog] No client configured, skipping event:', event)
    return
  }

  try {
    client.capture({
      distinctId: distinctId || 'anonymous',
      event,
      properties: {
        ...properties,
        $lib: 'posthog-node',
        source: 'server'
      }
    })
  } catch (error) {
    console.error('[PostHog] Error tracking event:', error)
  }
}

/**
 * Track PDF processing events
 */
export function trackPdfProcessing(userId, data) {
  trackServerEvent(userId, 'pdf_processed', {
    file_id: data.fileId,
    transaction_count: data.transactionCount,
    bank_type: data.bankType,
    ai_enhanced: data.aiEnhanced,
    processing_time_ms: data.processingTime,
    success: data.success
  })
}

/**
 * Track export events
 */
export function trackExport(userId, data) {
  trackServerEvent(userId, 'file_exported', {
    file_id: data.fileId,
    format: data.format,
    transaction_count: data.transactionCount,
    destination: data.destination // 'download', 'xero', 'quickbooks'
  })
}

/**
 * Track sync events (Xero, QuickBooks)
 */
export function trackSync(userId, data) {
  trackServerEvent(userId, 'sync_completed', {
    platform: data.platform, // 'xero', 'quickbooks'
    transaction_count: data.transactionCount,
    success: data.success,
    error: data.error
  })
}

/**
 * Track user signup/login
 */
export function trackAuth(userId, data) {
  trackServerEvent(userId, data.action, {
    method: data.method, // 'email', 'google', 'magic_link'
    subscription_tier: data.tier
  })
}

/**
 * Track subscription changes
 */
export function trackSubscription(userId, data) {
  trackServerEvent(userId, 'subscription_changed', {
    from_tier: data.fromTier,
    to_tier: data.toTier,
    action: data.action // 'upgrade', 'downgrade', 'cancel'
  })
}

/**
 * Track errors for monitoring
 */
export function trackError(userId, data) {
  trackServerEvent(userId || 'system', 'error_occurred', {
    error_type: data.type,
    error_message: data.message,
    endpoint: data.endpoint,
    context: data.context
  })
}

/**
 * Shutdown PostHog client (call when server shuts down)
 */
export async function shutdownPostHog() {
  const client = getPostHogClient()
  if (client) {
    await client.shutdown()
  }
}

export default {
  trackServerEvent,
  trackPdfProcessing,
  trackExport,
  trackSync,
  trackAuth,
  trackSubscription,
  trackError,
  shutdownPostHog
}
