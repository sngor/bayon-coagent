/**
 * Offline Indicator Component
 * 
 * Displays connection status and offline queue information.
 * 
 * Requirements: 6.1, 6.5
 */

'use client';

import { WifiOff, Wifi, WifiLow, Cloud, CloudOff } from 'lucide-react';
import { useConnectivity } from '@/hooks/use-connectivity';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { cn } from '@/lib/utils';

export interface OfflineIndicatorProps {
    className?: string;
    showQueueCount?: boolean;
}

export function OfflineIndicator({
    className,
    showQueueCount = true,
}: OfflineIndicatorProps) {
    const { status, isOnline, isOffline, isSlow } = useConnectivity();
    const { queueSize } = useOfflineQueue();

    // Don't show anything if online and no queued operations
    if (isOnline && queueSize === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                isOffline && 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
                isSlow && 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
                isOnline && queueSize > 0 && 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                className
            )}
        >
            {/* Icon */}
            {isOffline && <WifiOff className="h-4 w-4" />}
            {isSlow && <WifiLow className="h-4 w-4" />}
            {isOnline && queueSize > 0 && <Cloud className="h-4 w-4 animate-pulse" />}

            {/* Status text */}
            <span>
                {isOffline && 'Offline'}
                {isSlow && 'Slow Connection'}
                {isOnline && queueSize > 0 && 'Syncing...'}
            </span>

            {/* Queue count */}
            {showQueueCount && queueSize > 0 && (
                <span className="ml-1 rounded-full bg-current/10 px-2 py-0.5 text-xs font-semibold">
                    {queueSize}
                </span>
            )}
        </div>
    );
}

export interface OfflineStatusBadgeProps {
    className?: string;
}

export function OfflineStatusBadge({ className }: OfflineStatusBadgeProps) {
    const { isOffline } = useConnectivity();

    if (!isOffline) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg',
                className
            )}
        >
            <CloudOff className="h-4 w-4" />
            <span>You're offline</span>
        </div>
    );
}
