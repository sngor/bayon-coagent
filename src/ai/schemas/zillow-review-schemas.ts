import { z } from 'zod';

/**
 * Schema for fetching Zillow reviews
 */
export const GetZillowReviewsInputSchema = z.object({
  agentEmail: z.string().email().describe('The agent email to fetch reviews for'),
});

export const GetZillowReviewsOutputSchema = z.object({
  reviews: z.array(z.object({
    author: z.string(),
    rating: z.number(),
    comment: z.string(),
    date: z.string(),
  })).describe('Array of Zillow reviews'),
  totalReviews: z.number().describe('Total number of reviews'),
  averageRating: z.number().describe('Average rating across all reviews'),
});

export type GetZillowReviewsInput = z.infer<typeof GetZillowReviewsInputSchema>;
export type GetZillowReviewsOutput = z.infer<typeof GetZillowReviewsOutputSchema>;
