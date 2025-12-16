'use client';

/**
 * Live Status Indicator Component
 * Shows real-time status updates for content, projects, and system events
 */

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    X,
    Eye,
    EyeOff
} from 'lucide-react';
import { useLiveUpdates, LiveUpdate, ContentStatus } from '@/hooks/use-live-updates';
import { cn } from '@/lib/utils';

interface LiveStatusIndicatorProps {
    contentId?: string;
    resourceType?: 'content' | 'project' | 'user' | 'system';
    resourceId?: string;
    showProgress?: boolean;
    showRecentUpdates?: boolean;
    className?: string;
}

export function LiveStatusIndicator({
    contentId,
    resourceType = 'content',
    resourceId,
    showProgress = true,
    showRecentUpdates = false,
    className
}: LiveStatusIndicatorProps) {
    const {
        isConnected,
        contentStatuses,
        getContentStatus,
        recentUpdates,
        onLiveUpdate
    } = useLiveUpdates();

    const [isVisible, setIsVisible] = useState(true);
    const [recentUpdate, setRecentUpdate] = useState<LiveUpdate | null>(null);

    const targetResourceId = contentId || resourceId;
    const contentStatus = contentId ? getContentStatus(contentId) : null;

    // Listen for updates to this specific resource
    useEffect(() => {
        if (!targetResourceId) return;

        const unsubscribe = onLiveUpdate((update) => {
            if (update.resourceType === resourceType && update.resourceId === targetResourceId) {
                setRecentUpdate(update);

                // Auto-hide recent update after 5 seconds
                setTimeout(() => {
                    setRecentUpdate(null);
                }, 5000);
            }
        });

        return unsubscribe;
    }, [targetResourceId, resourceType, onLiveUpdate]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'published':
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'generating':
            case 'processing':
            case 'uploading':
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
            case 'pending':
            case 'queued':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'published':
            case 'success':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'failed':
            case 'error':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'generating':
            case 'processing':
            case 'uploading':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending':
            case 'queued':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatStatus = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, ' $1');
    };

    if (!isVisible || (!contentStatus && !recentUpdate && !showRecentUpdates)) {
        return null;
    }

    return (
        <div className={cn("space-y-2", className)}>
            {/* Connection Status */}
            {!isConnected && (
                <Badge variant="outline" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Offline
                </Badge>
            )}

            {/* Content Status */}
            {contentStatus && (
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(contentStatus.status)}
                                <span className="text-sm font-medium">
                                    {formatStatus(contentStatus.status)}
                                </span>
                                {contentStatus.stage && (
                                    <Badge variant="outline" className="text-xs">
                                        {contentStatus.stage}
                                    </Badge>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setIsVisible(false)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>

                        {showProgress && contentStatus.progress > 0 && (
                            <div className="space-y-1">
                                <Progress value={contentStatus.progress} className="h-2" />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{contentStatus.progress}% complete</span>
                                    {contentStatus.metadata?.estimatedCompletion && (
                                        <span>
                                            ~{Math.round((contentStatus.metadata.estimatedCompletion - Date.now()) / 1000)}s remaining
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {contentStatus.error && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                {contentStatus.error}
                            </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                            Last updated: {new Date(contentStatus.lastUpdated).toLocaleTimeString()}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Update Notification */}
            {recentUpdate && (
                <Card className={cn(
                    "border-l-4 animate-in slide-in-from-right-5",
                    getStatusColor(recentUpdate.status)
                )}>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(recentUpdate.status)}
                                <div>
                                    <div className="text-sm font-medium">
                                        {formatStatus(recentUpdate.status)}
                                    </div>
                                    {recentUpdate.metadata?.stage && (
                                        <div className="text-xs opacity-70">
                                            {recentUpdate.metadata.stage}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setRecentUpdate(null)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>

                        {recentUpdate.progress !== undefined && (
                            <Progress value={recentUpdate.progress} className="h-1 mt-2" />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recent Updates List */}
            {showRecentUpdates && recentUpdates.length > 0 && (
                <Card>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Recent Updates</h4>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setIsVisible(!isVisible)}
                            >
                                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                        </div>

                        {isVisible && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {recentUpdates.slice(0, 10).map((update, index) => (
                                    <div key={`${update.resourceId}-${update.timestamp}`} className="flex items-center gap-2 text-xs">
                                        {getStatusIcon(update.status)}
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate">
                                                {update.resourceType} {update.resourceId.slice(-8)}
                                            </div>
                                            <div className="text-gray-500">
                                                {formatStatus(update.status)}
                                            </div>
                                        </div>
                                        <div className="text-gray-400">
                                            {new Date(update.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}