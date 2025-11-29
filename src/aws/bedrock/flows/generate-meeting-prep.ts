'use server';

/**
 * @fileOverview Bedrock flow for generating meeting preparation materials.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
import {
    GenerateMeetingPrepInputSchema,
    GenerateMeetingPrepOutputSchema,
    type GenerateMeetingPrepInput,
    type GenerateMeetingPrepOutput,
} from '@/ai/schemas/meeting-prep-schemas';

export { type GenerateMeetingPrepInput, type GenerateMeetingPrepOutput };

const prompt = definePrompt({
    name: 'generateMeetingPrepPrompt',
    inputSchema: GenerateMeetingPrepInputSchema,
    outputSchema: GenerateMeetingPrepOutputSchema,
    options: MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate consultant helping agents prepare for client meetings. Your task is to analyze the client information and generate comprehensive meeting preparation materials.

Client Information:
- Name: {{{clientName}}}
- Email: {{{clientEmail}}}
- Meeting Purpose: {{{meetingPurpose}}}
- Property Interests: {{{json propertyInterests}}}
- Budget Range: $\{{{budget.min}}} - $\{{{budget.max}}}
- Additional Notes: {{{notes}}}

Based on this information, create comprehensive meeting preparation materials that include:

1. **Meeting Summary**: A concise overview of the client, their needs, and meeting objectives. Include key client details and what you hope to accomplish.

2. **Property Recommendations**: Generate 3-5 realistic property recommendations that match the client's interests and budget. For each property:
   - Create a realistic address in a relevant area
   - Set price within their budget range
   - Include appropriate beds/baths for the price point
   - List relevant features that match their interests
   - Explain why this property matches their needs

3. **Market Insights**: Provide relevant market analysis for their area of interest and budget range, including:
   - Current market conditions
   - Price trends
   - Inventory levels
   - Competition for properties in their range
   - Timing considerations

4. **Discussion Topics**: Create 5-7 strategic discussion topics to guide the meeting, such as:
   - Understanding their timeline and urgency
   - Exploring financing options
   - Discussing must-haves vs nice-to-haves
   - Market education points
   - Next steps in the process

5. **Follow-up Actions**: Suggest specific actions to take after the meeting to maintain momentum.

6. **Preparation Checklist**: Items the agent should prepare or bring to the meeting.

Make all recommendations specific and actionable. Use realistic market data and property details that would be appropriate for their stated interests and budget range.

Return a JSON response with all the required fields.`,
});

const generateMeetingPrepFlow = defineFlow(
    {
        name: 'generateMeetingPrepFlow',
        inputSchema: GenerateMeetingPrepInputSchema,
        outputSchema: GenerateMeetingPrepOutputSchema,
    },
    async (input) => {
        // Validate budget range
        if (input.budget.min > input.budget.max && input.budget.max > 0) {
            throw new Error('Maximum budget must be greater than minimum budget');
        }

        // Validate required fields
        if (!input.clientName.trim()) {
            throw new Error('Client name is required');
        }

        if (!input.meetingPurpose.trim()) {
            throw new Error('Meeting purpose is required');
        }

        // 1. Validate input with Guardrails
        const guardrails = getGuardrailsService();

        // Validate and sanitize client name (PII)
        const nameValidation = guardrails.validateRequest(input.clientName, DEFAULT_GUARDRAILS_CONFIG);
        // We don't block on name, but we sanitize it
        const clientName = nameValidation.sanitizedPrompt || input.clientName;

        // Validate purpose
        const purposeValidation = guardrails.validateRequest(input.meetingPurpose, DEFAULT_GUARDRAILS_CONFIG);
        if (!purposeValidation.allowed) {
            throw new Error(`Guardrails validation failed for Meeting Purpose: ${purposeValidation.reason}`);
        }
        const meetingPurpose = purposeValidation.sanitizedPrompt || input.meetingPurpose;

        // Validate notes if present
        let notes = input.notes;
        if (input.notes) {
            const notesValidation = guardrails.validateRequest(input.notes, DEFAULT_GUARDRAILS_CONFIG);
            if (!notesValidation.allowed) {
                throw new Error(`Guardrails validation failed for Notes: ${notesValidation.reason}`);
            }
            notes = notesValidation.sanitizedPrompt || input.notes;
        }

        const output = await prompt({ ...input, clientName, meetingPurpose, notes });

        if (!output?.summary || !output?.propertyRecommendations || !output?.marketInsights || !output?.discussionTopics) {
            throw new Error('The AI failed to generate complete meeting preparation materials. Please try again.');
        }

        // Validate property recommendations
        if (output.propertyRecommendations.length === 0) {
            throw new Error('No property recommendations were generated. Please check the client criteria and try again.');
        }

        // Ensure all properties are within budget (if budget is specified)
        if (input.budget.max > 0) {
            const outOfBudgetProperties = output.propertyRecommendations.filter(
                prop => prop.price > input.budget.max || (input.budget.min > 0 && prop.price < input.budget.min)
            );

            if (outOfBudgetProperties.length > 0) {
                console.warn('Some property recommendations are outside the specified budget range');
            }
        }

        return output;
    }
);

export async function generateMeetingPrep(
    input: GenerateMeetingPrepInput
): Promise<GenerateMeetingPrepOutput> {
    return generateMeetingPrepFlow.execute(input);
}