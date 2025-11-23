/**
 * Social Media Platform Constants
 * Platform-specific character limits, image dimensions, and other constraints
 */

import { Platform } from "./types";

export interface PlatformLimits {
    maxCharacters: number;
    maxImages: number;
    maxHashtags: number;
    imageDimensions: {
        width: number;
        height: number;
        aspectRatio?: string;
    }[];
    maxFileSize: number; // in bytes
}

export const PLATFORM_LIMITS: Record<Platform, PlatformLimits> = {
    facebook: {
        maxCharacters: 2000,
        maxImages: 10,
        maxHashtags: 15,
        imageDimensions: [
            {
                width: 1200,
                height: 630,
                aspectRatio: "1.91:1",
            },
        ],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
    instagram: {
        maxCharacters: 2200,
        maxImages: 10,
        maxHashtags: 30,
        imageDimensions: [
            {
                width: 1080,
                height: 1080,
                aspectRatio: "1:1", // Square
            },
            {
                width: 1080,
                height: 1350,
                aspectRatio: "4:5", // Portrait
            },
        ],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
    linkedin: {
        maxCharacters: 3000,
        maxImages: 9,
        maxHashtags: 15,
        imageDimensions: [
            {
                width: 1200,
                height: 627,
                aspectRatio: "1.91:1",
            },
        ],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
    twitter: {
        maxCharacters: 280,
        maxImages: 4,
        maxHashtags: 10,
        imageDimensions: [
            {
                width: 1200,
                height: 675,
                aspectRatio: "16:9",
            },
        ],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
};

export const GENERAL_HASHTAG_RANGE = {
    min: 5,
    max: 15,
};

export const INSTAGRAM_HASHTAG_MAX = 30;

export const DESCRIPTION_WORD_COUNT = {
    min: 150,
    max: 300,
};

export const MLS_SYNC_INTERVAL_MINUTES = 15;

export const IMPORT_RETRY_ATTEMPTS = 3;

export const IMPORT_BATCH_SIZE = 50;

export const MAX_CONCURRENT_PHOTO_DOWNLOADS = 5;

export const MAX_CONCURRENT_IMAGE_OPTIMIZATIONS = 3;

export const BEDROCK_TIMEOUT_MS = 30000; // 30 seconds

export const SOCIAL_API_TIMEOUT_MS = 15000; // 15 seconds

export const MAX_CONCURRENT_API_REQUESTS = 3;

/**
 * OAuth scopes required for each platform
 * Extended to support content workflow features including scheduling and analytics
 */
export const OAUTH_SCOPES: Record<Platform, string[]> = {
    facebook: [
        // Publishing and scheduling scopes
        "pages_manage_posts",
        "pages_show_list",
        "public_profile",
        // Analytics scopes for content workflow features
        "pages_read_engagement",
        "read_insights",
        "pages_read_user_content",
        // Additional scopes for comprehensive analytics
        "business_management",
    ],
    instagram: [
        // Publishing and scheduling scopes
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        // Analytics scopes for content workflow features
        "pages_read_engagement",
        "instagram_manage_insights",
        "read_insights",
        // Additional scopes for comprehensive analytics
        "business_management",
    ],
    linkedin: [
        // Publishing and scheduling scopes
        "w_member_social",
        "r_basicprofile",
        "w_organization_social",
        // Analytics scopes for content workflow features
        "r_organization_social",
        "r_organization_admin",
        "rw_organization_admin",
        // Additional scopes for comprehensive analytics and metrics
        "r_analytics",
        "r_organization_followers_statistics",
        "r_organization_lookup",
    ],
    twitter: [
        // Publishing and scheduling scopes
        "tweet.read",
        "tweet.write",
        "users.read",
        "offline.access",
        // Analytics scopes for content workflow features
        "tweet.moderate.write",
        "follows.read",
        "follows.write",
        // Additional scopes for comprehensive analytics
        "space.read",
        "mute.read",
        "mute.write",
        "block.read",
        "block.write",
    ],
};

/**
 * Platform API endpoints
 */
export const PLATFORM_API_ENDPOINTS: Record<Platform, string> = {
    facebook: "https://graph.facebook.com/v18.0",
    instagram: "https://graph.facebook.com/v18.0",
    linkedin: "https://api.linkedin.com/v2",
    twitter: "https://api.twitter.com/2",
};

/**
 * Platform-specific analytics API endpoints for content workflow features
 */
export const ANALYTICS_API_ENDPOINTS: Record<Platform, string> = {
    facebook: "https://graph.facebook.com/v18.0",
    instagram: "https://graph.facebook.com/v18.0",
    linkedin: "https://api.linkedin.com/v2",
    twitter: "https://api.twitter.com/2",
};

/**
 * Analytics metrics available for each platform
 */
export const ANALYTICS_METRICS: Record<Platform, string[]> = {
    facebook: [
        "post_impressions",
        "post_impressions_unique",
        "post_engaged_users",
        "post_clicks",
        "post_reactions_like_total",
        "post_reactions_love_total",
        "post_reactions_wow_total",
        "post_reactions_haha_total",
        "post_reactions_sorry_total",
        "post_reactions_anger_total",
        "post_comments",
        "post_shares",
        "post_video_views",
        "post_video_views_unique",
    ],
    instagram: [
        "impressions",
        "reach",
        "engagement",
        "likes",
        "comments",
        "shares",
        "saves",
        "video_views",
        "profile_visits",
        "website_clicks",
    ],
    linkedin: [
        "impressions",
        "clicks",
        "reactions",
        "comments",
        "shares",
        "follows",
        "engagement",
        "videoViews",
        "uniqueImpressions",
        "clickThroughRate",
    ],
    twitter: [
        "impression_count",
        "like_count",
        "reply_count",
        "retweet_count",
        "quote_count",
        "bookmark_count",
        "url_link_clicks",
        "user_profile_clicks",
        "public_metrics",
    ],
};

/**
 * S3 path structure for optimized images
 */
export const S3_IMAGE_PATHS = {
    original: "original",
    facebook: "facebook",
    instagram: "instagram",
    linkedin: "linkedin",
};

/**
 * Hashtag categories for generation
 */
export const HASHTAG_CATEGORIES = {
    location: ["city", "neighborhood", "state", "region"],
    propertyType: ["house", "condo", "townhouse", "land", "commercial"],
    features: ["pool", "garage", "fireplace", "hardwood", "updated"],
    general: ["realestate", "realtor", "forsale", "dreamhome", "property"],
};
