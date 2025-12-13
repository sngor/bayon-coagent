'use server';

/**
 * @fileOverview Bedrock flow for generating FutureCast market forecasts.
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { getGuardrailsService, DEFAULT_GUARDRAILS_CONFIG } from '../guardrails';
// import {
//     GenerateFutureCastInputSchema,
//     GenerateFutureCastOutputSchema,
//     type GenerateFutureCastInput,
//     type GenerateFutureCastOutput,
// } from '@/ai/schemas/market-update-schemas';

// Temporary placeholder types
const GenerateFutureCastInputSchema = { parse: (data: any) => data };
const GenerateFutureCastOutputSchema = { parse: (data: any) => data };
type GenerateFutureCastInput = any;
type GenerateFutureCastOutput = any;



const prompt = definePrompt({
    name: 'generateFutureCastPrompt',
    inputSchema: GenerateFutureCastInputSchema,
    outputSchema: GenerateFutureCastOutputSchema,
    options: MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate market analyst with a specialty in predictive analytics.
Your goal is to generate a "FutureCast" - a predictive market forecast for a specific location.

Analyze the provided location and generate a forecast for the specified time period (defaulting to the next 6 months if not specified).
Use your knowledge of seasonal trends, historical market cycles, and general economic indicators to make educated predictions.

Location: {{{location}}}
Time Period: {{{timePeriod}}}
Property Type: {{{propertyType}}}

Historical Market Data (if available):
{{{marketData}}}

Output Requirements:
1.  **Forecasts**: Generate a series of monthly data points representing the predicted median price.
    *   Include at least 6 data points (one for each of the next 6 months).
    *   For each point, provide a 'date' (YYYY-MM format), 'price' (estimated median price), 'trend' (up, down, stable), and 'confidence' (0-100).
    *   Base these predictions on the provided historical data and your knowledge of market cycles.
2.  **Summary**: Write a concise summary of the forecast (2-3 sentences). Explain the key drivers of the predicted trend (e.g., "Due to low inventory and seasonal spring demand...").
3.  **Actionable Advice**: Provide specific advice for buyers or sellers based on this forecast. (e.g., "Prices are expected to peak in 4 weeks. Now is the best time to list.")

If the location is invalid or you cannot generate a forecast, please return a polite error message in the summary.

Return a JSON object matching the schema.`,
});

const generateFutureCastFlow = defineFlow(
    {
        name: 'generateFutureCastFlow',
        inputSchema: GenerateFutureCastInputSchema,
        outputSchema: GenerateFutureCastOutputSchema,
    },
    async (input) => {
        // 1. Validate input with Guardrails
        const guardrails = getGuardrailsService();
        const validationResult = guardrails.validateRequest(input.location, DEFAULT_GUARDRAILS_CONFIG);

        if (!validationResult.allowed) {
            throw new Error(`Guardrails validation failed: ${validationResult.reason}`);
        }

        // Use sanitized prompt if PII was detected
        const location = validationResult.sanitizedPrompt || input.location;

        const output = await prompt({ ...input, location });
        if (!output) {
            throw new Error("The AI returned an empty response. Please try again.");
        }
        return output;
    }
);

export async function generateFutureCast(
    input: GenerateFutureCastInput
): Promise<GenerateFutureCastOutput> {
    return generateFutureCastFlow.execute(input);
}
