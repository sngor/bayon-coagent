'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Wifi,
    WifiOff,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Cloud,
    CloudOff
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { offlineContentManager, OfflineIndicatorData } from '@/lib/offline-content-manager';
import { offlineSyncManager } from '@/lib/offline-sync-manager';

export interface OfflineStatusIndicatorProps {
    className?: string;
    compact?: boolean;
    showDetails?: boolean;
    onSyncTrigger?: () => void;
}

/**
 * Offline Status Indicator Component
 * 
 * Displays offline/online status, pending sync count, and provides manual sync trigger
 */
export function OfflineStatusIndicator({
    className,
    compact = false,
    showDetails = false,
    onSyncTrigger
}: OfflineStatusIndicatorProps) {
    const [indicatorData, setIndicatorData] = useState<OfflineIndicatorData>({
        isOffline: false,
        pendingSyncCount: 0,
        failedSyncCount: 0,
        conflictCount: 0,
    });
    const [isManualSyncing, setIsManualSyncing] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

    // Update indicator data
    const updateIndicatorData = async () => {
        try {
            const data = await offlineContentManager.getOfflineIndicatorData();
            setIndicatorData(data);
            setLastUpdateTime(new Date());
        } catch (error) {
            console.error('Failed to update offline indicator data:', error);
        }
    };

    // Initialize and set up listeners
    useEffect(() => {
        updateIndicatorData();

        // Set up connectivity listener
        const unsubscribeConnectivity = offlineSyncManager.onConnectivityChange(() => {
            updateIndicatorData();
        });

        // Set up sync progress listener
        const unsubscribeSyncProgress = offlineSyncManager.onSyncProgress(() => {
            updateIndicatorData();
        });

        // Update data periodically
        const interval = setInterval(updateIndicatorData, 30000); // Every 30 seconds

        return () => {
            unsubscribeConnectivity();
            unsubscribeSyncProgress();
            clearInterval(interval);
        };
    }, []);

    // Handle manual sync trigger
    const handleManualSync = async () => {
        if (indicatorData.isOffline) {
            return;
        }

        setIsManualSyncing(true);

        try {
            await offlineContentManager.forceSyncAllContent();
            await offlineSyncManager.forceSyncPendingOperations();
            await updateIndicatorData();

            if (onSyncTrigger) {
                onSyncTrigger();
            }
        } catch (error) {
            console.error('Manual sync failed:', error);
        } finally {
            setIsManualSyncing(false);
        }
    };

    // Get status color and icon
    const getStatusInfo = () => {
        if (indicatorData.isOffline) {
            return {
                color: 'destructive' as const,
                icon: WifiOff,
                text: 'Offline',
                description: 'Working offline. Changes will sync when online.'
            };
        }

        if (indicatorData.conflictCount > 0) {
            return {
                color: 'destructive' as const,
                icon: AlertTriangle,
                text: 'Conflicts',
                description: `${indicatorData.conflictCount} sync conflicts need resolution`
            };
        }

        if (indicatorData.failedSyncCount > 0) {
            return {
                color: 'destructive' as const,
                icon: AlertTriangle,
                text: 'Sync Failed',
                description: `${indicatorData.failedSyncCount} items failed to sync`
            };
        }

        if (indicatorData.pendingSyncCount > 0) {
            return {
                color: 'secondary' as const,
                icon: Clock,
                text: 'Syncing',
                description: `${indicatorData.pendingSyncCount} items pending sync`
            };
        }

        return {
            color: 'default' as const,
            icon: CheckCircle,
            text: 'Online',
            description: 'All changes synced'
        };
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    // Compact view
    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0 relative",
                                className
                            )}
                            onClick={handleManualSync}
                            disabled={indicatorData.isOffline || isManualSyncing}
                        >
                            {isManualSyncing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <StatusIcon className={cn(
                                    "h-4 w-4",
                                    statusInfo.color === 'destructive' && "text-destructive",
                                    statusInfo.color === 'secondary' && "text-muted-foreground"
                                )} />
                            )}

                            {(indicatorData.pendingSyncCount > 0 || indicatorData.failedSyncCount > 0) && (
                                <Badge
                                    variant={statusInfo.color}
                                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                                >
                                    {indicatorData.pendingSyncCount + indicatorData.failedSyncCount}
                                </Badge>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="text-sm">
                            <div className="font-medium">{statusInfo.text}</div>
                            <div className="text-muted-foreground">{statusInfo.description}</div>
                            {!indicatorData.isOffline && (
                                <div className="text-xs mt-1">Click to sync now</div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Full view
    return (
        <Card className={cn("w-full", className)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                            {isManualSyncing ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                                <StatusIcon className={cn(
                                    "h-5 w-5",
                                    statusInfo.color === 'destructive' && "text-destructive",
                                    statusInfo.color === 'secondary' && "text-muted-foreground"
                                )} />
                            )}

                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">{statusInfo.text}</span>
                                    {indicatorData.isOffline ? (
                                        <CloudOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Cloud className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {statusInfo.description}
                                </div>
                            </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center space-x-2">
                            {indicatorData.pendingSyncCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {indicatorData.pendingSyncCount} pending
                                </Badge>
                            )}

                            {indicatorData.failedSyncCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {indicatorData.failedSyncCount} failed
                                </Badge>
                            )}

                            {indicatorData.conflictCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {indicatorData.conflictCount} conflicts
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Manual sync button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualSync}
                        disabled={indicatorData.isOffline || isManualSyncing}
                        className="flex items-center space-x-2"
                    >
                        {isManualSyncing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Syncing...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                <span>Sync Now</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Detailed information */}
                {showDetails && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">Connection Status</div>
                                <div className="flex items-center space-x-1">
                                    {indicatorData.isOffline ? (
                                        <>
                                            <WifiOff className="h-4 w-4 text-destructive" />
                                            <span>Offline</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wifi className="h-4 w-4 text-green-600" />
                                            <span>Online</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="text-muted-foreground">Last Updated</div>
                                <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{lastUpdateTime.toLocaleTimeString()}</span>
                                </div>
                            </div>

                            {indicatorData.lastSyncAt && (
                                <div>
                                    <div className="text-muted-foreground">Last Sync</div>
                                    <div>
                                        {new Date(indicatorData.lastSyncAt).toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {indicatorData.nextSyncAttempt && (
                                <div>
                                    <div className="text-muted-foreground">Next Sync Attempt</div>
                                    <div>
                                        {new Date(indicatorData.nextSyncAttempt).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Simple offline indicator for use in headers or toolbars
 */
export function SimpleOfflineIndicator({ className }: { className?: string }) {
    const [isOffline, setIsOffline] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const updateStatus = async () => {
            try {
                const data = await offlineContentManager.getOfflineIndicatorData();
                setIsOffline(data.isOffline);
                setPendingCount(data.pendingSyncCount + data.failedSyncCount);
            } catch (error) {
                console.error('Failed to update simple offline indicator:', error);
            }
        };

        updateStatus();

        const unsubscribe = offlineSyncManager.onConnectivityChange(() => {
            updateStatus();
        });

        const interval = setInterval(updateStatus, 60000); // Every minute

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    if (!isOffline && pendingCount === 0) {
        return null;
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            {isOffline ? (
                <div className="flex items-center space-x-1 text-destructive">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">Offline</span>
                </div>
            ) : pendingCount > 0 ? (
                <div className="flex items-center space-x-1 text-muted-foreground">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm">{pendingCount} syncing</span>
                </div>
            ) : null}
        </div>
    );
}

/**
 * Hook for using offline status in components
 */
export function useOfflineStatus() {
    const [status, setStatus] = useState<OfflineIndicatorData>({
        isOffline: false,
        pendingSyncCount: 0,
        failedSyncCount: 0,
        conflictCount: 0,
    });

    useEffect(() => {
        const updateStatus = async () => {
            try {
                const data = await offlineContentManager.getOfflineIndicatorData();
                setStatus(data);
            } catch (error) {
                console.error('Failed to update offline status:', error);
            }
        };

        updateStatus();

        const unsubscribe = offlineSyncManager.onConnectivityChange(() => {
            updateStatus();
        });

        const interval = setInterval(updateStatus, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return status;
}