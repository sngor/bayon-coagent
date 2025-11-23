/**
 * React hook for background sync functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { backgroundSyncManager, BackgroundSyncEvent } from '@/lib/background-sync-manager';

export interface BackgroundSyncStatus {
    isSupported: boolean;
    isAvailable: boolean;
    isRegistered: boolean;
    lastSyncEvent?: BackgroundSyncEvent;
}

export function useBackgroundSync() {
    const [status, setStatus] = useState<BackgroundSyncStatus>({
        isSupported: false,
        isAvailable: false,
        isRegistered: false
    });

    const [syncEvents, setSyncEvents] = useState<BackgroundSyncEvent[]>([]);

    // Handle background sync events
    const handleBackgroundSyncEvent = useCallback((event: BackgroundSyncEvent) => {
        setStatus(prev => ({
            ...prev,
            lastSyncEvent: event
        }));

        setSyncEvents(prev => [...prev.slice(-9), event]); // Keep last 10 events
    }, []);

    // Initialize background sync
    useEffect(() => {
        const updateStatus = async () => {
            const registrationStatus = await backgroundSyncManager.getRegistrationStatus();

            setStatus({
                isSupported: backgroundSyncManager.isBackgroundSyncSupported(),
                isAvailable: backgroundSyncManager.isBackgroundSyncAvailable(),
                isRegistered: registrationStatus.registered
            });
        };

        updateStatus();

        // Subscribe to background sync events
        const unsubscribe = backgroundSyncManager.onBackgroundSyncEvent(handleBackgroundSyncEvent);

        return () => {
            unsubscribe();
        };
    }, [handleBackgroundSyncEvent]);

    // Register background sync
    const registerBackgroundSync = useCallback(async (): Promise<boolean> => {
        const success = await backgroundSyncManager.registerBackgroundSync();

        if (success) {
            setStatus(prev => ({
                ...prev,
                isRegistered: true
            }));
        }

        return success;
    }, []);

    // Trigger background sync
    const triggerBackgroundSync = useCallback(async (): Promise<boolean> => {
        return await backgroundSyncManager.triggerBackgroundSync();
    }, []);

    // Queue operation for background sync
    const queueOperation = useCallback(async (
        operation: any,
        priority: boolean = false
    ): Promise<boolean> => {
        return await backgroundSyncManager.queueOperationForBackgroundSync(operation, priority);
    }, []);

    // Update service worker
    const updateServiceWorker = useCallback(async (): Promise<boolean> => {
        return await backgroundSyncManager.updateServiceWorker();
    }, []);

    return {
        status,
        syncEvents,
        registerBackgroundSync,
        triggerBackgroundSync,
        queueOperation,
        updateServiceWorker
    };
}