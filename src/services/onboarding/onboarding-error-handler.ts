/**
 * Onboarding Error Handler
 * 
 * Comprehensive error handling and recovery for the onboarding system.
 * Provides user-friendly error messages, retry logic, and graceful degradation.
 * 
 * Requirements: 2.3, 6.1, 6.2
 */

import { OnboardingError } from './onboarding-service';

/**
 * Error categories for onboarding operations
 */
export enum OnboardingErrorCategory {
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    STATE = 'STATE',
    NAVIGATION = 'NAVIGATION',
    AUTHENTICATION = 'AUTHENTICATION',
    UNKNOWN = 'UNKNOWN',
}

/**
 * Error severity levels
 */
export enum OnboardingErrorSeverity {
    LOW = 'LOW',       // User can continue, minor issue
    MEDIUM = 'MEDIUM', // User should be aware, may need action
    HIGH = 'HIGH',     // Blocks progress, requires immediate action
    CRITICAL = 'CRITICAL', // System failure, requires support
}

/**
 * Enhanced error information for user display
 */
export interface OnboardingErrorInfo {
    /** Error category */
    category: OnboardingErrorCategory;
    /** Error severity */
    severity: OnboardingErrorSeverity;
    /** User-friendly title */
    title: string;
    /** User-friendly description */
    description: string;
    /** Suggested actions for the user */
    actions: string[];
    /** Whether the operation can be retried */
    retryable: boolean;
    /** Technical error code for debugging */
    code: string;
    /** Original error message (for logging) */
    originalMessage?: string;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Initial delay in milliseconds */
    initialDelay: number;
    /** Maximum delay in milliseconds */
    maxDelay: number;
    /** Backoff multiplier */
    backoffMultiplier: number;
    /** Whether to add jitter to delays */
    jitter: boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
};

/**
 * Categorizes an error based on its properties
 */
export function categorizeError(error: any): OnboardingErrorCategory {
    // Check if it's an OnboardingError with a code
    if (error instanceof OnboardingError) {
        if (error.code.includes('NETWORK') || error.code.includes('TIMEOUT')) {
            return OnboardingErrorCategory.NETWORK;
        }
        if (error.code.includes('VALIDATION') || error.code.includes('INVALID')) {
            return OnboardingErrorCategory.VALIDATION;
        }
        if (error.code.includes('STATE') || error.code.includes('NOT_FOUND')) {
            return OnboardingErrorCategory.STATE;
        }
        if (error.code.includes('NAVIGATION') || error.code.includes('STEP')) {
            return OnboardingErrorCategory.NAVIGATION;
        }
        if (error.code.includes('AUTH') || error.code.includes('UNAUTHORIZED')) {
            return OnboardingErrorCategory.AUTHENTICATION;
        }
    }

    // Check error message for network-related keywords
    const message = error.message?.toLowerCase() || '';
    if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('etimedout')
    ) {
        return OnboardingErrorCategory.NETWORK;
    }

    // Check for validation errors
    if (
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required') ||
        message.includes('format')
    ) {
        return OnboardingErrorCategory.VALIDATION;
    }

    // Check for state errors
    if (
        message.includes('state') ||
        message.includes('not found') ||
        message.includes('corrupted')
    ) {
        return OnboardingErrorCategory.STATE;
    }

    // Check for navigation errors
    if (
        message.includes('navigation') ||
        message.includes('step') ||
        message.includes('route')
    ) {
        return OnboardingErrorCategory.NAVIGATION;
    }

    // Check for authentication errors
    if (
        message.includes('auth') ||
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('token')
    ) {
        return OnboardingErrorCategory.AUTHENTICATION;
    }

    return OnboardingErrorCategory.UNKNOWN;
}

/**
 * Determines error severity based on category and context
 */
export function determineErrorSeverity(
    category: OnboardingErrorCategory,
    retryable: boolean
): OnboardingErrorSeverity {
    switch (category) {
        case OnboardingErrorCategory.NETWORK:
            return retryable ? OnboardingErrorSeverity.MEDIUM : OnboardingErrorSeverity.HIGH;

        case OnboardingErrorCategory.VALIDATION:
            return OnboardingErrorSeverity.LOW;

        case OnboardingErrorCategory.STATE:
            return OnboardingErrorSeverity.HIGH;

        case OnboardingErrorCategory.NAVIGATION:
            return OnboardingErrorSeverity.MEDIUM;

        case OnboardingErrorCategory.AUTHENTICATION:
            return OnboardingErrorSeverity.CRITICAL;

        case OnboardingErrorCategory.UNKNOWN:
        default:
            return OnboardingErrorSeverity.HIGH;
    }
}

/**
 * Converts an error to user-friendly error information
 * Requirement 2.3: Display specific validation errors
 * Requirement 6.1, 6.2: Handle state persistence errors gracefully
 */
export function getErrorInfo(error: any): OnboardingErrorInfo {
    const category = categorizeError(error);
    const retryable = error instanceof OnboardingError ? error.retryable : false;
    const severity = determineErrorSeverity(category, retryable);
    const code = error instanceof OnboardingError ? error.code : 'UNKNOWN_ERROR';

    let title: string;
    let description: string;
    let actions: string[];

    switch (category) {
        case OnboardingErrorCategory.NETWORK:
            title = 'Connection Issue';
            description = retryable
                ? 'We\'re having trouble connecting. Your progress has been saved locally and will sync when connection is restored.'
                : 'Unable to connect to the server. Please check your internet connection and try again.';
            actions = retryable
                ? ['Wait a moment and try again', 'Check your internet connection']
                : ['Check your internet connection', 'Refresh the page', 'Contact support if the issue persists'];
            break;

        case OnboardingErrorCategory.VALIDATION:
            title = 'Invalid Information';
            description = 'Please check the highlighted fields and correct any errors.';
            actions = ['Review the form fields', 'Correct any invalid entries', 'Try submitting again'];
            break;

        case OnboardingErrorCategory.STATE:
            title = 'Progress Error';
            description = 'Something went wrong with your progress. We\'ve reset to the last completed step.';
            actions = ['Continue from the current step', 'Refresh the page if issues persist', 'Contact support if you need help'];
            break;

        case OnboardingErrorCategory.NAVIGATION:
            title = 'Navigation Error';
            description = 'Please complete the current step before proceeding.';
            actions = ['Complete the current step', 'Use the navigation buttons', 'Skip the step if you prefer'];
            break;

        case OnboardingErrorCategory.AUTHENTICATION:
            title = 'Authentication Required';
            description = 'Your session has expired. Please sign in again to continue.';
            actions = ['Sign in again', 'Contact support if you continue to have issues'];
            break;

        case OnboardingErrorCategory.UNKNOWN:
        default:
            title = 'Unexpected Error';
            description = 'Something unexpected happened. Please try again or contact support.';
            actions = ['Try again', 'Refresh the page', 'Contact support with error code: ' + code];
            break;
    }

    return {
        category,
        severity,
        title,
        description,
        actions,
        retryable,
        code,
        originalMessage: error.message,
    };
}

/**
 * Calculates retry delay with exponential backoff and optional jitter
 */
export function calculateRetryDelay(
    attempt: number,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
    const { initialDelay, maxDelay, backoffMultiplier, jitter } = config;

    // Calculate exponential backoff
    let delay = initialDelay * Math.pow(backoffMultiplier, attempt);

    // Cap at max delay
    delay = Math.min(delay, maxDelay);

    // Add jitter if enabled (randomize ±25%)
    if (jitter) {
        const jitterAmount = delay * 0.25;
        delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
    }

    return Math.floor(delay);
}

/**
 * Retries an async operation with exponential backoff
 * 
 * @param operation Function to retry
 * @param config Retry configuration
 * @param onRetry Optional callback called before each retry
 * @returns Result of the operation
 * @throws Last error if all retries fail
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    onRetry?: (attempt: number, error: any) => void
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Don't retry if error is not retryable
            if (error instanceof OnboardingError && !error.retryable) {
                throw error;
            }

            // Don't retry on last attempt
            if (attempt === config.maxRetries) {
                break;
            }

            // Calculate delay and wait
            const delay = calculateRetryDelay(attempt, config);
            console.log(`[ONBOARDING_ERROR_HANDLER] Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);

            // Call onRetry callback if provided
            if (onRetry) {
                onRetry(attempt + 1, error);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // All retries failed
    throw lastError;
}

/**
 * Handles validation errors from Zod or other validation libraries
 * Requirement 2.3: Display specific validation errors for each invalid field
 */
export function formatValidationErrors(error: any): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    // Handle Zod errors
    if (error.name === 'ZodError' && error.errors) {
        for (const err of error.errors) {
            const path = err.path.join('.');
            if (!fieldErrors[path]) {
                fieldErrors[path] = [];
            }
            fieldErrors[path].push(err.message);
        }
        return fieldErrors;
    }

    // Handle custom validation errors
    if (error.fieldErrors) {
        return error.fieldErrors;
    }

    // Handle generic validation error
    if (error.message) {
        fieldErrors['_general'] = [error.message];
    }

    return fieldErrors;
}

/**
 * Recovers from state errors by resetting to a valid state
 * Requirement 6.1, 6.2: State error recovery with graceful degradation
 */
export async function recoverFromStateError(
    userId: string,
    corruptedState: any
): Promise<{ recovered: boolean; message: string }> {
    try {
        console.log('[ONBOARDING_ERROR_HANDLER] Attempting to recover from state error for user:', userId);

        // Import service dynamically to avoid circular dependencies
        const { onboardingService } = await import('./onboarding-service');

        // Validate state structure
        if (!corruptedState || typeof corruptedState !== 'object') {
            console.log('[ONBOARDING_ERROR_HANDLER] State is completely corrupted, resetting');
            await onboardingService.resetOnboarding(userId);
            return {
                recovered: true,
                message: 'Your onboarding progress has been reset. Please start again.',
            };
        }

        // Check for corrupted step data
        const { getStepsForFlow } = await import('@/types/onboarding');
        const steps = getStepsForFlow(corruptedState.flowType || 'user');
        const totalSteps = steps.length;

        // Reset current step if out of bounds
        if (corruptedState.currentStep > totalSteps) {
            console.log('[ONBOARDING_ERROR_HANDLER] Current step out of bounds, resetting to last completed');
            corruptedState.currentStep = corruptedState.completedSteps?.length || 0;
        }

        // Validate completed steps
        if (!Array.isArray(corruptedState.completedSteps)) {
            console.log('[ONBOARDING_ERROR_HANDLER] Completed steps corrupted, resetting to empty');
            corruptedState.completedSteps = [];
        }

        // Validate skipped steps
        if (!Array.isArray(corruptedState.skippedSteps)) {
            console.log('[ONBOARDING_ERROR_HANDLER] Skipped steps corrupted, resetting to empty');
            corruptedState.skippedSteps = [];
        }

        return {
            recovered: true,
            message: 'Your progress has been recovered. You can continue from where you left off.',
        };
    } catch (error) {
        console.error('[ONBOARDING_ERROR_HANDLER] Failed to recover from state error:', error);
        return {
            recovered: false,
            message: 'Unable to recover your progress. Please contact support.',
        };
    }
}

/**
 * Validates navigation between steps
 * Requirement: Navigation error handling with redirects
 */
export function validateStepTransition(
    currentStep: number,
    targetStep: number,
    totalSteps: number
): { valid: boolean; message?: string } {
    // Can always go backward
    if (targetStep < currentStep) {
        return { valid: true };
    }

    // Can only go forward one step at a time
    if (targetStep === currentStep + 1) {
        return { valid: true };
    }

    // Can't skip ahead
    if (targetStep > currentStep + 1) {
        return {
            valid: false,
            message: 'Please complete the current step before proceeding.',
        };
    }

    // Can't go beyond total steps
    if (targetStep >= totalSteps) {
        return {
            valid: false,
            message: 'You have reached the end of the onboarding flow.',
        };
    }

    return { valid: true };
}

/**
 * Logs error for monitoring and debugging
 */
export function logError(
    error: any,
    context: {
        userId?: string;
        stepId?: string;
        operation?: string;
        metadata?: Record<string, any>;
    }
): void {
    const errorInfo = getErrorInfo(error);

    console.error('[ONBOARDING_ERROR]', {
        timestamp: new Date().toISOString(),
        category: errorInfo.category,
        severity: errorInfo.severity,
        code: errorInfo.code,
        message: errorInfo.originalMessage,
        context,
        stack: error.stack,
    });

    // In production, you would send this to CloudWatch or another monitoring service
    // For now, we just log to console
}

/**
 * Creates a user-friendly error response for API routes
 */
export function createErrorResponse(error: any, statusCode?: number): {
    error: string;
    message: string;
    code: string;
    retryable: boolean;
    statusCode: number;
} {
    const errorInfo = getErrorInfo(error);

    return {
        error: errorInfo.title,
        message: errorInfo.description,
        code: errorInfo.code,
        retryable: errorInfo.retryable,
        statusCode: statusCode || (errorInfo.severity === OnboardingErrorSeverity.CRITICAL ? 500 : 400),
    };
}
