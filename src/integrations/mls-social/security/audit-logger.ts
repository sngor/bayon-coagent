/**
 * Audit Logger for MLS and Social Media Operations
 * 
 * Logs security-sensitive operations to CloudWatch for audit trails
 * and compliance monitoring.
 * 
 * Requirements: Security considerations - Audit logging for credential access
 */

import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

/**
 * CloudWatch Logs Client Configuration
 */
const cloudWatchClient = new CloudWatchLogsClient({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(process.env.USE_LOCAL_AWS === 'true' && {
        endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
        credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test',
        },
    }),
});

/**
 * Log group and stream configuration
 */
const LOG_GROUP_NAME = process.env.AUDIT_LOG_GROUP || '/bayon/mls-social/audit';
const LOG_STREAM_PREFIX = 'audit-';

/**
 * Audit event types
 */
export enum AuditEventType {
    // MLS events
    MLS_AUTH_SUCCESS = 'MLS_AUTH_SUCCESS',
    MLS_AUTH_FAILURE = 'MLS_AUTH_FAILURE',
    MLS_CONNECTION_CREATED = 'MLS_CONNECTION_CREATED',
    MLS_CONNECTION_DELETED = 'MLS_CONNECTION_DELETED',
    MLS_TOKEN_ACCESSED = 'MLS_TOKEN_ACCESSED',
    MLS_TOKEN_REFRESHED = 'MLS_TOKEN_REFRESHED',
    MLS_IMPORT_STARTED = 'MLS_IMPORT_STARTED',
    MLS_IMPORT_COMPLETED = 'MLS_IMPORT_COMPLETED',
    MLS_IMPORT_FAILED = 'MLS_IMPORT_FAILED',
    MLS_SYNC_STARTED = 'MLS_SYNC_STARTED',
    MLS_SYNC_COMPLETED = 'MLS_SYNC_COMPLETED',

    // OAuth events
    OAUTH_AUTH_SUCCESS = 'OAUTH_AUTH_SUCCESS',
    OAUTH_AUTH_FAILURE = 'OAUTH_AUTH_FAILURE',
    OAUTH_CONNECTION_CREATED = 'OAUTH_CONNECTION_CREATED',
    OAUTH_CONNECTION_DELETED = 'OAUTH_CONNECTION_DELETED',
    OAUTH_TOKEN_ACCESSED = 'OAUTH_TOKEN_ACCESSED',
    OAUTH_TOKEN_REFRESHED = 'OAUTH_TOKEN_REFRESHED',

    // Social media events
    SOCIAL_POST_CREATED = 'SOCIAL_POST_CREATED',
    SOCIAL_POST_FAILED = 'SOCIAL_POST_FAILED',
    SOCIAL_POST_DELETED = 'SOCIAL_POST_DELETED',

    // Security events
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INVALID_INPUT = 'INVALID_INPUT',
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
    ENCRYPTION_FAILURE = 'ENCRYPTION_FAILURE',
    DECRYPTION_FAILURE = 'DECRYPTION_FAILURE',
}

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}

/**
 * Audit event metadata
 */
export interface AuditEventMetadata {
    userId: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    timestamp: number;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    action?: string;
    result: 'success' | 'failure';
    details?: Record<string, any>;
    error?: string;
}

/**
 * Logs an audit event to CloudWatch
 * 
 * @param event - Audit event metadata
 */
export async function logAuditEvent(event: AuditEventMetadata): Promise<void> {
    // In local development without LocalStack, log to console
    if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_AWS !== 'true') {
        console.log('[AUDIT]', JSON.stringify(event, null, 2));
        return;
    }

    try {
        const logStreamName = `${LOG_STREAM_PREFIX}${new Date().toISOString().split('T')[0]}`;

        // Create log stream if it doesn't exist (idempotent)
        try {
            await cloudWatchClient.send(
                new CreateLogStreamCommand({
                    logGroupName: LOG_GROUP_NAME,
                    logStreamName,
                })
            );
        } catch (error: any) {
            // Ignore if stream already exists
            if (error.name !== 'ResourceAlreadyExistsException') {
                throw error;
            }
        }

        // Put log event
        await cloudWatchClient.send(
            new PutLogEventsCommand({
                logGroupName: LOG_GROUP_NAME,
                logStreamName,
                logEvents: [
                    {
                        timestamp: event.timestamp,
                        message: JSON.stringify(event),
                    },
                ],
            })
        );
    } catch (error) {
        // Log to console as fallback
        console.error('Failed to log audit event to CloudWatch:', error);
        console.log('[AUDIT FALLBACK]', JSON.stringify(event, null, 2));
    }
}

/**
 * Logs MLS authentication success
 */
export async function logMLSAuthSuccess(
    userId: string,
    provider: string,
    connectionId: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.MLS_AUTH_SUCCESS,
        severity: AuditSeverity.INFO,
        timestamp: Date.now(),
        ipAddress,
        resource: `mls-connection:${connectionId}`,
        action: 'authenticate',
        result: 'success',
        details: { provider },
    });
}

/**
 * Logs MLS authentication failure
 */
export async function logMLSAuthFailure(
    userId: string,
    provider: string,
    error: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.MLS_AUTH_FAILURE,
        severity: AuditSeverity.WARNING,
        timestamp: Date.now(),
        ipAddress,
        resource: `mls-provider:${provider}`,
        action: 'authenticate',
        result: 'failure',
        error,
    });
}

/**
 * Logs MLS token access
 */
export async function logMLSTokenAccess(
    userId: string,
    connectionId: string,
    action: 'read' | 'refresh',
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: action === 'refresh' ? AuditEventType.MLS_TOKEN_REFRESHED : AuditEventType.MLS_TOKEN_ACCESSED,
        severity: AuditSeverity.INFO,
        timestamp: Date.now(),
        ipAddress,
        resource: `mls-connection:${connectionId}`,
        action: `token-${action}`,
        result: 'success',
    });
}

/**
 * Logs OAuth authentication success
 */
export async function logOAuthAuthSuccess(
    userId: string,
    platform: string,
    connectionId: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.OAUTH_AUTH_SUCCESS,
        severity: AuditSeverity.INFO,
        timestamp: Date.now(),
        ipAddress,
        resource: `oauth-connection:${connectionId}`,
        action: 'authenticate',
        result: 'success',
        details: { platform },
    });
}

/**
 * Logs OAuth authentication failure
 */
export async function logOAuthAuthFailure(
    userId: string,
    platform: string,
    error: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.OAUTH_AUTH_FAILURE,
        severity: AuditSeverity.WARNING,
        timestamp: Date.now(),
        ipAddress,
        resource: `oauth-platform:${platform}`,
        action: 'authenticate',
        result: 'failure',
        error,
    });
}

/**
 * Logs OAuth token access
 */
export async function logOAuthTokenAccess(
    userId: string,
    platform: string,
    connectionId: string,
    action: 'read' | 'refresh',
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: action === 'refresh' ? AuditEventType.OAUTH_TOKEN_REFRESHED : AuditEventType.OAUTH_TOKEN_ACCESSED,
        severity: AuditSeverity.INFO,
        timestamp: Date.now(),
        ipAddress,
        resource: `oauth-connection:${connectionId}`,
        action: `token-${action}`,
        result: 'success',
        details: { platform },
    });
}

/**
 * Logs connection deletion
 */
export async function logConnectionDeleted(
    userId: string,
    connectionType: 'mls' | 'oauth',
    connectionId: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: connectionType === 'mls' ? AuditEventType.MLS_CONNECTION_DELETED : AuditEventType.OAUTH_CONNECTION_DELETED,
        severity: AuditSeverity.INFO,
        timestamp: Date.now(),
        ipAddress,
        resource: `${connectionType}-connection:${connectionId}`,
        action: 'delete',
        result: 'success',
    });
}

/**
 * Logs rate limit exceeded
 */
export async function logRateLimitExceeded(
    userId: string,
    operation: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
        severity: AuditSeverity.WARNING,
        timestamp: Date.now(),
        ipAddress,
        resource: `operation:${operation}`,
        action: 'rate-limit-check',
        result: 'failure',
        details: { operation },
    });
}

/**
 * Logs invalid input
 */
export async function logInvalidInput(
    userId: string,
    operation: string,
    errors: Record<string, string[]>,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.INVALID_INPUT,
        severity: AuditSeverity.WARNING,
        timestamp: Date.now(),
        ipAddress,
        resource: `operation:${operation}`,
        action: 'input-validation',
        result: 'failure',
        details: { errors },
    });
}

/**
 * Logs unauthorized access attempt
 */
export async function logUnauthorizedAccess(
    userId: string,
    resource: string,
    action: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.UNAUTHORIZED_ACCESS,
        severity: AuditSeverity.ERROR,
        timestamp: Date.now(),
        ipAddress,
        resource,
        action,
        result: 'failure',
    });
}

/**
 * Logs encryption/decryption failure
 */
export async function logEncryptionFailure(
    userId: string,
    operation: 'encrypt' | 'decrypt',
    tokenType: 'mls' | 'oauth',
    error: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: operation === 'encrypt' ? AuditEventType.ENCRYPTION_FAILURE : AuditEventType.DECRYPTION_FAILURE,
        severity: AuditSeverity.ERROR,
        timestamp: Date.now(),
        resource: `token:${tokenType}`,
        action: operation,
        result: 'failure',
        error,
    });
}

/**
 * Logs social media post creation
 */
export async function logSocialPostCreated(
    userId: string,
    platform: string,
    postId: string,
    listingId: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.SOCIAL_POST_CREATED,
        severity: AuditSeverity.INFO,
        timestamp: Date.now(),
        ipAddress,
        resource: `social-post:${postId}`,
        action: 'create',
        result: 'success',
        details: { platform, listingId },
    });
}

/**
 * Logs social media post failure
 */
export async function logSocialPostFailed(
    userId: string,
    platform: string,
    listingId: string,
    error: string,
    ipAddress?: string
): Promise<void> {
    await logAuditEvent({
        userId,
        eventType: AuditEventType.SOCIAL_POST_FAILED,
        severity: AuditSeverity.ERROR,
        timestamp: Date.now(),
        ipAddress,
        resource: `listing:${listingId}`,
        action: 'create-post',
        result: 'failure',
        details: { platform },
        error,
    });
}

/**
 * Logs MLS import operation
 */
export async function logMLSImport(
    userId: string,
    connectionId: string,
    status: 'started' | 'completed' | 'failed',
    details?: { totalListings?: number; successfulImports?: number; failedImports?: number },
    error?: string
): Promise<void> {
    const eventTypeMap = {
        started: AuditEventType.MLS_IMPORT_STARTED,
        completed: AuditEventType.MLS_IMPORT_COMPLETED,
        failed: AuditEventType.MLS_IMPORT_FAILED,
    };

    const severityMap = {
        started: AuditSeverity.INFO,
        completed: AuditSeverity.INFO,
        failed: AuditSeverity.ERROR,
    };

    await logAuditEvent({
        userId,
        eventType: eventTypeMap[status],
        severity: severityMap[status],
        timestamp: Date.now(),
        resource: `mls-connection:${connectionId}`,
        action: 'import-listings',
        result: status === 'failed' ? 'failure' : 'success',
        details,
        error,
    });
}
