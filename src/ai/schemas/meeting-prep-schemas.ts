import { z } from 'zod';

/**
 * Schema for generating meeting preparation materials
 */
export const GenerateMeetingPrepInputSchema = z.object({
    clientName: z.string().describe('Client name'),
    clientEmail: z.string().email().describe('Client email address'),
    meetingPurpose: z.string().describe('Purpose of the meeting'),
    propertyInterests: z.array(z.string()).describe('Types of properties or locations the client is interested in'),
    budget: z.object({
        min: z.number().min(0).describe('Minimum budget'),
        max: z.number().min(0).describe('Maximum budget'),
    }).describe('Client budget range'),
    notes: z.string().optional().describe('Additional notes about the client or meeting'),
    userId: z.string().describe('User ID for personalization'),
});

export const PropertyRecommendationSchema = z.object({
    id: z.string().describe('Property ID'),
    address: z.string().describe('Property address'),
    price: z.number().describe('Property price'),
    size: z.number().describe('Property size in square feet'),
    beds: z.number().describe('Number of bedrooms'),
    baths: z.number().describe('Number of bathrooms'),
    features: z.array(z.string()).describe('Key property features'),
    photos: z.array(z.string()).describe('Property photo URLs'),
    matchReason: z.string().describe('Why this property matches the client needs'),
});

export const GenerateMeetingPrepOutputSchema = z.object({
    summary: z.string().describe('Meeting summary with client overview and objectives'),
    propertyRecommendations: z.array(PropertyRecommendationSchema).describe('Recommended properties based on client criteria'),
    marketInsights: z.string().describe('Relevant market insights and trends for the client area and budget'),
    discussionTopics: z.array(z.string()).describe('Key discussion topics for the meeting'),
    followUpActions: z.array(z.string()).describe('Suggested follow-up actions after the meeting'),
    preparationChecklist: z.array(z.string()).describe('Items to prepare before the meeting'),
});

export type GenerateMeetingPrepInput = z.infer<typeof GenerateMeetingPrepInputSchema>;
export type GenerateMeetingPrepOutput = z.infer<typeof GenerateMeetingPrepOutputSchema>;
export type PropertyRecommendation = z.infer<typeof PropertyRecommendationSchema>;