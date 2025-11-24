"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HASHTAG_CATEGORIES = exports.S3_IMAGE_PATHS = exports.ANALYTICS_METRICS = exports.ANALYTICS_API_ENDPOINTS = exports.PLATFORM_API_ENDPOINTS = exports.OAUTH_SCOPES = exports.MAX_CONCURRENT_API_REQUESTS = exports.SOCIAL_API_TIMEOUT_MS = exports.BEDROCK_TIMEOUT_MS = exports.MAX_CONCURRENT_IMAGE_OPTIMIZATIONS = exports.MAX_CONCURRENT_PHOTO_DOWNLOADS = exports.IMPORT_BATCH_SIZE = exports.IMPORT_RETRY_ATTEMPTS = exports.MLS_SYNC_INTERVAL_MINUTES = exports.DESCRIPTION_WORD_COUNT = exports.INSTAGRAM_HASHTAG_MAX = exports.GENERAL_HASHTAG_RANGE = exports.PLATFORM_LIMITS = void 0;
exports.PLATFORM_LIMITS = {
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
        maxFileSize: 5 * 1024 * 1024,
    },
    instagram: {
        maxCharacters: 2200,
        maxImages: 10,
        maxHashtags: 30,
        imageDimensions: [
            {
                width: 1080,
                height: 1080,
                aspectRatio: "1:1",
            },
            {
                width: 1080,
                height: 1350,
                aspectRatio: "4:5",
            },
        ],
        maxFileSize: 5 * 1024 * 1024,
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
        maxFileSize: 5 * 1024 * 1024,
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
        maxFileSize: 5 * 1024 * 1024,
    },
};
exports.GENERAL_HASHTAG_RANGE = {
    min: 5,
    max: 15,
};
exports.INSTAGRAM_HASHTAG_MAX = 30;
exports.DESCRIPTION_WORD_COUNT = {
    min: 150,
    max: 300,
};
exports.MLS_SYNC_INTERVAL_MINUTES = 15;
exports.IMPORT_RETRY_ATTEMPTS = 3;
exports.IMPORT_BATCH_SIZE = 50;
exports.MAX_CONCURRENT_PHOTO_DOWNLOADS = 5;
exports.MAX_CONCURRENT_IMAGE_OPTIMIZATIONS = 3;
exports.BEDROCK_TIMEOUT_MS = 30000;
exports.SOCIAL_API_TIMEOUT_MS = 15000;
exports.MAX_CONCURRENT_API_REQUESTS = 3;
exports.OAUTH_SCOPES = {
    facebook: [
        "pages_manage_posts",
        "pages_show_list",
        "public_profile",
        "pages_read_engagement",
        "read_insights",
        "pages_read_user_content",
        "business_management",
    ],
    instagram: [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
        "instagram_manage_insights",
        "read_insights",
        "business_management",
    ],
    linkedin: [
        "w_member_social",
        "r_basicprofile",
        "w_organization_social",
        "r_organization_social",
        "r_organization_admin",
        "rw_organization_admin",
        "r_analytics",
        "r_organization_followers_statistics",
        "r_organization_lookup",
    ],
    twitter: [
        "tweet.read",
        "tweet.write",
        "users.read",
        "offline.access",
        "tweet.moderate.write",
        "follows.read",
        "follows.write",
        "space.read",
        "mute.read",
        "mute.write",
        "block.read",
        "block.write",
    ],
};
exports.PLATFORM_API_ENDPOINTS = {
    facebook: "https://graph.facebook.com/v18.0",
    instagram: "https://graph.facebook.com/v18.0",
    linkedin: "https://api.linkedin.com/v2",
    twitter: "https://api.twitter.com/2",
};
exports.ANALYTICS_API_ENDPOINTS = {
    facebook: "https://graph.facebook.com/v18.0",
    instagram: "https://graph.facebook.com/v18.0",
    linkedin: "https://api.linkedin.com/v2",
    twitter: "https://api.twitter.com/2",
};
exports.ANALYTICS_METRICS = {
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
exports.S3_IMAGE_PATHS = {
    original: "original",
    facebook: "facebook",
    instagram: "instagram",
    linkedin: "linkedin",
};
exports.HASHTAG_CATEGORIES = {
    location: ["city", "neighborhood", "state", "region"],
    propertyType: ["house", "condo", "townhouse", "land", "commercial"],
    features: ["pool", "garage", "fireplace", "hardwood", "updated"],
    general: ["realestate", "realtor", "forsale", "dreamhome", "property"],
};
