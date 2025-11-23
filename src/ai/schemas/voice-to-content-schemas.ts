import { z } from 'zod';

/**
 * Schema for voice-to-content conversion input
 */
export const VoiceToContentInputSchema = z.object({
    transcript: z.string().min(1).describe('Transcribed text from voice recording'),
    contentType: z.enum(['blog', 'social', 'market-update', 'notes']).describe('Type of content to generate'),
    userId: z.string().describe('User ID for personalization'),
    context: z.string().optional().describe('Additional context about the content'),
    targetAudience: z.string().optional().describe('Target audience for the content'),
    tone: z.enum(['professional', 'casual', 'friendly', 'authoritative']).default('professional').describe('Tone of the generated content'),
    length: z.enum(['short', 'medium', 'long']).default('medium').describe('Desired length of the content'),
});

/**
 * Schema for voice-to-content conversion output
 */
export const VoiceToContentOutputSchema = z.object({
    title: z.string().describe('Generated title for the content'),
    content: z.string().describe('Generated content based on the transcript'),
    contentType: z.enum(['blog', 'social', 'market-update', 'notes']).describe('Type of content generated'),
    summary: z.string().describe('Brief summary of the generated content'),
    keyPoints: z.array(z.string()).describe('Key points extracted from the transcript'),
    tags: z.array(z.string()).describe('Relevant tags for the content'),
    wordCount: z.number().nonnegative().describe('Word count of the generated content'),
    estimatedReadTime: z.number().nonnegative().describe('Estimated reading time in minutes'),
    callToAction: z.string().optional().describe('Suggested call-to-action for the content'),
    socialMediaSnippet: z.string().optional().describe('Short snippet suitable for social media sharing'),
});

/**
 * Schema for blog post specific output
 */
export const BlogPostContentSchema = z.object({
    title: z.string().describe('Blog post title'),
    introduction: z.string().describe('Blog post introduction'),
    body: z.string().describe('Main blog post content'),
    conclusion: z.string().describe('Blog post conclusion'),
    metaDescription: z.string().describe('SEO meta description'),
    keywords: z.array(z.string()).describe('SEO keywords'),
    categories: z.array(z.string()).describe('Blog post categories'),
});

/**
 * Schema for social media post specific output
 */
export const SocialMediaContentSchema = z.object({
    platforms: z.object({
        facebook: z.string().describe('Facebook-optimized post'),
        instagram: z.string().describe('Instagram-optimized post'),
        linkedin: z.string().describe('LinkedIn-optimized post'),
        twitter: z.string().describe('Twitter/X-optimized post'),
    }).describe('Platform-specific content variations'),
    hashtags: z.array(z.string()).describe('Relevant hashtags'),
    mentions: z.array(z.string()).optional().describe('Suggested mentions'),
    imagePrompt: z.string().optional().describe('Suggested image or visual content'),
});

/**
 * Schema for market update specific output
 */
export const MarketUpdateContentSchema = z.object({
    headline: z.string().describe('Market update headline'),
    summary: z.string().describe('Executive summary'),
    keyMetrics: z.array(z.object({
        metric: z.string(),
        value: z.string(),
        change: z.string().optional(),
    })).describe('Key market metrics mentioned'),
    insights: z.array(z.string()).describe('Market insights and analysis'),
    implications: z.string().describe('What this means for buyers/sellers'),
    sources: z.array(z.string()).optional().describe('Data sources mentioned'),
});

/**
 * Schema for notes specific output
 */
export const NotesContentSchema = z.object({
    title: z.string().describe('Notes title'),
    sections: z.array(z.object({
        heading: z.string(),
        content: z.string(),
    })).describe('Organized note sections'),
    actionItems: z.array(z.string()).describe('Action items extracted from notes'),
    followUps: z.array(z.string()).describe('Follow-up tasks or reminders'),
    contacts: z.array(z.object({
        name: z.string(),
        role: z.string().optional(),
        contact: z.string().optional(),
    })).optional().describe('Contacts mentioned in the notes'),
    dates: z.array(z.object({
        date: z.string(),
        event: z.string(),
    })).optional().describe('Important dates mentioned'),
});

export type VoiceToContentInput = z.infer<typeof VoiceToContentInputSchema>;
export type VoiceToContentOutput = z.infer<typeof VoiceToContentOutputSchema>;
export type BlogPostContent = z.infer<typeof BlogPostContentSchema>;
export type SocialMediaContent = z.infer<typeof SocialMediaContentSchema>;
export type MarketUpdateContent = z.infer<typeof MarketUpdateContentSchema>;
export type NotesContent = z.infer<typeof NotesContentSchema>;