/**
 * Centralized loading messages for consistent UX across the application
 * Organized by hub to match the product architecture
 */

export const LOADING_MESSAGES = {
  // Hub-level loading messages
  HUBS: {
    DASHBOARD: 'Loading dashboard...',
    ASSISTANT: 'Loading assistant...',
    BRAND: 'Loading brand...',
    STUDIO: 'Loading studio...',
    RESEARCH: 'Loading research...',
    MARKET: 'Loading market intelligence...',
    TOOLS: 'Loading tools...',
    LIBRARY: 'Loading library...',
    CLIENTS: 'Loading clients...',
    OPEN_HOUSE: 'Loading open house...',
    LEARNING: 'Loading learning center...',
    SETTINGS: 'Loading settings...',
    ADMIN: 'Loading admin panel...',
    SUPER_ADMIN: 'Loading super admin panel...',
  },

  // Feature-level loading messages
  FEATURES: {
    // Brand hub features
    BRAND_PROFILE: 'Loading brand profile...',
    BRAND_AUDIT: 'Loading brand audit...',
    COMPETITORS: 'Loading competitor analysis...',
    STRATEGY: 'Loading marketing strategy...',
    CALENDAR: 'Loading calendar...',
    INTEGRATIONS: 'Loading integrations...',
    TESTIMONIALS: 'Loading testimonials...',

    // Studio hub features
    CONTENT_WRITE: 'Loading content writer...',
    CONTENT_DESCRIBE: 'Loading description generator...',
    REIMAGINE: 'Loading image editor...',
    OPEN_HOUSE_MATERIALS: 'Loading open house materials...',
    POST_CARDS: 'Loading postcard designer...',

    // Market hub features
    MARKET_INSIGHTS: 'Loading market insights...',
    MARKET_NEWS: 'Loading market news...',
    MARKET_ANALYTICS: 'Loading analytics...',
    OPPORTUNITIES: 'Loading opportunities...',
    ALERTS: 'Loading alerts...',

    // Tools hub features
    CALCULATOR: 'Loading calculator...',
    ROI_CALCULATOR: 'Loading ROI calculator...',
    VALUATION: 'Loading property valuation...',
    DOCUMENT_SCANNER: 'Loading document scanner...',

    // Library hub features
    CONTENT_LIBRARY: 'Loading content library...',
    REPORTS: 'Loading reports...',
    MEDIA: 'Loading media library...',
    TEMPLATES: 'Loading templates...',

    // Learning hub features
    LESSONS: 'Loading lessons...',
    TUTORIALS: 'Loading tutorials...',
    ROLE_PLAY: 'Loading role-play scenarios...',
    AI_LESSON_PLAN: 'Loading AI lesson plan...',
    BEST_PRACTICES: 'Loading best practices...',
    CERTIFICATION: 'Loading certifications...',
    COMMUNITY: 'Loading community...',
    COURSES: 'Loading courses...',
  },

  // Generic loading messages
  GENERIC: {
    DEFAULT: 'Loading...',
    SAVING: 'Saving...',
    PROCESSING: 'Processing...',
    ANALYZING: 'Analyzing...',
    GENERATING: 'Generating...',
    UPLOADING: 'Uploading...',
    DOWNLOADING: 'Downloading...',
    AUTHENTICATING: 'Authenticating...',
    CONNECTING: 'Connecting...',
  },

  // AI-specific loading messages
  AI: {
    THINKING: 'AI is thinking...',
    ANALYZING: 'AI is analyzing...',
    GENERATING: 'AI is generating content...',
    PROCESSING_IMAGE: 'AI is processing image...',
    RESEARCHING: 'AI is researching...',
    WRITING: 'AI is writing...',
    OPTIMIZING: 'AI is optimizing...',
  },
} as const;

// Type helpers for better TypeScript support
export type HubLoadingMessage = typeof LOADING_MESSAGES.HUBS[keyof typeof LOADING_MESSAGES.HUBS];
export type FeatureLoadingMessage = typeof LOADING_MESSAGES.FEATURES[keyof typeof LOADING_MESSAGES.FEATURES];
export type GenericLoadingMessage = typeof LOADING_MESSAGES.GENERIC[keyof typeof LOADING_MESSAGES.GENERIC];
export type AILoadingMessage = typeof LOADING_MESSAGES.AI[keyof typeof LOADING_MESSAGES.AI];