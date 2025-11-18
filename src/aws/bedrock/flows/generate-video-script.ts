'use server';

/**
 * @fileOverview Bedrock flow for generating video scripts.
 */

import { defineFlow, definePrompt } from '../flow-base';
import {
  GenerateVideoScriptInputSchema,
  GenerateVideoScriptOutputSchema,
  type GenerateVideoScriptInput,
  type GenerateVideoScriptOutput,
} from '@/ai/schemas/video-script-schemas';

export { type GenerateVideoScriptInput, type GenerateVideoScriptOutput };

const prompt = definePrompt({
  name: 'generateVideoScriptPrompt',
  inputSchema: GenerateVideoScriptInputSchema,
  outputSchema: GenerateVideoScriptOutputSchema,
  prompt: `You are an expert video scriptwriter for real estate content. Your responses must be related to real estate.

Create a compelling 60-second video script for the following topic, using the specified tone and targeting the given audience.

- Topic: {{{topic}}}
- Tone: {{{tone}}}
- Target Audience: {{{audience}}}

If the topic is not related to real estate, you must politely decline and state that you only create real estate video scripts.

The script should include:
1. An attention-grabbing opening (first 5-10 seconds)
2. Clear, concise main content that delivers value
3. Scene descriptions in [brackets] to guide filming
4. Voiceover text that flows naturally
5. A strong call-to-action at the end

Format the script with scene descriptions and voiceover clearly separated.
Keep the total length appropriate for a 60-second video (approximately 150-180 words of voiceover).

Return a JSON response with a "script" field containing the complete video script.`,
});

const generateVideoScriptFlow = defineFlow(
  {
    name: 'generateVideoScriptFlow',
    inputSchema: GenerateVideoScriptInputSchema,
    outputSchema: GenerateVideoScriptOutputSchema,
  },
  async (input) => {
    const output = await prompt(input);
    if (!output?.script) {
      throw new Error("The AI returned an empty video script. Please try again.");
    }
    return output;
  }
);

export async function generateVideoScript(
  input: GenerateVideoScriptInput
): Promise<GenerateVideoScriptOutput> {
  return generateVideoScriptFlow.execute(input);
}
