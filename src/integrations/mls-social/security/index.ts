/**
 * MLS Social Integration Security Module
 * 
 * Centralized security features for MLS and social media integrations:
 * - Token encryption using AWS KMS
 * - Rate limiting for API endpoints
 * - Input validation and sanitization
 * - Audit logging for compliance
 * - HTTPS-only communication enforcement
 * 
 * Requirements: 1.2, 6.2 - Security measures
 */

// Encryption
export {
    encryptToken,
    decryptToken,
    encryptMLSToken,
    decryptMLSToken,
    encryptOAuthToken,
    decryptOAuthToken,
    isTokenEncrypted,
} from './encryption';

// Rate Limiting
export {
    checkMLSSocialRateLimit,
    getMLSSocialRateLimitStatus,
    formatMLSSocialRateLimitError,
    withRateLimit,
    MLS_SOCIAL_RATE_LIMITS,
    type MLSSocialOperation,
    type RateLimitResult,
} from './rate-limiter';

// Input Validation
export {
    sanitizeString,
    sanitizeHTML,
    validateInput,
    validateHTTPSUrl,
    ensureHTTPSOnly,
    validateNoSQLInjection,
    validateNoNoSQLInjection,
    MLSCredentialsValidator,
    ListingIdValidator,
    ConnectionIdValidator,
    UserIdValidator,
    PlatformValidator,
    PostContentValidator,
    OAuthCallbackValidator,
    ImageOptimizationValidator,
    HashtagGenerationValidator,
    StatusSyncValidator,
    ImportParametersValidator,
    FileUploadValidator,
    PaginationValidator,
    DateRangeValidator,
} from './input-validator';

// Audit Logging
export {
    logAuditEvent,
    logMLSAuthSuccess,
    logMLSAuthFailure,
    logMLSTokenAccess,
    logOAuthAuthSuccess,
    logOAuthAuthFailure,
    logOAuthTokenAccess,
    logConnectionDeleted,
    logRateLimitExceeded,
    logInvalidInput,
    logUnauthorizedAccess,
    logEncryptionFailure,
    logSocialPostCreated,
    logSocialPostFailed,
    logMLSImport,
    AuditEventType,
    AuditSeverity,
    type AuditEventMetadata,
} from './audit-logger';
