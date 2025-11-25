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
    roiAnalysis: z.object({
        currentValue: z.number().describe('Current property value in USD'),
        renovationCost: z.number().describe('Renovation cost in USD'),
        estimatedValueIncrease: z.number().describe('Expected increase in property value in USD'),
        newPropertyValue: z.number().describe('Estimated property value after renovation in USD'),
        roiPercentage: z.number().describe('Return on investment as a percentage'),
        roiCategory: z.enum(['excellent', 'good', 'fair', 'poor']).describe('ROI category assessment'),
        confidenceLevel: z.enum(['high', 'medium', 'low']).describe('Confidence level of the ROI estimate'),
    }).describe('ROI analysis details'),
    marketAnalysis: z.object({
        locationImpact: z.string().describe('How location affects ROI'),
        marketCondition: z.string().describe('Current market condition'),
        demandLevel: z.string().describe('Demand level for this type of renovation'),
        regionalFactors: z.record(z.any()).optional().describe('Regional market factors'),
    }).describe('Market factors affecting ROI'),
    comparableRenovations: z.array(z.object({
        type: z.string().describe('Type of renovation'),
        cost: z.number().describe('Renovation cost'),
        roi: z.number().describe('ROI percentage'),
        location: z.string().optional().describe('Location of comparable renovation'),
    })).describe('Comparable renovations and their ROI'),
    keySuccessFactors: z.array(z.string()).describe('Key factors influencing the ROI success'),
    recommendations: z.union([
        z.array(z.string()),
        z.object({
            timing: z.string().optional(),
            scopeGuidance: z.string().optional(),
            materialSelections: z.string().optional(),
            budgetAllocation: z.record(z.any()).optional(),
        })
    ]).describe('Specific recommendations for maximizing ROI'),
    riskFactors: z.array(z.string()).describe('Potential risks or factors that could affect ROI'),
    timeline: z.object({
        estimatedDuration: z.string().describe('Estimated renovation duration'),
        optimalStartSeason: z.string().optional().describe('Best timing for the renovation'),
        keyTimelineFactors: z.array(z.string()).optional().describe('Key timeline considerations'),
    }).describe('Timeline considerations'),
});

export type RenovationROIInput = z.infer<typeof RenovationROIInputSchema>;
export type RenovationROIOutput = z.infer<typeof RenovationROIOutputSchema>;