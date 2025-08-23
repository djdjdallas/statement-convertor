// Security module exports
export { securityConfig, generateCSPHeader, isDomainAllowed, validateScopes } from './config'
export { auditLogger, AuditEventTypes, AuditSeverity } from './audit-logger'
export { 
  RateLimiter, 
  GoogleAPIRateLimiter, 
  rateLimiters, 
  withRateLimit, 
  withGoogleAPILimit 
} from './rate-limiter'
export { 
  securityMiddleware, 
  withSecurity, 
  withEnhancedSecurity 
} from './middleware'
export { securityMonitor, SecurityMonitor } from './monitoring'

// Re-export commonly used combinations
export const secureApiRoute = (handler, options = {}) => {
  const { rateLimit = 'api', ...securityOptions } = options
  return withRateLimit(
    withSecurity(handler, securityOptions),
    rateLimit
  )
}

export const secureGoogleApiRoute = (service, operation) => {
  return (handler, options = {}) => {
    return withGoogleAPILimit(service, operation)(
      withEnhancedSecurity(options)(handler)
    )
  }
}