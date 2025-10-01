import { NextResponse } from 'next/server'
import { securityConfig, generateCSPHeader, isDomainAllowed } from './config'
import { auditLogger, AuditEventTypes } from './audit-logger'
import { createServerClient } from '@supabase/ssr'

// Security middleware for Next.js
export async function securityMiddleware(request) {
  const response = NextResponse.next()
  const url = new URL(request.url)

  // Apply security headers
  applySecurityHeaders(response, request)

  // Apply CORS for API routes
  if (url.pathname.startsWith('/api')) {
    applyCORS(response, request)
  }

  // Check for suspicious patterns
  await checkSuspiciousActivity(request)

  // Validate Google Workspace domain restrictions
  if (url.pathname.includes('/auth/google') || url.pathname.includes('/api/google')) {
    const domainCheck = await validateDomain(request)
    if (!domainCheck.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Domain not allowed' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return response
}

// Apply security headers
function applySecurityHeaders(response, request) {
  const url = new URL(request.url)

  // Special handling for upload page (Google Picker needs relaxed CSP)
  if (url.pathname.includes('/upload')) {
    // Apply minimal headers for Google Picker compatibility
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

    // Relaxed CSP for Google Picker
    const relaxedCSP = generateCSPHeader({
      ...securityConfig.csp.directives,
      frameSrc: ["'self'", 'https://*.google.com', 'https://*.gstatic.com'],
      childSrc: ["'self'", 'https://*.google.com', 'https://*.gstatic.com'],
    })
    response.headers.set('Content-Security-Policy', relaxedCSP)
    return
  }

  // Basic security headers for other pages
  Object.entries(securityConfig.headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })

  // Content Security Policy
  const cspHeader = generateCSPHeader()
  response.headers.set('Content-Security-Policy', cspHeader)

  // Report-Only CSP for testing
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Content-Security-Policy-Report-Only', cspHeader)
  }

  // Additional Google Workspace specific headers
  if (request.headers.get('referer')?.includes('google.com')) {
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  }
}

// Apply CORS headers
function applyCORS(response, request) {
  const origin = request.headers.get('origin')
  const { cors } = securityConfig

  // Check if origin is allowed
  let isAllowed = false
  if (origin) {
    isAllowed = cors.origin.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin)
      }
      return allowed === origin
    })
  }

  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', String(cors.credentials))
    
    if (request.method === 'OPTIONS') {
      response.headers.set('Access-Control-Allow-Methods', cors.methods.join(', '))
      response.headers.set('Access-Control-Allow-Headers', cors.allowedHeaders.join(', '))
      response.headers.set('Access-Control-Max-Age', String(cors.maxAge))
      
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
    
    cors.exposedHeaders.forEach(header => {
      response.headers.set('Access-Control-Expose-Headers', header)
    })
  }
}

// Check for suspicious activity patterns
async function checkSuspiciousActivity(request) {
  const suspiciousPatterns = [
    // SQL injection patterns
    /(\bUNION\b.*\bSELECT\b)|(\bOR\b.*=.*\bOR\b)|(\'; DROP TABLE)/i,
    // XSS patterns
    /<script[^>]*>|javascript:|onerror=/i,
    // Path traversal
    /\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f/i,
    // Command injection
    /[;&|`].*?(rm|del|format|shutdown|reboot)/i
  ]

  const url = request.url
  const body = await getRequestBody(request)
  const headers = Object.fromEntries(request.headers.entries())
  
  // Check URL
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      await logSuspiciousActivity(request, 'suspicious_url_pattern', { pattern: pattern.toString() })
      return
    }
  }

  // Check headers
  for (const [key, value] of Object.entries(headers)) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(value)) {
        await logSuspiciousActivity(request, 'suspicious_header_pattern', { 
          header: key,
          pattern: pattern.toString() 
        })
        return
      }
    }
  }

  // Check body
  if (body) {
    const bodyString = JSON.stringify(body)
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(bodyString)) {
        await logSuspiciousActivity(request, 'suspicious_body_pattern', { 
          pattern: pattern.toString() 
        })
        return
      }
    }
  }
}

// Get request body safely
async function getRequestBody(request) {
  try {
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const text = await request.text()
      return text ? JSON.parse(text) : null
    }
    
    return null
  } catch (error) {
    console.error('Error parsing request body:', error)
    return null
  }
}

// Log suspicious activity
async function logSuspiciousActivity(request, type, metadata = {}) {
  const userId = await getUserIdFromRequest(request)
  
  await auditLogger.log({
    eventType: AuditEventTypes.SECURITY_SUSPICIOUS_ACTIVITY,
    userId: userId || 'anonymous',
    severity: 'warning',
    metadata: {
      type,
      url: request.url,
      method: request.method,
      ...metadata
    },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent')
  })
}

// Get user ID from request
async function getUserIdFromRequest(request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // This is a read-only operation, so we don't need to set cookies
            // If needed, you would implement the cookie setting logic here
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    return user?.id
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

// Validate domain restrictions
async function validateDomain(request) {
  try {
    // Check if domain restrictions are enabled
    const allowedDomains = securityConfig.googleWorkspace.allowedDomains
    if (!allowedDomains || allowedDomains.length === 0) {
      return { allowed: true }
    }

    // Get email from various sources
    let email = null
    
    // Check authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      // Decode JWT or get email from auth service
      const userId = await getUserIdFromRequest(request)
      if (userId) {
        // Get user email from database
        const { data } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', userId)
          .single()
        
        email = data?.email
      }
    }

    // Check query parameters
    if (!email) {
      const url = new URL(request.url)
      email = url.searchParams.get('email') || url.searchParams.get('login_hint')
    }

    // Check body
    if (!email && request.method === 'POST') {
      const body = await getRequestBody(request)
      email = body?.email
    }

    if (!email) {
      return { allowed: true } // Allow if we can't determine email
    }

    const domain = email.split('@')[1]
    const allowed = allowedDomains.includes(domain)

    if (!allowed) {
      await auditLogger.log({
        eventType: AuditEventTypes.SECURITY_PERMISSION_DENIED,
        userId: await getUserIdFromRequest(request) || 'anonymous',
        severity: 'warning',
        metadata: {
          reason: 'domain_not_allowed',
          domain,
          email,
          allowed_domains: allowedDomains
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      })
    }

    return { allowed, domain }
  } catch (error) {
    console.error('Error validating domain:', error)
    return { allowed: true } // Allow on error to prevent blocking
  }
}

// API route wrapper with security checks
export function withSecurity(handler, options = {}) {
  return async (req, res) => {
    try {
      // Apply security headers
      Object.entries(securityConfig.headers).forEach(([key, value]) => {
        if (value) {
          res.setHeader(key, value)
        }
      })

      // Apply CSP
      res.setHeader('Content-Security-Policy', generateCSPHeader())

      // Log API access
      const userId = req.userId || 'anonymous'
      await auditLogger.logApiCall(
        userId,
        req.url,
        req.method,
        {
          query: req.query,
          hasBody: !!req.body
        },
        req
      )

      // Check domain restrictions if specified
      if (options.requireDomain) {
        const email = req.body?.email || req.query?.email
        if (email && !isDomainAllowed(email)) {
          await auditLogger.log({
            eventType: AuditEventTypes.SECURITY_PERMISSION_DENIED,
            userId,
            severity: 'warning',
            metadata: {
              reason: 'domain_not_allowed',
              email,
              endpoint: req.url
            },
            ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
            userAgent: req.headers['user-agent']
          })

          return res.status(403).json({
            error: 'Domain not allowed',
            message: 'Your domain is not authorized to use this service'
          })
        }
      }

      // Check OAuth scope requirements
      if (options.requiredScopes) {
        const userScopes = req.scopes || []
        const hasRequiredScopes = options.requiredScopes.every(scope => 
          userScopes.includes(scope)
        )

        if (!hasRequiredScopes) {
          await auditLogger.log({
            eventType: AuditEventTypes.SECURITY_PERMISSION_DENIED,
            userId,
            severity: 'warning',
            metadata: {
              reason: 'insufficient_scopes',
              required: options.requiredScopes,
              actual: userScopes,
              endpoint: req.url
            },
            ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
            userAgent: req.headers['user-agent']
          })

          return res.status(403).json({
            error: 'Insufficient permissions',
            message: 'Additional OAuth scopes required',
            required_scopes: options.requiredScopes
          })
        }
      }

      // Execute handler
      return handler(req, res)
    } catch (error) {
      console.error('Security middleware error:', error)
      
      // Log error
      await auditLogger.log({
        eventType: AuditEventTypes.API_ERROR,
        userId: req.userId || 'anonymous',
        severity: 'error',
        metadata: {
          error: error.message,
          endpoint: req.url,
          method: req.method
        },
        ipAddress: req.headers['x-forwarded-for'] || req.headers['x-real-ip'],
        userAgent: req.headers['user-agent']
      })

      return res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred processing your request'
      })
    }
  }
}

// Enhanced middleware with all security features
export function withEnhancedSecurity(options = {}) {
  return (handler) => {
    return withSecurity(
      handler,
      {
        requireDomain: options.requireDomain || false,
        requiredScopes: options.requiredScopes || [],
        ...options
      }
    )
  }
}