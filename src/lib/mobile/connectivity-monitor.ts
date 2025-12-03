/**
 * Connectivity Monitor Service
 * 
 * Monitors network connectivity and triggers sync when connection is restored.
 * 
 * Requirements: 6.1, 6.3
 */

import { offlineQueue } from './offline-queue';

export type ConnectionStatus = 'online' | 'offline' | 'slow';

export interface ConnectionInfo {
    status: ConnectionStatus;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
}

export class ConnectivityMonitor {
    private static instance: ConnectivityMonitor;
    private status: ConnectionStatus = 'online';
    private listeners: Set<(info: ConnectionInfo) => void> = new Set();
    private autoSyncEnabled = true;

    private constructor() {
        this.init();
    }

    static getInstance(): ConnectivityMonitor {
        if (!ConnectivityMonitor.instance) {
            ConnectivityMonitor.instance = new ConnectivityMonitor();
        }
        return ConnectivityMonitor.instance;
    }

    /**
     * Initialize connectivity monitoring
     */
    private init(): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return;
        }

        // Set initial status
        this.status = navigator.onLine ? 'online' : 'offline';

        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        // Listen for connection changes (if supported)
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            connection?.addEventListener('change', this.handleConnectionChange);
        }

        // Poll connection status periodically
        setInterval(() => {
            this.checkConnection();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Handle online event
     */
    private handleOnline = async (): Promise<void> => {
        console.log('[ConnectivityMonitor] Connection restored');
        this.status = 'online';
        this.notifyListeners();

        // Trigger automatic sync if enabled
        if (this.autoSyncEnabled) {
            await this.triggerSync();
        }
    };

    /**
     * Handle offline event
     */
    private handleOffline = (): void => {
        console.log('[ConnectivityMonitor] Connection lost');
        this.status = 'offline';
        this.notifyListeners();
    };

    /**
     * Handle connection change
     */
    private handleConnectionChange = (): void => {
        const info = this.getConnectionInfo();
        console.log('[ConnectivityMonitor] Connection changed:', info);

        // Update status based on effective type
        if (info.effectiveType === 'slow-2g' || info.effectiveType === '2g') {
            this.status = 'slow';
        } else if (navigator.onLine) {
            this.status = 'online';
        } else {
            this.status = 'offline';
        }

        this.notifyListeners();
    };

    /**
     * Check connection status
     */
    private async checkConnection(): Promise<void> {
        if (!navigator.onLine) {
            if (this.status !== 'offline') {
                this.handleOffline();
            }
            return;
        }

        // Try to fetch a small resource to verify connectivity
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('/api/health', {
                method: 'HEAD',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                if (this.status !== 'online') {
                    this.handleOnline();
                }
            } else {
                if (this.status !== 'offline') {
                    this.handleOffline();
                }
            }
        } catch (error) {
            if (this.status !== 'offline') {
                this.handleOffline();
            }
        }
    }

    /**
     * Trigger sync
     */
    private async triggerSync(): Promise<void> {
        try {
            const queueSize = await offlineQueue.getQueueSize();
            if (queueSize === 0) {
                console.log('[ConnectivityMonitor] No operations to sync');
                return;
            }

            console.log(`[ConnectivityMonitor] Syncing ${queueSize} operations`);

            // Show notification
            this.showSyncNotification(queueSize);

            // Sync all pending operations
            const results = await offlineQueue.syncAll();

            // Show completion notification
            const successful = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success).length;

            this.showSyncCompleteNotification(successful, failed);
        } catch (error) {
            console.error('[ConnectivityMonitor] Sync failed:', error);
            this.showSyncErrorNotification();
        }
    }

    /**
     * Show sync notification
     */
    private showSyncNotification(count: number): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Syncing Offline Changes', {
                body: `Syncing ${count} ${count === 1 ? 'operation' : 'operations'}...`,
                icon: '/icon-192x192.svg',
                tag: 'sync-progress',
            });
        }
    }

    /**
     * Show sync complete notification
     */
    private showSyncCompleteNotification(successful: number, failed: number): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            const body =
                failed === 0
                    ? `Successfully synced ${successful} ${successful === 1 ? 'operation' : 'operations'}`
                    : `Synced ${successful} ${successful === 1 ? 'operation' : 'operations'}, ${failed} failed`;

            new Notification('Sync Complete', {
                body,
                icon: '/icon-192x192.svg',
                tag: 'sync-complete',
            });
        }
    }

    /**
     * Show sync error notification
     */
    private showSyncErrorNotification(): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sync Failed', {
                body: 'Failed to sync offline changes. Will retry later.',
                icon: '/icon-192x192.svg',
                tag: 'sync-error',
            });
        }
    }

    /**
     * Get current connection status
     */
    getStatus(): ConnectionStatus {
        return this.status;
    }

    /**
     * Get detailed connection info
     */
    getConnectionInfo(): ConnectionInfo {
        const info: ConnectionInfo = {
            status: this.status,
        };

        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            if (connection) {
                info.effectiveType = connection.effectiveType;
                info.downlink = connection.downlink;
                info.rtt = connection.rtt;
                info.saveData = connection.saveData;
            }
        }

        return info;
    }

    /**
     * Check if online
     */
    isOnline(): boolean {
        return this.status === 'online';
    }

    /**
     * Check if offline
     */
    isOffline(): boolean {
        return this.status === 'offline';
    }

    /**
     * Check if connection is slow
     */
    isSlow(): boolean {
        return this.status === 'slow';
    }

    /**
     * Enable/disable automatic sync
     */
    setAutoSync(enabled: boolean): void {
        this.autoSyncEnabled = enabled;
    }

    /**
     * Subscribe to connection status changes
     */
    onStatusChange(callback: (info: ConnectionInfo) => void): () => void {
        this.listeners.add(callback);
        // Call immediately with current status
        callback(this.getConnectionInfo());
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        const info = this.getConnectionInfo();
        this.listeners.forEach((callback) => callback(info));
    }

    /**
     * Cleanup
     */
    destroy(): void {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);

        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            connection?.removeEventListener('change', this.handleConnectionChange);
        }

        this.listeners.clear();
    }
}

// Export singleton instance
export const connectivityMonitor = ConnectivityMonitor.getInstance();
