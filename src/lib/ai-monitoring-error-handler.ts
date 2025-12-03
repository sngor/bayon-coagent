/**
 * AI Monitoring Error Handler
 * 
 * Centralized error handling for AI monitoring features.
 * Provides user-friendly error messages and handles edge cases.
 */

/**
 * Error types for AI monitoring
 */
export enum AIMonitoringErrorType {
    PLATFORM_UNAVAILABLE = 'platform_unavailable',
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
    AUTHENTICATION_FAILED = 'authentication_failed',
    MISSING_DATA = 'missing_data',
    STALE_DATA = 'stale_data',
    NETWORK_ERROR = 'network_error',
    TIMEOUT = 'timeout',
    BUDGET_EXCEEDED = 'budget_exceeded',
    INVALID_CONFIGURATION = 'invalid_configuration',
    UNKNOWN = 'unknown',
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<AIMonitoringErrorType, string> = {
    [AIMonitoringErrorType.PLATFORM_UNAVAILABLE]:
        'The AI platform is temporarily unavailable. We\'ll retry automatically.',
    [AIMonitoringErrorType.RATE_LIMIT_EXCEEDED]:
        'Rate limit reached. Monitoring will resume automatically when the limit resets.',
    [AIMonitoringErrorType.AUTHENTICATION_FAILED]:
        'Authentication failed. Please contact support to update API credentials.',
    [AIMonitoringErrorType.MISSING_DATA]:
        'No monitoring data found. Set up monitoring to start tracking your AI visibility.',
    [AIMonitoringErrorType.STALE_DATA]:
        'Data is older than expected. Consider running a manual refresh for the latest insights.',
    [AIMonitoringErrorType.NETWORK_ERROR]:
        'Network error occurred. Please check your connection and try again.',
    [AIMonitoringErrorType.TIMEOUT]:
        'Request timed out. Please try again in a moment.',
    [AIMonitoringErrorType.BUDGET_EXCEEDED]:
        'Monthly budget limit reached. Monitoring will resume next billing cycle.',
    [AIMonitoringErrorType.INVALID_CONFIGURATION]:
        'Monitoring configuration is invalid. Please update your settings.',
    [AIMonitoringErrorType.UNKNOWN]:
        'An unexpected error occurred. Please try again or contact support if the issue persists.',
};

/**
 * Categorizes an error and returns user-friendly information
 * 
 * @param error Error object
 * @returns Error type and user-friendly message
 */
export function categorizeError(error: unknown): {
    type: AIMonitoringErrorType;
    message: string;
    isRetryable: boolean;
    suggestedAction?: string;
} {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    // Platform unavailable (503, 502, 500)
    if (errorMessage.includes('503') ||
        errorMessage.includes('502') ||
        errorMessage.includes('500') ||
        errorMessage.includes('service unavailable') ||
        errorMessage.includes('temporarily unavailable')) {
        return {
            type: AIMonitoringErrorType.PLATFORM_UNAVAILABLE,
            message: ERROR_MESSAGES[AIMonitoringErrorType.PLATFORM_UNAVAILABLE],
            isRetryable: true,
            suggestedAction: 'The system will automatically retry. No action needed.',
        };
    }

    // Rate limit exceeded (429)
    if (errorMessage.includes('429') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests')) {
        return {
            type: AIMonitoringErrorType.RATE_LIMIT_EXCEEDED,
            message: ERROR_MESSAGES[AIMonitoringErrorType.RATE_LIMIT_EXCEEDED],
            isRetryable: false,
            suggestedAction: 'Wait for the rate limit to reset. Check your monitoring frequency settings.',
        };
    }

    // Authentication failed (401, 403)
    if (errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('authentication failed')) {
        return {
            type: AIMonitoringErrorType.AUTHENTICATION_FAILED,
            message: ERROR_MESSAGES[AIMonitoringErrorType.AUTHENTICATION_FAILED],
            isRetryable: false,
            suggestedAction: 'Contact support to verify API credentials.',
        };
    }

    // Missing data
    if (errorMessage.includes('not found') ||
        errorMessage.includes('no data') ||
        errorMessage.includes('resourcenotfoundexception')) {
        return {
            type: AIMonitoringErrorType.MISSING_DATA,
            message: ERROR_MESSAGES[AIMonitoringErrorType.MISSING_DATA],
            isRetryable: false,
            suggestedAction: 'Enable monitoring in your settings to start collecting data.',
        };
    }

    // Network errors
    if (errorMessage.includes('network') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('enotfound') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch failed')) {
        return {
            type: AIMonitoringErrorType.NETWORK_ERROR,
            message: ERROR_MESSAGES[AIMonitoringErrorType.NETWORK_ERROR],
            isRetryable: true,
            suggestedAction: 'Check your internet connection and try again.',
        };
    }

    // Timeout
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('timed out')) {
        return {
            type: AIMonitoringErrorType.TIMEOUT,
            message: ERROR_MESSAGES[AIMonitoringErrorType.TIMEOUT],
            isRetryable: true,
            suggestedAction: 'The request took too long. Try again in a moment.',
        };
    }

    // Budget exceeded
    if (errorMessage.includes('budget') ||
        errorMessage.includes('cost limit') ||
        errorMessage.includes('quota exceeded')) {
        return {
            type: AIMonitoringErrorType.BUDGET_EXCEEDED,
            message: ERROR_MESSAGES[AIMonitoringErrorType.BUDGET_EXCEEDED],
            isRetryable: false,
            suggestedAction: 'Upgrade your plan or wait for the next billing cycle.',
        };
    }

    // Invalid configuration
    if (errorMessage.includes('invalid') ||
        errorMessage.includes('configuration') ||
        errorMessage.includes('missing api key')) {
        return {
            type: AIMonitoringErrorType.INVALID_CONFIGURATION,
            message: ERROR_MESSAGES[AIMonitoringErrorType.INVALID_CONFIGURATION],
            isRetryable: false,
            suggestedAction: 'Review and update your monitoring configuration.',
        };
    }

    // Unknown error
    return {
        type: AIMonitoringErrorType.UNKNOWN,
        message: ERROR_MESSAGES[AIMonitoringErrorType.UNKNOWN],
        isRetryable: true,
        suggestedAction: 'Try again. If the problem persists, contact support.',
    };
}

/**
 * Formats an error for logging
 * 
 * @param error Error object
 * @param context Additional context
 * @returns Formatted error string
 */
export function formatErrorForLogging(error: unknown, context?: Record<string, any>): string {
    const errorInfo = categorizeError(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    let logMessage = `[AI Monitoring Error] Type: ${errorInfo.type}\n`;
    logMessage += `Message: ${errorMessage}\n`;

    if (context) {
        logMessage += `Context: ${JSON.stringify(context, null, 2)}\n`;
    }

    if (errorStack) {
        logMessage += `Stack: ${errorStack}\n`;
    }

    return logMessage;
}

/**
 * Checks if data is stale
 * 
 * @param lastUpdated ISO date string of last update
 * @param staleDays Number of days after which data is considered stale
 * @returns True if data is stale
 */
export function isDataStale(lastUpdated: string | null, staleDays: number = 7): boolean {
    if (!lastUpdated) {
        return true;
    }

    const lastUpdateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    const staleThreshold = staleDays * 24 * 60 * 60 * 1000;

    return (now - lastUpdateTime) > staleThreshold;
}

/**
 * Gets a human-readable time since last update
 * 
 * @param lastUpdated ISO date string of last update
 * @returns Human-readable string (e.g., "2 days ago")
 */
export function getTimeSinceUpdate(lastUpdated: string | null): string {
    if (!lastUpdated) {
        return 'Never';
    }

    const lastUpdateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    const diffMs = now - lastUpdateTime;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
    }
}

/**
 * Creates an empty state message based on context
 * 
 * @param context Context for the empty state
 * @returns User-friendly empty state message
 */
export function getEmptyStateMessage(context: {
    hasConfig: boolean;
    hasScore: boolean;
    hasMentions: boolean;
    isFiltered: boolean;
}): {
    title: string;
    message: string;
    action?: string;
} {
    // No configuration set up
    if (!context.hasConfig) {
        return {
            title: 'AI Visibility Monitoring Not Set Up',
            message: 'Start tracking how often you appear in AI search results like ChatGPT, Perplexity, Claude, and Gemini.',
            action: 'Set Up Monitoring',
        };
    }

    // Configuration exists but no data collected yet
    if (!context.hasScore && !context.hasMentions) {
        return {
            title: 'Collecting Your First Data',
            message: 'Monitoring is configured and will run automatically. Your first results will appear soon.',
            action: 'Run Manual Check',
        };
    }

    // Has score but no mentions (filtered or genuinely none)
    if (context.hasScore && !context.hasMentions) {
        if (context.isFiltered) {
            return {
                title: 'No Mentions in This View',
                message: 'Try adjusting your filters or date range to see more results.',
                action: 'Clear Filters',
            };
        } else {
            return {
                title: 'No Mentions Found',
                message: 'You haven\'t appeared in AI search results yet. Keep building your online presence and check back soon.',
                action: 'View Tips',
            };
        }
    }

    // Default empty state
    return {
        title: 'No Data Available',
        message: 'Unable to load monitoring data. Please try refreshing or contact support if the issue persists.',
        action: 'Refresh',
    };
}

/**
 * Validates monitoring configuration
 * 
 * @param config Monitoring configuration
 * @returns Validation result with errors if any
 */
export function validateMonitoringConfig(config: {
    enabled: boolean;
    platforms: string[];
    queryTemplates: string[];
    alertThreshold: number;
}): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!config.enabled) {
        errors.push('Monitoring is disabled');
    }

    if (!config.platforms || config.platforms.length === 0) {
        errors.push('At least one platform must be selected');
    }

    if (!config.queryTemplates || config.queryTemplates.length === 0) {
        errors.push('At least one query template must be selected');
    }

    if (config.alertThreshold < 0 || config.alertThreshold > 100) {
        errors.push('Alert threshold must be between 0 and 100');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
