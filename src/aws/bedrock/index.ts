/**
 * AWS Bedrock Module
 * 
 * Exports the Bedrock client and related utilities for AI operations
 */

export {
  BedrockClient,
  BedrockError,
  BedrockParseError,
  getBedrockClient,
  resetBedrockClient,
  type InvokeOptions,
  type InvokeStreamOptions,
  type RetryConfig,
} from './client';
