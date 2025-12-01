import { z } from 'zod';

/**
 * Available social media platforms
 */
export const SocialMediaPlatform = {
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  FACEBOOK: 'facebook',
  GOOGLE_BUSINESS: 'googleBusiness',
  INSTAGRAM: 'instagram',
} as const;

export type SocialMediaPlatformType = typeof SocialMediaPlatform[keyof typeof SocialMediaPlatform];

/**
 * Platform display names
 */
export const PLATFORM_NAMES: Record<SocialMediaPlatformType, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
  facebook: 'Facebook',
  googleBusiness: 'Google Business Profile',
  instagram: 'Instagram',
};

/**
 * Schema for generating social media posts
 */
export const GenerateSocialMediaPostInputSchema = z.object({
  topic: z.string().describe('The topic for the social media posts'),
  tone: z.string().describe('The tone of the posts (e.g., professional, casual, enthusiastic)'),
  platforms: z.array(z.string()).min(1, 'Select at least one platform').default(['linkedin', 'twitter', 'facebook', 'googleBusiness']).describe('Platforms to generate content for'),
  numberOfVariations: z.number().min(1).max(3).default(1).describe('Number of content variations to generate per platform'),
});

export const GenerateSocialMediaPostOutputSchema = z.object({
  variations: z.array(z.object({
    linkedin: z.string().optional().describe('The LinkedIn post content'),
    twitter: z.string().max(280).optional().describe('The Twitter/X post content (max 280 characters)'),
    facebook: z.string().optional().describe('The Facebook post content'),
    googleBusiness: z.string().optional().describe('The Google Business Profile post content'),
    instagram: z.string().optional().describe('The Instagram post content'),
  })).describe('Array of content variations'),
});

export type GenerateSocialMediaPostInput = z.infer<typeof GenerateSocialMediaPostInputSchema>;
export type GenerateSocialMediaPostOutput = z.infer<typeof GenerateSocialMediaPostOutputSchema>;
