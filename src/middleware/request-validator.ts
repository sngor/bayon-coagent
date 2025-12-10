/**
 * Request Validator
 * 
 * Validates incoming requests for security and data integrity
 */

import { NextRequest } from 'next/server';
import { createFatalError } from './error-handler';

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Request size limits
 */
const REQUEST_LIMITS = {
    MAX_URL_LENGTH: 2048,
    MAX_HEADER_SIZE: 8192,
    MAX_COOKIE_SIZE: 4096,
} as const;

/**
 * Suspicious patterns in URLs
 */
const SUSPICIOUS_PATTERNS = [
    /\.\./,                    // Path traversal
    /<script/i,                // XSS attempts
    /javascript:/i,            // JavaScript protocol
    /data:/i,                  // Data URLs
    /vbscript:/i,             // VBScript
    /on\w+=/i,                // Event handlers
    /eval\(/i,                // Code execution
    /expression\(/i,          // CSS expressions
] as const;

/**
 * Validate request URL
 */
function validateURL(request: NextRequest): ValidationResult {
    const errors: string[] = [];
    const url = request.nextUrl;

    // Check URL length
    if (url.href.length > REQUEST_LIMITS.MAX_URL_LENGTH) {
        errors.push('URL too long');
    }

    // Check for suspicious patterns
    const fullUrl = url.href.toLowerCase();
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(fullUrl)) {
            errors.push('Suspicious URL pattern detected');
            break;
        }
    }

    // Validate pathname
    if (url.pathname.includes('//')) {
        errors.push('Invalid pathname format');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate request headers
 */
function validateHeaders(request: NextRequest): ValidationResult {
    const errors: string[] = [];

    // Check total header size
    let totalHeaderSize = 0;
    request.headers.forEach((value, key) => {
        totalHeaderSize += key.length + value.length;
    });

    if (totalHeaderSize > REQUEST_LIMITS.MAX_HEADER_SIZE) {
        errors.push('Headers too large');
    }

    // Validate specific headers
    const userAgent = request.headers.get('user-agent');
    if (userAgent && userAgent.length > 512) {
        errors.push('User-Agent header too long');
    }

    const referer = request.headers.get('referer');
    if (referer) {
        try {
            new URL(referer);
        } catch {
            errors.push('Invalid Referer header');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate request cookies
 */
function validateCookies(request: NextRequest): ValidationResult {
    const errors: string[] = [];

    // Check total cookie size
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader && cookieHeader.length > REQUEST_LIMITS.MAX_COOKIE_SIZE) {
        errors.push('Cookies too large');
    }

    // Validate individual cookies
    request.cookies.getAll().forEach(cookie => {
        if (cookie.name.length > 256 || cookie.value.length > 4096) {
            errors.push(`Cookie ${cookie.name} too large`);
        }

        // Check for suspicious cookie values
        for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.test(cookie.value)) {
                errors.push(`Suspicious cookie value in ${cookie.name}`);
                break;
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate request method
 */
function validateMethod(request: NextRequest): ValidationResult {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

    if (!allowedMethods.includes(request.method)) {
        return {
            valid: false,
            errors: [`Invalid HTTP method: ${request.method}`],
        };
    }

    return { valid: true, errors: [] };
}

/**
 * Comprehensive request validation
 */
export function validateRequest(request: NextRequest): ValidationResult {
    const validations = [
        validateURL(request),
        validateHeaders(request),
        validateCookies(request),
        validateMethod(request),
    ];

    const allErrors = validations.flatMap(v => v.errors);

    return {
        valid: allErrors.length === 0,
        errors: allErrors,
    };
}

/**
 * Middleware wrapper for request validation
 */
export function withRequestValidation<T extends any[], R>(
    handler: (...args: T) => Promise<R>
) {
    return async (...args: T): Promise<R> => {
        const request = args[0] as NextRequest;

        const validation = validateRequest(request);

        if (!validation.valid) {
            throw createFatalError(
                `Request validation failed: ${validation.errors.join(', ')}`,
                'INVALID_REQUEST',
                400
            );
        }

        return handler(...args);
    };
}