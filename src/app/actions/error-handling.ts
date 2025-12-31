/**
 * Centralized Error Handling for Server Actions
 * 
 * Provides consistent error handling, categorization, and user-friendly
 * error messages across all server actions.
 */

import { z } from 'zod';

// ============================================================================
// Error Types and Interfaces
// ============================================================================

export interface AWSErrorContext {
  service: 'bedrock' | 'dynamodb' | 's3' | 'cognito' | 'network' | 'unknown';
  operation?: string;
  retryable: boolean;
  statusCode?: number;
}

export interface ErrorResponse {
  message: string;
  context: AWSErrorContext;
  originalError?: string;
  retryAfter?: number; // seconds
  suggestedActions?: string[];
}

export interface RetryableError extends Error {
  retryable: boolean;
  retryAfter?: number;
}

// ============================================================================
// Error Categorization
// ============================================================================

const categorizeError = (error: unknown): AWSErrorContext => {
  if (!(error instanceof Error)) {
    return { service: 'unknown', retryable: false };
  }

  const message = error.message.toLowerCase();
  const errorName = error.name?.toLowerCase() || '';
  
  // Bedrock errors
  if (message.includes('bedrock') || errorName.includes('bedrock')) {
    if (message.includes('throttl') || message.includes('rate')) {
      return { service: 'bedrock', retryable: true, statusCode: 429 };
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return { service: 'bedrock', retryable: false, statusCode: 400 };
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return { service: 'bedrock', retryable: true, statusCode: 408 };
    }
    if (message.includes('filtered') || message.includes('content policy')) {
      return { service: 'bedrock', retryable: false, statusCode: 400 };
    }
    return { service: 'bedrock', retryable: true, statusCode: 500 };
  }
  
  // DynamoDB errors
  if (message.includes('dynamodb') || errorName.includes('dynamodb')) {
    if (message.includes('provisioned throughput') || message.includes('throttl')) {
      return { service: 'dynamodb', retryable: true, statusCode: 429 };
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return { service: 'dynamodb', retryable: false, statusCode: 400 };
    }
    if (message.includes('not found') || message.includes('does not exist')) {
      return { service: 'dynamodb', retryable: false, statusCode: 404 };
    }
    return { service: 'dynamodb', retryable: true, statusCode: 500 };
  }
  
  // S3 errors
  if (message.includes('s3') || message.includes('bucket') || errorName.includes('s3')) {
    if (message.includes('access denied') || message.includes('forbidden')) {
      return { service: 's3', retryable: false, statusCode: 403 };
    }
    if (message.includes('not found') || message.includes('no such')) {
      return { service: 's3', retryable: false, statusCode: 404 };
    }
    if (message.includes('slow down') || message.includes('throttl')) {
      return { service: 's3', retryable: true, statusCode: 429 };
    }
    return { service: 's3', retryable: true, statusCode: 500 };
  }
  
  // Cognito errors
  if (message.includes('cognito') || message.includes('authentication') || errorName.includes('cognito')) {
    if (message.includes('user not found') || message.includes('usernotfound')) {
      return { service: 'cognito', retryable: false, statusCode: 404 };
    }
    if (message.includes('invalid password') || message.includes('incorrect')) {
      return { service: 'cognito', retryable: false, statusCode: 401 };
    }
    if (message.includes('expired') || message.includes('token')) {
      return { service: 'cognito', retryable: false, statusCode: 401 };
    }
    return { service: 'cognito', retryable: false, statusCode: 400 };
  }
  
  // Network errors
  if (message.includes('network') || message.includes('econnrefused') || 
      message.includes('timeout') || message.includes('fetch')) {
    return { service: 'network', retryable: true, statusCode: 503 };
  }
  
  // Parse errors (likely client-side issues)
  if (message.includes('json') || message.includes('parse') || message.includes('syntax')) {
    return { service: 'unknown', retryable: false, statusCode: 400 };
  }
  
  return { service: 'unknown', retryable: false, statusCode: 500 };
};

// ============================================================================
// Error Message Generation
// ============================================================================

const getErrorMessage = (error: unknown, context: AWSErrorContext, defaultMessage: string): string => {
  const isDev = process.env.NODE_ENV === 'development';
  const originalErrorMessage = error instanceof Error ? error.message : String(error);
  const devSuffix = isDev ? ` (Debug: ${originalErrorMessage})` : '';

  const errorMessages = {
    bedrock: {
      throttling: 'The AI service is currently busy. Please try again in a moment.',
      filtered: 'The AI was unable to process this request due to content safety filters. Please try a different approach.',
      validation: 'The request contains invalid data. Please check your input and try again.',
      timeout: 'The AI request took too long to process. Please try again.',
      empty: 'The AI returned an empty response. Please try refining your request.',
      default: 'AI service is temporarily unavailable. Please try again.',
    },
    dynamodb: {
      throttling: 'Database is temporarily busy. Please try again in a moment.',
      validation: 'Invalid data format. Please check your input.',
      notFound: 'The requested data was not found.',
      default: 'Database service is temporarily unavailable. Please try again.',
    },
    s3: {
      accessDenied: 'You do not have permission to access this file.',
      notFound: 'The requested file was not found.',
      throttling: 'File service is temporarily busy. Please try again.',
      default: 'File storage service is temporarily unavailable. Please try again.',
    },
    cognito: {
      userNotFound: 'No account found with this email address.',
      invalidPassword: 'Invalid email or password.',
      expired: 'Your session has expired. Please sign in again.',
      default: 'Authentication service error. Please try signing in again.',
    },
    network: {
      default: 'Network connection error. Please check your internet connection and try again.',
    },
    unknown: {
      default: defaultMessage,
    }
  };

  if (error instanceof Error) {
    const lowerCaseMessage = error.message.toLowerCase();
    
    // Service-specific error handling
    const serviceMessages = errorMessages[context.service];
    if (serviceMessages) {
      // Check for specific error types within the service
      if (context.service === 'bedrock') {
        if (lowerCaseMessage.includes('throttl') || lowerCaseMessage.includes('rate')) {
          return serviceMessages.throttling + devSuffix;
        }
        if (lowerCaseMessage.includes('filtered') || lowerCaseMessage.includes('content policy')) {
          return serviceMessages.filtered + devSuffix;
        }
        if (lowerCaseMessage.includes('validation') || lowerCaseMessage.includes('invalid')) {
          return serviceMessages.validation + devSuffix;
        }
        if (lowerCaseMessage.includes('timeout') || lowerCaseMessage.includes('timed out')) {
          return serviceMessages.timeout + devSuffix;
        }
        if (lowerCaseMessage.includes('empty')) {
          return serviceMessages.empty + devSuffix;
        }
      } else if (context.service === 'dynamodb') {
        if (lowerCaseMessage.includes('throttl') || lowerCaseMessage.includes('provisioned throughput')) {
          return serviceMessages.throttling + devSuffix;
        }
        if (lowerCaseMessage.includes('validation') || lowerCaseMessage.includes('invalid')) {
          return serviceMessages.validation + devSuffix;
        }
        if (lowerCaseMessage.includes('not found')) {
          return serviceMessages.notFound + devSuffix;
        }
      } else if (context.service === 's3') {
        if (lowerCaseMessage.includes('access denied') || lowerCaseMessage.includes('forbidden')) {
          return serviceMessages.accessDenied + devSuffix;
        }
        if (lowerCaseMessage.includes('not found')) {
          return serviceMessages.notFound + devSuffix;
        }
        if (lowerCaseMessage.includes('throttl') || lowerCaseMessage.includes('slow down')) {
          return serviceMessages.throttling + devSuffix;
        }
      } else if (context.service === 'cognito') {
        if (lowerCaseMessage.includes('user not found') || lowerCaseMessage.includes('usernotfound')) {
          return serviceMessages.userNotFound + devSuffix;
        }
        if (lowerCaseMessage.includes('invalid password') || lowerCaseMessage.includes('incorrect')) {
          return serviceMessages.invalidPassword + devSuffix;
        }
        if (lowerCaseMessage.includes('expired') || lowerCaseMessage.includes('token')) {
          return serviceMessages.expired + devSuffix;
        }
      }
      
      return serviceMessages.default + devSuffix;
    }
  }

  return defaultMessage + devSuffix;
};

// ============================================================================
// Suggested Actions Generation
// ============================================================================

const getSuggestedActions = (context: AWSErrorContext): string[] => {
  const actions: Record<string, string[]> = {
    bedrock: [
      'Try rephrasing your request',
      'Check if your content follows content guidelines',
      'Wait a moment and try again',
    ],
    dynamodb: [
      'Check your internet connection',
      'Verify your data is correctly formatted',
      'Try again in a few moments',
    ],
    s3: [
      'Check file permissions',
      'Verify the file exists',
      'Try uploading a smaller file',
    ],
    cognito: [
      'Verify your email and password',
      'Check if your account is confirmed',
      'Try resetting your password',
    ],
    network: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again',
    ],
    unknown: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists',
    ],
  };

  return actions[context.service] || actions.unknown;
};

// ============================================================================
// Main Error Handler
// ============================================================================

export function handleAWSError(error: unknown, defaultMessage: string): ErrorResponse {
  const context = categorizeError(error);
  const message = getErrorMessage(error, context, defaultMessage);
  const suggestedActions = getSuggestedActions(context);
  
  // Calculate retry delay for retryable errors
  let retryAfter: number | undefined;
  if (context.retryable) {
    switch (context.service) {
      case 'bedrock':
        retryAfter = context.statusCode === 429 ? 60 : 30; // Rate limit vs other errors
        break;
      case 'dynamodb':
        retryAfter = 30;
        break;
      case 's3':
        retryAfter = 15;
        break;
      case 'network':
        retryAfter = 10;
        break;
      default:
        retryAfter = 30;
    }
  }
  
  // Log the error for monitoring
  console.error('AWS Service Error:', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
    timestamp: new Date().toISOString(),
    userMessage: message,
  });

  return {
    message,
    context,
    originalError: error instanceof Error ? error.message : String(error),
    retryAfter,
    suggestedActions,
  };
}

// ============================================================================
// Retry Logic
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const context = categorizeError(error);
      if (!context.retryable || attempt === config.maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );
      
      const jitteredDelay = delay + Math.random() * 1000;
      
      console.warn(`Retrying operation after ${jitteredDelay}ms (attempt ${attempt}/${config.maxAttempts}):`, error);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
}

// ============================================================================
// Error Boundary Integration
// ============================================================================

export function createRetryableError(message: string, retryable: boolean = true, retryAfter?: number): RetryableError {
  const error = new Error(message) as RetryableError;
  error.retryable = retryable;
  error.retryAfter = retryAfter;
  return error;
}

// ============================================================================
// Validation Error Helpers
// ============================================================================

export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  
  error.issues.forEach(issue => {
    const field = issue.path.join('.');
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(issue.message);
  });
  
  return fieldErrors;
}

export function createValidationErrorMessage(errors: Record<string, string[]>): string {
  const errorCount = Object.keys(errors).length;
  if (errorCount === 1) {
    const field = Object.keys(errors)[0];
    return `${field}: ${errors[field][0]}`;
  }
  return `Please fix ${errorCount} validation errors and try again.`;
}