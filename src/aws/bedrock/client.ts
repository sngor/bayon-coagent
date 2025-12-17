/**
 * Minimal Bedrock Client for Production Deployment
 * This is a simplified version to allow builds while the full client is being fixed
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { z } from 'zod';
import { getConfig } from '../config';

export interface InvokeOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  useCache?: boolean;
  retryConfig?: any;
  flowName?: string;
  executionMetadata?: any;
}

export interface InvokeStreamOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ImageContent {
  format: string;
  source: {
    bytes: Uint8Array;
  };
}

export class BedrockError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: any
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

  constructor(modelId?: string) {
    const config = getConfig();
    this.client = new BedrockRuntimeClient({
      region: config.bedrock.region,
    });
    this.modelId = modelId || config.bedrock.modelId;
  }

  /**
   * Basic invoke method for production deployment
   */
  async invoke<TOutput>(
    prompt: string,
    outputSchema: z.ZodSchema<TOutput>,
    options: InvokeOptions = {}
  ): Promise<TOutput> {
    try {
      const input = {
        modelId: this.modelId,
        messages: [
          {
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