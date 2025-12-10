/**
 * Comprehensive type definitions for research services
 * Provides type safety across all research-related operations
 */

import { z } from 'zod';

// Base research types
export interface ResearchMetadata {
    userId: string;
    requestId: string;
    timestamp: string;
    source: ResearchSource;
    duration?: number;
    cacheHit?: boolean;
}

export type ResearchSource =
    | 'strands-python'
    | 'strands-typescript'
    | 'enhanced-research-agent'
    | 'bedrock-agent'
    | 'bedrock-fallback'
    | 'cache';

export type SearchDepth = 'basic' | 'advanced';
export type TargetAudience = 'agents' | 'buyers' | 'sellers' | 'investors';

// Research input/output interfaces
export interface ResearchInput {
    topic: string;
    userId: string;
    searchDepth: SearchDepth;
    includeMarketAnalysis: boolean;
    includeRecommendations: boolean;
    targetAudience: TargetAudience;
    saveToLibrary?: boolean;
}

export interface MarketAnalysis {
    currentConditions: string;
    trends: string[];
    opportunities: string[];
    risks?: string[];
    outlook?: {
        shortTerm: string;
        longTerm: string;
    };
}

export interface ResearchOutput {
    success: boolean;
    report?: string;
    citations?: string[];
    keyFindings?: string[];
    recommendations?: string[];
    marketAnalysis?: MarketAnalysis;
    topic?: string;
    timestamp?: string;
    userId?: string;
    source?: ResearchSource;
    error?: string;
    metadata?: ResearchMetadata;
}

// Service health types
export interface ServiceHealth {
    healthy: boolean;
    message: string;
    details?: {
        lastCheck?: string;
        responseTime?: number;
        errorCount?: number;
        version?: string;
    };
}

// Performance metrics
export interface PerformanceMetrics {
    requestId: string;
    userId: string;
    topic: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success: boolean;
    source: ResearchSource;
    error?: string;
    cacheHit?: boolean;
    reportLength?: number;
    citationCount?: number;
}

// Cache types
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
    metadata?: {
        source: ResearchSource;
        userId: string;
    };
}

export interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
    averageAccessCount: number;
    oldestEntry?: number;
    newestEntry?: number;
}

// Validation types
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
    sanitized: string;
    metadata?: {
        hasRealEstateContext: boolean;
        estimatedComplexity: 'low' | 'medium' | 'high';
        suggestedImprovements?: string[];
        topicCategories?: string[];
    };
}

// Rate limiting types
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    windowMs: number;
}

// Research history types
export interface ResearchHistoryItem {
    id: string;
    title: string;
    topic: string;
    createdAt: string;
    source: ResearchSource;
    success: boolean;
    reportLength?: number;
    citationCount?: number;
    tags?: string[];
}

// Service configuration types
export interface ResearchServiceConfig {
    name: string;
    enabled: boolean;
    priority: number;
    timeout: number;
    retryAttempts: number;
    healthCheckInterval: number;
    cacheEnabled: boolean;
    cacheTtl: number;
}

// Error types specific to research
export class ResearchError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly source: ResearchSource,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'ResearchError';
    }
}

export class ResearchValidationError extends ResearchError {
    constructor(message: string, validationErrors: string[], source: ResearchSource) {
        super(message, 'validation_error', source, { validationErrors });
        this.name = 'ResearchValidationError';
    }
}

export class ResearchTimeoutError extends ResearchError {
    constructor(timeout: number, source: ResearchSource) {
        super(`Research request timed out after ${timeout}ms`, 'timeout', source, { timeout });
        this.name = 'ResearchTimeoutError';
    }
}

// Zod schemas for runtime validation
export const ResearchInputSchema = z.object({
    topic: z.string().min(1, 'Research topic is required').max(500, 'Topic too long'),
    userId: z.string().min(1, 'User ID is required'),
    searchDepth: z.enum(['basic', 'advanced']).default('advanced'),
    includeMarketAnalysis: z.boolean().default(true),
    includeRecommendations: z.boolean().default(true),
    targetAudience: z.enum(['agents', 'buyers', 'sellers', 'investors']).default('agents'),
    saveToLibrary: z.boolean().default(true),
});

export const ResearchOutputSchema = z.object({
    success: z.boolean(),
    report: z.string().optional(),
    citations: z.array(z.string()).optional(),
    keyFindings: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    marketAnalysis: z.object({
        currentConditions: z.string(),
        trends: z.array(z.string()),
        opportunities: z.array(z.string()),
        risks: z.array(z.string()).optional(),
        outlook: z.object({
            shortTerm: z.string(),
            longTerm: z.string(),
        }).optional(),
    }).optional(),
    topic: z.string().optional(),
    timestamp: z.string().optional(),
    userId: z.string().optional(),
    source: z.string().optional(),
    error: z.string().optional(),
});

// Type guards
export function isResearchError(error: any): error is ResearchError {
    return error instanceof ResearchError;
}

export function isValidResearchInput(input: any): input is ResearchInput {
    return ResearchInputSchema.safeParse(input).success;
}

export function isValidResearchOutput(output: any): output is ResearchOutput {
    return ResearchOutputSchema.safeParse(output).success;
}