/**
 * Voice-to-Content Conversion Flow
 * 
 * This flow converts transcribed voice recordings into structured content
 * suitable for different purposes: blog posts, social media, market updates, or notes.
 */

import { definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    VoiceToContentInputSchema,
    VoiceToContentOutputSchema,
    BlogPostContentSchema,
    SocialMediaContentSchema,
    MarketUpdateContentSchema,
    NotesContentSchema,
    type VoiceToContentInput,
    type VoiceToContentOutput,
    type BlogPostContent,
    type SocialMediaContent,
    type MarketUpdateContent,
    type NotesContent
} from '@/ai/schemas/voice-to-content-schemas';

/**
 * Main voice-to-content conversion flow
 */
export const convertVoiceToContent = definePrompt<VoiceToContentInput, VoiceToContentOutput>({
    name: 'voice-to-content',
    inputSchema: VoiceToContentInputSchema,
    outputSchema: VoiceToContentOutputSchema,

    systemPrompt: `You are an expert content creator specializing in real estate marketing and communication. Your task is to convert voice transcripts into polished, professional content.

Key responsibilities:
- Transform casual speech into well-structured written content
- Maintain the speaker's key ideas and insights
- Adapt tone and style to the specified content type
- Extract actionable information and key points
- Create engaging, valuable content for real estate professionals
- Ensure content is optimized for the intended platform or purpose

Content type guidelines:
- Blog: Professional, informative, SEO-friendly
- Social: Engaging, shareable, platform-appropriate
- Market Update: Data-driven, analytical, authoritative
- Notes: Organized, actionable, clear structure`,

    prompt: `Convert the following voice transcript into {{{contentType}}} content:

Transcript:
{{{transcript}}}

Content Requirements:
- Type: {{{contentType}}}
- Tone: {{{tone}}}
- Length: {{{length}}}
- Target Audience: {{{targetAudience}}}
- Additional Context: {{{context}}}

Please create polished, professional content that:
1. Captures the key ideas from the transcript
2. Is appropriate for the specified content type
3. Maintains the requested tone and length
4. Includes relevant tags and metadata
5. Provides actionable value to real estate professionals

Transform the casual speech patterns into well-structured written content while preserving the original meaning and insights.`,

    options: {
        ...MODEL_CONFIGS.CREATIVE,
        temperature: 0.6, // Balanced creativity for content generation
    }
});

/**
 * Specialized flow for blog post generation
 */
export const convertVoiceToBlogPost = definePrompt<VoiceToContentInput, BlogPostContent>({
    name: 'voice-to-blog-post',
    inputSchema: VoiceToContentInputSchema,
    outputSchema: BlogPostContentSchema,

    systemPrompt: `You are a professional blog writer specializing in real estate content. Convert voice transcripts into well-structured, SEO-optimized blog posts.

Blog post structure:
- Compelling title that captures attention
- Engaging introduction that hooks readers
- Well-organized body with clear sections
- Strong conclusion with call-to-action
- SEO-optimized meta description
- Relevant keywords and categories`,

    prompt: `Create a professional blog post from this voice transcript:

Transcript:
{{{transcript}}}

Requirements:
- Tone: {{{tone}}}
- Length: {{{length}}}
- Target Audience: {{{targetAudience}}}
- Context: {{{context}}}

Structure the content as a complete blog post with:
1. Attention-grabbing title
2. Engaging introduction
3. Well-organized main content
4. Strong conclusion
5. SEO metadata

Focus on providing valuable insights for real estate professionals and their clients.`,

    options: {
        ...MODEL_CONFIGS.LONG_FORM,
        temperature: 0.5,
    }
});

/**
 * Specialized flow for social media content generation
 */
export const convertVoiceToSocialMedia = definePrompt<VoiceToContentInput, SocialMediaContent>({
    name: 'voice-to-social-media',
    inputSchema: VoiceToContentInputSchema,
    outputSchema: SocialMediaContentSchema,

    systemPrompt: `You are a social media expert specializing in real estate marketing. Convert voice transcripts into engaging, platform-optimized social media content.

Platform considerations:
- Facebook: Longer posts, community-focused, storytelling
- Instagram: Visual-first, hashtag-heavy, lifestyle-oriented
- LinkedIn: Professional, industry insights, networking
- Twitter/X: Concise, trending topics, quick insights

Content should be engaging, shareable, and drive audience interaction.`,

    prompt: `Create social media content from this voice transcript:

Transcript:
{{{transcript}}}

Requirements:
- Tone: {{{tone}}}
- Target Audience: {{{targetAudience}}}
- Context: {{{context}}}

Create platform-specific variations that:
1. Capture the key message from the transcript
2. Are optimized for each platform's audience and format
3. Include relevant hashtags and engagement elements
4. Encourage interaction and sharing
5. Maintain professional credibility

Focus on creating content that real estate professionals can use to build their online presence.`,

    options: {
        ...MODEL_CONFIGS.CREATIVE,
        temperature: 0.7,
    }
});

/**
 * Specialized flow for market update generation
 */
export const convertVoiceToMarketUpdate = definePrompt<VoiceToContentInput, MarketUpdateContent>({
    name: 'voice-to-market-update',
    inputSchema: VoiceToContentInputSchema,
    outputSchema: MarketUpdateContentSchema,

    systemPrompt: `You are a real estate market analyst. Convert voice transcripts into professional market updates and reports.

Market update characteristics:
- Data-driven and factual
- Clear metrics and trends
- Professional analysis
- Actionable insights for buyers/sellers
- Credible and authoritative tone`,

    prompt: `Create a market update from this voice transcript:

Transcript:
{{{transcript}}}

Requirements:
- Tone: {{{tone}}}
- Target Audience: {{{targetAudience}}}
- Context: {{{context}}}

Structure as a professional market update with:
1. Clear headline summarizing the key market insight
2. Executive summary of main points
3. Key metrics and data points mentioned
4. Professional analysis and insights
5. Implications for buyers and sellers
6. Data sources if mentioned

Focus on creating credible, actionable market intelligence.`,

    options: {
        ...MODEL_CONFIGS.ANALYTICAL,
        temperature: 0.3,
    }
});

/**
 * Specialized flow for notes organization
 */
export const convertVoiceToNotes = definePrompt<VoiceToContentInput, NotesContent>({
    name: 'voice-to-notes',
    inputSchema: VoiceToContentInputSchema,
    outputSchema: NotesContentSchema,

    systemPrompt: `You are an executive assistant specializing in organizing and structuring information. Convert voice transcripts into well-organized, actionable notes.

Notes characteristics:
- Clear organization and structure
- Actionable items highlighted
- Important dates and contacts extracted
- Easy to scan and reference
- Professional formatting`,

    prompt: `Organize this voice transcript into structured notes:

Transcript:
{{{transcript}}}

Requirements:
- Context: {{{context}}}
- User: {{{userId}}}

Create organized notes with:
1. Clear title and sections
2. Key information organized logically
3. Action items clearly identified
4. Follow-up tasks highlighted
5. Important contacts and dates extracted
6. Easy-to-reference format

Focus on making the information actionable and easy to use for follow-up activities.`,

    options: {
        ...MODEL_CONFIGS.BALANCED,
        temperature: 0.4,
    }
});

/**
 * Helper function to estimate reading time
 */
export function estimateReadingTime(wordCount: number): number {
    // Average reading speed is 200-250 words per minute
    // Using 225 as a middle ground
    return Math.ceil(wordCount / 225);
}

/**
 * Helper function to extract key points from transcript
 */
export function extractKeyPoints(transcript: string): string[] {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Look for sentences with key indicators
    const keyIndicators = [
        'important', 'key', 'main', 'significant', 'crucial', 'essential',
        'remember', 'note', 'highlight', 'focus', 'priority', 'critical'
    ];

    const keyPoints = sentences.filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        return keyIndicators.some(indicator => lowerSentence.includes(indicator));
    });

    // If no key indicators found, take the first few substantial sentences
    if (keyPoints.length === 0) {
        return sentences.slice(0, 3).map(s => s.trim());
    }

    return keyPoints.slice(0, 5).map(s => s.trim());
}

/**
 * Helper function to generate relevant tags
 */
export function generateContentTags(transcript: string, contentType: string): string[] {
    const tags: string[] = [];

    // Base tags by content type
    const baseTagsByType = {
        blog: ['real estate', 'property', 'market insights'],
        social: ['realestate', 'property', 'homebuying'],
        'market-update': ['market analysis', 'real estate trends', 'property market'],
        notes: ['meeting notes', 'action items', 'follow-up']
    };

    tags.push(...(baseTagsByType[contentType as keyof typeof baseTagsByType] || []));

    // Extract topic-specific tags from transcript
    const topicKeywords = [
        'listing', 'buyer', 'seller', 'mortgage', 'investment',
        'neighborhood', 'pricing', 'market', 'property', 'home',
        'commercial', 'residential', 'luxury', 'first-time'
    ];

    const lowerTranscript = transcript.toLowerCase();
    topicKeywords.forEach(keyword => {
        if (lowerTranscript.includes(keyword)) {
            tags.push(keyword);
        }
    });

    return [...new Set(tags)].slice(0, 8); // Remove duplicates and limit
}