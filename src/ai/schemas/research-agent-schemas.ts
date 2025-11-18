import { z } from 'zod';

/**
 * Schema for running a research agent
 */
export const RunResearchAgentInputSchema = z.object({
  topic: z.string().describe('The topic to research'),
});

export const RunResearchAgentOutputSchema = z.object({
  report: z.string().describe('The comprehensive research report in Markdown format'),
  citations: z.array(z.string()).describe('Array of source URLs referenced in the report'),
});

export type RunResearchAgentInput = z.infer<typeof RunResearchAgentInputSchema>;
export type RunResearchAgentOutput = z.infer<typeof RunResearchAgentOutputSchema>;
