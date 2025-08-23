import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all trial users
    const { data: trialUsers, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, trial_start_date, trial_end_date, intended_tier')
      .eq('signup_intent', 'trial')
      .eq('subscription_tier', 'free')
      .not('trial_end_date', 'is', null)
    
    if (error) {
      throw error
    }
    
    const now = new Date()
    const reminders = []
    
    for (const user of trialUsers || []) {
      const endDate = new Date(user.trial_end_date)
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
      
      // Send reminders at day 7, 3, and 1
      if ([7, 3, 1].includes(daysRemaining)) {
        reminders.push({
          userId: user.id,
          email: user.email,
          name: user.full_name,
          daysRemaining,
          intendedTier: user.intended_tier,
          trialEndDate: user.trial_end_date
        })
      }
    }
    
    // In a real implementation, you would:
    // 1. Check if reminder was already sent today (store in database)
    // 2. Send actual emails using a service like SendGrid/Resend
    // 3. Mark reminders as sent
    
    return NextResponse.json({
      success: true,
      reminders: reminders.length,
      users: reminders
    })
    
  } catch (error) {
    console.error('Trial reminder check error:', error)
    return NextResponse.json(
      { error: 'Failed to check trial reminders' },
      { status: 500 }
    )
  }
}

// This endpoint would typically be called by a cron job
// For example, Vercel Cron or a scheduled GitHub Action