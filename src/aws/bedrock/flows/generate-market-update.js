"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarketUpdate = generateMarketUpdate;
const flow_base_1 = require("../flow-base");
const market_update_schemas_1 = require("@/ai/schemas/market-update-schemas");
const prompt = (0, flow_base_1.definePrompt)({
    name: 'generateMarketUpdatePrompt',
    inputSchema: market_update_schemas_1.GenerateMarketUpdateInputSchema,
    outputSchema: market_update_schemas_1.GenerateMarketUpdateOutputSchema,
    options: flow_base_1.MODEL_CONFIGS.BALANCED,
    prompt: `You are an expert real estate analyst and copywriter. Your sole purpose is to create content about the real estate market.

Write a market update for the given location and time period, specifically targeting the provided audience.
The tone should be informative, insightful, and encouraging. Use clear, accessible language.
Format the output as a single Markdown string.

If the request is not about real estate, you must politely decline and state that you can only generate real estate market updates.

- Location: {{{location}}}
- Time Period: {{{timePeriod}}}
- Target Audience: {{{audience}}}

Structure the update as follows:
1.  Start with a general overview of the current market trends (use a heading).
2.  Provide specific insights and data relevant to the target audience in a few paragraphs.
3.  Conclude with actionable advice or a positive outlook in a final paragraph.

Return a JSON response with a "marketUpdate" field containing the complete market update text.`,
});
const generateMarketUpdateFlow = (0, flow_base_1.defineFlow)({
    name: 'generateMarketUpdateFlow',
    inputSchema: market_update_schemas_1.GenerateMarketUpdateInputSchema,
    outputSchema: market_update_schemas_1.GenerateMarketUpdateOutputSchema,
}, async (input) => {
    const output = await prompt(input);
    if (!output?.marketUpdate) {
        throw new Error("The AI returned an empty market update. Please try again.");
    }
    return output;
});
async function generateMarketUpdate(input) {
    return generateMarketUpdateFlow.execute(input);
}
