"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoredSocialPostSchema = exports.PerformanceMetricsSchema = exports.PlatformMetricsSchema = exports.OptimizedImageSchema = exports.FormattedContentSchema = exports.PublishResultSchema = exports.SocialPostSchema = exports.OAuthConnectionSchema = exports.PlatformSchema = void 0;
const zod_1 = require("zod");
exports.PlatformSchema = zod_1.z.enum(["facebook", "instagram", "linkedin", "twitter"]);
exports.OAuthConnectionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    userId: zod_1.z.string().min(1),
    platform: exports.PlatformSchema,
    accessToken: zod_1.z.string().min(1),
    refreshToken: zod_1.z.string().min(1),
    expiresAt: zod_1.z.number().positive(),
    scope: zod_1.z.array(zod_1.z.string()),
    platformUserId: zod_1.z.string().min(1),
    platformUsername: zod_1.z.string().min(1),
    metadata: zod_1.z.record(zod_1.z.any()),
    createdAt: zod_1.z.number().positive(),
    updatedAt: zod_1.z.number().positive(),
});
exports.SocialPostSchema = zod_1.z.object({
    listingId: zod_1.z.string().min(1, "Listing ID is required"),
    content: zod_1.z.string().min(1, "Content is required"),
    images: zod_1.z.array(zod_1.z.string().url("Invalid image URL")),
    hashtags: zod_1.z.array(zod_1.z.string()),
    platform: exports.PlatformSchema,
});
exports.PublishResultSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    postId: zod_1.z.string().optional(),
    postUrl: zod_1.z.string().url().optional(),
    error: zod_1.z.string().optional(),
});
exports.FormattedContentSchema = zod_1.z.object({
    text: zod_1.z.string(),
    characterCount: zod_1.z.number().int().min(0),
    truncated: zod_1.z.boolean(),
});
exports.OptimizedImageSchema = zod_1.z.object({
    originalUrl: zod_1.z.string().url(),
    optimizedUrl: zod_1.z.string().url(),
    width: zod_1.z.number().int().positive(),
    height: zod_1.z.number().int().positive(),
    fileSize: zod_1.z.number().positive(),
});
exports.PlatformMetricsSchema = zod_1.z.object({
    views: zod_1.z.number().int().min(0),
    shares: zod_1.z.number().int().min(0),
    inquiries: zod_1.z.number().int().min(0),
    clicks: zod_1.z.number().int().min(0),
    engagement: zod_1.z.number().min(0),
});
exports.PerformanceMetricsSchema = zod_1.z.object({
    listingId: zod_1.z.string().min(1),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    views: zod_1.z.number().int().min(0),
    shares: zod_1.z.number().int().min(0),
    inquiries: zod_1.z.number().int().min(0),
    platforms: zod_1.z.record(exports.PlatformSchema, exports.PlatformMetricsSchema),
    updatedAt: zod_1.z.number().positive(),
});
exports.StoredSocialPostSchema = zod_1.z.object({
    postId: zod_1.z.string().min(1),
    listingId: zod_1.z.string().min(1),
    platform: exports.PlatformSchema,
    platformPostId: zod_1.z.string().min(1),
    platformPostUrl: zod_1.z.string().url(),
    content: zod_1.z.string(),
    images: zod_1.z.array(zod_1.z.string().url()),
    hashtags: zod_1.z.array(zod_1.z.string()),
    status: zod_1.z.enum(["published", "failed", "unpublished"]),
    publishedAt: zod_1.z.number().positive(),
    error: zod_1.z.string().optional(),
    createdAt: zod_1.z.number().positive(),
});
