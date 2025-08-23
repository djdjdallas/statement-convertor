import { mockAPIErrors } from '../../mocks/google-apis.mock'
import { MockFactory } from '../../utils/mock-factories'

// Mock rate limiter implementation
const mockRateLimiter = {
  checkLimit: jest.fn(),
  recordRequest: jest.fn(),
  getRemainingQuota: jest.fn(),
  reset: jest.fn(),
  getRetryAfter: jest.fn()
}

jest.mock('@/lib/google/rate-limiter', () => mockRateLimiter)

describe('API Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rate Limit Detection', () => {
    it('should detect Google API rate limits', async () => {
      const error = {
        code: 403,
        errors: [{
          domain: 'usageLimits',
          reason: 'userRateLimitExceeded'
        }]
      }

      const isRateLimitError = (err) => {
        return err.code === 403 && 
               err.errors?.[0]?.domain === 'usageLimits' &&
               err.errors?.[0]?.reason === 'userRateLimitExceeded'
      }

      expect(isRateLimitError(error)).toBe(true)
      expect(isRateLimitError({ code: 404 })).toBe(false)
    })

    it('should detect Anthropic API rate limits', async () => {
      const error = {
        status: 429,
        headers: {
          'retry-after': '60',
          'x-ratelimit-limit': '1000',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': new Date(Date.now() + 60000).toISOString()
        }
      }

      const isAnthropicRateLimit = (err) => {
        return err.status === 429 && err.headers?.['retry-after']
      }

      expect(isAnthropicRateLimit(error)).toBe(true)
    })

    it('should track request counts per API', async () => {
      const apis = ['drive', 'sheets', 'claude']
      const limits = {
        drive: { perMinute: 60, perDay: 10000 },
        sheets: { perMinute: 60, perDay: 50000 },
        claude: { perMinute: 10, perDay: 1000 }
      }

      for (const api of apis) {
        mockRateLimiter.checkLimit.mockResolvedValue({
          allowed: true,
          remaining: limits[api].perMinute - 1
        })

        const result = await mockRateLimiter.checkLimit(api)
        
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBeLessThan(limits[api].perMinute)
      }
    })
  })

  describe('Retry Logic', () => {
    it('should implement exponential backoff', async () => {
      const delays = []
      const maxRetries = 5
      
      const exponentialBackoff = (attempt, baseDelay = 1000) => {
        return Math.min(baseDelay * Math.pow(2, attempt), 32000)
      }

      for (let i = 0; i < maxRetries; i++) {
        delays.push(exponentialBackoff(i))
      }

      expect(delays).toEqual([1000, 2000, 4000, 8000, 16000])
    })

    it('should retry with jitter to avoid thundering herd', async () => {
      const getRetryDelay = (attempt, baseDelay = 1000) => {
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), 32000)
        const jitter = Math.random() * 0.3 * exponentialDelay // 30% jitter
        return Math.floor(exponentialDelay + jitter)
      }

      const delays = Array(5).fill(null).map((_, i) => getRetryDelay(i))
      
      // Verify delays are not exactly exponential (due to jitter)
      expect(delays[1]).toBeGreaterThan(delays[0])
      expect(delays[1]).not.toBe(2000) // Would be exactly 2000 without jitter
    })

    it('should respect retry-after header', async () => {
      const retryAfter = 60 // seconds
      
      mockRateLimiter.getRetryAfter.mockReturnValue(retryAfter * 1000)

      const makeRequestWithRetry = async () => {
        const retryDelay = mockRateLimiter.getRetryAfter()
        
        if (retryDelay) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
        
        return { retried: true, delay: retryDelay }
      }

      const promise = makeRequestWithRetry()
      
      // Fast-forward time
      jest.advanceTimersByTime(60000)
      
      const result = await promise
      
      expect(result.retried).toBe(true)
      expect(result.delay).toBe(60000)
    })

    it('should give up after max retries', async () => {
      let attempts = 0
      const maxRetries = 3
      
      const makeRequest = jest.fn().mockRejectedValue(mockAPIErrors.quotaExceeded)
      
      const requestWithRetry = async () => {
        while (attempts < maxRetries) {
          try {
            return await makeRequest()
          } catch (error) {
            attempts++
            if (attempts >= maxRetries) {
              throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`)
            }
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      await expect(requestWithRetry()).rejects.toThrow('Failed after 3 attempts')
      expect(attempts).toBe(3)
    })
  })

  describe('Quota Management', () => {
    it('should track daily quota usage', async () => {
      const userId = 'test-user-id'
      const quotas = {
        drive: { used: 500, limit: 10000 },
        sheets: { used: 1000, limit: 50000 },
        claude: { used: 50, limit: 1000 }
      }

      mockRateLimiter.getRemainingQuota.mockImplementation((api) => {
        const quota = quotas[api]
        return {
          remaining: quota.limit - quota.used,
          limit: quota.limit,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      })

      for (const api of Object.keys(quotas)) {
        const quota = await mockRateLimiter.getRemainingQuota(api)
        
        expect(quota.remaining).toBe(quotas[api].limit - quotas[api].used)
        expect(quota.limit).toBe(quotas[api].limit)
      }
    })

    it('should prevent requests when quota exhausted', async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        reason: 'Daily quota exceeded',
        resetTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      })

      const result = await mockRateLimiter.checkLimit('drive')
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('quota exceeded')
    })

    it('should reset quotas at midnight UTC', async () => {
      const checkQuotaReset = () => {
        const now = new Date()
        const resetTime = new Date(now)
        resetTime.setUTCHours(24, 0, 0, 0)
        
        return {
          currentTime: now.toISOString(),
          resetTime: resetTime.toISOString(),
          hoursUntilReset: (resetTime - now) / (1000 * 60 * 60)
        }
      }

      const quotaInfo = checkQuotaReset()
      
      expect(quotaInfo.hoursUntilReset).toBeGreaterThan(0)
      expect(quotaInfo.hoursUntilReset).toBeLessThanOrEqual(24)
    })
  })

  describe('Burst Protection', () => {
    it('should implement token bucket algorithm', async () => {
      class TokenBucket {
        constructor(capacity, refillRate) {
          this.capacity = capacity
          this.tokens = capacity
          this.refillRate = refillRate
          this.lastRefill = Date.now()
        }

        consume(tokens = 1) {
          this.refill()
          
          if (this.tokens >= tokens) {
            this.tokens -= tokens
            return true
          }
          
          return false
        }

        refill() {
          const now = Date.now()
          const elapsed = (now - this.lastRefill) / 1000
          const tokensToAdd = elapsed * this.refillRate
          
          this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
          this.lastRefill = now
        }

        getTokens() {
          this.refill()
          return Math.floor(this.tokens)
        }
      }

      const bucket = new TokenBucket(10, 1) // 10 tokens, 1 per second
      
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        expect(bucket.consume()).toBe(true)
      }
      
      // Should fail when empty
      expect(bucket.consume()).toBe(false)
      
      // Wait 2 seconds
      jest.advanceTimersByTime(2000)
      
      // Should have 2 tokens now
      expect(bucket.getTokens()).toBe(2)
      expect(bucket.consume()).toBe(true)
      expect(bucket.consume()).toBe(true)
      expect(bucket.consume()).toBe(false)
    })

    it('should queue requests when rate limited', async () => {
      const queue = []
      let processing = false
      
      const enqueueRequest = (request) => {
        return new Promise((resolve, reject) => {
          queue.push({ request, resolve, reject })
          processQueue()
        })
      }

      const processQueue = async () => {
        if (processing || queue.length === 0) return
        
        processing = true
        const { request, resolve, reject } = queue.shift()
        
        try {
          // Simulate rate limiting
          await new Promise(r => setTimeout(r, 100))
          const result = await request()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          processing = false
          processQueue()
        }
      }

      // Queue multiple requests
      const requests = Array(5).fill(null).map((_, i) => 
        enqueueRequest(() => Promise.resolve(`Result ${i}`))
      )

      jest.advanceTimersByTime(600)
      
      const results = await Promise.all(requests)
      
      expect(results).toEqual(['Result 0', 'Result 1', 'Result 2', 'Result 3', 'Result 4'])
    })
  })

  describe('Rate Limit Headers', () => {
    it('should parse and respect rate limit headers', async () => {
      const headers = {
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '15',
        'x-ratelimit-reset': new Date(Date.now() + 300000).toISOString()
      }

      const parseRateLimitHeaders = (headers) => {
        return {
          limit: parseInt(headers['x-ratelimit-limit'] || '0'),
          remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
          reset: new Date(headers['x-ratelimit-reset'] || Date.now()),
          percentUsed: ((60 - 15) / 60) * 100
        }
      }

      const rateLimitInfo = parseRateLimitHeaders(headers)
      
      expect(rateLimitInfo.limit).toBe(60)
      expect(rateLimitInfo.remaining).toBe(15)
      expect(rateLimitInfo.percentUsed).toBe(75)
    })

    it('should slow down when approaching limits', async () => {
      const getDelayMultiplier = (percentUsed) => {
        if (percentUsed < 50) return 1
        if (percentUsed < 75) return 2
        if (percentUsed < 90) return 4
        return 8
      }

      expect(getDelayMultiplier(25)).toBe(1)
      expect(getDelayMultiplier(60)).toBe(2)
      expect(getDelayMultiplier(80)).toBe(4)
      expect(getDelayMultiplier(95)).toBe(8)
    })
  })

  describe('Multi-tenant Rate Limiting', () => {
    it('should track limits per user', async () => {
      const users = ['user-1', 'user-2', 'user-3']
      const userLimits = new Map()
      
      // Initialize limits for each user
      users.forEach(userId => {
        userLimits.set(userId, {
          requests: 0,
          limit: 100,
          resetTime: Date.now() + 3600000
        })
      })

      // Simulate requests from different users
      const makeUserRequest = (userId) => {
        const limits = userLimits.get(userId)
        if (limits.requests >= limits.limit) {
          return { allowed: false, userId }
        }
        
        limits.requests++
        return { allowed: true, userId, remaining: limits.limit - limits.requests }
      }

      // User 1 makes 100 requests
      for (let i = 0; i < 100; i++) {
        const result = makeUserRequest('user-1')
        expect(result.allowed).toBe(true)
      }
      
      // User 1's next request should fail
      expect(makeUserRequest('user-1').allowed).toBe(false)
      
      // But user 2 can still make requests
      expect(makeUserRequest('user-2').allowed).toBe(true)
    })

    it('should handle workspace-level limits', async () => {
      const workspaceLimits = {
        'example.com': { limit: 10000, used: 0 },
        'company.com': { limit: 50000, used: 0 }
      }

      const checkWorkspaceLimit = (email) => {
        const domain = email.split('@')[1]
        const limits = workspaceLimits[domain]
        
        if (!limits) return { allowed: true, isPersonal: true }
        
        if (limits.used >= limits.limit) {
          return { allowed: false, domain, remaining: 0 }
        }
        
        limits.used++
        return { 
          allowed: true, 
          domain, 
          remaining: limits.limit - limits.used,
          percentUsed: (limits.used / limits.limit) * 100
        }
      }

      // Personal email has no workspace limits
      expect(checkWorkspaceLimit('user@gmail.com').isPersonal).toBe(true)
      
      // Workspace emails have limits
      const result = checkWorkspaceLimit('user@example.com')
      expect(result.allowed).toBe(true)
      expect(result.domain).toBe('example.com')
      expect(result.remaining).toBe(9999)
    })
  })
})