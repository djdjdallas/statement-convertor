export function register() {
  // No-op for initialization
}

export const onRequestError = async (
  err: { digest: string } & Error,
  request: {
    path: string
    method: string
    headers: { [key: string]: string }
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    renderSource:
      | 'react-server-components'
      | 'react-server-components-payload'
      | 'server-rendering'
    revalidateReason: 'on-demand' | 'stale' | undefined
    renderType: 'dynamic' | 'dynamic-resumable'
  }
) => {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPostHogServer } = await import('@/lib/posthog-server')
    const posthog = getPostHogServer()

    if (!posthog) return

    // Extract distinct_id from PostHog cookie
    let distinctId: string | undefined = undefined
    const cookieHeader = request.headers?.cookie

    if (cookieHeader) {
      const cookieString = Array.isArray(cookieHeader)
        ? cookieHeader.join('; ')
        : cookieHeader

      const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/)

      if (postHogCookieMatch && postHogCookieMatch[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1])
          const postHogData = JSON.parse(decodedCookie)
          distinctId = postHogData.distinct_id
        } catch (e) {
          console.error('[PostHog] Error parsing PostHog cookie:', e)
        }
      }
    }

    try {
      // Use captureException for proper error tracking
      posthog.captureException(err, distinctId, {
        $exception_digest: err.digest,
        $exception_source: 'server',
        request_path: request.path,
        request_method: request.method,
        router_kind: context.routerKind,
        route_path: context.routePath,
        route_type: context.routeType,
        render_source: context.renderSource,
        revalidate_reason: context.revalidateReason,
        render_type: context.renderType,
      })

      await posthog.flush()
    } catch (e) {
      console.error('[PostHog] Failed to capture server error:', e)
    }
  }
}
