/**
 * Analytics Provider Component
 *
 * Wraps the app and automatically tracks page views on route changes.
 * Uses Next.js usePathname hook to detect navigation.
 *
 * This component should be added to the root layout to enable
 * automatic analytics tracking across the entire app.
 */

'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import analyticsService from '@/lib/analytics/analytics-service'

function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page view whenever the route changes
    const trackPageView = async () => {
      // Get page title from document
      const pageTitle = typeof document !== 'undefined' ? document.title : ''

      // Build full path with search params
      const fullPath = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      // Track the page view
      await analyticsService.trackPageView(fullPath, pageTitle)
    }

    trackPageView()
  }, [pathname, searchParams]) // Re-run when pathname or search params change

  return null
}

export default function AnalyticsProvider({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  )
}
