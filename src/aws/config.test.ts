/**
 * Tests for AWS Configuration Module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getAWSConfig, getConfig, resetConfig, validateConfig } from './config';

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

  describe('Environment Detection', () => {
    it('should detect local environment when USE_LOCAL_AWS is true', () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_LOCAL_AWS = 'true';

      const config = getAWSConfig();
      expect(config.environment).toBe('local');
      expect(config.dynamodb.endpoint).toBe('http://localhost:4566');
      expect(config.s3.endpoint).toBe('http://localhost:4566');
      expect(config.cognito.endpoint).toBe('http://localhost:4566');
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.USE_LOCAL_AWS = 'false';

      const config = getAWSConfig();
      expect(config.environment).toBe('production');
      expect(config.dynamodb.endpoint).toBeUndefined();
      expect(config.s3.endpoint).toBeUndefined();
      expect(config.cognito.endpoint).toBeUndefined();
    });

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_LOCAL_AWS = 'false';

      const config = getAWSConfig();
      expect(config.environment).toBe('development');
    });
  });

  describe('Configuration Values', () => {
    it('should use environment variables for configuration', () => {
      process.env.AWS_REGION = 'us-west-2';
      process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
      process.env.COGNITO_CLIENT_ID = 'test-client-id';
      process.env.DYNAMODB_TABLE_NAME = 'TestTable';
      process.env.S3_BUCKET_NAME = 'test-bucket';
      process.env.BEDROCK_MODEL_ID = 'test-model';

      const config = getAWSConfig();
      expect(config.region).toBe('us-west-2');
      expect(config.cognito.userPoolId).toBe('test-pool-id');
      expect(config.cognito.clientId).toBe('test-client-id');
      expect(config.dynamodb.tableName).toBe('TestTable');
      expect(config.s3.bucketName).toBe('test-bucket');
      expect(config.bedrock.modelId).toBe('test-model');
    });

    it('should use default values when environment variables are not set', () => {
      const config = getAWSConfig();
      expect(config.region).toBe('us-east-1');
      expect(config.dynamodb.tableName).toBe('BayonCoAgent');
      expect(config.s3.bucketName).toBe('bayon-coagent-storage');
    });
  });

  describe('Configuration Caching', () => {
    it('should cache configuration', () => {
      process.env.DYNAMODB_TABLE_NAME = 'Table1';
      const config1 = getConfig();

      process.env.DYNAMODB_TABLE_NAME = 'Table2';
      const config2 = getConfig();

      // Should return cached config, not new one
      expect(config1.dynamodb.tableName).toBe(config2.dynamodb.tableName);
    });

    it('should reset cache when resetConfig is called', () => {
      process.env.DYNAMODB_TABLE_NAME = 'Table1';
      const config1 = getConfig();

      resetConfig();
      process.env.DYNAMODB_TABLE_NAME = 'Table2';
      const config2 = getConfig();

      // Should return new config after reset
      expect(config1.dynamodb.tableName).toBe('Table1');
      expect(config2.dynamodb.tableName).toBe('Table2');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required configuration', () => {
      process.env.COGNITO_USER_POOL_ID = 'pool-id';
      process.env.COGNITO_CLIENT_ID = 'client-id';
      process.env.DYNAMODB_TABLE_NAME = 'table';
      process.env.S3_BUCKET_NAME = 'bucket';
      process.env.BEDROCK_MODEL_ID = 'model';

      const result = validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing configuration', () => {
      process.env.COGNITO_USER_POOL_ID = '';
      process.env.COGNITO_CLIENT_ID = '';

      const result = validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('COGNITO_USER_POOL_ID is not set');
      expect(result.errors).toContain('COGNITO_CLIENT_ID is not set');
    });
  });
});
