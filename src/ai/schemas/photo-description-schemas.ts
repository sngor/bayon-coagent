/**
 * Zod schemas for Photo Description Generation
 * 
 * This schema handles quick photo capture description generation for mobile devices.
 * Generates concise, professional descriptions for property photos captured on mobile.
 */

import { z } from 'zod';

/**
 * Image format types supported
 */
export const PhotoFormatSchema = z.enum(['jpeg', 'png', 'webp']);

export type PhotoFormat = z.infer<typeof PhotoFormatSchema>;

/**
 * Photo metadata from mobile capture
 */
export const PhotoMetadataSchema = z.object({
    width: z.number().describe('Image width in pixels'),
    height: z.number().describe('Image height in pixels'),
    size: z.number().describe('File size in bytes'),
    timestamp: z.number().describe('Capture timestamp'),
});

export type PhotoMetadata = z.infer<typeof PhotoMetadataSchema>;

/**
 * Input schema for Photo Description Generation
 */
export const GeneratePhotoDescriptionInputSchema = z.object({
    /** Base64 encoded image data */
    imageData: z.string().describe('Base64 encoded image data from mobile capture'),

    /** Image format */
    imageFormat: PhotoFormatSchema.describe('Format of the captured image'),

    /** Photo metadata */
    metadata: PhotoMetadataSchema.describe('Metadata from the photo capture'),

    /** User ID for personalization */
    userId: z.string().describe('User ID for personalization'),

    /** Optional context about the photo */
    context: z.string().optional().describe('Optional context about what the photo shows'),
});

export type GeneratePhotoDescriptionInput = z.infer<typeof GeneratePhotoDescriptionInputSchema>;

/**
 * Output schema for Photo Description Generation
 */
export const GeneratePhotoDescriptionOutputSchema = z.object({
    /** Generated description */
    description: z.string().describe('Professional description of the photo suitable for real estate marketing'),

    /** Key features identified */
    keyFeatures: z.array(z.string()).describe('Key features identified in the photo'),

    /** Suggested tags */
    tags: z.array(z.string()).describe('Suggested tags for categorization'),

    /** Room or area type if identifiable */
    roomType: z.string().optional().describe('Type of room or area if identifiable (e.g., kitchen, living room, exterior)'),

    /** Marketing appeal score */
    marketingAppeal: z.enum(['high', 'medium', 'low']).describe('Assessment of the photo\'s marketing appeal'),

    /** Suggestions for improvement */
    improvementSuggestions: z.array(z.string()).optional().describe('Optional suggestions for improving the photo or space'),
});

export type GeneratePhotoDescriptionOutput = z.infer<typeof GeneratePhotoDescriptionOutputSchema>;