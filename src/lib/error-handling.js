"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCategory = void 0;
exports.detectErrorPattern = detectErrorPattern;
exports.trackErrorPattern = trackErrorPattern;
exports.getErrorStatistics = getErrorStatistics;
exports.isRecurringError = isRecurringError;
exports.retryWithBackoff = retryWithBackoff;
exports.handleError = handleError;
exports.handleNetworkError = handleNetworkError;
exports.handleAIError = handleAIError;
exports.handleAuthError = handleAuthError;
exports.handleValidationError = handleValidationError;
exports.handleDatabaseError = handleDatabaseError;
exports.createRecoveryActions = createRecoveryActions;
exports.getErrorBoundaryState = getErrorBoundaryState;
exports.isRetryableError = isRetryableError;
exports.getErrorSeverity = getErrorSeverity;
exports.shouldNotifyUser = shouldNotifyUser;
const use_toast_1 = require("@/hooks/use-toast");
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["AI_OPERATION"] = "ai_operation";
    ErrorCategory["DATABASE"] = "database";
    ErrorCategory["RATE_LIMIT"] = "rate_limit";
    ErrorCategory["NOT_FOUND"] = "not_found";
    ErrorCategory["SERVER_ERROR"] = "server_error";
    ErrorCategory["CLIENT_ERROR"] = "client_error";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
const ERROR_PATTERNS = [
    {
        pattern: /network|fetch|connection|timeout|ECONNREFUSED/i,
        category: ErrorCategory.NETWORK,
        userMessage: "Unable to connect to the server. Please check your internet connection.",
        suggestedActions: [
            "Check your internet connection",
            "Try refreshing the page",
            "Wait a moment and try again",
        ],
    },
    {
        pattern: /offline|no internet/i,
        category: ErrorCategory.NETWORK,
        userMessage: "You appear to be offline. Please check your internet connection.",
        suggestedActions: [
            "Connect to the internet",
            "Check your WiFi or mobile data",
            "Try again once connected",
        ],
    },
    {
        pattern: /UserNotFoundException|user not found/i,
        category: ErrorCategory.AUTHENTICATION,
        userMessage: "No account found with this email.",
        suggestedActions: [
            "Check your email address for typos",
            "Sign up for a new account",
            "Contact support if you believe this is an error",
        ],
    },
    {
        pattern: /NotAuthorizedException|incorrect.*password|invalid.*credentials/i,
        category: ErrorCategory.AUTHENTICATION,
        userMessage: "Incorrect email or password.",
        suggestedActions: [
            "Double-check your password",
            "Use the 'Forgot Password' option",
            "Ensure Caps Lock is off",
        ],
    },
    {
        pattern: /UserNotConfirmedException|not confirmed/i,
        category: ErrorCategory.AUTHENTICATION,
        userMessage: "Please verify your email before signing in.",
        suggestedActions: [
            "Check your email for a verification code",
            "Resend the verification email",
            "Check your spam folder",
        ],
    },
    {
        pattern: /session.*expired|token.*expired/i,
        category: ErrorCategory.AUTHENTICATION,
        userMessage: "Your session has expired. Please sign in again.",
        suggestedActions: [
            "Sign in again",
            "Enable 'Remember Me' for longer sessions",
        ],
    },
    {
        pattern: /unauthorized|forbidden|403/i,
        category: ErrorCategory.AUTHORIZATION,
        userMessage: "You don't have permission to perform this action.",
        suggestedActions: [
            "Contact your administrator for access",
            "Ensure you're signed in to the correct account",
            "Upgrade your plan if needed",
        ],
    },
    {
        pattern: /TooManyRequestsException|rate limit|429/i,
        category: ErrorCategory.RATE_LIMIT,
        userMessage: "Too many attempts. Please wait a moment and try again.",
        suggestedActions: [
            "Wait a few minutes before trying again",
            "Avoid rapid repeated attempts",
            "Contact support if this persists",
        ],
    },
    {
        pattern: /InvalidPasswordException|password.*requirements/i,
        category: ErrorCategory.VALIDATION,
        userMessage: "Password doesn't meet requirements.",
        suggestedActions: [
            "Use at least 8 characters",
            "Include uppercase and lowercase letters",
            "Add numbers and special characters",
        ],
    },
    {
        pattern: /validation|invalid.*input|bad request|400/i,
        category: ErrorCategory.VALIDATION,
        userMessage: "Some information is missing or incorrect.",
        suggestedActions: [
            "Check all required fields are filled",
            "Ensure data is in the correct format",
            "Review any highlighted errors",
        ],
    },
    {
        pattern: /bedrock|ai.*failed|generation.*failed/i,
        category: ErrorCategory.AI_OPERATION,
        userMessage: "AI operation failed. This is usually temporary.",
        suggestedActions: [
            "Try again in a moment",
            "Simplify your request if it's complex",
            "Contact support if this continues",
        ],
    },
    {
        pattern: /dynamodb|database|query.*failed/i,
        category: ErrorCategory.DATABASE,
        userMessage: "Unable to access your data right now.",
        suggestedActions: [
            "Try refreshing the page",
            "Wait a moment and try again",
            "Contact support if this persists",
        ],
    },
    {
        pattern: /not found|404/i,
        category: ErrorCategory.NOT_FOUND,
        userMessage: "The requested resource could not be found.",
        suggestedActions: [
            "Check the URL for typos",
            "Return to the dashboard",
            "Contact support if you believe this is an error",
        ],
    },
    {
        pattern: /500|502|503|504|server error|internal error/i,
        category: ErrorCategory.SERVER_ERROR,
        userMessage: "Something went wrong on our end. We're working on it.",
        suggestedActions: [
            "Try again in a few minutes",
            "Check our status page for updates",
            "Contact support if this continues",
        ],
    },
];
function detectErrorPattern(error) {
    const errorMessage = error.message || error.toString();
    for (const pattern of ERROR_PATTERNS) {
        const regex = typeof pattern.pattern === "string"
            ? new RegExp(pattern.pattern, "i")
            : pattern.pattern;
        if (regex.test(errorMessage)) {
            return pattern;
        }
    }
    return {
        pattern: /.*/,
        category: ErrorCategory.UNKNOWN,
        userMessage: "An unexpected error occurred.",
        suggestedActions: [
            "Try again",
            "Refresh the page",
            "Contact support if this persists",
        ],
    };
}
const errorStatistics = new Map();
function trackErrorPattern(error, category) {
    const key = `${category}:${error.message.substring(0, 50)}`;
    const existing = errorStatistics.get(key);
    if (existing) {
        existing.count++;
        existing.lastOccurrence = new Date();
    }
    else {
        errorStatistics.set(key, {
            count: 1,
            lastOccurrence: new Date(),
            category,
            pattern: error.message,
        });
    }
}
function getErrorStatistics() {
    return new Map(errorStatistics);
}
function isRecurringError(error, threshold = 3) {
    const pattern = detectErrorPattern(error);
    const key = `${pattern.category}:${error.message.substring(0, 50)}`;
    const stats = errorStatistics.get(key);
    return stats ? stats.count >= threshold : false;
}
const DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
};
async function retryWithBackoff(operation, config = {}) {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError;
    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            const pattern = detectErrorPattern(lastError);
            if (pattern.category === ErrorCategory.VALIDATION ||
                pattern.category === ErrorCategory.AUTHORIZATION ||
                pattern.category === ErrorCategory.NOT_FOUND) {
                throw lastError;
            }
            if (attempt === finalConfig.maxAttempts) {
                throw lastError;
            }
            const delay = Math.min(finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1), finalConfig.maxDelay);
            const jitter = Math.random() * 0.3 * delay;
            const finalDelay = delay + jitter;
            if (finalConfig.onRetry) {
                finalConfig.onRetry(attempt, lastError);
            }
            await new Promise((resolve) => setTimeout(resolve, finalDelay));
        }
    }
    throw lastError;
}
function handleError(error, options = {}) {
    const { showToast = true, logError = true, retryable = false, context, } = options;
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const pattern = detectErrorPattern(errorObj);
    trackErrorPattern(errorObj, pattern.category);
    if (logError) {
        console.error("[Error Handler]", {
            error: errorObj,
            category: pattern.category,
            context,
            timestamp: new Date().toISOString(),
        });
    }
    if (showToast) {
        const isRecurring = isRecurringError(errorObj);
        if (isRecurring) {
            (0, use_toast_1.showWarningToast)("Recurring Issue Detected", "This error has occurred multiple times. Please contact support for assistance.");
        }
        else {
            (0, use_toast_1.showErrorToast)(pattern.userMessage, pattern.suggestedActions[0]);
        }
    }
    return pattern;
}
function handleNetworkError(error, context) {
    return handleError(error, {
        context: {
            operation: "network_request",
            ...context,
        },
    });
}
function handleAIError(error, operation) {
    const pattern = handleError(error, {
        context: {
            operation: `ai_${operation}`,
            timestamp: new Date(),
        },
    });
    return {
        retry: pattern.category !== ErrorCategory.VALIDATION,
        fallback: "manual_input",
        pattern,
    };
}
function handleAuthError(error) {
    return handleError(error, {
        context: {
            operation: "authentication",
            timestamp: new Date(),
        },
    });
}
function handleValidationError(errors, showToast = true) {
    if (showToast) {
        const errorCount = Object.keys(errors).length;
        (0, use_toast_1.showErrorToast)("Validation Error", `Please correct ${errorCount} field${errorCount > 1 ? "s" : ""} and try again.`);
    }
    return {
        errors,
        category: ErrorCategory.VALIDATION,
    };
}
function handleDatabaseError(error, operation) {
    return handleError(error, {
        context: {
            operation: `database_${operation}`,
            timestamp: new Date(),
        },
    });
}
function createRecoveryActions(pattern, customActions) {
    const defaultActions = [];
    if (pattern.category === ErrorCategory.NETWORK ||
        pattern.category === ErrorCategory.AI_OPERATION ||
        pattern.category === ErrorCategory.DATABASE ||
        pattern.category === ErrorCategory.SERVER_ERROR) {
        defaultActions.push({
            label: "Try Again",
            action: () => window.location.reload(),
            primary: true,
        });
    }
    if (pattern.category === ErrorCategory.NOT_FOUND) {
        defaultActions.push({
            label: "Go to Dashboard",
            action: () => (window.location.href = "/dashboard"),
            primary: true,
        });
    }
    if (pattern.category === ErrorCategory.AUTHENTICATION ||
        pattern.category === ErrorCategory.AUTHORIZATION) {
        defaultActions.push({
            label: "Sign In",
            action: () => (window.location.href = "/login"),
            primary: true,
        });
    }
    return [...defaultActions, ...(customActions || [])];
}
function getErrorBoundaryState(error, errorInfo) {
    const pattern = detectErrorPattern(error);
    return {
        hasError: true,
        error,
        errorInfo,
        pattern,
    };
}
function isRetryableError(error) {
    const pattern = detectErrorPattern(error);
    return (pattern.category === ErrorCategory.NETWORK ||
        pattern.category === ErrorCategory.AI_OPERATION ||
        pattern.category === ErrorCategory.DATABASE ||
        pattern.category === ErrorCategory.SERVER_ERROR ||
        pattern.category === ErrorCategory.RATE_LIMIT);
}
function getErrorSeverity(category) {
    switch (category) {
        case ErrorCategory.VALIDATION:
        case ErrorCategory.NOT_FOUND:
            return "low";
        case ErrorCategory.NETWORK:
        case ErrorCategory.RATE_LIMIT:
            return "medium";
        case ErrorCategory.AUTHENTICATION:
        case ErrorCategory.AUTHORIZATION:
        case ErrorCategory.AI_OPERATION:
            return "high";
        case ErrorCategory.DATABASE:
        case ErrorCategory.SERVER_ERROR:
            return "critical";
        default:
            return "medium";
    }
}
function shouldNotifyUser(category) {
    const severity = getErrorSeverity(category);
    return severity === "high" || severity === "critical";
}
