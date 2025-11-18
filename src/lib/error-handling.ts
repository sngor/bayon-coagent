/**
 * Smart Error Handling System with Recovery
 * 
 * Provides intelligent error messages with context, suggested actions,
 * retry mechanisms with exponential backoff, and error pattern detection.
 * 
 * Validates: Requirements 27.3
 */

import { showErrorToast, showWarningToast } from "@/hooks/use-toast";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  context?: ErrorContext;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface ErrorPattern {
  pattern: RegExp | string;
  category: ErrorCategory;
  userMessage: string;
  suggestedActions: string[];
  recoveryActions?: RecoveryAction[];
}

export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  AI_OPERATION = "ai_operation",
  DATABASE = "database",
  RATE_LIMIT = "rate_limit",
  NOT_FOUND = "not_found",
  SERVER_ERROR = "server_error",
  CLIENT_ERROR = "client_error",
  UNKNOWN = "unknown",
}

// ============================================================================
// Error Pattern Detection
// ============================================================================

const ERROR_PATTERNS: ErrorPattern[] = [
  // Network Errors
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

  // Authentication Errors
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

  // Authorization Errors
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

  // Rate Limiting
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

  // Validation Errors
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

  // AI Operation Errors
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

  // Database Errors
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

  // Not Found Errors
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

  // Server Errors
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

// ============================================================================
// Error Pattern Detection
// ============================================================================

export function detectErrorPattern(error: Error): ErrorPattern {
  const errorMessage = error.message || error.toString();

  for (const pattern of ERROR_PATTERNS) {
    const regex =
      typeof pattern.pattern === "string"
        ? new RegExp(pattern.pattern, "i")
        : pattern.pattern;

    if (regex.test(errorMessage)) {
      return pattern;
    }
  }

  // Default unknown error pattern
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

// ============================================================================
// Error Statistics and Pattern Tracking
// ============================================================================

interface ErrorStats {
  count: number;
  lastOccurrence: Date;
  category: ErrorCategory;
  pattern: string;
}

const errorStatistics = new Map<string, ErrorStats>();

export function trackErrorPattern(error: Error, category: ErrorCategory) {
  const key = `${category}:${error.message.substring(0, 50)}`;

  const existing = errorStatistics.get(key);
  if (existing) {
    existing.count++;
    existing.lastOccurrence = new Date();
  } else {
    errorStatistics.set(key, {
      count: 1,
      lastOccurrence: new Date(),
      category,
      pattern: error.message,
    });
  }
}

export function getErrorStatistics(): Map<string, ErrorStats> {
  return new Map(errorStatistics);
}

export function isRecurringError(error: Error, threshold = 3): boolean {
  const pattern = detectErrorPattern(error);
  const key = `${pattern.category}:${error.message.substring(0, 50)}`;
  const stats = errorStatistics.get(key);

  return stats ? stats.count >= threshold : false;
}

// ============================================================================
// Exponential Backoff Retry Mechanism
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain error types
      const pattern = detectErrorPattern(lastError);
      if (
        pattern.category === ErrorCategory.VALIDATION ||
        pattern.category === ErrorCategory.AUTHORIZATION ||
        pattern.category === ErrorCategory.NOT_FOUND
      ) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;

      // Call retry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError!;
}

// ============================================================================
// Smart Error Handler
// ============================================================================

export function handleError(
  error: unknown,
  options: ErrorHandlingOptions = {}
): ErrorPattern {
  const {
    showToast = true,
    logError = true,
    retryable = false,
    context,
  } = options;

  // Convert to Error object if needed
  const errorObj =
    error instanceof Error ? error : new Error(String(error));

  // Detect error pattern
  const pattern = detectErrorPattern(errorObj);

  // Track error statistics
  trackErrorPattern(errorObj, pattern.category);

  // Log error if enabled
  if (logError) {
    console.error("[Error Handler]", {
      error: errorObj,
      category: pattern.category,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Show toast notification if enabled
  if (showToast) {
    const isRecurring = isRecurringError(errorObj);

    if (isRecurring) {
      showWarningToast(
        "Recurring Issue Detected",
        "This error has occurred multiple times. Please contact support for assistance."
      );
    } else {
      showErrorToast(pattern.userMessage, pattern.suggestedActions[0]);
    }
  }

  return pattern;
}

// ============================================================================
// Specialized Error Handlers
// ============================================================================

export function handleNetworkError(error: Error, context?: ErrorContext) {
  return handleError(error, {
    context: {
      operation: "network_request",
      ...context,
    },
  });
}

export function handleAIError(error: Error, operation: string) {
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

export function handleAuthError(error: Error) {
  return handleError(error, {
    context: {
      operation: "authentication",
      timestamp: new Date(),
    },
  });
}

export function handleValidationError(
  errors: Record<string, string[]>,
  showToast = true
) {
  if (showToast) {
    const errorCount = Object.keys(errors).length;
    showErrorToast(
      "Validation Error",
      `Please correct ${errorCount} field${errorCount > 1 ? "s" : ""} and try again.`
    );
  }

  return {
    errors,
    category: ErrorCategory.VALIDATION,
  };
}

export function handleDatabaseError(error: Error, operation: string) {
  return handleError(error, {
    context: {
      operation: `database_${operation}`,
      timestamp: new Date(),
    },
  });
}

// ============================================================================
// Recovery Action Helpers
// ============================================================================

export function createRecoveryActions(
  pattern: ErrorPattern,
  customActions?: RecoveryAction[]
): RecoveryAction[] {
  const defaultActions: RecoveryAction[] = [];

  // Add retry action for retryable errors
  if (
    pattern.category === ErrorCategory.NETWORK ||
    pattern.category === ErrorCategory.AI_OPERATION ||
    pattern.category === ErrorCategory.DATABASE ||
    pattern.category === ErrorCategory.SERVER_ERROR
  ) {
    defaultActions.push({
      label: "Try Again",
      action: () => window.location.reload(),
      primary: true,
    });
  }

  // Add navigation actions
  if (pattern.category === ErrorCategory.NOT_FOUND) {
    defaultActions.push({
      label: "Go to Dashboard",
      action: () => (window.location.href = "/dashboard"),
      primary: true,
    });
  }

  // Add auth actions
  if (
    pattern.category === ErrorCategory.AUTHENTICATION ||
    pattern.category === ErrorCategory.AUTHORIZATION
  ) {
    defaultActions.push({
      label: "Sign In",
      action: () => (window.location.href = "/login"),
      primary: true,
    });
  }

  return [...defaultActions, ...(customActions || [])];
}

// ============================================================================
// Error Boundary Helper
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  pattern: ErrorPattern | null;
}

export function getErrorBoundaryState(
  error: Error,
  errorInfo: React.ErrorInfo
): ErrorBoundaryState {
  const pattern = detectErrorPattern(error);

  return {
    hasError: true,
    error,
    errorInfo,
    pattern,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function isRetryableError(error: Error): boolean {
  const pattern = detectErrorPattern(error);
  return (
    pattern.category === ErrorCategory.NETWORK ||
    pattern.category === ErrorCategory.AI_OPERATION ||
    pattern.category === ErrorCategory.DATABASE ||
    pattern.category === ErrorCategory.SERVER_ERROR ||
    pattern.category === ErrorCategory.RATE_LIMIT
  );
}

export function getErrorSeverity(
  category: ErrorCategory
): "low" | "medium" | "high" | "critical" {
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

export function shouldNotifyUser(category: ErrorCategory): boolean {
  // Always notify for critical errors
  const severity = getErrorSeverity(category);
  return severity === "high" || severity === "critical";
}
