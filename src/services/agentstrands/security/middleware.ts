/**
 * AgentStrands Security Middleware
 * 
 * Provides middleware functions to enforce security policies across
 * all AgentStrands operations.
 * 
 * Features:
 * - Input validation
 * - Rate limiting
 * - Audit logging
 * - PII detection
 * - Error handling
 * 
 * Validates: Security Requirements from design.md
 */

import { z } from 'zod';
import {
    validateStrandConfig,
    validateTaskInput,
    validateFeedbackInput,
    validateMemoryEntry,
    validateHandoffContext,
    validateOpportunity,
    sanitizeContent,
    sanitizeMetadata,
    validatePayloadSize,
    safeValidate,
    type ValidationError,
} from './input-validator';
import {
    rateLimiter,
    enforceRateLimit,
    type RateLimitResult,
    RATE_LIMIT_CONFIGS,
} from './rate-limiter';
import {
    auditLogger,
    AuditEventType,
    AuditSeverity,
    safeLogAudit,
} from './audit-logger';
import {
    detectPII,
    maskPII,
    encryptFields,
    decryptFields,
} from './encryption';

// ============================================================================
// Middleware Types
// ============================================================================

export interface SecurityContext {
    userId: string;
    strandId?: string;
    operationType: keyof typeof RATE_LIMIT_CONFIGS;
    ipAddress?: string;
    userAgent?: string;
}

export interface SecurityResult<T> {
    success: boolean;
    data?: T;
    errors?: ValidationError[];
    rateLimitExceeded?: boolean;
    retryAfter?: number;
}

// ============================================================================
// Main Security Middleware
// ============================================================================

/**
 * Comprehensive security middleware for AgentStrands operations
 */
export async function securityMiddleware<T>(
    context: SecurityContext,
    data: unknown,
    validationSchema: z.ZodSchema<T>,
    operation: () => Promise<T>
): Promise<SecurityResult<T>> {
    const startTime = Date.now();

    try {
        // Step 1: Validate payload size
        if (!validatePayloadSize(data, 1048576)) { // 1MB limit
            await safeLogAudit(() =>
                auditLogger.logValidationFailure(
                    context.userId,
                    'payload',
                    [{ field: 'size', message: 'Payload too large', code: 'size_exceeded' }],
                    { operationType: context.operationType }
                )
            );

            return {
                success: false,
                errors: [
                    {
                        field: 'payload',
                        message: 'Payload size exceeds maximum allowed (1MB)',
                        code: 'payload_too_large',
                    },
                ],
            };
        }

        // Step 2: Validate input schema
        const validationResult = safeValidate(validationSchema, data);
        if (!validationResult.success) {
            await safeLogAudit(() =>
                auditLogger.logValidationFailure(
                    context.userId,
                    context.operationType,
                    validationResult.errors,
                    { strandId: context.strandId }
                )
            );

            return {
                success: false,
                errors: validationResult.errors,
            };
        }

        // Step 3: Check rate limits
        const rateLimitResult = await rateLimiter.checkRateLimit(
            context.userId,
            context.operationType,
            context.strandId
        );

        if (!rateLimitResult.allowed) {
            await safeLogAudit(() =>
                auditLogger.logRateLimitExceeded(
                    context.userId,
                    context.operationType,
                    {
                        strandId: context.strandId,
                        retryAfter: rateLimitResult.retryAfter,
                    }
                )
            );

            return {
                success: false,
                rateLimitExceeded: true,
                retryAfter: rateLimitResult.retryAfter,
                errors: [
                    {
                        field: 'rate_limit',
                        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
                        code: 'rate_limit_exceeded',
                    },
                ],
            };
        }

        // Step 4: Check for PII in content
        const dataStr = JSON.stringify(validationResult.data);
        const piiCheck = detectPII(dataStr);
        if (piiCheck.hasPII) {
            await safeLogAudit(() =>
                auditLogger.logPIIDetected(
                    context.userId,
                    context.strandId || 'unknown',
                    piiCheck.types,
                    { operationType: context.operationType }
                )
            );
        }

        // Step 5: Execute operation
        const result = await operation();

        // Step 6: Log successful operation
        await safeLogAudit(() =>
            auditLogger.logEvent({
                eventType: AuditEventType.STRAND_EXECUTE,
                severity: AuditSeverity.INFO,
                userId: context.userId,
                strandId: context.strandId,
                action: context.operationType,
                outcome: 'success',
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                metadata: {
                    executionTimeMs: Date.now() - startTime,
                    rateLimitRemaining: rateLimitResult.remaining,
                },
            })
        );

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        // Log error
        await safeLogAudit(() =>
            auditLogger.logEvent({
                eventType: AuditEventType.ERROR,
                severity: AuditSeverity.ERROR,
                userId: context.userId,
                strandId: context.strandId,
                action: context.operationType,
                outcome: 'failure',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                stackTrace: error instanceof Error ? error.stack : undefined,
                metadata: {
                    executionTimeMs: Date.now() - startTime,
                },
            })
        );

        return {
            success: false,
            errors: [
                {
                    field: 'operation',
                    message: error instanceof Error ? error.message : 'Operation failed',
                    code: 'operation_failed',
                },
            ],
        };
    }
}

// ============================================================================
// Specialized Middleware Functions
// ============================================================================

/**
 * Middleware for strand creation
 */
export async function validateStrandCreation(
    userId: string,
    config: unknown
): Promise<SecurityResult<any>> {
    return securityMiddleware(
        {
            userId,
            operationType: 'strandCreation',
        },
        config,
        z.any(), // Use the StrandConfigSchema from input-validator
        async () => {
            const validated = validateStrandConfig(config);
            return validated;
        }
    );
}

/**
 * Middleware for task execution
 */
export async function validateTaskExecution(
    userId: string,
    strandId: string,
    taskInput: unknown
): Promise<SecurityResult<any>> {
    return securityMiddleware(
        {
            userId,
            strandId,
            operationType: 'taskExecution',
        },
        taskInput,
        z.any(), // Use the TaskInputSchema from input-validator
        async () => {
            const validated = validateTaskInput(taskInput);
            return validated;
        }
    );
}

/**
 * Middleware for feedback submission
 */
export async function validateFeedbackSubmission(
    userId: string,
    feedback: unknown
): Promise<SecurityResult<any>> {
    return securityMiddleware(
        {
            userId,
            operationType: 'feedbackSubmission',
        },
        feedback,
        z.any(), // Use the FeedbackInputSchema from input-validator
        async () => {
            const validated = validateFeedbackInput(feedback);
            return validated;
        }
    );
}

/**
 * Middleware for memory operations
 */
export async function validateMemoryOperation(
    userId: string,
    strandId: string,
    memoryEntry: unknown
): Promise<SecurityResult<any>> {
    return securityMiddleware(
        {
            userId,
            strandId,
            operationType: 'memoryOperation',
        },
        memoryEntry,
        z.any(), // Use the MemoryEntrySchema from input-validator
        async () => {
            const validated = validateMemoryEntry(memoryEntry);
            return validated;
        }
    );
}

/**
 * Middleware for handoff operations
 */
export async function validateHandoffOperation(
    userId: string,
    handoffContext: unknown
): Promise<SecurityResult<any>> {
    return securityMiddleware(
        {
            userId,
            operationType: 'handoffOperation',
        },
        handoffContext,
        z.any(), // Use the HandoffContextSchema from input-validator
        async () => {
            const validated = validateHandoffContext(handoffContext);
            return validated;
        }
    );
}

/**
 * Middleware for opportunity detection
 */
export async function validateOpportunityDetection(
    userId: string,
    opportunity: unknown
): Promise<SecurityResult<any>> {
    return securityMiddleware(
        {
            userId,
            operationType: 'opportunityDetection',
        },
        opportunity,
        z.any(), // Use the OpportunitySchema from input-validator
        async () => {
            const validated = validateOpportunity(opportunity);
            return validated;
        }
    );
}

// ============================================================================
// Content Sanitization Middleware
// ============================================================================

/**
 * Sanitizes content before storage
 */
export function sanitizeForStorage<T extends Record<string, any>>(
    data: T
): T {
    const sanitized = { ...data };

    // Sanitize string fields
    for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeContent(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeMetadata(value);
        }
    }

    return sanitized;
}

/**
 * Masks PII before logging or external transmission
 */
export function maskPIIForLogging<T extends Record<string, any>>(
    data: T
): T {
    const masked = { ...data };

    for (const [key, value] of Object.entries(masked)) {
        if (typeof value === 'string') {
            masked[key] = maskPII(value);
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            masked[key] = maskPIIForLogging(value);
        }
    }

    return masked;
}

// ============================================================================
// Security Headers
// ============================================================================

/**
 * Get security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Creates a standardized security error response
 */
export function createSecurityErrorResponse(
    errors: ValidationError[],
    statusCode: number = 400
): {
    statusCode: number;
    body: {
        error: string;
        errors: ValidationError[];
        timestamp: string;
    };
} {
    return {
        statusCode,
        body: {
            error: 'Security validation failed',
            errors,
            timestamp: new Date().toISOString(),
        },
    };
}

/**
 * Creates a rate limit error response
 */
export function createRateLimitErrorResponse(
    retryAfter: number
): {
    statusCode: number;
    headers: Record<string, string>;
    body: {
        error: string;
        retryAfter: number;
        timestamp: string;
    };
} {
    return {
        statusCode: 429,
        headers: {
            'Retry-After': retryAfter.toString(),
            ...getSecurityHeaders(),
        },
        body: {
            error: 'Rate limit exceeded',
            retryAfter,
            timestamp: new Date().toISOString(),
        },
    };
}
