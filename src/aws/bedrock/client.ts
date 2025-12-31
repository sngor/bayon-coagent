/**
 * Enhanced Bedrock Client with Streaming Support
 * 
 * Provides comprehensive AI capabilities including streaming responses,
 * vision processing, proper error handling, and retry mechanisms.
 */

import { 
  BedrockRuntimeClient, 
  ConverseCommand, 
  ConverseStreamCommand,
  ConverseCommandInput,
  ConverseStreamCommandInput,
  Message,
  ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { z } from 'zod';
import { getConfig } from '../config';

export interface InvokeOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  useCache?: boolean;
  retryConfig?: RetryConfig;
  flowName?: string;
  executionMetadata?: any;
  systemPrompt?: string;
}

export interface InvokeStreamOptions extends InvokeOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: BedrockError) => void;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ImageContent {
  format: 'jpeg' | 'png' | 'gif' | 'webp';
  source: {
    bytes: Uint8Array;
  };
}

export interface VisionInput {
  images: ImageContent[];
  prompt: string;
}

export class BedrockError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'BedrockError';
  }
}

export class BedrockParseError extends Error {
  constructor(
    message: string,
    public rawOutput: any,
    public validationError: any
  ) {
    super(message);
    this.name = 'BedrockParseError';
  }
}

export class BedrockClient {
  private client: BedrockRuntimeClient;
  private modelId: string;
  private defaultRetryConfig: RetryConfig;

  constructor(modelId?: string) {
    const config = getConfig();
    this.client = new BedrockRuntimeClient({
      region: config.bedrock.region,
    });
    this.modelId = modelId || config.bedrock.modelId;
    this.defaultRetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    };
  }

  /**
   * Enhanced invoke method with proper error handling and retry logic
   */
  async invoke<TOutput>(
    prompt: string,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    const retryConfig = options.retryConfig || this.defaultRetryConfig;
    
    return this.withRetry(async () => {
      try {
        const messages: Message[] = [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ];

        const input: ConverseCommandInput = {
          modelId: this.modelId,
          messages,
          inferenceConfig: {
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens ?? 4096,
            topP: options.topP ?? 0.9,
          },
        };

        if (options.systemPrompt) {
          input.system = [{ text: options.systemPrompt }];
        }

        const command = new ConverseCommand(input);
        const response = await this.client.send(command);

        if (!response.output?.message?.content?.[0]?.text) {
          throw new BedrockError('Empty response from Bedrock', 'EMPTY_RESPONSE');
        }

        const rawOutput = response.output.message.content[0].text;
        
        // Parse and validate output
        try {
          const parsedOutput = this.parseOutput(rawOutput);
          return outputSchema.parse(parsedOutput);
        } catch (parseError) {
          throw new BedrockParseError(
            'Failed to parse Bedrock response',
            rawOutput,
            parseError
          );
        }
      } catch (error) {
        throw this.handleBedrockError(error);
      }
    }, retryConfig);
  }

  /**
   * Streaming invoke method for real-time responses
   */
  async invokeStream<TOutput>(
    prompt: string,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeStreamOptions = {}
  ): Promise<TOutput> {
    try {
      const messages: Message[] = [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ];

      const input: ConverseStreamCommandInput = {
        modelId: this.modelId,
        messages,
        inferenceConfig: {
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? 4096,
          topP: options.topP ?? 0.9,
        },
      };

      if (options.systemPrompt) {
        input.system = [{ text: options.systemPrompt }];
      }

      const command = new ConverseStreamCommand(input);
      const response = await this.client.send(command);

      let fullResponse = '';

      if (response.stream) {
        for await (const chunk of response.stream) {
          if (chunk.contentBlockDelta?.delta?.text) {
            const chunkText = chunk.contentBlockDelta.delta.text;
            fullResponse += chunkText;
            options.onChunk?.(chunkText);
          }
        }
      }

      if (!fullResponse.trim()) {
        throw new BedrockError('Empty response from streaming', 'EMPTY_STREAM_RESPONSE');
      }

      try {
        const parsedOutput = this.parseOutput(fullResponse);
        const validatedOutput = outputSchema.parse(parsedOutput);
        options.onComplete?.(fullResponse);
        return validatedOutput;
      } catch (parseError) {
        const error = new BedrockParseError(
          'Failed to parse streaming response',
          fullResponse,
          parseError
        );
        options.onError?.(error);
        throw error;
      }
    } catch (error) {
      const bedrockError = this.handleBedrockError(error);
      options.onError?.(bedrockError);
      throw bedrockError;
    }
  }

  /**
   * Vision capabilities for image analysis
   */
  async invokeVision<TOutput>(
    visionInput: VisionInput,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    const retryConfig = options.retryConfig || this.defaultRetryConfig;
    
    return this.withRetry(async () => {
      try {
        const contentBlocks: ContentBlock[] = [
          { text: visionInput.prompt },
          ...visionInput.images.map(img => ({
            image: {
              format: img.format,
              source: { bytes: img.source.bytes },
            },
          })),
        ];

        const messages: Message[] = [
          {
            role: 'user',
            content: contentBlocks,
          },
        ];

        const input: ConverseCommandInput = {
          modelId: this.modelId,
          messages,
          inferenceConfig: {
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens ?? 4096,
            topP: options.topP ?? 0.9,
          },
        };

        if (options.systemPrompt) {
          input.system = [{ text: options.systemPrompt }];
        }

        const command = new ConverseCommand(input);
        const response = await this.client.send(command);

        if (!response.output?.message?.content?.[0]?.text) {
          throw new BedrockError('Empty response from vision model', 'EMPTY_VISION_RESPONSE');
        }

        const rawOutput = response.output.message.content[0].text;
        
        try {
          const parsedOutput = this.parseOutput(rawOutput);
          return outputSchema.parse(parsedOutput);
        } catch (parseError) {
          throw new BedrockParseError(
            'Failed to parse vision response',
            rawOutput,
            parseError
          );
        }
      } catch (error) {
        throw this.handleBedrockError(error);
      }
    }, retryConfig);
  }

  /**
   * Parse JSON output from Bedrock response
   */
  private parseOutput(rawOutput: string): any {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = rawOutput.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to parse the entire response as JSON
    try {
      return JSON.parse(rawOutput);
    } catch {
      // If not JSON, return as text
      return { text: rawOutput.trim() };
    }
  }

  /**
   * Handle and categorize Bedrock errors
   */
  private handleBedrockError(error: any): BedrockError {
    if (error instanceof BedrockError || error instanceof BedrockParseError) {
      return error;
    }

    const message = error.message || 'Unknown Bedrock error';
    const lowerMessage = message.toLowerCase();

    // Categorize errors and determine if they're retryable
    if (lowerMessage.includes('throttl') || lowerMessage.includes('rate limit')) {
      return new BedrockError(
        'Rate limit exceeded. Please try again in a moment.',
        'RATE_LIMIT',
        429,
        error,
        true
      );
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return new BedrockError(
        'Request timed out. Please try again.',
        'TIMEOUT',
        408,
        error,
        true
      );
    }

    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return new BedrockError(
        'Invalid request parameters.',
        'VALIDATION_ERROR',
        400,
        error,
        false
      );
    }

    if (lowerMessage.includes('content policy') || lowerMessage.includes('filtered')) {
      return new BedrockError(
        'Content was filtered by safety policies.',
        'CONTENT_FILTERED',
        400,
        error,
        false
      );
    }

    if (lowerMessage.includes('model not found') || lowerMessage.includes('not supported')) {
      return new BedrockError(
        'Model not available or not supported.',
        'MODEL_ERROR',
        404,
        error,
        false
      );
    }

    // Default to server error with retry
    return new BedrockError(
      'Bedrock service error. Please try again.',
      'SERVICE_ERROR',
      500,
      error,
      true
    );
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if error is not retryable
        if (error instanceof BedrockError && !error.retryable) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }
    
    throw lastError!;
  }
}
            role: 'user' as const,
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

      if (!response.output?.message?.content?.[0]?.text) {
        throw new BedrockError('Empty response from Bedrock');
      }

      const textResponse = response.output.message.content[0].text;
      
      // Try to parse as JSON, fallback to plain text
      let parsedOutput: any;
      try {
        parsedOutput = JSON.parse(textResponse);
      } catch {
        parsedOutput = { content: textResponse };
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
  }

  /**
   * Simplified streaming method
   */
  async *invokeStream(
    prompt: string,
    options: InvokeStreamOptions = {}
  ): AsyncIterable<string> {
    // For now, fall back to regular invoke and yield the result
    try {
      const result = await this.invoke(prompt, z.object({ content: z.string() }), options);
      yield result.content;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simplified method with system and user prompts
   */
  async invokeWithPrompts<TOutput>(
    systemPrompt: string,
    userPrompt: string,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    const combinedPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;
    return this.invoke(combinedPrompt, outputSchema, options);
  }

  /**
   * Placeholder for streaming with prompts
   */
  async *invokeStreamWithPrompts(
    systemPrompt: string,
    userPrompt: string,
    options: InvokeStreamOptions = {}
  ): AsyncIterable<string> {
    const combinedPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;
    yield* this.invokeStream(combinedPrompt, options);
  }

  /**
   * Placeholder for vision capabilities
   */
  async invokeWithVision<TOutput>(
    systemPrompt: string,
    userPrompt: string,
    image: ImageContent,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    // For now, ignore image and use text-only
    console.warn('Vision capabilities not implemented in minimal client');
    return this.invokeWithPrompts(systemPrompt, userPrompt, outputSchema, options);
  }

  /**
   * Get circuit breaker metrics (placeholder)
   */
  getCircuitBreakerMetrics() {
    return {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
    };
  }
}

// Export singleton instance
export const bedrockClient = new BedrockClient();

/**
 * Get the singleton Bedrock client instance
 */
export function getBedrockClient(): BedrockClient {
  return bedrockClient;
}