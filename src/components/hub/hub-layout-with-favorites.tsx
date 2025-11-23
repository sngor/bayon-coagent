'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { HubLayout } from './hub-layout';
import { HubLayoutProps } from './types';
import { FavoritesButton } from '@/components/favorites-button';
import { type FavoriteItem } from '@/hooks/use-favorites';

// Page metadata for favorites
const PAGE_METADATA: Record<string, Omit<FavoriteItem, 'addedAt'>> = {
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
        description: 'Access research and news',
        href: '/research/knowledge',
        icon: 'BookOpen',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600'
    },
    '/market/trends': {
        id: 'market-trends',
        title: 'Market Trends',
        description: 'Life event predictions and market trends',
        href: '/market/trends',
        icon: 'TrendingUp',
        color: 'bg-violet-500',
        gradient: 'from-violet-500 to-violet-600'
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
    '/market/analytics': {
        id: 'market-analytics',
        title: 'Market Analytics',
        description: 'Advanced market analysis',
        href: '/market/analytics',
        icon: 'BarChart3',
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
    }
};

interface HubLayoutWithFavoritesProps extends HubLayoutProps {
    enableFavorites?: boolean;
}

export function HubLayoutWithFavorites({
    enableFavorites = true,
    actions,
    ...props
}: HubLayoutWithFavoritesProps) {
    const pathname = usePathname();

    const pageMetadata = useMemo(() => {
        return PAGE_METADATA[pathname];
    }, [pathname]);

    const enhancedActions = useMemo(() => {
        if (!enableFavorites || !pageMetadata) {
            return actions;
        }

        const favoritesButton = (
            <FavoritesButton
                item={pageMetadata}
                variant="outline"
                size="sm"
                showText={false}
            />
        );

        if (!actions) {
            return favoritesButton;
        }

        return (
            <div className="flex items-center gap-2">
                {actions}
                {favoritesButton}
            </div>
        );
    }, [actions, enableFavorites, pageMetadata]);

    return (
        <HubLayout
            {...props}
            actions={enhancedActions}
        />
    );
}