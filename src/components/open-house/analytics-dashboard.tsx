'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { getDashboardAnalytics } from '@/app/(app)/open-house/actions';
import type { DashboardAnalytics } from '@/lib/open-house/types';
import { SessionMetrics } from './session-metrics';
import { InterestLevelChart } from './interest-level-chart';
import { TimelineChart } from './timeline-chart';
import { ComparisonView } from './comparison-view';
import { DateRangeFilter } from './date-range-filter';

interface AnalyticsDashboardProps {
    initialFilters?: {
        startDate?: string;
        endDate?: string;
        status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
        propertyId?: string;
    };
}

export function AnalyticsDashboard({ initialFilters }: AnalyticsDashboardProps) {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState(initialFilters || {});

    useEffect(() => {
        loadAnalytics();
    }, [filters]);

    async function loadAnalytics() {
        setLoading(true);
        try {
            const result = await getDashboardAnalytics(filters);
            if (result.success && result.data) {
                setAnalytics(result.data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleFilterChange(newFilters: typeof filters) {
        setFilters(newFilters);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Failed to load analytics data. Please try again.</p>
            </div>
        );
    }

    // Show empty state if no sessions
    if (analytics.totalSessions === 0) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                No sessions yet
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                No visitors yet
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Visitors/Session</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                No data available
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Interest Level</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">-</div>
                            <p className="text-xs text-muted-foreground">
                                No data available
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Trends</CardTitle>
                        <CardDescription>
                            View your open house performance over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Create open house sessions to see analytics and trends.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Date Range Filter */}
            <DateRangeFilter
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            {/* Key Metrics */}
            <SessionMetrics analytics={analytics} />

            {/* Interest Level Distribution */}
            <InterestLevelChart analytics={analytics} />

            {/* Visitor Timeline Trends */}
            <TimelineChart analytics={analytics} />

            {/* Property Comparison */}
            <ComparisonView analytics={analytics} />
        </div>
    );
}
