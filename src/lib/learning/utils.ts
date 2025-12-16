/**
 * Training Hub Utility Functions
 * Shared utility functions across training components
 */

import {
    BookOpen,
    Camera,
    BarChart3,
    Download,
    ExternalLink,
    Target,
    Zap,
    Brain,
    Star,
    Trophy,
    Award,
    CheckCircle,
    Sparkles,
    TrendingUp,
    Users,
    type LucideIcon,
} from 'lucide-react';
import {
    CATEGORY_COLORS,
    DIFFICULTY_COLORS,
    PATH_CATEGORY_COLORS
} from './constants';

// Type definitions for better type safety
type CategoryType =
    | 'marketing' | 'lead-generation' | 'social-media' | 'technology' | 'business'
    | 'getting-started' | 'content-creation' | 'analytics' | 'advanced'
    | 'content' | 'client-relations'
    | 'question' | 'discussion' | 'success-story' | 'tip' | 'announcement'
    | 'course' | 'skill' | 'achievement'
    | 'buyer-consultation' | 'seller-consultation' | 'listing-presentation' | 'objection-handling' | 'negotiation'
    | 'default';

type PathCategoryType = 'beginner' | 'intermediate' | 'advanced' | 'specialist' | 'default';
type ResourceType = 'article' | 'video' | 'tool' | 'template' | 'default';

// Icon mappings - extracted as constants for performance
const CATEGORY_ICON_MAP: Record<CategoryType, LucideIcon> = {
    // Course categories
    'marketing': TrendingUp,
    'lead-generation': Target,
    'social-media': Users,
    'technology': BarChart3,
    'business': Trophy,

    // Tutorial categories
    'getting-started': Target,
    'content-creation': Sparkles,
    'analytics': BarChart3,
    'advanced': Brain,

    // Best practices categories
    'content': Sparkles,
    'client-relations': Users,

    // Community categories
    'question': BookOpen,
    'discussion': Users,
    'success-story': Trophy,
    'tip': Star,
    'announcement': ExternalLink,

    // Certificate types
    'course': BookOpen,
    'skill': Target,
    'achievement': Trophy,

    // Role-play categories
    'buyer-consultation': Users,
    'seller-consultation': Users,
    'listing-presentation': Target,
    'objection-handling': Users,
    'negotiation': Users,

    // Default
    'default': BookOpen,
} as const;

const PATH_CATEGORY_ICON_MAP: Record<PathCategoryType, LucideIcon> = {
    'beginner': Target,
    'intermediate': Zap,
    'advanced': Brain,
    'specialist': Star,
    'default': Award,
} as const;

const RESOURCE_ICON_MAP: Record<ResourceType, LucideIcon> = {
    'article': BookOpen,
    'video': Camera,
    'tool': BarChart3,
    'template': Download,
    'default': ExternalLink,
} as const;

/**
 * Get color class for a category
 */
export function getCategoryColor(category: string): string {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default;
}

/**
 * Get color class for difficulty level
 */
export function getDifficultyColor(difficulty: string): string {
    return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS.default;
}

/**
 * Get color class for certification path category
 */
export function getPathCategoryColor(category: string): string {
    return PATH_CATEGORY_COLORS[category as keyof typeof PATH_CATEGORY_COLORS] || PATH_CATEGORY_COLORS.default;
}

/**
 * Get icon component for category
 */
export function getCategoryIcon(category: CategoryType): LucideIcon {
    return CATEGORY_ICON_MAP[category] || CATEGORY_ICON_MAP.default;
}

/**
 * Get icon component for certification path category
 */
export function getPathCategoryIcon(category: PathCategoryType): LucideIcon {
    return PATH_CATEGORY_ICON_MAP[category] || PATH_CATEGORY_ICON_MAP.default;
}

/**
 * Get icon component for resource type
 */
export function getResourceIcon(type: ResourceType): LucideIcon {
    return RESOURCE_ICON_MAP[type] || RESOURCE_ICON_MAP.default;
}

/**
 * Format duration in minutes to human readable format
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format view count to human readable format
 */
export function formatViews(views: number): string {
    if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
    }

    return date.toLocaleDateString();
}

/**
 * Generate user display name from user object
 */
export function getUserDisplayName(user: any): string {
    if (user?.attributes?.name) {
        return user.attributes.name;
    }

    if (user?.email) {
        return user.email.split('@')[0];
    }

    return 'Anonymous User';
}

/**
 * Filter items based on search query
 */
export function filterBySearch<T extends Record<string, any>>(
    items: T[],
    searchQuery: string,
    searchFields: (keyof T)[]
): T[] {
    if (!searchQuery.trim()) {
        return items;
    }

    const searchLower = searchQuery.toLowerCase();

    return items.filter(item =>
        searchFields.some(field => {
            const value = item[field];
            if (typeof value === 'string') {
                return value.toLowerCase().includes(searchLower);
            }
            if (Array.isArray(value)) {
                return value.some((v: any) =>
                    typeof v === 'string' && v.toLowerCase().includes(searchLower)
                );
            }
            return false;
        })
    );
}

/**
 * Filter items by category
 */
export function filterByCategory<T extends { category: string }>(
    items: T[],
    selectedCategory: string
): T[] {
    if (selectedCategory === 'all') {
        return items;
    }

    return items.filter(item => item.category === selectedCategory);
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'item'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Validate post content
 */
export function validatePostContent(content: string): { isValid: boolean; error?: string } {
    if (!content.trim()) {
        return { isValid: false, error: 'Content cannot be empty' };
    }

    if (content.length > 2000) {
        return { isValid: false, error: 'Content is too long (max 2000 characters)' };
    }

    return { isValid: true };
}

/**
 * Extract tags from content
 */
export function extractTagsFromContent(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);

    if (!matches) return [];

    return matches
        .map(tag => tag.substring(1)) // Remove the # symbol
        .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
        .slice(0, 10); // Limit to 10 tags
}

/**
 * Sort items by multiple criteria
 */
export function sortItems<T>(
    items: T[],
    sortBy: keyof T,
    sortOrder: 'asc' | 'desc' = 'desc'
): T[] {
    return [...items].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return sortOrder === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
    });
}