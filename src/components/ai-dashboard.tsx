'use client';

/**
 * AI-Powered Dashboard Component
 * 
 * Displays personalized content based on user behavior and AI recommendations.
 * Includes priority actions, market insights, and next best action suggestions.
 * 
 * Requirements: 27.2, 27.8, 27.9
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Sparkles,
    ArrowRight,
    TrendingUp,
    AlertCircle,
    Lightbulb,
    Target,
    Clock,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getPersonalizedDashboardAction } from '@/app/actions';
import type {
    PersonalizedDashboard,
    PriorityAction,
    MarketInsight
} from '@/lib/ai-personalization';
import { cn } from '@/lib/utils';

interface AIDashboardProps {
    userId: string;
    userName?: string;
}

/**
 * Gets time of day greeting
 */
function getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
}

/**
 * Priority badge variant based on priority level
 */
function getPriorityVariant(priority: 'high' | 'medium' | 'low') {
    switch (priority) {
        case 'high':
            return 'destructive';
        case 'medium':
            return 'default';
        case 'low':
            return 'secondary';
    }
}

/**
 * Icon for market insight category
 */
function getInsightIcon(category: 'opportunity' | 'warning' | 'trend' | 'tip') {
    switch (category) {
        case 'opportunity':
            return <Target className="h-5 w-5" />;
        case 'warning':
            return <AlertCircle className="h-5 w-5" />;
        case 'trend':
            return <TrendingUp className="h-5 w-5" />;
        case 'tip':
            return <Lightbulb className="h-5 w-5" />;
    }
}

/**
 * Color for market insight category
 */
function getInsightColor(category: 'opportunity' | 'warning' | 'trend' | 'tip') {
    switch (category) {
        case 'opportunity':
            return 'text-green-600 dark:text-green-400';
        case 'warning':
            return 'text-amber-600 dark:text-amber-400';
        case 'trend':
            return 'text-blue-600 dark:text-blue-400';
        case 'tip':
            return 'text-purple-600 dark:text-purple-400';
    }
}

/**
 * Loading skeleton for AI dashboard
 */
function AIDashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Greeting skeleton */}
            <Skeleton className="h-12 w-64" />

            {/* Priority actions skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Market insights skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="p-4 space-y-2">
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * AI-Powered Dashboard Component
 */
export function AIDashboard({ userId, userName }: AIDashboardProps) {
    const [dashboardData, setDashboardData] = useState<PersonalizedDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            try {
                setIsLoading(true);
                setError(null);

                const result = await getPersonalizedDashboardAction();

                if (result.errors || !result.data) {
                    setError(result.message || 'Unable to load personalized recommendations.');
                } else {
                    setDashboardData(result.data);
                }
            } catch (err) {
                console.error('Failed to load AI dashboard:', err);
                setError('Unable to load personalized recommendations. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboard();
    }, [userId]);

    if (isLoading) {
        return <AIDashboardSkeleton />;
    }

    if (error) {
        return (
            <Card className="border-destructive/50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!dashboardData) {
        return null;
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {/* AI-powered greeting */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-2"
            >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Good {getTimeOfDay()}{userName ? `, ${userName}` : ''}
                </h2>
                <p className="text-muted-foreground">
                    Here's what AI recommends for you today
                </p>
            </motion.div>

            {/* AI-curated priority actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-600">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">AI-Recommended Actions</CardTitle>
                                <CardDescription>Personalized priorities based on your goals</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {dashboardData.priorityActions.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.priorityActions.map((action, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1, duration: 0.3 }}
                                    >
                                        <Link href={action.href}>
                                            <div className="group flex items-start gap-3 p-4 rounded-lg border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-300 hover:shadow-md">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors">
                                                            {action.title}
                                                        </h4>
                                                        <Badge variant={getPriorityVariant(action.priority)} className="text-xs">
                                                            {action.priority}
                                                        </Badge>
                                                        {action.estimatedTime && (
                                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {action.estimatedTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-foreground/90">
                                                        {action.description}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground italic">
                                                        {action.reason}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No priority actions at this time</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Market insights */}
            {dashboardData.marketInsights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Market Insights
                            </CardTitle>
                            <CardDescription>AI-powered insights for your market</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {dashboardData.marketInsights.map((insight, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.15, duration: 0.3 }}
                                        className={cn(
                                            "p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md",
                                            insight.category === 'opportunity' && "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
                                            insight.category === 'warning' && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
                                            insight.category === 'trend' && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
                                            insight.category === 'tip' && "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn("flex-shrink-0 mt-0.5", getInsightColor(insight.category))}>
                                                {getInsightIcon(insight.category)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-sm md:text-base">
                                                        {insight.title}
                                                    </h4>
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {insight.category}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {insight.description}
                                                </p>
                                                {insight.relatedFeatures && insight.relatedFeatures.length > 0 && (
                                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                        <span className="text-xs text-muted-foreground">Related:</span>
                                                        {insight.relatedFeatures.map((feature, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Suggested content */}
            {dashboardData.suggestedContent.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Suggested Content</CardTitle>
                            <CardDescription>Content types that work well for you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {dashboardData.suggestedContent.map((content, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1, duration: 0.3 }}
                                    >
                                        <Link href="/content-engine">
                                            <div className="group p-4 rounded-lg border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all duration-300 hover:shadow-md">
                                                <h4 className="font-semibold text-sm md:text-base group-hover:text-primary transition-colors">
                                                    {content.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {content.description}
                                                </p>
                                                <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span>Create now</span>
                                                    <ArrowRight className="h-3 w-3" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Next best actions */}
            {dashboardData.nextBestActions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">What's Next?</CardTitle>
                            <CardDescription className="text-xs">Based on your workflow patterns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dashboardData.nextBestActions.map((action, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/50 transition-colors"
                                    >
                                        <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                                        <div>
                                            <span className="font-medium">{action.action}</span>
                                            <span className="text-muted-foreground text-xs ml-2">
                                                {action.context}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
