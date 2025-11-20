import { z } from 'zod';

/**
 * Schema for listing description generator (legacy)
 */
export const generateListingDescriptionSchema = z.object({
  property_details: z.string().min(1, 'Property details are required'),
});

export type GenerateListingDescriptionInput = z.infer<typeof generateListingDescriptionSchema>;

/**
 * Schema for photo data with base64 encoding
 */
export const PhotoDataSchema = z.object({
  url: z.string(),
  data: z.string(), // Base64 encoded image data
  format: z.enum(['jpeg', 'png', 'webp']),
  caption: z.string().optional(),
  order: z.number(),
});

export type PhotoData = z.infer<typeof PhotoDataSchema>;

/**
 * Schema for generating description from photos
 */
export const GenerateFromPhotosInputSchema = z.object({
  photos: z.array(PhotoDataSchema).min(1, 'At least one photo is required'),
  listingData: z.object({
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
    }).optional(),
    price: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    squareFeet: z.number().optional(),
    propertyType: z.string().optional(),
    features: z.array(z.string()).optional(),
  }),
});

export type GenerateFromPhotosInput = z.infer<typeof GenerateFromPhotosInputSchema>;

/**
 * Schema for generating description from data only
 */
export const GenerateFromDataInputSchema = z.object({
  mlsNumber: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
  }),
  price: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFeet: z.number(),
  propertyType: z.string(),
  features: z.array(z.string()),
  description: z.string().optional(),
});

export type GenerateFromDataInput = z.infer<typeof GenerateFromDataInputSchema>;

/**
 * Schema for description output
 */
export const ListingDescriptionOutputSchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'),
  wordCount: z.number(),
});

export type ListingDescriptionOutput = z.infer<typeof ListingDescriptionOutputSchema>;
