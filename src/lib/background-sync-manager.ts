/**
 * Background Sync Manager for Mobile Enhancements
 * 
 * This module provides the interface between the main thread and the Service Worker
 * for background synchronization of offline operations.
 * 
 * Note: Currently disabled to prevent service worker 404 errors.
 * Enable by setting ENABLE_BACKGROUND_SYNC environment variable.
 */

import { ServiceWorkerManager, ServiceWorkerStatus } from './background-sync/service-worker-manager';
import { SyncManager } from './background-sync/sync-manager';
import { BackgroundSyncEventManager, BackgroundSyncCallback } from './background-sync/event-manager';

interface SyncManagerInterface {
    getTags(): Promise<string[]>;
    register(tag: string): Promise<void>;
}

declare global {
    interface ServiceWorkerRegistration {
        readonly sync: SyncManagerInterface;
    }
}

/**
 * Configuration for background sync manager
 */
interface BackgroundSyncConfig {
    enabled: boolean;
    serviceWorkerPath?: string;
    retryAttempts?: number;
    retryDelay?: number;
}

/**
 * Main Background Sync Manager
 * Orchestrates service worker management, sync operations, and event handling
 */
export class BackgroundSyncManager {
    private serviceWorkerManager: ServiceWorkerManager;
    private syncManager: SyncManager;
    private eventManager: BackgroundSyncEventManager;
    private isInitialized = false;
    private config: BackgroundSyncConfig;

    constructor(config: BackgroundSyncConfig = { enabled: false }) {
        this.config = {
            retryAttempts: 3,
            retryDelay: 1000,
            serviceWorkerPath: '/sw.js',
            ...config
        };
        
        this.serviceWorkerManager = new ServiceWorkerManager(this.config.serviceWorkerPath!);
        this.syncManager = new SyncManager(this.serviceWorkerManager);
        this.eventManager = new BackgroundSyncEventManager();
        
        if (this.config.enabled) {
            this.initialize();
        }
    }

    /**
     * Initialize the background sync manager
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized || !this.config.enabled) {
            return;
        }

        try {
            const initialized = await this.serviceWorkerManager.initialize();
            
            if (initialized) {
                // Set up message handling
                this.serviceWorkerManager.addMessageHandler(
                    this.eventManager.handleServiceWorkerMessage.bind(this.eventManager)
                );

                console.log('Background sync manager initialized');
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('Failed to initialize background sync manager:', error);
        }
    }

    /**
     * Register background sync for pending operations
     */
    async registerBackgroundSync(): Promise<boolean> {
        if (!this.config.enabled) {
            console.warn('Background sync is disabled');
            return false;
        }

        if (!this.isInitialized) {
            console.warn('Background sync manager not initialized');
            return false;
        }

        return this.syncManager.registerSync();
    }

    /**
     * Queue an operation for background sync
     */
    async queueOperationForBackgroundSync(
        operation: any,
        priority: boolean = false
    ): Promise<boolean> {
        if (!this.config.enabled || !this.isInitialized) {
            console.warn('Background sync is disabled or not initialized');
            return false;
        }

        return this.syncManager.queueOperation({
            type: 'generic',
            data: operation,
            priority
        });
    }

    /**
     * Trigger immediate background sync
     */
    async triggerBackgroundSync(): Promise<boolean> {
        if (!this.config.enabled || !this.isInitialized) {
            console.warn('Background sync is disabled or not initialized');
            return false;
        }

        return this.syncManager.triggerSync();
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
        return this.config.enabled && this.isInitialized && this.isBackgroundSyncSupported();
    }

    /**
     * Register callback for background sync events
     */
    onBackgroundSyncEvent(callback: BackgroundSyncCallback): () => void {
        return this.eventManager.subscribe(callback);
    }

    /**
     * Get Service Worker registration status
     */
    async getRegistrationStatus(): Promise<ServiceWorkerStatus> {
        return this.serviceWorkerManager.getStatus();
    }

    /**
     * Update Service Worker if a new version is available
     */
    async updateServiceWorker(): Promise<boolean> {
        return this.serviceWorkerManager.update();
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.serviceWorkerManager.destroy();
        this.eventManager.destroy();
        this.isInitialized = false;
    }
}

// Export singleton instance with configuration
export const backgroundSyncManager = new BackgroundSyncManager({
    enabled: process.env.NODE_ENV === 'production' && process.env.ENABLE_BACKGROUND_SYNC === 'true',
    serviceWorkerPath: '/sw.js'
});