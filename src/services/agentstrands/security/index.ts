/**
 * AgentStrands Security Module
 * 
 * Central export point for all security-related functionality.
 * 
 * This module provides comprehensive security features for AgentStrands:
 * - Input validation and sanitization
 * - Rate limiting
 * - Encryption and hashing
 * - Audit logging
 * - Security middleware
 * 
 * Usage:
 * ```typescript
 * import { securityMiddleware, auditLogger, encrypt } from '@/services/agentstrands/security';
 * 
 * // Use middleware for operations
 * const result = await securityMiddleware(context, data, schema, operation);
 * 
 * // Log security events
 * await auditLogger.logAuthSuccess(userId);
 * 
 * // Encrypt sensitive data
 * const encrypted = encrypt(sensitiveData);
 * ```
 * 
 * Validates: Security Requirements from design.md
 */

// ============================================================================
// Input Validation Exports
// ============================================================================

export {
    // Schemas
    StrandConfigSchema,
    TaskInputSchema,
    FeedbackInputSchema,
    MemoryEntrySchema,
    HandoffContextSchema,
    OpportunitySchema,

    // Validation functions
    validateStrandConfig,
    validateTaskInput,
    validateFeedbackInput,
    validateMemoryEntry,
    validateHandoffContext,
    validateOpportunity,

    // Sanitization
    sanitizeContent,
    sanitizeMetadata,

    // Size validation
    validatePayloadSize,
    validateArrayLength,
    validateStringLength,

    // Type guards
    isValidStrandConfig,
    isValidTaskInput,

    // Error handling
    formatValidationErrors,
    safeValidate,

    // Types
    type ValidationError,
} from './input-validator';

// ============================================================================
// Rate Limiting Exports
// ============================================================================

export {
    // Rate limiter instance
    rateLimiter,

    // Configuration
    RATE_LIMIT_CONFIGS,

    // Convenience functions
    checkTaskExecutionLimit,
    checkFeedbackLimit,
    checkMemoryOperationLimit,
    checkOpportunityDetectionLimit,
    checkQualityCheckLimit,
    enforceRateLimit,

    // Types
    type RateLimitConfig,
    type RateLimitResult,
} from './rate-limiter';

// ============================================================================
// Encryption Exports
// ============================================================================

export {
    // Encryption/Decryption
    encrypt,
    decrypt,
    encryptObject,
    decryptObject,

    // Field-level encryption
    encryptFields,
    decryptFields,

    // Hashing
    hash,
    hashWithSalt,
    verifyHash,

    // Token generation
    generateSecureToken,
    generateTimeLimitedToken,
    verifyTimeLimitedToken,

    // PII handling
    detectPII,
    maskPII,

    // Secure comparison
    secureCompare,

    // Types
    type EncryptedData,
} from './encryption';

// ============================================================================
// Audit Logging Exports
// ============================================================================

export {
    // Audit logger instance
    auditLogger,

    // Convenience function
    safeLogAudit,

    // Enums
    AuditEventType,
    AuditSeverity,

    // Types
    type AuditEvent,
} from './audit-logger';

// ============================================================================
// Middleware Exports
// ============================================================================

export {
    // Main middleware
    securityMiddleware,

    // Specialized middleware
    validateStrandCreation,
    validateTaskExecution,
    validateFeedbackSubmission,
    validateMemoryOperation,
    validateHandoffOperation,
    validateOpportunityDetection,

    // Content sanitization
    sanitizeForStorage,
    maskPIIForLogging,

    // Security headers
    getSecurityHeaders,

    // Error responses
    createSecurityErrorResponse,
    createRateLimitErrorResponse,

    // Types
    type SecurityContext,
    type SecurityResult,
} from './middleware';

// ============================================================================
// Security Configuration
// ============================================================================

/**
 * Security configuration for AgentStrands
 */
export const SECURITY_CONFIG = {
    // Payload limits
    maxPayloadSize: 1048576, // 1MB
    maxArrayLength: 100,
    maxStringLength: 100000,

    // Rate limits (from rate-limiter.ts)
    rateLimits: RATE_LIMIT_CONFIGS,

    // Encryption
    encryptionAlgorithm: 'aes-256-gcm',
    keyDerivationIterations: 100000,

    // Audit logging
    auditLogRetentionDays: 90,
    auditLogFlushIntervalMs: 5000,

    // PII detection
    piiDetectionEnabled: true,
    piiMaskingEnabled: true,

    // Security headers
    enableSecurityHeaders: true,
    enableHSTS: true,
    enableCSP: true,
} as const;

// ============================================================================
// Security Utilities
// ============================================================================

/**
 * Initialize security module
 */
export async function initializeSecurity(): Promise<void> {
    console.log('[Security] Initializing AgentStrands security module...');

    // Verify encryption key is set
    if (!process.env.AGENTSTRANDS_ENCRYPTION_KEY) {
        console.warn(
            '[Security] WARNING: AGENTSTRANDS_ENCRYPTION_KEY is not set. ' +
            'Encryption features will not work properly.'
        );
    }

    console.log('[Security] Security module initialized successfully');
}

/**
 * Cleanup security module
 */
export async function cleanupSecurity(): Promise<void> {
    console.log('[Security] Cleaning up security module...');

    // Flush audit logs
    await auditLogger.destroy();

    // Cleanup rate limiter
    rateLimiter.destroy();

    console.log('[Security] Security module cleaned up successfully');
}

/**
 * Get security health status
 */
export async function getSecurityHealth(): Promise<{
    healthy: boolean;
    checks: {
        encryptionKey: boolean;
        rateLimiter: boolean;
        auditLogger: boolean;
    };
}> {
    const checks = {
        encryptionKey: !!process.env.AGENTSTRANDS_ENCRYPTION_KEY,
        rateLimiter: true, // Rate limiter is always available
        auditLogger: true, // Audit logger is always available
    };

    return {
        healthy: Object.values(checks).every(check => check),
        checks,
    };
}

// ============================================================================
// Re-export from rate-limiter for convenience
// ============================================================================

import { RATE_LIMIT_CONFIGS } from './rate-limiter';
