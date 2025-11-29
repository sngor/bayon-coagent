/**
 * GA4 Integration Constants
 */

/**
 * GA4 API Endpoints
 */
export const GA4_ENDPOINTS = {
    measurement: 'https://www.google-analytics.com/mp/collect',
    measurementDebug: 'https://www.google-analytics.com/debug/mp/collect',
    dataAPI: 'https://analyticsdata.googleapis.com/v1beta'
} as const;

/**
 * GA4 Standard Event Names (from Google Analytics)
 */
export const GA4_STANDARD_EVENTS = {
    // Engagement
    PAGE_VIEW: 'page_view',
    USER_ENGAGEMENT: 'user_engagement',

    // Authentication
    LOGIN: 'login',
    SIGN_UP: 'sign_up',

    // Lead Generation
    GENERATE_LEAD: 'generate_lead',

    // Content
    VIEW_ITEM: 'view_item',
    SELECT_CONTENT: 'select_content',
    SHARE: 'share',
    SEARCH: 'search',

    // E-commerce (not directly used but good to know)
    ADD_TO_CART: 'add_to_cart',
    PURCHASE: 'purchase'
} as const;

/**
 * Custom Event Names for Real Estate CRM
 */
export const GA4_CUSTOM_EVENTS = {
    CLIENT_CREATED: 'client_created',
    CLIENT_UPDATED: 'client_updated',
    PROPERTY_LISTED: 'property_listed',
    PROPERTY_VIEWED: 'property_viewed',
    LEAD_CAPTURED: 'lead_captured',
    LEAD_QUALIFIED: 'lead_qualified',
    CONTENT_GENERATED: 'content_generated',
    SOCIAL_POST_PUBLISHED: 'social_post_published',
    INTEGRATION_CONNECTED: 'integration_connected',
    INTEGRATION_DISCONNECTED: 'integration_disconnected',
    ZAP_TRIGGERED: 'zap_triggered',
    DESIGN_EXPORTED: 'design_exported',
    FEEDBACK_SUBMITTED: 'feedback_submitted',
    OPEN_HOUSE_SCHEDULED: 'openhouse_scheduled',
    DEAL_CLOSED: 'deal_closed'
} as const;

/**
 * GA4 Standard Dimensions
 */
export const GA4_DIMENSIONS = {
    // User
    USER_ID: 'userId',
    SESSION_ID: 'sessionId',

    // Geography
    COUNTRY: 'country',
    CITY: 'city',
    REGION: 'region',

    // Technology
    PLATFORM: 'platform',
    DEVICE_CATEGORY: 'deviceCategory',
    BROWSER: 'browser',

    // Traffic Source
    SOURCE: 'sessionSource',
    MEDIUM: 'sessionMedium',
    CAMPAIGN: 'sessionCampaignName',

    // Content
    PAGE_PATH: 'pagePath',
    PAGE_TITLE: 'pageTitle',

    // Events
    EVENT_NAME: 'eventName',
    EVENT_CATEGORY: 'customEvent:category'
} as const;

/**
 * GA4 Standard Metrics
 */
export const GA4_METRICS = {
    // Users
    ACTIVE_USERS: 'activeUsers',
    NEW_USERS: 'newUsers',
    TOTAL_USERS: 'totalUsers',

    // Engagement
    ENGAGEMENT_RATE: 'engagementRate',
    ENGAGED_SESSIONS: 'engagedSessions',
    AVERAGE_ENGAGEMENT_TIME: 'averageSessionDuration',

    // Events
    EVENT_COUNT: 'eventCount',
    EVENTS_PER_SESSION: 'eventsPerSession',

    // Sessions
    SESSIONS: 'sessions',
    SESSIONS_PER_USER: 'sessionsPerUser',

    // Conversions
    CONVERSIONS: 'conversions',
    CONVERSION_RATE: 'sessionConversionRate'
} as const;

/**
 * Request Configuration
 */
export const GA4_CONFIG = {
    maxEventsPerRequest: 25,
    requestTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
} as const;
