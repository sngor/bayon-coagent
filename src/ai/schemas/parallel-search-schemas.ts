/**
 * Parallel Search Schemas
 * 
 * Zod schemas for parallel search agent input and output validation
 */

import { z } from 'zod';

/**
 * Platform types for parallel search
 */
export const PlatformSchema = z.enum(['chatgpt', 'gemini', 'claude']);
export type Platform = z.infer<typeof PlatformSchema>;

/**
 * Input schema for parallel search
 */
export const ParallelSearchInputSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  platforms: z.array(PlatformSchema).min(1, 'At least one platform is required'),
  agentName: z.string().optional(),
  firmName: z.string().optional(),
});

export type ParallelSearchInput = z.infer<typeof ParallelSearchInputSchema>;

/**
 * Result from a single platform
 */
export const PlatformResultSchema = z.object({
  platform: PlatformSchema,
  response: z.string(),
  sources: z.array(z.string()),
  agentMentioned: z.boolean(),
  agentRanking: z.number().optional(),
  error: z.string().optional(),
});

export type PlatformResult = z.infer<typeof PlatformResultSchema>;

/**
 * Output schema for parallel search
 */
export const ParallelSearchOutputSchema = z.object({
  results: z.array(PlatformResultSchema),
  consensus: z.array(z.string()),
  discrepancies: z.array(z.string()),
  summary: z.string(),
  agentVisibility: z.object({
    mentioned: z.boolean(),
    platforms: z.array(PlatformSchema),
    rankings: z.record(z.string(), z.number()),
  }),
});

export type ParallelSearchOutput = z.infer<typeof ParallelSearchOutputSchema>;
