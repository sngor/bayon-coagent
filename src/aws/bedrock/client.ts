/**
 * AWS Bedrock Client Module
 * 
 * This module provides a client for interacting with AWS Bedrock foundation models.
 * It supports both synchronous and streaming AI calls with Zod schema validation.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  type InvokeModelCommandInput,
  type InvokeModelWithResponseStreamCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { z } from 'zod';

/**
 * Error thrown when Bedrock API calls fail
 */
export class BedrockError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'BedrockError';
  }
}

/**
 * Error thrown when response parsing fails
 */
export class BedrockParseError extends Error {
  constructor(
    message: string,
    public readonly response: unknown,
    public readonly validationErrors?: z.ZodError
  ) {
    super(message);
    this.name = 'BedrockParseError';
  }
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Options for invoke method
 */
export interface InvokeOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  retryConfig?: Partial<RetryConfig>;
}

/**
 * Options for invokeStream method
 */
export interface InvokeStreamOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Bedrock client for AI operations
 */
export class BedrockClient {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(modelId?: string) {
    const config = getConfig();
    const credentials = getAWSCredentials();

    this.client = new BedrockRuntimeClient({
      region: config.bedrock.region,
      endpoint: config.bedrock.endpoint,
      credentials: credentials.accessKeyId && credentials.secretAccessKey
        ? {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          }
        : undefined,
    });

    this.modelId = modelId || config.bedrock.modelId;
  }

  /**
   * Constructs a prompt for Claude models
   */
  private constructClaudePrompt(
    systemPrompt: string,
    userPrompt: string
  ): string {
    return `${systemPrompt}\n\nHuman: ${userPrompt}\n\nAssistant:`;
  }

  /**
   * Constructs the request body for Claude models
   */
  private constructClaudeRequestBody(
    prompt: string,
    options: InvokeOptions = {}
  ): string {
    const body = {
      prompt,
      max_tokens_to_sample: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 1,
      anthropic_version: 'bedrock-2023-05-31',
    };

    return JSON.stringify(body);
  }

  /**
   * Parses Claude model response
   */
  private parseClaudeResponse(responseBody: string): string {
    try {
      const parsed = JSON.parse(responseBody);
      
      if (parsed.completion) {
        return parsed.completion;
      }
      
      if (parsed.content && Array.isArray(parsed.content)) {
        const textContent = parsed.content.find((c: any) => c.type === 'text');
        if (textContent?.text) {
          return textContent.text;
        }
      }

      throw new BedrockParseError(
        'Unable to extract text from Claude response',
        parsed
      );
    } catch (error) {
      if (error instanceof BedrockParseError) {
        throw error;
      }
      throw new BedrockParseError(
        'Failed to parse Claude response',
        responseBody,
        error instanceof Error ? undefined : undefined
      );
    }
  }

  /**
   * Implements exponential backoff retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable (throttling, timeout, etc.)
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt === retryConfig.maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay for next attempt
        delay = Math.min(
          delay * retryConfig.backoffMultiplier,
          retryConfig.maxDelayMs
        );
      }
    }

    throw lastError || new Error('Retry failed');
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error && typeof error === 'object') {
      const err = error as any;
      
      // Retry on throttling errors
      if (err.name === 'ThrottlingException' || err.code === 'ThrottlingException') {
        return true;
      }
      
      // Retry on service unavailable
      if (err.statusCode === 503 || err.statusCode === 429) {
        return true;
      }
      
      // Retry on timeout
      if (err.name === 'TimeoutError' || err.code === 'TimeoutError') {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Invokes a Bedrock model synchronously with schema validation
   * 
   * @param prompt - The prompt to send to the model
   * @param outputSchema - Zod schema for validating the response
   * @param options - Optional configuration for the request
   * @returns Validated response matching the output schema
   */
  async invoke<TOutput>(
    prompt: string,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retryConfig,
    };

    return this.withRetry(async () => {
      try {
        // Construct request body based on model type
        const body = this.constructClaudeRequestBody(prompt, options);

        const command = new InvokeModelCommand({
          modelId: this.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: body,
        });

        const response = await this.client.send(command);

        if (!response.body) {
          throw new BedrockError('Empty response from Bedrock');
        }

        // Parse response body
        const responseBody = new TextDecoder().decode(response.body);
        const textResponse = this.parseClaudeResponse(responseBody);

        // Try to parse as JSON for structured output
        let parsedOutput: unknown;
        try {
          parsedOutput = JSON.parse(textResponse);
        } catch {
          // If not JSON, wrap in object
          parsedOutput = { result: textResponse };
        }

        // Validate against schema
        const validationResult = outputSchema.safeParse(parsedOutput);
        
        if (!validationResult.success) {
          throw new BedrockParseError(
            'Response does not match expected schema',
            parsedOutput,
            validationResult.error
          );
        }

        return validationResult.data;
      } catch (error) {
        if (error instanceof BedrockError || error instanceof BedrockParseError) {
          throw error;
        }

        const err = error as any;
        throw new BedrockError(
          err.message || 'Failed to invoke Bedrock model',
          err.code || err.name,
          err.statusCode || err.$metadata?.httpStatusCode,
          error
        );
      }
    }, retryConfig);
  }

  /**
   * Invokes a Bedrock model with streaming response
   * 
   * @param prompt - The prompt to send to the model
   * @param options - Optional configuration for the request
   * @returns Async iterable of response chunks
   */
  async *invokeStream(
    prompt: string,
    options: InvokeStreamOptions = {}
  ): AsyncIterable<string> {
    try {
      // Construct request body
      const body = this.constructClaudeRequestBody(prompt, options);

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: body,
      });

      const response = await this.client.send(command);

      if (!response.body) {
        throw new BedrockError('Empty streaming response from Bedrock');
      }

      // Process the stream
      for await (const event of response.body) {
        if (event.chunk) {
          const chunkBody = new TextDecoder().decode(event.chunk.bytes);
          
          try {
            const parsed = JSON.parse(chunkBody);
            
            // Extract text from chunk based on model response format
            if (parsed.completion) {
              yield parsed.completion;
            } else if (parsed.delta?.text) {
              yield parsed.delta.text;
            } else if (parsed.delta?.completion) {
              yield parsed.delta.completion;
            }
          } catch (error) {
            // If chunk is not JSON, yield as-is
            yield chunkBody;
          }
        }
      }
    } catch (error) {
      if (error instanceof BedrockError) {
        throw error;
      }

      const err = error as any;
      throw new BedrockError(
        err.message || 'Failed to stream from Bedrock model',
        err.code || err.name,
        err.statusCode || err.$metadata?.httpStatusCode,
        error
      );
    }
  }

  /**
   * Helper method to invoke with a system prompt and user input
   */
  async invokeWithPrompts<TOutput>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    const fullPrompt = this.constructClaudePrompt(systemPrompt, userPrompt);
    return this.invoke(fullPrompt, outputSchema, options);
  }

  /**
   * Helper method to stream with a system prompt and user input
   */
  async *invokeStreamWithPrompts(
    systemPrompt: string,
    userPrompt: string,
    options: InvokeStreamOptions = {}
  ): AsyncIterable<string> {
    const fullPrompt = this.constructClaudePrompt(systemPrompt, userPrompt);
    yield* this.invokeStream(fullPrompt, options);
  }
}

/**
 * Creates a singleton Bedrock client instance
 */
let bedrockClientInstance: BedrockClient | null = null;

/**
 * Gets the singleton Bedrock client instance
 */
export function getBedrockClient(modelId?: string): BedrockClient {
  if (!bedrockClientInstance || modelId) {
    bedrockClientInstance = new BedrockClient(modelId);
  }
  return bedrockClientInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetBedrockClient(): void {
  bedrockClientInstance = null;
}
