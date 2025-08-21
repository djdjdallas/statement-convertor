import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTierLimits } from '@/lib/subscription-tiers'

export function useUsageLimits(userId, userTier = 'free') {
  const [usage, setUsage] = useState({
    conversions: 0,
    apiCalls: 0,
    loading: true,
    error: null
  })

  const limits = getTierLimits(userTier)

  useEffect(() => {
    if (!userId) return

    const fetchUsage = async () => {
      try {
        const supabase = createClient()
        
        // Use the efficient stored function to get monthly usage
        const { data, error } = await supabase
          .rpc('get_user_monthly_usage', { p_user_id: userId })
          .single()

        if (error) {
          console.error('Error fetching usage:', error)
          setUsage(prev => ({ ...prev, loading: false, error: error.message }))
          return
        }

        setUsage({
          conversions: data?.conversions_count || 0,
          apiCalls: data?.api_calls_count || 0,
          loading: false,
          error: null
        })
      } catch (err) {
        console.error('Error in useUsageLimits:', err)
        setUsage(prev => ({ ...prev, loading: false, error: 'Failed to fetch usage data' }))
      }
    }

    fetchUsage()

    // Set up realtime subscription for usage updates
    const supabase = createClient()
    const subscription = supabase
      .channel(`usage:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversion_usage',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Usage updated:', payload)
          fetchUsage()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  // Calculate percentages and remaining
  const conversionsPercentage = limits.monthlyConversions === -1 
    ? 0 
    : Math.min(100, (usage.conversions / limits.monthlyConversions) * 100)

  const apiCallsPercentage = limits.apiCallsPerMonth === -1 
    ? 0 
    : Math.min(100, (usage.apiCalls / (limits.apiCallsPerMonth || 0)) * 100)

  const canConvert = limits.monthlyConversions === -1 || usage.conversions < limits.monthlyConversions
  const canUseAPI = !limits.apiAccess ? false : 
    (limits.apiCallsPerMonth === -1 || usage.apiCalls < (limits.apiCallsPerMonth || 0))

  const conversionsRemaining = limits.monthlyConversions === -1 
    ? 'Unlimited' 
    : Math.max(0, limits.monthlyConversions - usage.conversions)

  const apiCallsRemaining = !limits.apiAccess ? 0 :
    (limits.apiCallsPerMonth === -1 ? 'Unlimited' : Math.max(0, (limits.apiCallsPerMonth || 0) - usage.apiCalls))

  return {
    usage,
    limits,
    conversionsPercentage,
    apiCallsPercentage,
    canConvert,
    canUseAPI,
    conversionsRemaining,
    apiCallsRemaining,
    isAtLimit: !canConvert,
    loading: usage.loading,
    error: usage.error
  }
}