'use server';

/**
 * @fileOverview Bedrock flow for a deep research AI agent with Tavily web search.
 */

import { z } from 'zod';
import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getSearchClient } from '@/aws/search';
import {
  RunResearchAgentInputSchema,
  RunResearchAgentOutputSchema,
  type RunResearchAgentInput,
  type RunResearchAgentOutput,
} from '@/ai/schemas/research-agent-schemas';

export { type RunResearchAgentInput, type RunResearchAgentOutput };

const researchPrompt = definePrompt({
  name: 'researchPrompt',
  inputSchema: RunResearchAgentInputSchema.extend({
    searchContext: z.string().describe('Web search results context'),
  }),
  outputSchema: RunResearchAgentOutputSchema,
  options: MODEL_CONFIGS.LONG_FORM,
  prompt: `You are an expert research analyst. Your goal is to produce a comprehensive, well-structured, and factual research report on the given topic, based on the provided web search results.

Topic: {{{topic}}}

Web Search Results:
{{{searchContext}}}

Follow these instructions precisely:
1.  **Structure the Report:** Format the report in well-structured Markdown. It must include an "Executive Summary" at the start, followed by sections for each major sub-topic, and a final "Conclusion" summarizing the key takeaways. Use headings, subheadings, and bullet points to ensure readability.
2.  **Cite Your Sources:** Use ONLY the sources provided in the web search results above. For every factual claim, data point, or statistic you include, cite the specific URL from the search results. The final output must include a list of all source URLs you referenced in the 'citations' field.
3.  **Content Quality:** The report should be thorough, insightful, and written in a professional tone. Synthesize information from multiple sources and provide deep analysis where possible.
4.  **Accuracy:** Base your report strictly on the search results provided. Do not make up information or cite sources that weren't in the search results.

Return a JSON response with two fields:
- "report": A single Markdown string containing the full research report
- "citations": An array of source URLs (strings) from the search results that were referenced in the report`,
});

const runResearchAgentFlow = defineFlow(
  {
    name: 'runResearchAgentFlow',
    inputSchema: RunResearchAgentInputSchema,
    outputSchema: RunResearchAgentOutputSchema,
  },
  async (input) => {
    // Perform web search using Tavily
    const searchClient = getSearchClient();
    
    try {
      const searchResults = await searchClient.search(input.topic, {
        maxResults: 10,
        searchDepth: 'advanced',
        includeAnswer: true,
        includeImages: false,
      });

      // Format search results for AI consumption
      const searchContext = searchClient.formatResultsForAI(searchResults.results, true);

      // Generate research report with search context
      const output = await researchPrompt({
        topic: input.topic,
        searchContext,
      });

      if (!output?.report) {
        throw new Error("The AI returned an empty report. Please try refining your topic or try again later.");
      }

      if (!output?.citations || output.citations.length === 0) {
        throw new Error("The AI failed to provide citations for the report. Please try again.");
      }

      return output;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error("Search service is not configured. Please contact support.");
      }
      throw error;
    }
  }
);

export async function runResearchAgent(
  input: RunResearchAgentInput
): Promise<RunResearchAgentOutput> {
  return runResearchAgentFlow.execute(input);
}
