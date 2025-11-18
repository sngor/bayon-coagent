import { z } from 'zod';

/**
 * Schema for generating video scripts
 */
export const GenerateVideoScriptInputSchema = z.object({
  topic: z.string().describe('The topic for the video script'),
  tone: z.string().describe('The tone of the script (e.g., professional, casual, enthusiastic)'),
  audience: z.string().describe('The target audience for the video'),
});

export const GenerateVideoScriptOutputSchema = z.object({
  script: z.string().describe('The generated video script'),
  duration: z.string().describe('Estimated duration of the video'),
});

export type GenerateVideoScriptInput = z.infer<typeof GenerateVideoScriptInputSchema>;
export type GenerateVideoScriptOutput = z.infer<typeof GenerateVideoScriptOutputSchema>;
