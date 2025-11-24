"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSocialMediaPost = generateSocialMediaPost;
const flow_base_1 = require("../flow-base");
const social_media_post_schemas_1 = require("@/ai/schemas/social-media-post-schemas");
const prompt = (0, flow_base_1.definePrompt)({
    name: 'generateSocialMediaPostPrompt',
    inputSchema: social_media_post_schemas_1.GenerateSocialMediaPostInputSchema,
    outputSchema: social_media_post_schemas_1.GenerateSocialMediaPostOutputSchema,
    options: {
        modelId: flow_base_1.BEDROCK_MODELS.HAIKU,
        temperature: 0.7,
        maxTokens: 2048,
    },
    prompt: `You are a social media marketing expert for real estate agents.

Generate social media posts for the following real estate topic. The tone should be {{{tone}}}.

Topic: {{{topic}}}

Create posts for these platforms:
- LinkedIn: Professional post with relevant hashtags
- Twitter/X: Short, punchy post UNDER 280 characters with hashtags
- Facebook: Friendly, engaging post that encourages comments
- Google Business Profile: Local-focused post that highlights community value and encourages engagement (max 1500 characters)

IMPORTANT: Return ONLY valid JSON with no additional text. The JSON must have exactly these four fields:
{
  "linkedin": "your linkedin post here",
  "twitter": "your twitter post here (max 280 chars)",
  "facebook": "your facebook post here",
  "googleBusiness": "your google business profile post here"
}`,
});
const generateSocialMediaPostFlow = (0, flow_base_1.defineFlow)({
    name: 'generateSocialMediaPostFlow',
    inputSchema: social_media_post_schemas_1.GenerateSocialMediaPostInputSchema,
    outputSchema: social_media_post_schemas_1.GenerateSocialMediaPostOutputSchema,
}, async (input) => {
    const output = await prompt(input);
    if (!output?.linkedin || !output?.twitter || !output?.facebook || !output?.googleBusiness) {
        throw new Error("The AI failed to generate posts for all platforms. Please try again.");
    }
    return output;
});
async function generateSocialMediaPost(input) {
    return generateSocialMediaPostFlow.execute(input);
}
