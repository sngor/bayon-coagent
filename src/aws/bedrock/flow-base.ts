/**
 * Base Flow Interface and Utilities for Bedrock AI Flows
 * 
 * This module provides the foundation for migrating Genkit flows to Bedrock.
 * It defines a common interface and helper functions for creating AI flows.
 */

import { z } from 'zod';
import { getBedrockClient, BedrockError, BedrockParseError } from './client';
import { getConfig } from '@/aws/config';
import { categorizeFlow, type ExecutionMetadata } from './execution-logger';

/**
 * Base interface for AI flows
 */
export interface AIFlow<TInput, TOutput> {
  name: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Bedrock model identifiers
 * 
 * IMPORTANT: AWS Bedrock now requires inference profiles for all Claude models.
 * Use cross-region inference profiles (us.* prefix) which work in any region.
 * Direct model IDs (without us. prefix) will fail with ValidationException.
 */
export const BEDROCK_MODELS = {
  HAIKU: 'us.anthropic.claude-3-haiku-20240307-v1:0',
  SONNET_3: 'us.anthropic.claude-3-sonnet-20240229-v1:0',
  SONNET_3_5_V1: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  SONNET_3_5_V2: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  OPUS: 'us.anthropic.claude-3-opus-20240229-v1:0',
} as const;

/**
 * Model configuration presets
 */
export const MODEL_CONFIGS = {
  // Fast, simple tasks
  SIMPLE: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.3,
    maxTokens: 2048,
  },
  // Balanced general purpose
  BALANCED: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.5,
    maxTokens: 4096,
  },
  // Creative content
  CREATIVE: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.7,
    maxTokens: 4096,
  },
  // Long-form content
  LONG_FORM: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.6,
    maxTokens: 8192,
  },
  // Analytical tasks
  ANALYTICAL: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.2,
    maxTokens: 4096,
  },
  // Critical accuracy
  CRITICAL: {
    modelId: BEDROCK_MODELS.OPUS,
    temperature: 0.1,
    maxTokens: 4096,
  },
} as const;

/**
 * Options for creating a flow
 */
export interface FlowOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  modelId?: string;
}

/**
 * Runtime override options for flow execution
 */
export interface FlowExecutionOptions {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  userId?: string;
}

/**
 * Creates a Bedrock AI flow with schema validation
 * 
 * @param config - Flow configuration
 * @param handler - Flow execution handler
 * @returns AI flow instance
 */
export function defineFlow<TInput, TOutput>(
  config: {
    name: string;
    inputSchema: z.ZodSchema<TInput>;
    outputSchema: z.ZodSchema<TOutput>;
  },
  handler: (input: TInput) => Promise<TOutput>
): AIFlow<TInput, TOutput> {
  return {
    name: config.name,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    execute: async (input: TInput): Promise<TOutput> => {
      // Validate input
      const validatedInput = config.inputSchema.parse(input);
      
      // Execute handler
      return handler(validatedInput);
    },
  };
}

/**
 * Creates a prompt-based flow that invokes Bedrock with a template
 * 
 * @param config - Prompt configuration
 * @returns Function that executes the prompt with optional runtime overrides
 */
export function definePrompt<TInput extends Record<string, any>, TOutput>(
  config: {
    name: string;
    inputSchema: z.ZodSchema<TInput>;
    outputSchema: z.ZodSchema<TOutput>;
    prompt: string;
    systemPrompt?: string;
    options?: FlowOptions;
  }
): (input: TInput, runtimeOptions?: FlowExecutionOptions) => Promise<TOutput> {
  return async (input: TInput, runtimeOptions?: FlowExecutionOptions): Promise<TOutput> => {
    // Validate input
    const validatedInput = config.inputSchema.parse(input);
    
    // Replace template variables in prompt
    let userPrompt = config.prompt;
    for (const [key, value] of Object.entries(validatedInput)) {
      const regex = new RegExp(`{{{${key}}}}`, 'g');
      const formattedValue = formatPromptValue(value);
      userPrompt = userPrompt.replace(regex, formattedValue);
      
      // Also support {{{json key}}} format for explicit JSON formatting
      const jsonRegex = new RegExp(`{{{json ${key}}}}`, 'g');
      const jsonValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : formattedValue;
      userPrompt = userPrompt.replace(jsonRegex, jsonValue);
    }
    
    // Merge runtime options with config options (runtime takes precedence)
    const effectiveModelId = runtimeOptions?.modelId ?? config.options?.modelId;
    const effectiveTemperature = runtimeOptions?.temperature ?? config.options?.temperature ?? 0.7;
    const effectiveMaxTokens = runtimeOptions?.maxTokens ?? config.options?.maxTokens ?? 4096;
    const effectiveTopP = runtimeOptions?.topP ?? config.options?.topP ?? 1;
    
    // Get Bedrock client with effective model ID
    const client = getBedrockClient(effectiveModelId);
    
    // Create execution metadata for logging
    const executionMetadata: ExecutionMetadata = {
      userId: runtimeOptions?.userId,
      featureCategory: categorizeFlow(config.name),
      temperature: effectiveTemperature,
      maxTokens: effectiveMaxTokens,
      topP: effectiveTopP,
    };
    
    // Construct user prompt with JSON instruction
    // Note: Using Converse API, so no need for "Human:" / "Assistant:" prefixes
    const jsonInstruction = '\n\nIMPORTANT: Respond with ONLY valid JSON matching the required schema. Do not include any markdown formatting, code blocks, or explanatory text.';
    const fullUserPrompt = userPrompt + jsonInstruction;
    
    try {
      // Invoke Bedrock with effective options and execution logging
      // Use invokeWithPrompts if we have a system prompt, otherwise use invoke
      const response = config.systemPrompt
        ? await client.invokeWithPrompts(
            config.systemPrompt,
            fullUserPrompt,
            config.outputSchema,
            {
              temperature: effectiveTemperature,
              maxTokens: effectiveMaxTokens,
              topP: effectiveTopP,
              flowName: config.name,
              executionMetadata,
            }
          )
        : await client.invoke(
            fullUserPrompt,
            config.outputSchema,
            {
              temperature: effectiveTemperature,
              maxTokens: effectiveMaxTokens,
              topP: effectiveTopP,
              flowName: config.name,
              executionMetadata,
            }
          );
      
      return response;
    } catch (error) {
      if (error instanceof BedrockParseError) {
        // Try to extract useful information from the raw response
        console.error('Bedrock parse error:', error.message);
        console.error('Raw response:', error.response);
        throw new Error(`AI response validation failed: ${error.message}`);
      }
      
      if (error instanceof BedrockError) {
        console.error('Bedrock error:', error.message, error.code);
        throw new Error(`AI service error: ${error.message}`);
      }
      
      throw error;
    }
  };
}

/**
 * Helper to format input values for prompts
 */
export function formatPromptValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(v => formatPromptValue(v)).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Helper to create a streaming flow with optional runtime overrides
 */
export async function* invokeStream(
  prompt: string,
  options?: FlowOptions,
  runtimeOptions?: FlowExecutionOptions
): AsyncIterable<string> {
  // Merge runtime options with config options (runtime takes precedence)
  const effectiveModelId = runtimeOptions?.modelId ?? options?.modelId;
  const effectiveTemperature = runtimeOptions?.temperature ?? options?.temperature;
  const effectiveMaxTokens = runtimeOptions?.maxTokens ?? options?.maxTokens;
  const effectiveTopP = runtimeOptions?.topP ?? options?.topP;
  
  const client = getBedrockClient(effectiveModelId);
  
  yield* client.invokeStream(prompt, {
    temperature: effectiveTemperature,
    maxTokens: effectiveMaxTokens,
    topP: effectiveTopP,
  });
}

/**
 * Helper to merge flow options with runtime overrides
 * Useful for testing and debugging
 * 
 * @param configOptions - Options defined in flow configuration
 * @param runtimeOptions - Runtime override options
 * @returns Merged effective options
 */
export function mergeFlowOptions(
  configOptions?: FlowOptions,
  runtimeOptions?: FlowExecutionOptions
): Required<FlowOptions> {
  const config = getConfig();
  
  return {
    modelId: runtimeOptions?.modelId ?? configOptions?.modelId ?? config.bedrock.modelId,
    temperature: runtimeOptions?.temperature ?? configOptions?.temperature ?? 0.7,
    maxTokens: runtimeOptions?.maxTokens ?? configOptions?.maxTokens ?? 4096,
    topP: runtimeOptions?.topP ?? configOptions?.topP ?? 1,
  };
}
