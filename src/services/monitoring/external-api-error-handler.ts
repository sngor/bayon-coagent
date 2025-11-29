/**
 * External API Error Handler Service
 * 
 * Provides specialized error handling for external API integrations including:
 * - Social media platform APIs (Facebook, Instagram, LinkedIn, Twitter)
 * - Rate limit handling with intelligent backoff
 * - OAuth token refresh and re-authentication
 * - Circuit breaker pattern for failing services
 * - Graceful degradation with cached data fallbacks
 * 
 * Validates: All requirements with focus on external service reliability
 */

import {
    executeService,
    createServiceError,
    serviceWrapper,
    type ServiceResult,
    type CircuitBreakerConfig
} from '@/lib/error-handling-framework';
import { ErrorCategory } from '@/lib/error-handling';

// ============================================================================
// External API Error Types
// ============================================================================

export interface ExternalAPIError extends Error {
    statusCode?: number;
    platform?: string;
    rateLimitReset?: Date;
    retryAfter?: number;
    isAuthError?: boolean;
    isRateLimitError?: boolean;
    isTemporary?: boolean;
}

export interface APIRateLimit {
    limit: number;
    remaining: number;
    resetTime: Date;
    windowDuration: number; // in seconds
}

export interface PlatformConfig {
    name: string;
    baseURL: string;
    rateLimit: APIRateLimit;
    circuitBreaker: CircuitBreakerConfig;
    retryConfig: {
        maxRetries: number;
        baseDelay: number;
        maxDelay: number;
    };
}

// ============================================================================
// Platform Configurations
// ============================================================================

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
    facebook: {
        name: 'Facebook',
        baseURL: 'https://graph.facebook.com',
        rateLimit: {
            limit: 200,
            remaining: 200,
            resetTime: new Date(Date.now() + 3600000), // 1 hour
            windowDuration: 3600
        },
        circuitBreaker: {
            failureThreshold: 5,
            resetTimeout: 300000, // 5 minutes
            monitoringPeriod: 600000 // 10 minutes
        },
        retryConfig: {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 30000
        }
    },
    instagram: {
        name: 'Instagram',
        baseURL: 'https://graph.instagram.com',
        rateLimit: {
            limit: 200,
            remaining: 200,
            resetTime: new Date(Date.now() + 3600000),
            windowDuration: 3600
        },
        circuitBreaker: {
            failureThreshold: 5,
            resetTimeout: 300000,
            monitoringPeriod: 600000
        },
        retryConfig: {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 30000
        }
    },
    linkedin: {
        name: 'LinkedIn',
        baseURL: 'https://api.linkedin.com',
        rateLimit: {
            limit: 500,
            remaining: 500,
            resetTime: new Date(Date.now() + 86400000), // 24 hours
            windowDuration: 86400
        },
        circuitBreaker: {
            failureThreshold: 3,
            resetTimeout: 600000, // 10 minutes
            monitoringPeriod: 1800000 // 30 minutes
        },
        retryConfig: {
            maxRetries: 2,
            baseDelay: 5000,
            maxDelay: 60000
        }
    },
    twitter: {
        name: 'Twitter/X',
        baseURL: 'https://api.twitter.com',
        rateLimit: {
            limit: 300,
            remaining: 300,
            resetTime: new Date(Date.now() + 900000), // 15 minutes
            windowDuration: 900
        },
        circuitBreaker: {
            failureThreshold: 3,
            resetTimeout: 900000, // 15 minutes
            monitoringPeriod: 1800000 // 30 minutes
        },
        retryConfig: {
            maxRetries: 2,
            baseDelay: 1000,
            maxDelay: 15000
        }
    }
};

// ============================================================================
// External API Error Handler Class
// ============================================================================

export class ExternalAPIErrorHandler {
    private rateLimitTrackers = new Map<string, APIRateLimit>();
    private lastRequestTimes = new Map<string, number>();

    /**
     * Execute an external API request with comprehensive error handling
     */
    async executeAPIRequest<T>(
        platform: string,
        operation: string,
        request: () => Promise<T>,
        options: {
            userId?: string;
            requiresAuth?: boolean;
            cacheable?: boolean;
            cacheKey?: string;
            cacheTTL?: number;
        } = {}
    ): Promise<ServiceResult<T>> {
        const config = PLATFORM_CONFIGS[platform];
        if (!config) {
            return {
                success: false,
                error: createServiceError(
                    `Unsupported platform: ${platform}`,
                    'external_api_request',
                    ErrorCategory.VALIDATION
                ),
                timestamp: new Date()
            };
        }

        // Check rate limits before making request
        const rateLimitCheck = await this.checkRateLimit(platform);
        if (!rateLimitCheck.allowed) {
            return {
                success: false,
                error: createServiceError(
                    `Rate limit exceeded for ${config.name}. Try again in ${rateLimitCheck.retryAfter} seconds.`,
                    'external_api_request',
                    ErrorCategory.RATE_LIMIT,
                    undefined,
                    {
                        userMessage: `Too many requests to ${config.name}. Please wait ${Math.ceil(rateLimitCheck.retryAfter / 60)} minutes and try again.`,
                        suggestedActions: [
                            `Wait ${Math.ceil(rateLimitCheck.retryAfter / 60)} minutes before trying again`,
                            'Reduce the frequency of your requests',
                            'Contact support if this persists'
                        ]
                    }
                ),
                timestamp: new Date(),
                metadata: {
                    retryAfter: rateLimitCheck.retryAfter,
                    platform
                }
            };
        }

        return executeService(
            async () => {
                // Record request time for rate limiting
                this.recordRequest(platform);

                try {
                    const result = await request();

                    // Update rate limit info from response headers if available
                    this.updateRateLimitFromResponse(platform, undefined);

                    return result;
                } catch (error) {
                    const apiError = this.processAPIError(error as Error, platform);

                    // Update rate limit info if it's a rate limit error
                    if (apiError.isRateLimitError && apiError.retryAfter) {
                        this.updateRateLimitFromError(platform, apiError.retryAfter);
                    }

                    throw apiError;
                }
            },
            {
                operation: `${platform}_${operation}`,
                userId: options.userId,
                timestamp: new Date(),
                metadata: {
                    platform,
                    operation,
                    requiresAuth: options.requiresAuth
                }
            },
            {
                maxRetries: config.retryConfig.maxRetries,
                fallback: options.cacheable ? {
                    enabled: true,
                    cacheKey: options.cacheKey,
                    cacheTTL: options.cacheTTL || 300000, // 5 minutes default
                    fallbackFunction: async () => {
                        // Try to get cached data
                        const cached = await this.getCachedData<T>(options.cacheKey!);
                        if (cached) {
                            return cached;
                        }
                        throw new Error('No cached data available');
                    }
                } : { enabled: false }
            }
        );
    }

    /**
     * Handle OAuth authentication errors with automatic token refresh
     */
    async handleAuthError(
        platform: string,
        userId: string,
        originalError: Error,
        refreshTokenFn?: () => Promise<string>
    ): Promise<ServiceResult<string>> {
        return executeService(
            async () => {
                if (!refreshTokenFn) {
                    throw createServiceError(
                        `Authentication failed for ${platform}. Please reconnect your account.`,
                        'auth_refresh',
                        ErrorCategory.AUTHENTICATION,
                        originalError,
                        {
                            userMessage: `Your ${platform} connection has expired. Please reconnect your account in settings.`,
                            suggestedActions: [
                                'Go to Settings > Connected Accounts',
                                `Reconnect your ${platform} account`,
                                'Try the operation again'
                            ]
                        }
                    );
                }

                // Attempt to refresh the token
                const newToken = await refreshTokenFn();

                if (!newToken) {
                    throw createServiceError(
                        `Failed to refresh ${platform} authentication token`,
                        'auth_refresh',
                        ErrorCategory.AUTHENTICATION,
                        originalError
                    );
                }

                return newToken;
            },
            {
                operation: `${platform}_auth_refresh`,
                userId,
                timestamp: new Date(),
                metadata: { platform }
            },
            {
                maxRetries: 1, // Only try once for auth refresh
                fallback: { enabled: false }
            }
        );
    }

    /**
     * Sync external analytics with intelligent error handling and fallbacks
     */
    async syncExternalAnalytics(
        platform: string,
        userId: string,
        syncFunction: () => Promise<any>,
        lastSyncTime?: Date
    ): Promise<ServiceResult<any>> {
        return executeService(
            async () => {
                // Check if we need to sync (avoid unnecessary API calls)
                if (lastSyncTime) {
                    const timeSinceLastSync = Date.now() - lastSyncTime.getTime();
                    const minSyncInterval = 3600000; // 1 hour

                    if (timeSinceLastSync < minSyncInterval) {
                        throw createServiceError(
                            'Sync attempted too soon after last sync',
                            'analytics_sync',
                            ErrorCategory.RATE_LIMIT,
                            undefined,
                            {
                                userMessage: 'Analytics data was recently updated. Please wait before syncing again.',
                                suggestedActions: [
                                    'Wait at least 1 hour between syncs',
                                    'Use cached analytics data for now'
                                ]
                            }
                        );
                    }
                }

                return await syncFunction();
            },
            {
                operation: `${platform}_analytics_sync`,
                userId,
                timestamp: new Date(),
                metadata: {
                    platform,
                    lastSyncTime: lastSyncTime?.toISOString()
                }
            },
            {
                maxRetries: 2,
                fallback: {
                    enabled: true,
                    cacheKey: `analytics_${platform}_${userId}`,
                    cacheTTL: 86400000, // 24 hours
                    fallbackFunction: async () => {
                        // Return cached analytics or empty data
                        const cached = await this.getCachedData(`analytics_${platform}_${userId}`);
                        return cached || {
                            metrics: {},
                            lastSynced: lastSyncTime || new Date(),
                            source: 'fallback'
                        };
                    }
                }
            }
        );
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private async checkRateLimit(platform: string): Promise<{ allowed: boolean; retryAfter: number }> {
        const config = PLATFORM_CONFIGS[platform];
        const rateLimit = this.rateLimitTrackers.get(platform) || config.rateLimit;

        const now = Date.now();

        // Check if rate limit window has reset
        if (now >= rateLimit.resetTime.getTime()) {
            rateLimit.remaining = rateLimit.limit;
            rateLimit.resetTime = new Date(now + (rateLimit.windowDuration * 1000));
            this.rateLimitTrackers.set(platform, rateLimit);
        }

        // Check if we have remaining requests
        if (rateLimit.remaining <= 0) {
            const retryAfter = Math.ceil((rateLimit.resetTime.getTime() - now) / 1000);
            return { allowed: false, retryAfter };
        }

        return { allowed: true, retryAfter: 0 };
    }

    private recordRequest(platform: string): void {
        const rateLimit = this.rateLimitTrackers.get(platform);
        if (rateLimit) {
            rateLimit.remaining = Math.max(0, rateLimit.remaining - 1);
            this.rateLimitTrackers.set(platform, rateLimit);
        }

        this.lastRequestTimes.set(platform, Date.now());
    }

    private updateRateLimitFromResponse(platform: string, headers?: Record<string, string>): void {
        if (!headers) return;

        const rateLimit = this.rateLimitTrackers.get(platform);
        if (!rateLimit) return;

        // Update based on common rate limit headers
        if (headers['x-ratelimit-remaining']) {
            rateLimit.remaining = parseInt(headers['x-ratelimit-remaining'], 10);
        }

        if (headers['x-ratelimit-reset']) {
            const resetTime = parseInt(headers['x-ratelimit-reset'], 10);
            rateLimit.resetTime = new Date(resetTime * 1000);
        }

        this.rateLimitTrackers.set(platform, rateLimit);
    }

    private updateRateLimitFromError(platform: string, retryAfter: number): void {
        const rateLimit = this.rateLimitTrackers.get(platform);
        if (!rateLimit) return;

        rateLimit.remaining = 0;
        rateLimit.resetTime = new Date(Date.now() + (retryAfter * 1000));
        this.rateLimitTrackers.set(platform, rateLimit);
    }

    private processAPIError(error: Error, platform: string): ExternalAPIError {
        const apiError = error as ExternalAPIError;
        apiError.platform = platform;

        // Detect error type based on message and status code
        if (apiError.message.includes('rate limit') || apiError.statusCode === 429) {
            apiError.isRateLimitError = true;
            apiError.isTemporary = true;
        } else if (apiError.message.includes('unauthorized') || apiError.statusCode === 401) {
            apiError.isAuthError = true;
            apiError.isTemporary = false;
        } else if (apiError.statusCode && apiError.statusCode >= 500) {
            apiError.isTemporary = true;
        }

        return apiError;
    }

    private async getCachedData<T>(cacheKey: string): Promise<T | null> {
        try {
            if (typeof window !== 'undefined') {
                const cached = localStorage.getItem(`api_cache_${cacheKey}`);
                if (cached) {
                    const data = JSON.parse(cached);
                    if (data.expiresAt > Date.now()) {
                        return data.value;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to get cached data:', error);
        }
        return null;
    }

    /**
     * Get rate limit status for all platforms
     */
    getRateLimitStatus(): Record<string, APIRateLimit> {
        const status: Record<string, APIRateLimit> = {};

        Object.keys(PLATFORM_CONFIGS).forEach(platform => {
            const rateLimit = this.rateLimitTrackers.get(platform) || PLATFORM_CONFIGS[platform].rateLimit;
            status[platform] = { ...rateLimit };
        });

        return status;
    }

    /**
     * Clear rate limit data (for testing or reset)
     */
    clearRateLimits(): void {
        this.rateLimitTrackers.clear();
        this.lastRequestTimes.clear();
    }
}

// ============================================================================
// Global Instance and Convenience Functions
// ============================================================================

export const externalAPIErrorHandler = new ExternalAPIErrorHandler();

/**
 * Execute a Facebook API request with error handling
 */
export async function executeFacebookAPI<T>(
    operation: string,
    request: () => Promise<T>,
    options?: { userId?: string; cacheable?: boolean; cacheKey?: string }
): Promise<ServiceResult<T>> {
    return externalAPIErrorHandler.executeAPIRequest('facebook', operation, request, options);
}

/**
 * Execute an Instagram API request with error handling
 */
export async function executeInstagramAPI<T>(
    operation: string,
    request: () => Promise<T>,
    options?: { userId?: string; cacheable?: boolean; cacheKey?: string }
): Promise<ServiceResult<T>> {
    return externalAPIErrorHandler.executeAPIRequest('instagram', operation, request, options);
}

/**
 * Execute a LinkedIn API request with error handling
 */
export async function executeLinkedInAPI<T>(
    operation: string,
    request: () => Promise<T>,
    options?: { userId?: string; cacheable?: boolean; cacheKey?: string }
): Promise<ServiceResult<T>> {
    return externalAPIErrorHandler.executeAPIRequest('linkedin', operation, request, options);
}

/**
 * Execute a Twitter API request with error handling
 */
export async function executeTwitterAPI<T>(
    operation: string,
    request: () => Promise<T>,
    options?: { userId?: string; cacheable?: boolean; cacheKey?: string }
): Promise<ServiceResult<T>> {
    return externalAPIErrorHandler.executeAPIRequest('twitter', operation, request, options);
}