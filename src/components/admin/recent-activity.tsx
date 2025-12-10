'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import {
    Clock,
    Users,
    ArrowRight,
    MoreHorizontal,
    Activity,
} from 'lucide-react';
import { AdminActivity } from '@/types/admin';
import { ADMIN_CONFIG } from '@/lib/admin-config';

interface RecentActivityProps {
    activities: AdminActivity[];
    isLoading: boolean;
}

function ActivitySkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: ADMIN_CONFIG.ACTIVITY_SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <div className="mx-auto mb-4 p-3 bg-muted/50 rounded-full w-fit">
                <Clock className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">No recent activity to show</p>
            <p className="text-xs mt-1 max-w-sm mx-auto">
                Activity will appear here as team members interact with the platform.
                Check back later or refresh to see updates.
            </p>
        </div>
    );
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
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
                                <CardDescription>Latest team events and actions</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs font-medium">
                                {activities.length} Events
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/users/activity" className="gap-2">
                                    View All
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    {isLoading ? (
                        <ActivitySkeleton />
                    ) : activities.length > 0 ? (
                        <div className="space-y-1">
                            {activities.slice(0, ADMIN_CONFIG.MAX_ACTIVITY_ITEMS).map((activity, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{activity.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                            <div className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted">
                                                {activity.type || 'Action'}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}