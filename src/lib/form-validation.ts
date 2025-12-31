/**
 * Enhanced Form Validation Utilities
 * 
 * Provides type-safe form validation with Zod schemas, CSRF protection,
 * and comprehensive error handling for server actions.
 */

import { z } from 'zod';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: ValidationError;
}

export interface ValidationError {
  message: string;
  field?: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface FormValidationOptions {
  requireCSRF?: boolean;
  sanitizeInput?: boolean;
  maxFileSize?: number; // bytes
  allowedFileTypes?: string[];
}

// ============================================================================
// CSRF Protection
// ============================================================================

/**
 * Generate CSRF token for forms
 */
export function generateCSRFToken(): string {
  if (typeof window === 'undefined') {
    // Server-side: use crypto
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Client-side: use Web Crypto API or fallback
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for older browsers
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  return token === expectedToken;
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object with string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    }
  }
  
  return sanitized;
}

// ============================================================================
// Type-Safe FormData Conversion
// ============================================================================

/**
 * Convert FormData to typed object with validation
 */
export function formDataToObject<T>(
  formData: FormData,
  schema: z.ZodSchema<T>,
  options: FormValidationOptions = {}
): ValidationResult<T> {
  try {
    // Convert FormData to plain object
    const obj: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Handle file uploads
        if (options.maxFileSize && value.size > options.maxFileSize) {
          return {
            success: false,
            error: {
              message: `File size exceeds maximum allowed size of ${options.maxFileSize} bytes`,
              field: key,
              code: 'FILE_TOO_LARGE',
            },
          };
        }
        
        if (options.allowedFileTypes && !options.allowedFileTypes.includes(value.type)) {
          return {
            success: false,
            error: {
              message: `File type ${value.type} is not allowed`,
              field: key,
              code: 'INVALID_FILE_TYPE',
            },
          };
        }
        
        obj[key] = value;
      } else {
        // Handle regular form fields
        const stringValue = value.toString();
        
        // Handle multiple values for same key (checkboxes, multi-select)
        if (obj[key]) {
          if (Array.isArray(obj[key])) {
            obj[key].push(stringValue);
          } else {
            obj[key] = [obj[key], stringValue];
          }
        } else {
          obj[key] = stringValue;
        }
      }
    }
    
    // CSRF validation
    if (options.requireCSRF) {
      const csrfToken = obj._csrf;
      const expectedToken = obj._expectedCSRF;
      
      if (!validateCSRFToken(csrfToken, expectedToken)) {
        return {
          success: false,
          error: {
            message: 'Invalid CSRF token',
            code: 'CSRF_INVALID',
          },
        };
      }
      
      // Remove CSRF tokens from data
      delete obj._csrf;
      delete obj._expectedCSRF;
    }
    
    // Sanitize input if requested
    const processedObj = options.sanitizeInput ? sanitizeObject(obj) : obj;
    
    // Validate with Zod schema
    const result = schema.safeParse(processedObj);
    
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      
      result.error.issues.forEach(issue => {
        const field = issue.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      });
      
      return {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: fieldErrors,
        },
      };
    }
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown validation error',
        code: 'VALIDATION_EXCEPTION',
      },
    };
  }
}

// ============================================================================
// Common Validation Schemas
// ============================================================================

export const CommonSchemas = {
  email: z.string().email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
  
  url: z.string().url('Please enter a valid URL'),
  
  nonEmptyString: z.string().min(1, 'This field is required').trim(),
  
  positiveNumber: z.number().positive('Must be a positive number'),
  
  file: z.instanceof(File, 'Please select a file'),
  
  optionalFile: z.instanceof(File).optional(),
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Create a validation error response for server actions
 */
export function createValidationErrorResponse(
  error: ValidationError,
  previousData?: any
) {
  return {
    success: false,
    message: error.message,
    errors: error.details || { [error.field || 'general']: [error.message] },
    data: previousData || null,
  };
}

/**
 * Create a success response for server actions
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    message: message || 'Operation completed successfully',
    data,
    errors: {},
  };
}

/**
 * Create an error response for server actions
 */
export function createErrorResponse(
  message: string,
  errors: Record<string, string[]> = {},
  previousData?: any
) {
  return {
    success: false,
    message,
    errors,
    data: previousData || null,
  };
}

/**
 * Validate form data with enhanced error handling
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData,
  options: FormValidationOptions = {}
): ValidationResult<T> {
  return formDataToObject(formData, schema, {
    requireCSRF: true,
    sanitizeInput: true,
    ...options,
  });
}