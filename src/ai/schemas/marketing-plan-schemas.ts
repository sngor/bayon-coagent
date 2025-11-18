import { z } from 'zod';

/**
 * Schema for generating marketing plans
 */
export const GenerateMarketingPlanInputSchema = z.object({
  brandAudit: z.record(z.any()).describe('Brand audit data'),
  competitors: z.array(z.record(z.any())).describe('Competitor data'),
});

export const GenerateMarketingPlanOutputSchema = z.object({
  plan: z.array(z.object({
    task: z.string().describe('The marketing task to perform'),
    rationale: z.string().describe('Why this task is important'),
    tool: z.string().describe('The tool to use in the app'),
    toolLink: z.string().describe('Direct link to the tool'),
  })).describe('Array of 3 marketing plan steps'),
});

export type GenerateMarketingPlanInput = z.infer<typeof GenerateMarketingPlanInputSchema>;
export type GenerateMarketingPlanOutput = z.infer<typeof GenerateMarketingPlanOutputSchema>;
