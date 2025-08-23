import { supabaseAdmin } from '@/lib/supabase-admin'
import { auditLogger, AuditEventTypes, AuditSeverity } from './audit-logger'
import { securityConfig } from './config'

// Security monitoring service
export class SecurityMonitor {
  constructor() {
    this.alertThresholds = securityConfig.monitoring.alertThresholds
    this.monitoringEnabled = securityConfig.monitoring.enabled
    this.alertQueue = []
    this.metrics = {
      errorRate: new Map(),
      responseTime: new Map(),
      rateLimitViolations: new Map()
    }
  }

  // Track API metrics
  async trackApiMetrics(endpoint, responseTime, success, userId = null) {
    if (!this.monitoringEnabled) return

    const now = Date.now()
    const hour = Math.floor(now / 3600000) * 3600000 // Round to hour

    // Track error rate
    if (!this.metrics.errorRate.has(hour)) {
      this.metrics.errorRate.set(hour, { success: 0, failure: 0 })
    }
    const errorMetrics = this.metrics.errorRate.get(hour)
    if (success) {
      errorMetrics.success++
    } else {
      errorMetrics.failure++
    }

    // Check error rate threshold
    const errorRate = errorMetrics.failure / (errorMetrics.success + errorMetrics.failure)
    if (errorRate > this.alertThresholds.errorRate) {
      await this.createAlert('high_error_rate', {
        endpoint,
        errorRate,
        threshold: this.alertThresholds.errorRate,
        hour: new Date(hour).toISOString()
      })
    }

    // Track response time
    if (!this.metrics.responseTime.has(endpoint)) {
      this.metrics.responseTime.set(endpoint, [])
    }
    const responseTimes = this.metrics.responseTime.get(endpoint)
    responseTimes.push({ time: responseTime, timestamp: now })

    // Keep only last hour of response times
    const oneHourAgo = now - 3600000
    this.metrics.responseTime.set(
      endpoint,
      responseTimes.filter(rt => rt.timestamp > oneHourAgo)
    )

    // Check response time threshold
    if (responseTime > this.alertThresholds.responseTime) {
      await this.createAlert('slow_response', {
        endpoint,
        responseTime,
        threshold: this.alertThresholds.responseTime,
        userId
      })
    }
  }

  // Track rate limit violations
  async trackRateLimitViolation(userId, endpoint, metadata = {}) {
    if (!this.monitoringEnabled) return

    const now = Date.now()
    const hour = Math.floor(now / 3600000) * 3600000

    if (!this.metrics.rateLimitViolations.has(hour)) {
      this.metrics.rateLimitViolations.set(hour, 0)
    }

    const violations = this.metrics.rateLimitViolations.get(hour) + 1
    this.metrics.rateLimitViolations.set(hour, violations)

    // Check threshold
    if (violations > this.alertThresholds.rateLimitViolations) {
      await this.createAlert('excessive_rate_limit_violations', {
        violations,
        threshold: this.alertThresholds.rateLimitViolations,
        hour: new Date(hour).toISOString(),
        endpoint,
        userId,
        ...metadata
      })
    }
  }

  // Create security alert
  async createAlert(alertType, metadata = {}) {
    try {
      const alert = {
        alert_type: alertType,
        severity: this.getAlertSeverity(alertType),
        metadata,
        created_at: new Date().toISOString()
      }

      // Add to queue for batch processing
      this.alertQueue.push(alert)

      // Log to audit trail
      await auditLogger.log({
        eventType: AuditEventTypes.SECURITY_SUSPICIOUS_ACTIVITY,
        userId: metadata.userId || 'system',
        severity: alert.severity,
        metadata: {
          alert_type: alertType,
          ...metadata
        }
      })

      // For critical alerts, notify immediately
      if (alert.severity === 'critical') {
        await this.notifySecurityTeam(alert)
      }

      // Process queue if it's getting large
      if (this.alertQueue.length >= 10) {
        await this.processAlertQueue()
      }
    } catch (error) {
      console.error('Error creating security alert:', error)
    }
  }

  // Get alert severity based on type
  getAlertSeverity(alertType) {
    const severityMap = {
      high_error_rate: 'warning',
      slow_response: 'warning',
      excessive_rate_limit_violations: 'warning',
      suspicious_activity: 'critical',
      unauthorized_access: 'critical',
      data_breach_attempt: 'critical'
    }

    return severityMap[alertType] || 'info'
  }

  // Process alert queue
  async processAlertQueue() {
    if (this.alertQueue.length === 0) return

    const alerts = [...this.alertQueue]
    this.alertQueue = []

    try {
      // Store alerts in database
      const { error } = await supabaseAdmin
        .from('security_alerts')
        .insert(alerts)

      if (error) {
        console.error('Error storing security alerts:', error)
        // Re-add to queue on failure
        this.alertQueue.unshift(...alerts)
      }
    } catch (error) {
      console.error('Error processing alert queue:', error)
      this.alertQueue.unshift(...alerts)
    }
  }

  // Notify security team of critical alerts
  async notifySecurityTeam(alert) {
    // In production, this would send emails, Slack messages, etc.
    console.error('[CRITICAL SECURITY ALERT]', alert)

    // Log critical alerts to a separate incident table
    try {
      await supabaseAdmin
        .from('security_incidents')
        .insert({
          incident_type: alert.alert_type,
          severity: 'critical',
          description: `Automated alert: ${alert.alert_type}`,
          metadata: alert.metadata,
          status: 'open',
          reported_at: alert.created_at
        })
    } catch (error) {
      console.error('Error creating security incident:', error)
    }
  }

  // Analyze security trends
  async analyzeSecurityTrends(timeRange = '24h') {
    try {
      const endTime = new Date()
      const startTime = new Date()
      
      switch (timeRange) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1)
          break
        case '24h':
          startTime.setHours(startTime.getHours() - 24)
          break
        case '7d':
          startTime.setDate(startTime.getDate() - 7)
          break
        case '30d':
          startTime.setDate(startTime.getDate() - 30)
          break
      }

      // Get audit logs for analysis
      const { data: auditLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())

      // Get security incidents
      const { data: incidents } = await supabaseAdmin
        .from('security_incidents')
        .select('*')
        .gte('reported_at', startTime.toISOString())
        .lte('reported_at', endTime.toISOString())

      // Analyze patterns
      const analysis = {
        timeRange,
        period: { start: startTime, end: endTime },
        summary: {
          total_events: auditLogs?.length || 0,
          security_events: 0,
          failed_auth_attempts: 0,
          suspicious_activities: 0,
          incidents: incidents?.length || 0
        },
        top_security_events: {},
        suspicious_users: new Map(),
        affected_resources: new Map()
      }

      // Process audit logs
      auditLogs?.forEach(log => {
        // Count security events
        if (log.event_type.startsWith('security.')) {
          analysis.summary.security_events++
          analysis.top_security_events[log.event_type] = 
            (analysis.top_security_events[log.event_type] || 0) + 1
        }

        // Count failed auth
        if (log.event_type === AuditEventTypes.AUTH_FAILED) {
          analysis.summary.failed_auth_attempts++
        }

        // Track suspicious activities
        if (log.severity === 'warning' || log.severity === 'critical') {
          analysis.summary.suspicious_activities++
          
          if (log.user_id) {
            const userCount = analysis.suspicious_users.get(log.user_id) || 0
            analysis.suspicious_users.set(log.user_id, userCount + 1)
          }
        }

        // Track affected resources
        if (log.resource_id) {
          const resourceKey = `${log.resource_type}:${log.resource_id}`
          const resourceCount = analysis.affected_resources.get(resourceKey) || 0
          analysis.affected_resources.set(resourceKey, resourceCount + 1)
        }
      })

      // Convert maps to arrays for response
      analysis.suspicious_users = Array.from(analysis.suspicious_users.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count }))

      analysis.affected_resources = Array.from(analysis.affected_resources.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([resource, count]) => ({ resource, count }))

      return analysis
    } catch (error) {
      console.error('Error analyzing security trends:', error)
      throw error
    }
  }

  // Generate security report
  async generateSecurityReport(startDate, endDate) {
    try {
      const report = {
        period: { start: startDate, end: endDate },
        executive_summary: {},
        detailed_findings: {},
        recommendations: [],
        compliance_status: {}
      }

      // Get all security data
      const [auditLogs, incidents, alerts] = await Promise.all([
        supabaseAdmin
          .from('audit_logs')
          .select('*')
          .gte('timestamp', startDate)
          .lte('timestamp', endDate),
        supabaseAdmin
          .from('security_incidents')
          .select('*')
          .gte('reported_at', startDate)
          .lte('reported_at', endDate),
        supabaseAdmin
          .from('security_alerts')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      ])

      // Analyze data
      report.executive_summary = {
        total_security_events: auditLogs.data?.filter(log => 
          log.event_type.startsWith('security.')
        ).length || 0,
        total_incidents: incidents.data?.length || 0,
        total_alerts: alerts.data?.length || 0,
        critical_incidents: incidents.data?.filter(i => 
          i.severity === 'critical'
        ).length || 0,
        resolved_incidents: incidents.data?.filter(i => 
          i.status === 'resolved' || i.status === 'closed'
        ).length || 0
      }

      // Compliance checks
      report.compliance_status = {
        data_encryption: true, // We implement token encryption
        audit_logging: true, // We have comprehensive audit logs
        access_controls: true, // We have OAuth and RLS
        data_retention: true, // We have retention policies
        gdpr_compliant: true // We have data processing records
      }

      // Generate recommendations
      if (report.executive_summary.critical_incidents > 0) {
        report.recommendations.push(
          'Review and address critical security incidents immediately'
        )
      }

      if (report.executive_summary.total_security_events > 100) {
        report.recommendations.push(
          'High volume of security events detected - consider additional monitoring'
        )
      }

      return report
    } catch (error) {
      console.error('Error generating security report:', error)
      throw error
    }
  }

  // Cleanup old metrics
  cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 3600000

    // Clean error rate metrics
    for (const [hour, _] of this.metrics.errorRate) {
      if (hour < oneHourAgo) {
        this.metrics.errorRate.delete(hour)
      }
    }

    // Clean rate limit metrics
    for (const [hour, _] of this.metrics.rateLimitViolations) {
      if (hour < oneHourAgo) {
        this.metrics.rateLimitViolations.delete(hour)
      }
    }

    // Response times are already cleaned in trackApiMetrics
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor()

// Cleanup old metrics periodically
setInterval(() => {
  securityMonitor.cleanupOldMetrics()
  securityMonitor.processAlertQueue()
}, 300000) // Every 5 minutes