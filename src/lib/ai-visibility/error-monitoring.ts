/**
 * Error Monitoring and Alerting System
 * 
 * Monitors error patterns and provides alerting for AI visibility system
 * Requirements: All error handling scenarios
 */

import { AIVisibilityError, categorizeError } from './errors';
import { fallbackManager } from './fallback-manager';

/**
 * Error metrics for monitoring
 */
export interface ErrorMetrics {
  /** Total error count in time window */
  totalErrors: number;
  /** Errors by category */
  errorsByCategory: Record<string, number>;
  /** Errors by service */
  errorsByService: Record<string, number>;
  /** Error rate (errors per minute) */
  errorRate: number;
  /** Most common error codes */
  topErrorCodes: Array<{ code: string; count: number }>;
  /** Services with highest error rates */
  problematicServices: Array<{ service: string; errorRate: number }>;
  /** Time window for metrics */
  timeWindowMinutes: number;
  /** Timestamp of metrics calculation */
  calculatedAt: Date;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Alert name */
  name: string;
  /** Alert description */
  description: string;
  /** Error rate threshold (errors per minute) */
  errorRateThreshold?: number;
  /** Total error count threshold */
  totalErrorThreshold?: number;
  /** Specific error codes to monitor */
  errorCodes?: string[];
  /** Services to monitor */
  services?: string[];
  /** Time window for evaluation (minutes) */
  timeWindowMinutes: number;
  /** Whether alert is enabled */
  enabled: boolean;
  /** Cooldown period between alerts (minutes) */
  cooldownMinutes: number;
}

/**
 * Alert instance
 */
export interface Alert {
  /** Alert ID */
  id: string;
  /** Alert configuration name */
  configName: string;
  /** Alert message */
  message: string;
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Metrics that triggered the alert */
  triggeringMetrics: ErrorMetrics;
  /** Timestamp when alert was triggered */
  triggeredAt: Date;
  /** Whether alert has been acknowledged */
  acknowledged: boolean;
  /** Recovery suggestions */
  recoverySuggestions: string[];
}

/**
 * Error event for tracking
 */
interface ErrorEvent {
  timestamp: Date;
  error: AIVisibilityError;
  service: string;
  operation: string;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Error monitoring service
 */
export class ErrorMonitoringService {
  private errorEvents: ErrorEvent[] = [];
  private alerts: Alert[] = [];
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private lastAlertTimes: Map<string, Date> = new Map();

  constructor() {
    this.initializeDefaultAlerts();
    
    // Clean up old events every 5 minutes
    setInterval(() => {
      this.cleanupOldEvents();
    }, 5 * 60 * 1000);
  }

  /**
   * Record an error event
   */
  recordError(
    error: AIVisibilityError,
    service: string,
    operation: string,
    userId?: string,
    context?: Record<string, any>
  ): void {
    const event: ErrorEvent = {
      timestamp: new Date(),
      error,
      service,
      operation,
      userId,
      context,
    };

    this.errorEvents.push(event);

    // Check for alert conditions
    this.checkAlertConditions();
  }

  /**
   * Get error metrics for a time window
   */
  getErrorMetrics(timeWindowMinutes: number = 60): ErrorMetrics {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentEvents = this.errorEvents.filter(event => event.timestamp >= cutoffTime);

    const errorsByCategory: Record<string, number> = {};
    const errorsByService: Record<string, number> = {};
    const errorCodes: Record<string, number> = {};

    for (const event of recentEvents) {
      const category = categorizeError(event.error).category;
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
      errorsByService[event.service] = (errorsByService[event.service] || 0) + 1;
      errorCodes[event.error.code] = (errorCodes[event.error.code] || 0) + 1;
    }

    const topErrorCodes = Object.entries(errorCodes)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const problematicServices = Object.entries(errorsByService)
      .map(([service, count]) => ({ 
        service, 
        errorRate: count / timeWindowMinutes 
      }))
      .filter(item => item.errorRate > 0.1) // More than 0.1 errors per minute
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);

    return {
      totalErrors: recentEvents.length,
      errorsByCategory,
      errorsByService,
      errorRate: recentEvents.length / timeWindowMinutes,
      topErrorCodes,
      problematicServices,
      timeWindowMinutes,
      calculatedAt: new Date(),
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: ErrorMetrics;
    activeAlerts: Alert[];
    serviceStatuses: Record<string, 'available' | 'degraded' | 'unavailable'>;
    recommendations: string[];
  } {
    const metrics = this.getErrorMetrics(30); // Last 30 minutes
    const activeAlerts = this.getActiveAlerts();
    
    // Determine overall system status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.errorRate > 5) { // More than 5 errors per minute
      status = 'unhealthy';
    } else if (metrics.errorRate > 1 || activeAlerts.length > 0) {
      status = 'degraded';
    }

    // Get service statuses from fallback manager
    const fallbackStatuses = fallbackManager.getServiceStatus();
    const serviceStatuses: Record<string, 'available' | 'degraded' | 'unavailable'> = {};
    
    if (fallbackStatuses instanceof Map) {
      const entries = Array.from(fallbackStatuses.entries());
      for (const [service, status] of entries) {
        if (status.available) {
          serviceStatuses[service] = status.errorCount > 3 ? 'degraded' : 'available';
        } else {
          serviceStatuses[service] = 'unavailable';
        }
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (metrics.errorRate > 2) {
      recommendations.push('High error rate detected - investigate system issues');
    }
    
    if (metrics.problematicServices.length > 0) {
      recommendations.push(`Services with high error rates: ${metrics.problematicServices.map(s => s.service).join(', ')}`);
    }
    
    if (activeAlerts.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('Critical alerts active - immediate attention required');
    }

    return {
      status,
      metrics,
      activeAlerts,
      serviceStatuses,
      recommendations,
    };
  }

  /**
   * Configure alert rules
   */
  configureAlert(config: AlertConfig): void {
    this.alertConfigs.set(config.name, config);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get error trends over time
   */
  getErrorTrends(hours: number = 24): Array<{
    timestamp: Date;
    errorCount: number;
    errorRate: number;
    topErrorCode: string;
  }> {
    const trends: Array<{
      timestamp: Date;
      errorCount: number;
      errorRate: number;
      topErrorCode: string;
    }> = [];

    const intervalMinutes = 30; // 30-minute intervals
    const intervals = (hours * 60) / intervalMinutes;

    for (let i = 0; i < intervals; i++) {
      const endTime = new Date(Date.now() - i * intervalMinutes * 60 * 1000);
      const startTime = new Date(endTime.getTime() - intervalMinutes * 60 * 1000);
      
      const intervalEvents = this.errorEvents.filter(
        event => event.timestamp >= startTime && event.timestamp < endTime
      );

      const errorCodes: Record<string, number> = {};
      for (const event of intervalEvents) {
        errorCodes[event.error.code] = (errorCodes[event.error.code] || 0) + 1;
      }

      const topErrorCode = Object.entries(errorCodes)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

      trends.unshift({
        timestamp: startTime,
        errorCount: intervalEvents.length,
        errorRate: intervalEvents.length / intervalMinutes,
        topErrorCode,
      });
    }

    return trends;
  }

  /**
   * Export error data for analysis
   */
  exportErrorData(timeWindowHours: number = 24): {
    summary: ErrorMetrics;
    events: Array<{
      timestamp: string;
      errorCode: string;
      errorMessage: string;
      service: string;
      operation: string;
      category: string;
      retryable: boolean;
      userId?: string;
    }>;
    trends: ReturnType<typeof this.getErrorTrends>;
    systemHealth: ReturnType<typeof this.getSystemHealth>;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    const relevantEvents = this.errorEvents.filter(event => event.timestamp >= cutoffTime);

    const events = relevantEvents.map(event => ({
      timestamp: event.timestamp.toISOString(),
      errorCode: event.error.code,
      errorMessage: event.error.message,
      service: event.service,
      operation: event.operation,
      category: categorizeError(event.error).category,
      retryable: categorizeError(event.error).retryable,
      userId: event.userId,
    }));

    return {
      summary: this.getErrorMetrics(timeWindowHours * 60),
      events,
      trends: this.getErrorTrends(timeWindowHours),
      systemHealth: this.getSystemHealth(),
    };
  }

  /**
   * Initialize default alert configurations
   */
  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertConfig[] = [
      {
        name: 'high_error_rate',
        description: 'High error rate detected',
        errorRateThreshold: 5, // 5 errors per minute
        timeWindowMinutes: 10,
        enabled: true,
        cooldownMinutes: 30,
      },
      {
        name: 'critical_service_failure',
        description: 'Critical service experiencing failures',
        services: ['schemaGeneration', 'aiPlatformMonitoring'],
        errorRateThreshold: 2,
        timeWindowMinutes: 5,
        enabled: true,
        cooldownMinutes: 15,
      },
      {
        name: 'authentication_failures',
        description: 'Multiple authentication failures detected',
        errorCodes: ['AI_PLATFORM_ERROR'],
        totalErrorThreshold: 10,
        timeWindowMinutes: 15,
        enabled: true,
        cooldownMinutes: 60,
      },
      {
        name: 'rate_limit_exceeded',
        description: 'Rate limits being exceeded frequently',
        errorCodes: ['RATE_LIMIT_ERROR'],
        totalErrorThreshold: 5,
        timeWindowMinutes: 10,
        enabled: true,
        cooldownMinutes: 20,
      },
    ];

    for (const config of defaultAlerts) {
      this.alertConfigs.set(config.name, config);
    }
  }

  /**
   * Check alert conditions and trigger alerts if needed
   */
  private checkAlertConditions(): void {
    const alertEntries = Array.from(this.alertConfigs.entries());
    for (const [name, config] of alertEntries) {
      if (!config.enabled) continue;

      // Check cooldown period
      const lastAlertTime = this.lastAlertTimes.get(name);
      if (lastAlertTime) {
        const cooldownEnd = new Date(lastAlertTime.getTime() + config.cooldownMinutes * 60 * 1000);
        if (new Date() < cooldownEnd) {
          continue; // Still in cooldown
        }
      }

      const metrics = this.getErrorMetrics(config.timeWindowMinutes);
      let shouldAlert = false;
      let severity: Alert['severity'] = 'low';
      let message = '';

      // Check error rate threshold
      if (config.errorRateThreshold && metrics.errorRate > config.errorRateThreshold) {
        shouldAlert = true;
        severity = metrics.errorRate > config.errorRateThreshold * 2 ? 'critical' : 'high';
        message = `Error rate (${metrics.errorRate.toFixed(2)}/min) exceeds threshold (${config.errorRateThreshold}/min)`;
      }

      // Check total error threshold
      if (config.totalErrorThreshold && metrics.totalErrors > config.totalErrorThreshold) {
        shouldAlert = true;
        severity = metrics.totalErrors > config.totalErrorThreshold * 2 ? 'critical' : 'medium';
        message = `Total errors (${metrics.totalErrors}) exceeds threshold (${config.totalErrorThreshold})`;
      }

      // Check specific error codes
      if (config.errorCodes && config.errorCodes.length > 0) {
        const relevantErrors = metrics.topErrorCodes.filter(
          error => config.errorCodes!.includes(error.code)
        );
        
        if (relevantErrors.length > 0) {
          const totalRelevantErrors = relevantErrors.reduce((sum, error) => sum + error.count, 0);
          if (totalRelevantErrors >= (config.totalErrorThreshold || 1)) {
            shouldAlert = true;
            severity = 'medium';
            message = `Specific error codes detected: ${relevantErrors.map(e => `${e.code}(${e.count})`).join(', ')}`;
          }
        }
      }

      // Check specific services
      if (config.services && config.services.length > 0) {
        const problematicServices = metrics.problematicServices.filter(
          service => config.services!.includes(service.service)
        );
        
        if (problematicServices.length > 0) {
          shouldAlert = true;
          severity = 'high';
          message = `Critical services experiencing errors: ${problematicServices.map(s => s.service).join(', ')}`;
        }
      }

      if (shouldAlert) {
        this.triggerAlert(name, config, message, severity, metrics);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(
    configName: string,
    config: AlertConfig,
    message: string,
    severity: Alert['severity'],
    metrics: ErrorMetrics
  ): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      configName,
      message: `${config.description}: ${message}`,
      severity,
      triggeringMetrics: metrics,
      triggeredAt: new Date(),
      acknowledged: false,
      recoverySuggestions: this.generateRecoverySuggestions(configName, metrics),
    };

    this.alerts.push(alert);
    this.lastAlertTimes.set(configName, new Date());

    // Log the alert
    console.warn(`[AI Visibility Alert] ${alert.severity.toUpperCase()}: ${alert.message}`);
    
    // In production, this would send notifications via email, Slack, etc.
    this.sendAlertNotification(alert);
  }

  /**
   * Generate recovery suggestions based on alert type
   */
  private generateRecoverySuggestions(configName: string, metrics: ErrorMetrics): string[] {
    const suggestions: string[] = [];

    switch (configName) {
      case 'high_error_rate':
        suggestions.push(
          'Check system resources and scaling',
          'Review recent deployments for issues',
          'Investigate network connectivity',
          'Consider enabling additional fallback mechanisms'
        );
        break;

      case 'critical_service_failure':
        suggestions.push(
          'Check service health endpoints',
          'Verify API credentials and configurations',
          'Review service logs for specific errors',
          'Consider switching to backup services if available'
        );
        break;

      case 'authentication_failures':
        suggestions.push(
          'Verify API keys and credentials',
          'Check for expired tokens',
          'Review authentication configuration',
          'Contact service providers if issues persist'
        );
        break;

      case 'rate_limit_exceeded':
        suggestions.push(
          'Reduce request frequency',
          'Implement request queuing',
          'Consider upgrading service plans',
          'Review and optimize API usage patterns'
        );
        break;

      default:
        suggestions.push(
          'Review error logs for patterns',
          'Check system health dashboard',
          'Consider temporary service degradation',
          'Contact support if issues persist'
        );
    }

    // Add service-specific suggestions
    if (metrics.problematicServices.length > 0) {
      suggestions.push(`Focus on services: ${metrics.problematicServices.map(s => s.service).join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Send alert notification (placeholder for actual notification system)
   */
  private sendAlertNotification(alert: Alert): void {
    // In production, this would integrate with notification systems
    // For now, just log to console
    console.log(`Alert notification would be sent: ${JSON.stringify(alert, null, 2)}`);
  }

  /**
   * Clean up old error events to prevent memory leaks
   */
  private cleanupOldEvents(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Keep 24 hours
    this.errorEvents = this.errorEvents.filter(event => event.timestamp >= cutoffTime);
    
    // Also clean up old alerts (keep for 7 days)
    const alertCutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.triggeredAt >= alertCutoffTime);
  }
}

/**
 * Singleton error monitoring service
 */
export const errorMonitoring = new ErrorMonitoringService();