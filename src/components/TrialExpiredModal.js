'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Sparkles, TrendingUp } from 'lucide-react'
import { redirectToCheckout } from '@/lib/stripe-client'
import { toast } from '@/hooks/use-toast'

export default function TrialExpiredModal({ isOpen, onClose, userProfile }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const intendedTier = userProfile?.intended_tier || 'professional'

  const handleUpgrade = async (tier, billingPeriod = 'monthly') => {
    try {
      setLoading(true)
      await redirectToCheckout(tier, billingPeriod)
    } catch (error) {
      console.error('Upgrade error:', error)
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'Failed to start upgrade process. Please try again.',
        variant: 'destructive'
      })
      setLoading(false)
    }
  }

  const handleContinueFree = () => {
    onClose()
    router.push('/dashboard')
  }

  const features = {
    free: [
      { text: '5 conversions per month', included: true },
      { text: 'Basic CSV export', included: true },
      { text: 'Email support', included: true },
      { text: 'Advanced AI recognition', included: false },
      { text: 'Google Sheets integration', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false }
    ],
    professional: [
      { text: '500 conversions per month', included: true },
      { text: 'CSV & Excel export', included: true },
      { text: 'Advanced AI recognition', included: true },
      { text: 'Google Sheets integration', included: true },
      { text: 'AI transaction categorization', included: true },
      { text: 'Priority support', included: true },
      { text: 'Bulk processing', included: true }
    ],
    business: [
      { text: '2000 conversions per month', included: true },
      { text: 'All export formats', included: true },
      { text: 'Everything in Professional', included: true },
      { text: 'AI cash flow forecasting', included: true },
      { text: 'AI budget recommendations', included: true },
      { text: 'Financial assistant chatbot', included: true },
      { text: 'Dedicated support', included: true }
    ]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your Trial Has Ended</DialogTitle>
          <DialogDescription className="text-base">
            We hope you enjoyed your 7-day trial! Choose how you'd like to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 my-6">
          {/* Free Plan */}
          <Card className="p-4 relative">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Free Plan</h3>
              <p className="text-2xl font-bold mt-1">$0<span className="text-sm font-normal">/month</span></p>
            </div>
            <ul className="space-y-2 mb-4">
              {features.free.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  {feature.included ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300 mt-0.5" />
                  )}
                  <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleContinueFree}
            >
              Continue with Free
            </Button>
          </Card>

          {/* Professional Plan */}
          <Card className={`p-4 relative ${intendedTier === 'professional' ? 'ring-2 ring-blue-600' : ''}`}>
            {intendedTier === 'professional' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Your Trial Plan
              </Badge>
            )}
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Professional</h3>
              <p className="text-2xl font-bold mt-1">$49<span className="text-sm font-normal">/month</span></p>
              <p className="text-xs text-gray-500">or $470/year (save 20%)</p>
            </div>
            <ul className="space-y-2 mb-4">
              {features.professional.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <Button 
                className="w-full"
                onClick={() => handleUpgrade('professional', 'monthly')}
                disabled={loading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Monthly
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleUpgrade('professional', 'yearly')}
                disabled={loading}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Save 20% Yearly
              </Button>
            </div>
          </Card>

          {/* Business Plan */}
          <Card className={`p-4 relative ${intendedTier === 'business' ? 'ring-2 ring-blue-600' : ''}`}>
            {intendedTier === 'business' && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Your Trial Plan
              </Badge>
            )}
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Business</h3>
              <p className="text-2xl font-bold mt-1">$99<span className="text-sm font-normal">/month</span></p>
              <p className="text-xs text-gray-500">or $950/year (save 20%)</p>
            </div>
            <ul className="space-y-2 mb-4">
              {features.business.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <Button 
                className="w-full"
                onClick={() => handleUpgrade('business', 'monthly')}
                disabled={loading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Monthly
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleUpgrade('business', 'yearly')}
                disabled={loading}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Save 20% Yearly
              </Button>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Questions? <a href="/contact" className="text-blue-600 hover:underline">Contact our support team</a>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}