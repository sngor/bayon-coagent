import { z } from 'zod';

/**
 * Schema for AI property valuation
 */
export const PropertyValuationInputSchema = z.object({
    propertyDescription: z.string().describe('Property description or address'),
});

export const PropertyValuationOutputSchema = z.object({
    propertyAnalysis: z.object({
        address: z.string().optional().describe('Property address'),
        features: z.object({
            bedrooms: z.number().optional().describe('Number of bedrooms'),
            bathrooms: z.number().optional().describe('Number of bathrooms'),
            squareFootage: z.number().optional().describe('Square footage'),
            lotSize: z.string().optional().describe('Lot size'),
            yearBuilt: z.number().optional().describe('Year built'),
            propertyType: z.string().optional().describe('Property type'),
            specialFeatures: z.array(z.string()).optional().describe('Special features'),
        }).optional().describe('Property features'),
    }).optional().describe('Property analysis details'),
    marketValuation: z.object({
        estimatedValue: z.number().describe('Estimated property value in USD'),
        valueRange: z.object({
            low: z.number().describe('Lower bound of value estimate'),
            high: z.number().describe('Upper bound of value estimate'),
        }).describe('Value range estimate'),
        confidenceLevel: z.enum(['high', 'medium', 'low']).describe('Confidence level of the valuation'),
        lastSaleInfo: z.object({
            date: z.string().optional().describe('Date of last sale'),
            price: z.number().optional().describe('Last sale price'),
        }).optional().describe('Last sale information'),
    }).describe('Market valuation details'),
    comparableProperties: z.array(z.object({
        address: z.string().describe('Address of comparable property'),
        price: z.number().describe('Sale price of comparable property'),
        sqft: z.number().optional().describe('Square footage'),
        beds: z.number().optional().describe('Number of bedrooms'),
        baths: z.number().optional().describe('Number of bathrooms'),
        saleDate: z.string().optional().describe('Date of sale'),
    })).describe('Comparable properties used in valuation'),
    keyFactors: z.array(z.string()).describe('Key factors influencing the valuation'),
    marketAnalysis: z.object({
        marketCondition: z.string().describe('Current market condition'),
        medianPrice: z.number().optional().describe('Median price in area'),
        averageDaysOnMarket: z.number().optional().describe('Average days on market'),
        marketTrends: z.array(z.string()).describe('Market trends'),
    }).describe('Market analysis and trends affecting the property'),
    recommendations: z.array(z.string()).describe('Recommendations for the property owner or buyer'),
    disclaimer: z.string().describe('Disclaimer about the AI valuation'),
});

export type PropertyValuationInput = z.infer<typeof PropertyValuationInputSchema>;
export type PropertyValuationOutput = z.infer<typeof PropertyValuationOutputSchema>;