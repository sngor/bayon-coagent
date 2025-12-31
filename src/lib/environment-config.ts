/**
 * Environment Configuration Management
 * 
 * Provides type-safe environment configuration with validation,
 * fallbacks, and runtime checks for all environment variables.
 */

import { z } from 'zod';

// ============================================================================
// Environment Schema Definitions
// ============================================================================

const EnvironmentSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Next.js Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Bayon Coagent'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
  
  // AWS Configuration
  AWS_REGION: z.string().default('us-west-2'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Cognito Configuration
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: z.string().min(1, 'Cognito User Pool ID is required'),
  NEXT_PUBLIC_COGNITO_CLIENT_ID: z.string().min(1, 'Cognito Client ID is required'),
  NEXT_PUBLIC_COGNITO_REGION: z.string().default('us-west-2'),
  
  // DynamoDB Configuration
  DYNAMODB_TABLE_NAME: z.string().default('bayon-coagent-table'),
  DYNAMODB_ENDPOINT: z.string().url().optional(),
  
  // S3 Configuration
  S3_BUCKET_NAME: z.string().default('bayon-coagent-storage'),
  S3_REGION: z.string().default('us-west-2'),
  S3_ENDPOINT: z.string().url().optional(),
  
  // Bedrock Configuration
  BEDROCK_REGION: z.string().default('us-west-2'),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-5-sonnet-20241022-v2:0'),
  
  // External API Keys
  TAVILY_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  BRIDGE_API_KEY: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  
  // Security Configuration
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters').optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters').optional(),
  
  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ERROR_REPORTING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  
  // LocalStack Configuration (for development)
  USE_LOCAL_AWS: z.string().transform(val => val === 'true').default('false'),
  LOCALSTACK_ENDPOINT: z.string().url().default('http://localhost:4566'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('100'),
  
  // Monitoring and Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  DATADOG_API_KEY: z.string().optional(),
  
  // Performance Configuration
  MAX_FILE_SIZE_MB: z.string().transform(val => parseInt(val, 10)).default('10'),
  MAX_REQUEST_SIZE_MB: z.string().transform(val => parseInt(val, 10)).default('50'),
  CACHE_TTL_SECONDS: z.string().transform(val => parseInt(val, 10)).default('300'), // 5 minutes
});

// ============================================================================
// Environment Type
// ============================================================================

export type Environment = z.infer<typeof EnvironmentSchema>;

// ============================================================================
// Environment Validation and Loading
// ============================================================================

class EnvironmentConfig {
  private config: Environment | null = null;
  private validationErrors: string[] = [];

  /**
   * Load and validate environment configuration
   */
  load(): Environment {
    if (this.config) {
      return this.config;
    }

    try {
      // Collect all environment variables
      const envVars = {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
        NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
        
        AWS_REGION: process.env.AWS_REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION,
        
        DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME,
        DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,
        
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
        S3_REGION: process.env.S3_REGION,
        S3_ENDPOINT: process.env.S3_ENDPOINT,
        
        BEDROCK_REGION: process.env.BEDROCK_REGION,
        BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID,
        
        TAVILY_API_KEY: process.env.TAVILY_API_KEY,
        NEWS_API_KEY: process.env.NEWS_API_KEY,
        BRIDGE_API_KEY: process.env.BRIDGE_API_KEY,
        GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        CSRF_SECRET: process.env.CSRF_SECRET,
        
        ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
        ENABLE_ERROR_REPORTING: process.env.ENABLE_ERROR_REPORTING,
        ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING,
        ENABLE_DEBUG_MODE: process.env.ENABLE_DEBUG_MODE,
        
        USE_LOCAL_AWS: process.env.USE_LOCAL_AWS,
        LOCALSTACK_ENDPOINT: process.env.LOCALSTACK_ENDPOINT,
        
        RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
        RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
        
        LOG_LEVEL: process.env.LOG_LEVEL,
        SENTRY_DSN: process.env.SENTRY_DSN,
        DATADOG_API_KEY: process.env.DATADOG_API_KEY,
        
        MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB,
        MAX_REQUEST_SIZE_MB: process.env.MAX_REQUEST_SIZE_MB,
        CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS,
      };

      // Validate against schema
      const result = EnvironmentSchema.safeParse(envVars);

      if (!result.success) {
        this.validationErrors = result.error.issues.map(
          issue => `${issue.path.join('.')}: ${issue.message}`
        );
        
        // In development, log errors but continue with defaults
        if (process.env.NODE_ENV === 'development') {
          console.warn('Environment validation warnings:', this.validationErrors);
          // Use partial config with defaults
          this.config = result.error.issues.reduce((acc, issue) => {
            const path = issue.path[0] as keyof Environment;
            if (path && EnvironmentSchema.shape[path]) {
              try {
                acc[path] = EnvironmentSchema.shape[path].parse(undefined);
              } catch {
                // Use hardcoded fallback for critical values
                if (path === 'NEXT_PUBLIC_COGNITO_USER_POOL_ID') {
                  (acc as any)[path] = 'us-west-2_wqsUAbADO';
                } else if (path === 'NEXT_PUBLIC_COGNITO_CLIENT_ID') {
                  (acc as any)[path] = '33grpfrfup7q9jkmumv77ffdce';
                }
              }
            }
            return acc;
          }, {} as any);
        } else {
          // In production, throw error for missing required config
          throw new Error(`Environment validation failed:\n${this.validationErrors.join('\n')}`);
        }
      } else {
        this.config = result.data;
      }

      // Validate environment-specific requirements
      this.validateEnvironmentSpecificConfig();

      return this.config!;
    } catch (error) {
      console.error('Failed to load environment configuration:', error);
      throw error;
    }
  }

  /**
   * Get current configuration (throws if not loaded)
   */
  get(): Environment {
    if (!this.config) {
      throw new Error('Environment configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  /**
   * Check if configuration is valid
   */
  isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  /**
   * Get validation errors
   */
  getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * Validate environment-specific configuration
   */
  private validateEnvironmentSpecificConfig(): void {
    if (!this.config) return;

    const { NODE_ENV, USE_LOCAL_AWS } = this.config;

    // Production-specific validations
    if (NODE_ENV === 'production') {
      const requiredInProduction = [
        'NEXTAUTH_SECRET',
        'CSRF_SECRET',
      ];

      requiredInProduction.forEach(key => {
        if (!this.config![key as keyof Environment]) {
          this.validationErrors.push(`${key} is required in production`);
        }
      });

      // Ensure LocalStack is not used in production
      if (USE_LOCAL_AWS) {
        this.validationErrors.push('USE_LOCAL_AWS must be false in production');
      }
    }

    // Development-specific validations
    if (NODE_ENV === 'development') {
      // Warn about missing optional development tools
      if (!this.config.ENABLE_DEBUG_MODE) {
        console.info('Debug mode is disabled. Set ENABLE_DEBUG_MODE=true for enhanced debugging.');
      }
    }
  }

  /**
   * Get AWS configuration
   */
  getAWSConfig() {
    const config = this.get();
    
    return {
      region: config.AWS_REGION,
      credentials: config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      } : undefined,
      endpoint: config.USE_LOCAL_AWS ? config.LOCALSTACK_ENDPOINT : undefined,
    };
  }

  /**
   * Get Cognito configuration
   */
  getCognitoConfig() {
    const config = this.get();
    
    return {
      region: config.NEXT_PUBLIC_COGNITO_REGION,
      userPoolId: config.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: config.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    };
  }

  /**
   * Get DynamoDB configuration
   */
  getDynamoDBConfig() {
    const config = this.get();
    
    return {
      tableName: config.DYNAMODB_TABLE_NAME,
      region: config.AWS_REGION,
      endpoint: config.USE_LOCAL_AWS ? config.LOCALSTACK_ENDPOINT : config.DYNAMODB_ENDPOINT,
    };
  }

  /**
   * Get S3 configuration
   */
  getS3Config() {
    const config = this.get();
    
    return {
      bucketName: config.S3_BUCKET_NAME,
      region: config.S3_REGION,
      endpoint: config.USE_LOCAL_AWS ? config.LOCALSTACK_ENDPOINT : config.S3_ENDPOINT,
    };
  }

  /**
   * Get Bedrock configuration
   */
  getBedrockConfig() {
    const config = this.get();
    
    return {
      region: config.BEDROCK_REGION,
      modelId: config.BEDROCK_MODEL_ID,
    };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: 'analytics' | 'errorReporting' | 'performanceMonitoring' | 'debugMode'): boolean {
    const config = this.get();
    
    switch (feature) {
      case 'analytics':
        return config.ENABLE_ANALYTICS;
      case 'errorReporting':
        return config.ENABLE_ERROR_REPORTING;
      case 'performanceMonitoring':
        return config.ENABLE_PERFORMANCE_MONITORING;
      case 'debugMode':
        return config.ENABLE_DEBUG_MODE;
      default:
        return false;
    }
  }

  /**
   * Reset configuration (for testing)
   */
  reset(): void {
    this.config = null;
    this.validationErrors = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const environmentConfig = new EnvironmentConfig();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get environment configuration (loads if not already loaded)
 */
export function getEnvironmentConfig(): Environment {
  return environmentConfig.load();
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'production';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvironmentConfig().NODE_ENV === 'test';
}

/**
 * Check if using LocalStack
 */
export function isUsingLocalStack(): boolean {
  return getEnvironmentConfig().USE_LOCAL_AWS;
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  const config = getEnvironmentConfig();
  return config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Validate environment on startup
 */
export function validateEnvironmentOnStartup(): void {
  try {
    environmentConfig.load();
    
    if (!environmentConfig.isValid()) {
      const errors = environmentConfig.getValidationErrors();
      console.error('Environment validation failed:', errors);
      
      if (isProduction()) {
        throw new Error('Invalid environment configuration in production');
      }
    }
    
    console.info('Environment configuration loaded successfully');
  } catch (error) {
    console.error('Failed to validate environment:', error);
    
    if (isProduction()) {
      process.exit(1);
    }
  }
}