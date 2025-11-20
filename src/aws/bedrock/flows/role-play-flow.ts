'use server';

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { z } from 'zod';

// Input/Output Schemas
const RolePlayMessageSchema = z.object({
  role: z.enum(['user', 'ai']),
  content: z.string(),
  timestamp: z.string().optional(),
});

const RolePlayInputSchema = z.object({
  scenarioId: z.string(),
  scenarioTitle: z.string(),
  personaName: z.string(),
  personaBackground: z.string(),
  personaPersonality: z.string(),
  personaGoals: z.array(z.string()),
  personaConcerns: z.array(z.string()),
  personaCommunicationStyle: z.string(),
  conversationHistory: z.array(RolePlayMessageSchema),
  userMessage: z.string(),
  isEndingSession: z.boolean().default(false),
});

const RolePlayOutputSchema = z.object({
  response: z.string().describe('The AI persona response to the user message'),
  feedback: z.string().optional().describe('Constructive feedback when session ends'),
});

export type RolePlayMessage = z.infer<typeof RolePlayMessageSchema>;
export type RolePlayInput = z.infer<typeof RolePlayInputSchema>;
export type RolePlayOutput = z.infer<typeof RolePlayOutputSchema>;

// Role-play conversation prompt
const rolePlayConversationPrompt = definePrompt({
  name: 'rolePlayConversationPrompt',
  inputSchema: RolePlayInputSchema,
  outputSchema: RolePlayOutputSchema,
  options: {
    ...MODEL_CONFIGS.LONG_FORM,
    temperature: 0.8, // Higher temperature for more natural, varied conversation
  },
  prompt: `You are roleplaying as a real estate client to help train a real estate agent. Stay in character throughout the conversation.

SCENARIO: {{{scenarioTitle}}}

YOUR CHARACTER:
Name: {{{personaName}}}
Background: {{{personaBackground}}}
Personality: {{{personaPersonality}}}
Communication Style: {{{personaCommunicationStyle}}}

Goals:
{{#each personaGoals}}
- {{this}}
{{/each}}

Concerns:
{{#each personaConcerns}}
- {{this}}
{{/each}}

CONVERSATION HISTORY:
{{#each conversationHistory}}
{{#if (eq role "user")}}Agent: {{content}}{{/if}}
{{#if (eq role "ai")}}You ({{../personaName}}): {{content}}{{/if}}
{{/each}}

AGENT'S LATEST MESSAGE:
{{{userMessage}}}

INSTRUCTIONS:
1. Respond naturally as this character would, based on their personality and communication style
2. Reference your goals and concerns when relevant
3. React authentically to what the agent says - if they handle something well, show it; if they miss something, express it
4. Ask questions this character would ask
5. Show emotions appropriate to the situation and personality
6. Keep responses conversational (2-4 sentences typically)
7. Don't make it too easy - challenge the agent appropriately for realistic practice
8. Stay consistent with previous conversation context

{{#if isEndingSession}}
SPECIAL INSTRUCTION: The agent is ending the role-play session. Provide a brief in-character closing response, then break character and provide constructive feedback on their performance.

In your feedback:
- Highlight 2-3 things they did well (be specific with examples from the conversation)
- Suggest 1-2 areas for improvement (be constructive and actionable)
- Reference specific moments from the conversation
- Keep feedback professional and encouraging
- Format feedback clearly with "What Went Well:" and "Areas for Growth:" sections
{{/if}}

Return ONLY this JSON structure (no markdown, no code blocks):
{{#if isEndingSession}}
{"response": "your in-character closing", "feedback": "your detailed feedback"}
{{else}}
{"response": "your in-character response"}
{{/if}}`,
});

const rolePlayFlow = defineFlow(
  {
    name: 'rolePlayFlow',
    inputSchema: RolePlayInputSchema,
    outputSchema: RolePlayOutputSchema,
  },
  async (input) => {
    const output = await rolePlayConversationPrompt(input);
    
    if (!output?.response) {
      throw new Error("The AI returned an empty response. Please try again.");
    }
    
    return output;
  }
);

export async function generateRolePlayResponse(
  input: RolePlayInput
): Promise<RolePlayOutput> {
  return rolePlayFlow.execute(input);
}
