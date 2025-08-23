import { supabaseAdmin } from '@/lib/supabase-admin'
import { securityConfig } from './config'
import { auditLogger, AuditEventTypes, AuditSeverity } from './audit-logger'

// In-memory store for rate limiting (consider Redis for production)
const rateLimitStore = new Map()

// Rate limiter implementation
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000 // 1 minute default
    this.max = options.max || 100 // 100 requests default
    this.message = options.message || 'Too many requests'
    this.keyGenerator = options.keyGenerator || ((req) => req.ip || 'anonymous')
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false
    this.skipFailedRequests = options.skipFailedRequests || false
  }

  async limit(key) {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    if (!entry) {
      entry = { hits: [], resetTime: now + this.windowMs }
      rateLimitStore.set(key, entry)
    }

    // Clean old hits
    entry.hits = entry.hits.filter(hit => hit > windowStart)

    // Check if limit exceeded
    if (entry.hits.length >= this.max) {
      const resetTime = Math.max(...entry.hits) + this.windowMs
      const retryAfter = Math.ceil((resetTime - now) / 1000)
      
      return {
        limited: true,
        remaining: 0,
        resetTime,
        retryAfter,
        message: this.message
      }
    }

    // Add current hit
    entry.hits.push(now)

    return {
      limited: false,
      remaining: this.max - entry.hits.length,
      resetTime: entry.resetTime,
      retryAfter: 0
    }
  }

  // Middleware for Next.js API routes
  middleware() {
    return async (req, res, next) => {
      const key = this.keyGenerator(req)
      const result = await this.limit(key)

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.max)
      res.setHeader('X-RateLimit-Remaining', result.remaining)
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

      if (result.limited) {
        res.setHeader('Retry-After', result.retryAfter)
        
        // Log rate limit violation
        await auditLogger.logSecurityEvent(
          req.userId || 'anonymous',
          AuditEventTypes.SECURITY_RATE_LIMIT_EXCEEDED,
          { key, endpoint: req.url },
          req
        )

        return res.status(429).json({
          error: result.message,
          retryAfter: result.retryAfter
        })
      }

      next()
    }
  }
}

// Google API specific rate limiter
export class GoogleAPIRateLimiter {
  constructor() {
    this.limits = {
      drive: {
        read: { perMinute: 100, perDay: 10000 },
        write: { perMinute: 30, perDay: 1000 }
      },
      sheets: {
        read: { perMinute: 60, perDay: 5000 },
        write: { perMinute: 20, perDay: 500 }
      },
      auth: {
        token: { perMinute: 10, perDay: 100 }
      }
    }
    
    this.userQuotas = new Map()
  }

  async checkLimit(userId, service, operation) {
    const key = `${userId}:${service}:${operation}`
    const limits = this.limits[service]?.[operation]
    
    if (!limits) {
      return { allowed: true }
    }

    const now = Date.now()
    const minuteAgo = now - 60000
    const dayAgo = now - 86400000

    // Get user quota from database
    let quota = await this.getUserQuota(userId, service, operation)
    
    if (!quota) {
      quota = {
        minuteHits: [],
        dayHits: [],
        lastReset: now
      }
    }

    // Clean old hits
    quota.minuteHits = quota.minuteHits.filter(hit => hit > minuteAgo)
    quota.dayHits = quota.dayHits.filter(hit => hit > dayAgo)

    // Check minute limit
    if (quota.minuteHits.length >= limits.perMinute) {
      return {
        allowed: false,
        reason: 'minute_limit_exceeded',
        resetIn: Math.ceil((Math.min(...quota.minuteHits) + 60000 - now) / 1000),
        limit: limits.perMinute,
        used: quota.minuteHits.length
      }
    }

    // Check daily limit
    if (quota.dayHits.length >= limits.perDay) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        resetIn: Math.ceil((Math.min(...quota.dayHits) + 86400000 - now) / 1000),
        limit: limits.perDay,
        used: quota.dayHits.length
      }
    }

    // Update quota
    quota.minuteHits.push(now)
    quota.dayHits.push(now)
    
    // Save updated quota
    await this.saveUserQuota(userId, service, operation, quota)

    return {
      allowed: true,
      remaining: {
        minute: limits.perMinute - quota.minuteHits.length,
        day: limits.perDay - quota.dayHits.length
      }
    }
  }

  async getUserQuota(userId, service, operation) {
    try {
      const { data } = await supabaseAdmin
        .from('user_api_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('service', service)
        .eq('operation', operation)
        .single()

      if (data) {
        return {
          minuteHits: data.minute_hits || [],
          dayHits: data.day_hits || [],
          lastReset: new Date(data.last_reset).getTime()
        }
      }

      return null
    } catch (error) {
      console.error('Error getting user quota:', error)
      return null
    }
  }

  async saveUserQuota(userId, service, operation, quota) {
    try {
      await supabaseAdmin
        .from('user_api_quotas')
        .upsert({
          user_id: userId,
          service,
          operation,
          minute_hits: quota.minuteHits,
          day_hits: quota.dayHits,
          last_reset: new Date(quota.lastReset).toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,service,operation'
        })
    } catch (error) {
      console.error('Error saving user quota:', error)
    }
  }

  // Middleware for Google API calls
  async middleware(service, operation) {
    return async (req, res, next) => {
      const userId = req.userId || req.query.userId
      
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' })
      }

      const result = await this.checkLimit(userId, service, operation)

      if (!result.allowed) {
        // Log rate limit violation
        await auditLogger.log({
          eventType: AuditEventTypes.API_RATE_LIMIT,
          userId,
          severity: AuditSeverity.WARNING,
          metadata: {
            service,
            operation,
            reason: result.reason,
            limit: result.limit,
            used: result.used
          },
          ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
          userAgent: req.headers['user-agent']
        })

        return res.status(429).json({
          error: 'Google API rate limit exceeded',
          reason: result.reason,
          resetIn: result.resetIn,
          limit: result.limit,
          used: result.used
        })
      }

      // Add remaining quota to response headers
      if (result.remaining) {
        res.setHeader('X-Google-API-Quota-Remaining-Minute', result.remaining.minute)
        res.setHeader('X-Google-API-Quota-Remaining-Day', result.remaining.day)
      }

      next()
    }
  }

  // Reset quotas (for scheduled cleanup)
  async resetExpiredQuotas() {
    try {
      const now = new Date()
      const dayAgo = new Date(now - 86400000)

      const { data, error } = await supabaseAdmin
        .from('user_api_quotas')
        .update({
          minute_hits: [],
          day_hits: [],
          last_reset: now.toISOString()
        })
        .lt('last_reset', dayAgo.toISOString())

      if (error) throw error

      console.log(`Reset ${data?.length || 0} expired quotas`)
      return data?.length || 0
    } catch (error) {
      console.error('Error resetting quotas:', error)
      return 0
    }
  }
}

// Create rate limiter instances
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter(securityConfig.rateLimit.api.default),
  
  // Auth rate limiter
  auth: new RateLimiter(securityConfig.rateLimit.api.auth),
  
  // Processing rate limiter
  process: new RateLimiter(securityConfig.rateLimit.api.process),
  
  // Google API rate limiter
  googleApi: new GoogleAPIRateLimiter()
}

// Helper function to apply rate limiting to API route
export function withRateLimit(handler, limiterName = 'api') {
  const limiter = rateLimiters[limiterName]
  
  return async (req, res) => {
    const key = req.headers['x-forwarded-for'] || 
                req.headers['x-real-ip'] || 
                req.connection?.remoteAddress || 
                'anonymous'
    
    const result = await limiter.limit(key)
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter.max)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
    
    if (result.limited) {
      res.setHeader('Retry-After', result.retryAfter)
      
      // Log rate limit violation
      await auditLogger.logSecurityEvent(
        req.userId || 'anonymous',
        AuditEventTypes.SECURITY_RATE_LIMIT_EXCEEDED,
        { 
          key, 
          endpoint: req.url,
          limiter: limiterName 
        },
        req
      )
      
      return res.status(429).json({
        error: result.message,
        retryAfter: result.retryAfter
      })
    }
    
    return handler(req, res)
  }
}

// Helper for Google API rate limiting
export function withGoogleAPILimit(service, operation) {
  return async (handler) => {
    return async (req, res) => {
      const userId = req.userId || req.query.userId
      
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' })
      }
      
      const result = await rateLimiters.googleApi.checkLimit(userId, service, operation)
      
      if (!result.allowed) {
        // Log rate limit violation
        await auditLogger.log({
          eventType: AuditEventTypes.API_RATE_LIMIT,
          userId,
          severity: AuditSeverity.WARNING,
          metadata: {
            service,
            operation,
            reason: result.reason,
            limit: result.limit,
            used: result.used
          },
          ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
          userAgent: req.headers['user-agent']
        })
        
        return res.status(429).json({
          error: 'Google API rate limit exceeded',
          reason: result.reason,
          resetIn: result.resetIn,
          limit: result.limit,
          used: result.used
        })
      }
      
      // Add remaining quota to response headers
      if (result.remaining) {
        res.setHeader('X-Google-API-Quota-Remaining-Minute', result.remaining.minute)
        res.setHeader('X-Google-API-Quota-Remaining-Day', result.remaining.day)
      }
      
      return handler(req, res)
    }
  }
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  const maxAge = 3600000 // 1 hour
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now - maxAge) {
      rateLimitStore.delete(key)
    }
  }
}, 300000) // Every 5 minutes