/**
 * Training Hub Constants
 * Shared constants across training components
 */

// Category definitions
export const TRAINING_CATEGORIES = {
    COURSES: [
        { value: 'all', label: 'All Categories' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'lead-generation', label: 'Lead Generation' },
        { value: 'social-media', label: 'Social Media' },
        { value: 'technology', label: 'Technology' },
        { value: 'business', label: 'Business Development' },
    ],
    TUTORIALS: [
        { value: 'all', label: 'All Tutorials' },
        { value: 'getting-started', label: 'Getting Started' },
        { value: 'content-creation', label: 'Content Creation' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'analytics', label: 'Analytics' },
        { value: 'advanced', label: 'Advanced' },
    ],
    BEST_PRACTICES: [
        { value: 'all', label: 'All Categories' },
        { value: 'content', label: 'Content Creation' },
        { value: 'marketing', label: 'Marketing & Branding' },
        { value: 'client-relations', label: 'Client Relations' },
        { value: 'technology', label: 'Technology & Tools' },
        { value: 'business', label: 'Business Development' },
    ],
    COMMUNITY: [
        { value: 'all', label: 'All Categories' },
        { value: 'question', label: 'Questions' },
        { value: 'discussion', label: 'Discussions' },
        { value: 'success-story', label: 'Success Stories' },
        { value: 'tip', label: 'Tips' },
        { value: 'announcement', label: 'Announcements' },
    ],
} as const;

// Difficulty levels
export const DIFFICULTY_LEVELS = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
} as const;

// Certificate types
export const CERTIFICATE_TYPES = {
    COURSE: 'course',
    SKILL: 'skill',
    ACHIEVEMENT: 'achievement',
} as const;

// Color mappings for consistent styling
export const CATEGORY_COLORS = {
    // Course categories
    'marketing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'lead-generation': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'social-media': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'technology': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'business': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',

    // Tutorial categories
    'getting-started': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'content-creation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'analytics': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'advanced': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',

    // Best practices categories
    'content': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'client-relations': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',

    // Community categories
    'question': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'discussion': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    'success-story': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'tip': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'announcement': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',

    // Certificate types
    'course': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'skill': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'achievement': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',

    // Role-play categories
    'buyer-consultation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'seller-consultation': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'listing-presentation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'objection-handling': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'negotiation': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',

    // Default
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
} as const;

export const DIFFICULTY_COLORS = {
    'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
} as const;

// Certification path categories
export const CERTIFICATION_PATH_CATEGORIES = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    SPECIALIST: 'specialist',
} as const;

export const PATH_CATEGORY_COLORS = {
    'beginner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'specialist': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
} as const;

// Resource types
export const RESOURCE_TYPES = {
    ARTICLE: 'article',
    VIDEO: 'video',
    TOOL: 'tool',
    TEMPLATE: 'template',
} as const;

// Event types
export const EVENT_TYPES = {
    WEBINAR: 'webinar',
    WORKSHOP: 'workshop',
    NETWORKING: 'networking',
    QA: 'q-and-a',
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
    POST_CONTENT_MIN: 1,
    POST_CONTENT_MAX: 2000,
    SEARCH_QUERY_MAX: 100,
    TAG_MAX_LENGTH: 50,
    MAX_TAGS_PER_POST: 10,
} as const;