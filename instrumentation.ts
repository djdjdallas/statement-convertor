import { getPostHogClient } from '@/lib/posthog-server'

export async function register() {
  // Server-side initialization if needed
}

export const onRequestError = async (
  error: { digest: string } & Error,
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
  const posthog = getPostHogClient()
  if (!posthog) return

  try {
    posthog.capture({
      distinctId: 'server-error',
      event: '$exception',
      properties: {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack_trace_raw: error.stack,
        $exception_digest: error.digest,
        $exception_source: 'server',
        request_path: request.path,
        request_method: request.method,
        router_kind: context.routerKind,
        route_path: context.routePath,
        route_type: context.routeType,
        render_source: context.renderSource,
        revalidate_reason: context.revalidateReason,
        render_type: context.renderType,
      },
    })

    await posthog.flush()
  } catch (e) {
    console.error('[PostHog] Failed to capture server error:', e)
  }
}
