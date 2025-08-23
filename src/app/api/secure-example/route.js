import { NextResponse } from 'next/server'
import { withSecurity, withEnhancedSecurity } from '@/lib/security/middleware'
import { withRateLimit, withGoogleAPILimit } from '@/lib/security/rate-limiter'
import { auditLogger, AuditEventTypes } from '@/lib/security/audit-logger'
import { securityMonitor } from '@/lib/security/monitoring'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Example: Basic API route with security
export async function GET(request) {
  const startTime = Date.now()
  
  try {
    // Apply rate limiting
    const handler = withRateLimit(async (req, res) => {
      // Get authenticated user
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        // Log failed auth attempt
        await auditLogger.logAuth(
          null,
          AuditEventTypes.AUTH_FAILED,
          { reason: 'No valid session' },
          request
        )
        
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Log successful API access
      await auditLogger.logApiCall(
        user.id,
        '/api/secure-example',
        'GET',
        { query: Object.fromEntries(request.nextUrl.searchParams) },
        request
      )

      // Your API logic here
      const data = {
        message: 'This is a secure endpoint',
        user: user.email,
        timestamp: new Date().toISOString()
      }

      // Track metrics
      const responseTime = Date.now() - startTime
      await securityMonitor.trackApiMetrics(
        '/api/secure-example',
        responseTime,
        true,
        user.id
      )

      return NextResponse.json(data)
    }, 'api') // Use 'api' rate limiter

    return handler(request, NextResponse)
  } catch (error) {
    // Log error
    await auditLogger.log({
      eventType: AuditEventTypes.API_ERROR,
      userId: 'unknown',
      severity: 'error',
      metadata: {
        error: error.message,
        endpoint: '/api/secure-example'
      },
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent')
    })

    // Track failed metric
    const responseTime = Date.now() - startTime
    await securityMonitor.trackApiMetrics(
      '/api/secure-example',
      responseTime,
      false
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example: POST with enhanced security and Google API limits
export async function POST(request) {
  const startTime = Date.now()

  // Create enhanced security handler
  const secureHandler = withEnhancedSecurity({
    requireDomain: true, // Require allowed domain
    requiredScopes: ['https://www.googleapis.com/auth/drive.file'] // Required OAuth scopes
  })

  return secureHandler(async (req, res) => {
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

      // Apply Google API rate limiting
      const googleHandler = await withGoogleAPILimit('drive', 'write')(
        async (req, res) => {
          const body = await request.json()

          // Log file operation
          await auditLogger.logFileOperation(
            user.id,
            AuditEventTypes.FILE_PROCESS,
            body.fileId,
            { 
              operation: 'process_with_google',
              ...body 
            },
            request
          )

          // Simulate Google API operation
          const result = {
            success: true,
            fileId: body.fileId,
            processedAt: new Date().toISOString()
          }

          // Log successful operation
          await auditLogger.log({
            eventType: AuditEventTypes.DRIVE_ACCESS,
            userId: user.id,
            severity: 'info',
            metadata: {
              operation: 'file_process',
              fileId: body.fileId,
              success: true
            },
            resourceType: 'file',
            resourceId: body.fileId,
            ipAddress: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent')
          })

          // Track metrics
          const responseTime = Date.now() - startTime
          await securityMonitor.trackApiMetrics(
            '/api/secure-example',
            responseTime,
            true,
            user.id
          )

          return NextResponse.json(result)
        }
      )

      // Add request context for rate limiter
      req.userId = user.id
      return googleHandler(req, res)
    } catch (error) {
      // Log error with context
      await auditLogger.log({
        eventType: AuditEventTypes.API_ERROR,
        userId: user?.id || 'unknown',
        severity: 'error',
        metadata: {
          error: error.message,
          endpoint: '/api/secure-example',
          method: 'POST'
        },
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent')
      })

      // Track failed metric
      const responseTime = Date.now() - startTime
      await securityMonitor.trackApiMetrics(
        '/api/secure-example',
        responseTime,
        false,
        user?.id
      )

      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      )
    }
  })(request, NextResponse)
}

// Example: DELETE with GDPR compliance
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('id')

    // Log GDPR data deletion request
    await auditLogger.logGDPRDataDeletion(
      user.id,
      'user_file',
      request
    )

    // Perform deletion
    // ... your deletion logic here ...

    // Log successful deletion
    await auditLogger.log({
      eventType: AuditEventTypes.DATA_DELETE,
      userId: user.id,
      severity: 'warning',
      metadata: {
        resource_type: 'file',
        resource_id: resourceId,
        gdpr_request: true,
        permanent: true
      },
      resourceType: 'file',
      resourceId: resourceId,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      success: true
    })

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Deletion failed' },
      { status: 500 }
    )
  }
}