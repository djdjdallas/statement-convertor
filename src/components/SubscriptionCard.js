'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings
} from 'lucide-react'
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers'
import { redirectToCheckout, redirectToPortal } from '@/lib/stripe-client'
import { toast } from '@/hooks/use-toast'

export default function SubscriptionCard({ userProfile, monthlyUsage }) {
  const [loading, setLoading] = useState({})
  
  const currentTier = userProfile?.subscription_tier || 'free'
  const tierInfo = SUBSCRIPTION_TIERS[currentTier]
  const hasActiveSubscription = userProfile?.subscription_status === 'active'
  const monthlyLimit = tierInfo?.limits.monthlyConversions || 0
  const usagePercentage = monthlyLimit === -1 ? 0 : (monthlyUsage / monthlyLimit) * 100

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleUpgrade = async (tier) => {
    try {
      setLoading(prev => ({ ...prev, [tier]: true }))
      await redirectToCheckout(tier)
    } catch (error) {
      console.error('Upgrade error:', error)
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'Failed to process upgrade. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(prev => ({ ...prev, [tier]: false }))
    }
  }

  const handleManageSubscription = async () => {
    try {
      setLoading(prev => ({ ...prev, portal: true }))
      await redirectToPortal()
    } catch (error) {
      console.error('Portal error:', error)
      toast({
        title: 'Portal Access Failed',
        description: error.message || 'Failed to open subscription management. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(prev => ({ ...prev, portal: false }))
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'canceled':
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <CardTitle>Subscription</CardTitle>
          </div>
          {hasActiveSubscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageSubscription}
              disabled={loading.portal}
            >
              {loading.portal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Manage
            </Button>
          )}
        </div>
        <CardDescription>
          Your current plan and usage information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Current Plan</h4>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="capitalize">
                {tierInfo?.name}
              </Badge>
              {userProfile?.subscription_status && (
                <Badge className={getStatusColor(userProfile.subscription_status)}>
                  <span className="flex items-center">
                    {getStatusIcon(userProfile.subscription_status)}
                    <span className="ml-1 capitalize">
                      {userProfile.subscription_status}
                    </span>
                  </span>
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Price:</span>{' '}
              {tierInfo?.price === 0 ? 'Free' : `$${tierInfo?.price}/month`}
            </p>
            {userProfile?.current_period_end && (
              <p>
                <span className="font-medium">
                  {userProfile.subscription_status === 'canceled' ? 'Expires:' : 'Renews:'}
                </span>{' '}
                {formatDate(userProfile.current_period_end)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Usage Statistics */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">This Month's Usage</h4>
            <span className="text-sm text-gray-600">
              {monthlyUsage} / {monthlyLimit === -1 ? '∞' : monthlyLimit} conversions
            </span>
          </div>
          
          {monthlyLimit !== -1 && (
            <div className="space-y-2">
              <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
              {usagePercentage >= 90 && (
                <div className="flex items-center text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {usagePercentage >= 100 ? 'Limit reached' : 'Approaching limit'}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Plan Features */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Plan Features</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            {tierInfo?.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade Options */}
        {currentTier === 'free' && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Upgrade Your Plan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => handleUpgrade('basic')}
                  disabled={loading.basic}
                  className="w-full"
                >
                  {loading.basic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade to Basic
                </Button>
                <Button
                  onClick={() => handleUpgrade('premium')}
                  disabled={loading.premium}
                  variant="outline"
                  className="w-full"
                >
                  {loading.premium && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          </>
        )}

        {currentTier === 'basic' && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Upgrade to Premium</h4>
              <Button
                onClick={() => handleUpgrade('premium')}
                disabled={loading.premium}
                className="w-full"
              >
                {loading.premium && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade to Premium
              </Button>
            </div>
          </>
        )}

        {/* Billing Information */}
        {hasActiveSubscription && (
          <>
            <Separator />
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                Billing managed through Stripe
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}