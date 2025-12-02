'use server';

/**
 * @fileOverview Bedrock flow for generating personalized follow-up content for open house visitors.
 * 
 * This flow creates AI-powered, personalized follow-up communications based on:
 * - Visitor interest level (high, medium, low)
 * - Property details and features
 * - Agent contact information
 * - Session context and visitor notes
 * 
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    GenerateOpenHouseFollowUpInputSchema,
    GenerateOpenHouseFollowUpOutputSchema,
    type GenerateOpenHouseFollowUpInput,
    type GenerateOpenHouseFollowUpOutput,
} from '@/ai/schemas/open-house-followup-schemas';

export { type GenerateOpenHouseFollowUpInput, type GenerateOpenHouseFollowUpOutput };

const prompt = definePrompt({
    name: 'generateOpenHouseFollowUpPrompt',
    inputSchema: GenerateOpenHouseFollowUpInputSchema,
    outputSchema: GenerateOpenHouseFollowUpOutputSchema,
    options: MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate marketing consultant specializing in open house follow-up communications. Your task is to create highly personalized, compelling follow-up content that converts open house visitors into clients.

# VISITOR INFORMATION
Name: {{{visitor.name}}}
Email: {{{visitor.email}}}
Phone: {{{visitor.phone}}}
Interest Level: {{{visitor.interestLevel}}}
Check-in Time: {{{visitor.checkInTime}}}
Agent Notes: {{{visitor.notes}}}

# PROPERTY DETAILS
Address: {{{property.address}}}
{{#if property.price}}Price: {{{property.price}}}{{/if}}
{{#if property.bedrooms}}Bedrooms: {{{property.bedrooms}}}{{/if}}
{{#if property.bathrooms}}Bathrooms: {{{property.bathrooms}}}{{/if}}
{{#if property.squareFeet}}Square Feet: {{{property.squareFeet}}}{{/if}}
{{#if property.features}}Key Features: {{{property.features}}}{{/if}}

# OPEN HOUSE SESSION
Session ID: {{{session.sessionId}}}
Date: {{{session.scheduledDate}}}
Total Visitors: {{{session.totalVisitors}}}
High Interest Visitors: {{{session.highInterestCount}}}

# AGENT INFORMATION
Name: {{{agent.name}}}
Email: {{{agent.email}}}
Phone: {{{agent.phone}}}
{{#if agent.brokerage}}Brokerage: {{{agent.brokerage}}}{{/if}}

---

# YOUR TASK

Generate personalized follow-up content that is **tone-matched to the visitor's interest level**:

## HIGH INTEREST ({{{visitor.interestLevel}}} = "high")
- **Tone**: Urgent, action-oriented, enthusiastic
- **Focus**: Immediate next steps, scheduling private showing, discussing offers
- **Timing**: Send within 2 hours
- **Call-to-Action**: Schedule private showing TODAY or discuss offer strategy
- **Message**: "This property is generating significant interest. Let's move quickly."

## MEDIUM INTEREST ({{{visitor.interestLevel}}} = "medium")
- **Tone**: Balanced, informative, encouraging
- **Focus**: Education, similar properties, market insights, gentle follow-up
- **Timing**: Send within 24 hours
- **Call-to-Action**: Schedule consultation or view similar properties
- **Message**: "I'd love to help you find the perfect home. Let's explore your options."

## LOW INTEREST ({{{visitor.interestLevel}}} = "low")
- **Tone**: Educational, relationship-building, no pressure
- **Focus**: Market insights, long-term value, staying in touch
- **Timing**: Send within 3-5 days
- **Call-to-Action**: Subscribe to market updates or schedule casual consultation
- **Message**: "I'm here as a resource whenever you're ready to explore the market."

---

# CONTENT REQUIREMENTS

1. **Email Subject Line** (10-100 characters)
   - Reference the specific property address
   - Create curiosity or urgency based on interest level
   - Personalize with visitor's name if appropriate
   - Examples:
     - High: "John - Act Fast on 123 Main St | Multiple Offers Expected"
     - Medium: "Great Meeting You at 123 Main St, Sarah!"
     - Low: "Thanks for Visiting 123 Main St + Market Insights"

2. **Email Body** (200-2000 words)
   - Warm, personalized greeting using visitor's name
   - Thank them for attending the open house
   - Reference specific details from agent notes if available
   - Highlight property features that match their interest level
   - Include relevant market context
   - Provide clear next steps
   - Professional signature with agent contact info
   - Match tone to interest level (urgent/balanced/educational)

3. **SMS Message** (optional, max 160 characters)
   - Only for HIGH and MEDIUM interest
   - Brief, friendly, action-oriented
   - Include agent name and clear next step
   - Example: "Hi John! Thanks for visiting 123 Main St today. I'd love to schedule a private showing. Call me at 555-1234. -Sarah"

4. **Next Steps** (3-5 specific actions)
   - Tailored to interest level
   - Concrete, actionable items
   - Prioritized by urgency
   - Examples:
     - High: "Schedule private showing within 24 hours", "Discuss pre-approval status", "Review comparable sales"
     - Medium: "View 3 similar properties in your price range", "Schedule buyer consultation", "Receive weekly market updates"
     - Low: "Subscribe to monthly market newsletter", "Save your search criteria", "Schedule casual coffee chat"

5. **Scheduling Message**
   - Specific invitation to schedule next interaction
   - Include multiple options (call, email, calendar link)
   - Match urgency to interest level

6. **Market Insights** (optional)
   - Relevant data for medium/low interest
   - Local market trends
   - Investment potential
   - Neighborhood highlights

7. **Similar Properties** (optional, 0-3 properties)
   - For medium/high interest
   - Brief descriptions only (no specific addresses)
   - Price range and key features
   - Location area

8. **Urgency Level**
   - Determine: low, medium, or high
   - Based on visitor interest and market conditions

9. **Follow-up Timing**
   - Specific recommendation: "within 2 hours", "next day", "within a week"
   - Aligned with interest level

10. **Personalized Touch Points** (2-4 items)
    - Conversation starters based on agent notes
    - References to visitor's specific questions or comments
    - Personal connections made during visit

11. **Call-to-Action**
    - Clear, specific action for visitor to take
    - Easy to execute (one-click or one-call)
    - Appropriate for interest level

---

# CRITICAL REQUIREMENTS

✓ **Requirement 3.1**: Generate emailSubject, emailBody, and smsMessage (if appropriate)
✓ **Requirement 3.2**: Include property details, visitor info, and agent contact in content
✓ **Requirement 3.3**: HIGH interest = urgent tone with immediate next steps
✓ **Requirement 3.4**: MEDIUM interest = balanced tone with education and encouragement
✓ **Requirement 3.5**: LOW interest = educational tone with long-term relationship focus

---

# OUTPUT FORMAT

Return a JSON object with all required fields. Ensure:
- Email subject is compelling and under 100 characters
- Email body is professional, personalized, and 200-2000 words
- SMS message (if included) is under 160 characters
- Next steps are specific and actionable (3-5 items)
- All content matches the visitor's interest level tone
- Content is genuine, helpful, and not overly sales-focused

Generate content that builds trust, provides value, and moves the relationship forward appropriately for the visitor's interest level.`,
});

const generateOpenHouseFollowUpFlow = defineFlow(
    {
        name: 'generateOpenHouseFollowUpFlow',
        inputSchema: GenerateOpenHouseFollowUpInputSchema,
        outputSchema: GenerateOpenHouseFollowUpOutputSchema,
    },
    async (input) => {
        // Validate required fields (Requirement 3.2)
        if (!input.visitor.name.trim()) {
            throw new Error('Visitor name is required for follow-up generation');
        }

        if (!input.visitor.email.trim()) {
            throw new Error('Visitor email is required for follow-up generation');
        }

        if (!['low', 'medium', 'high'].includes(input.visitor.interestLevel)) {
            throw new Error('Invalid interest level. Must be low, medium, or high');
        }

        if (!input.property.address.trim()) {
            throw new Error('Property address is required for follow-up generation');
        }

        if (!input.agent.name.trim() || !input.agent.email.trim() || !input.agent.phone.trim()) {
            throw new Error('Complete agent information (name, email, phone) is required');
        }

        // Execute the AI prompt
        const output = await prompt(input);

        // Validate output completeness (Requirement 3.1)
        if (!output?.emailSubject || !output?.emailBody || !output?.nextSteps || !output?.callToAction) {
            throw new Error('The AI failed to generate complete follow-up content. Please try again.');
        }

        // Validate email subject length
        if (output.emailSubject.length < 10) {
            throw new Error('Email subject line is too short. Must be at least 10 characters.');
        }

        if (output.emailSubject.length > 100) {
            console.warn('Email subject line exceeds 100 characters and may be truncated in some email clients');
        }

        // Validate email content length
        if (output.emailBody.length < 200) {
            throw new Error('Email content is too short. Must be at least 200 characters.');
        }

        if (output.emailBody.length > 2000) {
            console.warn('Email content exceeds 2000 characters and may be overwhelming for recipients');
        }

        // Validate SMS message length if provided
        if (output.smsMessage && output.smsMessage.length > 160) {
            console.warn('SMS message exceeds 160 characters and may be split into multiple messages');
        }

        // Validate next steps
        if (output.nextSteps.length < 3) {
            throw new Error('At least 3 next steps are required. Please try again.');
        }

        if (output.nextSteps.length > 5) {
            console.warn('More than 5 next steps may overwhelm the recipient');
        }

        // Validate urgency level matches interest level (Requirements 3.3, 3.4, 3.5)
        const expectedUrgency = input.visitor.interestLevel;
        if (output.urgencyLevel !== expectedUrgency) {
            console.warn(
                `Urgency level (${output.urgencyLevel}) does not match visitor interest level (${expectedUrgency}). ` +
                `This may indicate tone mismatch.`
            );
        }

        // Validate personalized touch points
        if (output.personalizedTouchPoints.length < 2) {
            throw new Error('At least 2 personalized touch points are required. Please try again.');
        }

        // Validate call-to-action is present
        if (!output.callToAction) {
            throw new Error('A clear call-to-action is required. Please try again.');
        }

        // If callToAction is a string, validate length
        if (typeof output.callToAction === 'string' && output.callToAction.length < 10) {
            throw new Error('Call-to-action must be at least 10 characters. Please try again.');
        }

        // If callToAction is an object, validate primary field
        if (typeof output.callToAction === 'object' && (!output.callToAction.primary || output.callToAction.primary.length < 5)) {
            throw new Error('Call-to-action primary field must be at least 5 characters. Please try again.');
        }

        return output;
    }
);

/**
 * Generate personalized follow-up content for an open house visitor
 * 
 * This function creates AI-powered follow-up communications with tone and content
 * matched to the visitor's interest level:
 * - HIGH: Urgent, action-oriented messaging focused on immediate next steps
 * - MEDIUM: Balanced, informative content with gentle encouragement
 * - LOW: Educational, relationship-building content with no pressure
 * 
 * @param input - Visitor, session, property, and agent information
 * @returns Personalized follow-up content including email, SMS, and next steps
 * 
 * @example
 * ```typescript
 * const followUp = await generateOpenHouseFollowUp({
 *   visitor: {
 *     visitorId: 'vis_123',
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     phone: '555-1234',
 *     interestLevel: 'high',
 *     checkInTime: '2024-12-15T14:30:00Z',
 *   },
 *   session: {
 *     sessionId: 'sess_456',
 *     propertyAddress: '123 Main St',
 *     scheduledDate: '2024-12-15',
 *     totalVisitors: 15,
 *     highInterestCount: 3,
 *   },
 *   property: {
 *     address: '123 Main St',
 *     price: '$500,000',
 *     bedrooms: 3,
 *     bathrooms: 2,
 *   },
 *   agent: {
 *     name: 'Sarah Smith',
 *     email: 'sarah@realty.com',
 *     phone: '555-9876',
 *   },
 *   userId: 'user_789',
 * });
 * ```
 */
export async function generateOpenHouseFollowUp(
    input: GenerateOpenHouseFollowUpInput
): Promise<GenerateOpenHouseFollowUpOutput> {
    return generateOpenHouseFollowUpFlow.execute(input);
}
