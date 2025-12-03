'use client';

/**
 * PWA Hook
 * 
 * React hook for PWA functionality:
 * - Install prompt
 * - Install state
 * - Update notifications
 * - Push notifications
 * 
 * Requirements: 6.1, 10.1
 */

import { useState, useEffect, useCallback } from 'react';
import { pwaManager, PWAInstallState } from '@/lib/mobile/pwa-manager';

export interface UsePWAReturn {
    installState: PWAInstallState;
    showInstallPrompt: () => Promise<boolean>;
    isUpdateAvailable: boolean;
    updateServiceWorker: () => Promise<void>;
    requestNotificationPermission: () => Promise<NotificationPermission>;
    subscribeToPushNotifications: (vapidKey: string) => Promise<PushSubscription | null>;
    showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
}

export function usePWA(): UsePWAReturn {
    const [installState, setInstallState] = useState<PWAInstallState>({
        canInstall: false,
        isInstalled: false,
        isStandalone: false,
    });
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

    useEffect(() => {
        // Update install state
        const updateInstallState = () => {
            setInstallState(pwaManager.getInstallState());
        };

        updateInstallState();

        // Listen for install events
        const handleInstallAvailable = () => {
            updateInstallState();
        };

        const handleAppInstalled = () => {
            updateInstallState();
        };

        const handleUpdateAvailable = () => {
            setIsUpdateAvailable(true);
        };

        window.addEventListener('pwa:install-available', handleInstallAvailable);
        window.addEventListener('pwa:app-installed', handleAppInstalled);
        window.addEventListener('pwa:update-available', handleUpdateAvailable);

        return () => {
            window.removeEventListener('pwa:install-available', handleInstallAvailable);
            window.removeEventListener('pwa:app-installed', handleAppInstalled);
            window.removeEventListener('pwa:update-available', handleUpdateAvailable);
        };
    }, []);

    const showInstallPrompt = useCallback(async () => {
        return await pwaManager.showInstallPrompt();
    }, []);

    const updateServiceWorker = useCallback(async () => {
        await pwaManager.skipWaiting();
        setIsUpdateAvailable(false);
    }, []);

    const requestNotificationPermission = useCallback(async () => {
        return await pwaManager.requestNotificationPermission();
    }, []);

    const subscribeToPushNotifications = useCallback(async (vapidKey: string) => {
        return await pwaManager.subscribeToPushNotifications(vapidKey);
    }, []);

    const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
        await pwaManager.showNotification(title, options);
    }, []);

    return {
        installState,
        showInstallPrompt,
        isUpdateAvailable,
        updateServiceWorker,
        requestNotificationPermission,
        subscribeToPushNotifications,
        showNotification,
    };
}
