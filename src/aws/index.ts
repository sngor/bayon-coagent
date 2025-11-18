/**
 * AWS Services Index
 * 
 * Central export point for all AWS services and utilities.
 */

// Authentication
export { AuthProvider, useAuth } from './auth/auth-provider';
export { useUser, useAuthMethods, useSession } from './auth/use-user';
export { getCognitoClient, type CognitoUser, type AuthSession } from './auth/cognito-client';

// Client Provider
export { AWSClientProvider } from './client-provider';

// Configuration
export { getConfig, getAWSCredentials } from './config';

// DynamoDB
export { getDynamoDBClient } from './dynamodb/client';
export { DynamoDBRepository } from './dynamodb/repository';
export { useQuery, useItem } from './dynamodb/hooks';
export type { DynamoDBItem, QueryOptions, UpdateOptions } from './dynamodb/types';

// S3
export { getS3Client } from './s3/client';

// Bedrock
export { getBedrockClient } from './bedrock/client';

// Search
export { getSearchClient } from './search/client';

// Logging and Monitoring
export { logger, createLogger, generateCorrelationId, withCorrelationId } from './logging';
export type { Logger, LogLevel, LogContext, LogEntry } from './logging';
