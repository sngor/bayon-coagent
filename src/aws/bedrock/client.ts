/**
 * AWS Bedrock Client Module
 * 
 * This module provides a client for interacting with AWS Bedrock foundation models.
 * It supports both synchronous and streaming AI calls with Zod schema validation.
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  type ConverseCommandInput,
  type ConverseStreamCommandInput,
  type Message,
  type ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { z } from 'zod';
import {
  createExecutionLogger,
  extractTokenUsage,
  type ExecutionMetadata,
  type ExecutionLogger
} from './execution-logger';
import { aiCache } from '@/lib/ai/cache/service';

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
  flowName?: string;
  executionMetadata?: ExecutionMetadata;
  /**
   * Whether to use cached responses if available
   * Default: true
   */
  useCache?: boolean;
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
 * Image data for vision analysis
 */
export interface ImageContent {
  /** Base64 encoded image data */
  data: string;
  /** Image format (jpeg, png, webp, gif) */
  format: 'jpeg' | 'png' | 'webp' | 'gif';
}

/**
 * Options for invokeWithVision method
 */
export interface InvokeWithVisionOptions extends InvokeOptions {
  /** Image content for vision analysis */
  image: ImageContent;
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
   * Constructs messages for Converse API
   */
  private constructMessages(
    systemPrompt: string,
    userPrompt: string
  ): { system: Array<{ text: string }>, messages: Message[] } {
    return {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userPrompt }],
        },
      ],
    };
  }

  /**
   * Extracts text from Converse API response
   */
  private extractTextFromResponse(content: ContentBlock[] | undefined): string {
    if (!content || content.length === 0) {
      throw new BedrockParseError(
        'Empty content in Converse response',
        content
      );
    }

    const textContent = content.find((block) => 'text' in block);
    if (textContent && 'text' in textContent) {
      return textContent.text || '';
    }

    throw new BedrockParseError(
      'No text content found in Converse response',
      content
    );
  }

  /**
   * Attempts to parse JSON from text response, handling various formats
   */
  private parseJSONResponse(textResponse: string): unknown {
    // First, try direct JSON parse
    try {
      const parsed = JSON.parse(textResponse);
      return parsed;
    } catch (firstError) {
      // If that fails, try to extract JSON from markdown code blocks
      const codeBlockMatch = textResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1]);
        } catch {
          // Continue to next attempt
        }
      }

      // Try to find JSON object in the text
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Continue to next attempt
        }
      }

      // If all parsing attempts fail, wrap in result object
      console.error('Failed to parse JSON response:', textResponse.substring(0, 200));
      return { result: textResponse };
    }
  }

  /**
   * Implements exponential backoff retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
    executionLogger?: ExecutionLogger
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

        // Increment retry count in logger
        if (executionLogger) {
          executionLogger.incrementRetry();
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
   * Invokes a Bedrock model synchronously with schema validation using Converse API
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
    const useCache = options.useCache ?? true;
    let cacheKey: string | undefined;

    // Check cache
    if (useCache) {
      cacheKey = aiCache.generateKey(this.modelId, prompt, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP
      });

      const cached = await aiCache.get<TOutput>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retryConfig,
    };

    // Create execution logger if metadata provided
    let executionLogger: ExecutionLogger | undefined;
    if (options.flowName && options.executionMetadata) {
      executionLogger = createExecutionLogger(
        options.flowName,
        this.modelId,
        options.executionMetadata
      );
    }

    const result = await this.withRetry(async () => {
      try {
        // Construct Converse API request
        const input: ConverseCommandInput = {
          modelId: this.modelId,
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }],
            },
          ],
          inferenceConfig: {
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens || 4096,
            topP: options.topP ?? 1,
          },
        };

        const command = new ConverseCommand(input);
        const response = await this.client.send(command);

        if (!response.output) {
          throw new BedrockError('Empty response from Bedrock');
        }

        // Extract text from response
        const textResponse = this.extractTextFromResponse(
          response.output.message?.content
        );

        // Parse JSON response with fallback handling
        const parsedOutput = this.parseJSONResponse(textResponse);

        // Validate against schema
        const validationResult = outputSchema.safeParse(parsedOutput);

        if (!validationResult.success) {
          throw new BedrockParseError(
            'Response does not match expected schema',
            parsedOutput,
            validationResult.error
          );
        }

        // Log successful execution with token usage
        if (executionLogger) {
          const tokenUsage = extractTokenUsage(response);
          executionLogger.logSuccess(tokenUsage);
        }

        return validationResult.data;
      } catch (error) {
        // Log error if logger exists
        if (executionLogger) {
          const err = error as any;
          executionLogger.logError(
            error instanceof Error ? error : new Error(String(error)),
            err.code || err.name,
            err.statusCode || err.$metadata?.httpStatusCode
          );
        }

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
    }, retryConfig, executionLogger);

    // Cache the result
    if (useCache && cacheKey) {
      await aiCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Invokes a Bedrock model with streaming response using Converse Stream API
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
      // Construct Converse Stream API request
      const input: ConverseStreamCommandInput = {
        modelId: this.modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens || 4096,
          topP: options.topP ?? 1,
        },
      };

      const command = new ConverseStreamCommand(input);
      const response = await this.client.send(command);

      if (!response.stream) {
        throw new BedrockError('Empty streaming response from Bedrock');
      }

      // Process the stream
      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta && 'text' in event.contentBlockDelta.delta) {
          yield event.contentBlockDelta.delta.text || '';
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
   * Helper method to invoke with a system prompt and user input using Converse API
   */
  async invokeWithPrompts<TOutput>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    const useCache = options.useCache ?? true;
    let cacheKey: string | undefined;

    // Check cache
    if (useCache) {
      cacheKey = aiCache.generateKey(this.modelId, { systemPrompt, userPrompt }, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP
      });

      const cached = await aiCache.get<TOutput>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retryConfig,
    };

    // Create execution logger if metadata provided
    let executionLogger: ExecutionLogger | undefined;
    if (options.flowName && options.executionMetadata) {
      executionLogger = createExecutionLogger(
        options.flowName,
        this.modelId,
        options.executionMetadata
      );
    }

    const result = await this.withRetry(async () => {
      try {
        // Construct Converse API request with system prompt
        const input: ConverseCommandInput = {
          modelId: this.modelId,
          system: [{ text: systemPrompt }],
          messages: [
            {
              role: 'user',
              content: [{ text: userPrompt }],
            },
          ],
          inferenceConfig: {
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens || 4096,
            topP: options.topP ?? 1,
          },
        };

        const command = new ConverseCommand(input);
        const response = await this.client.send(command);

        if (!response.output) {
          throw new BedrockError('Empty response from Bedrock');
        }

        // Extract text from response
        const textResponse = this.extractTextFromResponse(
          response.output.message?.content
        );

        // Parse JSON response with fallback handling
        const parsedOutput = this.parseJSONResponse(textResponse);

        // Validate against schema
        const validationResult = outputSchema.safeParse(parsedOutput);

        if (!validationResult.success) {
          throw new BedrockParseError(
            'Response does not match expected schema',
            parsedOutput,
            validationResult.error
          );
        }

        // Log successful execution with token usage
        if (executionLogger) {
          const tokenUsage = extractTokenUsage(response);
          executionLogger.logSuccess(tokenUsage);
        }

        return validationResult.data;
      } catch (error) {
        // Log error if logger exists
        if (executionLogger) {
          const err = error as any;
          executionLogger.logError(
            error instanceof Error ? error : new Error(String(error)),
            err.code || err.name,
            err.statusCode || err.$metadata?.httpStatusCode
          );
        }

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
    }, retryConfig, executionLogger);

    // Cache the result
    if (useCache && cacheKey) {
      await aiCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Helper method to stream with a system prompt and user input using Converse Stream API
   */
  async *invokeStreamWithPrompts(
    systemPrompt: string,
    userPrompt: string,
    options: InvokeStreamOptions = {}
  ): AsyncIterable<string> {
    try {
      // Construct Converse Stream API request with system prompt
      const input: ConverseStreamCommandInput = {
        modelId: this.modelId,
        system: [{ text: systemPrompt }],
        messages: [
          {
            role: 'user',
            content: [{ text: userPrompt }],
          },
        ],
        inferenceConfig: {
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens || 4096,
          topP: options.topP ?? 1,
        },
      };

      const command = new ConverseStreamCommand(input);
      const response = await this.client.send(command);

      if (!response.stream) {
        throw new BedrockError('Empty streaming response from Bedrock');
      }

      // Process the stream
      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta && 'text' in event.contentBlockDelta.delta) {
          yield event.contentBlockDelta.delta.text || '';
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
   * Invokes a Bedrock model with vision capabilities (multimodal)
   * Supports image analysis with Claude's vision capabilities
   * 
   * @param systemPrompt - System prompt for the model
   * @param userPrompt - User prompt/question about the image
   * @param image - Image content (base64 encoded data and format)
   * @param outputSchema - Zod schema for validating the response
   * @param options - Optional configuration for the request
   * @returns Validated response matching the output schema
   */
  async invokeWithVision<TOutput>(
    systemPrompt: string,
    userPrompt: string,
    image: ImageContent,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    // Note: Caching for vision requests is more complex due to large image data
    // For now, we'll skip caching for vision requests or implement it later with hash of image
    // If we want to support it, we should hash the image data for the key

    const retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...options.retryConfig,
    };

    // Create execution logger if metadata provided
    let executionLogger: ExecutionLogger | undefined;
    if (options.flowName && options.executionMetadata) {
      executionLogger = createExecutionLogger(
        options.flowName,
        this.modelId,
        options.executionMetadata
      );
    }

    return this.withRetry(async () => {
      try {
        // Decode base64 image data to binary
        const imageBytes = Buffer.from(image.data, 'base64');

        // Construct Converse API request with image content
        const input: ConverseCommandInput = {
          modelId: this.modelId,
          system: [{ text: systemPrompt }],
          messages: [
            {
              role: 'user',
              content: [
                {
                  image: {
                    format: image.format,
                    source: {
                      bytes: imageBytes,
                    },
                  },
                },
                {
                  text: userPrompt,
                },
              ],
            },
          ],
          inferenceConfig: {
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens || 4096,
            topP: options.topP ?? 1,
          },
        };

        const command = new ConverseCommand(input);
        const response = await this.client.send(command);

        if (!response.output) {
          throw new BedrockError('Empty response from Bedrock');
        }

        // Extract text from response
        const textResponse = this.extractTextFromResponse(
          response.output.message?.content
        );

        // Parse JSON response with fallback handling
        const parsedOutput = this.parseJSONResponse(textResponse);

        // Validate against schema
        const validationResult = outputSchema.safeParse(parsedOutput);

        if (!validationResult.success) {
          throw new BedrockParseError(
            'Response does not match expected schema',
            parsedOutput,
            validationResult.error
          );
        }

        // Log successful execution with token usage
        if (executionLogger) {
          const tokenUsage = extractTokenUsage(response);
          executionLogger.logSuccess(tokenUsage);
        }

        return validationResult.data;
      } catch (error) {
        // Log error if logger exists
        if (executionLogger) {
          const err = error as any;
          executionLogger.logError(
            error instanceof Error ? error : new Error(String(error)),
            err.code || err.name,
            err.statusCode || err.$metadata?.httpStatusCode
          );
        }

        if (error instanceof BedrockError || error instanceof BedrockParseError) {
          throw error;
        }

        const err = error as any;
        throw new BedrockError(
          err.message || 'Failed to invoke Bedrock model with vision',
          err.code || err.name,
          err.statusCode || err.$metadata?.httpStatusCode,
          error
        );
      }
    }, retryConfig, executionLogger);
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

