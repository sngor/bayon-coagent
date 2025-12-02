'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, TrendingUp, Activity } from 'lucide-react';
import { OpenHouseSession } from '@/lib/open-house/types';
import { useSessionStats } from '@/hooks/use-session-stats';
import { cn } from '@/lib/utils/common';

/**
 * Active Session Monitor Component
 * 
 * Displays real-time statistics for active open house sessions
 * Validates Requirements: 11.1, 11.2
 */

interface ActiveSessionMonitorProps {
    session: OpenHouseSession;
    className?: string;
}

export function ActiveSessionMonitor({ session, className }: ActiveSessionMonitorProps) {
    const { stats, isLoading, error } = useSessionStats({
        sessionId: session.sessionId,
        initialSession: session,
        pollingInterval: 2000, // Poll every 2 seconds (Requirement 11.2)
        enabled: session.status === 'active',
    });

    // Don't show for non-active sessions
    if (!stats.isActive) {
        return null;
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header with live indicator */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Activity className="h-5 w-5 text-green-500" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold">Live Session Statistics</h3>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Active
                </Badge>
            </div>

            {/* Real-time Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Visitor Count */}
                <Card className={cn(
                    'transition-all duration-300',
                    isLoading && 'opacity-70'
                )}>
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Total Visitors
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stats.visitorCount}
                        </div>
                        {stats.visitorCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.visitorCount === 1 ? 'visitor' : 'visitors'} checked in
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* High Interest */}
                <Card className={cn(
                    'transition-all duration-300',
                    isLoading && 'opacity-70'
                )}>
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                            High Interest
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {stats.interestLevelDistribution.high}
                        </div>
                        {stats.visitorCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((stats.interestLevelDistribution.high / stats.visitorCount) * 100)}% of visitors
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Medium Interest */}
                <Card className={cn(
                    'transition-all duration-300',
                    isLoading && 'opacity-70'
                )}>
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-yellow-500" />
                            Medium Interest
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">
                            {stats.interestLevelDistribution.medium}
                        </div>
                        {stats.visitorCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((stats.interestLevelDistribution.medium / stats.visitorCount) * 100)}% of visitors
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Elapsed Time */}
                <Card className={cn(
                    'transition-all duration-300',
                    isLoading && 'opacity-70'
                )}>
                    <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Elapsed Time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {stats.elapsedTimeFormatted}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Since {session.actualStartTime && new Date(session.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Interest Level Distribution Bar */}
            {stats.visitorCount > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Interest Level Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {/* Visual bar */}
                            <div className="flex h-8 rounded-lg overflow-hidden">
                                {stats.interestLevelDistribution.high > 0 && (
                                    <div
                                        className="bg-green-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                                        style={{
                                            width: `${(stats.interestLevelDistribution.high / stats.visitorCount) * 100}%`,
                                        }}
                                    >
                                        {stats.interestLevelDistribution.high > 0 && (
                                            <span className="px-2">
                                                {stats.interestLevelDistribution.high}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {stats.interestLevelDistribution.medium > 0 && (
                                    <div
                                        className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                                        style={{
                                            width: `${(stats.interestLevelDistribution.medium / stats.visitorCount) * 100}%`,
                                        }}
                                    >
                                        {stats.interestLevelDistribution.medium > 0 && (
                                            <span className="px-2">
                                                {stats.interestLevelDistribution.medium}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {stats.interestLevelDistribution.low > 0 && (
                                    <div
                                        className="bg-gray-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
                                        style={{
                                            width: `${(stats.interestLevelDistribution.low / stats.visitorCount) * 100}%`,
                                        }}
                                    >
                                        {stats.interestLevelDistribution.low > 0 && (
                                            <span className="px-2">
                                                {stats.interestLevelDistribution.low}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-green-500" />
                                        <span className="text-muted-foreground">High</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                        <span className="text-muted-foreground">Medium</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-gray-500" />
                                        <span className="text-muted-foreground">Low</span>
                                    </div>
                                </div>
                                <span className="text-muted-foreground">
                                    {stats.visitorCount} total
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error state */}
            {error && (
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardContent className="pt-6">
                        <p className="text-sm text-red-600">
                            Unable to fetch real-time updates. Showing last known data.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Update indicator */}
            <div className="flex items-center justify-center">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className={cn(
                        'h-2 w-2 rounded-full',
                        isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                    )} />
                    {isLoading ? 'Updating...' : 'Updates every 2 seconds'}
                </p>
            </div>
        </div>
    );
}
