import { z } from 'zod';

/**
 * Schema for fetching real estate news
 */
export const GetRealEstateNewsInputSchema = z.object({
  location: z.string().optional().describe('Location or search query to filter news (can include market categories)'),
});

export const GetRealEstateNewsOutputSchema = z.object({
  articles: z.array(z.object({
    title: z.string().describe('Article title'),
    description: z.string().describe('Article description'),
    url: z.string().describe('Article URL'),
    source: z.string().describe('News source'),
    publishedAt: z.string().describe('Publication date'),
    imageUrl: z.string().optional().describe('Article image URL'),
  })).describe('Array of news articles'),
  totalResults: z.number().describe('Total number of results'),
});

export type GetRealEstateNewsInput = z.infer<typeof GetRealEstateNewsInputSchema>;
export type GetRealEstateNewsOutput = z.infer<typeof GetRealEstateNewsOutputSchema>;
