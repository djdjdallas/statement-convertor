import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          setError(error.message)
          // Default to free tier if no profile found
          setProfile({ 
            id: user.id,
            email: user.email,
            subscription_tier: 'free',
            subscription_plan: 'free'
          })
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error('Error in useUserProfile:', err)
        setError('Failed to fetch user profile')
        // Default to free tier on error
        setProfile({ 
          id: user.id,
          email: user.email,
          subscription_tier: 'free',
          subscription_plan: 'free'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // Set up realtime subscription for profile updates
    const supabase = createClient()
    const subscription = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload)
          if (payload.new) {
            setProfile(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const subscriptionTier = profile?.subscription_tier || 'free'
  const subscriptionPlan = profile?.subscription_plan || 'free'
  
  // Normalize tier names for backwards compatibility
  const normalizedTier = subscriptionTier === 'basic' ? 'professional' : 
                        subscriptionTier === 'premium' ? 'business' : 
                        subscriptionTier

  return {
    profile,
    loading,
    error,
    subscriptionTier: normalizedTier,
    subscriptionPlan,
    isFreeTier: normalizedTier === 'free',
    isProfessional: normalizedTier === 'professional',
    isBusiness: normalizedTier === 'business',
    isEnterprise: normalizedTier === 'enterprise'
  }
}