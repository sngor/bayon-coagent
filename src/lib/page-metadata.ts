import { type FavoriteItem } from '@/hooks/use-favorites';
import { type IconName } from '@/lib/icon-utils';

/**
 * Page metadata type with proper icon typing
 */
export type PageMetadata = Omit<FavoriteItem, 'addedAt'> & {
    icon: IconName;
};

/**
 * Hub categories for organizing pages
 */
export const HUB_CATEGORIES = [
    'Overview',
    'Studio',
    'Brand',
    'Research',
    'Market',
    'Tools',
    'Library',
    'Client Management',
    'Open House',
    'Learning',
    'Admin & Support',
    'Settings',
    'Other'
] as const;

export type HubCategory = typeof HUB_CATEGORIES[number];

/**
 * Centralized page metadata registry for pin/favorites functionality
 * This ensures consistency across the application and prevents duplicate pins
 */
export const PAGE_METADATA: Record<string, PageMetadata> = {
    // Overview
    '/dashboard': {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Your success overview',
        href: '/dashboard',
        icon: 'Home',
        color: 'bg-slate-500',
        gradient: 'from-slate-500 to-slate-600'
    },
    '/assistant': {
        id: 'assistant',
        title: 'AI Assistant',
        description: 'Chat with your AI assistant',
        href: '/assistant',
        icon: 'MessageSquare',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600'
    },

    // Studio Hub
    '/studio': {
        id: 'studio',
        title: 'Studio Hub',
        description: 'Content creation and design',
        href: '/studio',
        icon: 'PenTool',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/studio/write': {
        id: 'studio-write',
        title: 'Write Content',
        description: 'Create blog posts and articles',
        href: '/studio/write',
        icon: 'PenTool',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/studio/describe': {
        id: 'studio-describe',
        title: 'Describe Properties',
        description: 'Generate listing descriptions',
        href: '/studio/describe',
        icon: 'FileText',
        color: 'bg-cyan-500',
        gradient: 'from-cyan-500 to-cyan-600'
    },
    '/studio/reimagine': {
        id: 'studio-reimagine',
        title: 'Reimagine Images',
        description: 'AI-powered image editing',
        href: '/studio/reimagine',
        icon: 'Image',
        color: 'bg-pink-500',
        gradient: 'from-pink-500 to-pink-600'
    },
    '/studio/post-cards': {
        id: 'studio-post-cards',
        title: 'Post Card Studio',
        description: 'Create personalized real estate post cards',
        href: '/studio/post-cards',
        icon: 'Image',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/studio/open-house': {
        id: 'studio-open-house',
        title: 'Open House Flyers',
        description: 'Create professional open house materials',
        href: '/studio/open-house',
        icon: 'Home',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600'
    },

    // Brand Hub
    '/brand': {
        id: 'brand',
        title: 'Brand Hub',
        description: 'Brand identity and strategy',
        href: '/brand',
        icon: 'Award',
        color: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-emerald-600'
    },
    '/brand/profile': {
        id: 'brand-profile',
        title: 'Brand Profile',
        description: 'Manage your professional profile',
        href: '/brand/profile',
        icon: 'Users',
        color: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-emerald-600'
    },
    '/brand/audit': {
        id: 'brand-audit',
        title: 'Brand Audit',
        description: 'Check your online presence',
        href: '/brand/audit',
        icon: 'Award',
        color: 'bg-yellow-500',
        gradient: 'from-yellow-500 to-yellow-600'
    },
    '/brand/competitors': {
        id: 'brand-competitors',
        title: 'Competitors',
        description: 'Track your competition',
        href: '/brand/competitors',
        icon: 'TrendingUp',
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-orange-600'
    },
    '/brand/strategy': {
        id: 'brand-strategy',
        title: 'Marketing Strategy',
        description: 'AI-generated marketing plans',
        href: '/brand/strategy',
        icon: 'Target',
        color: 'bg-red-500',
        gradient: 'from-red-500 to-red-600'
    },
    '/brand/testimonials': {
        id: 'brand-testimonials',
        title: 'Testimonials',
        description: 'Collect and showcase client feedback',
        href: '/brand/testimonials',
        icon: 'MessageSquare',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/brand/calendar': {
        id: 'brand-calendar',
        title: 'Content Calendar',
        description: 'Schedule and manage content',
        href: '/brand/calendar',
        icon: 'Calendar',
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-orange-600'
    },
    '/brand/integrations': {
        id: 'brand-integrations',
        title: 'Brand Integrations',
        description: 'Connect Google Business Profile and other services',
        href: '/brand/integrations',
        icon: 'Plug',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },

    // Research Hub
    '/research': {
        id: 'research',
        title: 'Research Hub',
        description: 'AI-powered research and insights',
        href: '/research',
        icon: 'Search',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/research/agent': {
        id: 'research-agent',
        title: 'Research Agent',
        description: 'AI-powered market research',
        href: '/research/agent',
        icon: 'Search',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/research/reports': {
        id: 'research-reports',
        title: 'Research Reports',
        description: 'View saved research reports',
        href: '/research/reports',
        icon: 'FileText',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600'
    },
    '/research/knowledge': {
        id: 'research-knowledge',
        title: 'Knowledge Base',
        description: 'Access research materials',
        href: '/research/knowledge',
        icon: 'BookOpen',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600'
    },
    '/research/insights': {
        id: 'research-insights',
        title: 'Research Insights',
        description: 'Market insights and analysis',
        href: '/research/insights',
        icon: 'TrendingUp',
        color: 'bg-violet-500',
        gradient: 'from-violet-500 to-violet-600'
    },
    '/research/news': {
        id: 'research-news',
        title: 'Research News',
        description: 'Latest market news and trends',
        href: '/research/news',
        icon: 'Newspaper',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/research/analytics': {
        id: 'research-analytics',
        title: 'Research Analytics',
        description: 'Advanced research analytics',
        href: '/research/analytics',
        icon: 'BarChart3',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/research/opportunities': {
        id: 'research-opportunities',
        title: 'Research Opportunities',
        description: 'Market opportunities and trends',
        href: '/research/opportunities',
        icon: 'TrendingUp',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/research/alerts': {
        id: 'research-alerts',
        title: 'Research Alerts',
        description: 'Market alerts and notifications',
        href: '/research/alerts',
        icon: 'Bell',
        color: 'bg-red-500',
        gradient: 'from-red-500 to-red-600'
    },

    // Legacy Research Routes (for backward compatibility)
    '/research-agent': {
        id: 'research-agent-legacy',
        title: 'Research Agent',
        description: 'AI-powered market research',
        href: '/research-agent',
        icon: 'Search',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/knowledge-base': {
        id: 'knowledge-base-legacy',
        title: 'Knowledge Base',
        description: 'Access research and news',
        href: '/knowledge-base',
        icon: 'BookOpen',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600'
    },

    // Market Hub (Intelligence)
    '/market': {
        id: 'market',
        title: 'Market Hub',
        description: 'Market intelligence and trends',
        href: '/market',
        icon: 'TrendingUp',
        color: 'bg-violet-500',
        gradient: 'from-violet-500 to-violet-600'
    },
    '/market/insights': {
        id: 'market-insights',
        title: 'Market Insights',
        description: 'Market trends and analysis',
        href: '/market/insights',
        icon: 'TrendingUp',
        color: 'bg-violet-500',
        gradient: 'from-violet-500 to-violet-600'
    },
    '/market/news': {
        id: 'market-news',
        title: 'Market News',
        description: 'Latest real estate news and trends',
        href: '/market/news',
        icon: 'Newspaper',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/market/analytics': {
        id: 'market-analytics',
        title: 'Market Analytics',
        description: 'Advanced market analysis',
        href: '/market/analytics',
        icon: 'BarChart3',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/market/opportunities': {
        id: 'market-opportunities',
        title: 'Market Opportunities',
        description: 'Investment opportunities',
        href: '/market/opportunities',
        icon: 'TrendingUp',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/market/alerts': {
        id: 'market-alerts',
        title: 'Market Alerts',
        description: 'Price changes and new listings',
        href: '/market/alerts',
        icon: 'Bell',
        color: 'bg-red-500',
        gradient: 'from-red-500 to-red-600'
    },

    // Intelligence Hub (Legacy Market Routes)
    '/intelligence/agent': {
        id: 'intelligence-agent',
        title: 'Research Agent',
        description: 'AI-powered market research',
        href: '/intelligence/agent',
        icon: 'Search',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/intelligence/reports': {
        id: 'intelligence-reports',
        title: 'Research Reports',
        description: 'View saved research reports',
        href: '/intelligence/reports',
        icon: 'FileText',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600'
    },
    '/intelligence/knowledge': {
        id: 'intelligence-knowledge',
        title: 'Knowledge Base',
        description: 'Access research materials',
        href: '/intelligence/knowledge',
        icon: 'BookOpen',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600'
    },
    '/intelligence/trends': {
        id: 'intelligence-trends',
        title: 'Market Trends',
        description: 'Life event predictions and market trends',
        href: '/intelligence/trends',
        icon: 'TrendingUp',
        color: 'bg-violet-500',
        gradient: 'from-violet-500 to-violet-600'
    },
    '/intelligence/opportunities': {
        id: 'intelligence-opportunities',
        title: 'Market Opportunities',
        description: 'Investment opportunities',
        href: '/intelligence/opportunities',
        icon: 'TrendingUp',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/intelligence/analytics': {
        id: 'intelligence-analytics',
        title: 'Market Analytics',
        description: 'Advanced market analysis',
        href: '/intelligence/analytics',
        icon: 'BarChart3',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/intelligence/news': {
        id: 'intelligence-news',
        title: 'Market News',
        description: 'Latest real estate news and trends',
        href: '/intelligence/news',
        icon: 'Newspaper',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/intelligence/alerts': {
        id: 'intelligence-alerts',
        title: 'Market Alerts',
        description: 'Price changes and new listings',
        href: '/intelligence/alerts',
        icon: 'Bell',
        color: 'bg-red-500',
        gradient: 'from-red-500 to-red-600'
    },

    // Tools Hub
    '/tools': {
        id: 'tools',
        title: 'Tools Hub',
        description: 'Deal analysis and calculations',
        href: '/tools',
        icon: 'Calculator',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/tools/calculator': {
        id: 'tools-calculator',
        title: 'Mortgage Calculator',
        description: 'Calculate payments and rates',
        href: '/tools/calculator',
        icon: 'Calculator',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/tools/roi': {
        id: 'tools-roi',
        title: 'ROI Calculator',
        description: 'Analyze investment returns',
        href: '/tools/roi',
        icon: 'DollarSign',
        color: 'bg-green-600',
        gradient: 'from-green-600 to-green-700'
    },
    '/tools/valuation': {
        id: 'tools-valuation',
        title: 'Property Valuation',
        description: 'AI property value estimates',
        href: '/tools/valuation',
        icon: 'Building',
        color: 'bg-stone-500',
        gradient: 'from-stone-500 to-stone-600'
    },
    '/tools/document-scanner': {
        id: 'tools-document-scanner',
        title: 'Document Scanner',
        description: 'Scan and digitize documents',
        href: '/tools/document-scanner',
        icon: 'FileText',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },

    // Library Hub
    '/library': {
        id: 'library',
        title: 'Library Hub',
        description: 'Content and knowledge management',
        href: '/library',
        icon: 'FileText',
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-amber-600'
    },
    '/library/content': {
        id: 'library-content',
        title: 'Content Library',
        description: 'Manage your created content',
        href: '/library/content',
        icon: 'FileText',
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-amber-600'
    },
    '/library/reports': {
        id: 'library-reports',
        title: 'Reports Library',
        description: 'Access saved reports',
        href: '/library/reports',
        icon: 'FileText',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/library/media': {
        id: 'library-media',
        title: 'Media Library',
        description: 'Manage images and videos',
        href: '/library/media',
        icon: 'Image',
        color: 'bg-pink-500',
        gradient: 'from-pink-500 to-pink-600'
    },
    '/library/templates': {
        id: 'library-templates',
        title: 'Templates Library',
        description: 'Reusable content templates',
        href: '/library/templates',
        icon: 'FileText',
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-orange-600'
    },
    '/library/listings': {
        id: 'library-listings',
        title: 'Listings Library',
        description: 'Manage property listings',
        href: '/library/listings',
        icon: 'Building',
        color: 'bg-slate-500',
        gradient: 'from-slate-500 to-slate-600'
    },

    // Client Management
    '/client-dashboards': {
        id: 'client-dashboards',
        title: 'Client Dashboards',
        description: 'Manage client portals and engagement',
        href: '/client-dashboards',
        icon: 'Users',
        color: 'bg-sky-500',
        gradient: 'from-sky-500 to-sky-600'
    },
    '/client-gifts': {
        id: 'client-gifts',
        title: 'Client Gifts',
        description: 'Manage client appreciation gifts',
        href: '/client-gifts',
        icon: 'Gift',
        color: 'bg-pink-500',
        gradient: 'from-pink-500 to-pink-600'
    },

    // Open House Hub
    '/open-house': {
        id: 'open-house',
        title: 'Open House Hub',
        description: 'Event management and planning',
        href: '/open-house',
        icon: 'Home',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600'
    },
    '/open-house/sessions': {
        id: 'open-house-sessions',
        title: 'Open House Sessions',
        description: 'Manage open house events',
        href: '/open-house/sessions',
        icon: 'Calendar',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600'
    },
    '/open-house/check-in': {
        id: 'open-house-check-in',
        title: 'Check-In System',
        description: 'Visitor check-in and tracking',
        href: '/open-house/check-in',
        icon: 'UserCheck',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/open-house/analytics': {
        id: 'open-house-analytics',
        title: 'Open House Analytics',
        description: 'Event performance and insights',
        href: '/open-house/analytics',
        icon: 'BarChart3',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/open-house/templates': {
        id: 'open-house-templates',
        title: 'Event Templates',
        description: 'Reusable event templates',
        href: '/open-house/templates',
        icon: 'FileText',
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-orange-600'
    },
    '/open-house/sequences': {
        id: 'open-house-sequences',
        title: 'Follow-up Sequences',
        description: 'Automated follow-up campaigns',
        href: '/open-house/sequences',
        icon: 'Mail',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },

    // Learning & Training
    '/learning': {
        id: 'learning',
        title: 'Learning Hub',
        description: 'Skill development and training',
        href: '/learning',
        icon: 'BookOpen',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600'
    },
    '/learning/lessons': {
        id: 'learning-lessons',
        title: 'Learning Center',
        description: 'Training modules and courses',
        href: '/learning/lessons',
        icon: 'BookOpen',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600'
    },
    '/learning/tutorials': {
        id: 'learning-tutorials',
        title: 'Video Tutorials',
        description: 'Video-based learning content',
        href: '/learning/tutorials',
        icon: 'Play',
        color: 'bg-red-500',
        gradient: 'from-red-500 to-red-600'
    },
    '/learning/role-play': {
        id: 'learning-role-play',
        title: 'Role-Play Scenarios',
        description: 'AI-powered practice scenarios',
        href: '/learning/role-play',
        icon: 'Users',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },
    '/learning/ai-plan': {
        id: 'learning-ai-plan',
        title: 'AI Training Plan',
        description: 'Personalized AI learning path',
        href: '/learning/ai-plan',
        icon: 'Brain',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/learning/best-practices': {
        id: 'learning-best-practices',
        title: 'Best Practices',
        description: 'Industry best practices and tips',
        href: '/learning/best-practices',
        icon: 'Star',
        color: 'bg-yellow-500',
        gradient: 'from-yellow-500 to-yellow-600'
    },
    '/learning/certification': {
        id: 'learning-certification',
        title: 'Certification',
        description: 'Achievement tracking and certificates',
        href: '/learning/certification',
        icon: 'Award',
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-orange-600'
    },
    '/learning/community': {
        id: 'learning-community',
        title: 'Learning Community',
        description: 'Community discussions and knowledge sharing',
        href: '/learning/community',
        icon: 'MessageSquare',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600'
    },
    '/learning/courses': {
        id: 'learning-courses',
        title: 'Structured Courses',
        description: 'Comprehensive learning programs',
        href: '/learning/courses',
        icon: 'GraduationCap',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },

    // Admin & Support
    '/admin': {
        id: 'admin',
        title: 'Admin Panel',
        description: 'System administration and management',
        href: '/admin',
        icon: 'Shield',
        color: 'bg-red-500',
        gradient: 'from-red-500 to-red-600'
    },
    '/super-admin': {
        id: 'super-admin',
        title: 'Super Admin Panel',
        description: 'Advanced system management',
        href: '/super-admin',
        icon: 'ShieldCheck',
        color: 'bg-red-600',
        gradient: 'from-red-600 to-red-700'
    },
    '/support': {
        id: 'support',
        title: 'Support Center',
        description: 'Help and support resources',
        href: '/support',
        icon: 'HelpCircle',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/analytics': {
        id: 'analytics',
        title: 'Analytics Dashboard',
        description: 'Performance analytics and insights',
        href: '/analytics',
        icon: 'BarChart3',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600'
    },
    '/onboarding': {
        id: 'onboarding',
        title: 'Onboarding',
        description: 'User onboarding and setup',
        href: '/onboarding',
        icon: 'UserPlus',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600'
    },

    // Settings
    '/settings': {
        id: 'settings',
        title: 'Settings',
        description: 'Account and preferences',
        href: '/settings',
        icon: 'Settings',
        color: 'bg-gray-500',
        gradient: 'from-gray-500 to-gray-600'
    },
    '/settings/notifications': {
        id: 'settings-notifications',
        title: 'Notification Settings',
        description: 'Manage notification preferences',
        href: '/settings/notifications',
        icon: 'Bell',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    },
    '/integrations': {
        id: 'integrations',
        title: 'Integrations',
        description: 'Connect external services',
        href: '/integrations',
        icon: 'Plug',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600'
    }
};

/**
 * Get category for a page based on its href
 * Centralized logic for consistent categorization
 */
export function getCategoryForPage(href: string): HubCategory {
    if (href === '/dashboard' || href === '/assistant') return 'Overview';
    if (href.startsWith('/studio')) return 'Studio';
    if (href.startsWith('/brand')) return 'Brand';
    if (href.startsWith('/research') || href.startsWith('/knowledge')) return 'Research';
    if (href.startsWith('/intelligence') || href.startsWith('/market')) return 'Market';
    if (href.startsWith('/tools')) return 'Tools';
    if (href.startsWith('/library')) return 'Library';
    if (href.startsWith('/client')) return 'Client Management';
    if (href.startsWith('/open-house')) return 'Open House';
    if (href.startsWith('/learning')) return 'Learning';
    if (href.startsWith('/admin') || href.startsWith('/super-admin') || href.startsWith('/support') || href.startsWith('/analytics') || href.startsWith('/onboarding')) return 'Admin & Support';
    if (href.startsWith('/settings') || href.startsWith('/integrations')) return 'Settings';
    return 'Other';
}

/**
 * Get page metadata by path
 * Returns undefined if path is not registered
 */
export function getPageMetadata(path: string): PageMetadata | undefined {
    return PAGE_METADATA[path];
}

/**
 * Get all available pages for the quick actions dialog
 */
export function getAllPages(): PageMetadata[] {
    return Object.values(PAGE_METADATA);
}

/**
 * Get pages organized by category
 * Only returns categories that have pages
 */
export function getPagesByCategory(): Record<HubCategory, PageMetadata[]> {
    const categories = HUB_CATEGORIES.reduce((acc, category) => {
        acc[category] = [];
        return acc;
    }, {} as Record<HubCategory, PageMetadata[]>);

    Object.values(PAGE_METADATA).forEach(page => {
        const category = getCategoryForPage(page.href);
        categories[category].push(page);
    });

    // Remove empty categories
    return Object.fromEntries(
        Object.entries(categories).filter(([_, pages]) => pages.length > 0)
    ) as Record<HubCategory, PageMetadata[]>;
}

/**
 * Search pages by title and description
 */
export function searchPages(query: string): PageMetadata[] {
    if (!query.trim()) return getAllPages();

    const lowercaseQuery = query.toLowerCase();
    return getAllPages().filter(page =>
        page.title.toLowerCase().includes(lowercaseQuery) ||
        page.description.toLowerCase().includes(lowercaseQuery)
    );
}
