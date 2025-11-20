/**
 * Social Media Integration Types
 * Core TypeScript interfaces for social media data structures
 */

export type Platform = "facebook" | "instagram" | "linkedin";

export interface OAuthConnection {
    id: string;
    userId: string;
    platform: Platform;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scope: string[];
    platformUserId: string;
    platformUsername: string;
    metadata: Record<string, any>; // Platform-specific data (e.g., Facebook page ID)
    createdAt: number;
    updatedAt: number;
}

export interface SocialPost {
    listingId: string;
    content: string;
    images: string[]; // S3 URLs
    hashtags: string[];
    platform: Platform;
}

export interface PublishResult {
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
}

export interface FormattedContent {
    text: string;
    characterCount: number;
    truncated: boolean;
}

export interface OptimizedImage {
    originalUrl: string;
    optimizedUrl: string;
    width: number;
    height: number;
    fileSize: number;
}

export interface PlatformMetrics {
    views: number;
    shares: number;
    inquiries: number;
    clicks: number;
    engagement: number;
}

export interface PerformanceMetrics {
    listingId: string;
    date: string; // YYYY-MM-DD
    views: number;
    shares: number;
    inquiries: number;
    platforms: Record<Platform, PlatformMetrics>;
    updatedAt: number;
}

export interface StoredSocialPost {
    postId: string;
    listingId: string;
    platform: Platform;
    platformPostId: string;
    platformPostUrl: string;
    content: string;
    images: string[];
    hashtags: string[];
    status: "published" | "failed" | "unpublished";
    publishedAt: number;
    error?: string;
    createdAt: number;
}
