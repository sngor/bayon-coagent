/**
 * Input Validation for MLS and Social Media Operations
 * 
 * Provides comprehensive input validation and sanitization for all user inputs
 * to prevent injection attacks, XSS, and other security vulnerabilities.
 * 
 * Requirements: Security considerations - Input validation for all user inputs
 */

import { z } from 'zod';

/**
 * Sanitizes a string by removing potentially dangerous characters
 * 
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
        .replace(/['"]/g, '') // Remove quotes
        .trim();
}

/**
 * Validates and sanitizes MLS credentials
 */
export const MLSCredentialsValidator = z.object({
    provider: z.string()
        .min(1, 'Provider is required')
        .max(50, 'Provider name too long')
        .regex(/^[a-z0-9-]+$/, 'Provider must contain only lowercase letters, numbers, and hyphens'),
    username: z.string()
        .min(1, 'Username is required')
        .max(100, 'Username too long')
        .transform(sanitizeString),
    password: z.string()
        .min(1, 'Password is required')
        .max(200, 'Password too long'),
    mlsId: z.string()
        .max(50, 'MLS ID too long')
        .optional()
        .transform(val => val ? sanitizeString(val) : undefined),
});

/**
 * Validates listing ID
 */
export const ListingIdValidator = z.string()
    .min(1, 'Listing ID is required')
    .max(100, 'Listing ID too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid listing ID format');

/**
 * Validates MLS connection ID
 */
export const ConnectionIdValidator = z.string()
    .min(1, 'Connection ID is required')
    .max(100, 'Connection ID too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid connection ID format');

/**
 * Validates user ID
 */
export const UserIdValidator = z.string()
    .min(1, 'User ID is required')
    .max(100, 'User ID too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid user ID format');

/**
 * Validates social media platform
 */
export const PlatformValidator = z.enum(['facebook', 'instagram', 'linkedin'], {
    errorMap: () => ({ message: 'Invalid platform. Must be facebook, instagram, or linkedin' }),
});

/**
 * Validates social media post content
 */
export const PostContentValidator = z.object({
    listingId: ListingIdValidator,
    content: z.string()
        .min(1, 'Content is required')
        .max(5000, 'Content too long')
        .transform(sanitizeString),
    platforms: z.array(PlatformValidator)
        .min(1, 'At least one platform is required')
        .max(3, 'Too many platforms selected'),
    hashtags: z.array(
        z.string()
            .max(50, 'Hashtag too long')
            .regex(/^#?[a-zA-Z0-9_]+$/, 'Invalid hashtag format')
    ).max(30, 'Too many hashtags'),
    imageUrls: z.array(
        z.string().url('Invalid image URL')
    ).max(10, 'Too many images'),
});

/**
 * Validates OAuth callback parameters
 */
export const OAuthCallbackValidator = z.object({
    code: z.string()
        .min(1, 'Authorization code is required')
        .max(500, 'Authorization code too long'),
    state: z.string()
        .min(1, 'State parameter is required')
        .max(100, 'State parameter too long')
        .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid state format'),
    error: z.string().optional(),
    error_description: z.string().optional(),
});

/**
 * Validates image optimization parameters
 */
export const ImageOptimizationValidator = z.object({
    imageUrl: z.string().url('Invalid image URL'),
    platform: PlatformValidator,
    width: z.number()
        .int('Width must be an integer')
        .min(100, 'Width too small')
        .max(5000, 'Width too large')
        .optional(),
    height: z.number()
        .int('Height must be an integer')
        .min(100, 'Height too small')
        .max(5000, 'Height too large')
        .optional(),
    quality: z.number()
        .int('Quality must be an integer')
        .min(1, 'Quality too low')
        .max(100, 'Quality too high')
        .optional(),
});

/**
 * Validates hashtag generation parameters
 */
export const HashtagGenerationValidator = z.object({
    listingId: ListingIdValidator,
    platform: PlatformValidator,
    maxHashtags: z.number()
        .int('Max hashtags must be an integer')
        .min(1, 'Must generate at least 1 hashtag')
        .max(30, 'Cannot generate more than 30 hashtags')
        .optional(),
});

/**
 * Validates status sync parameters
 */
export const StatusSyncValidator = z.object({
    connectionId: ConnectionIdValidator,
    listingIds: z.array(ListingIdValidator)
        .min(1, 'At least one listing ID is required')
        .max(100, 'Too many listing IDs'),
});

/**
 * Validates import parameters
 */
export const ImportParametersValidator = z.object({
    connectionId: ConnectionIdValidator,
    maxListings: z.number()
        .int('Max listings must be an integer')
        .min(1, 'Must import at least 1 listing')
        .max(1000, 'Cannot import more than 1000 listings at once')
        .optional(),
});

/**
 * Validates URL to ensure it's HTTPS
 */
export function validateHTTPSUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validates that all external API URLs use HTTPS
 */
export function ensureHTTPSOnly(urls: string[]): { valid: boolean; invalidUrls: string[] } {
    const invalidUrls = urls.filter(url => !validateHTTPSUrl(url));

    return {
        valid: invalidUrls.length === 0,
        invalidUrls,
    };
}

/**
 * Sanitizes HTML content to prevent XSS
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHTML(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/<[^>]+>/g, '') // Remove all HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Validates file upload parameters
 */
export const FileUploadValidator = z.object({
    fileName: z.string()
        .min(1, 'File name is required')
        .max(255, 'File name too long')
        .regex(/^[a-zA-Z0-9-_. ]+$/, 'Invalid file name format'),
    fileSize: z.number()
        .int('File size must be an integer')
        .min(1, 'File size must be positive')
        .max(10 * 1024 * 1024, 'File size exceeds 10MB limit'), // 10MB max
    mimeType: z.string()
        .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image type. Must be JPEG, PNG, GIF, or WebP'),
});

/**
 * Validates pagination parameters
 */
export const PaginationValidator = z.object({
    limit: z.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .optional()
        .default(20),
    offset: z.number()
        .int('Offset must be an integer')
        .min(0, 'Offset must be non-negative')
        .optional()
        .default(0),
});

/**
 * Validates date range parameters
 */
export const DateRangeValidator = z.object({
    startDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
        .optional(),
    endDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
        .optional(),
}).refine(
    data => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    },
    { message: 'Start date must be before or equal to end date' }
);

/**
 * Generic validation wrapper that returns user-friendly error messages
 */
export function validateInput<T>(
    validator: z.ZodSchema<T>,
    input: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
    const result = validator.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format Zod errors into user-friendly format
    const errors: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) {
            errors[path] = [];
        }
        errors[path].push(issue.message);
    }

    return { success: false, errors };
}

/**
 * Validates that a string doesn't contain SQL injection patterns
 */
export function validateNoSQLInjection(input: string): boolean {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(--|;|\/\*|\*\/)/g,
        /(\bOR\b.*=.*)/gi,
        /(\bAND\b.*=.*)/gi,
    ];

    return !sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates that a string doesn't contain NoSQL injection patterns
 */
export function validateNoNoSQLInjection(input: string): boolean {
    const noSqlPatterns = [
        /\$where/gi,
        /\$ne/gi,
        /\$gt/gi,
        /\$lt/gi,
        /\$regex/gi,
    ];

    return !noSqlPatterns.some(pattern => pattern.test(input));
}
