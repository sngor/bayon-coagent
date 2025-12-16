/**
 * Common Types
 * Shared type definitions used across the application
 */

// Common response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// User types
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'super-admin';
    createdAt: string;
    updatedAt: string;
}

// Testimonial types
export interface Testimonial {
    id: string;
    userId: string;
    clientName: string;
    clientEmail?: string;
    rating: number;
    content: string;
    testimonialText: string;
    propertyAddress?: string;
    transactionType?: 'buy' | 'sell' | 'rent';
    isPublic: boolean;
    isFeatured: boolean;
    dateReceived: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TestimonialReminderResult {
    success: boolean;
    remindersSent: number;
    errors: string[];
}

export interface TestimonialExpirationResult {
    success: boolean;
    expiredCount: number;
    errors: string[];
}

// Platform types
export type Platform =
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'twitter'
    | 'followupboss'
    | 'facebook_lead_ads'
    | 'calendly'
    | 'hubspot';

// Content types
export interface ContentItem {
    id: string;
    userId: string;
    type: 'blog-post' | 'social-media' | 'listing-description' | 'market-update';
    title: string;
    content: string;
    status: 'draft' | 'published' | 'scheduled';
    createdAt: string;
    updatedAt: string;
}

// Workflow types
export interface WorkflowStep {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    duration?: number;
    error?: string;
}

export interface WorkflowInstance {
    id: string;
    userId: string;
    type: string;
    name: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    steps: WorkflowStep[];
    createdAt: string;
    updatedAt: string;
}

// Error types
export interface AppError extends Error {
    code?: string;
    statusCode?: number;
    context?: Record<string, any>;
}

// Utility types
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
// Additional types for testimonial infrastructure
export interface TestimonialRequest {
    id: string;
    userId: string;
    clientName: string;
    clientEmail: string;
    propertyAddress: string;
    transactionType: 'buy' | 'sell' | 'rent';
    requestedAt: string;
    remindersSent: number;
    status: 'pending' | 'completed' | 'expired';
    submissionLink: string;
    sentAt: string;
    expiresAt: string;
    createdAt: number;
    updatedAt: number;
}

export interface SEOAnalysis {
    id: string;
    userId: string;
    contentId: string;
    contentType: string;
    url: string;
    title: string;
    description: string;
    keywords: string[];
    score: number;
    recommendations: string[];
    analyzedAt: string;
    createdAt: number;
    updatedAt: number;
}

export interface SavedKeyword {
    id: string;
    userId: string;
    keyword: string;
    searchVolume: number;
    difficulty: number;
    competition: string;
    location: string;
    position?: number;
    url?: string;
    addedAt: string;
    createdAt: number;
    updatedAt: number;
}