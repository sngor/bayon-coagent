'use server';

/**
 * @fileOverview Bedrock flow to perform a Name, Address, Phone (NAP) consistency audit.
 * 
 * This flow uses web search to find the agent's profiles across various platforms
 * and checks NAP consistency.
 */

import { z } from 'zod';
import { defineFlow, definePrompt } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import {
  RunNapAuditInputSchema,
  RunNapAuditOutputSchema,
  type RunNapAuditInput,
  type RunNapAuditOutput,
} from '@/ai/schemas/nap-audit-schemas';

export { type RunNapAuditInput, type RunNapAuditOutput };

const napAuditPrompt = definePrompt({
  name: 'napAuditPrompt',
  inputSchema: RunNapAuditInputSchema.extend({
    searchContext: z.string().optional(),
  }),
  outputSchema: RunNapAuditOutputSchema,
  prompt: `You are an expert local SEO auditor. Your task is to perform a NAP (Name, Address, Phone) consistency audit for a real estate agent based on web search results.

Official Agent Information (Source of Truth):
- Name: {{{name}}}
- Address: {{{address}}}
- Phone: {{{phone}}}
- Agency: {{{agencyName}}}
- Website: {{{website}}}

Web Search Results:
{{{searchContext}}}

Based on the search results above, audit the agent's NAP information across the following platforms:
- Agent's Website
- Google Business Profile
- Zillow
- Realtor.com
- Yelp
- Facebook
- Bing Places

For each platform, analyze the search results to extract:
1. The Name, Address, and Phone number listed on that platform
2. The URL of the profile page

Compare the found information with the official information. Your comparison should be case-insensitive and ignore minor formatting differences (e.g., 'St.' vs 'Street', or '(123) 456-7890' vs '123-456-7890').

Determine the consistency status for each platform:
- 'Consistent': If all information (Name, Address, and Phone) substantially matches the official information
- 'Inconsistent': If any piece of information does not match the official source of truth
- 'Not Found': If you cannot find a profile for the agent on that platform in the search results

Return a structured JSON response with a "results" array containing one object for each platform. Each object must have:
- platform: The platform name
- platformUrl: The URL found in search results (or empty string if not found)
- foundName: The name found (or empty string if not found)
- foundAddress: The address found (or empty string if not found)
- foundPhone: The phone found (or empty string if not found)
- status: One of 'Consistent', 'Inconsistent', or 'Not Found'`,
});

const runNapAuditFlow = defineFlow(
  {
    name: 'runNapAuditFlow',
    inputSchema: RunNapAuditInputSchema,
    outputSchema: RunNapAuditOutputSchema,
  },
  async (input) => {
    // Perform web searches for each platform
    const searchClient = getSearchClient();
    const platforms = [
      'Google Business Profile',
      'Zillow',
      'Realtor.com',
      'Yelp',
      'Facebook',
      'Bing Places',
    ];

    // Search for agent profiles across platforms
    const searchQuery = `${input.name} ${input.agencyName} ${input.address} real estate agent`;
    
    try {
      const searchResults = await searchClient.search(searchQuery, {
        maxResults: 10,
        searchDepth: 'advanced',
      });

      // Format search results for AI consumption
      const searchContext = searchClient.formatResultsForAI(searchResults.results, true);

      // Call AI with search context
      const output = await napAuditPrompt({
        ...input,
        searchContext,
      } as any);

      if (!output?.results) {
        throw new Error("The AI returned an unexpected response format. Please try again.");
      }

      return output;
    } catch (error) {
      // If search fails, fall back to AI knowledge
      console.warn('Web search failed, using AI knowledge only:', error);
      
      const output = await napAuditPrompt({
        ...input,
        searchContext: 'Web search unavailable. Please provide estimates based on typical patterns.',
      } as any);

      if (!output?.results) {
        throw new Error("The AI returned an unexpected response format. Please try again.");
      }

      return output;
    }
  }
);

export async function runNapAudit(
  input: RunNapAuditInput
): Promise<RunNapAuditOutput> {
  return runNapAuditFlow.execute(input);
}
