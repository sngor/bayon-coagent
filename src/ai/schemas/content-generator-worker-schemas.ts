/**
 * Zod schemas for Content Generator Worker Agent
 * 
 * This worker agent handles content generation tasks including:
 * - Email generation
 * - Listing descriptions
 * - Social media posts
 * - Marketing content
 */

import { z } from 'zod';

/**
 * Content types
 */
export const ContentTypeSchema = z.enum([
  'email',
  'listing',
  'social-post',
  'summary',
  'blog-excerpt',
  'marketing-copy',
]);

export type ContentType = z.infer<typeof ContentTypeSchema>;

/**
 * Agent profile schema for personalization
 */
export const AgentProfileContextSchema = z.object({
  agentName: z.string(),
  primaryMarket: z.string(),
  specialization: z.enum(['luxury', 'first-time-buyers', 'investment', 'commercial', 'general']),
  preferredTone: z.enum(['warm-consultative', 'direct-data-driven', 'professional', 'casual']),
  corePrinciple: z.string(),
});

export type AgentProfileContext = z.infer<typeof AgentProfileContextSchema>;

/**
 * Input schema for Content Generator Worker
 */
export const ContentGeneratorInputSchema = z.object({
  /** Type of content to generate */
  contentType: ContentTypeSchema.describe('Type of content to generate'),
  
  /** Context and data for content generation */
  context: z.record(z.any()).describe('Context and data for content generation'),
  
  /** Agent profile for personalization */
  agentProfile: AgentProfileContextSchema.describe('Agent profile for personalization'),
  
  /** Optional specific instructions */
  instructions: z.string().optional().describe('Optional specific instructions'),
  
  /** Target length (words) */
  targetLength: z.number().optional().describe('Target length in words'),
});

export type ContentGeneratorInput = z.infer<typeof ContentGeneratorInputSchema>;

/**
 * Output schema for Content Generator Worker
 */
export const ContentGeneratorOutputSchema = z.object({
  /** Generated content */
  content: z.string().describe('Generated content'),
  
  /** Tone used in the content */
  tone: z.string().describe('Tone used in the content'),
  
  /** Word count of generated content */
  wordCount: z.number().describe('Word count of generated content'),
  
  /** Key themes or topics covered */
  themes: z.array(z.string()).optional().describe('Key themes or topics covered'),
  
  /** Personalization elements used */
  personalization: z.object({
    agentNameUsed: z.boolean(),
    marketMentioned: z.boolean(),
    specializationReflected: z.boolean(),
    corePrincipleIncluded: z.boolean(),
  }).describe('Personalization elements used'),
});

export type ContentGeneratorOutput = z.infer<typeof ContentGeneratorOutputSchema>;
