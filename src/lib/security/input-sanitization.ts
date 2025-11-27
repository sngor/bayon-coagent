/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user inputs and prevent injection attacks.
 * All user inputs should be sanitized before processing or storing.
 * 
 * Requirements: 10.1, 10.2 (Data Security and Input Validation)
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Remove object and embed tags
    sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

    return sanitized.trim();
}

/**
 * Sanitize text input
 * Removes control characters and normalizes whitespace
 */
export function sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove control characters (except newlines and tabs)
    // \x00-\x08: NULL to BACKSPACE
    // \x0B: VERTICAL TAB
    // \x0C: FORM FEED
    // \x0E-\x1F: SHIFT OUT to UNIT SEPARATOR
    // \x7F: DELETE
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize whitespace (convert multiple spaces, newlines, tabs to single space)
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized.trim();
}

/**
 * Sanitize email address
 * Validates and normalizes email format
 */
export function sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Convert to lowercase and trim
    let sanitized = input.toLowerCase().trim();

    // Remove any characters that aren't valid in email addresses
    sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');

    // Basic email validation
    const emailRegex = /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
        return '';
    }

    return sanitized;
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except + and -
 */
export function sanitizePhone(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Keep only digits, +, -, (, ), and spaces
    let sanitized = input.replace(/[^\d+\-() ]/g, '');

    return sanitized.trim();
}

/**
 * Sanitize URL
 * Validates and normalizes URL format, prevents javascript: and data: protocols
 */
export function sanitizeURL(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    const trimmed = input.trim();

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerInput = trimmed.toLowerCase();

    for (const protocol of dangerousProtocols) {
        if (lowerInput.startsWith(protocol)) {
            return '';
        }
    }

    // Only allow http, https, and mailto protocols
    try {
        const url = new URL(trimmed);
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
            return '';
        }
        return url.toString();
    } catch {
        // If URL parsing fails, check if it's a relative URL
        if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
            return trimmed;
        }
        return '';
    }
}

/**
 * Sanitize file name
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFileName(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove path traversal attempts
    let sanitized = input.replace(/\.\./g, '');
    sanitized = sanitized.replace(/[\/\\]/g, '');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '');

    return sanitized.trim();
}

/**
 * Sanitize SQL input (for use with parameterized queries)
 * Note: This should be used in addition to parameterized queries, not as a replacement
 */
export function sanitizeSQL(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove SQL comment markers
    let sanitized = input.replace(/--/g, '');
    sanitized = sanitized.replace(/\/\*/g, '');
    sanitized = sanitized.replace(/\*\//g, '');

    // Remove semicolons (statement terminators)
    sanitized = sanitized.replace(/;/g, '');

    return sanitized.trim();
}

/**
 * Sanitize JSON input
 * Validates and parses JSON, returns null if invalid
 */
export function sanitizeJSON<T = any>(input: string): T | null {
    if (!input || typeof input !== 'string') {
        return null;
    }

    try {
        const parsed = JSON.parse(input);
        return parsed as T;
    } catch {
        return null;
    }
}

/**
 * Sanitize number input
 * Ensures input is a valid number within optional bounds
 */
export function sanitizeNumber(
    input: string | number,
    options?: {
        min?: number;
        max?: number;
        integer?: boolean;
    }
): number | null {
    const num = typeof input === 'string' ? parseFloat(input) : input;

    if (isNaN(num) || !isFinite(num)) {
        return null;
    }

    // Check bounds
    if (options?.min !== undefined && num < options.min) {
        return null;
    }
    if (options?.max !== undefined && num > options.max) {
        return null;
    }

    // Check if integer required
    if (options?.integer && !Number.isInteger(num)) {
        return null;
    }

    return num;
}

/**
 * Sanitize color hex code
 * Validates and normalizes hex color format
 */
export function sanitizeHexColor(input: string): string {
    if (!input || typeof input !== 'string') {
        return '#000000';
    }

    // Remove any whitespace
    let sanitized = input.trim();

    // Add # if missing
    if (!sanitized.startsWith('#')) {
        sanitized = '#' + sanitized;
    }

    // Validate hex format
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(sanitized)) {
        return '#000000';
    }

    return sanitized.toUpperCase();
}

/**
 * Sanitize object by applying sanitization functions to all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
    obj: T,
    sanitizers: Partial<Record<keyof T, (value: any) => any>>
): T {
    const sanitized = { ...obj };

    for (const key in sanitizers) {
        if (key in sanitized) {
            const sanitizer = sanitizers[key];
            if (sanitizer) {
                sanitized[key] = sanitizer(sanitized[key]);
            }
        }
    }

    return sanitized;
}

/**
 * Escape special characters for use in regular expressions
 */
export function escapeRegExp(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and sanitize dashboard token
 * Tokens should be alphanumeric only (32 characters from UUID without hyphens)
 */
export function sanitizeDashboardToken(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove any non-alphanumeric characters
    const sanitized = input.replace(/[^a-zA-Z0-9]/g, '');

    // Tokens should be 32 characters (UUID v4 without hyphens)
    // But we'll accept any length for flexibility, just ensure alphanumeric
    if (sanitized.length === 0) {
        return '';
    }

    return sanitized;
}

/**
 * Sanitize search query
 * Removes special characters that could be used for injection
 */
export function sanitizeSearchQuery(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove special characters but keep spaces, letters, numbers, and basic punctuation
    let sanitized = input.replace(/[^\w\s.,'-]/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Limit length to prevent DoS
    if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 200);
    }

    return sanitized.trim();
}
