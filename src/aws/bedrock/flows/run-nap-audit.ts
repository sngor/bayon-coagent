'use server';

/**
 * @fileOverview Bedrock flow to perform a Name, Address, Phone (NAP) consistency audit.
 * 
 * This flow uses web search to find the agent's profiles across various platforms
 * and checks NAP consistency.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
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
  options: MODEL_CONFIGS.ANALYTICAL,
  prompt: `You are an expert local SEO auditor performing a NAP (Name, Address, Phone) consistency audit for a real estate agent.

Official Agent Information (Source of Truth):
- Name: {{{name}}}
- Address: {{{address}}}
- Phone: {{{phone}}}
- Agency: {{{agencyName}}}
{{#if website}}- Website: {{{website}}}{{/if}}

Web Search Results:
{{{searchContext}}}

Your task is to audit the agent's NAP information across these platforms:
- Google Business Profile (Google Maps, Google My Business)
- Zillow (zillow.com)
- Realtor.com (realtor.com)
- Yelp (yelp.com)
- Facebook (facebook.com)
- Bing Places (bing.com/maps)
{{#if website}}- Agent's Website{{/if}}

For each platform:
1. Carefully examine the web search results to find any mentions of the agent on that platform
2. Extract the Name, Address, and Phone number if found
3. Note the URL of the profile page
4. Compare with the official information (case-insensitive, ignore minor formatting like 'St.' vs 'Street')

Status Determination:
- 'Consistent': All NAP information matches the official data (minor formatting differences are OK)
- 'Inconsistent': Any NAP field differs from the official data
- 'Not Found': No profile found for this agent on this platform in the search results

CRITICAL FORMATTING RULES:
- Use empty string "" for any missing data (platformUrl, foundName, foundAddress, foundPhone)
- NEVER use undefined, null, or omit fields
- All fields must be present in every result object
- platformUrl should be the direct link to the agent's profile on that platform

Return a JSON object with a "results" array containing one object per platform with these exact fields:
{
  "results": [
    {
      "platform": "Platform Name",
      "platformUrl": "https://..." or "",
      "foundName": "Name Found" or "",
      "foundAddress": "Address Found" or "",
      "foundPhone": "Phone Found" or "",
      "status": "Consistent" or "Inconsistent" or "Not Found"
    }
  ]
}`,
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

    try {
      // Perform multiple targeted searches for better coverage
      const searches = [
        // General search for the agent
        `"${input.name}" "${input.agencyName}" real estate agent`,
        // Search for specific platforms
        `"${input.name}" site:google.com/maps OR site:zillow.com OR site:realtor.com`,
        `"${input.name}" "${input.agencyName}" site:yelp.com OR site:facebook.com`,
      ];

      console.log('🔍 Running NAP audit searches for:', input.name);

      // Run all searches in parallel
      const searchPromises = searches.map(query =>
        searchClient.search(query, {
          maxResults: 5,
          searchDepth: 'advanced',
        }).catch(err => {
          console.warn(`Search failed for query "${query}":`, err.message);
          return { results: [] };
        })
      );

      const allSearchResults = await Promise.all(searchPromises);

      // Combine all results
      const combinedResults = allSearchResults.flatMap(result => result.results || []);

      console.log(`✅ Found ${combinedResults.length} total search results`);

      // Format search results for AI consumption
      const searchContext = combinedResults.length > 0
        ? searchClient.formatResultsForAI(combinedResults, true)
        : 'No search results found. The agent may not have established online profiles yet.';

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
      console.error('❌ Web search failed:', error);

      const output = await napAuditPrompt({
        ...input,
        searchContext: 'Web search unavailable. Please analyze based on the provided information and indicate that profiles were not found.',
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
