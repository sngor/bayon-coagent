/**
 * AgentStrands Security Audit Logger
 * 
 * Provides comprehensive security audit logging for all AgentStrands operations.
 * Tracks security-relevant events for compliance and forensic analysis.
 * 
 * Features:
 * - Structured audit logs
 * - CloudWatch integration
 * - Compliance tracking
 * - Anomaly detection
 * - Retention policies
 * 
 * Validates: Security Requirements from design.md
 */

import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { getAWSConfig } from '@/aws/config';

// ============================================================================
// Audit Event Types
// ============================================================================

export enum AuditEventType {
    // Authentication & Authorization
    AUTH_SUCCESS = 'auth.success',
    AUTH_FAILURE = 'auth.failure',
    AUTH_TOKEN_REFRESH = 'auth.token_refresh',
    PERMISSION_DENIED = 'auth.permission_denied',

    // Data Access
    DATA_READ = 'data.read',
    DATA_WRITE = 'data.write',
    DATA_DELETE = 'data.delete',
    DATA_EXPORT = 'data.export',

    // Strand Operations
    STRAND_CREATE = 'strand.create',
    STRAND_UPDATE = 'strand.update',
    STRAND_DELETE = 'strand.delete',
    STRAND_EXECUTE = 'strand.execute',

    // Security Events
    RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
    VALIDATION_FAILURE = 'security.validation_failure',
    ENCRYPTION_FAILURE = 'security.encryption_failure',
    SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',

    // Compliance Events
    PII_DETECTED = 'compliance.pii_detected',
    PII_MASKED = 'compliance.pii_masked',
    DATA_RETENTION_APPLIED = 'compliance.data_retention',

    // System Events
    CONFIG_CHANGE = 'system.config_change',
    ADMIN_ACTION = 'system.admin_action',
    ERROR = 'system.error',
}

export enum AuditSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical',
}

// ============================================================================
// Audit Event Interface
// ============================================================================

export interface AuditEvent {
    eventId: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    timestamp: Date;
    userId?: string;
    strandId?: string;
    resourceId?: string;
    resourceType?: string;
    action: string;
    outcome: 'success' | 'failure';
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    errorMessage?: string;
    stackTrace?: string;
}

// ============================================================================
// Audit Logger Class
// ============================================================================

export class SecurityAuditLogger {
    private cloudWatchClient: CloudWatchLogsClient;
    private logGroupName: string;
    private logStreamName: string;
    private eventBuffer: AuditEvent[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private readonly BUFFER_SIZE = 100;
    private readonly FLUSH_INTERVAL_MS = 5000; // 5 seconds

    constructor() {
        const config = getAWSConfig();

        this.cloudWatchClient = new CloudWatchLogsClient({
            region: config.region,
            endpoint: config.environment === 'local' ? 'http://localhost:4566' : undefined,
        });

        this.logGroupName = '/aws/agentstrands/security-audit';
        this.logStreamName = `audit-${Date.now()}`;

        // Start auto-flush
        this.startAutoFlush();
    }

    /**
     * Log an audit event
     */
    async logEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp'>): Promise<void> {
        const auditEvent: AuditEvent = {
            ...event,
            eventId: this.generateEventId(),
            timestamp: new Date(),
        };

        // Add to buffer
        this.eventBuffer.push(auditEvent);

        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[AUDIT]', JSON.stringify(auditEvent, null, 2));
        }

        // Flush if buffer is full
        if (this.eventBuffer.length >= this.BUFFER_SIZE) {
            await this.flush();
        }
    }

    /**
     * Log authentication success
     */
    async logAuthSuccess(userId: string, metadata?: Record<string, any>): Promise<void> {
        await this.logEvent({
            eventType: AuditEventType.AUTH_SUCCESS,
            severity: AuditSeverity.INFO,
            userId,
            action: 'authenticate',
            outcome: 'success',
            metadata,
        });
    }

    /**
     * Log authentication failure
     */
    async logAuthFailure(userId: string, reason: string, metadata?: Record<string, any>): Promise<void> {
        await this.logEvent({
            eventType: AuditEventType.AUTH_FAILURE,
            severity: AuditSeverity.WARNING,
            userId,
            action: 'authenticate',
            outcome: 'failure',
            errorMessage: reason,
            metadata,
        });
    }

    /**
     * Log rate limit exceeded
     */
    async logRateLimitExceeded(
        userId: string,
        operationType: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.logEvent({
            eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
            severity: AuditSeverity.WARNING,
            userId,
            action: operationType,
            outcome: 'failure',
            errorMessage: 'Rate limit exceeded',
            metadata,
        });
    }

    /**
     * Log validation failure
     */
    async logValidationFailure(
        userId: string,
        resourceType: string,
        errors: any[],
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.logEvent({
            eventType: AuditEventType.VALIDATION_FAILURE,
            severity: AuditSeverity.WARNING,
            userId,
            resourceType,
            action: 'validate',
            outcome: 'failure',
            errorMessage: 'Validation failed',
            metadata: {
                ...metadata,
                validationErrors: errors,
            },
        });
    }

    /**
     * Log PII detection
     */
    async logPIIDetected(
        userId: string,
        resourceId: string,
        piiTypes: string[],
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.logEvent({
            eventType: AuditEventType.PII_DETECTED,
            severity: AuditSeverity.WARNING,
            userId,
            resourceId,
            action: 'pii_detection',
            outcome: 'success',
            metadata: {
                ...metadata,
                piiTypes,
            },
        });
    }

    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(
        userId: string,
        description: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.logEvent({
            eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
            severity: AuditSeverity.CRITICAL,
            userId,
            action: 'suspicious_activity',
            outcome: 'failure',
            errorMessage: description,
            metadata,
        });
    }

    /**
     * Log data access
     */
    async logDataAccess(
        userId: string,
        resourceType: string,
        resourceId: string,
        action: 'read' | 'write' | 'delete',
        outcome: 'success' | 'failure',
        metadata?: Record<string, any>
    ): Promise<void> {
        const eventTypeMap = {
            read: AuditEventType.DATA_READ,
            write: AuditEventType.DATA_WRITE,
            delete: AuditEventType.DATA_DELETE,
        };

        await this.logEvent({
            eventType: eventTypeMap[action],
            severity: outcome === 'failure' ? AuditSeverity.WARNING : AuditSeverity.INFO,
            userId,
            resourceType,
            resourceId,
            action,
            outcome,
            metadata,
        });
    }

    /**
     * Log strand operation
     */
    async logStrandOperation(
        userId: string,
        strandId: string,
        operation: 'create' | 'update' | 'delete' | 'execute',
        outcome: 'success' | 'failure',
        metadata?: Record<string, any>
    ): Promise<void> {
        const eventTypeMap = {
            create: AuditEventType.STRAND_CREATE,
            update: AuditEventType.STRAND_UPDATE,
            delete: AuditEventType.STRAND_DELETE,
            execute: AuditEventType.STRAND_EXECUTE,
        };

        await this.logEvent({
            eventType: eventTypeMap[operation],
            severity: outcome === 'failure' ? AuditSeverity.WARNING : AuditSeverity.INFO,
            userId,
            strandId,
            action: operation,
            outcome,
            metadata,
        });
    }

    /**
     * Log admin action
     */
    async logAdminAction(
        adminUserId: string,
        action: string,
        targetUserId?: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.logEvent({
            eventType: AuditEventType.ADMIN_ACTION,
            severity: AuditSeverity.WARNING,
            userId: adminUserId,
            action,
            outcome: 'success',
            metadata: {
                ...metadata,
                targetUserId,
            },
        });
    }

    /**
     * Flush buffered events to CloudWatch
     */
    async flush(): Promise<void> {
        if (this.eventBuffer.length === 0) {
            return;
        }

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        try {
            // In production, send to CloudWatch
            if (process.env.NODE_ENV === 'production') {
                const logEvents = events.map(event => ({
                    message: JSON.stringify(event),
                    timestamp: event.timestamp.getTime(),
                }));

                await this.cloudWatchClient.send(
                    new PutLogEventsCommand({
                        logGroupName: this.logGroupName,
                        logStreamName: this.logStreamName,
                        logEvents,
                    })
                );
            }
        } catch (error) {
            console.error('Failed to flush audit logs:', error);
            // Re-add events to buffer for retry
            this.eventBuffer.unshift(...events);
        }
    }

    /**
     * Start auto-flush interval
     */
    private startAutoFlush(): void {
        this.flushInterval = setInterval(() => {
            this.flush().catch(error => {
                console.error('Auto-flush failed:', error);
            });
        }, this.FLUSH_INTERVAL_MS);
    }

    /**
     * Stop auto-flush and flush remaining events
     */
    async destroy(): Promise<void> {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        await this.flush();
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Query audit logs (for compliance reporting)
     */
    async queryLogs(filters: {
        userId?: string;
        eventType?: AuditEventType;
        startTime?: Date;
        endTime?: Date;
        severity?: AuditSeverity;
    }): Promise<AuditEvent[]> {
        // In a real implementation, this would query CloudWatch Logs Insights
        // For now, return empty array
        console.log('Query audit logs:', filters);
        return [];
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        securityIncidents: number;
        piiDetections: number;
        rateLimitViolations: number;
    }> {
        // In a real implementation, this would aggregate CloudWatch logs
        return {
            totalEvents: 0,
            eventsByType: {},
            securityIncidents: 0,
            piiDetections: 0,
            rateLimitViolations: 0,
        };
    }
}

// ============================================================================
// Global Instance
// ============================================================================

export const auditLogger = new SecurityAuditLogger();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Log with automatic error handling
 */
export async function safeLogAudit(
    logFn: () => Promise<void>
): Promise<void> {
    try {
        await logFn();
    } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't throw - audit logging failures shouldn't break the application
    }
}
