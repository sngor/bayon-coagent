'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    BarChart3,
    FileText,
    Users,
    Plus,
    Sparkles,
    Target,
    TrendingUp,
    Clock,
    Settings,
    Wifi,
    BookOpen,
    Image,
    Share2,
    Zap,
    Search,
    Filter,
    RefreshCw,
    ArrowRight,
    PlayCircle,
    CheckCircle2,
    Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Empty state components with actionable guidance for new users
 * Following WCAG 2.1 AA accessibility standards
 */

interface EmptyStateProps {
    className?: string;
    onAction?: () => void;
    actionLabel?: string;
    secondaryAction?: () => void;
    secondaryActionLabel?: string;
}

export function EmptyCalendarState({ className, onAction, actionLabel = "Schedule Your First Post" }: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed border-2", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Calendar className="h-10 w-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Your Content Calendar is Empty</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Start building your content strategy by scheduling your first post.
                    Use AI-powered optimal timing to maximize engagement.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onAction} className="min-w-[180px]">
                        <Plus className="h-4 w-4 mr-2" />
                        {actionLabel}
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/studio/write', '_blank')}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create Content First
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>AI optimal timing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span>Multi-platform publishing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Performance tracking</span>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-blue-900 mb-1">Pro Tip</p>
                            <p className="text-sm text-blue-800">
                                Schedule content in batches to maintain consistent posting and save time.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function EmptyAnalyticsState({ className, onAction, actionLabel = "Connect Social Accounts" }: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed border-2", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <BarChart3 className="h-10 w-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">No Analytics Data Available</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Connect your social media accounts and publish content to start tracking
                    performance metrics, engagement rates, and ROI.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onAction} className="min-w-[180px]">
                        <Wifi className="h-4 w-4 mr-2" />
                        {actionLabel}
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/library/calendar', '_blank')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        View Calendar
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Engagement tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span>A/B testing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span>ROI analysis</span>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg max-w-md">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-green-900 mb-1">Getting Started</p>
                            <p className="text-sm text-green-800">
                                Analytics data will appear within 24 hours after your first post is published.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function EmptyTemplateLibraryState({
    className,
    onAction,
    actionLabel = "Create Your First Template",
    secondaryAction,
    secondaryActionLabel = "Browse Seasonal Templates"
}: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed border-2", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">No Templates Saved Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Save time by creating reusable templates for your most successful content formats.
                    Share templates with your team for consistent branding.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onAction} className="min-w-[180px]">
                        <Plus className="h-4 w-4 mr-2" />
                        {actionLabel}
                    </Button>
                    <Button variant="outline" onClick={secondaryAction}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {secondaryActionLabel}
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span>Quick content creation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span>Team collaboration</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <span>Brand consistency</span>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg max-w-md">
                    <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-purple-900 mb-1">Template Ideas</p>
                            <p className="text-sm text-purple-800">
                                Market updates, listing highlights, client testimonials, and seasonal campaigns.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function EmptyContentListState({
    className,
    onAction,
    actionLabel = "Create Your First Content"
}: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed border-2", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Image className="h-10 w-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">No Content Created Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Start creating engaging content for your real estate business.
                    Use AI-powered tools to generate blog posts, social media content, and more.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onAction} className="min-w-[180px]">
                        <Plus className="h-4 w-4 mr-2" />
                        {actionLabel}
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/studio', '_blank')}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Explore Studio
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>AI-powered writing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-primary" />
                        <span>Image enhancement</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-primary" />
                        <span>Multi-platform sharing</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function EmptySearchResultsState({
    className,
    searchQuery,
    onClearFilters,
    onRetry
}: {
    className?: string;
    searchQuery?: string;
    onClearFilters?: () => void;
    onRetry?: () => void;
}) {
    return (
        <Card className={cn("border-dashed border-2", className)}>
            <CardContent className="flex flex-col items-center justify-center py-12 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                    {searchQuery
                        ? `No results found for "${searchQuery}". Try adjusting your search terms or filters.`
                        : "No items match your current filters. Try adjusting your criteria."
                    }
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                    {onClearFilters && (
                        <Button variant="outline" onClick={onClearFilters}>
                            <Filter className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    )}
                    {onRetry && (
                        <Button variant="outline" onClick={onRetry}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function EmptyABTestsState({ className, onAction, actionLabel = "Create A/B Test" }: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed border-2", className)}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Target className="h-10 w-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">No A/B Tests Running</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Optimize your content performance by testing different variations.
                    Compare headlines, images, and messaging to find what works best.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button onClick={onAction} className="min-w-[180px]">
                        <Plus className="h-4 w-4 mr-2" />
                        {actionLabel}
                    </Button>
                    <Button variant="outline" onClick={() => window.open('/help/ab-testing', '_blank')}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Learn About A/B Testing
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl">
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span>Statistical significance</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Performance optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span>Data-driven decisions</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function NoConnectionsState({ className, onAction, actionLabel = "Connect Accounts" }: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed border-2", className)}>
            <CardContent className="flex flex-col items-center justify-center py-12 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <Wifi className="h-8 w-8 text-orange-600" />
                </div>

                <h3 className="text-lg font-semibold mb-2">No Social Media Accounts Connected</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                    Connect your social media accounts to start scheduling and publishing content
                    across multiple platforms.
                </p>

                <Button onClick={onAction} className="mb-4">
                    <Plus className="h-4 w-4 mr-2" />
                    {actionLabel}
                </Button>

                <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline">Facebook</Badge>
                    <Badge variant="outline">Instagram</Badge>
                    <Badge variant="outline">LinkedIn</Badge>
                    <Badge variant="outline">Twitter/X</Badge>
                </div>
            </CardContent>
        </Card>
    );
}