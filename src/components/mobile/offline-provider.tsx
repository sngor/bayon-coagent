/**
 * Offline Provider Component
 * 
 * Initializes offline queue and connectivity monitoring for the application.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { offlineQueue } from '@/lib/mobile/offline-queue';
import { connectivityMonitor } from '@/lib/mobile/connectivity-monitor';
import { useToast } from '@/hooks/use-toast';

export interface OfflineProviderProps {
    children: ReactNode;
    enableAutoSync?: boolean;
    enableNotifications?: boolean;
}

export function OfflineProvider({
    children,
    enableAutoSync = true,
    enableNotifications = true,
}: OfflineProviderProps) {
    const { toast } = useToast();

    useEffect(() => {
        // Initialize offline queue
        const initQueue = async () => {
            try {
                await offlineQueue.init();
                console.log('[OfflineProvider] Offline queue initialized');
            } catch (error) {
                console.error('[OfflineProvider] Failed to initialize offline queue:', error);
            }
        };

        initQueue();

        // Configure connectivity monitor
        connectivityMonitor.setAutoSync(enableAutoSync);

        // Subscribe to connection status changes
        const unsubscribe = connectivityMonitor.onStatusChange((info) => {
            if (enableNotifications) {
                if (info.status === 'offline') {
                    toast({
                        title: "You're offline",
                        description: "Your changes will be saved and synced when you're back online.",
                        variant: 'default',
                    });
                } else if (info.status === 'online') {
                    toast({
                        title: "You're back online",
                        description: 'Syncing your offline changes...',
                        variant: 'default',
                    });
                }
            }
        });

        // Subscribe to sync conflicts
        const handleSyncConflict = (event: CustomEvent) => {
            if (enableNotifications) {
                toast({
                    title: 'Sync Conflict Resolved',
                    description: 'Your changes were applied using last-write-wins strategy.',
                    variant: 'default',
                });
            }
        };

        window.addEventListener('sync-conflict', handleSyncConflict as EventListener);

        // Cleanup
        return () => {
            unsubscribe();
            window.removeEventListener('sync-conflict', handleSyncConflict as EventListener);
        };
    }, [enableAutoSync, enableNotifications, toast]);

    // Request notification permission on mount
    useEffect(() => {
        if (enableNotifications && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then((permission) => {
                    console.log('[OfflineProvider] Notification permission:', permission);
                });
            }
        }
    }, [enableNotifications]);

    return <>{children}</>;
}
