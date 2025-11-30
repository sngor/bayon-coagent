'use server';

/**
 * @fileOverview Bedrock flow to find and enrich real estate agent competitors.
 * 
 * This flow uses web search to find competitor agents and gather their metrics.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import {
  FindCompetitorsInputSchema,
  FindCompetitorsOutputSchema,
  EnrichCompetitorDataInputSchema,
  EnrichCompetitorDataOutputSchema,
  type FindCompetitorsInput,
  type FindCompetitorsOutput,
  type EnrichCompetitorDataInput,
  type EnrichCompetitorDataOutput,
} from '@/ai/schemas/competitor-analysis-schemas';



const enrichCompetitorPrompt = definePrompt({
  name: 'enrichCompetitorPrompt',
  inputSchema: EnrichCompetitorDataInputSchema.extend({
    searchContext: z.string().optional(),
  }),
  outputSchema: EnrichCompetitorDataOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL,
  prompt: `You are a real estate market intelligence analyst. Your task is to find key performance metrics for a competitor agent based on web search results.

Agent Name: {{{name}}}
Agency: {{{agency}}}

Web Search Results:
{{{searchContext}}}

Based ONLY on the search results above, extract or estimate the following metrics:
- Total number of online reviews across all platforms (reviewCount)
- Average review rating out of 5 (avgRating)
- Total social media followers across all platforms (socialFollowers)
- Website Domain Authority SEO score from 0-100 (domainAuthority)

If a metric cannot be found in the search results, return 0 for it. Do not invent or hallucinate information.

Return a JSON response with fields: "reviewCount", "avgRating", "socialFollowers", and "domainAuthority".`,
});

const enrichCompetitorDataFlow = defineFlow(
  {
    name: 'enrichCompetitorDataFlow',
    inputSchema: EnrichCompetitorDataInputSchema,
    outputSchema: EnrichCompetitorDataOutputSchema,
  },
  async (input) => {
    // Search for competitor information
    const searchClient = getSearchClient();
    const searchQuery = `${input.name} ${input.agency} real estate agent reviews social media`;

    try {
      const searchResults = await searchClient.search(searchQuery, {
        maxResults: 5,
        searchDepth: 'basic',
      });

      const searchContext = searchClient.formatResultsForAI(searchResults.results, true);

      const output = await enrichCompetitorPrompt({
        ...input,
        searchContext,
      } as any);

      if (!output) {
        throw new Error("The AI returned an unexpected response format. Please try again.");
      }
      return output;
    } catch (error) {
      // If search fails, return zeros
      console.warn('Web search failed for competitor enrichment:', error);
      return {
        reviewCount: 0,
        avgRating: 0,
        socialFollowers: 0,
        domainAuthority: 0,
      };
    }
  }
);

const findCompetitorsPrompt = definePrompt({
  name: 'findCompetitorsPrompt',
  inputSchema: FindCompetitorsInputSchema.extend({
    searchContext: z.string().optional(),
  }),
  outputSchema: FindCompetitorsOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL,
  prompt: `You are an expert real estate market research analyst. Your task is to identify the top 3-5 real estate agent competitors for the given agent in their primary market based on web search results.

Agent Details:
- Name: {{{name}}}
- Agency: {{{agencyName}}}
- Primary Market (Address): {{{address}}}

Web Search Results:
{{{searchContext}}}

Based ONLY on the search results above, identify 3-5 prominent competitor agents operating in the same geographical area. Do not include the agent themselves in the list.

For each competitor you find in the search results, provide:
- name: The competitor's full name
- agency: The competitor's agency name
- reviewCount: Total online reviews found (or 0 if not found)
- avgRating: Average rating out of 5 (or 0 if not found)
- socialFollowers: Total social media followers (or 0 if not found)
- domainAuthority: Domain authority score 0-100 (or 0 if not found)

Return a JSON response with a "competitors" array containing 3-5 competitor objects with all the above fields.

If you cannot find enough competitors in the search results, return fewer competitors rather than inventing information.`,
});

const findCompetitorsFlow = defineFlow(
  {
    name: 'findCompetitorsFlow',
    inputSchema: FindCompetitorsInputSchema,
    outputSchema: FindCompetitorsOutputSchema,
  },
  async (input) => {
    // Search for competitors in the market
    const searchClient = getSearchClient();
    const searchQuery = `top real estate agents ${input.address} ${input.agencyName}`;

    try {
      const searchResults = await searchClient.search(searchQuery, {
        maxResults: 10,
        searchDepth: 'advanced',
      });

      const searchContext = searchClient.formatResultsForAI(searchResults.results, true);

      const output = await findCompetitorsPrompt({
        ...input,
        searchContext,
      } as any);

      if (!output?.competitors) {
        throw new Error("The AI returned an unexpected response format. Please try again.");
      }
      return output;
    } catch (error) {
      // If search fails, fall back to AI knowledge
      console.warn('Web search failed for finding competitors:', error);

      const output = await findCompetitorsPrompt({
        ...input,
        searchContext: 'Web search unavailable. Please provide estimates based on typical market patterns.',
      } as any);

      if (!output?.competitors) {
        throw new Error("The AI returned an unexpected response format. Please try again.");
      }
      return output;
    }
  }
);

export async function findCompetitors(
  input: FindCompetitorsInput
): Promise<FindCompetitorsOutput> {
  return findCompetitorsFlow.execute(input);
}

export async function enrichCompetitorData(
  input: EnrichCompetitorDataInput
): Promise<EnrichCompetitorDataOutput> {
  return enrichCompetitorDataFlow.execute(input);
}
