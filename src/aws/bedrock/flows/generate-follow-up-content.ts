'use server';

/**
 * @fileOverview Bedrock flow for generating personalized follow-up content for open house visitors.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    GenerateFollowUpContentInputSchema,
    GenerateFollowUpContentOutputSchema,
    type GenerateFollowUpContentInput,
    type GenerateFollowUpContentOutput,
} from '@/ai/schemas/follow-up-content-schemas';

export { type GenerateFollowUpContentInput, type GenerateFollowUpContentOutput };

const prompt = definePrompt({
    name: 'generateFollowUpContentPrompt',
    inputSchema: GenerateFollowUpContentInputSchema,
    outputSchema: GenerateFollowUpContentOutputSchema,
    options: MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate marketing consultant helping agents create personalized follow-up content for open house visitors. Your task is to analyze the visitor information and generate compelling, personalized follow-up materials.

Visitor Information:
- Name: {{{visitor.name}}}
- Email: {{{visitor.email}}}
- Phone: {{{visitor.phone}}}
- Interest Level: {{{visitor.interestLevel}}}
- Notes: {{{visitor.notes}}}
- Visit Time: {{{visitor.timestamp}}}

Property Information:
- Property ID: {{{property.id}}}
- Address: {{{property.address}}}

Open House Details:
- Session ID: {{{openHouseDetails.sessionId}}}
- Duration: {{{openHouseDetails.startTime}}} to {{{openHouseDetails.endTime}}}
- Total Visitors: {{{openHouseDetails.totalVisitors}}}
- High Interest Visitors: {{{openHouseDetails.highInterestCount}}}

Agent Information:
- Name: {{{agentInfo.name}}}
- Email: {{{agentInfo.email}}}
- Phone: {{{agentInfo.phone}}}
- Brokerage: {{{agentInfo.brokerage}}}

Based on the visitor's interest level ({{{visitor.interestLevel}}}), create personalized follow-up content that includes:

1. **Email Subject Line**: Create a compelling, personalized subject line that references their visit and encourages opening.

2. **Email Content**: Write a complete, professional email that:
   - Thanks them for visiting the open house
   - References specific details from their visit (if available in notes)
   - Matches the tone to their interest level (more urgent for high interest, more educational for low interest)
   - Includes a clear call-to-action appropriate for their interest level
   - Maintains a professional yet warm tone
   - Is 200-400 words in length

3. **Text Message** (optional): If appropriate for their interest level, create a brief, friendly SMS follow-up (under 160 characters).

4. **Next Steps**: Provide 3-5 specific next steps tailored to their interest level:
   - High interest: Schedule private showing, discuss financing, provide market analysis
   - Medium interest: Send similar properties, market updates, schedule consultation
   - Low interest: Add to newsletter, send market insights, gentle nurturing

5. **Scheduling Message**: Create a specific message for scheduling the next interaction based on their interest level.

6. **Market Insights**: Provide relevant market insights they might find valuable (optional, especially for medium/low interest).

7. **Similar Properties**: Suggest 2-3 similar properties they might be interested in (descriptions only, not specific addresses).

8. **Urgency Level**: Determine the appropriate follow-up urgency (low/medium/high) based on their interest level and market conditions.

9. **Follow-up Timing**: Recommend when to send this follow-up (e.g., "within 2 hours", "next day", "within a week").

10. **Personalized Touch Points**: Create 2-4 conversation starters based on any notes about the visitor.

Tailor all content to their specific interest level:
- **High Interest**: Focus on urgency, next steps, and immediate action
- **Medium Interest**: Balance education with gentle encouragement
- **Low Interest**: Focus on education, market insights, and long-term relationship building

Make all content professional, helpful, and genuinely valuable to the recipient. Avoid being pushy or overly sales-focused.

Return a JSON response with all the required fields.`,
});

const generateFollowUpContentFlow = defineFlow(
    {
        name: 'generateFollowUpContentFlow',
        inputSchema: GenerateFollowUpContentInputSchema,
        outputSchema: GenerateFollowUpContentOutputSchema,
    },
    async (input) => {
        // Validate required fields
        if (!input.visitor.name.trim()) {
            throw new Error('Visitor name is required');
        }

        if (!input.visitor.email.trim()) {
            throw new Error('Visitor email is required');
        }

        if (!['low', 'medium', 'high'].includes(input.visitor.interestLevel)) {
            throw new Error('Invalid interest level. Must be low, medium, or high');
        }

        const output = await prompt(input);

        if (!output?.emailSubject || !output?.emailContent || !output?.nextSteps || !output?.schedulingMessage) {
            throw new Error('The AI failed to generate complete follow-up content. Please try again.');
        }

        // Validate email subject length (reasonable for email clients)
        if (output.emailSubject.length > 100) {
            console.warn('Email subject line is quite long and may be truncated in some email clients');
        }

        // Validate email content length
        if (output.emailContent.length < 100) {
            throw new Error('Email content is too short. Please try again.');
        }

        if (output.emailContent.length > 2000) {
            console.warn('Email content is quite long and may be overwhelming for recipients');
        }

        // Validate text message length if provided
        if (output.textMessage && output.textMessage.length > 160) {
            console.warn('Text message exceeds 160 characters and may be split into multiple messages');
        }

        // Validate next steps
        if (output.nextSteps.length === 0) {
            throw new Error('No next steps were generated. Please try again.');
        }

        return output;
    }
);

export async function generateFollowUpContent(
    input: GenerateFollowUpContentInput
): Promise<GenerateFollowUpContentOutput> {
    return generateFollowUpContentFlow.execute(input);
}