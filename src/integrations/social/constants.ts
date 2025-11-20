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
 */
export const OAUTH_SCOPES: Record<Platform, string[]> = {
    facebook: [
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list",
        "public_profile",
    ],
    instagram: [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
    ],
    linkedin: [
        "w_member_social",
        "r_basicprofile",
        "r_organization_social",
        "w_organization_social",
    ],
};

/**
 * Platform API endpoints
 */
export const PLATFORM_API_ENDPOINTS: Record<Platform, string> = {
    facebook: "https://graph.facebook.com/v18.0",
    instagram: "https://graph.facebook.com/v18.0",
    linkedin: "https://api.linkedin.com/v2",
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
