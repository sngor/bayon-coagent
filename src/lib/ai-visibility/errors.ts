/**
 * AI Visibility Error Handling
 * 
 * Comprehensive error handling for AI visibility optimization system
 * Requirements: All error handling scenarios
 */

/**
 * Base error class for AI Visibility system
 */
export class AIVisibilityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public context?: Record<string, any>,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIVisibilityError';
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * Schema generation errors
 */
export class SchemaGenerationError extends AIVisibilityError {
  constructor(
    message: string,
    public schemaType?: string,
    public validationErrors?: string[],
    originalError?: Error
  ) {
    super(
      message,
      'SCHEMA_GENERATION_ERROR',
      400,
      false,
      { schemaType, validationErrors },
      originalError
    );
    this.name = 'SchemaGenerationError';
  }
}

/**
 * AI platform API errors
 */
export class AIPlatformError extends AIVisibilityError {
  constructor(
    message: string,
    public platform: string,
    public apiError?: string,
    retryable: boolean = true,
    originalError?: Error
  ) {
    super(
      message,
      'AI_PLATFORM_ERROR',
      503,
      retryable,
      { platform, apiError },
      originalError
    );
    this.name = 'AIPlatformError';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AIVisibilityError {
  constructor(
    message: string,
    public platform: string,
    public retryAfter?: number,
    originalError?: Error
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      429,
      true,
      { platform, retryAfter },
      originalError
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Schema validation errors
 */
export class SchemaValidationError extends AIVisibilityError {
  constructor(
    message: string,
    public schemaType: string,
    public validationErrors: string[],
    public suggestions?: string[],
    originalError?: Error
  ) {
    super(
      message,
      'SCHEMA_VALIDATION_ERROR',
      400,
      false,
      { schemaType, validationErrors, suggestions },
      originalError
    );
    this.name = 'SchemaValidationError';
  }
}

/**
 * Knowledge graph errors
 */
export class KnowledgeGraphError extends AIVisibilityError {
  constructor(
    message: string,
    public entityType?: string,
    public relationshipError?: string,
    originalError?: Error
  ) {
    super(
      message,
      'KNOWLEDGE_GRAPH_ERROR',
      500,
      true,
      { entityType, relationshipError },
      originalError
    );
    this.name = 'KnowledgeGraphError';
  }
}

/**
 * Export format errors
 */
export class ExportFormatError extends AIVisibilityError {
  constructor(
    message: string,
    public format: string,
    public formatErrors?: string[],
    originalError?: Error
  ) {
    super(
      message,
      'EXPORT_FORMAT_ERROR',
      400,
      false,
      { format, formatErrors },
      originalError
    );
    this.name = 'ExportFormatError';
  }
}

/**
 * Website analysis errors
 */
export class WebsiteAnalysisError extends AIVisibilityError {
  constructor(
    message: string,
    public url?: string,
    public crawlError?: string,
    retryable: boolean = true,
    originalError?: Error
  ) {
    super(
      message,
      'WEBSITE_ANALYSIS_ERROR',
      503,
      retryable,
      { url, crawlError },
      originalError
    );
    this.name = 'WebsiteAnalysisError';
  }
}

/**
 * Content optimization errors
 */
export class ContentOptimizationError extends AIVisibilityError {
  constructor(
    message: string,
    public contentType?: string,
    public optimizationErrors?: string[],
    originalError?: Error
  ) {
    super(
      message,
      'CONTENT_OPTIMIZATION_ERROR',
      400,
      false,
      { contentType, optimizationErrors },
      originalError
    );
    this.name = 'ContentOptimizationError';
  }
}

/**
 * Data persistence errors
 */
export class DataPersistenceError extends AIVisibilityError {
  constructor(
    message: string,
    public operation: string,
    public entityType?: string,
    retryable: boolean = true,
    originalError?: Error
  ) {
    super(
      message,
      'DATA_PERSISTENCE_ERROR',
      500,
      retryable,
      { operation, entityType },
      originalError
    );
    this.name = 'DataPersistenceError';
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends AIVisibilityError {
  constructor(
    message: string,
    public configType: string,
    public missingFields?: string[],
    originalError?: Error
  ) {
    super(
      message,
      'CONFIGURATION_ERROR',
      400,
      false,
      { configType, missingFields },
      originalError
    );
    this.name = 'ConfigurationError';
  }
}

/**
 * Service unavailable errors
 */
export class ServiceUnavailableError extends AIVisibilityError {
  constructor(
    message: string,
    public service: string,
    public estimatedRecoveryTime?: number,
    originalError?: Error
  ) {
    super(
      message,
      'SERVICE_UNAVAILABLE_ERROR',
      503,
      true,
      { service, estimatedRecoveryTime },
      originalError
    );
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Error categorization utility
 */
export function categorizeError(error: any): {
  category: 'client' | 'server' | 'network' | 'rate_limit' | 'configuration';
  retryable: boolean;
  retryDelay?: number;
} {
  if (error instanceof RateLimitError) {
    return {
      category: 'rate_limit',
      retryable: true,
      retryDelay: error.retryAfter || 60000, // Default 1 minute
    };
  }

  if (error instanceof ConfigurationError || error instanceof SchemaValidationError) {
    return {
      category: 'configuration',
      retryable: false,
    };
  }

  if (error instanceof AIPlatformError || error instanceof ServiceUnavailableError) {
    return {
      category: 'network',
      retryable: true,
      retryDelay: 5000, // 5 seconds
    };
  }

  if (error instanceof AIVisibilityError) {
    return {
      category: error.statusCode >= 500 ? 'server' : 'client',
      retryable: error.retryable,
      retryDelay: error.retryable ? 2000 : undefined,
    };
  }

  // Unknown error - treat as server error with retry
  return {
    category: 'server',
    retryable: true,
    retryDelay: 3000,
  };
}

/**
 * Error recovery suggestions
 */
export function getErrorRecoverySteps(error: AIVisibilityError): string[] {
  const steps: string[] = [];

  switch (error.code) {
    case 'SCHEMA_GENERATION_ERROR':
      steps.push(
        'Check that all required profile fields are populated',
        'Verify that the schema type is supported',
        'Review validation errors and fix data issues',
        'Try regenerating with a simpler schema configuration'
      );
      break;

    case 'AI_PLATFORM_ERROR':
      steps.push(
        'Check your internet connection',
        'Verify API credentials are valid and not expired',
        'Try again in a few minutes - the service may be temporarily unavailable',
        'Contact support if the issue persists'
      );
      break;

    case 'RATE_LIMIT_ERROR':
      const rateLimitError = error as RateLimitError;
      const waitTime = rateLimitError.retryAfter ? Math.ceil(rateLimitError.retryAfter / 1000) : 60;
      steps.push(
        `Wait ${waitTime} seconds before trying again`,
        'Consider reducing the frequency of API calls',
        'Upgrade to a higher tier plan if available',
        'Implement request queuing to avoid rate limits'
      );
      break;

    case 'SCHEMA_VALIDATION_ERROR':
      const validationError = error as SchemaValidationError;
      steps.push(
        'Review the validation errors listed below',
        'Check Schema.org documentation for the correct format',
        'Ensure all required fields are present and properly formatted',
        'Use the Schema.org validator to test your markup'
      );
      if (validationError.suggestions) {
        steps.push(...validationError.suggestions);
      }
      break;

    case 'WEBSITE_ANALYSIS_ERROR':
      steps.push(
        'Verify the website URL is correct and accessible',
        'Check that the website is not blocking crawlers',
        'Ensure the website has proper SSL certificates',
        'Try analyzing a different page on the same site'
      );
      break;

    case 'EXPORT_FORMAT_ERROR':
      steps.push(
        'Check that the selected export format is supported',
        'Verify that all required data is available for export',
        'Try exporting in a different format',
        'Review the format-specific requirements'
      );
      break;

    case 'DATA_PERSISTENCE_ERROR':
      steps.push(
        'Check your internet connection',
        'Try the operation again in a few moments',
        'Verify that you have sufficient storage quota',
        'Contact support if data loss is suspected'
      );
      break;

    case 'CONFIGURATION_ERROR':
      const configError = error as ConfigurationError;
      steps.push(
        'Review your configuration settings',
        'Ensure all required fields are filled out',
        'Check that API keys and credentials are valid',
        'Refer to the setup documentation for guidance'
      );
      if (configError.missingFields) {
        steps.push(`Missing required fields: ${configError.missingFields.join(', ')}`);
      }
      break;

    case 'SERVICE_UNAVAILABLE_ERROR':
      const serviceError = error as ServiceUnavailableError;
      const recoveryTime = serviceError.estimatedRecoveryTime 
        ? Math.ceil(serviceError.estimatedRecoveryTime / 60000) 
        : 5;
      steps.push(
        `The ${serviceError.service} service is temporarily unavailable`,
        `Estimated recovery time: ${recoveryTime} minutes`,
        'Try again later or use alternative features',
        'Check the system status page for updates'
      );
      break;

    default:
      steps.push(
        'Try the operation again',
        'Check your internet connection',
        'Refresh the page and try again',
        'Contact support if the problem continues'
      );
  }

  return steps;
}

/**
 * Error logging utility
 */
export function logError(error: AIVisibilityError, context?: Record<string, any>) {
  const logData = {
    ...error.toJSON(),
    timestamp: new Date().toISOString(),
    context,
  };

  // In production, this would send to CloudWatch or another logging service
  console.error('[AIVisibility Error]', logData);

  // For development, also log the full error
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }
}

/**
 * Wrap unknown errors in AIVisibilityError
 */
export function wrapError(error: any, defaultMessage: string = 'An unexpected error occurred'): AIVisibilityError {
  if (error instanceof AIVisibilityError) {
    return error;
  }

  // Handle common error types
  if (error?.name === 'ValidationError') {
    return new SchemaValidationError(
      error.message || 'Validation failed',
      'unknown',
      [error.message],
      undefined,
      error
    );
  }

  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
    return new ServiceUnavailableError(
      'Network connection failed',
      'network',
      undefined,
      error
    );
  }

  if (error?.status === 429 || error?.statusCode === 429) {
    return new RateLimitError(
      'Rate limit exceeded',
      'unknown',
      error.retryAfter,
      error
    );
  }

  // Default to generic AI visibility error
  return new AIVisibilityError(
    error?.message || defaultMessage,
    'UNKNOWN_ERROR',
    500,
    true,
    { originalErrorName: error?.name, originalErrorCode: error?.code },
    error
  );
}