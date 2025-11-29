/**
 * Alert Performance Monitor
 * 
 * Provides performance monitoring and optimization insights for alert queries.
 * Only visible in development mode.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Activity,
    Clock,
    Database,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Zap,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { performanceMonitor } from '@/lib/alerts/query-optimization';
import { alertCache } from '@/lib/alerts/cache';

interface PerformanceMonitorProps {
    className?: string;
}

/**
 * Performance Monitor Component
 * Shows query performance metrics and cache statistics
 */
export function AlertPerformanceMonitor({ className }: PerformanceMonitorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [metrics, setMetrics] = useState<any>({});
    const [cacheStats, setCacheStats] = useState<any>({});

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    useEffect(() => {
        const updateMetrics = () => {
            setMetrics(performanceMonitor.getMetrics());
            setCacheStats(alertCache.getStats());
        };

        updateMetrics();
        const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    const handleReset = () => {
        performanceMonitor.reset();
        alertCache.clear();
        setMetrics({});
        setCacheStats({ size: 0, maxSize: 1000, hitRate: 0, entries: [] });
    };

    return (
        <Card className={cn('border-dashed border-orange-200 bg-orange-50/50', className)}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-orange-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-orange-600" />
                                <CardTitle className="text-sm font-medium text-orange-800">
                                    Performance Monitor
                                </CardTitle>
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                    DEV
                                </Badge>
                            </div>
                            {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-orange-600" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-orange-600" />
                            )}
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-semibold text-green-600">
                                    {cacheStats.size || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Cache Entries</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-semibold text-blue-600">
                                    {Object.keys(metrics).length}
                                </div>
                                <div className="text-xs text-muted-foreground">Query Types</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-semibold text-purple-600">
                                    {Object.values(metrics).reduce((sum: number, m: any) => sum + (m.count || 0), 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">Total Queries</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-semibold text-orange-600">
                                    {Object.values(metrics).reduce((sum: number, m: any) => sum + (m.avgLatency || 0), 0).toFixed(0)}ms
                                </div>
                                <div className="text-xs text-muted-foreground">Avg Latency</div>
                            </div>
                        </div>

                        {/* Query Performance */}
                        {Object.keys(metrics).length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-headline text-sm font-medium flex items-center gap-2">
                                    <Database className="w-4 h-4" />
                                    Query Performance
                                </h4>
                                <div className="space-y-2">
                                    {Object.entries(metrics).map(([strategy, data]: [string, any]) => (
                                        <div key={strategy} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {strategy.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-muted-foreground">
                                                    {data.count} queries
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-blue-500" />
                                                    <span>{data.avgLatency?.toFixed(0)}ms</span>
                                                </div>
                                                {data.errorRate > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                                        <span className="text-red-600">
                                                            {(data.errorRate * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cache Performance */}
                        {cacheStats.entries && cacheStats.entries.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-headline text-sm font-medium flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Cache Performance
                                </h4>
                                <div className="p-2 bg-white rounded border text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span>Cache Utilization</span>
                                        <span>{cacheStats.size} / {cacheStats.maxSize}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(cacheStats.size / cacheStats.maxSize) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Recent Cache Entries */}
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {cacheStats.entries.slice(0, 5).map((entry: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-1 bg-white rounded border text-xs">
                                            <span className="truncate flex-1 mr-2">
                                                {entry.key.split(':')[0]}...
                                            </span>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <span>{(entry.age / 1000).toFixed(0)}s ago</span>
                                                <span>TTL: {(entry.ttl / 1000).toFixed(0)}s</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Performance Recommendations */}
                        <div className="space-y-2">
                            <h4 className="font-headline text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Recommendations
                            </h4>
                            <div className="space-y-1 text-xs text-muted-foreground">
                                {cacheStats.size / cacheStats.maxSize > 0.8 && (
                                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                        <AlertCircle className="w-3 h-3 text-yellow-600" />
                                        <span>Cache is nearly full. Consider increasing cache size.</span>
                                    </div>
                                )}
                                {Object.values(metrics).some((m: any) => m.avgLatency > 200) && (
                                    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                                        <AlertCircle className="w-3 h-3 text-orange-600" />
                                        <span>Some queries are slow. Consider optimizing filters.</span>
                                    </div>
                                )}
                                {Object.values(metrics).some((m: any) => m.errorRate > 0.1) && (
                                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                                        <AlertCircle className="w-3 h-3 text-red-600" />
                                        <span>High error rate detected. Check query patterns.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                className="text-xs"
                            >
                                Reset Metrics
                            </Button>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}