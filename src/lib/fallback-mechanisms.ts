/**
 * Fallback Mechanisms for Service Failures
 * 
 * Provides comprehensive fallback strategies for:
 * - Cached AI responses when AI service fails
 * - Skipping failed integrations gracefully
 * - Queuing background jobs for later processing
 * - User-friendly error messages with recovery options
 * 
 * Requirements: 4.3 - Graceful failure handling with fallback options
 */

import { ErrorCategory } from './error-handling';
import type { ServiceResult } from './error-handling-framework';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CachedAIResponse {
    prompt: string;
    response: any;
    timestamp: Date;
    modelId: string;
    expiresAt: Date;
}

export interface QueuedJob {
    id: string;
    type: 'ai' | 'integration' | 'analytics' | 'notification';
    operation: string;
    payload: any;
    userId: string;
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface IntegrationFailure {
    service: string;
    operation: string;
    error: string;
    timestamp: Date;
    skipReason: string;
}

export interface FallbackResult<T> {
    success: boolean;
    data?: T;
    usedFallback: boolean;
    fallbackType: 'cache' | 'skip' | 'queue' | 'default';
    message: string;
}

// ============================================================================
// AI Response Cache Manager
// ============================================================================

export class AIResponseCache {
    private cache = new Map<string, CachedAIResponse>();
    private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Generate cache key from prompt and model
     */
    private generateCacheKey(prompt: string, modelId: string): string {
        // Simple hash function for cache key
        const hash = this.simpleHash(prompt + modelId);
        return `ai_cache_${hash}`;
    }

    /**
     * Simple hash function for generating cache keys
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Store AI response in cache
     */
    set(prompt: string, response: any, modelId: string, ttl?: number): void {
        const key = this.generateCacheKey(prompt, modelId);
        const expiresAt = new Date(Date.now() + (ttl || this.DEFAULT_TTL));

        this.cache.set(key, {
            prompt,
            response,
            timestamp: new Date(),
            modelId,
            expiresAt,
        });

        // Also store in localStorage for persistence
        if (typeof window !== 'undefined') {
            try {
                const cacheData = {
                    prompt,
                    response,
                    timestamp: new Date().toISOString(),
                    modelId,
                    expiresAt: expiresAt.toISOString(),
                };
                localStorage.setItem(key, JSON.stringify(cacheData));
            } catch (error) {
                console.warn('Failed to persist AI cache to localStorage:', error);
            }
        }
    }

    /**
     * Get cached AI response
     */
    get(prompt: string, modelId: string): CachedAIResponse | null {
        const key = this.generateCacheKey(prompt, modelId);

        // Try memory cache first
        let cached = this.cache.get(key);

        // If not in memory, try localStorage
        if (!cached && typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const data = JSON.parse(stored);
                    cached = {
                        ...data,
                        timestamp: new Date(data.timestamp),
                        expiresAt: new Date(data.expiresAt),
                    };
                    // Restore to memory cache
                    this.cache.set(key, cached!);
                }
            } catch (error) {
                console.warn('Failed to retrieve AI cache from localStorage:', error);
            }
        }

        if (!cached) {
            return null;
        }

        // Check if expired
        if (cached.expiresAt < new Date()) {
            this.delete(prompt, modelId);
            return null;
        }

        return cached;
    }

    /**
     * Delete cached response
     */
    delete(prompt: string, modelId: string): void {
        const key = this.generateCacheKey(prompt, modelId);
        this.cache.delete(key);

        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
        }
    }

    /**
     * Clear all cached responses
     */
    clear(): void {
        this.cache.clear();

        if (typeof window !== 'undefined') {
            // Clear all AI cache keys from localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('ai_cache_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; oldestEntry?: Date; newestEntry?: Date } {
        const entries = Array.from(this.cache.values());

        if (entries.length === 0) {
            return { size: 0 };
        }

        const timestamps = entries.map(e => e.timestamp.getTime());

        return {
            size: entries.length,
            oldestEntry: new Date(Math.min(...timestamps)),
            newestEntry: new Date(Math.max(...timestamps)),
        };
    }
}

// ============================================================================
// Background Job Queue Manager
// ============================================================================

export class BackgroundJobQueue {
    private queue: QueuedJob[] = [];
    private readonly STORAGE_KEY = 'background_job_queue';
    private readonly MAX_QUEUE_SIZE = 1000;

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Load queue from localStorage
     */
    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.queue = data.map((job: any) => ({
                    ...job,
                    createdAt: new Date(job.createdAt),
                    nextRetryAt: job.nextRetryAt ? new Date(job.nextRetryAt) : undefined,
                }));
            }
        } catch (error) {
            console.warn('Failed to load job queue from storage:', error);
        }
    }

    /**
     * Save queue to localStorage
     */
    private saveToStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.warn('Failed to save job queue to storage:', error);
        }
    }

    /**
     * Add job to queue
     */
    enqueue(job: Omit<QueuedJob, 'id' | 'createdAt' | 'status'>): string {
        // Check queue size limit
        if (this.queue.length >= this.MAX_QUEUE_SIZE) {
            // Remove oldest completed or failed jobs
            this.queue = this.queue.filter(j =>
                j.status === 'pending' || j.status === 'processing'
            ).slice(-this.MAX_QUEUE_SIZE + 1);
        }

        const queuedJob: QueuedJob = {
            ...job,
            id: this.generateJobId(),
            createdAt: new Date(),
            status: 'pending',
        };

        this.queue.push(queuedJob);
        this.saveToStorage();

        return queuedJob.id;
    }

    /**
     * Get next job to process
     */
    dequeue(): QueuedJob | null {
        const now = new Date();

        // Find highest priority pending job that's ready to retry
        const job = this.queue
            .filter(j =>
                j.status === 'pending' &&
                (!j.nextRetryAt || j.nextRetryAt <= now)
            )
            .sort((a, b) => {
                // Sort by priority first
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;

                // Then by creation time
                return a.createdAt.getTime() - b.createdAt.getTime();
            })[0];

        if (job) {
            job.status = 'processing';
            this.saveToStorage();
        }

        return job || null;
    }

    /**
     * Mark job as completed
     */
    complete(jobId: string): void {
        const job = this.queue.find(j => j.id === jobId);
        if (job) {
            job.status = 'completed';
            this.saveToStorage();
        }
    }

    /**
     * Mark job as failed and schedule retry
     */
    fail(jobId: string, error: string): void {
        const job = this.queue.find(j => j.id === jobId);
        if (!job) return;

        job.retryCount++;

        if (job.retryCount >= job.maxRetries) {
            job.status = 'failed';
        } else {
            job.status = 'pending';
            // Exponential backoff: 1min, 5min, 15min, 30min
            const delays = [60000, 300000, 900000, 1800000];
            const delay = delays[Math.min(job.retryCount - 1, delays.length - 1)];
            job.nextRetryAt = new Date(Date.now() + delay);
        }

        this.saveToStorage();
    }

    /**
     * Get all jobs
     */
    getAll(): QueuedJob[] {
        return [...this.queue];
    }

    /**
     * Get jobs by status
     */
    getByStatus(status: QueuedJob['status']): QueuedJob[] {
        return this.queue.filter(j => j.status === status);
    }

    /**
     * Get jobs by user
     */
    getByUser(userId: string): QueuedJob[] {
        return this.queue.filter(j => j.userId === userId);
    }

    /**
     * Clear completed jobs
     */
    clearCompleted(): void {
        this.queue = this.queue.filter(j => j.status !== 'completed');
        this.saveToStorage();
    }

    /**
     * Get queue statistics
     */
    getStats(): {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    } {
        return {
            total: this.queue.length,
            pending: this.queue.filter(j => j.status === 'pending').length,
            processing: this.queue.filter(j => j.status === 'processing').length,
            completed: this.queue.filter(j => j.status === 'completed').length,
            failed: this.queue.filter(j => j.status === 'failed').length,
        };
    }

    /**
     * Generate unique job ID
     */
    private generateJobId(): string {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// ============================================================================
// Integration Failure Manager
// ============================================================================

export class IntegrationFailureManager {
    private failures: IntegrationFailure[] = [];
    private readonly STORAGE_KEY = 'integration_failures';
    private readonly MAX_FAILURES = 100;

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Load failures from localStorage
     */
    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.failures = data.map((f: any) => ({
                    ...f,
                    timestamp: new Date(f.timestamp),
                }));
            }
        } catch (error) {
            console.warn('Failed to load integration failures from storage:', error);
        }
    }

    /**
     * Save failures to localStorage
     */
    private saveToStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.failures));
        } catch (error) {
            console.warn('Failed to save integration failures to storage:', error);
        }
    }

    /**
     * Record integration failure
     */
    recordFailure(
        service: string,
        operation: string,
        error: string,
        skipReason: string
    ): void {
        // Keep only recent failures
        if (this.failures.length >= this.MAX_FAILURES) {
            this.failures = this.failures.slice(-this.MAX_FAILURES + 1);
        }

        this.failures.push({
            service,
            operation,
            error,
            timestamp: new Date(),
            skipReason,
        });

        this.saveToStorage();
    }

    /**
     * Get recent failures for a service
     */
    getFailures(service?: string): IntegrationFailure[] {
        if (service) {
            return this.failures.filter(f => f.service === service);
        }
        return [...this.failures];
    }

    /**
     * Check if service should be skipped based on recent failures
     */
    shouldSkipService(service: string, threshold: number = 3): boolean {
        const recentFailures = this.failures.filter(f =>
            f.service === service &&
            f.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
        );

        return recentFailures.length >= threshold;
    }

    /**
     * Clear failures for a service
     */
    clearFailures(service?: string): void {
        if (service) {
            this.failures = this.failures.filter(f => f.service !== service);
        } else {
            this.failures = [];
        }
        this.saveToStorage();
    }

    /**
     * Get failure statistics
     */
    getStats(): Record<string, { count: number; lastFailure: Date }> {
        const stats: Record<string, { count: number; lastFailure: Date }> = {};

        this.failures.forEach(f => {
            if (!stats[f.service]) {
                stats[f.service] = { count: 0, lastFailure: f.timestamp };
            }
            stats[f.service].count++;
            if (f.timestamp > stats[f.service].lastFailure) {
                stats[f.service].lastFailure = f.timestamp;
            }
        });

        return stats;
    }
}

// ============================================================================
// Global Instances
// ============================================================================

export const aiResponseCache = new AIResponseCache();
export const backgroundJobQueue = new BackgroundJobQueue();
export const integrationFailureManager = new IntegrationFailureManager();

// ============================================================================
// Fallback Strategy Functions
// ============================================================================

/**
 * Fallback to cached AI response
 */
export async function fallbackToCachedAI<T>(
    prompt: string,
    modelId: string,
    defaultValue?: T
): Promise<FallbackResult<T>> {
    const cached = aiResponseCache.get(prompt, modelId);

    if (cached) {
        return {
            success: true,
            data: cached.response as T,
            usedFallback: true,
            fallbackType: 'cache',
            message: 'Using cached AI response from previous request',
        };
    }

    if (defaultValue !== undefined) {
        return {
            success: true,
            data: defaultValue,
            usedFallback: true,
            fallbackType: 'default',
            message: 'Using default value as no cache available',
        };
    }

    return {
        success: false,
        usedFallback: false,
        fallbackType: 'cache',
        message: 'No cached response available',
    };
}

/**
 * Skip failed integration gracefully
 */
export function skipFailedIntegration(
    service: string,
    operation: string,
    error: Error
): FallbackResult<null> {
    const skipReason = `Service temporarily unavailable: ${error.message}`;

    integrationFailureManager.recordFailure(
        service,
        operation,
        error.message,
        skipReason
    );

    return {
        success: true,
        data: null,
        usedFallback: true,
        fallbackType: 'skip',
        message: `Skipped ${service} integration - ${skipReason}`,
    };
}

/**
 * Queue background job for later processing
 */
export function queueForLater(
    type: QueuedJob['type'],
    operation: string,
    payload: any,
    userId: string,
    priority: QueuedJob['priority'] = 'medium',
    maxRetries: number = 3
): FallbackResult<string> {
    const jobId = backgroundJobQueue.enqueue({
        type,
        operation,
        payload,
        userId,
        priority,
        retryCount: 0,
        maxRetries,
    });

    return {
        success: true,
        data: jobId,
        usedFallback: true,
        fallbackType: 'queue',
        message: `Job queued for later processing (ID: ${jobId})`,
    };
}

/**
 * Get user-friendly error message with recovery options
 */
export function getUserFriendlyMessage(
    error: Error,
    fallbackType: FallbackResult<any>['fallbackType']
): string {
    const baseMessage = 'We encountered an issue, but don\'t worry!';

    switch (fallbackType) {
        case 'cache':
            return `${baseMessage} We're showing you a previous result while we work on this.`;
        case 'skip':
            return `${baseMessage} We've temporarily skipped this step to keep things moving.`;
        case 'queue':
            return `${baseMessage} We've saved your request and will process it shortly.`;
        case 'default':
            return `${baseMessage} We're using a safe default while we resolve this.`;
        default:
            return `${baseMessage} Please try again in a moment.`;
    }
}

// ============================================================================
// Comprehensive Fallback Handler
// ============================================================================

/**
 * Execute operation with comprehensive fallback handling
 */
export async function executeWithFallback<T>(
    operation: () => Promise<T>,
    options: {
        operationName: string;
        userId?: string;
        cacheKey?: { prompt: string; modelId: string };
        allowSkip?: boolean;
        queueOnFailure?: {
            type: QueuedJob['type'];
            payload: any;
            priority?: QueuedJob['priority'];
        };
        defaultValue?: T;
    }
): Promise<ServiceResult<T>> {
    try {
        const result = await operation();

        // Cache successful AI responses
        if (options.cacheKey && result) {
            aiResponseCache.set(
                options.cacheKey.prompt,
                result,
                options.cacheKey.modelId
            );
        }

        return {
            success: true,
            data: result,
            message: 'Operation completed successfully',
            timestamp: new Date(),
        };
    } catch (error) {
        const err = error as Error;

        // Try cached response first
        if (options.cacheKey) {
            const cachedResult = await fallbackToCachedAI<T>(
                options.cacheKey.prompt,
                options.cacheKey.modelId,
                options.defaultValue
            );

            if (cachedResult.success && cachedResult.data) {
                return {
                    success: true,
                    data: cachedResult.data,
                    message: getUserFriendlyMessage(err, cachedResult.fallbackType),
                    timestamp: new Date(),
                    metadata: {
                        usedFallback: true,
                        fallbackType: cachedResult.fallbackType,
                    },
                };
            }
        }

        // Try queuing for later
        if (options.queueOnFailure && options.userId) {
            const queueResult = queueForLater(
                options.queueOnFailure.type,
                options.operationName,
                options.queueOnFailure.payload,
                options.userId,
                options.queueOnFailure.priority
            );

            return {
                success: true,
                data: undefined as any,
                message: getUserFriendlyMessage(err, queueResult.fallbackType),
                timestamp: new Date(),
                metadata: {
                    usedFallback: true,
                    fallbackType: queueResult.fallbackType,
                    jobId: queueResult.data,
                },
            };
        }

        // Try skipping if allowed
        if (options.allowSkip) {
            const skipResult = skipFailedIntegration(
                options.operationName,
                'execute',
                err
            );

            return {
                success: true,
                data: undefined as any,
                message: getUserFriendlyMessage(err, skipResult.fallbackType),
                timestamp: new Date(),
                metadata: {
                    usedFallback: true,
                    fallbackType: skipResult.fallbackType,
                },
            };
        }

        // No fallback available
        return {
            success: false,
            message: err.message,
            timestamp: new Date(),
            metadata: {
                usedFallback: false,
                originalError: err.message,
            },
        };
    }
}
