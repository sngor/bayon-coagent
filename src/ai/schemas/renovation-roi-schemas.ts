import { z } from 'zod';

/**
 * Schema for AI renovation ROI analysis
 */
export const RenovationROIInputSchema = z.object({
    currentValue: z.number().describe('Current property value in USD'),
    renovationCost: z.number().describe('Projected renovation cost in USD'),
    renovationType: z.string().describe('Type of renovation (e.g., kitchen remodel, bathroom renovation)'),
    location: z.string().optional().describe('Property location (city, state)'),
    propertyType: z.string().describe('Type of property (single-family, townhouse, condo, etc.)'),
    marketCondition: z.string().describe('Current market condition (hot, balanced, cool)'),
    additionalDetails: z.string().optional().describe('Additional details about the renovation or property'),
});

export const RenovationROIOutputSchema = z.object({
    estimatedNewValue: z.number().describe('Estimated property value after renovation in USD'),
    valueIncrease: z.number().describe('Expected increase in property value in USD'),
    roi: z.number().describe('Return on investment as a percentage'),
    roiCategory: z.enum(['excellent', 'good', 'fair', 'poor']).describe('ROI category assessment'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the ROI estimate'),
    keyFactors: z.array(z.string()).describe('Key factors influencing the ROI'),
    marketFactors: z.object({
        locationImpact: z.string().describe('How location affects ROI'),
        marketConditionImpact: z.string().describe('How current market conditions affect ROI'),
        demandLevel: z.string().describe('Demand level for this type of renovation'),
    }).describe('Market factors affecting ROI'),
    comparableRenovations: z.array(z.object({
        renovationType: z.string().describe('Type of renovation'),
        cost: z.number().describe('Renovation cost'),
        valueAdded: z.number().describe('Value added by renovation'),
        roi: z.number().describe('ROI percentage'),
        location: z.string().optional().describe('Location of comparable renovation'),
    })).describe('Comparable renovations and their ROI'),
    analysis: z.string().describe('Detailed AI analysis of the renovation ROI'),
    recommendations: z.array(z.string()).describe('Specific recommendations for maximizing ROI'),
    riskFactors: z.array(z.string()).describe('Potential risks or factors that could affect ROI'),
    timeline: z.object({
        estimatedDuration: z.string().describe('Estimated renovation duration'),
        bestTiming: z.string().describe('Best timing for the renovation'),
    }).describe('Timeline considerations'),
    disclaimer: z.string().describe('Disclaimer about the AI ROI analysis'),
});

export type RenovationROIInput = z.infer<typeof RenovationROIInputSchema>;
export type RenovationROIOutput = z.infer<typeof RenovationROIOutputSchema>;