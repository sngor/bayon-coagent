import { z } from 'zod';

/**
 * Schema for generating personalized follow-up content for open house visitors
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

export const GenerateOpenHouseFollowUpInputSchema = z.object({
    visitor: z.object({
        visitorId: z.string().describe('Unique visitor identifier'),
        name: z.string().min(1).describe('Visitor full name'),
        email: z.string().email().describe('Visitor email address'),
        phone: z.string().describe('Visitor phone number'),
        interestLevel: z.enum(['low', 'medium', 'high']).describe('Visitor interest level in the property'),
        notes: z.string().optional().describe('Additional notes about the visitor from the agent'),
        checkInTime: z.string().describe('ISO 8601 timestamp when visitor checked in'),
    }).describe('Visitor information captured during check-in'),

    session: z.object({
        sessionId: z.string().describe('Open house session identifier'),
        propertyAddress: z.string().describe('Full property address'),
        scheduledDate: z.string().describe('ISO 8601 date of the open house'),
        actualStartTime: z.string().optional().describe('ISO 8601 timestamp when session started'),
        actualEndTime: z.string().optional().describe('ISO 8601 timestamp when session ended'),
        totalVisitors: z.number().describe('Total number of visitors who attended'),
        highInterestCount: z.number().describe('Number of high-interest visitors'),
    }).describe('Open house session details'),

    property: z.object({
        propertyId: z.string().optional().describe('Property identifier if available'),
        address: z.string().describe('Property address'),
        features: z.array(z.string()).optional().describe('Key property features'),
        price: z.string().optional().describe('Listing price'),
        bedrooms: z.number().optional().describe('Number of bedrooms'),
        bathrooms: z.number().optional().describe('Number of bathrooms'),
        squareFeet: z.number().optional().describe('Square footage'),
    }).describe('Property details for context'),

    agent: z.object({
        name: z.string().describe('Agent full name'),
        email: z.string().email().describe('Agent email address'),
        phone: z.string().describe('Agent phone number'),
        brokerage: z.string().optional().describe('Agent brokerage name'),
        licenseNumber: z.string().optional().describe('Agent license number'),
    }).describe('Agent contact information for personalization'),

    userId: z.string().describe('User ID for tracking and personalization'),
});

export const GenerateOpenHouseFollowUpOutputSchema = z.object({
    emailSubject: z.string()
        .min(10)
        .max(100)
        .describe('Compelling email subject line that references the open house visit'),

    emailBody: z.string()
        .min(200)
        .max(2000)
        .describe('Complete, professional email content thanking visitor and providing next steps'),

    smsMessage: z.string()
        .max(160)
        .optional()
        .describe('Brief SMS follow-up message (optional, for high/medium interest)'),

    nextSteps: z.array(z.string())
        .min(3)
        .max(5)
        .describe('Specific action items tailored to visitor interest level'),

    marketInsights: z.union([
        z.string(),
        z.object({
            currentConditions: z.string().optional(),
            averageDaysOnMarket: z.string().optional(),
            similarHomesSold: z.string().optional(),
        }).passthrough(), // Allow additional fields
    ])
        .optional()
        .describe('Relevant market insights or data points to share'),

    similarProperties: z.array(z.object({
        description: z.string().describe('Brief property description'),
        price: z.string().optional().describe('Price (e.g., "$500,000")'),
        priceRange: z.string().optional().describe('Price range (e.g., "$500K-$550K")'),
        area: z.string().optional().describe('General location area'),
        location: z.string().optional().describe('General location area (alternative field)'),
        keyFeatures: z.array(z.string()).optional().describe('2-3 key features'),
    }).passthrough()) // Allow additional fields
        .max(3)
        .optional()
        .describe('Similar properties that might interest the visitor'),

    urgencyLevel: z.enum(['low', 'medium', 'high'])
        .describe('Recommended follow-up urgency based on interest level'),

    followUpTiming: z.string()
        .optional()
        .describe('Recommended timing for sending this follow-up (e.g., "within 2 hours", "next day")'),

    personalizedTouchPoints: z.array(z.string())
        .min(2)
        .max(4)
        .describe('Conversation starters based on visitor notes and context'),

    callToAction: z.union([
        z.string(),
        z.object({
            primary: z.string().describe('Primary action to take'),
            method: z.string().optional().describe('How to take the action'),
            urgency: z.string().optional().describe('Urgency timeframe'),
            secondary: z.string().optional().describe('Secondary action option'),
            options: z.array(z.string()).optional().describe('Multiple action options'),
        }),
    ]).describe('Clear, specific call-to-action appropriate for interest level'),

    schedulingMessage: z.string()
        .optional()
        .describe('Specific message for scheduling the next interaction (legacy field, may be included in callToAction)'),
});

export type GenerateOpenHouseFollowUpInput = z.infer<typeof GenerateOpenHouseFollowUpInputSchema>;
export type GenerateOpenHouseFollowUpOutput = z.infer<typeof GenerateOpenHouseFollowUpOutputSchema>;
