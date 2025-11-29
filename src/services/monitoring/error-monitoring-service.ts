/**
 * Error Monitoring and Alerting Service
 * 
 * Provides comprehensive error monitoring, alerting, and analytics including:
 * - Real-time error tracking and aggregation
 * - Intelligent alerting based on error patterns and severity
 * - Error trend analysis and reporting
 * - Integration with CloudWatch and external monitoring services
 * - User impact assessment and automatic escalation
 * 
 * Validates: All requirements with focus on system reliability and monitoring
 */

import { ErrorCategory, getErrorSeverity } from '@/lib/error-handling';
import { type ServiceError } from '@/lib/error-handling-framework';

// ============================================================================
// Monitoring Types and Interfaces
// ============================================================================

export interface ErrorEvent {
    id: string;
    timestamp: Date;
    error: ServiceError;
    context: {
        userId?: string;
        operation: string;
        userAgent?: string;
        url?: string;
        sessionId?: string;
    };
    impact: {
        severity: 'low' | 'medium' | 'high' | 'critical';
        userAffected: boolean;
        serviceAffected: string[];
        estimatedUsers: number;
    };
    resolution?: {
        status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
        resolvedAt?: Date;
        resolvedBy?: string;
        notes?: string;
    };
}

export interface ErrorPattern {
    signature: string;
    category: ErrorCategory;
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    affectedUsers: Set<string>;
    operations: Set<string>;
    trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AlertRule {
    id: string;
    name: string;
    condition: {
        errorCount?: number;
        timeWindow?: number; // minutes
        severity?: ('low' | 'medium' | 'high' | 'critical')[];
        categories?: ErrorCategory[];
        operations?: string[];
        userThreshold?: number;
    };
    actions: {
        notify: boolean;
        escalate: boolean;
        autoResolve: boolean;
        webhookUrl?: string;
    };
    enabled: boolean;
}

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'critical';
    services: Record<string, {
        status: 'up' | 'down' | 'degraded';
        errorRate: number;
        responseTime: number;
        lastCheck: Date;
    }>;
    errorRate: number;
    criticalErrors: number;
    affectedUsers: number;
    uptime: number;
}

// ============================================================================
// Error Monitoring Service Class
// ============================================================================

export class ErrorMonitoringService {
    private errorEvents: ErrorEvent[] = [];
    private errorPatterns = new Map<string, ErrorPattern>();
    private alertRules: AlertRule[] = [];
    private systemMetrics = {
        totalErrors: 0,
        errorsByCategory: new Map<ErrorCategory, number>(),
        errorsByOperation: new Map<string, number>(),
        affectedUsers: new Set<string>(),
        lastHealthCheck: new Date()
    };

    constructor() {
        this.initializeDefaultAlertRules();
        this.startHealthMonitoring();
    }

    /**
     * Track an error event and trigger monitoring logic
     */
    async trackError(error: ServiceError, context: {
        userId?: string;
        operation: string;
        userAgent?: string;
        url?: string;
        sessionId?: string;
    }): Promise<void> {
        const errorEvent: ErrorEvent = {
            id: this.generateEventId(),
            timestamp: new Date(),
            error,
            context,
            impact: this.assessErrorImpact(error, context),
        };

        // Store error event
        this.errorEvents.push(errorEvent);

        // Update error patterns
        this.updateErrorPatterns(errorEvent);

        // Update system metrics
        this.updateSystemMetrics(errorEvent);

        // Check alert rules
        await this.checkAlertRules(errorEvent);

        // Log to external monitoring services
        await this.logToExternalServices(errorEvent);

        // Cleanup old events (keep last 1000)
        if (this.errorEvents.length > 1000) {
            this.errorEvents = this.errorEvents.slice(-1000);
        }
    }

    /**
     * Get current system health status
     */
    getSystemHealth(): SystemHealth {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get recent errors
        const recentErrors = this.errorEvents.filter(event =>
            event.timestamp >= last24Hours
        );

        const criticalErrors = recentErrors.filter(event =>
            event.impact.severity === 'critical'
        ).length;

        const errorRate = recentErrors.length / 24; // errors per hour
        const affectedUsers = new Set(
            recentErrors
                .filter(event => event.context.userId)
                .map(event => event.context.userId!)
        ).size;

        // Determine overall status
        let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
        if (criticalErrors > 0 || errorRate > 10) {
            status = 'critical';
        } else if (errorRate > 5 || affectedUsers > 10) {
            status = 'degraded';
        }

        // Get service statuses
        const services = this.getServiceStatuses();

        return {
            status,
            services,
            errorRate,
            criticalErrors,
            affectedUsers,
            uptime: this.calculateUptime()
        };
    }

    /**
     * Get error analytics and trends
     */
    getErrorAnalytics(timeRange: { start: Date; end: Date }) {
        const filteredEvents = this.errorEvents.filter(event =>
            event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
        );

        const analytics = {
            totalErrors: filteredEvents.length,
            errorsByCategory: this.groupBy(filteredEvents, event => event.error.category),
            errorsByOperation: this.groupBy(filteredEvents, event => event.context.operation),
            errorsBySeverity: this.groupBy(filteredEvents, event => event.impact.severity),
            topErrorPatterns: this.getTopErrorPatterns(10),
            errorTrend: this.calculateErrorTrend(filteredEvents),
            mttr: this.calculateMTTR(filteredEvents), // Mean Time To Resolution
            affectedUsers: new Set(
                filteredEvents
                    .filter(event => event.context.userId)
                    .map(event => event.context.userId!)
            ).size
        };

        return analytics;
    }

    /**
     * Create or update an alert rule
     */
    createAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
        const alertRule: AlertRule = {
            id: this.generateRuleId(),
            ...rule
        };

        this.alertRules.push(alertRule);
        return alertRule;
    }

    /**
     * Get all error patterns with trend analysis
     */
    getErrorPatterns(): ErrorPattern[] {
        return Array.from(this.errorPatterns.values())
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Resolve an error pattern or incident
     */
    async resolveError(eventId: string, resolution: {
        status: 'resolved';
        resolvedBy: string;
        notes?: string;
    }): Promise<void> {
        const event = this.errorEvents.find(e => e.id === eventId);
        if (event) {
            event.resolution = {
                ...resolution,
                resolvedAt: new Date()
            };

            // Log resolution
            console.log(`Error ${eventId} resolved by ${resolution.resolvedBy}`);
        }
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private initializeDefaultAlertRules(): void {
        // Critical error alert
        this.alertRules.push({
            id: 'critical-errors',
            name: 'Critical Errors',
            condition: {
                severity: ['critical'],
                errorCount: 1,
                timeWindow: 5
            },
            actions: {
                notify: true,
                escalate: true,
                autoResolve: false
            },
            enabled: true
        });

        // High error rate alert
        this.alertRules.push({
            id: 'high-error-rate',
            name: 'High Error Rate',
            condition: {
                errorCount: 10,
                timeWindow: 15
            },
            actions: {
                notify: true,
                escalate: false,
                autoResolve: true
            },
            enabled: true
        });

        // Authentication failures
        this.alertRules.push({
            id: 'auth-failures',
            name: 'Authentication Failures',
            condition: {
                categories: [ErrorCategory.AUTHENTICATION],
                errorCount: 5,
                timeWindow: 10
            },
            actions: {
                notify: true,
                escalate: false,
                autoResolve: true
            },
            enabled: true
        });

        // Database errors
        this.alertRules.push({
            id: 'database-errors',
            name: 'Database Errors',
            condition: {
                categories: [ErrorCategory.DATABASE],
                errorCount: 3,
                timeWindow: 5
            },
            actions: {
                notify: true,
                escalate: true,
                autoResolve: false
            },
            enabled: true
        });
    }

    private assessErrorImpact(error: ServiceError, context: any): ErrorEvent['impact'] {
        const severity = getErrorSeverity(error.category);

        // Determine affected services
        const serviceAffected: string[] = [];
        if (error.category === ErrorCategory.DATABASE) {
            serviceAffected.push('database');
        }
        if (error.category === ErrorCategory.AI_OPERATION) {
            serviceAffected.push('ai-service');
        }
        if (error.category === ErrorCategory.NETWORK) {
            serviceAffected.push('external-apis');
        }

        // Estimate affected users
        let estimatedUsers = 0;
        if (context.userId) {
            estimatedUsers = 1;
        }
        if (severity === 'critical') {
            estimatedUsers = Math.max(estimatedUsers, 100); // Assume critical errors affect many users
        }

        return {
            severity,
            userAffected: !!context.userId,
            serviceAffected,
            estimatedUsers
        };
    }

    private updateErrorPatterns(errorEvent: ErrorEvent): void {
        const signature = this.generateErrorSignature(errorEvent.error);

        const existing = this.errorPatterns.get(signature);
        if (existing) {
            existing.count++;
            existing.lastSeen = errorEvent.timestamp;
            existing.affectedUsers.add(errorEvent.context.userId || 'anonymous');
            existing.operations.add(errorEvent.context.operation);

            // Update trend
            existing.trend = this.calculateTrend(existing);
        } else {
            this.errorPatterns.set(signature, {
                signature,
                category: errorEvent.error.category,
                count: 1,
                firstSeen: errorEvent.timestamp,
                lastSeen: errorEvent.timestamp,
                affectedUsers: new Set([errorEvent.context.userId || 'anonymous']),
                operations: new Set([errorEvent.context.operation]),
                trend: 'stable'
            });
        }
    }

    private updateSystemMetrics(errorEvent: ErrorEvent): void {
        this.systemMetrics.totalErrors++;

        const categoryCount = this.systemMetrics.errorsByCategory.get(errorEvent.error.category) || 0;
        this.systemMetrics.errorsByCategory.set(errorEvent.error.category, categoryCount + 1);

        const operationCount = this.systemMetrics.errorsByOperation.get(errorEvent.context.operation) || 0;
        this.systemMetrics.errorsByOperation.set(errorEvent.context.operation, operationCount + 1);

        if (errorEvent.context.userId) {
            this.systemMetrics.affectedUsers.add(errorEvent.context.userId);
        }
    }

    private async checkAlertRules(errorEvent: ErrorEvent): Promise<void> {
        for (const rule of this.alertRules) {
            if (!rule.enabled) continue;

            const shouldAlert = this.evaluateAlertRule(rule, errorEvent);
            if (shouldAlert) {
                await this.triggerAlert(rule, errorEvent);
            }
        }
    }

    private evaluateAlertRule(rule: AlertRule, errorEvent: ErrorEvent): boolean {
        const condition = rule.condition;
        const now = new Date();
        const windowStart = new Date(now.getTime() - (condition.timeWindow || 60) * 60 * 1000);

        // Get recent events in the time window
        const recentEvents = this.errorEvents.filter(event =>
            event.timestamp >= windowStart
        );

        // Check severity filter
        if (condition.severity && !condition.severity.includes(errorEvent.impact.severity)) {
            return false;
        }

        // Check category filter
        if (condition.categories && !condition.categories.includes(errorEvent.error.category)) {
            return false;
        }

        // Check operation filter
        if (condition.operations && !condition.operations.includes(errorEvent.context.operation)) {
            return false;
        }

        // Check error count threshold
        if (condition.errorCount && recentEvents.length < condition.errorCount) {
            return false;
        }

        // Check user threshold
        if (condition.userThreshold) {
            const affectedUsers = new Set(
                recentEvents
                    .filter(event => event.context.userId)
                    .map(event => event.context.userId!)
            ).size;

            if (affectedUsers < condition.userThreshold) {
                return false;
            }
        }

        return true;
    }

    private async triggerAlert(rule: AlertRule, errorEvent: ErrorEvent): Promise<void> {
        const alert = {
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: new Date(),
            errorEvent,
            severity: errorEvent.impact.severity,
            message: this.generateAlertMessage(rule, errorEvent)
        };

        console.warn(`[ALERT] ${alert.message}`, alert);

        // Send notifications
        if (rule.actions.notify) {
            await this.sendNotification(alert);
        }

        // Escalate if needed
        if (rule.actions.escalate) {
            await this.escalateAlert(alert);
        }

        // Call webhook if configured
        if (rule.actions.webhookUrl) {
            await this.callWebhook(rule.actions.webhookUrl, alert);
        }
    }

    private generateAlertMessage(rule: AlertRule, errorEvent: ErrorEvent): string {
        return `${rule.name}: ${errorEvent.error.category} error in ${errorEvent.context.operation} - ${errorEvent.error.message}`;
    }

    private async sendNotification(alert: any): Promise<void> {
        // In production, this would send to Slack, email, SMS, etc.
        console.log('[NOTIFICATION]', alert);
    }

    private async escalateAlert(alert: any): Promise<void> {
        // In production, this would escalate to on-call engineers
        console.log('[ESCALATION]', alert);
    }

    private async callWebhook(url: string, alert: any): Promise<void> {
        try {
            // In production, this would make HTTP request to webhook
            console.log('[WEBHOOK]', { url, alert });
        } catch (error) {
            console.error('Failed to call webhook:', error);
        }
    }

    private async logToExternalServices(errorEvent: ErrorEvent): Promise<void> {
        // In production, this would send to CloudWatch, Sentry, etc.
        if (process.env.NODE_ENV === 'production') {
            // Send to CloudWatch Logs
            console.log('[CLOUDWATCH]', {
                timestamp: errorEvent.timestamp.toISOString(),
                level: errorEvent.impact.severity.toUpperCase(),
                message: errorEvent.error.message,
                error: {
                    code: errorEvent.error.code,
                    category: errorEvent.error.category,
                    stack: errorEvent.error.stack
                },
                context: errorEvent.context,
                impact: errorEvent.impact
            });
        }
    }

    private generateErrorSignature(error: ServiceError): string {
        // Create a signature based on error type and message pattern
        const messagePattern = error.message
            .replace(/\d+/g, 'N') // Replace numbers with N
            .replace(/[a-f0-9-]{36}/g, 'UUID') // Replace UUIDs
            .replace(/\w+@\w+\.\w+/g, 'EMAIL'); // Replace emails

        return `${error.category}:${error.code}:${messagePattern}`;
    }

    private calculateTrend(pattern: ErrorPattern): 'increasing' | 'decreasing' | 'stable' {
        // Simple trend calculation based on recent occurrences
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        const recentCount = this.errorEvents.filter(event =>
            event.timestamp >= oneHourAgo &&
            this.generateErrorSignature(event.error) === pattern.signature
        ).length;

        const previousCount = this.errorEvents.filter(event =>
            event.timestamp >= twoHoursAgo &&
            event.timestamp < oneHourAgo &&
            this.generateErrorSignature(event.error) === pattern.signature
        ).length;

        if (recentCount > previousCount * 1.5) return 'increasing';
        if (recentCount < previousCount * 0.5) return 'decreasing';
        return 'stable';
    }

    private getServiceStatuses(): SystemHealth['services'] {
        // In production, this would check actual service health
        return {
            'database': {
                status: 'up',
                errorRate: 0.1,
                responseTime: 50,
                lastCheck: new Date()
            },
            'ai-service': {
                status: 'up',
                errorRate: 0.2,
                responseTime: 200,
                lastCheck: new Date()
            },
            'external-apis': {
                status: 'degraded',
                errorRate: 2.0,
                responseTime: 1000,
                lastCheck: new Date()
            }
        };
    }

    private calculateUptime(): number {
        // Calculate uptime percentage over last 24 hours
        return 99.9; // Placeholder
    }

    private groupBy<T, K extends string | number>(
        array: T[],
        keyFn: (item: T) => K
    ): Record<K, number> {
        const result = {} as Record<K, number>;

        for (const item of array) {
            const key = keyFn(item);
            result[key] = (result[key] || 0) + 1;
        }

        return result;
    }

    private getTopErrorPatterns(limit: number): ErrorPattern[] {
        return Array.from(this.errorPatterns.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    private calculateErrorTrend(events: ErrorEvent[]): 'increasing' | 'decreasing' | 'stable' {
        if (events.length < 2) return 'stable';

        const midpoint = Math.floor(events.length / 2);
        const firstHalf = events.slice(0, midpoint).length;
        const secondHalf = events.slice(midpoint).length;

        if (secondHalf > firstHalf * 1.2) return 'increasing';
        if (secondHalf < firstHalf * 0.8) return 'decreasing';
        return 'stable';
    }

    private calculateMTTR(events: ErrorEvent[]): number {
        const resolvedEvents = events.filter(event =>
            event.resolution?.status === 'resolved' && event.resolution.resolvedAt
        );

        if (resolvedEvents.length === 0) return 0;

        const totalResolutionTime = resolvedEvents.reduce((sum, event) => {
            const resolutionTime = event.resolution!.resolvedAt!.getTime() - event.timestamp.getTime();
            return sum + resolutionTime;
        }, 0);

        return totalResolutionTime / resolvedEvents.length / (1000 * 60); // Return in minutes
    }

    private generateEventId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateRuleId(): string {
        return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private startHealthMonitoring(): void {
        // Start periodic health checks
        setInterval(() => {
            this.systemMetrics.lastHealthCheck = new Date();
            // In production, this would perform actual health checks
        }, 60000); // Every minute
    }
}

// ============================================================================
// Global Instance and Convenience Functions
// ============================================================================

export const errorMonitoringService = new ErrorMonitoringService();

/**
 * Track an error with the monitoring service
 */
export async function trackError(
    error: ServiceError,
    context: {
        userId?: string;
        operation: string;
        userAgent?: string;
        url?: string;
        sessionId?: string;
    }
): Promise<void> {
    return errorMonitoringService.trackError(error, context);
}

/**
 * Get current system health
 */
export function getSystemHealth(): SystemHealth {
    return errorMonitoringService.getSystemHealth();
}

/**
 * Get error analytics for a time range
 */
export function getErrorAnalytics(timeRange: { start: Date; end: Date }) {
    return errorMonitoringService.getErrorAnalytics(timeRange);
}