/**
 * Zod schemas for Data Analyst Worker Agent
 * 
 * This worker agent handles data analysis tasks including:
 * - Market data analysis
 * - Property data analysis
 * - Statistical analysis
 * - Web search for data gathering
 */

import { z } from 'zod';

/**
 * Data source types
 */
export const DataSourceSchema = z.enum([
  'mls',
  'market-report',
  'tavily',
  'web',
  'internal',
]);

export type DataSource = z.infer<typeof DataSourceSchema>;

/**
 * Input schema for Data Analyst Worker
 */
export const DataAnalystInputSchema = z.object({
  /** The data analysis query or question */
  query: z.string().min(1).describe('The data analysis query or question'),
  
  /** Data source to use for analysis */
  dataSource: DataSourceSchema.describe('Data source to use for analysis'),
  
  /** Optional filters for data retrieval */
  filters: z.record(z.any()).optional().describe('Optional filters for data retrieval'),
  
  /** Optional context for personalization */
  context: z.object({
    market: z.string().optional(),
    timeframe: z.string().optional(),
    propertyType: z.string().optional(),
  }).optional(),
});

export type DataAnalystInput = z.infer<typeof DataAnalystInputSchema>;

/**
 * Data point schema for structured data results
 */
export const DataPointSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  source: z.string().optional(),
});

/**
 * Output schema for Data Analyst Worker
 */
export const DataAnalystOutputSchema = z.object({
  /** Structured data results */
  data: z.array(DataPointSchema).describe('Structured data results'),
  
  /** Summary of the analysis */
  summary: z.string().describe('Summary of the analysis'),
  
  /** Sources used for the analysis */
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
    sourceType: z.string(),
  })).describe('Sources used for the analysis'),
  
  /** Key insights from the data */
  insights: z.array(z.string()).optional().describe('Key insights from the data'),
  
  /** Confidence level in the analysis (0-1) */
  confidence: z.number().min(0).max(1).optional().describe('Confidence level in the analysis'),
});

export type DataAnalystOutput = z.infer<typeof DataAnalystOutputSchema>;
