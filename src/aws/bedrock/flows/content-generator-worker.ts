'use server';

/**
 * Content Generator Worker Agent
 * 
 * This worker agent handles content generation tasks with agent profile
 * personalization. It generates various types of real estate content
 * tailored to the agent's brand, market, and communication style.
 * 
 * Requirements: 4.2
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
  ContentGeneratorInputSchema,
  ContentGeneratorOutputSchema,
  type ContentGeneratorInput,
  type ContentGeneratorOutput,
} from '@/ai/schemas/content-generator-worker-schemas';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import { createSuccessResult, createErrorResult } from '../worker-protocol';
import { getAgentProfileRepository, type AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

export { type ContentGeneratorInput, type ContentGeneratorOutput };

/**
 * Content Generator prompt that creates personalized content
 */
const contentGeneratorPrompt = definePrompt({
  name: 'contentGeneratorWorker',
  inputSchema: ContentGeneratorInputSchema,
  outputSchema: ContentGeneratorOutputSchema,
  options: MODEL_CONFIGS.CREATIVE,
  systemPrompt: `You are an expert real estate content writer who creates personalized, engaging content for real estate agents. Your content reflects the agent's unique brand, market expertise, and communication style.

**Your responsibilities:**
1. Generate content that matches the agent's preferred tone and specialization
2. Incorporate the agent's name, market, and core principle naturally
3. Create engaging, professional content appropriate for the content type
4. Ensure all content is real estate-focused and valuable to the target audience
5. Match the requested length and format
6. Reflect the agent's brand consistently

**Tone Guidelines:**
- warm-consultative: Friendly, empathetic, relationship-focused
- direct-data-driven: Factual, analytical, numbers-focused
- professional: Polished, formal, expertise-focused
- casual: Approachable, conversational, relatable

**Specialization Focus:**
- luxury: High-end properties, premium service, exclusivity
- first-time-buyers: Educational, supportive, step-by-step guidance
- investment: ROI-focused, analytical, market trends
- commercial: Business-focused, professional, strategic
- general: Balanced, versatile, community-oriented`,
  prompt: `Generate {{{contentType}}} content with the following details:

**Agent Profile:**
- Name: {{{agentProfile.agentName}}}
- Market: {{{agentProfile.primaryMarket}}}
- Specialization: {{{agentProfile.specialization}}}
- Preferred Tone: {{{agentProfile.preferredTone}}}
- Core Principle: {{{agentProfile.corePrinciple}}}

**Context:**
{{{json context}}}

**Instructions:** {{{instructions}}}

**Target Length:** {{{targetLength}}} words (approximate)

Create content that:
1. Reflects the agent's tone and specialization
2. Incorporates their name, market, and core principle naturally
3. Is appropriate for the content type
4. Provides value to the target audience
5. Maintains professional quality

Provide:
- The generated content
- The tone used
- Word count
- Key themes covered
- Which personalization elements were used (agentNameUsed, marketMentioned, specializationReflected, corePrincipleIncluded)`,
});

/**
 * Executes the Content Generator Worker
 * 
 * @param task - Worker task with content generation request
 * @returns Worker result with generated content
 */
export async function executeContentGeneratorWorker(
  task: WorkerTask
): Promise<WorkerResult> {
  const startTime = Date.now();
  const startedAt = new Date().toISOString();
  
  try {
    // Validate input
    const input = ContentGeneratorInputSchema.parse(task.input);
    
    // Load agent profile from repository if userId is provided but profile is not
    let agentProfile = input.agentProfile;
    if (!agentProfile && task.context?.userId) {
      const profileRepo = getAgentProfileRepository();
      const loadedProfile = await profileRepo.getProfile(task.context.userId);
      if (loadedProfile) {
        agentProfile = loadedProfile;
      }
    }
    
    // If no profile is available, throw an error as content generation requires personalization
    if (!agentProfile) {
      throw new Error('Agent profile is required for content generation');
    }
    
    // Set default target length if not provided
    const targetLength = input.targetLength || getDefaultLength(input.contentType);
    
    // Execute content generation prompt
    const output = await contentGeneratorPrompt({
      ...input,
      agentProfile,
      targetLength,
      instructions: input.instructions || `Generate high-quality ${input.contentType} content`,
    });
    
    const executionTime = Date.now() - startTime;
    
    return createSuccessResult(
      task.id,
      'content-generator',
      output,
      {
        executionTime,
        startedAt,
        modelId: MODEL_CONFIGS.CREATIVE.modelId,
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Determine error type
    let errorType: 'VALIDATION_ERROR' | 'API_ERROR' | 'INTERNAL_ERROR' = 'INTERNAL_ERROR';
    let errorMessage = 'An unexpected error occurred during content generation';
    
    if (error instanceof z.ZodError) {
      errorType = 'VALIDATION_ERROR';
      errorMessage = `Input validation failed: ${error.errors.map(e => e.message).join(', ')}`;
    } else if (error instanceof Error) {
      if (error.message.includes('API') || error.message.includes('Bedrock')) {
        errorType = 'API_ERROR';
      }
      errorMessage = error.message;
    }
    
    return createErrorResult(
      task.id,
      'content-generator',
      {
        type: errorType,
        message: errorMessage,
        details: error instanceof Error ? { stack: error.stack } : undefined,
      },
      {
        executionTime,
        startedAt,
      }
    );
  }
}

/**
 * Convenience function to generate content directly
 * (without going through the worker protocol)
 */
export async function generateContent(
  input: ContentGeneratorInput
): Promise<ContentGeneratorOutput> {
  const task: WorkerTask = {
    id: `direct_${Date.now()}`,
    type: 'content-generator',
    description: `Generate ${input.contentType} content`,
    dependencies: [],
    input,
    createdAt: new Date().toISOString(),
    status: 'in-progress',
  };
  
  const result = await executeContentGeneratorWorker(task);
  
  if (result.status === 'error') {
    throw new Error(result.error?.message || 'Content generation failed');
  }
  
  return result.output as ContentGeneratorOutput;
}

/**
 * Helper function to get default content length by type
 */
function getDefaultLength(contentType: string): number {
  const defaults: Record<string, number> = {
    'email': 200,
    'listing': 300,
    'social-post': 100,
    'summary': 150,
    'blog-excerpt': 250,
    'marketing-copy': 200,
  };
  
  return defaults[contentType] || 200;
}
