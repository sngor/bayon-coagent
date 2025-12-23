/**
 * PWA Manager Service
 * 
 * Manages Progressive Web App functionality:
 * - Service Worker registration and updates
 * - Install prompt handling
 * - Push notification setup
 * - App lifecycle events
 * 
 * Requirements: 6.1, 10.1
 */

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAInstallState {
    canInstall: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
}

export class PWAManager {
    private static instance: PWAManager;
    private deferredPrompt: BeforeInstallPromptEvent | null = null;
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

    private constructor() {
        // PWA manager initialization disabled to prevent service worker 404 errors
        console.log('PWA manager initialization disabled');
        return;
        
        if (typeof window !== 'undefined') {
            this.initialize();
        }
    }

    static getInstance(): PWAManager {
        if (!PWAManager.instance) {
            PWAManager.instance = new PWAManager();
        }
        return PWAManager.instance;
    }

    /**
     * Initialize PWA manager
     */
    private initialize(): void {
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e as BeforeInstallPromptEvent;
            this.dispatchInstallAvailable();
        });

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.dispatchAppInstalled();
        });

        // Register service worker
        this.registerServiceWorker();
    }

    /**
     * Check if service worker file exists
     */
    private async checkServiceWorkerExists(): Promise<boolean> {
        try {
            const response = await fetch('/sw.js', { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Register service worker
     */
    private async registerServiceWorker(): Promise<void> {
        // Check if service worker is enabled in configuration
        const isServiceWorkerEnabled = process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === 'true';
        
        if (!isServiceWorkerEnabled) {
            console.log('Service worker registration disabled via configuration');
            return;
        }

        // Check if service worker file exists
        const serviceWorkerExists = await this.checkServiceWorkerExists();
        if (!serviceWorkerExists) {
            console.warn('Service worker file not found at /sw.js, skipping registration');
            return;
        }
        
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                });

                this.serviceWorkerRegistration = registration;

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker available
                                this.dispatchUpdateAvailable();
                            }
                        });
                    }
                });

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000); // Check every hour

                console.log('Service Worker registered successfully');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
                
                // Provide more specific error information
                if (error instanceof Error) {
                    if (error.message.includes('404')) {
                        console.warn('Service worker file not found. Ensure /sw.js exists in public directory.');
                    } else if (error.message.includes('SecurityError')) {
                        console.warn('Service worker registration blocked by security policy. Check HTTPS requirements.');
                    } else if (error.message.includes('NetworkError')) {
                        console.warn('Network error during service worker registration. Check connectivity.');
                    }
                }
                
                // Don't throw - PWA features should degrade gracefully
                this.serviceWorkerRegistration = null;
            }
        }
    }

    /**
     * Get service worker registration
     */
    getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
        return this.serviceWorkerRegistration;
    }

    /**
     * Show install prompt
     */
    async showInstallPrompt(): Promise<boolean> {
        if (!this.deferredPrompt) {
            return false;
        }

        try {
            await this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;

            this.deferredPrompt = null;

            return outcome === 'accepted';
        } catch (error) {
            console.error('Install prompt error:', error);
            return false;
        }
    }

    /**
     * Get PWA install state
     */
    getInstallState(): PWAInstallState {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        return {
            canInstall: !!this.deferredPrompt,
            isInstalled: isStandalone,
            isStandalone,
        };
    }

    /**
     * Check if app is installed
     */
    isInstalled(): boolean {
        return this.getInstallState().isInstalled;
    }

    /**
     * Check if install prompt is available
     */
    canInstall(): boolean {
        return this.getInstallState().canInstall;
    }

    /**
     * Request push notification permission
     */
    async requestNotificationPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            throw new Error('Notifications not supported');
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission === 'denied') {
            return 'denied';
        }

        return await Notification.requestPermission();
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
        if (!this.serviceWorkerRegistration) {
            throw new Error('Service Worker not registered');
        }

        const permission = await this.requestNotificationPermission();
        if (permission !== 'granted') {
            return null;
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
            });

            return subscription;
        } catch (error) {
            console.error('Push subscription error:', error);
            return null;
        }
    }

    /**
     * Get existing push subscription
     */
    async getPushSubscription(): Promise<PushSubscription | null> {
        if (!this.serviceWorkerRegistration) {
            return null;
        }

        return await this.serviceWorkerRegistration.pushManager.getSubscription();
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribeFromPushNotifications(): Promise<boolean> {
        const subscription = await this.getPushSubscription();
        if (!subscription) {
            return false;
        }

        return await subscription.unsubscribe();
    }

    /**
     * Show local notification
     */
    async showNotification(
        title: string,
        options?: NotificationOptions
    ): Promise<void> {
        if (!this.serviceWorkerRegistration) {
            throw new Error('Service Worker not registered');
        }

        const permission = await this.requestNotificationPermission();
        if (permission !== 'granted') {
            throw new Error('Notification permission denied');
        }

        await this.serviceWorkerRegistration.showNotification(title, {
            icon: '/icon-192x192.svg',
            badge: '/icon-192x192.svg',
            ...options,
        });
    }

    /**
     * Update service worker
     */
    async updateServiceWorker(): Promise<void> {
        if (!this.serviceWorkerRegistration) {
            return;
        }

        await this.serviceWorkerRegistration.update();
    }

    /**
     * Skip waiting and activate new service worker
     */
    async skipWaiting(): Promise<void> {
        if (!this.serviceWorkerRegistration || !this.serviceWorkerRegistration.waiting) {
            return;
        }

        this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload page after new service worker activates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    // ============================================================================
    // Event Dispatchers
    // ============================================================================

    private dispatchInstallAvailable(): void {
        window.dispatchEvent(new CustomEvent('pwa:install-available'));
    }

    private dispatchAppInstalled(): void {
        window.dispatchEvent(new CustomEvent('pwa:app-installed'));
    }

    private dispatchUpdateAvailable(): void {
        window.dispatchEvent(new CustomEvent('pwa:update-available'));
    }

    // ============================================================================
    // Utilities
    // ============================================================================

    /**
     * Convert VAPID key to Uint8Array
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();
