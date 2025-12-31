/**
 * Security Utilities
 * 
 * Provides comprehensive security utilities including input sanitization,
 * CSRF protection, rate limiting, and security headers for the platform.
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:/gi, '') // Remove data: protocol (can be dangerous)
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onload, etc.)
    .replace(/<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|select|option|button)\b[^>]*>/gi, ''); // Remove dangerous tags
}

/**
 * Sanitize user input for database storage
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove potential HTML brackets
    .substring(0, 10000); // Limit length to prevent DoS
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize phone numbers
 */
export function sanitizePhoneNumber(phone: string): string {
  const sanitized = phone.replace(/[^\d+\-\s\(\)]/g, '');
  const digitsOnly = sanitized.replace(/\D/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    throw new Error('Invalid phone number format');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

// ============================================================================
// CSRF Protection
// ============================================================================

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Server-side fallback
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token with timing-safe comparison
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false;
  }
  
  // Timing-safe comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * CSRF middleware for API routes
 */
export function withCSRFProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return handler(req);
    }
    
    const token = req.headers.get('x-csrf-token');
    const sessionToken = req.cookies.get('csrf-token')?.value;
    
    if (!token || !sessionToken || !validateCSRFToken(token, sessionToken)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(req);
  };
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  async isAllowed(req: NextRequest): Promise<{ allowed: boolean; resetTime?: number }> {
    const key = this.config.keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);
    
    const record = this.requests.get(key);
    
    if (!record) {
      // First request from this key
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return { allowed: true };
    }
    
    if (now > record.resetTime) {
      // Window has expired, reset
      record.count = 1;
      record.resetTime = now + this.config.windowMs;
      return { allowed: true };
    }
    
    if (record.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return { allowed: false, resetTime: record.resetTime };
    }
    
    // Increment counter
    record.count++;
    return { allowed: true };
  }

  private cleanup(now: number): void {
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return req.ip || 'unknown';
  }
}

/**
 * Create rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);
  
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const result = await limiter.isAllowed(req);
    
    if (!result.allowed) {
      const retryAfter = result.resetTime ? Math.ceil((result.resetTime - Date.now()) / 1000) : 60;
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime?.toString() || '',
          },
        }
      );
    }
    
    return null; // Allow request to proceed
  };
}

// ============================================================================
// Security Headers
// ============================================================================

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const defaultCSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://*.amazonaws.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  const headers = {
    'Content-Security-Policy': config.contentSecurityPolicy || defaultCSP,
    'Strict-Transport-Security': config.strictTransportSecurity || 'max-age=31536000; includeSubDomains',
    'X-Frame-Options': config.xFrameOptions || 'DENY',
    'X-Content-Type-Options': config.xContentTypeOptions || 'nosniff',
    'Referrer-Policy': config.referrerPolicy || 'strict-origin-when-cross-origin',
    'Permissions-Policy': config.permissionsPolicy || 'camera=(), microphone=(), geolocation=()',
    'X-XSS-Protection': '1; mode=block',
  };

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ============================================================================
// Password Security
// ============================================================================

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain numbers');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain special characters');
  }

  // Common password check
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('Password is too common');
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }

  return {
    isValid: score >= 4 && feedback.length === 0,
    score: Math.max(0, Math.min(6, score)),
    feedback,
  };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// ============================================================================
// Data Validation Schemas
// ============================================================================

export const SecuritySchemas = {
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .transform(sanitizeEmail),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .refine((password) => {
      const validation = validatePasswordStrength(password);
      return validation.isValid;
    }, 'Password does not meet security requirements'),
    
  phoneNumber: z.string()
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long')
    .transform(sanitizePhoneNumber),
    
  url: z.string()
    .url('Invalid URL format')
    .max(2048, 'URL too long')
    .transform(sanitizeUrl),
    
  safeString: z.string()
    .max(10000, 'Input too long')
    .transform(sanitizeInput),
    
  htmlContent: z.string()
    .max(50000, 'Content too long')
    .transform(sanitizeHtml),
};

// ============================================================================
// Audit Logging
// ============================================================================

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  timestamp: number;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
}

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  
  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };
    
    this.logs.push(logEntry);
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    } else {
      console.log('Audit Log:', logEntry);
    }
  }
  
  private sendToLoggingService(entry: AuditLogEntry): void {
    // Implementation would send to CloudWatch, Datadog, etc.
    // For now, just log to console in production
    console.log('Audit Log:', JSON.stringify(entry));
  }
  
  getLogs(userId?: string): AuditLogEntry[] {
    if (userId) {
      return this.logs.filter(log => log.userId === userId);
    }
    return [...this.logs];
  }
  
  clearLogs(): void {
    this.logs = [];
  }
}

export const auditLogger = new AuditLogger();