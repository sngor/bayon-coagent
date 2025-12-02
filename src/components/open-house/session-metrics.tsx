'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, TrendingUp, Calendar } from 'lucide-react';
import type { DashboardAnalytics } from '@/lib/open-house/types';

interface SessionMetricsProps {
    analytics: DashboardAnalytics;
}

export function SessionMetrics({ analytics }: SessionMetricsProps) {
    // Calculate interest level as a percentage (0-100)
    const interestLevelPercentage = (analytics.averageInterestLevel / 3) * 100;

    // Format interest level display
    const interestLevelDisplay = analytics.averageInterestLevel.toFixed(1);
    const interestLevelLabel =
        analytics.averageInterestLevel >= 2.5 ? 'High' :
            analytics.averageInterestLevel >= 1.5 ? 'Medium' : 'Low';

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalSessions}</div>
                    <p className="text-xs text-muted-foreground">
                        Open house events hosted
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalVisitors}</div>
                    <p className="text-xs text-muted-foreground">
                        Across all sessions
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Visitors/Session</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {analytics.averageVisitorsPerSession.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Per open house event
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Interest Level</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{interestLevelDisplay}/3.0</div>
                    <p className="text-xs text-muted-foreground">
                        {interestLevelLabel} engagement
                    </p>
                    <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${interestLevelPercentage}%` }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
