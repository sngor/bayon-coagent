"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateListingDescription = generateListingDescription;
const flow_base_1 = require("../flow-base");
const zod_1 = require("zod");
const GenerateListingDescriptionInputSchema = zod_1.z.object({
    propertyDetails: zod_1.z.string().describe('The property details to generate a description from.'),
});
const GenerateListingDescriptionOutputSchema = zod_1.z.object({
    description: zod_1.z.string().describe('The generated listing description.'),
});
const prompt = (0, flow_base_1.definePrompt)({
    name: 'generateListingDescriptionPrompt',
    inputSchema: GenerateListingDescriptionInputSchema,
    outputSchema: GenerateListingDescriptionOutputSchema,
    options: {
        modelId: flow_base_1.BEDROCK_MODELS.HAIKU,
        temperature: 0.7,
        maxTokens: 2048,
    },
    prompt: `You are an expert real estate copywriter specializing in compelling property listings.

Based on the following property details, create an engaging, professional listing description that highlights the property's best features and appeals to potential buyers.

Property Details:
{{{propertyDetails}}}

The description should:
- Start with an attention-grabbing opening
- Highlight key features and amenities
- Use vivid, descriptive language
- Be 2-3 paragraphs long
- End with a call-to-action

Return a JSON response with a "description" field containing the listing description.`,
});
const generateListingDescriptionFlow = (0, flow_base_1.defineFlow)({
    name: 'generateListingDescriptionFlow',
    inputSchema: GenerateListingDescriptionInputSchema,
    outputSchema: GenerateListingDescriptionOutputSchema,
}, async (input) => {
    const output = await prompt(input);
    if (!output?.description) {
        throw new Error("The AI returned an empty description. Please try again.");
    }
    return output;
});
async function generateListingDescription(input) {
    return generateListingDescriptionFlow.execute(input);
}
