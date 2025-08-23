import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { auditLogger } from '@/lib/security/audit-logger'
import { withRateLimit } from '@/lib/security/rate-limiter'

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
      const userId = searchParams.get('userId') || user.id
      const eventType = searchParams.get('eventType')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const severity = searchParams.get('severity')
      const limit = parseInt(searchParams.get('limit') || '100')
      const offset = parseInt(searchParams.get('offset') || '0')

      // Only allow users to view their own logs unless they're admin
      if (userId !== user.id && !user.user_metadata?.is_admin) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Query audit logs
      const result = await auditLogger.queryLogs({
        userId,
        eventType,
        startDate,
        endDate,
        severity,
        limit,
        offset
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }
  }, 'api')(request, NextResponse)
}