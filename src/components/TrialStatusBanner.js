'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Clock, AlertCircle } from 'lucide-react'
import { redirectToCheckout } from '@/lib/stripe-client'
import { toast } from '@/hooks/use-toast'

export default function TrialStatusBanner({ userProfile, userSubscription }) {
  const [loading, setLoading] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (userProfile?.signup_intent === 'trial' && userProfile?.trial_end_date) {
      const endDate = new Date(userProfile.trial_end_date)
      const now = new Date()
      const diffTime = endDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      setDaysRemaining(Math.max(0, diffDays))
      setProgress(((7 - diffDays) / 7) * 100)
    }
  }, [userProfile])

  // Don't show banner for non-trial users or if already subscribed
  if (userProfile?.signup_intent !== 'trial' || 
      userSubscription?.subscription_tier !== 'free' ||
      daysRemaining === 0) {
    return null
  }

  const handleUpgrade = async () => {
    try {
      setLoading(true)
      const tier = userProfile.intended_tier || 'professional'
      await redirectToCheckout(tier, 'monthly')
    } catch (error) {
      console.error('Upgrade error:', error)
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'Failed to start upgrade process. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = () => {
    if (daysRemaining <= 3) return 'border-red-200 bg-red-50'
    if (daysRemaining <= 7) return 'border-yellow-200 bg-yellow-50'
    return 'border-blue-200 bg-blue-50'
  }

  const getIconColor = () => {
    if (daysRemaining <= 3) return 'text-red-600'
    if (daysRemaining <= 7) return 'text-yellow-600'
    return 'text-blue-600'
  }

  return (
    <Card className={`mb-6 ${getUrgencyColor()} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${getUrgencyColor()}`}>
              {daysRemaining <= 3 ? (
                <AlertCircle className={`h-5 w-5 ${getIconColor()}`} />
              ) : (
                <Clock className={`h-5 w-5 ${getIconColor()}`} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {daysRemaining <= 3 ? 'Trial Ending Soon!' : 'Free Trial Active'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {daysRemaining === 1 ? (
                  `Your trial expires tomorrow. Upgrade now to keep all features!`
                ) : daysRemaining <= 3 ? (
                  `Only ${daysRemaining} days left in your trial. Don't lose access to premium features!`
                ) : (
                  `${daysRemaining} days remaining in your ${userProfile.intended_tier === 'business' ? 'Business' : 'Professional'} trial`
                )}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={progress} className="w-32 h-2" />
                <span className="text-xs text-gray-500">Day {7 - daysRemaining} of 7</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className={daysRemaining <= 3 ? 'bg-red-600 hover:bg-red-700' : ''}
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Upgrade Now'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/pricing')}
            >
              View Plans
            </Button>
          </div>
        </div>
        
        {daysRemaining <= 7 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>What happens when my trial ends?</strong> You'll automatically switch to our free plan with 5 conversions/month. 
              Upgrade anytime to keep unlimited access to all features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}