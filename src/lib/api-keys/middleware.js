/**
 * API Authentication Middleware
 *
 * Validates API keys, checks quotas, enforces rate limits, and logs API usage.
 *
 * Usage in API routes:
 * ```javascript
 * import { withApiAuth } from '@/lib/api-keys/middleware';
 *
 * export async function POST(request) {
 *   const authResult = await withApiAuth(request);
 *   if (authResult.error) {
 *     return authResult.response;
 *   }
 *
 *   const { user, quota } = authResult.data;
 *   // Your API logic here
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { validateApiKey } from './index';
import { createClient } from '@supabase/supabase-js';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { auditLogger, AuditEventTypes, AuditSeverity } from '@/lib/security/audit-logger';

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

// Rate limiters for different API tiers
const rateLimiters = {
  starter: new RateLimiter({
    windowMs: 60000, // 1 minute
    max: 10,
    message: 'Rate limit exceeded for Starter tier (10 requests/minute)'
  }),
  growth: new RateLimiter({
    windowMs: 60000,
    max: 30,
    message: 'Rate limit exceeded for Growth tier (30 requests/minute)'
  }),
  scale: new RateLimiter({
    windowMs: 60000,
    max: 60,
    message: 'Rate limit exceeded for Scale tier (60 requests/minute)'
  }),
  enterprise: new RateLimiter({
    windowMs: 60000,
    max: 120,
    message: 'Rate limit exceeded for Enterprise tier (120 requests/minute)'
  }),
  payg: new RateLimiter({
    windowMs: 60000,
    max: 20,
    message: 'Rate limit exceeded for Pay-as-you-go tier (20 requests/minute)'
  })
};

/**
 * Extracts API key from Authorization header
 * @param {Request} request - Next.js request object
 * @returns {string|null} Extracted API key or null
 */
function extractApiKey(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <key>" and just "<key>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * Gets client IP address from request
 * @param {Request} request - Next.js request object
 * @returns {string} IP address
 */
function getClientIp(request) {
  // Check various headers for IP (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Gets user agent from request
 * @param {Request} request - Next.js request object
 * @returns {string} User agent string
 */
function getUserAgent(request) {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Fetches current quota information for a user
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Quota information
 */
async function getCurrentQuota(userId) {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_current_quota', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching quota:', error);
      return null;
    }

    // data is an array with one row
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in getCurrentQuota:', error);
    return null;
  }
}

/**
 * Checks if user has available quota
 * @param {object} quota - Quota object from getCurrentQuota
 * @returns {boolean} True if quota is available
 */
function hasAvailableQuota(quota) {
  if (!quota) {
    return false;
  }

  // Unlimited quota (Enterprise)
  if (quota.monthly_limit === -1) {
    return true;
  }

  // Overage allowed
  if (quota.overage_allowed) {
    return true;
  }

  // Check remaining quota
  return quota.current_usage < quota.monthly_limit;
}

/**
 * Logs API request to api_usage table
 * @param {object} params - Logging parameters
 * @returns {Promise<void>}
 */
async function logApiUsage({
  apiKeyId,
  userId,
  requestId,
  endpoint,
  method,
  statusCode,
  responseTimeMs,
  errorMessage = null,
  errorCode = null,
  fileSizeBytes = null,
  transactionCount = null,
  aiEnhanced = false,
  billable = true,
  ipAddress,
  userAgent
}) {
  try {
    await supabaseAdmin.from('api_usage').insert({
      api_key_id: apiKeyId,
      user_id: userId,
      request_id: requestId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
      error_code: errorCode,
      file_size_bytes: fileSizeBytes,
      transaction_count: transactionCount,
      ai_enhanced: aiEnhanced,
      billable,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Error logging API usage:', error);
    // Don't throw - logging failure shouldn't break API
  }
}

/**
 * Main authentication middleware
 * @param {Request} request - Next.js request object
 * @param {object} options - Middleware options
 * @param {boolean} options.requireQuota - Whether to check quota (default true)
 * @param {boolean} options.billable - Whether this endpoint is billable (default true)
 * @returns {Promise<object>} Authentication result
 */
export async function withApiAuth(request, options = {}) {
  const {
    requireQuota = true,
    billable = true
  } = options;

  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const endpoint = new URL(request.url).pathname;
  const method = request.method;

  // Step 1: Extract API key
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    // Log failed authentication attempt
    await auditLogger.log({
      eventType: AuditEventTypes.AUTH_FAILED,
      severity: AuditSeverity.WARNING,
      userId: null,
      ipAddress,
      userAgent,
      details: {
        reason: 'Missing API key',
        endpoint
      }
    });

    return {
      error: true,
      response: NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Missing API key in Authorization header',
          code: 'MISSING_API_KEY'
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="API"'
          }
        }
      )
    };
  }

  // Step 2: Validate API key
  const keyData = await validateApiKey(apiKey);

  if (!keyData) {
    // Log failed authentication
    await auditLogger.log({
      eventType: AuditEventTypes.AUTH_FAILED,
      severity: AuditSeverity.WARNING,
      userId: null,
      ipAddress,
      userAgent,
      details: {
        reason: 'Invalid API key',
        endpoint,
        keyPrefix: apiKey.substring(0, 12)
      }
    });

    return {
      error: true,
      response: NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Invalid or expired API key',
          code: 'INVALID_API_KEY'
        },
        { status: 401 }
      )
    };
  }

  // Step 3: Check if API access is enabled for user
  if (!keyData.apiEnabled && !keyData.isDeveloper) {
    // User doesn't have API access enabled
    return {
      error: true,
      response: NextResponse.json(
        {
          error: 'Access denied',
          message: 'API access is not enabled for your account',
          code: 'API_ACCESS_DISABLED'
        },
        { status: 403 }
      )
    };
  }

  // Step 4: Get quota information (if required)
  let quota = null;
  if (requireQuota) {
    quota = await getCurrentQuota(keyData.userId);

    if (!quota) {
      return {
        error: true,
        response: NextResponse.json(
          {
            error: 'Configuration error',
            message: 'No active quota found for your account. Please contact support.',
            code: 'NO_QUOTA'
          },
          { status: 403 }
        )
      };
    }

    // Check quota availability
    if (!hasAvailableQuota(quota)) {
      // Log quota exceeded
      await logApiUsage({
        apiKeyId: keyData.id,
        userId: keyData.userId,
        requestId,
        endpoint,
        method,
        statusCode: 429,
        responseTimeMs: Date.now() - startTime,
        errorCode: 'QUOTA_EXCEEDED',
        errorMessage: 'Monthly quota exceeded',
        billable: false,
        ipAddress,
        userAgent
      });

      return {
        error: true,
        response: NextResponse.json(
          {
            error: 'Quota exceeded',
            message: `You have used ${quota.current_usage} of ${quota.monthly_limit} conversions this month`,
            code: 'QUOTA_EXCEEDED',
            quota: {
              used: quota.current_usage,
              limit: quota.monthly_limit,
              remaining: Math.max(0, quota.monthly_limit - quota.current_usage),
              resetAt: quota.period_end
            }
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': quota.monthly_limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(quota.period_end).getTime().toString()
            }
          }
        )
      };
    }
  }

  // Step 5: Rate limiting based on plan tier
  const planTier = quota?.plan_tier || 'payg';
  const rateLimiter = rateLimiters[planTier] || rateLimiters.payg;

  const limitResult = await rateLimiter.limit(keyData.userId);

  if (limitResult.limited) {
    // Log rate limit hit
    await logApiUsage({
      apiKeyId: keyData.id,
      userId: keyData.userId,
      requestId,
      endpoint,
      method,
      statusCode: 429,
      responseTimeMs: Date.now() - startTime,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorMessage: limitResult.message,
      billable: false,
      ipAddress,
      userAgent
    });

    return {
      error: true,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: limitResult.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: limitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimiter.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitResult.resetTime.toString(),
            'Retry-After': limitResult.retryAfter.toString()
          }
        }
      )
    };
  }

  // Step 6: Success - return user and quota data
  return {
    error: false,
    data: {
      user: {
        id: keyData.userId,
        apiKeyId: keyData.id,
        isDeveloper: keyData.isDeveloper
      },
      quota: quota ? {
        planTier: quota.plan_tier,
        used: quota.current_usage,
        limit: quota.monthly_limit,
        remaining: quota.monthly_limit === -1 ? -1 : (quota.monthly_limit - quota.current_usage),
        resetAt: quota.period_end,
        overageAllowed: quota.overage_allowed
      } : null,
      rateLimit: {
        limit: rateLimiter.max,
        remaining: limitResult.remaining,
        resetTime: limitResult.resetTime
      },
      // Helper function to log this request
      logRequest: async (statusCode, additionalData = {}) => {
        await logApiUsage({
          apiKeyId: keyData.id,
          userId: keyData.userId,
          requestId,
          endpoint,
          method,
          statusCode,
          responseTimeMs: Date.now() - startTime,
          billable,
          ipAddress,
          userAgent,
          ...additionalData
        });
      },
      // Helper function to increment quota
      incrementQuota: async (amount = 1) => {
        try {
          const { data, error } = await supabaseAdmin.rpc('increment_api_usage', {
            p_user_id: keyData.userId,
            p_amount: amount
          });

          if (error) throw error;
          return data; // Returns true if successful
        } catch (error) {
          console.error('Error incrementing quota:', error);
          return false;
        }
      }
    }
  };
}

/**
 * Creates response headers with rate limit information
 * @param {object} rateLimit - Rate limit object from withApiAuth
 * @returns {Headers} Headers object
 */
export function createRateLimitHeaders(rateLimit) {
  return new Headers({
    'X-RateLimit-Limit': rateLimit.limit.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': rateLimit.resetTime.toString()
  });
}

/**
 * Helper to create API error responses with consistent format
 * @param {string} error - Error type
 * @param {string} message - Human-readable message
 * @param {string} code - Error code
 * @param {number} status - HTTP status code
 * @returns {NextResponse}
 */
export function apiError(error, message, code, status = 400) {
  return NextResponse.json(
    {
      error,
      message,
      code
    },
    { status }
  );
}

/**
 * Helper to create API success responses with consistent format
 * @param {object} data - Response data
 * @param {Headers} headers - Optional additional headers
 * @returns {NextResponse}
 */
export function apiSuccess(data, headers = null) {
  return NextResponse.json(
    {
      success: true,
      ...data
    },
    {
      status: 200,
      headers: headers || undefined
    }
  );
}
