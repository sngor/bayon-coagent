import { z } from 'zod';

/**
 * Schema for generating market updates
 */
export const GenerateMarketUpdateInputSchema = z.object({
  location: z.string().describe('The location for the market update'),
  timePeriod: z.string().describe('The time period (e.g., "Q1 2024", "January 2024")'),
  audience: z.string().describe('The target audience (e.g., "first-time buyers", "investors")'),
});

export const GenerateMarketUpdateOutputSchema = z.object({
  marketUpdate: z.string().describe('The generated market update in Markdown format'),
});

export type GenerateMarketUpdateInput = z.infer<typeof GenerateMarketUpdateInputSchema>;
export type GenerateMarketUpdateOutput = z.infer<typeof GenerateMarketUpdateOutputSchema>;
