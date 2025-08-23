import { createClient } from '@/lib/supabase/client';
import { GOOGLE_ERROR_CODES } from './error-handler';

// Rate limit configuration
const RATE_LIMITS = {
  // Google Drive API limits
  drive: {
    perSecond: 10,
    perMinute: 100,
    perHour: 1000,
    perDay: 10000
  },
  // Google Sheets API limits
  sheets: {
    perSecond: 10,
    perMinute: 100,
    perHour: 500,
    perDay: 5000
  },
  // Per-user limits
  perUser: {
    perMinute: 20,
    perHour: 100,
    perDay: 1000
  }
};

// In-memory store for rate limiting (consider Redis for production)
const rateLimitStore = new Map();

/**
 * Get rate limit key
 */
function getRateLimitKey(userId, service, window) {
  const now = new Date();
  let timeKey;
  
  switch (window) {
    case 'second':
      timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}-${now.getUTCSeconds()}`;
      break;
    case 'minute':
      timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
      break;
    case 'hour':
      timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
      break;
    case 'day':
      timeKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      break;
  }
  
  return `${userId}:${service}:${window}:${timeKey}`;
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.timestamp > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);

/**
 * Check if request is within rate limits
 */
export async function checkRateLimit(userId, service = 'drive') {
  const limits = RATE_LIMITS[service] || RATE_LIMITS.drive;
  const windows = ['second', 'minute', 'hour', 'day'];
  const violations = [];
  
  for (const window of windows) {
    const limit = limits[`per${window.charAt(0).toUpperCase() + window.slice(1)}`];
    if (!limit) continue;
    
    const key = getRateLimitKey(userId, service, window);
    const current = rateLimitStore.get(key) || { count: 0, timestamp: Date.now() };
    
    if (current.count >= limit) {
      violations.push({
        window,
        limit,
        current: current.count,
        resetTime: getResetTime(window)
      });
    }
  }
  
  // Check per-user limits
  const userLimits = RATE_LIMITS.perUser;
  for (const window of ['minute', 'hour', 'day']) {
    const limit = userLimits[`per${window.charAt(0).toUpperCase() + window.slice(1)}`];
    const key = getRateLimitKey(userId, 'user', window);
    const current = rateLimitStore.get(key) || { count: 0, timestamp: Date.now() };
    
    if (current.count >= limit) {
      violations.push({
        window,
        limit,
        current: current.count,
        resetTime: getResetTime(window),
        type: 'user'
      });
    }
  }
  
  if (violations.length > 0) {
    // Find the most restrictive violation
    const mostRestrictive = violations.reduce((prev, curr) => {
      const prevRemaining = prev.limit - prev.current;
      const currRemaining = curr.limit - curr.current;
      return prevRemaining < currRemaining ? prev : curr;
    });
    
    return {
      allowed: false,
      violation: mostRestrictive,
      retryAfter: getRetryAfter(mostRestrictive.window)
    };
  }
  
  return { allowed: true };
}

/**
 * Increment rate limit counter
 */
export function incrementRateLimit(userId, service = 'drive') {
  const windows = ['second', 'minute', 'hour', 'day'];
  
  // Increment service-specific counters
  for (const window of windows) {
    const key = getRateLimitKey(userId, service, window);
    const current = rateLimitStore.get(key) || { count: 0, timestamp: Date.now() };
    rateLimitStore.set(key, { count: current.count + 1, timestamp: Date.now() });
  }
  
  // Increment per-user counters
  for (const window of ['minute', 'hour', 'day']) {
    const key = getRateLimitKey(userId, 'user', window);
    const current = rateLimitStore.get(key) || { count: 0, timestamp: Date.now() };
    rateLimitStore.set(key, { count: current.count + 1, timestamp: Date.now() });
  }
}

/**
 * Get reset time for a window
 */
function getResetTime(window) {
  const now = new Date();
  
  switch (window) {
    case 'second':
      return new Date(now.getTime() + 1000);
    case 'minute':
      return new Date(now.getTime() + 60 * 1000);
    case 'hour':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'day':
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      return tomorrow;
    default:
      return now;
  }
}

/**
 * Get retry after seconds
 */
function getRetryAfter(window) {
  switch (window) {
    case 'second':
      return 1;
    case 'minute':
      return 60;
    case 'hour':
      return 300; // 5 minutes
    case 'day':
      return 3600; // 1 hour
    default:
      return 60;
  }
}

/**
 * Rate limit middleware for Google API operations
 */
export async function withRateLimit(userId, service, operation) {
  // Check rate limit
  const rateLimitCheck = await checkRateLimit(userId, service);
  
  if (!rateLimitCheck.allowed) {
    const error = new Error(`Rate limit exceeded: ${rateLimitCheck.violation.current}/${rateLimitCheck.violation.limit} requests per ${rateLimitCheck.violation.window}`);
    error.code = GOOGLE_ERROR_CODES.RATE_LIMITED;
    error.retryAfter = rateLimitCheck.retryAfter;
    error.resetTime = rateLimitCheck.violation.resetTime;
    throw error;
  }
  
  try {
    // Execute the operation
    const result = await operation();
    
    // Increment rate limit counter on success
    incrementRateLimit(userId, service);
    
    return result;
  } catch (error) {
    // Still increment counter on error to prevent abuse
    incrementRateLimit(userId, service);
    throw error;
  }
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId, service = 'drive') {
  const limits = RATE_LIMITS[service] || RATE_LIMITS.drive;
  const status = {};
  
  for (const [period, limit] of Object.entries(limits)) {
    const window = period.replace('per', '').toLowerCase();
    const key = getRateLimitKey(userId, service, window);
    const current = rateLimitStore.get(key) || { count: 0 };
    
    status[period] = {
      used: current.count,
      limit: limit,
      remaining: Math.max(0, limit - current.count),
      resetTime: getResetTime(window)
    };
  }
  
  // Add user limits
  const userStatus = {};
  for (const [period, limit] of Object.entries(RATE_LIMITS.perUser)) {
    const window = period.replace('per', '').toLowerCase();
    const key = getRateLimitKey(userId, 'user', window);
    const current = rateLimitStore.get(key) || { count: 0 };
    
    userStatus[period] = {
      used: current.count,
      limit: limit,
      remaining: Math.max(0, limit - current.count),
      resetTime: getResetTime(window)
    };
  }
  
  return {
    service: status,
    user: userStatus
  };
}

/**
 * Reset rate limits for a user (admin function)
 */
export function resetRateLimits(userId, service = null) {
  const keysToDelete = [];
  
  for (const [key] of rateLimitStore.entries()) {
    if (key.startsWith(userId)) {
      if (!service || key.includes(`:${service}:`)) {
        keysToDelete.push(key);
      }
    }
  }
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
  
  return keysToDelete.length;
}