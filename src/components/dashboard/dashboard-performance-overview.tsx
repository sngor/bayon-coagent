'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui';
import { ContentSection, DataGrid } from '@/components/ui';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Target,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    BarChart3,
    Users,
    Search,
    Activity
} from 'lucide-react';
import type { Profile, MarketingPlan, BrandAudit, Competitor } from '@/lib/types/common';

interface DashboardPerformanceOverviewProps {
    agentProfile: Profile | null;
    latestPlan: MarketingPlan | null;
    brandAudit: BrandAudit | null;
    competitors: Competitor[];
    completionPercentage: number;
    isLoading: boolean;
}

export function DashboardPerformanceOverview({
    agentProfile,
    latestPlan,
    brandAudit,
    competitors,
    completionPercentage,
    isLoading
}: DashboardPerformanceOverviewProps) {
    const planStepsCount = useMemo(() => {
        return latestPlan?.steps?.length || 0;
    }, [latestPlan]);

    if (isLoading) {
        return <LoadingState variant="dashboard" count={1} className="mb-4" />;
    }

    return (
        <Card className="animate-fade-in-up animate-delay-150 border-0 shadow-xl bg-gradient-to-br from-card to-muted/20 overflow-hidden" role="region" aria-label="Performance Overview">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl" />
            <CardContent className="relative p-6 z-10">
                <ContentSection
                    title="Performance Overview"
                    description="Track your progress and key metrics"
                    icon={Activity}
                    className="bg-gradient-to-br to-muted/20"
                >
                    <div className="space-y-6">
                        {/* Profile Completion Card */}
                        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-purple-500/5 to-background p-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl" />
                            <div className="relative space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-semibold text-lg">Profile Completion</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                            {completionPercentage}%
                                        </span>
                                        {completionPercentage === 100 && (
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        )}
                                    </div>
                                </div>
                                <div className="relative">
                                    <Progress value={completionPercentage} className="h-3 bg-muted/50" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        {completionPercentage === 100 ? (
                                            <>
                                                <Sparkles className="w-4 h-4 text-green-500" />
                                                All features unlocked!
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-primary" />
                                                {9 - Math.ceil((completionPercentage / 100) * 9)} fields remaining
                                            </>
                                        )}
                                    </p>
                                    {completionPercentage < 100 && (
                                        <Button variant="ghost" size="sm" asChild className="text-xs">
                                            <Link href="/brand/profile">
                                                Complete Now
                                                <ArrowRight className="w-3 h-3 ml-1" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics Grid */}
                        <DataGrid columns={3} gap="spacious">
                            <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <Badge variant="secondary" className="text-xs">Active</Badge>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{planStepsCount}</div>
                                    <div className="text-sm font-medium mb-1">Strategy Tasks</div>
                                    <div className="text-xs text-muted-foreground">In your marketing plan</div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <Badge variant="secondary" className="text-xs">Tracking</Badge>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{competitors.length}</div>
                                    <div className="text-sm font-medium mb-1">Competitors</div>
                                    <div className="text-xs text-muted-foreground">Being monitored</div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <Badge
                                            variant={brandAudit ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            {brandAudit ? 'Done' : 'Pending'}
                                        </Badge>
                                    </div>
                                    <div className="text-3xl font-bold mb-1">
                                        {brandAudit ? '✓' : '—'}
                                    </div>
                                    <div className="text-sm font-medium mb-1">Brand Audit</div>
                                    <div className="text-xs text-muted-foreground">
                                        {brandAudit ? 'Completed' : 'Not started'}
                                    </div>
                                </div>
                            </div>
                        </DataGrid>
                    </div>
                </ContentSection>
            </CardContent>
        </Card>
    );
}