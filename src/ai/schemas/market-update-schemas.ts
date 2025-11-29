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

/**
 * Schema for generating FutureCast market forecasts
 */
export const GenerateFutureCastInputSchema = z.object({
  location: z.string().describe('The location for the market forecast'),
  timePeriod: z.string().optional().describe('The time period for the forecast (e.g., "next 6 months")'),
  propertyType: z.string().optional().describe('The type of property to forecast (e.g., "Single Family", "Condo")'),
  marketData: z.any().optional().describe('Historical market data to inform the forecast'),
});

export const FutureCastDataPointSchema = z.object({
  date: z.string().describe('The date for the data point (e.g., "2024-01")'),
  price: z.number().describe('The predicted median price'),
  trend: z.enum(['up', 'down', 'stable']).describe('The trend direction'),
  confidence: z.number().min(0).max(100).describe('Confidence score of the prediction (0-100)'),
});

export const GenerateFutureCastOutputSchema = z.object({
  forecasts: z.array(FutureCastDataPointSchema).describe('Array of forecasted data points'),
  summary: z.string().describe('A summary of the forecast'),
  actionableAdvice: z.string().describe('Actionable advice based on the forecast'),
});

export type GenerateFutureCastInput = z.infer<typeof GenerateFutureCastInputSchema>;
export type GenerateFutureCastOutput = z.infer<typeof GenerateFutureCastOutputSchema>;
