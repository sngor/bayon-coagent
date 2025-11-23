/**
 * News service configuration for cost and performance optimization
 */

export const NEWS_CONFIG = {
    // Cache settings
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
    MAX_CACHE_SIZE: 50,

    // Rate limiting
    MAX_REQUESTS_PER_HOUR: 100, // Adjust based on your NewsAPI plan
    REQUEST_DEBOUNCE_MS: 300,

    // Fallback settings
    ENABLE_FALLBACK_NEWS: true,
    FALLBACK_CACHE_DURATION: 2 * 60 * 60 * 1000, // 2 hours for fallback

    // Prefetch settings
    ENABLE_PREFETCH: true,
    PREFETCH_DELAY_MS: 1000,
    COMMON_LOCATIONS: [
        '', // General news
        'California',
        'New York',
        'Florida',
        'Texas',
        'Arizona',
        'Nevada',
        'Colorado'
    ],

    // Development settings
    ENABLE_MONITORING: process.env.NODE_ENV === 'development',
    LOG_CACHE_HITS: process.env.NODE_ENV === 'development',
} as const;

/**
 * Check if NewsAPI is properly configured
 */
export function isNewsAPIConfigured(): boolean {
    return !!process.env.NEWS_API_KEY;
}

/**
 * Get NewsAPI usage tier info
 */
export function getNewsAPITier(): 'free' | 'developer' | 'business' | 'unknown' {
    // This could be enhanced to detect tier based on API responses
    // For now, assume free tier if no specific config
    return process.env.NEWS_API_TIER as any || 'free';
}

/**
 * Get rate limits based on API tier
 */
export function getRateLimits() {
    const tier = getNewsAPITier();

    switch (tier) {
        case 'free':
            return { requestsPerDay: 100, requestsPerHour: 100 };
        case 'developer':
            return { requestsPerDay: 500, requestsPerHour: 500 };
        case 'business':
            return { requestsPerDay: 50000, requestsPerHour: 5000 };
        default:
            return { requestsPerDay: 100, requestsPerHour: 100 }; // Conservative default
    }
}