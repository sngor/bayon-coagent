'use server';

/**
 * @fileOverview Bedrock flow to estimate local keyword rankings for real estate agents.
 * 
 * This flow uses web search to identify agents ranking for specific keywords.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import {
  GetKeywordRankingsInputSchema,
  GetKeywordRankingsOutputSchema,
  type GetKeywordRankingsInput,
  type GetKeywordRankingsOutput,
} from '@/ai/schemas/keyword-ranking-schemas';



const prompt = definePrompt({
  name: 'getKeywordRankingsPrompt',
  inputSchema: GetKeywordRankingsInputSchema.extend({
    searchContext: z.string().optional(),
  }),
  outputSchema: GetKeywordRankingsOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL,
  prompt: `You are an expert SEO analyst specializing in local real estate.

Your task is to identify the top 5 real estate agents that rank on Google for a specific keyword in a given location based on web search results.

- Search Location: {{{location}}}
- Keyword: {{{keyword}}}

Web Search Results:
{{{searchContext}}}

Based on the search results above, identify the top 5 real estate agents or agencies that appear in the results.

For each of the top 5 results that are real estate agents, return:
- rank: An integer from 1 to 5 (based on their position in search results)
- agentName: The name of the agent
- agencyName: The name of their agency or brokerage
- url: The website URL from the search result (optional)

Return a JSON response with a "rankings" array containing up to 5 objects with the above fields.

Your answer must be based on the search results. Do not invent or hallucinate rankings or agent details. If you cannot find enough real estate agents in the results, return fewer than 5 rankings.`,
});

const getKeywordRankingsFlow = defineFlow(
  {
    name: 'getKeywordRankingsFlow',
    inputSchema: GetKeywordRankingsInputSchema,
    outputSchema: GetKeywordRankingsOutputSchema,
  },
  async (input) => {
    // Perform localized search for the keyword
    const searchClient = getSearchClient();
    const searchQuery = `${input.keyword} ${input.location}`;

    try {
      const searchResults = await searchClient.search(searchQuery, {
        maxResults: 10,
        searchDepth: 'basic',
      });

      const searchContext = searchClient.formatResultsForAI(searchResults.results, true);

      const output = await prompt({
        ...input,
        searchContext,
      } as any);

      if (!output?.rankings) {
        throw new Error("The AI returned an unexpected response format for keyword rankings. Please try again.");
      }
      return output;
    } catch (error) {
      // If search fails, fall back to AI knowledge
      console.warn('Web search failed for keyword rankings:', error);

      const output = await prompt({
        ...input,
        searchContext: 'Web search unavailable. Please provide estimates based on typical market patterns.',
      } as any);

      if (!output?.rankings) {
        throw new Error("The AI returned an unexpected response format for keyword rankings. Please try again.");
      }
      return output;
    }
  }
);

export async function getKeywordRankings(
  input: GetKeywordRankingsInput
): Promise<GetKeywordRankingsOutput> {
  return getKeywordRankingsFlow.execute(input);
}
