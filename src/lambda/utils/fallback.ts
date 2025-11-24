/**
 * Fallback Mechanisms for Service Failures
 * 
 * Provides graceful degradation strategies when services are unavailable.
 * Implements caching, default responses, and user-friendly error messages.
 * 
 * Requirements: 4.3 - Graceful failure handling with fallback options
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({});
const CACHE_TABLE_NAME = process.env.CACHE_TABLE_NAME || process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

export interface FallbackOptions {
    /**
     * Enable caching of successful responses
     */
    enableCache?: boolean;

    /**
     * Cache TTL in seconds (default: 3600 = 1 hour)
     */
    cacheTTL?: number;

    /**
     * Default response to return if no cached data available
     */
    defaultResponse?: any;

    /**
     * Custom error message for users
     */
    userMessage?: string;

    /**
     * Whether to queue the operation for later retry
     */
    queueForRetry?: boolean;
}

export interface FallbackResult<T> {
    success: boolean;
    data?: T;
    fromCache: boolean;
    fromDefault: boolean;
    error?: string;
    userMessage: string;
}

/**
 * Generate cache key for a service operation
 */
function generateCacheKey(
    service: string,
    operation: string,
    params: any
): string {
    const paramsHash = JSON.stringify(params);
    return `CACHE#${service}#${operation}#${Buffer.from(paramsHash).toString('base64').substring(0, 50)}`;
}

/**
 * Get cached response from DynamoDB
 */
async function getCachedResponse<T>(
    cacheKey: string
): Promise<T | null> {
    try {
        const result = await dynamoClient.send(new GetItemCommand({
            TableName: CACHE_TABLE_NAME,
            Key: marshall({
                PK: `SYSTEM#CACHE`,
                SK: cacheKey,
            }),
        }));

        if (!result.Item) {
            return null;
        }

        const item = unmarshall(result.Item);

        // Check if cache is expired
        if (item.expiresAt && item.expiresAt < Date.now()) {
            return null;
        }

        return item.data as T;
    } catch (error) {
        console.error('Failed to get cached response:', error);
        return null;
    }
}

/**
 * Store response in cache
 */
async function setCachedResponse(
    cacheKey: string,
    data: any,
    ttlSeconds: number
): Promise<void> {
    try {
        const expiresAt = Date.now() + (ttlSeconds * 1000);

        await dynamoClient.send(new PutItemCommand({
            TableName: CACHE_TABLE_NAME,
            Item: marshall({
                PK: `SYSTEM#CACHE`,
                SK: cacheKey,
                data,
                expiresAt,
                createdAt: Date.now(),
            }),
        }));
    } catch (error) {
        console.error('Failed to cache response:', error);
        // Don't throw - caching is non-critical
    }
}

/**
 * Execute operation with fallback support
 * 
 * @param service - Service name (e.g., 'ai-service', 'integration-service')
 * @param operation - Operation name (e.g., 'generate-blog-post', 'oauth-token')
 * @param fn - Function to execute
 * @param params - Parameters for cache key generation
 * @param options - Fallback options
 * @returns Fallback result with data or error
 * 
 * @example
 * ```typescript
 * const result = await withFallback(
 *   'ai-service',
 *   'generate-blog-post',
 *   async () => await generateBlogPost(params),
 *   params,
 *   {
 *     enableCache: true,
 *     cacheTTL: 3600,
 *     userMessage: 'AI service is temporarily unavailable. Showing cached content.',
 *   }
 * );
 * 
 * if (result.success) {
 *   console.log('Data:', result.data);
 *   console.log('From cache:', result.fromCache);
 * } else {
 *   console.error('Error:', result.userMessage);
 * }
 * ```
 */
export async function withFallback<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>,
    params: any = {},
    options: FallbackOptions = {}
): Promise<FallbackResult<T>> {
    const {
        enableCache = true,
        cacheTTL = 3600,
        defaultResponse,
        userMessage = 'Service temporarily unavailable. Please try again later.',
        queueForRetry = false,
    } = options;

    const cacheKey = generateCacheKey(service, operation, params);

    try {
        // Try to execute the operation
        const data = await fn();

        // Cache successful response
        if (enableCache) {
            await setCachedResponse(cacheKey, data, cacheTTL);
        }

        return {
            success: true,
            data,
            fromCache: false,
            fromDefault: false,
            userMessage: 'Operation completed successfully',
        };
    } catch (error) {
        console.error(`Service operation failed: ${service}.${operation}`, error);

        // Try to get cached response
        if (enableCache) {
            const cachedData = await getCachedResponse<T>(cacheKey);

            if (cachedData) {
                console.log(`Using cached response for ${service}.${operation}`);

                return {
                    success: true,
                    data: cachedData,
                    fromCache: true,
                    fromDefault: false,
                    userMessage: 'Service temporarily unavailable. Showing cached content.',
                };
            }
        }

        // Try default response
        if (defaultResponse !== undefined) {
            console.log(`Using default response for ${service}.${operation}`);

            return {
                success: true,
                data: defaultResponse,
                fromCache: false,
                fromDefault: true,
                userMessage: 'Service temporarily unavailable. Showing default content.',
            };
        }

        // Queue for retry if requested
        if (queueForRetry) {
            await queueOperationForRetry(service, operation, params);
        }

        // No fallback available
        return {
            success: false,
            fromCache: false,
            fromDefault: false,
            error: error instanceof Error ? error.message : String(error),
            userMessage,
        };
    }
}

/**
 * Queue operation for later retry
 */
async function queueOperationForRetry(
    service: string,
    operation: string,
    params: any
): Promise<void> {
    try {
        const queueId = `retry-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        await dynamoClient.send(new PutItemCommand({
            TableName: CACHE_TABLE_NAME,
            Item: marshall({
                PK: `SYSTEM#RETRY_QUEUE`,
                SK: `RETRY#${queueId}`,
                service,
                operation,
                params,
                queuedAt: Date.now(),
                status: 'pending',
                retryCount: 0,
            }),
        }));

        console.log(`Queued operation for retry: ${service}.${operation}`, { queueId });
    } catch (error) {
        console.error('Failed to queue operation for retry:', error);
        // Don't throw - queuing is non-critical
    }
}

/**
 * AI Service Fallback Helpers
 */
export const AIServiceFallback = {
    /**
     * Fallback for blog post generation
     */
    async generateBlogPost(
        fn: () => Promise<any>,
        params: any
    ): Promise<FallbackResult<any>> {
        return withFallback(
            'ai-service',
            'generate-blog-post',
            fn,
            params,
            {
                enableCache: true,
                cacheTTL: 7200, // 2 hours
                userMessage: 'AI content generation is temporarily unavailable. Please try again in a few minutes.',
            }
        );
    },

    /**
     * Fallback for social media post generation
     */
    async generateSocialPost(
        fn: () => Promise<any>,
        params: any
    ): Promise<FallbackResult<any>> {
        return withFallback(
            'ai-service',
            'generate-social-post',
            fn,
            params,
            {
                enableCache: true,
                cacheTTL: 3600, // 1 hour
                userMessage: 'AI content generation is temporarily unavailable. Please try again in a few minutes.',
            }
        );
    },

    /**
     * Fallback for listing description generation
     */
    async generateListingDescription(
        fn: () => Promise<any>,
        params: any
    ): Promise<FallbackResult<any>> {
        return withFallback(
            'ai-service',
            'generate-listing-description',
            fn,
            params,
            {
                enableCache: true,
                cacheTTL: 7200, // 2 hours
                userMessage: 'AI description generation is temporarily unavailable. Please try again in a few minutes.',
            }
        );
    },
};

/**
 * Integration Service Fallback Helpers
 */
export const IntegrationServiceFallback = {
    /**
     * Fallback for OAuth operations
     */
    async oauthOperation(
        fn: () => Promise<any>,
        provider: string
    ): Promise<FallbackResult<any>> {
        return withFallback(
            'integration-service',
            `oauth-${provider}`,
            fn,
            { provider },
            {
                enableCache: false, // Don't cache OAuth tokens
                userMessage: `${provider} integration is temporarily unavailable. Please try again later.`,
            }
        );
    },

    /**
     * Fallback for MLS sync
     */
    async mlsSync(
        fn: () => Promise<any>,
        params: any
    ): Promise<FallbackResult<any>> {
        return withFallback(
            'integration-service',
            'mls-sync',
            fn,
            params,
            {
                enableCache: false,
                queueForRetry: true, // Queue MLS sync for later
                userMessage: 'MLS sync is temporarily unavailable. Your sync has been queued and will be processed when the service is available.',
            }
        );
    },
};

/**
 * Background Service Fallback Helpers
 */
export const BackgroundServiceFallback = {
    /**
     * Fallback for analytics operations
     */
    async analytics(
        fn: () => Promise<any>,
        params: any
    ): Promise<FallbackResult<any>> {
        return withFallback(
            'background-service',
            'analytics',
            fn,
            params,
            {
                enableCache: true,
                cacheTTL: 1800, // 30 minutes
                queueForRetry: true,
                userMessage: 'Analytics data is temporarily unavailable. Showing cached data.',
            }
        );
    },

    /**
     * Fallback for notification operations
     */
    async notification(
        fn: () => Promise<any>,
        params: any
    ): Promise<FallbackResult<any>> {
        return withFallback(
            'background-service',
            'notification',
            fn,
            params,
            {
                enableCache: false,
                queueForRetry: true, // Queue notifications for later
                userMessage: 'Notification service is temporarily unavailable. Your notification has been queued.',
            }
        );
    },
};

/**
 * Create user-friendly error response
 */
export function createUserFriendlyError(
    service: string,
    operation: string,
    error: Error
): {
    code: string;
    message: string;
    details: {
        service: string;
        operation: string;
        timestamp: string;
        retryable: boolean;
    };
} {
    // Determine if error is retryable
    const retryable = isRetryableError(error);

    // Generate user-friendly message
    let message = 'An unexpected error occurred. Please try again.';

    if (error.message.includes('timeout')) {
        message = 'The operation took too long to complete. Please try again.';
    } else if (error.message.includes('unavailable') || error.message.includes('connection')) {
        message = 'The service is temporarily unavailable. Please try again in a few minutes.';
    } else if (error.message.includes('throttl') || error.message.includes('rate limit')) {
        message = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        message = 'You do not have permission to perform this operation.';
    } else if (error.message.includes('not found')) {
        message = 'The requested resource was not found.';
    }

    return {
        code: retryable ? 'SERVICE_UNAVAILABLE' : 'OPERATION_FAILED',
        message,
        details: {
            service,
            operation,
            timestamp: new Date().toISOString(),
            retryable,
        },
    };
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error): boolean {
    const retryablePatterns = [
        'timeout',
        'unavailable',
        'connection',
        'throttl',
        'rate limit',
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
    ];

    const message = error.message.toLowerCase();
    return retryablePatterns.some(pattern => message.includes(pattern.toLowerCase()));
}
