/**
 * AWS Configuration Module
 * 
 * This module provides centralized configuration for AWS services,
 * with automatic environment detection for local vs remote deployment.
 */

export type Environment = 'local' | 'development' | 'production';

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  endpoint?: string;
}

export interface ClientCognitoConfig {
  userPoolId: string;
  clientId: string;
  endpoint?: string;
}

export interface DynamoDBConfig {
  tableName: string;
  endpoint?: string;
}

export interface S3Config {
  bucketName: string;
  region: string;
  endpoint?: string;
}

export interface BedrockConfig {
  modelId: string;
  region: string;
  endpoint?: string;
}

export interface GoogleAIConfig {
  apiKey?: string;
}

export interface SESConfig {
  region: string;
  fromEmail: string;
  replyToEmail?: string;
  endpoint?: string;
}

export interface SNSConfig {
  region: string;
  platformApplicationArn?: string;
  endpoint?: string;
}

export interface ApiGatewayConfig {
  mainApiUrl?: string;
  aiServiceApiUrl?: string;
  integrationServiceApiUrl?: string;
  backgroundServiceApiUrl?: string;
  adminServiceApiUrl?: string;
  mainRestApiId?: string;
  aiServiceApiId?: string;
  integrationServiceApiId?: string;
  backgroundServiceApiId?: string;
  adminServiceApiId?: string;
}

export interface SQSConfig {
  aiJobRequestQueueUrl?: string;
  aiJobResponseQueueUrl?: string;
  endpoint?: string;
}

/**
 * Valid Bedrock model IDs (inference profiles)
 * AWS now requires inference profiles for all Claude models
 */
export const VALID_BEDROCK_MODELS = [
  'us.anthropic.claude-3-haiku-20240307-v1:0',
  'us.anthropic.claude-3-sonnet-20240229-v1:0',
  'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  'us.anthropic.claude-3-opus-20240229-v1:0',
] as const;

export type ValidBedrockModel = typeof VALID_BEDROCK_MODELS[number];

export interface AWSConfig {
  region: string;
  environment: Environment;
  appUrl: string;
  cognito: CognitoConfig;
  clientCognito: ClientCognitoConfig;
  dynamodb: DynamoDBConfig;
  s3: S3Config;
  bedrock: BedrockConfig;
  googleAI: GoogleAIConfig;
  ses: SESConfig;
  sns: SNSConfig;
  apiGateway: ApiGatewayConfig;
  sqs: SQSConfig;
}

/**
 * Determines if the application is running in local development mode
 */
function isLocalEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.USE_LOCAL_AWS === 'true'
  );
}

/**
 * Determines the current environment
 */
function getEnvironment(): Environment {
  if (isLocalEnvironment()) {
    return 'local';
  }

  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  return 'development';
}

/**
 * Gets the AWS configuration based on the current environment
 */
export function getAWSConfig(): AWSConfig {
  const environment = getEnvironment();
  const isLocal = environment === 'local';
  const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1';

  // Debug logging for config creation
  console.error('🔧 Creating AWS Config:', {
    environment,
    isLocal,
    region,
    'process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID': process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    'process.env.COGNITO_CLIENT_ID': process.env.COGNITO_CLIENT_ID,
    'typeof window': typeof window,
    'NODE_ENV': process.env.NODE_ENV
  });

  const config = {
    region,
    environment,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID || 'us-west-2_ALOcJxQDd',
      clientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || process.env.COGNITO_CLIENT_ID || '1vnmp9v58opg04o480fokp0sct',
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
    },

    clientCognito: {
      userPoolId: process.env.CLIENT_COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID || '',
      clientId: process.env.CLIENT_COGNITO_CLIENT_ID || process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || process.env.COGNITO_CLIENT_ID || '',
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
    },

    dynamodb: {
      tableName: process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent',
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
    },

    s3: {
      bucketName: process.env.S3_BUCKET_NAME || 'bayon-coagent-storage',
      region: process.env.S3_REGION || region,
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
    },

    bedrock: {
      modelId:
        process.env.BEDROCK_MODEL_ID ||
        'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      region: process.env.BEDROCK_REGION || region,
      endpoint: undefined, // Bedrock typically doesn't have local emulation
    },

    googleAI: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
    },

    ses: {
      region: process.env.SES_REGION || region,
      fromEmail: process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com',
      replyToEmail: process.env.SES_REPLY_TO_EMAIL,
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
    },

    sns: {
      region: process.env.SNS_REGION || region,
      platformApplicationArn: process.env.SNS_PLATFORM_APPLICATION_ARN,
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
    },

    apiGateway: {
      mainApiUrl: process.env.MAIN_API_URL,
      aiServiceApiUrl: process.env.AI_SERVICE_API_URL,
      integrationServiceApiUrl: process.env.INTEGRATION_SERVICE_API_URL,
      backgroundServiceApiUrl: process.env.BACKGROUND_SERVICE_API_URL,
      adminServiceApiUrl: process.env.ADMIN_SERVICE_API_URL,
      mainRestApiId: process.env.MAIN_REST_API_ID,
      aiServiceApiId: process.env.AI_SERVICE_API_ID,
      integrationServiceApiId: process.env.INTEGRATION_SERVICE_API_ID,
      backgroundServiceApiId: process.env.BACKGROUND_SERVICE_API_ID,
      adminServiceApiId: process.env.ADMIN_SERVICE_API_ID,
    },

    sqs: {
      aiJobRequestQueueUrl: process.env.AI_JOB_REQUEST_QUEUE_URL,
      aiJobResponseQueueUrl: process.env.AI_JOB_RESPONSE_QUEUE_URL,
      endpoint: isLocal ? 'http://localhost:4566' : undefined,
    },
  };

  // Log the final config values
  console.error('🔧 Final Config Created:', {
    'cognito.userPoolId': config.cognito.userPoolId,
    'cognito.clientId': config.cognito.clientId,
    'cognito.clientId.length': config.cognito.clientId?.length || 0
  });

  return config;
}

/**
 * Gets AWS credentials configuration
 * For local development, uses test credentials
 * For production, relies on IAM roles or environment variables
 */
export function getAWSCredentials() {
  const environment = getEnvironment();

  if (environment === 'local') {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    };
  }

  // In production, credentials should come from IAM roles or environment
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

/**
 * Validates that a model ID is a valid Bedrock model
 */
export function isValidBedrockModel(modelId: string): boolean {
  return VALID_BEDROCK_MODELS.includes(modelId as ValidBedrockModel);
}

/**
 * Validates that required environment variables are set
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getAWSConfig();

  if (!config.cognito.userPoolId) {
    errors.push('NEXT_PUBLIC_USER_POOL_ID or COGNITO_USER_POOL_ID is not set');
  }

  if (!config.cognito.clientId) {
    errors.push('NEXT_PUBLIC_USER_POOL_CLIENT_ID or COGNITO_CLIENT_ID is not set');
  }

  if (!config.dynamodb.tableName) {
    errors.push('DYNAMODB_TABLE_NAME is not set');
  }

  if (!config.s3.bucketName) {
    errors.push('S3_BUCKET_NAME is not set');
  }

  if (!config.bedrock.modelId) {
    errors.push('BEDROCK_MODEL_ID is not set');
  } else if (!isValidBedrockModel(config.bedrock.modelId)) {
    errors.push(
      `BEDROCK_MODEL_ID "${config.bedrock.modelId}" is not a valid model. ` +
      `Valid models: ${VALID_BEDROCK_MODELS.join(', ')}`
    );
  }

  if (!config.googleAI.apiKey) {
    errors.push('GOOGLE_AI_API_KEY is not set (required for Gemini image generation)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export a singleton instance of the config
let cachedConfig: AWSConfig | null = null;

/**
 * Gets the cached AWS configuration
 * This ensures configuration is only computed once per application lifecycle
 */
export function getConfig(): AWSConfig {
  if (!cachedConfig) {
    cachedConfig = getAWSConfig();
  }
  return cachedConfig;
}

/**
 * Resets the cached configuration
 * Useful for testing or when environment variables change
 */
export function resetConfig(): void {
  cachedConfig = null;
}
