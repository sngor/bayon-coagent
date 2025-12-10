/**
 * Research Input Validation
 * 
 * Comprehensive validation for research inputs with security checks
 */

import { z } from 'zod';

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
    /\b(eval|exec|system|shell|cmd)\s*\(/i,
    /\b(import|require|__import__)\s*\(/i,
    /<script[^>]*>/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload|onerror|onclick/i,
];

// Spam/abuse patterns
const SPAM_PATTERNS = [
    /(.)\1{10,}/, // Repeated characters
    /\b(buy now|click here|free money|make money fast)\b/i,
    /\b(viagra|cialis|pharmacy|casino|poker)\b/i,
];

/**
 * Validation result interface for better type safety
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    sanitized: string;
    warnings?: string[];
    metadata?: {
        hasRealEstateContext: boolean;
        estimatedComplexity: 'low' | 'medium' | 'high';
        suggestedImprovements?: string[];
    };
}

/**
 * Validate research topic for security and quality
 * 
 * @param topic - The research topic to validate
 * @returns ValidationResult with detailed feedback
 */
export function validateResearchTopic(topic: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitized = topic.trim();

    // Basic length checks
    if (sanitized.length === 0) {
        errors.push('Research topic cannot be empty');
        return { isValid: false, errors, sanitized };
    }

    if (sanitized.length < 10) {
        errors.push('Research topic must be at least 10 characters for meaningful results');
    }

    if (sanitized.length > 500) {
        errors.push('Research topic is too long (maximum 500 characters)');
        sanitized = sanitized.substring(0, 500);
    }

    // Security checks
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(sanitized)) {
            errors.push('Research topic contains potentially dangerous content');
            break;
        }
    }

    // Spam checks
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(sanitized)) {
            errors.push('Research topic appears to be spam or promotional content');
            break;
        }
    }

    // Real estate relevance check with enhanced keywords
    const realEstateKeywords = [
        'real estate', 'property', 'home', 'house', 'apartment', 'condo', 'market',
        'listing', 'buyer', 'seller', 'agent', 'broker', 'mortgage', 'loan',
        'investment', 'rental', 'commercial', 'residential', 'neighborhood',
        'location', 'price', 'value', 'appraisal', 'inspection', 'closing',
        'mls', 'zillow', 'realtor', 'realty', 'development', 'construction',
        'renovation', 'staging', 'marketing', 'lead', 'client', 'commission',
        'foreclosure', 'equity', 'refinance', 'escrow', 'title', 'deed'
    ];

    const hasRealEstateContext = realEstateKeywords.some(keyword =>
        sanitized.toLowerCase().includes(keyword)
    );

    if (!hasRealEstateContext) {
        warnings.push('Topic may not be real estate related - consider adding real estate context for better results');
    }

    // Estimate complexity based on topic length and keywords
    const estimatedComplexity: 'low' | 'medium' | 'high' =
        sanitized.length < 50 ? 'low' :
            sanitized.length < 150 ? 'medium' : 'high';

    // Generate improvement suggestions
    const suggestedImprovements: string[] = [];
    if (sanitized.length < 30) {
        suggestedImprovements.push('Consider providing more specific details for better research results');
    }
    if (!hasRealEstateContext) {
        suggestedImprovements.push('Add location or property type context for more targeted insights');
    }

    // HTML/XSS sanitization
    sanitized = sanitized
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&[^;]+;/g, '') // Remove HTML entities
        .replace(/[<>'"]/g, ''); // Remove dangerous characters

    return {
        isValid: errors.length === 0,
        errors,
        sanitized,
        warnings: warnings.length > 0 ? warnings : undefined,
        metadata: {
            hasRealEstateContext,
            estimatedComplexity,
            suggestedImprovements: suggestedImprovements.length > 0 ? suggestedImprovements : undefined,
        },
    };
}

/**
 * Enhanced research input schema with validation
 */
export const SecureResearchInputSchema = z.object({
    topic: z.string()
        .min(1, 'Research topic is required')
        .max(500, 'Research topic is too long')
        .refine((topic) => {
            const validation = validateResearchTopic(topic);
            return validation.isValid;
        }, {
            message: 'Research topic contains invalid or dangerous content',
        })
        .transform((topic) => {
            const validation = validateResearchTopic(topic);
            return validation.sanitized;
        }),

    searchDepth: z.enum(['basic', 'advanced'])
        .default('advanced'),

    includeMarketAnalysis: z.boolean()
        .default(true),

    saveToLibrary: z.boolean()
        .default(true),

    // Optional metadata for tracking
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    sessionId: z.string().optional(),
});

/**
 * Rate limiting validation
 */
export class ResearchRateLimiter {
    private requests = new Map<string, number[]>();
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    /**
     * Check if user is within rate limits
     */
    checkRateLimit(userId: string): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
    } {
        const now = Date.now();
        const userRequests = this.requests.get(userId) || [];

        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < this.windowMs);

        const allowed = validRequests.length < this.maxRequests;
        const remaining = Math.max(0, this.maxRequests - validRequests.length);
        const resetTime = validRequests.length > 0
            ? validRequests[0] + this.windowMs
            : now + this.windowMs;

        if (allowed) {
            validRequests.push(now);
            this.requests.set(userId, validRequests);
        }

        return { allowed, remaining, resetTime };
    }

    /**
     * Clear rate limit for user (admin function)
     */
    clearRateLimit(userId: string): void {
        this.requests.delete(userId);
    }
}

// Export singleton rate limiter
export const researchRateLimiter = new ResearchRateLimiter();

/**
 * Content filtering for research results
 */
export function filterResearchContent(content: string): {
    filtered: string;
    warnings: string[];
} {
    const warnings: string[] = [];
    let filtered = content;

    // Remove potential PII patterns
    const piiPatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
        /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    ];

    for (const pattern of piiPatterns) {
        if (pattern.test(filtered)) {
            filtered = filtered.replace(pattern, '[REDACTED]');
            warnings.push('Potential personal information was redacted from the results');
        }
    }

    // Check for inappropriate content
    const inappropriatePatterns = [
        /\b(hate|violence|discrimination)\b/i,
        /\b(illegal|fraud|scam)\b/i,
    ];

    for (const pattern of inappropriatePatterns) {
        if (pattern.test(filtered)) {
            warnings.push('Content may contain inappropriate material');
            break;
        }
    }

    return { filtered, warnings };
}