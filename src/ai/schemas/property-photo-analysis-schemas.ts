/**
 * Zod schemas for Mobile Property Photo Analysis
 * 
 * This schema is optimized for quick property detail extraction from photos
 * captured on mobile devices during property showings and open houses.
 * 
 * Features:
 * - Fast property type identification
 * - Key feature extraction
 * - Condition assessment
 * - Marketing highlights generation
 * - Suggested improvements
 */

import { z } from 'zod';

/**
 * Property type categories
 */
export const PropertyTypeSchema = z.enum([
    'single-family',
    'condo',
    'townhouse',
    'multi-family',
    'commercial',
    'land',
    'other'
]);

export type PropertyType = z.infer<typeof PropertyTypeSchema>;

/**
 * Property condition assessment
 */
export const PropertyConditionSchema = z.enum([
    'excellent',
    'good',
    'fair',
    'needs-work'
]);

export type PropertyCondition = z.infer<typeof PropertyConditionSchema>;

/**
 * Room type identification
 */
export const RoomTypeSchema = z.enum([
    'kitchen',
    'living-room',
    'bedroom',
    'bathroom',
    'dining-room',
    'office',
    'exterior',
    'garage',
    'basement',
    'other'
]);

export type RoomType = z.infer<typeof RoomTypeSchema>;

/**
 * Input schema for property photo analysis
 */
export const PropertyPhotoAnalysisInputSchema = z.object({
    /** Base64 encoded image data */
    imageData: z.string().describe('Base64 encoded image data'),

    /** Image format */
    imageFormat: z.enum(['jpeg', 'png', 'webp', 'gif']).describe('Format of the image'),

    /** Optional location context */
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
    }).optional().describe('Location context if available'),

    /** Optional property context from user */
    propertyContext: z.string().optional().describe('Additional context provided by the agent'),
});

export type PropertyPhotoAnalysisInput = z.infer<typeof PropertyPhotoAnalysisInputSchema>;

/**
 * Output schema for property photo analysis
 */
export const PropertyPhotoAnalysisOutputSchema = z.object({
    /** Identified property type */
    propertyType: PropertyTypeSchema.describe('Type of property identified'),

    /** Room type if applicable */
    roomType: RoomTypeSchema.optional().describe('Type of room if interior photo'),

    /** Key features identified */
    features: z.array(z.string()).min(1).describe('Key features identified in the photo (e.g., hardwood floors, granite countertops, vaulted ceilings)'),

    /** Overall condition assessment */
    condition: PropertyConditionSchema.describe('Overall condition of the property or space'),

    /** Marketing highlights for content generation */
    marketingHighlights: z.array(z.string()).min(1).max(5).describe('Marketing highlights that would appeal to buyers (2-5 items)'),

    /** Suggested improvements */
    improvements: z.array(z.string()).max(3).describe('Suggested improvements or staging recommendations (up to 3)'),

    /** Estimated price range indicator (optional) */
    priceIndicator: z.enum(['budget', 'mid-range', 'premium', 'luxury']).optional().describe('Price range indicator based on visible features'),

    /** Brief description suitable for listing */
    briefDescription: z.string().describe('Brief 1-2 sentence description suitable for listing content'),
});

export type PropertyPhotoAnalysisOutput = z.infer<typeof PropertyPhotoAnalysisOutputSchema>;
