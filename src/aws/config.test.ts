/**
 * Tests for AWS Configuration Module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getAWSConfig,
  validateConfig,
  isValidBedrockModel,
  resetConfig,
  VALID_BEDROCK_MODELS,
} from './config';

describe('AWS Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    resetConfig();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    resetConfig();
  });

  describe('getAWSConfig', () => {
    it('should return configuration with all required fields', () => {
      process.env.AWS_REGION = 'us-east-1';
      process.env.COGNITO_USER_POOL_ID = 'test-pool';
      process.env.COGNITO_CLIENT_ID = 'test-client';
      process.env.DYNAMODB_TABLE_NAME = 'test-table';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

      const config = getAWSConfig();

      expect(config.region).toBe('us-east-1');
      expect(config.cognito.userPoolId).toBe('test-pool');
      expect(config.cognito.clientId).toBe('test-client');
      expect(config.dynamodb.tableName).toBe('test-table');
      expect(config.s3.bucketName).toBe('test-bucket');
      expect(config.bedrock.modelId).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
    });

    it('should use default values when environment variables are not set', () => {
      const config = getAWSConfig();

      expect(config.region).toBe('us-east-1');
      expect(config.dynamodb.tableName).toBe('BayonCoAgent');
      expect(config.s3.bucketName).toBe('bayon-coagent-storage');
    });

    it('should return development environment in test mode', () => {
      // During tests, NODE_ENV is 'test', which maps to 'development'
      delete process.env.USE_LOCAL_AWS;

      const config = getAWSConfig();

      // Test environment maps to development
      expect(config.environment).toBe('development');
      // No local endpoints in test mode
      expect(config.cognito.endpoint).toBeUndefined();
      expect(config.dynamodb.endpoint).toBeUndefined();
      expect(config.s3.endpoint).toBeUndefined();
    });

    it('should not use local endpoints in non-local environment', () => {
      // Ensure USE_LOCAL_AWS is not set
      delete process.env.USE_LOCAL_AWS;

      const config = getAWSConfig();

      expect(config.cognito.endpoint).toBeUndefined();
      expect(config.dynamodb.endpoint).toBeUndefined();
      expect(config.s3.endpoint).toBeUndefined();
    });
  });

  describe('isValidBedrockModel', () => {
    it('should validate all known Bedrock models', () => {
      VALID_BEDROCK_MODELS.forEach((modelId) => {
        expect(isValidBedrockModel(modelId)).toBe(true);
      });
    });

    it('should reject invalid model IDs', () => {
      const invalidModels = [
        'invalid-model',
        'anthropic.claude-4',
        'gpt-4',
        '',
        'anthropic.claude-3-haiku', // Missing version
        'anthropic.claude-3-haiku-20240307', // Missing :v1:0
      ];

      invalidModels.forEach((modelId) => {
        expect(isValidBedrockModel(modelId)).toBe(false);
      });
    });

    it('should validate Haiku model', () => {
      expect(isValidBedrockModel('anthropic.claude-3-haiku-20240307-v1:0')).toBe(true);
    });

    it('should validate Sonnet 3.5 v2 with inference profile', () => {
      expect(isValidBedrockModel('us.anthropic.claude-3-5-sonnet-20241022-v2:0')).toBe(true);
    });

    it('should validate Sonnet 3.5 v2 without inference profile', () => {
      expect(isValidBedrockModel('anthropic.claude-3-5-sonnet-20241022-v2:0')).toBe(true);
    });

    it('should validate Opus model', () => {
      expect(isValidBedrockModel('anthropic.claude-3-opus-20240229-v1:0')).toBe(true);
    });
  });

  describe('validateConfig', () => {
    it('should pass validation with all required variables set', () => {
      process.env.COGNITO_USER_POOL_ID = 'test-pool';
      process.env.COGNITO_CLIENT_ID = 'test-client';
      process.env.DYNAMODB_TABLE_NAME = 'test-table';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

      const result = validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when COGNITO_USER_POOL_ID is missing', () => {
      process.env.COGNITO_CLIENT_ID = 'test-client';
      process.env.DYNAMODB_TABLE_NAME = 'test-table';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

      const result = validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('COGNITO_USER_POOL_ID is not set');
    });

    it('should use default BEDROCK_MODEL_ID when not set', () => {
      process.env.COGNITO_USER_POOL_ID = 'test-pool';
      process.env.COGNITO_CLIENT_ID = 'test-client';
      process.env.DYNAMODB_TABLE_NAME = 'test-table';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      delete process.env.BEDROCK_MODEL_ID;

      const result = validateConfig();

      // Should pass because default model ID is valid
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when BEDROCK_MODEL_ID is invalid', () => {
      process.env.COGNITO_USER_POOL_ID = 'test-pool';
      process.env.COGNITO_CLIENT_ID = 'test-client';
      process.env.DYNAMODB_TABLE_NAME = 'test-table';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.BEDROCK_MODEL_ID = 'invalid-model-id';

      const result = validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('is not a valid model');
      expect(result.errors[0]).toContain('invalid-model-id');
    });

    it('should report multiple validation errors', () => {
      // Don't set any environment variables
      delete process.env.COGNITO_USER_POOL_ID;
      delete process.env.COGNITO_CLIENT_ID;
      delete process.env.DYNAMODB_TABLE_NAME;
      delete process.env.S3_BUCKET_NAME;
      delete process.env.BEDROCK_MODEL_ID;

      const result = validateConfig();

      expect(result.valid).toBe(false);
      // Should have errors for COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID
      // DYNAMODB_TABLE_NAME, S3_BUCKET_NAME, and BEDROCK_MODEL_ID have defaults
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should validate with default values when using defaults', () => {
      process.env.COGNITO_USER_POOL_ID = 'test-pool';
      process.env.COGNITO_CLIENT_ID = 'test-client';
      process.env.BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
      // Let DYNAMODB_TABLE_NAME and S3_BUCKET_NAME use defaults

      const result = validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Model ID validation edge cases', () => {
    it('should reject model ID with typo in provider', () => {
      expect(isValidBedrockModel('anthropix.claude-3-haiku-20240307-v1:0')).toBe(false);
    });

    it('should reject model ID with wrong date format', () => {
      expect(isValidBedrockModel('anthropic.claude-3-haiku-2024-03-07-v1:0')).toBe(false);
    });

    it('should reject model ID with missing version suffix', () => {
      expect(isValidBedrockModel('anthropic.claude-3-haiku-20240307')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isValidBedrockModel('ANTHROPIC.CLAUDE-3-HAIKU-20240307-V1:0')).toBe(false);
    });
  });
});
