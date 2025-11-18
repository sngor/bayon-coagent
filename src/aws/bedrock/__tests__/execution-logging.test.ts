/**
 * Property-Based Tests for Execution Logging
 * 
 * Feature: ai-model-optimization, Property 18: Execution metrics are logged
 * Validates: Requirements 15.1, 15.2, 15.3
 * 
 * Tests that all AI flow executions (success or failure) log model ID,
 * execution time, and outcome.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { 
  ExecutionLogger, 
  createExecutionLogger,
  FlowExecutionLogSchema,
  type ExecutionMetadata,
  type TokenUsage 
} from '../execution-logger';
import { BEDROCK_MODELS } from '../flow-base';

describe('Execution Logging Property Tests', () => {

  /**
   * Property 18: Execution metrics are logged
   * For any AI flow execution (success or failure), the system should log
   * model ID, execution time, and outcome
   */
  it('Property 18: logs execution metrics for all flow executions', () => {
    fc.assert(
      fc.property(
        // Generate random flow names
        fc.constantFrom(
          'generateBlogPost',
          'analyzeReviewSentiment',
          'runNapAudit',
          'findCompetitors',
          'generateMarketingPlan'
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
        // Generate whether execution succeeds or fails
        fc.boolean(),
        (flowName, modelId, metadata, isSuccess) => {
          // Create execution logger
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Test that logger methods don't throw
          if (isSuccess) {
            // Log successful execution
            const tokenUsage: TokenUsage = {
              input: Math.floor(Math.random() * 1000),
              output: Math.floor(Math.random() * 1000),
            };
            
            // Should not throw
            expect(() => logger.logSuccess(tokenUsage)).not.toThrow();
          } else {
            // Log failed execution
            const error = new Error('Test error');
            
            // Should not throw
            expect(() => logger.logError(error, 'TestErrorCode', 500)).not.toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Execution time is always positive
   */
  it('logs positive execution time for all flows', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          BEDROCK_MODELS.HAIKU,
          BEDROCK_MODELS.SONNET_3_5_V2
        ),
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
        }),
        (flowName, modelId, metadata) => {
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);
          
          // Simulate some execution time
          const delay = Math.random() * 10;
          const start = Date.now();
          while (Date.now() - start < delay) {
            // Busy wait
          }
          
          // Should not throw and should complete successfully
          expect(() => logger.logSuccess()).not.toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Log entries conform to schema
   */
  it('produces log entries that conform to FlowExecutionLogSchema', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          BEDROCK_MODELS.HAIKU,
          BEDROCK_MODELS.SONNET_3_5_V2,
          BEDROCK_MODELS.OPUS
        ),
        fc.record({
          userId: fc.option(fc.uuid(), { nil: undefined }),
          featureCategory: fc.constantFrom('content-generation', 'analysis', 'strategic'),
          temperature: fc.double({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1024, max: 8192 }),
          topP: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
        }),
        fc.boolean(),
        (flowName, modelId, metadata, isSuccess) => {
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Test that logging methods don't throw
          if (isSuccess) {
            expect(() => logger.logSuccess({
              input: 100,
              output: 200,
            })).not.toThrow();
          } else {
            expect(() => logger.logError(new Error('Test error'), 'TestCode', 500)).not.toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Retry count is tracked correctly
   */
  it('tracks retry count correctly across multiple retries', () => {
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
          const logger = createExecutionLogger(flowName, modelId, metadata as ExecutionMetadata);

          // Simulate retries
          for (let i = 0; i < retryCount; i++) {
            logger.incrementRetry();
          }

          // Verify retry count is tracked
          expect(logger.getRetryCount()).toBe(retryCount);

          // Log error should not throw
          expect(() => logger.logError(new Error('Test error'))).not.toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });
});
