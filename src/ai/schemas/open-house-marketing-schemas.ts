import { z } from 'zod';

/**
 * Schema for generating open house marketing materials
 * Validates Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

// ============================================================================
// FLYER GENERATION SCHEMAS
// ============================================================================

export const GenerateOpenHouseFlyerInputSchema = z.object({
    session: z.object({
        sessionId: z.string().describe('Open house session identifier'),
        propertyAddress: z.string().describe('Full property address'),
        scheduledDate: z.string().describe('ISO 8601 date of the open house'),
        scheduledStartTime: z.string().describe('ISO 8601 timestamp when session starts'),
        scheduledEndTime: z.string().optional().describe('ISO 8601 timestamp when session ends'),
    }).describe('Open house session details'),

    property: z.object({
        propertyId: z.string().optional().describe('Property identifier if available'),
        address: z.string().describe('Property address'),
        price: z.string().optional().describe('Listing price'),
        bedrooms: z.number().optional().describe('Number of bedrooms'),
        bathrooms: z.number().optional().describe('Number of bathrooms'),
        squareFeet: z.number().optional().describe('Square footage'),
        features: z.array(z.string()).optional().describe('Key property features'),
        description: z.string().optional().describe('Property description'),
        images: z.array(z.object({
            url: z.string().describe('Image URL'),
            description: z.string().optional().describe('Image description'),
        })).optional().describe('Property images'),
    }).describe('Property details for the flyer'),

    agent: z.object({
        name: z.string().describe('Agent full name'),
        email: z.string().email().describe('Agent email address'),
        phone: z.string().describe('Agent phone number'),
        brokerage: z.string().optional().describe('Agent brokerage name'),
        licenseNumber: z.string().optional().describe('Agent license number'),
        photo: z.string().optional().describe('Agent photo URL'),
        logo: z.string().optional().describe('Agent/brokerage logo URL'),
    }).describe('Agent contact information'),

    branding: z.object({
        primaryColor: z.string().optional().describe('Primary brand color (hex code)'),
        secondaryColor: z.string().optional().describe('Secondary brand color (hex code)'),
        logoUrl: z.string().optional().describe('Brand logo URL'),
        tagline: z.string().optional().describe('Agent tagline or slogan'),
    }).optional().describe('Agent branding preferences'),

    options: z.object({
        includeQRCode: z.boolean().default(true).describe('Include QR code for easy check-in'),
        includePropertyImages: z.boolean().default(true).describe('Include property images'),
        template: z.enum(['modern', 'classic', 'luxury']).default('modern').describe('Flyer design template'),
    }).optional().describe('Flyer generation options'),

    userId: z.string().describe('User ID for tracking'),
});

export const GenerateOpenHouseFlyerOutputSchema = z.object({
    headline: z.string()
        .min(10)
        .max(100)
        .describe('Compelling headline for the flyer'),

    subheadline: z.string()
        .optional()
        .describe('Supporting subheadline with date/time details'),

    propertyHighlights: z.array(z.string())
        .min(3)
        .max(8)
        .describe('Key property features to highlight on flyer'),

    openHouseDetails: z.object({
        date: z.string().describe('Formatted date (e.g., "Saturday, December 15th")'),
        time: z.string().describe('Formatted time range (e.g., "2:00 PM - 4:00 PM")'),
        address: z.string().describe('Full property address'),
    }).describe('Open house event details'),

    callToAction: z.string()
        .min(10)
        .max(100)
        .describe('Clear call-to-action for attendees'),

    agentInfo: z.object({
        name: z.string().describe('Agent name'),
        phone: z.string().describe('Agent phone'),
        email: z.string().describe('Agent email'),
        brokerage: z.string().optional().describe('Brokerage name'),
    }).describe('Agent contact information for flyer'),

    marketingCopy: z.string()
        .min(100)
        .max(500)
        .describe('Compelling marketing copy describing the property and open house'),

    designNotes: z.string()
        .optional()
        .describe('Design suggestions for layout and visual hierarchy'),

    qrCodeMessage: z.string()
        .optional()
        .describe('Message to display near QR code (e.g., "Scan to check in")'),
});

export type GenerateOpenHouseFlyerInput = z.infer<typeof GenerateOpenHouseFlyerInputSchema>;
export type GenerateOpenHouseFlyerOutput = z.infer<typeof GenerateOpenHouseFlyerOutputSchema>;

// ============================================================================
// SOCIAL POST GENERATION SCHEMAS
// ============================================================================

export const GenerateOpenHouseSocialPostsInputSchema = z.object({
    session: z.object({
        sessionId: z.string().describe('Open house session identifier'),
        propertyAddress: z.string().describe('Full property address'),
        scheduledDate: z.string().describe('ISO 8601 date of the open house'),
        scheduledStartTime: z.string().describe('ISO 8601 timestamp when session starts'),
        scheduledEndTime: z.string().optional().describe('ISO 8601 timestamp when session ends'),
    }).describe('Open house session details'),

    property: z.object({
        propertyId: z.string().optional().describe('Property identifier if available'),
        address: z.string().describe('Property address'),
        price: z.string().optional().describe('Listing price'),
        bedrooms: z.number().optional().describe('Number of bedrooms'),
        bathrooms: z.number().optional().describe('Number of bathrooms'),
        squareFeet: z.number().optional().describe('Square footage'),
        features: z.array(z.string()).optional().describe('Key property features'),
        description: z.string().optional().describe('Property description'),
        neighborhood: z.string().optional().describe('Neighborhood name'),
    }).describe('Property details'),

    agent: z.object({
        name: z.string().describe('Agent full name'),
        email: z.string().email().describe('Agent email address'),
        phone: z.string().describe('Agent phone number'),
        brokerage: z.string().optional().describe('Agent brokerage name'),
    }).describe('Agent contact information'),

    platforms: z.array(z.enum(['facebook', 'instagram', 'linkedin', 'twitter']))
        .min(1)
        .describe('Social media platforms to generate posts for'),

    userId: z.string().describe('User ID for tracking'),
});

export const GenerateOpenHouseSocialPostsOutputSchema = z.object({
    facebook: z.object({
        post: z.string()
            .min(50)
            .max(2000)
            .describe('Facebook post content'),
        hashtags: z.array(z.string())
            .max(10)
            .describe('Relevant hashtags for Facebook'),
        callToAction: z.string()
            .describe('Clear call-to-action'),
    }).optional().describe('Facebook-optimized post'),

    instagram: z.object({
        caption: z.string()
            .min(50)
            .max(2200)
            .describe('Instagram caption'),
        hashtags: z.array(z.string())
            .min(5)
            .max(30)
            .describe('Relevant hashtags for Instagram'),
        callToAction: z.string()
            .describe('Clear call-to-action'),
        storyText: z.string()
            .optional()
            .describe('Text overlay for Instagram story'),
    }).optional().describe('Instagram-optimized post'),

    linkedin: z.object({
        post: z.string()
            .min(100)
            .max(3000)
            .describe('LinkedIn post content (more professional tone)'),
        hashtags: z.array(z.string())
            .max(5)
            .describe('Professional hashtags for LinkedIn'),
        callToAction: z.string()
            .describe('Professional call-to-action'),
    }).optional().describe('LinkedIn-optimized post'),

    twitter: z.object({
        tweet: z.string()
            .min(50)
            .max(280)
            .describe('Twitter/X post content'),
        hashtags: z.array(z.string())
            .max(5)
            .describe('Relevant hashtags for Twitter'),
        callToAction: z.string()
            .optional()
            .describe('Call-to-action (if space allows)'),
    }).optional().describe('Twitter-optimized post'),

    generalHashtags: z.array(z.string())
        .min(5)
        .max(15)
        .describe('General hashtags applicable across platforms'),

    imageRecommendations: z.array(z.string())
        .min(2)
        .max(5)
        .describe('Recommendations for which property images to use'),
});

export type GenerateOpenHouseSocialPostsInput = z.infer<typeof GenerateOpenHouseSocialPostsInputSchema>;
export type GenerateOpenHouseSocialPostsOutput = z.infer<typeof GenerateOpenHouseSocialPostsOutputSchema>;

// ============================================================================
// EMAIL INVITATION GENERATION SCHEMAS
// ============================================================================

export const GenerateOpenHouseEmailInviteInputSchema = z.object({
    session: z.object({
        sessionId: z.string().describe('Open house session identifier'),
        propertyAddress: z.string().describe('Full property address'),
        scheduledDate: z.string().describe('ISO 8601 date of the open house'),
        scheduledStartTime: z.string().describe('ISO 8601 timestamp when session starts'),
        scheduledEndTime: z.string().optional().describe('ISO 8601 timestamp when session ends'),
    }).describe('Open house session details'),

    property: z.object({
        propertyId: z.string().optional().describe('Property identifier if available'),
        address: z.string().describe('Property address'),
        price: z.string().optional().describe('Listing price'),
        bedrooms: z.number().optional().describe('Number of bedrooms'),
        bathrooms: z.number().optional().describe('Number of bathrooms'),
        squareFeet: z.number().optional().describe('Square footage'),
        features: z.array(z.string()).optional().describe('Key property features'),
        description: z.string().optional().describe('Property description'),
        images: z.array(z.object({
            url: z.string().describe('Image URL'),
            description: z.string().optional().describe('Image description'),
        })).optional().describe('Property images'),
    }).describe('Property details'),

    agent: z.object({
        name: z.string().describe('Agent full name'),
        email: z.string().email().describe('Agent email address'),
        phone: z.string().describe('Agent phone number'),
        brokerage: z.string().optional().describe('Agent brokerage name'),
    }).describe('Agent contact information'),

    options: z.object({
        includeCalendarAttachment: z.boolean().default(true).describe('Include calendar attachment'),
        includeRSVPLink: z.boolean().default(true).describe('Include RSVP tracking link'),
        personalMessage: z.string().optional().describe('Personal message from agent'),
        recipientType: z.enum(['general', 'past_client', 'sphere_of_influence']).default('general')
            .describe('Type of recipient for tone adjustment'),
    }).optional().describe('Email invitation options'),

    userId: z.string().describe('User ID for tracking'),
});

export const GenerateOpenHouseEmailInviteOutputSchema = z.object({
    subject: z.string()
        .min(20)
        .max(100)
        .describe('Compelling email subject line'),

    preheader: z.string()
        .min(20)
        .max(150)
        .describe('Email preheader text (preview text)'),

    greeting: z.string()
        .min(10)
        .max(100)
        .describe('Personalized greeting'),

    introduction: z.string()
        .min(100)
        .max(500)
        .describe('Introduction paragraph explaining the open house'),

    propertyHighlights: z.array(z.string())
        .min(3)
        .max(8)
        .describe('Key property features to highlight'),

    eventDetails: z.object({
        date: z.string().describe('Formatted date'),
        time: z.string().describe('Formatted time range'),
        address: z.string().describe('Full property address'),
        parkingInfo: z.string().optional().describe('Parking instructions'),
    }).describe('Open house event details'),

    bodyContent: z.string()
        .min(200)
        .max(1000)
        .describe('Main email body content with property details and invitation'),

    callToAction: z.string()
        .min(10)
        .max(100)
        .describe('Clear call-to-action for RSVP or attendance'),

    closingMessage: z.string()
        .min(50)
        .max(200)
        .describe('Closing message from agent'),

    signature: z.object({
        name: z.string().describe('Agent name'),
        title: z.string().optional().describe('Agent title'),
        phone: z.string().describe('Agent phone'),
        email: z.string().describe('Agent email'),
        brokerage: z.string().optional().describe('Brokerage name'),
    }).describe('Email signature details'),

    calendarEvent: z.object({
        title: z.string().describe('Calendar event title'),
        description: z.string().describe('Calendar event description'),
        location: z.string().describe('Event location (property address)'),
        startTime: z.string().describe('ISO 8601 start time'),
        endTime: z.string().describe('ISO 8601 end time'),
    }).describe('Calendar attachment details'),

    rsvpMessage: z.string()
        .optional()
        .describe('Message encouraging RSVP'),

    additionalNotes: z.array(z.string())
        .optional()
        .describe('Additional notes or instructions for attendees'),
});

export type GenerateOpenHouseEmailInviteInput = z.infer<typeof GenerateOpenHouseEmailInviteInputSchema>;
export type GenerateOpenHouseEmailInviteOutput = z.infer<typeof GenerateOpenHouseEmailInviteOutputSchema>;
