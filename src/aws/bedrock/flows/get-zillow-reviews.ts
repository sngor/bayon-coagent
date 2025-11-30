'use server';

/**
 * @fileOverview Flow to fetch Zillow reviews using the Bridge API.
 * 
 * Note: This flow doesn't use AI - it's a direct API integration.
 */

import { defineFlow } from '../flow-base';
import {
  GetZillowReviewsInputSchema,
  GetZillowReviewsOutputSchema,
  type GetZillowReviewsInput,
  type GetZillowReviewsOutput,
} from '@/ai/schemas/zillow-review-schemas';



const getZillowReviewsFlow = defineFlow(
  {
    name: 'getZillowReviewsFlow',
    inputSchema: GetZillowReviewsInputSchema,
    outputSchema: GetZillowReviewsOutputSchema,
  },
  async ({ agentEmail }) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    if (!apiKey) {
      throw new Error('Bridge API key is not configured.');
    }

    const baseUrl = 'https://api.bridgedataoutput.com/api/v2/OData/reviews';
    const headers = { 'Authorization': `Bearer ${apiKey}` };

    try {
      // Use the $expand parameter to get reviews in a single call
      const revieweeUrl = `${baseUrl}/Reviewees?$filter=RevieweeEmail eq '${agentEmail}'&$expand=Reviews`;

      const revieweeResponse = await fetch(revieweeUrl, {
        method: 'GET',
        headers: headers,
      });

      if (!revieweeResponse.ok) {
        const errorText = await revieweeResponse.text();
        throw new Error(`Failed to fetch Zillow data for ${agentEmail}. Status: ${revieweeResponse.status}. Response: ${errorText}`);
      }

      const revieweeData = await revieweeResponse.json();

      if (!revieweeData.value || revieweeData.value.length === 0) {
        // It's not an error if no profile is found, just return empty.
        return { reviews: [] };
      }

      const agentProfile = revieweeData.value[0];
      const reviews = agentProfile.Reviews || [];

      const formattedReviews = reviews.map((review: any) => ({
        authorName: review.ReviewerFullName || 'Anonymous',
        rating: review.Rating,
        comment: review.Description,
        date: new Date(review.ReviewDate).toISOString(),
      }));

      return { reviews: formattedReviews };

    } catch (error: any) {
      console.error("Error fetching Zillow reviews:", error);
      throw new Error(error.message || 'An unknown error occurred while fetching from the Bridge API.');
    }
  }
);

export async function getZillowReviews(
  input: GetZillowReviewsInput
): Promise<GetZillowReviewsOutput> {
  return getZillowReviewsFlow.execute(input);
}
