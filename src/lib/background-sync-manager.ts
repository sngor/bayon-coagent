/**
 * Background Sync Manager for Mobile Enhancements
 * 
 * This module provides the interface between the main thread and the Service Worker
 * for background synchronization of offline operations.
 */

export interface BackgroundSyncEvent {
    type: 'sync-started' | 'sync-progress' | 'sync-completed' | 'sync-failed' | 'notification-click';
    operationId?: string;
    progress?: number;
    operationsProcessed?: number;
    failures?: number;
    timestamp: number;
    error?: string;
    notificationData?: any;
    action?: string;
}

export type BackgroundSyncCallback = (event: BackgroundSyncEvent) => void;

interface SyncManager {
    getTags(): Promise<string[]>;
    register(tag: string): Promise<void>;
}

declare global {
    interface ServiceWorkerRegistration {
        readonly sync: SyncManager;
    }
}


/**
 * Background sync manager class
 */
export class BackgroundSyncManager {
    private callbacks: Set<BackgroundSyncCallback> = new Set();
    private serviceWorkerRegistration?: ServiceWorkerRegistration;
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    /**
     * Initialize the background sync manager
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Check if Service Worker is supported
            if (!('serviceWorker' in navigator)) {
                console.warn('Service Worker not supported');
                return;
            }

            // Check if Background Sync is supported
            if (!('sync' in window.ServiceWorkerRegistration.prototype)) {
                console.warn('Background Sync not supported');
                return;
            }

            // Get or register service worker
            this.serviceWorkerRegistration = await this.getServiceWorkerRegistration();

            if (this.serviceWorkerRegistration) {
                // Listen for messages from Service Worker
                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

                console.log('Background sync manager initialized');
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('Failed to initialize background sync manager:', error);
        }
    }

    /**
     * Get or register the service worker
     */
    private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
        try {
            // Try to get existing registration
            let registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                // Register our custom service worker
                registration = await navigator.serviceWorker.register('/sw-custom.js', {
                    scope: '/'
                });

                console.log('Custom Service Worker registered');
            }

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;

            return registration;
        } catch (error) {
            console.error('Failed to register Service Worker:', error);
            return undefined;
        }
    }

    /**
     * Handle messages from Service Worker
     */
    private handleServiceWorkerMessage(event: MessageEvent): void {
        if (event.data && event.data.type === 'background-sync-event') {
            const syncEvent: BackgroundSyncEvent = {
                type: event.data.type,
                operationId: event.data.operationId,
                progress: event.data.progress,
                operationsProcessed: event.data.operationsProcessed,
                failures: event.data.failures,
                timestamp: event.data.timestamp,
                error: event.data.error,
                notificationData: event.data.notificationData,
                action: event.data.action
            };

            // Notify all callbacks
            this.callbacks.forEach(callback => {
                try {
                    callback(syncEvent);
                } catch (error) {
                    console.error('Error in background sync callback:', error);
                }
            });
        }
    }

    /**
     * Register background sync for pending operations
     */
    async registerBackgroundSync(): Promise<boolean> {
        if (!this.isInitialized || !this.serviceWorkerRegistration) {
            console.warn('Background sync manager not initialized');
            return false;
        }

        try {
            // Register background sync with the Service Worker
            await this.serviceWorkerRegistration.sync.register('sync-pending-operations');
            console.log('Background sync registered successfully');
            return true;
        } catch (error) {
            console.error('Failed to register background sync:', error);
            return false;
        }
    }

    /**
     * Queue an operation for background sync
     */
    async queueOperationForBackgroundSync(
        operation: any,
        priority: boolean = false
    ): Promise<boolean> {
        if (!this.isInitialized || !this.serviceWorkerRegistration) {
            console.warn('Background sync manager not initialized');
            return false;
        }

        try {
            // Send message to Service Worker to queue the operation
            const messageChannel = new MessageChannel();

            return new Promise((resolve) => {
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data.success);
                };

                if (this.serviceWorkerRegistration?.active) {
                    this.serviceWorkerRegistration.active.postMessage({
                        type: 'queue-operation',
                        operation,
                        priority
                    }, [messageChannel.port2]);
                } else {
                    resolve(false);
                }
            });
        } catch (error) {
            console.error('Failed to queue operation for background sync:', error);
            return false;
        }
    }

    /**
     * Trigger immediate background sync
     */
    async triggerBackgroundSync(): Promise<boolean> {
        if (!this.isInitialized || !this.serviceWorkerRegistration) {
            console.warn('Background sync manager not initialized');
            return false;
        }

        try {
            // Register sync to trigger immediately
            await this.serviceWorkerRegistration.sync.register('sync-pending-operations');
            console.log('Background sync triggered');
            return true;
        } catch (error) {
            console.error('Failed to trigger background sync:', error);
            return false;
        }
    }

    /**
     * Check if background sync is supported
     */
    isBackgroundSyncSupported(): boolean {
        return (
            'serviceWorker' in navigator &&
            'sync' in window.ServiceWorkerRegistration.prototype
        );
    }

    /**
     * Check if background sync is available (initialized and supported)
     */
    isBackgroundSyncAvailable(): boolean {
        return this.isInitialized && this.isBackgroundSyncSupported();
    }

    /**
     * Register callback for background sync events
     */
    onBackgroundSyncEvent(callback: BackgroundSyncCallback): () => void {
        this.callbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Get Service Worker registration status
     */
    async getRegistrationStatus(): Promise<{
        registered: boolean;
        active: boolean;
        scope?: string;
        updateFound?: boolean;
    }> {
        try {
            const registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                return { registered: false, active: false };
            }

            return {
                registered: true,
                active: !!registration.active,
                scope: registration.scope,
                updateFound: !!registration.waiting
            };
        } catch (error) {
            console.error('Failed to get registration status:', error);
            return { registered: false, active: false };
        }
    }

    /**
     * Update Service Worker if a new version is available
     */
    async updateServiceWorker(): Promise<boolean> {
        try {
            const registration = await navigator.serviceWorker.getRegistration();

            if (!registration) {
                console.warn('No Service Worker registration found');
                return false;
            }

            await registration.update();
            console.log('Service Worker update check completed');
            return true;
        } catch (error) {
            console.error('Failed to update Service Worker:', error);
            return false;
        }
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.callbacks.clear();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage.bind(this));
        }

        this.isInitialized = false;
    }
}

// Export singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();