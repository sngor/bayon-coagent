import { z } from 'zod';

/**
 * Schema for generating personalized follow-up content for open house visitors
 */
export const GenerateFollowUpContentInputSchema = z.object({
    visitor: z.object({
        name: z.string().describe('Visitor name'),
        email: z.string().email().describe('Visitor email address'),
        phone: z.string().optional().describe('Visitor phone number'),
        interestLevel: z.enum(['low', 'medium', 'high']).describe('Visitor interest level'),
        notes: z.string().optional().describe('Additional notes about the visitor'),
        timestamp: z.number().describe('Check-in timestamp'),
    }).describe('Visitor information'),
    property: z.object({
        id: z.string().describe('Property ID'),
        address: z.string().optional().describe('Property address'),
    }).describe('Property information'),
    openHouseDetails: z.object({
        sessionId: z.string().describe('Open house session ID'),
        startTime: z.number().describe('Open house start time'),
        endTime: z.number().describe('Open house end time'),
        totalVisitors: z.number().describe('Total number of visitors'),
        highInterestCount: z.number().describe('Number of high interest visitors'),
    }).describe('Open house session details'),
    agentInfo: z.object({
        name: z.string().optional().describe('Agent name'),
        email: z.string().optional().describe('Agent email'),
        phone: z.string().optional().describe('Agent phone'),
        brokerage: z.string().optional().describe('Agent brokerage'),
    }).describe('Agent information for personalization'),
    userId: z.string().describe('User ID for personalization'),
});

export const GenerateFollowUpContentOutputSchema = z.object({
    emailSubject: z.string().describe('Personalized email subject line'),
    emailContent: z.string().describe('Complete email content with personalized messaging'),
    textMessage: z.string().optional().describe('Optional SMS follow-up message'),
    nextSteps: z.array(z.string()).describe('Suggested next steps based on interest level'),
    schedulingMessage: z.string().describe('Message for scheduling follow-up meeting or showing'),
    marketInsights: z.string().optional().describe('Relevant market insights to share'),
    similarProperties: z.array(z.object({
        description: z.string().describe('Property description'),
        priceRange: z.string().describe('Price range'),
        location: z.string().describe('Location area'),
        keyFeatures: z.array(z.string()).describe('Key features'),
    })).optional().describe('Similar properties to mention'),
    urgencyLevel: z.enum(['low', 'medium', 'high']).describe('Recommended follow-up urgency'),
    followUpTiming: z.string().describe('Recommended timing for follow-up'),
    personalizedTouchPoints: z.array(z.string()).describe('Personalized conversation starters based on visitor notes'),
});

export type GenerateFollowUpContentInput = z.infer<typeof GenerateFollowUpContentInputSchema>;
export type GenerateFollowUpContentOutput = z.infer<typeof GenerateFollowUpContentOutputSchema>;