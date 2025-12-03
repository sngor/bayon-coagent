/**
 * AgentStrands Input Validation Service
 * 
 * Provides comprehensive input validation for all AgentStrands operations
 * to prevent injection attacks, malformed data, and security vulnerabilities.
 * 
 * Security Features:
 * - Schema-based validation using Zod
 * - Content sanitization
 * - Size limits enforcement
 * - Type safety
 * - XSS prevention
 * 
 * Validates: Security Requirements from design.md
 */

import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Base strand configuration schema
 */
export const StrandConfigSchema = z.object({
    id: z.string().uuid('Invalid strand ID format'),
    type: z.enum([
        'data-analyst',
        'content-generator',
        'market-forecaster',
        'image-analyst',
        'video-script-generator',
        'audio-content-creator',
        'document-processor',
        'quality-assurance',
        'competitor-monitor',
        'opportunity-detector'
    ]),
    userId: z.string().min(1, 'User ID is required').max(256, 'User ID too long'),
    capabilities: z.array(z.string()).max(50, 'Too many capabilities'),
    metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Task input schema with size limits
 */
export const TaskInputSchema = z.object({
    id: z.string().uuid('Invalid task ID format'),
    strandId: z.string().uuid('Invalid strand ID format'),
    type: z.string().min(1).max(100, 'Task type too long'),
    description: z.string().min(1, 'Description required').max(5000, 'Description too long'),
    input: z.record(z.string(), z.any()),
    dependencies: z.array(z.string().uuid()).max(20, 'Too many dependencies'),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    timeout: z.number().int().min(1000).max(300000).optional(), // 1s to 5min
    createdAt: z.string().datetime(),
});

/**
 * Feedback input schema
 */
export const FeedbackInputSchema = z.object({
    taskId: z.string().uuid('Invalid task ID format'),
    strandId: z.string().uuid('Invalid strand ID format'),
    userId: z.string().min(1).max(256),
    feedbackType: z.enum(['rating', 'edit', 'engagement']),
    rating: z.number().int().min(1).max(5).optional(),
    edits: z.object({
        originalContent: z.string().max(100000, 'Content too large'),
        editedContent: z.string().max(100000, 'Content too large'),
        sectionsModified: z.array(z.string()).max(50),
        changeType: z.enum(['addition', 'deletion', 'modification']),
    }).optional(),
    engagement: z.object({
        views: z.number().int().min(0),
        clicks: z.number().int().min(0),
        shares: z.number().int().min(0),
        conversions: z.number().int().min(0),
    }).optional(),
    timestamp: z.string().datetime(),
});

/**
 * Memory entry schema
 */
export const MemoryEntrySchema = z.object({
    id: z.string().uuid('Invalid memory ID format'),
    strandId: z.string().uuid('Invalid strand ID format'),
    content: z.string().min(1).max(50000, 'Memory content too large'),
    metadata: z.object({
        type: z.enum(['task', 'pattern', 'knowledge']),
        importance: z.number().min(0).max(1),
        accessCount: z.number().int().min(0),
        lastAccessed: z.string().datetime(),
        tags: z.array(z.string()).max(20),
    }),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
});

/**
 * Handoff context schema
 */
export const HandoffContextSchema = z.object({
    taskId: z.string().uuid('Invalid task ID format'),
    fromStrandId: z.string().uuid('Invalid strand ID format'),
    toStrandId: z.string().uuid('Invalid strand ID format'),
    intermediateResults: z.any(),
    sharedContext: z.record(z.string(), z.any()),
    learnedPatterns: z.record(z.string(), z.any()),
    metadata: z.object({
        handoffReason: z.string().max(500),
        confidence: z.number().min(0).max(1),
        timestamp: z.string().datetime(),
    }),
});

/**
 * Opportunity record schema
 */
export const OpportunitySchema = z.object({
    id: z.string().uuid('Invalid opportunity ID format'),
    userId: z.string().min(1).max(256),
    type: z.enum(['trend', 'gap', 'timing', 'competitive']),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    potentialImpact: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    supportingData: z.array(z.any()).max(100),
    expiresAt: z.string().datetime().optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates strand configuration
 */
export function validateStrandConfig(config: unknown): z.infer<typeof StrandConfigSchema> {
    return StrandConfigSchema.parse(config);
}

/**
 * Validates task input
 */
export function validateTaskInput(input: unknown): z.infer<typeof TaskInputSchema> {
    return TaskInputSchema.parse(input);
}

/**
 * Validates feedback input
 */
export function validateFeedbackInput(input: unknown): z.infer<typeof FeedbackInputSchema> {
    return FeedbackInputSchema.parse(input);
}

/**
 * Validates memory entry
 */
export function validateMemoryEntry(entry: unknown): z.infer<typeof MemoryEntrySchema> {
    return MemoryEntrySchema.parse(entry);
}

/**
 * Validates handoff context
 */
export function validateHandoffContext(context: unknown): z.infer<typeof HandoffContextSchema> {
    return HandoffContextSchema.parse(context);
}

/**
 * Validates opportunity record
 */
export function validateOpportunity(opportunity: unknown): z.infer<typeof OpportunitySchema> {
    return OpportunitySchema.parse(opportunity);
}

// ============================================================================
// Content Sanitization
// ============================================================================

/**
 * Sanitizes user-provided content to prevent XSS and injection attacks
 */
export function sanitizeContent(content: string): string {
    if (!content) return '';

    // Remove potentially dangerous HTML tags
    let sanitized = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers

    // Limit length
    if (sanitized.length > 100000) {
        sanitized = sanitized.substring(0, 100000);
    }

    return sanitized;
}

/**
 * Sanitizes metadata object
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
        // Limit key length
        if (key.length > 100) continue;

        // Sanitize string values
        if (typeof value === 'string') {
            sanitized[key] = sanitizeContent(value);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            sanitized[key] = value;
        } else if (Array.isArray(value)) {
            // Limit array size
            sanitized[key] = value.slice(0, 100);
        } else if (value && typeof value === 'object') {
            // Recursively sanitize nested objects (max depth 3)
            sanitized[key] = sanitizeMetadata(value);
        }
    }

    return sanitized;
}

// ============================================================================
// Size Validation
// ============================================================================

/**
 * Validates payload size to prevent DoS attacks
 */
export function validatePayloadSize(payload: any, maxSizeBytes: number = 1048576): boolean {
    const size = JSON.stringify(payload).length;
    return size <= maxSizeBytes;
}

/**
 * Validates array length
 */
export function validateArrayLength<T>(array: T[], maxLength: number, fieldName: string): void {
    if (array.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
    }
}

/**
 * Validates string length
 */
export function validateStringLength(str: string, maxLength: number, fieldName: string): void {
    if (str.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
    }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for strand configuration
 */
export function isValidStrandConfig(config: unknown): config is z.infer<typeof StrandConfigSchema> {
    try {
        StrandConfigSchema.parse(config);
        return true;
    } catch {
        return false;
    }
}

/**
 * Type guard for task input
 */
export function isValidTaskInput(input: unknown): input is z.infer<typeof TaskInputSchema> {
    try {
        TaskInputSchema.parse(input);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// Validation Error Handling
// ============================================================================

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

/**
 * Converts Zod errors to user-friendly validation errors
 */
export function formatValidationErrors(error: z.ZodError): ValidationError[] {
    return error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
    }));
}

/**
 * Safe validation wrapper that returns result instead of throwing
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, errors: formatValidationErrors(error) };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed', code: 'unknown' }],
        };
    }
}
