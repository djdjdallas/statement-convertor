'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Initialize PostHog if not already (since this bypasses the root layout)
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        defaults: '2025-11-30',
        capture_exceptions: {
          capture_unhandled_errors: true,
          capture_unhandled_rejections: true,
          capture_console_errors: false,
        },
      })
    }

    // Capture the global error in PostHog using the proper method
    posthog.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <svg
                style={{ width: '2rem', height: '2rem', color: '#dc2626' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.5rem',
            }}>
              Critical Error
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
            }}>
              A critical error occurred. Our team has been notified and is working on a fix.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
