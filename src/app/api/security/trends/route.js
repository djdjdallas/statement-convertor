import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { securityMonitor } from '@/lib/security/monitoring'
import { withRateLimit } from '@/lib/security/rate-limiter'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request) {
  return withRateLimit(async (req, res) => {
    try {
      // Get authenticated user
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url)
      const timeRange = searchParams.get('timeRange') || '24h'

      // Get security trends
      const trends = await securityMonitor.analyzeSecurityTrends(timeRange)

      // Get user-specific API usage
      const { data: apiQuotas } = await supabaseAdmin
        .from('user_api_quotas')
        .select('*')
        .eq('user_id', user.id)

      // Calculate API usage
      let totalApiCalls = 0
      let dailyLimit = 1000 // Default daily limit

      if (apiQuotas) {
        apiQuotas.forEach(quota => {
          totalApiCalls += quota.day_hits?.length || 0
        })
      }

      // Get active incidents for the user
      const { data: incidents } = await supabaseAdmin
        .from('security_incidents')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('reported_at', { ascending: false })
        .limit(5)

      // Combine data
      const response = {
        ...trends,
        api_usage: {
          current: totalApiCalls,
          limit: dailyLimit,
          percentage: (totalApiCalls / dailyLimit) * 100
        },
        incidents: incidents || [],
        user_security_score: calculateSecurityScore({
          failed_auth: trends.summary.failed_auth_attempts || 0,
          suspicious_activities: trends.summary.suspicious_activities || 0,
          incidents: incidents?.length || 0
        })
      }

      return NextResponse.json(response)
    } catch (error) {
      console.error('Error fetching security trends:', error)
      return NextResponse.json(
        { error: 'Failed to fetch security trends' },
        { status: 500 }
      )
    }
  }, 'api')(request, NextResponse)
}

// Calculate a simple security score
function calculateSecurityScore({ failed_auth, suspicious_activities, incidents }) {
  let score = 100

  // Deduct points for security issues
  score -= failed_auth * 5
  score -= suspicious_activities * 10
  score -= incidents * 20

  // Ensure score doesn't go below 0
  return Math.max(0, score)
}