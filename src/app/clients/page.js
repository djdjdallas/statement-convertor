import { Suspense } from 'react'
import ClientDashboard from '@/components/clients/ClientDashboard'

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ClientDashboard />
        </Suspense>
      </div>
    </div>
  )
}