/**
 * Synchronization Error Types
 * Provides specific error types for better error handling and debugging
 */

export abstract class SynchronizationError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'validation' | 'network' | 'storage' | 'business' | 'system';
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      context: this.context,
      stack: this.stack
    };
  }
}

export class ValidationError extends SynchronizationError {
  readonly code = 'VALIDATION_FAILED';
  readonly category = 'validation' as const;

  constructor(
    message: string,
    public readonly validationErrors: string[],
    context?: Record<string, any>
  ) {
    super(message, { ...context, validationErrors });
  }
}

export class SchemaValidationError extends ValidationError {
  readonly code = 'SCHEMA_VALIDATION_FAILED';

  constructor(
    schemaType: string,
    errors: string[],
    context?: Record<string, any>
  ) {
    super(
      `Schema validation failed for ${schemaType}`,
      errors,
      { ...context, schemaType }
    );
  }
}

export class EntityValidationError extends ValidationError {
  readonly code = 'ENTITY_VALIDATION_FAILED';

  constructor(
    entityType: string,
    errors: string[],
    context?: Record<string, any>
  ) {
    super(
      `Entity validation failed for ${entityType}`,
      errors,
      { ...context, entityType }
    );
  }
}

export class HighRiskChangeError extends SynchronizationError {
  readonly code = 'HIGH_RISK_CHANGE';
  readonly category = 'business' as const;

  constructor(
    riskLevel: string,
    affectedComponents: string[],
    context?: Record<string, any>
  ) {
    super(
      `Changes deemed too risky (${riskLevel}) - manual review required`,
      { ...context, riskLevel, affectedComponents }
    );
  }
}

export class CircuitBreakerError extends SynchronizationError {
  readonly code = 'CIRCUIT_BREAKER_OPEN';
  readonly category = 'network' as const;

  constructor(
    serviceKey: string,
    failureCount: number,
    context?: Record<string, any>
  ) {
    super(
      `Circuit breaker open for ${serviceKey} (${failureCount} failures)`,
      { ...context, serviceKey, failureCount }
    );
  }
}

export class StorageError extends SynchronizationError {
  readonly code = 'STORAGE_OPERATION_FAILED';
  readonly category = 'storage' as const;

  constructor(
    operation: string,
    details: string,
    context?: Record<string, any>
  ) {
    super(
      `Storage operation failed: ${operation} - ${details}`,
      { ...context, operation }
    );
  }
}

export class RollbackError extends SynchronizationError {
  readonly code = 'ROLLBACK_FAILED';
  readonly category = 'system' as const;

  constructor(
    changeId: string,
    reason: string,
    context?: Record<string, any>
  ) {
    super(
      `Rollback failed for change ${changeId}: ${reason}`,
      { ...context, changeId, rollbackReason: reason }
    );
  }
}

export class ExportError extends SynchronizationError {
  readonly code = 'EXPORT_GENERATION_FAILED';
  readonly category = 'system' as const;

  constructor(
    format: string,
    details: string,
    context?: Record<string, any>
  ) {
    super(
      `Export generation failed for ${format}: ${details}`,
      { ...context, format }
    );
  }
}

/**
 * Error Handler Utility
 */
export class SynchronizationErrorHandler {
  static handle(error: unknown, context?: Record<string, any>): SynchronizationError {
    if (error instanceof SynchronizationError) {
      return error;
    }

    if (error instanceof Error) {
      return new class extends SynchronizationError {
        readonly code = 'UNKNOWN_ERROR';
        readonly category = 'system' as const;
      }(error.message, context, error);
    }

    return new class extends SynchronizationError {
      readonly code = 'UNEXPECTED_ERROR';
      readonly category = 'system' as const;
    }('An unexpected error occurred', { ...context, originalError: error });
  }

  static isRetryable(error: SynchronizationError): boolean {
    const retryableCategories = ['network', 'storage'];
    const retryableCodes = ['CIRCUIT_BREAKER_OPEN', 'STORAGE_OPERATION_FAILED'];
    
    return retryableCategories.includes(error.category) || 
           retryableCodes.includes(error.code);
  }

  static getRetryDelay(error: SynchronizationError, attempt: number): number {
    if (!this.isRetryable(error)) {
      return 0;
    }

    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    
    return delay + jitter;
  }
}