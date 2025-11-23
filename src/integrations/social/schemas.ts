/**
 * Social Media Integration Zod Schemas
 * Data validation schemas for social media entities
 */

import { z } from "zod";

export const PlatformSchema = z.enum(["facebook", "instagram", "linkedin", "twitter"]);

export const OAuthConnectionSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    platform: PlatformSchema,
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresAt: z.number().positive(),
    scope: z.array(z.string()),
    platformUserId: z.string().min(1),
    platformUsername: z.string().min(1),
    metadata: z.record(z.any()),
    createdAt: z.number().positive(),
    updatedAt: z.number().positive(),
});

export const SocialPostSchema = z.object({
    listingId: z.string().min(1, "Listing ID is required"),
    content: z.string().min(1, "Content is required"),
    images: z.array(z.string().url("Invalid image URL")),
    hashtags: z.array(z.string()),
    platform: PlatformSchema,
});

export const PublishResultSchema = z.object({
    success: z.boolean(),
    postId: z.string().optional(),
    postUrl: z.string().url().optional(),
    error: z.string().optional(),
});

export const FormattedContentSchema = z.object({
    text: z.string(),
    characterCount: z.number().int().min(0),
    truncated: z.boolean(),
});

export const OptimizedImageSchema = z.object({
    originalUrl: z.string().url(),
    optimizedUrl: z.string().url(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fileSize: z.number().positive(),
});

export const PlatformMetricsSchema = z.object({
    views: z.number().int().min(0),
    shares: z.number().int().min(0),
    inquiries: z.number().int().min(0),
    clicks: z.number().int().min(0),
    engagement: z.number().min(0),
});

export const PerformanceMetricsSchema = z.object({
    listingId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    views: z.number().int().min(0),
    shares: z.number().int().min(0),
    inquiries: z.number().int().min(0),
    platforms: z.record(PlatformSchema, PlatformMetricsSchema),
    updatedAt: z.number().positive(),
});

export const StoredSocialPostSchema = z.object({
    postId: z.string().min(1),
    listingId: z.string().min(1),
    platform: PlatformSchema,
    platformPostId: z.string().min(1),
    platformPostUrl: z.string().url(),
    content: z.string(),
    images: z.array(z.string().url()),
    hashtags: z.array(z.string()),
    status: z.enum(["published", "failed", "unpublished"]),
    publishedAt: z.number().positive(),
    error: z.string().optional(),
    createdAt: z.number().positive(),
});

// Type inference from schemas
export type PlatformInput = z.infer<typeof PlatformSchema>;
export type OAuthConnectionInput = z.infer<typeof OAuthConnectionSchema>;
export type SocialPostInput = z.infer<typeof SocialPostSchema>;
export type PublishResultInput = z.infer<typeof PublishResultSchema>;
export type FormattedContentInput = z.infer<typeof FormattedContentSchema>;
export type OptimizedImageInput = z.infer<typeof OptimizedImageSchema>;
export type PlatformMetricsInput = z.infer<typeof PlatformMetricsSchema>;
export type PerformanceMetricsInput = z.infer<typeof PerformanceMetricsSchema>;
export type StoredSocialPostInput = z.infer<typeof StoredSocialPostSchema>;
