import { z } from 'zod';

/**
 * Schema for generating social proof content from testimonials
 */
export const GenerateSocialProofInputSchema = z.object({
    testimonials: z.array(
        z.object({
            clientName: z.string().describe('Client\'s full name'),
            testimonialText: z.string().describe('The testimonial content'),
            dateReceived: z.string().describe('ISO 8601 timestamp when testimonial was received'),
            clientPhotoUrl: z.string().optional().describe('S3 URL for client photo if available'),
        })
    ).min(1).describe('Array of testimonials to generate social proof from'),
    format: z.enum(['instagram', 'facebook', 'linkedin']).describe('Social media platform format'),
    agentName: z.string().describe('Agent\'s name for attribution'),
});

export const GenerateSocialProofOutputSchema = z.object({
    content: z.string().describe('Formatted social media post text'),
    hashtags: z.array(z.string()).describe('Relevant hashtags for the post'),
    imageSuggestions: z.array(z.string()).describe('Image suggestions when client photos are present'),
});

export type GenerateSocialProofInput = z.infer<typeof GenerateSocialProofInputSchema>;
export type GenerateSocialProofOutput = z.infer<typeof GenerateSocialProofOutputSchema>;
