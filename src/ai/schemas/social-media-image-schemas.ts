import { z } from 'zod';

/**
 * Aspect ratios for different social media platforms
 */
export const SocialMediaAspectRatio = {
    SQUARE: '1:1',           // Instagram posts, Facebook posts
    PORTRAIT: '4:5',         // Instagram portrait
    STORY: '9:16',           // Instagram/Facebook Stories, TikTok
    LANDSCAPE: '16:9',       // YouTube thumbnails, LinkedIn
    TWITTER: '2:1',          // Twitter/X header
    PINTEREST: '2:3',        // Pinterest pins
} as const;

export type SocialMediaAspectRatioType = typeof SocialMediaAspectRatio[keyof typeof SocialMediaAspectRatio];

/**
 * Platform-specific aspect ratio recommendations
 */
export const PLATFORM_ASPECT_RATIOS: Record<string, SocialMediaAspectRatioType> = {
    instagram: SocialMediaAspectRatio.SQUARE,
    facebook: SocialMediaAspectRatio.SQUARE,
    twitter: SocialMediaAspectRatio.LANDSCAPE,
    linkedin: SocialMediaAspectRatio.LANDSCAPE,
    googleBusiness: SocialMediaAspectRatio.LANDSCAPE,
    story: SocialMediaAspectRatio.STORY,
    pinterest: SocialMediaAspectRatio.PINTEREST,
};

/**
 * Schema for generating social media images
 */
export const GenerateSocialMediaImageInputSchema = z.object({
    topic: z.string().describe('The topic/content for the social media image'),
    platform: z.string().optional().describe('Target platform (instagram, facebook, twitter, linkedin, etc.)'),
    aspectRatio: z.string().describe('Aspect ratio for the image (1:1, 4:5, 9:16, 16:9, 2:1, 2:3)'),
    style: z.enum(['professional', 'modern', 'luxury', 'minimalist', 'vibrant', 'elegant']).default('professional').describe('Visual style of the image'),
    includeText: z.boolean().default(false).describe('Whether to include text overlay on the image'),
    customPrompt: z.string().optional().describe('Additional custom instructions for image generation'),
    numberOfImages: z.number().min(1).max(4).default(3).describe('Number of image variations to generate'),
});

export const GenerateSocialMediaImageOutputSchema = z.object({
    images: z.array(z.object({
        imageUrl: z.string().describe('URL or base64 data of the generated image'),
        prompt: z.string().describe('The actual prompt used to generate this image'),
        seed: z.number().describe('The seed used for this generation'),
    })).describe('Array of generated image variations'),
    aspectRatio: z.string().describe('The aspect ratio used'),
});

export type GenerateSocialMediaImageInput = z.infer<typeof GenerateSocialMediaImageInputSchema>;
export type GenerateSocialMediaImageOutput = z.infer<typeof GenerateSocialMediaImageOutputSchema>;

/**
 * Helper function to get recommended aspect ratio for a platform
 */
export function getRecommendedAspectRatio(platform?: string): SocialMediaAspectRatioType {
    if (!platform) return SocialMediaAspectRatio.SQUARE;
    return PLATFORM_ASPECT_RATIOS[platform.toLowerCase()] || SocialMediaAspectRatio.SQUARE;
}

/**
 * Helper function to get dimensions from aspect ratio
 */
export function getDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } {
    const dimensions: Record<string, { width: number; height: number }> = {
        '1:1': { width: 1024, height: 1024 },    // Square
        '4:5': { width: 1024, height: 1280 },    // Portrait
        '9:16': { width: 720, height: 1280 },    // Story
        '16:9': { width: 1280, height: 720 },    // Landscape
        '2:1': { width: 1200, height: 600 },     // Twitter header
        '2:3': { width: 1000, height: 1500 },    // Pinterest
    };

    return dimensions[aspectRatio] || dimensions['1:1'];
}
