import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient() {
  if (!posthogClient && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        flushAt: 1,
        flushInterval: 0
      }
    )
  }
  return posthogClient
}

// Alias for documentation compatibility
export const getPostHogServer = getPostHogClient

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown()
  }
}

// Track a server-side event
export function trackServerEvent(distinctId: string, event: string, properties: Record<string, any> = {}) {
  const client = getPostHogClient()
  if (!client) return

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

// Track PDF processing events
export function trackPdfProcessing(userId: string, data: {
  fileId: string
  transactionCount: number
  bankType?: string
  aiEnhanced?: boolean
  processingTime?: number
  success: boolean
}) {
  trackServerEvent(userId, 'pdf_processed', {
    file_id: data.fileId,
    transaction_count: data.transactionCount,
    bank_type: data.bankType,
    ai_enhanced: data.aiEnhanced,
    processing_time_ms: data.processingTime,
    success: data.success
  })
}

// Track export events
export function trackExport(userId: string, data: {
  fileId: string
  format: string
  transactionCount: number
  destination: string
}) {
  trackServerEvent(userId, 'file_exported', {
    file_id: data.fileId,
    format: data.format,
    transaction_count: data.transactionCount,
    destination: data.destination
  })
}

// Track sync events (Xero, QuickBooks)
export function trackSync(userId: string, data: {
  platform: string
  transactionCount: number
  success: boolean
  error?: string
}) {
  trackServerEvent(userId, 'sync_completed', {
    platform: data.platform,
    transaction_count: data.transactionCount,
    success: data.success,
    error: data.error
  })
}

// Track errors for monitoring
export function trackError(userId: string | null, data: {
  type: string
  message: string
  endpoint?: string
  context?: Record<string, any>
}) {
  trackServerEvent(userId || 'system', 'error_occurred', {
    error_type: data.type,
    error_message: data.message,
    endpoint: data.endpoint,
    context: data.context
  })
}
