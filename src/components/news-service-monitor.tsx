'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, Clock, RefreshCw } from 'lucide-react';

interface CacheStats {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    pendingRequests: number;
}

export function NewsServiceMonitor() {
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const updateStats = async () => {
        try {
            const { newsService } = await import('@/services/analytics/news-service');
            const newStats = newsService.getCacheStats();
            setStats(newStats);
        } catch (error) {
            console.warn('Failed to get news service stats:', error);
        }
    };

    useEffect(() => {
        if (isVisible) {
            updateStats();
            const interval = setInterval(updateStats, 5000); // Update every 5 seconds
            return () => clearInterval(interval);
        }
    }, [isVisible]);

    // Only show in development or when explicitly enabled
    if (process.env.NODE_ENV === 'production' && !isVisible) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 opacity-50 hover:opacity-100"
            >
                <Activity className="h-4 w-4" />
            </Button>
        );
    }

    if (!isVisible) return null;

    return (
        <Card className="fixed bottom-4 right-4 w-80 shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        News Service Monitor
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsVisible(false)}
                    >
                        ×
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {stats ? (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-sm flex items-center gap-2">
                                <Database className="h-3 w-3" />
                                Cache Entries
                            </span>
                            <Badge variant="secondary">{stats.totalEntries}</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Valid Cache
                            </span>
                            <Badge variant={stats.validEntries > 0 ? "default" : "secondary"}>
                                {stats.validEntries}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Expired Cache</span>
                            <Badge variant={stats.expiredEntries > 0 ? "destructive" : "secondary"}>
                                {stats.expiredEntries}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Pending Requests</span>
                            <Badge variant={stats.pendingRequests > 0 ? "default" : "secondary"}>
                                {stats.pendingRequests}
                            </Badge>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={updateStats}
                            className="w-full flex items-center gap-2"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Refresh Stats
                        </Button>
                    </>
                ) : (
                    <div className="text-sm text-muted-foreground">Loading stats...</div>
                )}
            </CardContent>
        </Card>
    );
}