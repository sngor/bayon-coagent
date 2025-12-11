/**
 * Market Update Schemas
 */

import { z } from 'zod';

// Market Update Generation Schemas
export const GenerateMarketUpdateInputSchema = z.object({
  location: z.string().describe('The location for the market update'),
  timePeriod: z.string().describe('The time period for the market update'),
  audience: z.string().optional().describe('Target audience for the update'),
});

export const GenerateMarketUpdateOutputSchema = z.object({
  title: z.string().describe('Market update title'),
  content: z.string().describe('Market update content'),
  keyPoints: z.array(z.string()).describe('Key market points'),
  statistics: z.array(z.object({
    metric: z.string(),
    value: z.string(),
    change: z.string().optional(),
  })).optional().describe('Market statistics'),
});

export type GenerateMarketUpdateInput = z.infer<typeof GenerateMarketUpdateInputSchema>;
export type GenerateMarketUpdateOutput = z.infer<typeof GenerateMarketUpdateOutputSchema>;

// Future Cast Schemas (existing)
export const GenerateFutureCastInputSchema = z.object({
  location: z.string(),
  timeframe: z.string(),
  marketData: z.any().optional(),
});

export const GenerateFutureCastOutputSchema = z.object({
  forecast: z.string(),
  confidence: z.number(),
  factors: z.array(z.string()),
});

export type GenerateFutureCastInput = z.infer<typeof GenerateFutureCastInputSchema>;
export type GenerateFutureCastOutput = z.infer<typeof GenerateFutureCastOutputSchema>;