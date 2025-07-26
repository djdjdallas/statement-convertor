'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { Suspense, useEffect, useState } from 'react'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading application...</p>
      </div>
    </div>
  )
}

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering on server
  if (!mounted) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Suspense>
  )
}