/**
 * Future Cast Schemas
 * Zod schemas for market future casting and predictions
 */

import { z } from 'zod';

export const FutureCastInputSchema = z.object({
    location: z.string().min(1, 'Location is required'),
    propertyType: z.enum(['single-family', 'condo', 'townhouse', 'multi-family', 'commercial']).default('single-family'),
    timeframe: z.enum(['6-months', '1-year', '2-years', '5-years']).default('1-year'),
    analysisType: z.enum(['price-prediction', 'market-trends', 'investment-outlook', 'demographic-shifts']).default('price-prediction'),
    includeEconomicFactors: z.boolean().default(true),
    includeLocalDevelopment: z.boolean().default(true),
    includeMarketCycles: z.boolean().default(true),
    confidenceLevel: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
});

export const FutureCastOutputSchema = z.object({
    summary: z.string(),
    predictions: z.array(z.object({
        metric: z.string(),
        currentValue: z.string(),
        predictedValue: z.string(),
        changePercentage: z.number(),
        confidence: z.enum(['low', 'medium', 'high']),
        reasoning: z.string(),
    })),
    keyFactors: z.array(z.object({
        factor: z.string(),
        impact: z.enum(['positive', 'negative', 'neutral']),
        description: z.string(),
        weight: z.number().min(0).max(1),
    })),
    risks: z.array(z.object({
        risk: z.string(),
        probability: z.enum(['low', 'medium', 'high']),
        impact: z.enum(['low', 'medium', 'high']),
        mitigation: z.string(),
    })),
    opportunities: z.array(z.object({
        opportunity: z.string(),
        timeframe: z.string(),
        description: z.string(),
        actionItems: z.array(z.string()),
    })),
    methodology: z.string(),
    dataSource: z.string(),
    lastUpdated: z.string(),
    disclaimer: z.string(),
});

export type FutureCastInput = z.infer<typeof FutureCastInputSchema>;
export type FutureCastOutput = z.infer<typeof FutureCastOutputSchema>;

// Legacy export names for compatibility
export const GenerateFutureCastInputSchema = FutureCastInputSchema;
export const GenerateFutureCastOutputSchema = FutureCastOutputSchema;