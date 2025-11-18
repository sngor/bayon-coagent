import { z } from 'zod';

/**
 * Schema for listing description generator
 */
export const generateListingDescriptionSchema = z.object({
  property_details: z.string().min(1, 'Property details are required'),
});

export type GenerateListingDescriptionInput = z.infer<typeof generateListingDescriptionSchema>;
