/**
 * Neighborhood Guide Schemas
 * Zod schemas for neighborhood guide generation
 */

import { z } from 'zod';

export const NeighborhoodGuideInputSchema = z.object({
    neighborhood: z.string().min(1, 'Neighborhood name is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required'),
    includeSchools: z.boolean().default(true),
    includeAmenities: z.boolean().default(true),
    includeTransportation: z.boolean().default(true),
    includeMarketData: z.boolean().default(true),
    targetAudience: z.enum(['buyers', 'sellers', 'renters', 'investors']).default('buyers'),
    tone: z.enum(['professional', 'friendly', 'informative', 'promotional']).default('informative'),
});

export const NeighborhoodGuideOutputSchema = z.object({
    title: z.string(),
    introduction: z.string(),
    overview: z.string(),
    schools: z.array(z.object({
        name: z.string(),
        type: z.string(),
        rating: z.number().optional(),
        description: z.string(),
    })).optional(),
    amenities: z.array(z.object({
        category: z.string(),
        name: z.string(),
        description: z.string(),
        distance: z.string().optional(),
    })).optional(),
    transportation: z.object({
        publicTransit: z.array(z.string()).optional(),
        highways: z.array(z.string()).optional(),
        airports: z.array(z.string()).optional(),
        walkability: z.string().optional(),
    }).optional(),
    marketData: z.object({
        medianHomePrice: z.string().optional(),
        priceRange: z.string().optional(),
        marketTrend: z.string().optional(),
        daysOnMarket: z.string().optional(),
    }).optional(),
    conclusion: z.string(),
    callToAction: z.string(),
});

export type NeighborhoodGuideInput = z.infer<typeof NeighborhoodGuideInputSchema>;
export type NeighborhoodGuideOutput = z.infer<typeof NeighborhoodGuideOutputSchema>;

// Legacy export names for compatibility
export const GenerateNeighborhoodGuideInputSchema = NeighborhoodGuideInputSchema;
export const GenerateNeighborhoodGuideOutputSchema = NeighborhoodGuideOutputSchema;