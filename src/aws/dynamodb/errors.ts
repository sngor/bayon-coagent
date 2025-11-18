/**
 * DynamoDB Error Handling
 * 
 * Provides error types and utilities for handling DynamoDB errors.
 */

/**
 * Custom error class for DynamoDB operations
 */
export class DynamoDBError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DynamoDBError';
  }
}

/**
 * Error thrown when an item is not found
 */
export class ItemNotFoundError extends DynamoDBError {
  constructor(pk: string, sk: string) {
    super(`Item not found: PK=${pk}, SK=${sk}`, 'ItemNotFound', 404, false);
    this.name = 'ItemNotFoundError';
  }
}

/**
 * Error thrown when a conditional check fails
 */
export class ConditionalCheckFailedError extends DynamoDBError {
  constructor(message: string = 'Conditional check failed') {
    super(message, 'ConditionalCheckFailedException', 400, false);
    this.name = 'ConditionalCheckFailedError';
  }
}

/**
 * Error thrown when throughput is exceeded
 */
export class ThroughputExceededError extends DynamoDBError {
  constructor(message: string = 'Throughput exceeded') {
    super(message, 'ProvisionedThroughputExceededException', 400, true);
    this.name = 'ThroughputExceededError';
  }
}

/**
 * Error thrown when a validation error occurs
 */
export class ValidationError extends DynamoDBError {
  constructor(message: string) {
    super(message, 'ValidationException', 400, false);
    this.name = 'ValidationError';
  }
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (error instanceof DynamoDBError) {
    return error.retryable;
  }

  // Check for AWS SDK error codes that are retryable
  const retryableCodes = [
    'ProvisionedThroughputExceededException',
    'ThrottlingException',
    'RequestLimitExceeded',
    'InternalServerError',
    'ServiceUnavailable',
  ];

  return retryableCodes.includes(error.name || error.code);
}

/**
 * Wraps AWS SDK errors into custom error types
 */
export function wrapDynamoDBError(error: any): DynamoDBError {
  const errorName = error.name || error.code;
  const errorMessage = error.message || 'Unknown DynamoDB error';

  switch (errorName) {
    case 'ConditionalCheckFailedException':
      return new ConditionalCheckFailedError(errorMessage);
    
    case 'ProvisionedThroughputExceededException':
    case 'ThrottlingException':
      return new ThroughputExceededError(errorMessage);
    
    case 'ValidationException':
      return new ValidationError(errorMessage);
    
    case 'ResourceNotFoundException':
      return new DynamoDBError(
        errorMessage,
        errorName,
        404,
        false,
        error
      );
    
    default:
      // Check if it's a network or service error (retryable)
      const retryable = isRetryableError(error);
      return new DynamoDBError(
        errorMessage,
        errorName,
        error.$metadata?.httpStatusCode,
        retryable,
        error
      );
  }
}
