/**
 * Error Handling Tests
 * 
 * Tests for comprehensive error handling system
 */

import { 
  AIVisibilityError, 
  SchemaGenerationError, 
  AIPlatformError, 
  RateLimitError,
  categorizeError,
  getErrorRecoverySteps,
  wrapError
} from '../errors';
import { retryManager, RetryManager } from '../retry-manager';
import { fallbackManager, FallbackManager } from '../fallback-manager';
import { errorHandler } from '../error-handler';

describe('AI Visibility Error Handling', () => {
  beforeEach(() => {
    // Reset state before each test
    retryManager.resetStats();
    fallbackManager.resetServiceStatus();
    fallbackManager.clearCache();
  });

  describe('Error Classification', () => {
    it('should correctly categorize different error types', () => {
      const schemaError = new SchemaGenerationError('Invalid schema', 'RealEstateAgent');
      const platformError = new AIPlatformError('API failed', 'chatgpt');
      const rateLimitError = new RateLimitError('Rate limited', 'claude', 60000);

      expect(categorizeError(schemaError)).toEqual({
        category: 'configuration',
        retryable: false,
      });

      expect(categorizeError(platformError)).toEqual({
        category: 'network',
        retryable: true,
        retryDelay: 5000,
      });

      expect(categorizeError(rateLimitError)).toEqual({
        category: 'rate_limit',
        retryable: true,
        retryDelay: 60000,
      });
    });

    it('should provide appropriate recovery steps', () => {
      const schemaError = new SchemaGenerationError(
        'Invalid schema',
        'RealEstateAgent',
        ['Missing name field']
      );

      const steps = getErrorRecoverySteps(schemaError);
      expect(steps).toContain('Check that all required profile fields are populated');
      expect(steps).toContain('Review validation errors and fix data issues');
    });

    it('should wrap unknown errors correctly', () => {
      const unknownError = new Error('Something went wrong');
      const wrappedError = wrapError(unknownError);

      expect(wrappedError).toBeInstanceOf(AIVisibilityError);
      expect(wrappedError.message).toBe('Something went wrong');
      expect(wrappedError.code).toBe('UNKNOWN_ERROR');
      expect(wrappedError.retryable).toBe(true);
    });
  });

  describe('Retry Manager', () => {
    it('should retry operations with exponential backoff', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const config = {
        maxAttempts: 3,
        baseDelay: 10, // Small delay for testing
        maxDelay: 100,
        backoffMultiplier: 2,
        useJitter: false,
      };

      const result = await retryManager.executeWithRetry(operation, config, 'test');
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockImplementation(() => {
        throw new SchemaGenerationError('Invalid data', 'RealEstateAgent');
      });

      const config = {
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        useJitter: false,
      };

      await expect(
        retryManager.executeWithRetry(operation, config, 'test')
      ).rejects.toThrow('Invalid data');
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should track retry statistics', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const config = {
        maxAttempts: 1,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        useJitter: false,
      };

      await retryManager.executeWithRetry(operation, config, 'testOperation');
      
      const stats = retryManager.getStats('testOperation');
      expect(stats).toBeTruthy();
      if (stats && typeof stats === 'object' && 'totalAttempts' in stats) {
        expect(stats.totalAttempts).toBe(1);
        expect(stats.successfulRetries).toBe(1);
      }
    });
  });

  describe('Fallback Manager', () => {
    it('should execute operation successfully when service is available', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await fallbackManager.executeWithFallback(
        operation,
        'testService',
        'fallback-data',
        'user123'
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use fallback when operation fails', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      const result = await fallbackManager.executeWithFallback(
        operation,
        'websiteAnalysis', // This has default fallback configured
        undefined,
        'user123'
      );

      // Should return fallback data
      expect(result).toBeTruthy();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should cache successful results', async () => {
      const operation = jest.fn().mockResolvedValue('cached-result');
      
      // First call
      await fallbackManager.executeWithFallback(
        operation,
        'aiPlatformMonitoring', // This has cached fallback strategy
        undefined,
        'user123'
      );

      // Clear the operation mock and make it fail
      operation.mockReset();
      operation.mockRejectedValue(new Error('Service down'));

      // Second call should use cached data
      const result = await fallbackManager.executeWithFallback(
        operation,
        'aiPlatformMonitoring',
        undefined,
        'user123'
      );

      expect(result).toBe('cached-result');
    });
  });

  describe('Error Handler Integration', () => {
    it('should handle operations with comprehensive error management', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await errorHandler.handleOperation(
        operation,
        'schemaGeneration',
        undefined,
        { userId: 'test-user' }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.retryAttempts).toBeGreaterThan(0);
    });

    it('should handle batch operations correctly', async () => {
      const operations = [
        {
          operation: jest.fn().mockResolvedValue('result1'),
          operationType: 'schema',
          context: { id: 1 },
        },
        {
          operation: jest.fn().mockRejectedValue(new Error('Failed')),
          operationType: 'monitoring',
          context: { id: 2 },
        },
        {
          operation: jest.fn().mockResolvedValue('result3'),
          operationType: 'export',
          context: { id: 3 },
        },
      ];

      const result = await errorHandler.handleBatchOperations(operations, {
        failFast: false,
        collectPartialResults: true,
      });

      expect(result.overallSuccess).toBe(false);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it('should create graceful operations that never throw', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      const degradedValue = 'degraded-result';

      const gracefulOp = errorHandler.createGracefulOperation(
        failingOperation,
        'testOperation',
        degradedValue
      );

      const result = await gracefulOp();
      expect(result).toBe(degradedValue);
    });
  });

  describe('Error Recovery', () => {
    it('should provide contextual error information', () => {
      const error = new AIPlatformError(
        'API timeout',
        'chatgpt',
        'Connection timeout after 30s',
        true
      );

      expect(error.toJSON()).toEqual({
        name: 'AIPlatformError',
        message: 'API timeout',
        code: 'AI_PLATFORM_ERROR',
        statusCode: 503,
        retryable: true,
        context: {
          platform: 'chatgpt',
          apiError: 'Connection timeout after 30s',
        },
        stack: expect.any(String),
        originalError: undefined,
      });
    });

    it('should generate appropriate recovery steps for different error types', () => {
      const rateLimitError = new RateLimitError('Rate limited', 'claude', 120000);
      const steps = getErrorRecoverySteps(rateLimitError);

      expect(steps).toContain('Wait 120 seconds before trying again');
      expect(steps).toContain('Consider reducing the frequency of API calls');
    });
  });
});

// Mock implementations for testing
jest.mock('@/aws/dynamodb/repository', () => ({
  getRepository: () => ({
    putItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue({ name: 'Test Agent' }),
    queryItems: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock('@/lib/utils', () => ({
  generateId: () => 'test-id-123',
}));

jest.mock('@/aws/bedrock/flows/analyze-ai-mention', () => ({
  analyzeAIMention: jest.fn().mockResolvedValue({
    sentiment: 'positive',
    confidence: 0.8,
    competitorsAlsoMentioned: [],
  }),
}));