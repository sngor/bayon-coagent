/**
 * Property-Based Tests for Error Logging
 * 
 * Feature: ai-model-optimization, Property 20: Error logs contain debugging information
 * Validates: Requirements 5.5
 * 
 * Tests that all error logs include model ID, flow name, error message,
 * and input characteristics for debugging purposes.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { BEDROCK_MODELS } from '../flow-base';
import { 
  ExecutionLogger, 
  createExecutionLogger,
  type ExecutionMetadata 
} from '../execution-logger';

describe('Error Logging Property Tests', () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // Spy on console methods to capture log output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  /**
   * Property 20: Error logs contain debugging information
   * For any AI flow error, the error log should include model ID, flow name,
   * error message, and input characteristics
   */
  it('Property 20: error logs contain all required debugging information', () => {
    fc.assert(
      fc.property(
        // Generate random flow names
        fc.constantFrom(
          'generateBlogPost',
          'analyzeReviewSentiment',
          'runNapAudit',
          'findCompetitors',
          'generateMarketingPlan',
          'generateSocialMediaPost',
          'listingDescriptionGenerator'
        ),
        // Generate random model IDs
        fc.constantFrom(
          BEDROCK_MODELS.HAIKU,
          BEDROCK_MODELS.SONNET_3_5_V2,
          BEDROCK_MODELS.OPUS
        ),
        // Generate random execution metadata
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
          topP: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
        }),
        // Generate random error information
        fc.record({
          message: fc.string({ minLength: 10, maxLength: 200 }),
          code: fc.option(
            fc.constantFrom('ThrottlingException', 'ValidationException', 'ServiceException'),
            { nil: undefined }
          ),
          statusCode: fc.option(
            fc.constantFrom(400, 429, 500, 503),
            { nil: undefined }
          ),
        }),
        (flowName, modelId, metadata, errorInfo) => {
          // Clear spies before each iteration
          consoleLogSpy.mockClear();
          consoleErrorSpy.mockClear();
          
          // Create execution logger
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Create error
          const error = new Error(errorInfo.message);
          if (errorInfo.code) {
            (error as any).code = errorInfo.code;
          }
          if (errorInfo.statusCode) {
            (error as any).statusCode = errorInfo.statusCode;
          }

          // Log the error
          logger.logError(error, errorInfo.code, errorInfo.statusCode);

          // Verify that console.log was called (logger outputs to console)
          expect(consoleLogSpy).toHaveBeenCalled();

          // Get the logged output
          const logCalls = consoleLogSpy.mock.calls;
          expect(logCalls.length).toBeGreaterThan(0);

          // Find the error log entry (should be a JSON string)
          const errorLogCall = logCalls.find(call => {
            const logStr = call[0];
            return typeof logStr === 'string' && logStr.includes('"level":"ERROR"');
          });

          expect(errorLogCall).toBeDefined();
          
          // Parse the log entry
          const logEntry = JSON.parse(errorLogCall![0] as string);

          // Verify message contains flow name
          expect(logEntry.message).toContain(flowName);

          // Verify context contains all required debugging information
          expect(logEntry.context).toBeDefined();
          
          // Model ID must be present
          expect(logEntry.context.modelId).toBe(modelId);
          
          // Flow name must be present
          expect(logEntry.context.flowName).toBe(flowName);
          
          // Error type must be present
          expect(logEntry.context.errorType).toBeDefined();
          
          // Execution time must be present and positive
          expect(logEntry.context.executionTimeMs).toBeDefined();
          expect(logEntry.context.executionTimeMs).toBeGreaterThanOrEqual(0);
          
          // Retry count must be present
          expect(logEntry.context.retryCount).toBeDefined();
          expect(logEntry.context.retryCount).toBeGreaterThanOrEqual(0);
          
          // Feature category must be present
          expect(logEntry.context.featureCategory).toBe(metadata.featureCategory);
          
          // Temperature must be present
          expect(logEntry.context.temperature).toBe(metadata.temperature);
          
          // Max tokens must be present
          expect(logEntry.context.maxTokens).toBe(metadata.maxTokens);
          
          // If error code exists, it should be logged
          if (errorInfo.code) {
            expect(logEntry.context.errorCode).toBe(errorInfo.code);
          }
          
          // If status code exists, it should be logged
          if (errorInfo.statusCode) {
            expect(logEntry.context.statusCode).toBe(errorInfo.statusCode);
          }
          
          // If userId exists, it should be logged
          if (metadata.userId) {
            expect(logEntry.context.userId).toBe(metadata.userId);
          }
          
          // Error object should be present
          expect(logEntry.error).toBeDefined();
          expect(logEntry.error.message).toBe(errorInfo.message);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error logs include retry count
   */
  it('logs retry count correctly in error logs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(BEDROCK_MODELS.HAIKU, BEDROCK_MODELS.SONNET_3_5_V2),
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
        }),
        fc.integer({ min: 0, max: 5 }),
        (flowName, modelId, metadata, retryCount) => {
          // Clear spies before each iteration
          consoleLogSpy.mockClear();
          
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Simulate retries
          for (let i = 0; i < retryCount; i++) {
            logger.incrementRetry();
          }

          // Log error
          logger.logError(new Error('Test error'));

          // Verify error was logged with correct retry count
          expect(consoleLogSpy).toHaveBeenCalled();
          
          const logCalls = consoleLogSpy.mock.calls;
          const errorLogCall = logCalls.find(call => {
            const logStr = call[0];
            return typeof logStr === 'string' && logStr.includes('"level":"ERROR"');
          });
          
          expect(errorLogCall).toBeDefined();
          const logEntry = JSON.parse(errorLogCall![0] as string);
          
          expect(logEntry.context.retryCount).toBe(retryCount);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Error logs include error type and message
   */
  it('logs error type and message for all error types', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(BEDROCK_MODELS.HAIKU, BEDROCK_MODELS.SONNET_3_5_V2),
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
        }),
        fc.record({
          name: fc.constantFrom('Error', 'TypeError', 'ValidationError', 'BedrockError'),
          message: fc.string({ minLength: 10, maxLength: 200 }),
        }),
        (flowName, modelId, metadata, errorInfo) => {
          // Clear spies before each iteration
          consoleLogSpy.mockClear();
          
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Create error with specific type
          const error = new Error(errorInfo.message);
          error.name = errorInfo.name;

          // Log error
          logger.logError(error);

          // Verify error details are logged
          expect(consoleLogSpy).toHaveBeenCalled();
          
          const logCalls = consoleLogSpy.mock.calls;
          const errorLogCall = logCalls.find(call => {
            const logStr = call[0];
            return typeof logStr === 'string' && logStr.includes('"level":"ERROR"');
          });
          
          expect(errorLogCall).toBeDefined();
          const logEntry = JSON.parse(errorLogCall![0] as string);
          
          // Error object should be present
          expect(logEntry.error.message).toBe(errorInfo.message);
          
          // Error type should be in context
          expect(logEntry.context.errorType).toBe(errorInfo.name);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Error logs include HTTP status codes when available
   */
  it('logs HTTP status codes when present in errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(BEDROCK_MODELS.HAIKU, BEDROCK_MODELS.SONNET_3_5_V2),
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
        }),
        fc.constantFrom(400, 401, 403, 404, 429, 500, 502, 503),
        (flowName, modelId, metadata, statusCode) => {
          // Clear spies before each iteration
          consoleLogSpy.mockClear();
          
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Create error with status code
          const error = new Error('HTTP error');
          (error as any).statusCode = statusCode;

          // Log error
          logger.logError(error);

          // Verify status code is logged
          expect(consoleLogSpy).toHaveBeenCalled();
          
          const logCalls = consoleLogSpy.mock.calls;
          const errorLogCall = logCalls.find(call => {
            const logStr = call[0];
            return typeof logStr === 'string' && logStr.includes('"level":"ERROR"');
          });
          
          expect(errorLogCall).toBeDefined();
          const logEntry = JSON.parse(errorLogCall![0] as string);
          
          expect(logEntry.context.statusCode).toBe(statusCode);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Error logs include error codes when available
   */
  it('logs error codes when present in errors', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(BEDROCK_MODELS.HAIKU, BEDROCK_MODELS.SONNET_3_5_V2),
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
        }),
        fc.constantFrom(
          'ThrottlingException',
          'ValidationException',
          'ServiceException',
          'TimeoutError',
          'NetworkError'
        ),
        (flowName, modelId, metadata, errorCode) => {
          // Clear spies before each iteration
          consoleLogSpy.mockClear();
          
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Create error with code
          const error = new Error('Service error');
          (error as any).code = errorCode;

          // Log error
          logger.logError(error);

          // Verify error code is logged
          expect(consoleLogSpy).toHaveBeenCalled();
          
          const logCalls = consoleLogSpy.mock.calls;
          const errorLogCall = logCalls.find(call => {
            const logStr = call[0];
            return typeof logStr === 'string' && logStr.includes('"level":"ERROR"');
          });
          
          expect(errorLogCall).toBeDefined();
          const logEntry = JSON.parse(errorLogCall![0] as string);
          
          expect(logEntry.context.errorCode).toBe(errorCode);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Error logs include input characteristics (temperature, maxTokens)
   */
  it('logs input characteristics for debugging', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(BEDROCK_MODELS.HAIKU, BEDROCK_MODELS.SONNET_3_5_V2),
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
          topP: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
        }),
        (flowName, modelId, metadata) => {
          // Clear spies before each iteration
          consoleLogSpy.mockClear();
          
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Log error
          logger.logError(new Error('Test error'));

          // Verify input characteristics are logged
          expect(consoleLogSpy).toHaveBeenCalled();
          
          const logCalls = consoleLogSpy.mock.calls;
          const errorLogCall = logCalls.find(call => {
            const logStr = call[0];
            return typeof logStr === 'string' && logStr.includes('"level":"ERROR"');
          });
          
          expect(errorLogCall).toBeDefined();
          const logEntry = JSON.parse(errorLogCall![0] as string);
          
          // All input characteristics should be present
          expect(logEntry.context.temperature).toBe(metadata.temperature);
          expect(logEntry.context.maxTokens).toBe(metadata.maxTokens);
          expect(logEntry.context.featureCategory).toBe(metadata.featureCategory);
        }
      ),
      { numRuns: 50 }
    );
  });
});
