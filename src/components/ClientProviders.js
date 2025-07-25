'use client'

import dynamic from "next/dynamic";

const Providers = dynamic(() => import("@/components/Providers").then(mod => ({ default: mod.Providers })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading application...</p>
      </div>
    </div>
  )
});

export function ClientProviders({ children }) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}