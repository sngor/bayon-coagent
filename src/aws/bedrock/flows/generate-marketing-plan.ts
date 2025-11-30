'use server';

/**
 * @fileOverview Bedrock flow for generating a personalized marketing plan.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
  GenerateMarketingPlanInputSchema,
  GenerateMarketingPlanOutputSchema,
  type GenerateMarketingPlanInput,
  type GenerateMarketingPlanOutput,
} from '@/ai/schemas/marketing-plan-schemas';



const prompt = definePrompt({
  name: 'generateMarketingPlanPrompt',
  inputSchema: GenerateMarketingPlanInputSchema,
  outputSchema: GenerateMarketingPlanOutputSchema,
  options: MODEL_CONFIGS.BALANCED,
  prompt: `You are an expert marketing consultant for real estate agents. Your task is to analyze the provided brand audit and competitor data to create a concise, actionable 3-step marketing plan.

For each step, provide a clear 'task', a brief 'rationale' explaining why it's important, the specific 'tool' in the Co-agent Marketer app to use, and a direct 'toolLink' to that tool.

Analyze the following data:
- Brand Audit: {{{json brandAudit}}}
- Competitors: {{{json competitors}}}

Based on your analysis of the data, identify the top 3 biggest opportunities for improvement. These could be fixing NAP inconsistencies, improving a weak social media presence, creating content to target competitor keyword weaknesses, etc.

For each opportunity, formulate a specific task. Example tasks:
- "Fix NAP inconsistencies on Zillow and Yelp." (if audit shows errors)
- "Create a new blog post targeting the keyword 'luxury condos downtown'." (if a competitor ranks for this but has weak content)
- "Launch a social media campaign about 'first-time buyer tips'." (if competitors have low social followers)

For each task, provide the corresponding \`tool\` ('Brand Audit', 'Content Engine', 'Competitive Analysis') and the correct \`toolLink\` ('/brand-audit', '/content-engine?tab=blog-post', '/competitive-analysis').

Return a JSON response with a "plan" array containing exactly 3 objects, each with "task", "rationale", "tool", and "toolLink" fields.`,
});

const generateMarketingPlanFlow = defineFlow(
  {
    name: 'generateMarketingPlanFlow',
    inputSchema: GenerateMarketingPlanInputSchema,
    outputSchema: GenerateMarketingPlanOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.plan || output.plan.length === 0) {
      throw new Error('The AI failed to generate a marketing plan. Please try again.');
    }
    return output;
  }
);

export async function generateMarketingPlan(
  input: GenerateMarketingPlanInput
): Promise<GenerateMarketingPlanOutput> {
  return generateMarketingPlanFlow.execute(input);
}
