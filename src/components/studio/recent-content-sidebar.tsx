'use client';

import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Clock,
    FileText,
    MessageSquare,
    Video,
    TrendingUp,
    MapPin,
    Globe,
    Home,
    Image,
    Mail,
    Copy,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { SavedContentItem } from '@/app/library-actions';
import { useRecentContent } from '@/hooks/use-recent-content';

// Use the shared type instead of duplicating
type RecentContentItem = SavedContentItem;

// Move these outside component to prevent recreation on each render
const CONTENT_TYPE_ICONS = {
    'blog-post': FileText,
    'social-media': MessageSquare,
    'video-script': Video,
    'market-update': TrendingUp,
    'neighborhood-guide': MapPin,
    'website-content': Globe,
    'listing-description': Home,
    'post-card': Image,
    'open-house-flyer': FileText,
    'email-invite': Mail,
} as const;

const CONTENT_TYPE_LABELS = {
    'blog-post': 'Blog Post',
    'social-media': 'Social Media',
    'video-script': 'Video Script',
    'market-update': 'Market Update',
    'neighborhood-guide': 'Neighborhood Guide',
    'website-content': 'Website Content',
    'listing-description': 'Listing Description',
    'post-card': 'Post Card',
    'open-house-flyer': 'Open House Flyer',
    'email-invite': 'Email Invitation',
} as const;

export function RecentContentSidebar() {
    const { content: recentContent, isLoading, isRefreshing, error, refresh } = useRecentContent({
        limit: 10,
        autoRefresh: false, // Could be enabled for real-time updates
    });

    // Custom hook handles all the loading logic

    // useEffect removed - custom hook handles loading

    const copyToClipboard = useCallback(async (content: string, name: string) => {
        try {
            await navigator.clipboard.writeText(content);
            toast({
                title: 'Copied to Clipboard!',
                description: `"${name}" is ready to paste.`,
            });
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toast({
                title: 'Copy Failed',
                description: 'Unable to copy content to clipboard.',
                variant: 'destructive',
            });
        }
    }, [toast]);

    const getContentPreview = useCallback((content: string, maxLength = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    }, []);

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }, []);

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Content
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Content
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refresh(true)}
                        disabled={isRefreshing}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                    <div className="p-6 pt-0">
                        {error ? (
                            <div className="text-center py-8">
                                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-destructive text-xl">⚠️</span>
                                </div>
                                <p className="text-muted-foreground mb-2">Failed to load content</p>
                                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refresh(true)}
                                    disabled={isRefreshing}
                                >
                                    {isRefreshing ? 'Retrying...' : 'Try Again'}
                                </Button>
                            </div>
                        ) : recentContent.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No recent content</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create content in Studio to see it here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentContent.map((item, index) => {
                                    const IconComponent = CONTENT_TYPE_ICONS[item.type as keyof typeof CONTENT_TYPE_ICONS] || FileText;
                                    const typeLabel = CONTENT_TYPE_LABELS[item.type as keyof typeof CONTENT_TYPE_LABELS] || item.type;

                                    return (
                                        <div key={item.id}>
                                            <div className="group relative">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <IconComponent className="h-4 w-4 text-primary" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="text-sm font-medium truncate">
                                                                {item.name || typeLabel}
                                                            </h4>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {typeLabel}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {getContentPreview(item.content)}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDate(item.createdAt)}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => copyToClipboard(item.content, item.name || typeLabel)}
                                                                    title={`Copy "${item.name || typeLabel}" to clipboard`}
                                                                    aria-label={`Copy "${item.name || typeLabel}" to clipboard`}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                                <Link href="/library/content">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0"
                                                                        title="View all content in Library"
                                                                        aria-label="View all content in Library"
                                                                    >
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {index < recentContent.length - 1 && (
                                                <Separator className="mt-4" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
                {recentContent.length > 0 && (
                    <div className="p-4 border-t">
                        <Link href="/library/content">
                            <Button variant="outline" className="w-full" size="sm">
                                View All Content
                                <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}