import { createClient } from '@/lib/supabase/client'

/**
 * Check if a user is in an active trial period
 * @param {string} userId - The user ID to check
 * @returns {Promise<{inTrial: boolean, daysRemaining: number, trialEndDate: Date|null}>}
 */
export async function checkTrialStatus(userId) {
  const supabase = createClient()
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('signup_intent, trial_start_date, trial_end_date, subscription_tier')
    .eq('id', userId)
    .single()
  
  if (error || !profile) {
    return { inTrial: false, daysRemaining: 0, trialEndDate: null }
  }
  
  // Not a trial user
  if (profile.signup_intent !== 'trial') {
    return { inTrial: false, daysRemaining: 0, trialEndDate: null }
  }
  
  // Already upgraded
  if (profile.subscription_tier && profile.subscription_tier !== 'free') {
    return { inTrial: false, daysRemaining: 0, trialEndDate: null }
  }
  
  // Check trial dates
  if (profile.trial_end_date) {
    const endDate = new Date(profile.trial_end_date)
    const now = new Date()
    const diffTime = endDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 0) {
      return {
        inTrial: true,
        daysRemaining: diffDays,
        trialEndDate: endDate
      }
    }
  }
  
  return { inTrial: false, daysRemaining: 0, trialEndDate: null }
}

/**
 * Get trial-specific limits for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The limits object
 */
export async function getTrialLimits(userId) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('signup_intent, intended_tier, subscription_tier')
    .eq('id', userId)
    .single()
  
  if (!profile) {
    return null
  }
  
  // If in trial, return the intended tier's limits
  if (profile.signup_intent === 'trial' && 
      (!profile.subscription_tier || profile.subscription_tier === 'free')) {
    const { getTierLimits } = await import('@/lib/subscription-tiers')
    return getTierLimits(profile.intended_tier || 'professional')
  }
  
  // Otherwise return their actual tier limits
  const { getTierLimits } = await import('@/lib/subscription-tiers')
  return getTierLimits(profile.subscription_tier || 'free')
}

/**
 * Check if trial has expired and user needs to be downgraded
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the trial has expired
 */
export async function isTrialExpired(userId) {
  const { inTrial, daysRemaining } = await checkTrialStatus(userId)
  return !inTrial && daysRemaining === 0
}

/**
 * Get appropriate usage limits for a user (considering trial status)
 * @param {Object} userProfile - The user profile object
 * @returns {Object} The limits object
 */
export function getUserLimits(userProfile) {
  const { getTierLimits } = require('@/lib/subscription-tiers')
  
  // If user is in trial and hasn't upgraded yet
  if (userProfile?.signup_intent === 'trial' && 
      userProfile?.trial_end_date &&
      new Date(userProfile.trial_end_date) > new Date() &&
      (!userProfile?.subscription_tier || userProfile?.subscription_tier === 'free')) {
    // Give them the intended tier's limits during trial
    return getTierLimits(userProfile.intended_tier || 'professional')
  }
  
  // Otherwise use their actual subscription tier
  return getTierLimits(userProfile?.subscription_tier || 'free')
}