/**
 * Onboarding Security Utilities
 * 
 * Provides security validation and sanitization specifically for onboarding forms.
 * Implements input validation, sanitization, and security checks.
 * 
 * Requirements: 2.2 (Input validation and sanitization)
 */

import {
    sanitizeText,
    sanitizeEmail,
    sanitizePhone,
    sanitizeURL,
} from '@/lib/security/input-sanitization';
import { z } from 'zod';

/**
 * Profile form data interface
 */
export interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    brokerage: string;
    licenseNumber?: string;
    location: {
        city: string;
        state: string;
        zipCode: string;
    };
    specialties: string[];
    yearsExperience?: number;
    website?: string;
}

/**
 * Zod schema for profile validation
 * Validates all required fields and formats
 */
export const profileFormSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

    email: z.string()
        .email('Invalid email format')
        .max(100, 'Email must be less than 100 characters'),

    phone: z.string()
        .regex(/^[\d+\-() ]+$/, 'Invalid phone number format')
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must be less than 20 characters')
        .optional()
        .or(z.literal('')),

    brokerage: z.string()
        .min(1, 'Brokerage name is required')
        .max(100, 'Brokerage name must be less than 100 characters'),

    licenseNumber: z.string()
        .max(50, 'License number must be less than 50 characters')
        .optional()
        .or(z.literal('')),

    location: z.object({
        city: z.string()
            .min(1, 'City is required')
            .max(50, 'City must be less than 50 characters')
            .regex(/^[a-zA-Z\s'-]+$/, 'City contains invalid characters'),

        state: z.string()
            .min(2, 'State is required')
            .max(2, 'State must be 2 characters')
            .regex(/^[A-Z]{2}$/, 'State must be 2 uppercase letters'),

        zipCode: z.string()
            .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
            .min(5, 'ZIP code is required'),
    }),

    specialties: z.array(z.string())
        .min(1, 'At least one specialty is required')
        .max(10, 'Maximum 10 specialties allowed'),

    yearsExperience: z.number()
        .int('Years of experience must be a whole number')
        .min(0, 'Years of experience cannot be negative')
        .max(100, 'Years of experience must be less than 100')
        .optional(),

    website: z.string()
        .url('Invalid website URL')
        .max(200, 'Website URL must be less than 200 characters')
        .optional()
        .or(z.literal('')),
});

/**
 * Sanitize profile form data
 * Removes potentially dangerous content while preserving valid data
 */
export function sanitizeProfileFormData(data: Partial<ProfileFormData>): Partial<ProfileFormData> {
    const sanitized: Partial<ProfileFormData> = {};

    // Sanitize text fields
    if (data.firstName) {
        sanitized.firstName = sanitizeText(data.firstName);
    }
    if (data.lastName) {
        sanitized.lastName = sanitizeText(data.lastName);
    }
    if (data.brokerage) {
        sanitized.brokerage = sanitizeText(data.brokerage);
    }
    if (data.licenseNumber) {
        sanitized.licenseNumber = sanitizeText(data.licenseNumber);
    }

    // Sanitize email
    if (data.email) {
        sanitized.email = sanitizeEmail(data.email);
    }

    // Sanitize phone
    if (data.phone) {
        sanitized.phone = sanitizePhone(data.phone);
    }

    // Sanitize website URL
    if (data.website) {
        sanitized.website = sanitizeURL(data.website);
    }

    // Sanitize location
    if (data.location) {
        sanitized.location = {
            city: sanitizeText(data.location.city),
            state: sanitizeText(data.location.state).toUpperCase(),
            zipCode: sanitizeText(data.location.zipCode),
        };
    }

    // Sanitize specialties array
    if (data.specialties && Array.isArray(data.specialties)) {
        sanitized.specialties = data.specialties
            .map(s => sanitizeText(s))
            .filter(s => s.length > 0);
    }

    // Keep numeric fields as-is (already validated by schema)
    if (data.yearsExperience !== undefined) {
        sanitized.yearsExperience = data.yearsExperience;
    }

    return sanitized;
}

/**
 * Validate and sanitize profile form data
 * Returns validated data or throws validation error
 */
export function validateAndSanitizeProfileForm(
    data: Partial<ProfileFormData>
): { success: true; data: ProfileFormData } | { success: false; errors: Record<string, string[]> } {
    // First sanitize the input
    const sanitized = sanitizeProfileFormData(data);

    // Then validate with schema
    const result = profileFormSchema.safeParse(sanitized);

    if (!result.success) {
        return {
            success: false,
            errors: result.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    return {
        success: true,
        data: result.data as ProfileFormData,
    };
}

/**
 * Validate step ID
 * Ensures step ID is safe and valid
 */
export function validateStepId(stepId: string): { valid: boolean; error?: string } {
    if (!stepId || typeof stepId !== 'string') {
        return { valid: false, error: 'Step ID is required' };
    }

    // Step IDs should be alphanumeric with hyphens only
    const stepIdRegex = /^[a-z0-9-]+$/;
    if (!stepIdRegex.test(stepId)) {
        return { valid: false, error: 'Invalid step ID format' };
    }

    // Reasonable length limit
    if (stepId.length > 50) {
        return { valid: false, error: 'Step ID too long' };
    }

    return { valid: true };
}

/**
 * Validate flow type
 * Ensures flow type is one of the allowed values
 */
export function validateFlowType(flowType: string): { valid: boolean; error?: string } {
    const validFlowTypes = ['user', 'admin', 'both'];

    if (!flowType || typeof flowType !== 'string') {
        return { valid: false, error: 'Flow type is required' };
    }

    if (!validFlowTypes.includes(flowType)) {
        return { valid: false, error: 'Invalid flow type. Must be user, admin, or both' };
    }

    return { valid: true };
}

/**
 * Sanitize metadata object
 * Recursively sanitizes all string values in metadata
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
        // Sanitize key
        const sanitizedKey = sanitizeText(key);

        if (typeof value === 'string') {
            sanitized[sanitizedKey] = sanitizeText(value);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            sanitized[sanitizedKey] = value;
        } else if (Array.isArray(value)) {
            sanitized[sanitizedKey] = value.map(item =>
                typeof item === 'string' ? sanitizeText(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[sanitizedKey] = sanitizeMetadata(value);
        }
    }

    return sanitized;
}

/**
 * Check for suspicious patterns in input
 * Detects potential injection attempts
 */
export function detectSuspiciousPatterns(input: string): { suspicious: boolean; reason?: string } {
    if (!input || typeof input !== 'string') {
        return { suspicious: false };
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
        /(\bOR\b|\bAND\b).*=.*=/i,
        /UNION.*SELECT/i,
        /DROP.*TABLE/i,
        /INSERT.*INTO/i,
        /DELETE.*FROM/i,
    ];

    for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
            return { suspicious: true, reason: 'Potential SQL injection detected' };
        }
    }

    // Check for XSS patterns
    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror=/i,
        /onclick=/i,
        /<iframe/i,
    ];

    for (const pattern of xssPatterns) {
        if (pattern.test(input)) {
            return { suspicious: true, reason: 'Potential XSS attack detected' };
        }
    }

    // Check for path traversal
    if (input.includes('../') || input.includes('..\\')) {
        return { suspicious: true, reason: 'Path traversal attempt detected' };
    }

    return { suspicious: false };
}

/**
 * Validate all form inputs for suspicious patterns
 */
export function validateFormSecurity(data: Record<string, any>): { safe: boolean; issues: string[] } {
    const issues: string[] = [];

    function checkValue(value: any, path: string): void {
        if (typeof value === 'string') {
            const check = detectSuspiciousPatterns(value);
            if (check.suspicious) {
                issues.push(`${path}: ${check.reason}`);
            }
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
        } else if (typeof value === 'object' && value !== null) {
            for (const [key, val] of Object.entries(value)) {
                checkValue(val, `${path}.${key}`);
            }
        }
    }

    for (const [key, value] of Object.entries(data)) {
        checkValue(value, key);
    }

    return {
        safe: issues.length === 0,
        issues,
    };
}
