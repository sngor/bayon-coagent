'use server';

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { z } from 'zod';

const TrainingPlanInputSchema = z.object({
  challenge: z.string().min(10, 'Challenge description must be at least 10 characters'),
});

const TrainingPlanOutputSchema = z.object({
  plan: z.string().describe('The complete HTML-formatted training plan'),
});

export type TrainingPlanInput = z.infer<typeof TrainingPlanInputSchema>;
export type TrainingPlanOutput = z.infer<typeof TrainingPlanOutputSchema>;

const trainingPlanPrompt = definePrompt({
  name: 'generateTrainingPlanPrompt',
  inputSchema: TrainingPlanInputSchema,
  outputSchema: TrainingPlanOutputSchema,
  options: {
    ...MODEL_CONFIGS.LONG_FORM,
    temperature: 0.7,
  },
  prompt: `You are an expert real estate coach and trainer. Create a personalized training plan for this challenge:

{{{challenge}}}

Create a structured plan with 3-5 action areas, each with 2-4 specific steps. Include timelines and progress tracking tips.

Format as HTML using these classes:
- <h3 class="font-semibold mt-4 mb-2 text-lg"> for main headings
- <p class="mt-2"> for paragraphs  
- <ul class="list-disc list-inside space-y-2 ml-4"> for lists
- <strong> for emphasis

Return ONLY this JSON structure (no markdown, no code blocks):
{"plan": "your HTML content here"}`,
});

const generateTrainingPlanFlow = defineFlow(
  {
    name: 'generateTrainingPlanFlow',
    inputSchema: TrainingPlanInputSchema,
    outputSchema: TrainingPlanOutputSchema,
  },
  async (input) => {
    const output = await trainingPlanPrompt(input);
    if (!output?.plan) {
      throw new Error("The AI returned an empty training plan. Please try again.");
    }
    return output;
  }
);

export async function generateTrainingPlan(
  input: TrainingPlanInput
): Promise<TrainingPlanOutput> {
  return generateTrainingPlanFlow.execute(input);
}
