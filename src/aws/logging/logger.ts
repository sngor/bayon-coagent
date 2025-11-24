/**
 * AWS Logging and Monitoring Module
 * 
 * Provides centralized logging with environment-aware output:
 * - Local: Console logging with detailed information
 * - Production: CloudWatch Logs integration with structured logging
 * 
 * Features:
 * - Structured JSON logging
 * - Correlation IDs for request tracing
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Error tracking and context
 */

import { getConfig } from '../config';
import type { Environment } from '../config';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  userId?: string;
  service?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  environment: Environment;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private environment: Environment;
  private defaultContext: LogContext;

  constructor(defaultContext: LogContext = {}) {
    this.environment = getConfig().environment;
    this.defaultContext = defaultContext;
  }

  /**
   * Get current X-Ray trace context if available
   */
  private getTraceContext(): Partial<LogContext> {
    try {
      // Only attempt to get trace context in server environment
      if (typeof window !== 'undefined') {
        return {};
      }

      // Dynamically import X-Ray SDK to avoid issues in environments where it's not available
      const AWSXRay = require('aws-xray-sdk-core');
      const segment = AWSXRay.getSegment();

      if (segment) {
        return {
          traceId: segment.trace_id,
          spanId: segment.id,
          parentSpanId: segment.parent_id,
        };
      }
    } catch (error) {
      // X-Ray not available or no active segment, continue without trace context
    }

    return {};
  }

  /**
   * Determines if a log level should be output based on environment
   */
  private shouldLog(level: LogLevel): boolean {
    const levelPriority: Record<LogLevel, number> = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    };

    const minLevel: Record<Environment, LogLevel> = {
      local: 'DEBUG',
      development: 'INFO',
      production: 'INFO',
    };

    return levelPriority[level] >= levelPriority[minLevel[this.environment]];
  }

  /**
   * Creates a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    // Get current trace context from X-Ray
    const traceContext = this.getTraceContext();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.defaultContext, ...traceContext, ...context },
      environment: this.environment,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  /**
   * Outputs log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    if (this.environment === 'local') {
      this.outputToConsole(entry);
    } else {
      this.outputToCloudWatch(entry);
    }
  }

  /**
   * Outputs log to console with formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    const color = colors[entry.level];
    const prefix = `${color}[${entry.level}]${reset} ${entry.timestamp}`;

    console.log(`${prefix} ${entry.message}`);

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('  Context:', JSON.stringify(entry.context, null, 2));
    }

    if (entry.error) {
      console.error('  Error:', entry.error.name, '-', entry.error.message);
      if (entry.error.stack) {
        console.error('  Stack:', entry.error.stack);
      }
    }
  }

  /**
   * Outputs log to CloudWatch (structured JSON)
   */
  private outputToCloudWatch(entry: LogEntry): void {
    // In production, output structured JSON that CloudWatch can parse
    // CloudWatch Logs agent or Lambda will capture stdout
    console.log(JSON.stringify(entry));
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.output(this.createLogEntry('DEBUG', message, context));
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.output(this.createLogEntry('INFO', message, context));
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.output(this.createLogEntry('WARN', message, context));
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.output(this.createLogEntry('ERROR', message, context, error));
  }

  /**
   * Create a child logger with additional default context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.defaultContext, ...additionalContext });
  }

  /**
   * Log the start of an operation (returns a function to log completion)
   */
  startOperation(operation: string, context?: LogContext): () => void {
    const startTime = Date.now();
    this.debug(`Starting operation: ${operation}`, context);

    return () => {
      const duration = Date.now() - startTime;
      this.debug(`Completed operation: ${operation}`, {
        ...context,
        duration,
      });
    };
  }
}

/**
 * Generate a correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a logger instance with optional default context
 */
export function createLogger(defaultContext?: LogContext): Logger {
  return new Logger(defaultContext);
}

// Export a default logger instance
export const logger = createLogger();

/**
 * Middleware helper to add correlation ID to requests
 */
export function withCorrelationId<T extends (...args: any[]) => any>(
  fn: T,
  service: string
): T {
  return ((...args: any[]) => {
    const correlationId = generateCorrelationId();
    const contextLogger = logger.child({ correlationId, service });

    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          contextLogger.error(`Error in ${service}`, error, {
            operation: fn.name,
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      contextLogger.error(`Error in ${service}`, error as Error, {
        operation: fn.name,
      });
      throw error;
    }
  }) as T;
}
