'use server';

/**
 * @fileOverview Bedrock flow for a deep research AI agent.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
  RunResearchAgentInputSchema,
  RunResearchAgentOutputSchema,
  type RunResearchAgentInput,
  type RunResearchAgentOutput,
} from '@/ai/schemas/research-agent-schemas';

export { type RunResearchAgentInput, type RunResearchAgentOutput };

const researchPrompt = definePrompt({
  name: 'researchPrompt',
  inputSchema: RunResearchAgentInputSchema,
  outputSchema: RunResearchAgentOutputSchema,
  options: MODEL_CONFIGS.LONG_FORM,
  prompt: `You are an expert research analyst. Your goal is to produce a comprehensive, well-structured, and factual research report on the given topic, based on your most up-to-date internal knowledge.

Topic: {{{topic}}}

Follow these instructions precisely:
1.  **Structure the Report:** Format the report in well-structured Markdown. It must include an "Executive Summary" at the start, followed by sections for each major sub-topic, and a final "Conclusion" summarizing the key takeaways. Use headings, subheadings, and bullet points to ensure readability.
2.  **Cite Your Sources:** For every factual claim, data point, or statistic you include, you must provide a citation. The final output must include a list of all source URLs in the 'citations' field. Ensure these URLs are plausible and representative of the information cited.
3.  **Content Quality:** The report should be thorough, insightful, and written in a professional tone. Go beyond a simple summary and provide deep analysis where possible.

Return a JSON response with two fields:
- "report": A single Markdown string containing the full research report
- "citations": An array of source URLs (strings) that were referenced in the report`,
});

const runResearchAgentFlow = defineFlow(
  {
    name: 'runResearchAgentFlow',
    inputSchema: RunResearchAgentInputSchema,
    outputSchema: RunResearchAgentOutputSchema,
  },
  async (input) => {
    const output = await researchPrompt(input);

    if (!output?.report) {
      throw new Error("The AI returned an empty report. Please try refining your topic or try again later.");
    }

    if (!output?.citations) {
      throw new Error("The AI failed to provide citations for the report. Please try again.");
    }

    return output;
  }
);

export async function runResearchAgent(
  input: RunResearchAgentInput
): Promise<RunResearchAgentOutput> {
  return runResearchAgentFlow.execute(input);
}
