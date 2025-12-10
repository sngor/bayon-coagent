'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, Users } from 'lucide-react';
import { AdminActivity } from '@/types/admin';

interface AdminActivityFeedProps {
    activities: AdminActivity[];
    isLoading?: boolean;
}

export function AdminActivityFeed({ activities, isLoading = false }: AdminActivityFeedProps) {
    // Memoize the formatted activities to prevent unnecessary re-renders
    const formattedActivities = useMemo(() =>
        activities.slice(0, 8).map((activity, index) => ({
            ...activity,
            formattedTime: new Date(activity.timestamp).toLocaleString(),
            key: `${activity.id}-${index}` // Stable key for React
        })),
        [activities]
    );

    if (isLoading) {
        return (
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Recent Activity</CardTitle>
                                <CardDescription>Loading latest platform events...</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-pulse">
                                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                    <div className="flex-1 space-y-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden bg-background/50 border-primary/20">
            <CardGradientMesh>
                <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Recent Activity</CardTitle>
                                <CardDescription>Latest platform events and actions</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/users/activity">
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    {formattedActivities.length > 0 ? (
                        <div className="space-y-3">
                            {formattedActivities.map((activity) => (
                                <div
                                    key={activity.key}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                            <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {activity.formattedTime}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No recent activity to show</p>
                            <p className="text-xs mt-1">Activity will appear here as users interact with the platform</p>
                        </div>
                    )}
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}