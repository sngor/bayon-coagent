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
    Calendar as CalendarIcon,
    Bell,
    Gift,
    Plug
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

import { useFavorites } from '@/hooks/use-favorites';
import { toast } from '@/hooks/use-toast';
import { getAllPages } from '@/lib/page-metadata';

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
    Calendar: CalendarIcon,
    Bell,
    Gift,
    Plug
};

/**
 * Get category for a page based on its href
 */
function getCategoryForPage(href: string): string {
    if (href === '/dashboard' || href === '/assistant') return 'Overview';
    if (href.startsWith('/studio')) return 'Studio';
    if (href.startsWith('/brand')) return 'Brand';
    if (href.startsWith('/research') || href.startsWith('/knowledge')) return 'Research';
    if (href.startsWith('/intelligence')) return 'Market';
    if (href.startsWith('/tools')) return 'Tools';
    if (href.startsWith('/library')) return 'Library';
    if (href.startsWith('/client')) return 'Client Management';
    if (href.startsWith('/learning')) return 'Learning';
    if (href.startsWith('/settings') || href.startsWith('/integrations')) return 'Settings';
    return 'Other';
}



export function DashboardQuickActions() {
    const { favorites, isLoading, toggleFavorite } = useFavorites();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddPage = (page: ReturnType<typeof getAllPages>[0]) => {
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
                                {(() => {
                                    const allPages = getAllPages();
                                    const filteredPages = allPages.filter(page =>
                                        searchQuery === '' ||
                                        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        page.description.toLowerCase().includes(searchQuery.toLowerCase())
                                    );

                                    const categorizedPages = filteredPages.reduce((acc, page) => {
                                        const category = getCategoryForPage(page.href);
                                        if (!acc[category]) acc[category] = [];
                                        acc[category].push(page);
                                        return acc;
                                    }, {} as Record<string, typeof allPages>);

                                    const categoryOrder = ['Overview', 'Studio', 'Brand', 'Research', 'Market', 'Tools', 'Library', 'Client Management', 'Learning', 'Settings', 'Other'];
                                    const sortedCategories = Object.entries(categorizedPages).sort(([a], [b]) => {
                                        const aIndex = categoryOrder.indexOf(a);
                                        const bIndex = categoryOrder.indexOf(b);
                                        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
                                        if (aIndex === -1) return 1;
                                        if (bIndex === -1) return -1;
                                        return aIndex - bIndex;
                                    });

                                    if (sortedCategories.length === 0) {
                                        return (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No pages found matching "{searchQuery}"</p>
                                            </div>
                                        );
                                    }

                                    return sortedCategories.map(([category, pages]) => (
                                        <div key={category}>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                                                {category}
                                            </h4>
                                            <div className="space-y-1">
                                                {pages.map((page) => {
                                                    const Icon = iconMap[page.icon as keyof typeof iconMap] || Zap;
                                                    const isFavorited = favorites.some(f => f.id === page.id);

                                                    return (
                                                        <button
                                                            key={page.id}
                                                            type="button"
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
                                    ));
                                })()}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <DataGrid columns={4} gap="spacious" className="mb-8">
                {favorites.slice(0, 8).map((action) => {
                    const Icon = iconMap[action.icon as keyof typeof iconMap] || Zap;

                    return (
                        <div key={action.id} className="group relative h-full">
                            <Link href={action.href} className="block h-full">
                                <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full flex flex-col">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                                    <div className="p-6 flex flex-col h-full min-h-[160px]">
                                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors flex-shrink-0">
                                            {action.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 flex-grow">
                                            {action.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Remove button */}
                            <Button
                                type="button"
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
                            <div className="rounded-xl border-2 border-dashed border-muted hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
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