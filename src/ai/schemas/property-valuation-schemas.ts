import { z } from 'zod';

/**
 * Schema for AI property valuation
 */
export const PropertyValuationInputSchema = z.object({
    propertyDescription: z.string().describe('Property description or address'),
});

export const PropertyValuationOutputSchema = z.object({
    estimatedValue: z.number().describe('Estimated property value in USD'),
    valueRange: z.object({
        low: z.number().describe('Lower bound of value estimate'),
        high: z.number().describe('Upper bound of value estimate'),
    }).describe('Value range estimate'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the valuation'),
    keyFactors: z.array(z.string()).describe('Key factors influencing the valuation'),
    comparableProperties: z.array(z.object({
        address: z.string().describe('Address of comparable property'),
        price: z.number().describe('Sale price of comparable property'),
        sqft: z.number().optional().describe('Square footage'),
        beds: z.number().optional().describe('Number of bedrooms'),
        baths: z.number().optional().describe('Number of bathrooms'),
        saleDate: z.string().optional().describe('Date of sale'),
    })).describe('Comparable properties used in valuation'),
    marketAnalysis: z.string().describe('Market analysis and trends affecting the property'),
    recommendations: z.array(z.string()).describe('Recommendations for the property owner or buyer'),
    disclaimer: z.string().describe('Disclaimer about the AI valuation'),
});

export type PropertyValuationInput = z.infer<typeof PropertyValuationInputSchema>;
export type PropertyValuationOutput = z.infer<typeof PropertyValuationOutputSchema>;