import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  defaults: '2025-11-30',
  capture_exceptions: {
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: false,
  },
  debug: process.env.NODE_ENV === 'development',
})
