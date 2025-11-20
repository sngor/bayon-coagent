/**
 * Zod schemas for Market Forecaster Worker Agent
 * 
 * This worker agent handles market forecasting tasks including:
 * - Price trend predictions
 * - Market condition forecasts
 * - Investment timing analysis
 * - Market opportunity identification
 */

import { z } from 'zod';

/**
 * Timeframe options for forecasts
 */
export const TimeframeSchema = z.enum([
  '30-day',
  '90-day',
  '6-month',
  '1-year',
  '2-year',
]);

export type Timeframe = z.infer<typeof TimeframeSchema>;

/**
 * Trend direction
 */
export const TrendSchema = z.enum(['up', 'down', 'stable']);

export type Trend = z.infer<typeof TrendSchema>;

/**
 * Historical data point schema
 */
export const HistoricalDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  metric: z.string(),
});

/**
 * Input schema for Market Forecaster Worker
 */
export const MarketForecasterInputSchema = z.object({
  /** Historical market data for analysis */
  historicalData: z.array(HistoricalDataPointSchema).describe('Historical market data for analysis'),
  
  /** Forecast timeframe */
  timeframe: TimeframeSchema.describe('Forecast timeframe'),
  
  /** Market location */
  market: z.string().describe('Market location'),
  
  /** Optional property type filter */
  propertyType: z.string().optional().describe('Optional property type filter'),
  
  /** Optional additional context */
  context: z.record(z.any()).optional().describe('Optional additional context'),
});

export type MarketForecasterInput = z.infer<typeof MarketForecasterInputSchema>;

/**
 * Forecast result schema
 */
export const ForecastSchema = z.object({
  /** Predicted trend direction */
  trend: TrendSchema.describe('Predicted trend direction'),
  
  /** Confidence level (0-1) */
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1)'),
  
  /** Predicted price range */
  priceRange: z.object({
    low: z.number(),
    high: z.number(),
    median: z.number().optional(),
  }).describe('Predicted price range'),
  
  /** Percentage change prediction */
  percentageChange: z.object({
    low: z.number(),
    high: z.number(),
    expected: z.number(),
  }).optional().describe('Percentage change prediction'),
});

/**
 * Output schema for Market Forecaster Worker
 */
export const MarketForecasterOutputSchema = z.object({
  /** Forecast results */
  forecast: ForecastSchema.describe('Forecast results'),
  
  /** Key factors influencing the forecast */
  factors: z.array(z.string()).describe('Key factors influencing the forecast'),
  
  /** Disclaimer with qualifying language */
  disclaimer: z.string().describe('Disclaimer with qualifying language'),
  
  /** Detailed analysis narrative */
  analysis: z.string().describe('Detailed analysis narrative'),
  
  /** Recommendations based on forecast */
  recommendations: z.array(z.string()).optional().describe('Recommendations based on forecast'),
  
  /** Data sources used */
  sources: z.array(z.object({
    type: z.string(),
    description: z.string(),
  })).optional().describe('Data sources used'),
});

export type MarketForecasterOutput = z.infer<typeof MarketForecasterOutputSchema>;
