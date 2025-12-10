/**
 * Research Agent Dashboard Component
 * 
 * Integrates with Research Hub → Research Agent section
 * Provides comprehensive research management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Brain, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { StrandsResearchForm } from './strands-research-form';
import { useStrandsResearch } from '@/hooks/use-strands-research';
import { getResearchHistoryAction } from '@/app/strands-actions';
import { cn } from '@/lib/utils';

interface ResearchDashboardProps {
    className?: string;
}

interface ResearchHistoryItem {
    id: string;
    title: string;
    createdAt: string;
    source: string;
}

export function ResearchAgentDashboard({ className }: ResearchDashboardProps) {
    const [recentResearch, setRecentResearch] = useState<ResearchHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const { isHealthy, checkHealth } = useStrandsResearch();

    // Memoized load function to prevent unnecessary re-renders
    const loadRecentResearch = useCallback(async () => {
        try {
            setIsLoadingHistory(true);
            const result = await getResearchHistoryAction(5);
            if (result.success && result.data) {
                setRecentResearch(result.data);
            }
        } catch (error) {
            console.error('Failed to load research history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    // Load recent research on mount
    useEffect(() => {
        loadRecentResearch();
        checkHealth(); // Check agent health
    }, [loadRecentResearch, checkHealth]);



    const handleResearchComplete = (result: any) => {
        // Refresh recent research when new research is completed
        loadRecentResearch();

        // Navigate to the report if saved to library
        if (result.reportId) {
            // This would integrate with the Library Hub navigation
            window.location.href = `/library/reports/${result.reportId}`;
        }
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Badge variant={isHealthy ? "default" : "destructive"}>
                                {isHealthy === null ? "Checking..." : isHealthy ? "Online" : "Offline"}
                            </Badge>
                            {isHealthy === false && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{recentResearch.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Last 30 days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Performance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">~2min</div>
                        <p className="text-xs text-muted-foreground">
                            Avg. research time
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Interface */}
            <Tabs defaultValue="research" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="research">New Research</TabsTrigger>
                    <TabsTrigger value="recent">Recent Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="research" className="space-y-4">
                    <StrandsResearchForm
                        onResult={handleResearchComplete}
                        className="max-w-4xl"
                    />
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Research Reports</CardTitle>
                            <CardDescription>
                                Your latest research reports and analyses
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingHistory ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                                    ))}
                                </div>
                            ) : recentResearch.length > 0 ? (
                                <div className="space-y-3">
                                    {recentResearch.map((report) => (
                                        <div
                                            key={report.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <h4 className="font-medium">{report.title}</h4>
                                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {report.source}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.location.href = `/library/reports/${report.id}`}
                                            >
                                                View Report
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No research reports yet</p>
                                    <p className="text-sm">Start your first research above</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}