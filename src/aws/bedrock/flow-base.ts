/**
 * Base Flow Interface and Utilities for Bedrock AI Flows
 * 
 * This module provides the foundation for migrating Genkit flows to Bedrock.
 * It defines a common interface and helper functions for creating AI flows.
 */

import { z } from 'zod';
import { getBedrockClient, BedrockError, BedrockParseError } from './client';

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
 * Options for creating a flow
 */
export interface FlowOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  modelId?: string;
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
 * @returns Function that executes the prompt
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
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput): Promise<TOutput> => {
    // Validate input
    const validatedInput = config.inputSchema.parse(input);
    
    // Replace template variables in prompt
    let userPrompt = config.prompt;
    for (const [key, value] of Object.entries(validatedInput)) {
      const regex = new RegExp(`{{{${key}}}}`, 'g');
      userPrompt = userPrompt.replace(regex, String(value));
    }
    
    // Get Bedrock client
    const client = getBedrockClient(config.options?.modelId);
    
    // Construct full prompt
    const systemPrompt = config.systemPrompt || '';
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nHuman: ${userPrompt}\n\nAssistant: I'll provide the response in valid JSON format matching the required schema.`
      : `Human: ${userPrompt}\n\nAssistant: I'll provide the response in valid JSON format matching the required schema.`;
    
    try {
      // Invoke Bedrock
      const response = await client.invoke(
        fullPrompt,
        config.outputSchema,
        {
          temperature: config.options?.temperature,
          maxTokens: config.options?.maxTokens,
          topP: config.options?.topP,
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
 * Helper to create a streaming flow
 */
export async function* invokeStream(
  prompt: string,
  options?: FlowOptions
): AsyncIterable<string> {
  const client = getBedrockClient(options?.modelId);
  
  yield* client.invokeStream(prompt, {
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    topP: options?.topP,
  });
}
