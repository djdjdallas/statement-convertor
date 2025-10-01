// Google Workspace Marketplace Security Configuration
export const securityConfig = {
  // Rate limiting configuration
  rateLimit: {
    // API rate limits per endpoint
    api: {
      default: {
        windowMs: 60 * 1000, // 1 minute
        max: 100, // requests per window
        message: 'Too many requests, please try again later'
      },
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 auth attempts per 15 minutes
        message: 'Too many authentication attempts'
      },
      googleApi: {
        windowMs: 60 * 1000, // 1 minute
        max: 30, // Google API calls per minute
        message: 'Google API rate limit exceeded'
      },
      process: {
        windowMs: 60 * 1000, // 1 minute
        max: 10, // Processing requests per minute
        message: 'Too many processing requests'
      }
    },
    // User-based rate limits
    user: {
      daily: {
        files: 100, // Max files per day
        apiCalls: 1000, // Max API calls per day
        exports: 50 // Max exports per day
      }
    }
  },

  // CORS configuration for Google Workspace
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://script.google.com',
      'https://docs.google.com',
      'https://sheets.google.com',
      'https://drive.google.com',
      /\.googleusercontent\.com$/,
      /\.google\.com$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Workspace-ID',
      'X-Domain'
    ],
    exposedHeaders: ['X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
    maxAge: 86400 // 24 hours
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for some libraries
        'https://apis.google.com',
        'https://accounts.google.com',
        'https://www.gstatic.com',
        'https://cdn.jsdelivr.net',
        'https://js.stripe.com'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://accounts.google.com',
        'https://cdn.jsdelivr.net'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.googleusercontent.com',
        'https://*.google.com',
        'https://lh3.googleusercontent.com',
        'https://ssl.gstatic.com'
      ],
      connectSrc: [
        "'self'",
        'https://apis.google.com',
        'https://accounts.google.com',
        'https://www.googleapis.com',
        'https://oauth2.googleapis.com',
        'https://sheets.googleapis.com',
        'https://drive.googleapis.com',
        'https://docs.googleapis.com',
        'wss://*.supabase.co',
        'https://*.supabase.co',
        'https://api.stripe.com'
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: [
        "'self'",
        'https://accounts.google.com',
        'https://docs.google.com',
        'https://drive.google.com',
        'https://*.google.com'
      ],
      frameSrc: [
        "'self'",
        'https://accounts.google.com',
        'https://docs.google.com',
        'https://drive.google.com',
        'https://*.google.com',
        'https://script.google.com',
        'https://js.stripe.com',
        'https://hooks.stripe.com'
      ],
      workerSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },

  // Security headers
  headers: {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=*, microphone=(), geolocation=()', // Allow camera for Google Picker
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  },

  // Data retention policies
  dataRetention: {
    files: 90, // days
    processedData: 30, // days
    auditLogs: 365, // days
    sessionData: 7, // days
    tempFiles: 1 // days
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: {
      iterations: 100000,
      saltLength: 64,
      keyLength: 32,
      digest: 'sha256'
    }
  },

  // Session configuration
  session: {
    name: 'statement-desk-session',
    secret: process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },

  // Google Workspace specific settings
  googleWorkspace: {
    // Allowed OAuth scopes
    allowedScopes: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    // Domain restrictions (if needed)
    allowedDomains: process.env.ALLOWED_DOMAINS?.split(',') || [],
    // Service account settings
    serviceAccount: {
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    }
  },

  // Monitoring and alerting
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    alertThresholds: {
      errorRate: 0.05, // 5% error rate
      responseTime: 3000, // 3 seconds
      rateLimitViolations: 100 // per hour
    }
  }
}

// Helper to generate CSP header string
export function generateCSPHeader(directives = securityConfig.csp.directives) {
  return Object.entries(directives)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => {
      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      const directiveValue = Array.isArray(value) ? value.join(' ') : value
      return `${directiveName} ${directiveValue}`
    })
    .join('; ')
}

// Helper to check if domain is allowed
export function isDomainAllowed(email) {
  const allowedDomains = securityConfig.googleWorkspace.allowedDomains
  if (!allowedDomains || allowedDomains.length === 0) {
    return true // No restrictions
  }
  
  const domain = email.split('@')[1]
  return allowedDomains.includes(domain)
}

// Helper to validate OAuth scopes
export function validateScopes(requestedScopes) {
  const allowedScopes = securityConfig.googleWorkspace.allowedScopes
  const scopeArray = requestedScopes.split(' ')
  
  return scopeArray.every(scope => allowedScopes.includes(scope))
}