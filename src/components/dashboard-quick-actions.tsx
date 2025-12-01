'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    PenTool,
    Search,
    Calculator,
    Users,
    Settings,
    X,
    Pin,
    Zap,
    BarChart3,
    Target,
    Brain,
    Home,
    FileText,
    Image,
    TrendingUp,
    Award,
    Newspaper,
    BookOpen,
    DollarSign,
    Building,
    MessageSquare,
    Plus,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataGrid } from '@/components/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { useFavorites, type FavoriteItem } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils/common';
import { toast } from '@/hooks/use-toast';

// Icon mapping
const iconMap = {
    PenTool,
    Search,
    Calculator,
    Users,
    Settings,
    BarChart3,
    Target,
    Brain,
    Home,
    FileText,
    Image,
    TrendingUp,
    Award,
    Newspaper,
    BookOpen,
    DollarSign,
    Building,
    MessageSquare,
    Zap,
    Calendar: CalendarIcon
};

// Available pages that can be added to favorites
export const AVAILABLE_PAGES = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Your success overview',
        href: '/dashboard',
        icon: 'Home',
        color: 'bg-slate-500',
        gradient: 'from-slate-500 to-slate-600',
        category: 'Overview'
    },
    {
        id: 'assistant',
        title: 'AI Assistant',
        description: 'Chat with your AI assistant',
        href: '/assistant',
        icon: 'MessageSquare',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600',
        category: 'AI Tools'
    },
    {
        id: 'studio-write',
        title: 'Write Content',
        description: 'Create blog posts and articles',
        href: '/studio/write',
        icon: 'PenTool',
        color: 'bg-blue-500',
        gradient: 'from-blue-500 to-blue-600',
        category: 'Studio'
    },
    {
        id: 'studio-describe',
        title: 'Describe Properties',
        description: 'Generate listing descriptions',
        href: '/studio/describe',
        icon: 'FileText',
        color: 'bg-cyan-500',
        gradient: 'from-cyan-500 to-cyan-600',
        category: 'Studio'
    },
    {
        id: 'studio-reimagine',
        title: 'Reimagine Images',
        description: 'AI-powered image editing',
        href: '/studio/reimagine',
        icon: 'Image',
        color: 'bg-pink-500',
        gradient: 'from-pink-500 to-pink-600',
        category: 'Studio'
    },
    {
        id: 'studio-post-cards',
        title: 'Post Card Studio',
        description: 'Create personalized real estate post cards',
        href: '/studio/post-cards',
        icon: 'Image',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600',
        category: 'Studio'
    },
    {
        id: 'brand-profile',
        title: 'Brand Profile',
        description: 'Manage your professional profile',
        href: '/brand/profile',
        icon: 'Users',
        color: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-emerald-600',
        category: 'Brand'
    },
    {
        id: 'brand-audit',
        title: 'Brand Audit',
        description: 'Check your online presence',
        href: '/brand/audit',
        icon: 'Award',
        color: 'bg-yellow-500',
        gradient: 'from-yellow-500 to-yellow-600',
        category: 'Brand'
    },
    {
        id: 'brand-competitors',
        title: 'Competitors',
        description: 'Track your competition',
        href: '/brand/competitors',
        icon: 'TrendingUp',
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-orange-600',
        category: 'Brand'
    },
    {
        id: 'brand-strategy',
        title: 'Marketing Strategy',
        description: 'AI-generated marketing plans',
        href: '/brand/strategy',
        icon: 'Target',
        color: 'bg-red-500',
        gradient: 'from-red-500 to-red-600',
        category: 'Brand'
    },
    {
        id: 'brand-testimonials',
        title: 'Testimonials',
        description: 'Collect and showcase client feedback',
        href: '/brand/testimonials',
        icon: 'MessageSquare',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600',
        category: 'Brand'
    },
    {
        id: 'brand-calendar',
        title: 'Content Calendar',
        description: 'Schedule and manage content',
        href: '/brand/calendar',
        icon: 'Calendar',
        color: 'bg-orange-500',
        gradient: 'from-orange-500 to-orange-600',
        category: 'Brand'
    },
    {
        id: 'research-agent',
        title: 'Research Agent',
        description: 'AI-powered market research',
        href: '/research-agent',
        icon: 'Search',
        color: 'bg-green-500',
        gradient: 'from-green-500 to-green-600',
        category: 'Research'
    },
    {
        id: 'research-knowledge',
        title: 'Knowledge Base',
        description: 'Access research and news',
        href: '/knowledge-base',
        icon: 'BookOpen',
        color: 'bg-teal-500',
        gradient: 'from-teal-500 to-teal-600',
        category: 'Research'
    },
    {
        id: 'market-insights',
        title: 'Market Trends',
        description: 'Life event predictions and market trends',
        href: '/intelligence/trends',
        icon: 'TrendingUp',
        color: 'bg-violet-500',
        gradient: 'from-violet-500 to-violet-600',
        category: 'Market'
    },
    {
        id: 'tools-calculator',
        title: 'Mortgage Calculator',
        description: 'Calculate payments and rates',
        href: '/tools/calculator',
        icon: 'Calculator',
        color: 'bg-purple-500',
        gradient: 'from-purple-500 to-purple-600',
        category: 'Tools'
    },
    {
        id: 'tools-roi',
        title: 'ROI Calculator',
        description: 'Analyze investment returns',
        href: '/tools/roi',
        icon: 'DollarSign',
        color: 'bg-green-600',
        gradient: 'from-green-600 to-green-700',
        category: 'Tools'
    },
    {
        id: 'tools-valuation',
        title: 'Property Valuation',
        description: 'AI property value estimates',
        href: '/tools/valuation',
        icon: 'Building',
        color: 'bg-stone-500',
        gradient: 'from-stone-500 to-stone-600',
        category: 'Tools'
    },
    {
        id: 'library-content',
        title: 'Content Library',
        description: 'Manage your created content',
        href: '/library/content',
        icon: 'FileText',
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-amber-600',
        category: 'Library'
    },
    {
        id: 'client-dashboards',
        title: 'Client Dashboards',
        description: 'Manage client portals and engagement',
        href: '/client-dashboards',
        icon: 'Users',
        color: 'bg-sky-500',
        gradient: 'from-sky-500 to-sky-600',
        category: 'Client Management'
    },
    {
        id: 'learning-lessons',
        title: 'Learning Center',
        description: 'Training modules and courses',
        href: '/learning/lessons',
        icon: 'BookOpen',
        color: 'bg-indigo-500',
        gradient: 'from-indigo-500 to-indigo-600',
        category: 'Learning'
    }
];

export function getPageConfig(path: string) {
    return AVAILABLE_PAGES.find(page => page.href === path);
}

export function DashboardQuickActions() {
    const { favorites, isLoading, toggleFavorite } = useFavorites();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddPage = (page: typeof AVAILABLE_PAGES[0]) => {
        const wasAlreadyFavorited = favorites.some(f => f.id === page.id);

        toggleFavorite({
            id: page.id,
            title: page.title,
            description: page.description,
            href: page.href,
            icon: page.icon,
            color: page.color,
            gradient: page.gradient
        });

        // Show feedback and close dialog
        if (wasAlreadyFavorited) {
            toast({
                title: "Unpinned",
                description: `${page.title} removed from quick actions`,
            });
        } else {
            toast({
                title: "Pinned",
                description: `${page.title} added to quick actions`,
            });
            setIsDialogOpen(false);
        }
    };

    const handleRemoveFavorite = (id: string) => {
        const favorite = favorites.find(f => f.id === id);
        if (favorite) {
            toggleFavorite(favorite);
            toast({
                title: "Unpinned",
                description: `${favorite.title} removed from quick actions`,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="animate-fade-in-up animate-delay-150">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold font-headline">Quick Actions</h2>
                </div>
                <DataGrid columns={4} gap="spacious" className="mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-6 animate-pulse">
                            <div className="w-12 h-12 bg-muted rounded-lg mb-4" />
                            <div className="h-4 bg-muted rounded mb-2" />
                            <div className="h-3 bg-muted rounded w-3/4" />
                        </div>
                    ))}
                </DataGrid>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up animate-delay-150">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold font-headline">Quick Actions</h2>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSearchQuery('');
                }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add to Quick Actions</DialogTitle>
                            <DialogDescription>
                                Choose pages to add to your dashboard quick actions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search pages..."
                                    className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    value={searchQuery}
                                />
                            </div>

                            {/* Pages List */}
                            <div className="max-h-96 overflow-y-auto space-y-4">
                                {Object.entries(
                                    AVAILABLE_PAGES
                                        .filter(page =>
                                            searchQuery === '' ||
                                            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            page.category.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .reduce((acc, page) => {
                                            if (!acc[page.category]) acc[page.category] = [];
                                            acc[page.category].push(page);
                                            return acc;
                                        }, {} as Record<string, typeof AVAILABLE_PAGES>)
                                ).map(([category, pages]) => (
                                    <div key={category}>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                                            {category}
                                        </h4>
                                        <div className="space-y-1">
                                            {pages.map((page) => {
                                                const Icon = iconMap[page.icon as keyof typeof iconMap];
                                                const isFavorited = favorites.some(f => f.id === page.id);

                                                return (
                                                    <button
                                                        key={page.id}
                                                        onClick={() => handleAddPage(page)}
                                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg ${page.color} flex items-center justify-center text-white flex-shrink-0`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm">{page.title}</div>
                                                            <div className="text-xs text-muted-foreground truncate">{page.description}</div>
                                                        </div>
                                                        {isFavorited && (
                                                            <Pin className="w-4 h-4 text-primary fill-current flex-shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* No results message */}
                                {searchQuery && Object.keys(
                                    AVAILABLE_PAGES
                                        .filter(page =>
                                            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            page.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            page.category.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .reduce((acc, page) => {
                                            if (!acc[page.category]) acc[page.category] = [];
                                            acc[page.category].push(page);
                                            return acc;
                                        }, {} as Record<string, typeof AVAILABLE_PAGES>)
                                ).length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No pages found matching "{searchQuery}"</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <DataGrid columns={4} gap="spacious" className="mb-8">
                {favorites.slice(0, 8).map((action) => {
                    const Icon = iconMap[action.icon as keyof typeof iconMap] || Zap;

                    return (
                        <div key={action.id} className="group relative">
                            <Link href={action.href}>
                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                                    <div className="p-6">
                                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors">
                                            {action.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Remove button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleRemoveFavorite(action.id);
                                }}
                                title="Unpin page"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    );
                })}

                {/* Add more button if less than 8 favorites */}
                {favorites.length < 8 && (
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setSearchQuery('');
                    }}>
                        <DialogTrigger asChild>
                            <div className="rounded-xl border-2 border-dashed border-muted hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
                                <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">Add Page</p>
                                <p className="text-xs text-muted-foreground/80">Customize your quick actions</p>
                            </div>
                        </DialogTrigger>
                    </Dialog>
                )}
            </DataGrid>
        </div >
    );
}