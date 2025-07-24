'use client'

import Header from '@/components/landing/Header'
import Pricing from '@/components/landing/Pricing'
import Footer from '@/components/landing/Footer'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your bank statement conversion needs
          </p>
        </div>
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}