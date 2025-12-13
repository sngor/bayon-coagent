'use client';

import React from 'react';
import { EnhancedCard, MetricCard, FeatureCard } from '@/components/ui/enhanced-card';
import { EnhancedBreadcrumbs } from '@/components/ui/enhanced-breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    Users,
    Target,
    Star,
    ArrowRight,
    Sparkles,
    BarChart3,
    MessageSquare,
    PenTool,
    Search,
    Calculator,
    CheckCircle2,
    AlertCircle,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/common';

interface DashboardOverviewProps {
    profile: any;
    completionPercentage: number;
    metrics: {
        totalReviews: number;
        averageRating: string;
        recentReviewsCount: number;
        planStepsCount: number;
        competitorsCount: number;
    };
    className?: string;
}

export function DashboardOverview({
    profile,
    completionPercentage,
    metrics,
    className
}: DashboardOverviewProps) {
    const firstName = profile?.name ? profile.name.split(' ')[0] : 'there';
    const isProfileComplete = completionPercentage === 100;

    // Get time-based greeting
    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className={cn("space-y-8", className)}>
            {/* Breadcrumbs */}
            <EnhancedBreadcrumbs showHome={false} />

            {/* Welcome Section */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent rounded-3xl blur-3xl" />

                <EnhancedCard
                    variant="feature"
                    size="lg"
                    className="relative border-primary/20"
                >
                    <div className="flex flex-col lg:flex-row items-start gap-8">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold font-headline mb-2">
                                    {getTimeOfDayGreeting()}, {firstName}! 👋
                                </h1>
                                <p className="text-lg text-muted-foreground">
                                    {isProfileComplete
                                        ? "Your profile is complete and all AI features are unlocked. Ready to dominate your market?"
                                        : `You're ${completionPercentage}% of the way there. Complete your profile to unlock personalized AI strategies and market insights.`
                                    }
                                </p>
                            </div>

                            {/* Profile Completion */}
                            {!isProfileComplete && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Profile Completion</span>
                                        <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
                                    </div>
                                    <Progress value={completionPercentage} className="h-3" />
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button asChild size="lg" className="shadow-md">
                                            <Link href="/brand/profile">
                                                <Target className="w-5 h-5 mr-2" />
                                                Complete Profile
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="lg" asChild>
                                            <Link href="/assistant">
                                                <MessageSquare className="w-5 h-5 mr-2" />
                                                Get AI Help
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Success State */}
                            {isProfileComplete && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button asChild size="lg" className="shadow-md">
                                        <Link href="/studio/write">
                                            <PenTool className="w-5 h-5 mr-2" />
                                            Create Content
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" asChild>
                                        <Link href="/research/agent">
                                            <Search className="w-5 h-5 mr-2" />
                                            Research Market
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Profile completion visual indicator */}
                        <div className="flex-shrink-0">
                            <div className="relative w-32 h-32">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20" />
                                <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                                    {isProfileComplete ? (
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
                                            <div className="text-xs text-muted-foreground">Complete</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </EnhancedCard>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Reviews"
                    value={metrics.totalReviews}
                    change={`${metrics.recentReviewsCount} this month`}
                    changeType="positive"
                    icon={Star}
                />

                <MetricCard
                    title="Average Rating"
                    value={`${metrics.averageRating}★`}
                    change="Excellent rating"
                    changeType="positive"
                    icon={TrendingUp}
                />

                <MetricCard
                    title="Strategy Tasks"
                    value={metrics.planStepsCount}
                    change="Active in plan"
                    changeType="neutral"
                    icon={BarChart3}
                />

                <MetricCard
                    title="Competitors"
                    value={metrics.competitorsCount}
                    change="Being tracked"
                    changeType="neutral"
                    icon={Users}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-headline">Quick Actions</h2>
                    <Badge variant="secondary" className="text-xs">
                        Most Used
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        title="Write Content"
                        description="Create blog posts, social media, and market updates with AI"
                        icon={PenTool}
                        onClick={() => window.location.href = '/studio/write'}
                    />

                    <FeatureCard
                        title="Research Agent"
                        description="Get comprehensive market research and insights instantly"
                        icon={Search}
                        onClick={() => window.location.href = '/research/agent'}
                    />

                    <FeatureCard
                        title="Deal Calculator"
                        description="Analyze mortgage payments and investment returns"
                        icon={Calculator}
                        onClick={() => window.location.href = '/tools/calculator'}
                    />
                </div>
            </div>

            {/* Performance Overview */}
            <EnhancedCard
                title="Performance Overview"
                description="Track your progress and key metrics"
                icon={Activity}
                variant="elevated"
                actions={
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/brand/audit">
                            View Full Report
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 rounded-xl bg-muted/30">
                        <div className="text-2xl font-bold text-primary mb-1">
                            {isProfileComplete ? '100%' : `${completionPercentage}%`}
                        </div>
                        <div className="text-sm text-muted-foreground">Profile Complete</div>
                    </div>

                    <div className="text-center p-4 rounded-xl bg-muted/30">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                            {metrics.averageRating}★
                        </div>
                        <div className="text-sm text-muted-foreground">Average Rating</div>
                    </div>

                    <div className="text-center p-4 rounded-xl bg-muted/30">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                            {metrics.competitorsCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Competitors Tracked</div>
                    </div>
                </div>
            </EnhancedCard>
        </div>
    );
}