import { supabaseAdmin } from '@/lib/supabase-admin'

// Audit event types
export const AuditEventTypes = {
  // Authentication events
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',
  AUTH_TOKEN_REFRESH: 'auth.token_refresh',
  AUTH_GOOGLE_LINK: 'auth.google_link',
  AUTH_GOOGLE_UNLINK: 'auth.google_unlink',
  
  // File operations
  FILE_UPLOAD: 'file.upload',
  FILE_PROCESS: 'file.process',
  FILE_VIEW: 'file.view',
  FILE_DOWNLOAD: 'file.download',
  FILE_DELETE: 'file.delete',
  FILE_EXPORT: 'file.export',
  
  // Google Drive operations
  DRIVE_ACCESS: 'drive.access',
  DRIVE_FILE_SELECT: 'drive.file_select',
  DRIVE_EXPORT: 'drive.export',
  DRIVE_PERMISSION_GRANT: 'drive.permission_grant',
  DRIVE_PERMISSION_REVOKE: 'drive.permission_revoke',
  
  // Data operations
  DATA_VIEW: 'data.view',
  DATA_MODIFY: 'data.modify',
  DATA_EXPORT: 'data.export',
  DATA_DELETE: 'data.delete',
  
  // Admin operations
  ADMIN_ACCESS: 'admin.access',
  ADMIN_USER_MODIFY: 'admin.user_modify',
  ADMIN_SETTINGS_CHANGE: 'admin.settings_change',
  
  // Security events
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  SECURITY_RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  SECURITY_INVALID_TOKEN: 'security.invalid_token',
  SECURITY_PERMISSION_DENIED: 'security.permission_denied',
  
  // API events
  API_CALL: 'api.call',
  API_ERROR: 'api.error',
  API_RATE_LIMIT: 'api.rate_limit',
  
  // Workspace events
  WORKSPACE_INSTALL: 'workspace.install',
  WORKSPACE_UNINSTALL: 'workspace.uninstall',
  WORKSPACE_USER_ADD: 'workspace.user_add',
  WORKSPACE_USER_REMOVE: 'workspace.user_remove'
}

// Audit severity levels
export const AuditSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
}

class AuditLogger {
  constructor() {
    this.queue = []
    this.flushInterval = null
    this.flushErrorCount = 0
    this.maxFlushErrors = 3 // Stop after 3 consecutive errors
    this.lastErrorMessage = null
    this.startBatchProcessor()
  }

  // Start batch processor for performance
  startBatchProcessor() {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, 5000) // Flush every 5 seconds
  }

  // Stop batch processor
  stopBatchProcessor() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  // Main audit log method
  async log({
    eventType,
    userId,
    severity = AuditSeverity.INFO,
    metadata = {},
    resourceType = null,
    resourceId = null,
    workspaceId = null,
    ipAddress = null,
    userAgent = null,
    success = true
  }) {
    try {
      const auditEntry = {
        event_type: eventType,
        user_id: userId,
        severity,
        metadata: this.sanitizeMetadata(metadata),
        resource_type: resourceType,
        resource_id: resourceId,
        workspace_id: workspaceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        timestamp: new Date().toISOString()
      }

      // Add to queue for batch processing
      this.queue.push(auditEntry)

      // Flush immediately for critical events
      if (severity === AuditSeverity.CRITICAL) {
        await this.flush()
      }

      // Also log critical events to console for monitoring
      if (severity === AuditSeverity.CRITICAL || severity === AuditSeverity.ERROR) {
        console.error('[AUDIT]', eventType, auditEntry)
      }

      return { success: true }
    } catch (error) {
      console.error('Audit logging error:', error)
      return { success: false, error: error.message }
    }
  }

  // Batch insert audit logs
  async flush() {
    if (this.queue.length === 0) return

    // Skip flushing if we've exceeded max errors (table likely doesn't exist)
    if (this.flushErrorCount >= this.maxFlushErrors) {
      // Clear queue to prevent memory buildup, log only once
      if (this.queue.length > 0) {
        this.queue = []
      }
      return
    }

    const entries = [...this.queue]
    this.queue = []

    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert(entries)

      if (error) {
        this.flushErrorCount++
        const errorMessage = error.message || error.code || JSON.stringify(error)

        // Only log if it's a new error or first occurrence
        if (this.lastErrorMessage !== errorMessage) {
          console.error('Failed to flush audit logs:', errorMessage)
          if (this.flushErrorCount >= this.maxFlushErrors) {
            console.warn('[AuditLogger] Max errors reached, disabling audit log flushing. Ensure audit_logs table exists in Supabase.')
          }
          this.lastErrorMessage = errorMessage
        }
        // Don't re-add entries - discard to prevent memory buildup
      } else {
        // Reset error count on success
        this.flushErrorCount = 0
        this.lastErrorMessage = null
      }
    } catch (error) {
      this.flushErrorCount++
      const errorMessage = error.message || 'Unknown error'

      if (this.lastErrorMessage !== errorMessage) {
        console.error('Audit flush error:', errorMessage)
        if (this.flushErrorCount >= this.maxFlushErrors) {
          console.warn('[AuditLogger] Max errors reached, disabling audit log flushing.')
        }
        this.lastErrorMessage = errorMessage
      }
      // Don't re-add entries - discard to prevent memory buildup
    }
  }

  // Sanitize metadata to remove sensitive information
  sanitizeMetadata(metadata) {
    const sanitized = { ...metadata }
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'access_token',
      'refresh_token',
      'api_key',
      'secret',
      'credit_card',
      'ssn'
    ]
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase()
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  // Helper methods for common audit scenarios
  async logAuth(userId, eventType, metadata = {}, request = null) {
    return this.log({
      eventType,
      userId,
      severity: eventType === AuditEventTypes.AUTH_FAILED ? AuditSeverity.WARNING : AuditSeverity.INFO,
      metadata,
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent')
    })
  }

  async logFileOperation(userId, eventType, fileId, metadata = {}, request = null) {
    return this.log({
      eventType,
      userId,
      severity: AuditSeverity.INFO,
      metadata,
      resourceType: 'file',
      resourceId: fileId,
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent')
    })
  }

  async logSecurityEvent(userId, eventType, metadata = {}, request = null) {
    return this.log({
      eventType,
      userId,
      severity: AuditSeverity.WARNING,
      metadata,
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent')
    })
  }

  async logApiCall(userId, endpoint, method, metadata = {}, request = null) {
    return this.log({
      eventType: AuditEventTypes.API_CALL,
      userId,
      severity: AuditSeverity.INFO,
      metadata: {
        endpoint,
        method,
        ...metadata
      },
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent')
    })
  }

  // Query audit logs
  async queryLogs({
    userId = null,
    eventType = null,
    startDate = null,
    endDate = null,
    severity = null,
    workspaceId = null,
    limit = 100,
    offset = 0
  }) {
    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (userId) query = query.eq('user_id', userId)
      if (eventType) query = query.eq('event_type', eventType)
      if (severity) query = query.eq('severity', severity)
      if (workspaceId) query = query.eq('workspace_id', workspaceId)
      if (startDate) query = query.gte('timestamp', startDate)
      if (endDate) query = query.lte('timestamp', endDate)

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        data,
        count,
        pagination: {
          limit,
          offset,
          hasMore: count > offset + limit
        }
      }
    } catch (error) {
      console.error('Error querying audit logs:', error)
      return {
        success: false,
        error: error.message,
        data: [],
        count: 0
      }
    }
  }

  // Generate audit report
  async generateReport(userId, startDate, endDate) {
    try {
      const { data: logs } = await this.queryLogs({
        userId,
        startDate,
        endDate,
        limit: 10000
      })

      const report = {
        userId,
        period: { start: startDate, end: endDate },
        summary: {
          total_events: logs.length,
          by_severity: {},
          by_event_type: {},
          failed_operations: 0,
          security_events: 0
        },
        top_events: [],
        security_incidents: [],
        timeline: []
      }

      // Process logs for report
      logs.forEach(log => {
        // Count by severity
        report.summary.by_severity[log.severity] = 
          (report.summary.by_severity[log.severity] || 0) + 1

        // Count by event type
        report.summary.by_event_type[log.event_type] = 
          (report.summary.by_event_type[log.event_type] || 0) + 1

        // Count failures
        if (!log.success) report.summary.failed_operations++

        // Count security events
        if (log.event_type.startsWith('security.')) {
          report.summary.security_events++
          report.security_incidents.push(log)
        }
      })

      // Get top events
      report.top_events = Object.entries(report.summary.by_event_type)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([event, count]) => ({ event, count }))

      return report
    } catch (error) {
      console.error('Error generating audit report:', error)
      throw error
    }
  }

  // Compliance-specific methods
  async logGDPRDataAccess(userId, dataType, purpose, request = null) {
    return this.log({
      eventType: AuditEventTypes.DATA_VIEW,
      userId,
      severity: AuditSeverity.INFO,
      metadata: {
        data_type: dataType,
        purpose,
        gdpr_compliant: true
      },
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent')
    })
  }

  async logGDPRDataExport(userId, exportType, request = null) {
    return this.log({
      eventType: AuditEventTypes.DATA_EXPORT,
      userId,
      severity: AuditSeverity.INFO,
      metadata: {
        export_type: exportType,
        gdpr_request: true
      },
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent')
    })
  }

  async logGDPRDataDeletion(userId, dataType, request = null) {
    return this.log({
      eventType: AuditEventTypes.DATA_DELETE,
      userId,
      severity: AuditSeverity.WARNING,
      metadata: {
        data_type: dataType,
        gdpr_right_to_erasure: true
      },
      ipAddress: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent')
    })
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

// Note: Process cleanup handlers removed for Edge Runtime compatibility
// In serverless/edge environments, cleanup happens automatically when the function completes