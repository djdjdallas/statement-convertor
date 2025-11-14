/**
 * API v1: Usage Statistics
 *
 * GET /api/v1/usage
 *
 * Returns current usage statistics and quota information.
 * Requires API key authentication.
 *
 * Response:
 * - Current month's usage
 * - Remaining quota
 * - Next reset date
 * - Historical usage data (last 30 days)
 */

import { NextResponse } from 'next/server';
import { withApiAuth, apiError, apiSuccess, createRateLimitHeaders } from '@/lib/api-keys/middleware';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * GET handler for usage statistics
 */
export async function GET(request) {
  // Authenticate request (usage endpoint is NOT billable)
  const authResult = await withApiAuth(request, {
    requireQuota: false, // Don't require quota check for usage endpoint
    billable: false // This endpoint doesn't count against quota
  });

  if (authResult.error) {
    return authResult.response;
  }

  const { user, quota, rateLimit, logRequest } = authResult.data;

  try {
    // Get current quota info
    const { data: currentQuota, error: quotaError } = await supabaseAdmin.rpc('get_current_quota', {
      p_user_id: user.id
    });

    if (quotaError) {
      console.error('Error fetching quota:', quotaError);
      await logRequest(500, {
        errorCode: 'QUOTA_FETCH_ERROR',
        errorMessage: quotaError.message
      });

      return apiError(
        'Internal error',
        'Failed to fetch quota information',
        'QUOTA_FETCH_ERROR',
        500
      );
    }

    const quotaData = currentQuota && currentQuota.length > 0 ? currentQuota[0] : null;

    if (!quotaData) {
      await logRequest(404, {
        errorCode: 'NO_QUOTA_FOUND',
        errorMessage: 'No active quota found'
      });

      return apiError(
        'Configuration error',
        'No active quota found for your account',
        'NO_QUOTA_FOUND',
        404
      );
    }

    // Get usage history for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usageHistory, error: historyError } = await supabaseAdmin
      .from('api_usage')
      .select('created_at, status_code, transaction_count, ai_enhanced')
      .eq('user_id', user.id)
      .eq('billable', true)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching usage history:', historyError);
      // Don't fail the request, just return empty history
    }

    // Calculate daily usage for chart
    const dailyUsage = {};
    if (usageHistory) {
      usageHistory.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        if (!dailyUsage[date]) {
          dailyUsage[date] = {
            date,
            count: 0,
            successful: 0,
            failed: 0,
            ai_enhanced: 0
          };
        }
        dailyUsage[date].count++;
        if (record.status_code === 200) {
          dailyUsage[date].successful++;
        } else {
          dailyUsage[date].failed++;
        }
        if (record.ai_enhanced) {
          dailyUsage[date].ai_enhanced++;
        }
      });
    }

    // Get current period usage details
    const { data: currentPeriodUsage, error: periodError } = await supabaseAdmin
      .from('api_usage')
      .select('created_at, status_code, endpoint, transaction_count')
      .eq('user_id', user.id)
      .eq('billable', true)
      .gte('created_at', quotaData.period_start)
      .lte('created_at', quotaData.period_end);

    // Calculate statistics
    const totalRequests = currentPeriodUsage?.length || 0;
    const successfulRequests = currentPeriodUsage?.filter(r => r.status_code === 200).length || 0;
    const failedRequests = totalRequests - successfulRequests;
    const totalTransactions = currentPeriodUsage?.reduce((sum, r) => sum + (r.transaction_count || 0), 0) || 0;

    // Log successful request
    await logRequest(200);

    // Return response
    return apiSuccess({
      quota: {
        plan_tier: quotaData.plan_tier,
        used: quotaData.current_usage,
        limit: quotaData.monthly_limit,
        remaining: quotaData.monthly_limit === -1 ? -1 : Math.max(0, quotaData.monthly_limit - quotaData.current_usage),
        overage_allowed: quotaData.overage_allowed,
        period: {
          start: quotaData.period_start,
          end: quotaData.period_end,
          days_remaining: Math.ceil((new Date(quotaData.period_end) - new Date()) / (1000 * 60 * 60 * 24))
        }
      },
      usage: {
        current_period: {
          total_requests: totalRequests,
          successful_requests: successfulRequests,
          failed_requests: failedRequests,
          total_transactions: totalTransactions,
          success_rate: totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) : 0
        },
        daily_breakdown: Object.values(dailyUsage).sort((a, b) => a.date.localeCompare(b.date))
      },
      rate_limit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset_time: new Date(rateLimit.resetTime).toISOString()
      }
    }, createRateLimitHeaders(rateLimit));

  } catch (error) {
    console.error('Error fetching usage:', error);

    await authResult.data.logRequest(500, {
      errorCode: 'INTERNAL_ERROR',
      errorMessage: error.message
    });

    return apiError(
      'Internal error',
      'An error occurred while fetching usage statistics',
      'INTERNAL_ERROR',
      500
    );
  }
}
