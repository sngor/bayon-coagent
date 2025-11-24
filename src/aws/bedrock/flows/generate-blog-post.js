"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBlogPost = generateBlogPost;
const flow_base_1 = require("../flow-base");
const blog_post_schemas_1 = require("@/ai/schemas/blog-post-schemas");
const textPrompt = (0, flow_base_1.definePrompt)({
    name: 'generateBlogPostTextPrompt',
    inputSchema: blog_post_schemas_1.GenerateBlogPostInputSchema,
    outputSchema: blog_post_schemas_1.GenerateBlogPostOutputSchema,
    options: flow_base_1.MODEL_CONFIGS.LONG_FORM,
    prompt: `You are an expert real estate content writer and SEO specialist. Your goal is to produce a well-structured, engaging, and SEO-friendly blog post.

**Topic:** {{{topic}}}

**IMPORTANT**: Your response MUST be about real estate. If the topic is not related to real estate, you must politely decline and explain that you can only write about real estate topics.

**Instructions:**
1.  **Title:** Start with a catchy, relevant title for the blog post.
2.  **Introduction:** Write a brief introduction that hooks the reader and states the purpose of the post.
3.  **Body:**
    -   Create at least 3-4 main sections with clear, descriptive subheadings (using '##' in Markdown).
    -   Within each section, use paragraphs, bullet points, or numbered lists to present information clearly.
    -   Use bold text to highlight key terms or takeaways.
    -   The tone should be professional, informative, and conversational.
4.  **Conclusion:** End with a summary of the key points.
5.  **Call to Action:** Include a concluding sentence that encourages readers to get in touch for more information.
6.  **Formatting:** The entire output must be a single Markdown string.

Return a JSON response with:
- "blogPost": The complete blog post in Markdown format
- "headerImage": A placeholder URL (use "https://via.placeholder.com/1200x630/4A90E2/FFFFFF?text=Real+Estate+Blog")

Generate the blog post now.`,
});
const generateBlogPostFlow = (0, flow_base_1.defineFlow)({
    name: 'generateBlogPostFlow',
    inputSchema: blog_post_schemas_1.GenerateBlogPostInputSchema,
    outputSchema: blog_post_schemas_1.GenerateBlogPostOutputSchema,
}, async (input) => {
    const output = await textPrompt(input);
    if (!output?.blogPost) {
        throw new Error("The AI returned an empty blog post. Please try again.");
    }
    if (!output.headerImage) {
        output.headerImage = "https://via.placeholder.com/1200x630/4A90E2/FFFFFF?text=Real+Estate+Blog";
    }
    return output;
});
async function generateBlogPost(input) {
    return generateBlogPostFlow.execute(input);
}
