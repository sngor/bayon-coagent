/**
 * Secure Server Action Wrapper
 * 
 * Provides a wrapper for Next.js server actions that includes:
 * - CSRF protection
 * - Input sanitization
 * - Rate limiting
 * - Error handling
 * 
 * Requirements: 10.1, 10.2, 10.3 (Security)
 */

import { validateCSRFToken, getCSRFCookie } from './csrf-protection';
import {
    sanitizeText,
    sanitizeEmail,
    sanitizePhone,
    sanitizeHTML,
    sanitizeURL,
    sanitizeObject,
} from './input-sanitization';
import { rateLimiters, getIdentifier } from './rate-limiter';

export interface SecureActionOptions {
    requireCSRF?: boolean;
    rateLimit?: 'auth' | 'api' | 'contactForm' | 'upload' | 'dashboard';
    sanitize?: boolean;
}

export interface SecureActionContext {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Wrapper for server actions that adds security measures
 */
export function secureAction<T extends (...args: any[]) => Promise<any>>(
    action: T,
    options: SecureActionOptions = {}
): T {
    const {
        requireCSRF = true,
        rateLimit,
        sanitize = true,
    } = options;

    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            // Extract FormData if present (for server actions)
            const formData = args.find(arg => arg instanceof FormData) as FormData | undefined;

            // CSRF Protection
            if (requireCSRF && formData) {
                const csrfToken = formData.get('csrf_token') as string;
                const isValid = await validateCSRFToken(csrfToken);

                if (!isValid) {
                    return {
                        message: 'CSRF validation failed',
                        data: null,
                        errors: { csrf: ['Invalid or missing CSRF token'] },
                    } as ReturnType<T>;
                }
            }

            // Rate Limiting
            if (rateLimit && typeof window === 'undefined') {
                // Only apply rate limiting on server side
                const limiter = rateLimiters[rateLimit];
                if (limiter) {
                    // Create a mock request object for rate limiting
                    // In a real implementation, you'd pass the actual request
                    const mockRequest = new Request('http://localhost', {
                        headers: new Headers(),
                    });

                    const result = limiter.check(getIdentifier(mockRequest));

                    if (!result.allowed) {
                        return {
                            message: 'Rate limit exceeded',
                            data: null,
                            errors: { rateLimit: ['Too many requests. Please try again later.'] },
                        } as ReturnType<T>;
                    }
                }
            }

            // Input Sanitization
            if (sanitize && formData) {
                // Sanitize common fields
                const fieldsToSanitize = [
                    'name', 'clientName', 'firstName', 'lastName',
                    'message', 'notes', 'description', 'welcomeMessage',
                    'agentNotes', 'propertyInterests',
                ];

                for (const field of fieldsToSanitize) {
                    const value = formData.get(field);
                    if (value && typeof value === 'string') {
                        formData.set(field, sanitizeText(value));
                    }
                }

                // Sanitize email fields
                const emailFields = ['email', 'clientEmail', 'agentEmail'];
                for (const field of emailFields) {
                    const value = formData.get(field);
                    if (value && typeof value === 'string') {
                        formData.set(field, sanitizeEmail(value));
                    }
                }

                // Sanitize phone fields
                const phoneFields = ['phone', 'clientPhone', 'agentPhone'];
                for (const field of phoneFields) {
                    const value = formData.get(field);
                    if (value && typeof value === 'string') {
                        formData.set(field, sanitizePhone(value));
                    }
                }

                // Sanitize URL fields
                const urlFields = ['logoUrl', 'website'];
                for (const field of urlFields) {
                    const value = formData.get(field);
                    if (value && typeof value === 'string') {
                        formData.set(field, sanitizeURL(value));
                    }
                }
            }

            // Execute the action
            return await action(...args);
        } catch (error) {
            console.error('Secure action error:', error);
            return {
                message: 'An error occurred',
                data: null,
                errors: { server: ['An unexpected error occurred'] },
            } as ReturnType<T>;
        }
    }) as T;
}

/**
 * Sanitize an object's string properties
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Determine sanitization method based on field name
            if (key.toLowerCase().includes('email')) {
                sanitized[key] = sanitizeEmail(value);
            } else if (key.toLowerCase().includes('phone')) {
                sanitized[key] = sanitizePhone(value);
            } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
                sanitized[key] = sanitizeURL(value);
            } else if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
                sanitized[key] = sanitizeHTML(value);
            } else {
                sanitized[key] = sanitizeText(value);
            }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeFormData(value);
        } else {
            // Keep other types as-is
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Validate and sanitize contact form data
 */
export function sanitizeContactFormData(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
}): {
    name: string;
    email: string;
    phone?: string;
    message: string;
} {
    return {
        name: sanitizeText(data.name),
        email: sanitizeEmail(data.email),
        phone: data.phone ? sanitizePhone(data.phone) : undefined,
        message: sanitizeText(data.message),
    };
}

/**
 * Validate and sanitize dashboard data
 */
export function sanitizeDashboardData(data: {
    clientInfo: {
        name: string;
        email: string;
        phone?: string;
        propertyInterests?: string;
        notes?: string;
    };
    branding: {
        logoUrl?: string;
        primaryColor: string;
        welcomeMessage: string;
        agentContact: {
            phone: string;
            email: string;
        };
    };
}): typeof data {
    return {
        clientInfo: {
            name: sanitizeText(data.clientInfo.name),
            email: sanitizeEmail(data.clientInfo.email),
            phone: data.clientInfo.phone ? sanitizePhone(data.clientInfo.phone) : undefined,
            propertyInterests: data.clientInfo.propertyInterests
                ? sanitizeText(data.clientInfo.propertyInterests)
                : undefined,
            notes: data.clientInfo.notes ? sanitizeText(data.clientInfo.notes) : undefined,
        },
        branding: {
            logoUrl: data.branding.logoUrl ? sanitizeURL(data.branding.logoUrl) : undefined,
            primaryColor: data.branding.primaryColor,
            welcomeMessage: sanitizeText(data.branding.welcomeMessage),
            agentContact: {
                phone: sanitizePhone(data.branding.agentContact.phone),
                email: sanitizeEmail(data.branding.agentContact.email),
            },
        },
    };
}
