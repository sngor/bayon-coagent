/**
 * Enhanced Connectivity Monitor for Mobile Enhancements
 * 
 * This module provides comprehensive network connectivity monitoring including:
 * - navigator.onLine detection
 * - Network change detection
 * - Connection quality assessment
 * - Automatic sync triggering on reconnection
 */

export interface ConnectivityStatus {
    isOnline: boolean;
    lastOnlineAt: number;
    lastOfflineAt: number;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
    effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
    downlink?: number; // Mbps
    rtt?: number; // Round trip time in ms
}

export interface ConnectivityEvent {
    type: 'online' | 'offline' | 'quality-change';
    status: ConnectivityStatus;
    timestamp: number;
}

export type ConnectivityCallback = (event: ConnectivityEvent) => void;

/**
 * Enhanced connectivity monitor with quality assessment
 */
export class ConnectivityMonitor {
    private callbacks: Set<ConnectivityCallback> = new Set();
    private status: ConnectivityStatus;
    private qualityCheckInterval?: NodeJS.Timeout;
    private reconnectionCheckInterval?: NodeJS.Timeout;
    private isDestroyed = false;

    constructor() {
        this.status = {
            isOnline: navigator.onLine,
            lastOnlineAt: navigator.onLine ? Date.now() : 0,
            lastOfflineAt: navigator.onLine ? 0 : Date.now(),
            connectionQuality: navigator.onLine ? 'good' : 'offline'
        };

        this.initializeMonitoring();
    }

    /**
     * Initialize all connectivity monitoring
     */
    private initializeMonitoring(): void {
        // Basic online/offline events
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));

        // Network Information API for connection quality
        this.initializeNetworkInformation();

        // Periodic connectivity verification
        this.startPeriodicConnectivityCheck();

        // Initial quality assessment
        this.assessConnectionQuality();
    }

    /**
     * Handle online event
     */
    private handleOnline(): void {
        const wasOffline = !this.status.isOnline;

        this.status.isOnline = true;
        this.status.lastOnlineAt = Date.now();

        // Clear reconnection check interval since we're online
        if (this.reconnectionCheckInterval) {
            clearInterval(this.reconnectionCheckInterval);
            this.reconnectionCheckInterval = undefined;
        }

        console.log('Connectivity restored');

        // Assess connection quality
        this.assessConnectionQuality();

        // Notify callbacks
        this.notifyCallbacks({
            type: 'online',
            status: { ...this.status },
            timestamp: Date.now()
        });

        // If we were offline, this is a reconnection event
        if (wasOffline) {
            this.handleReconnection();
        }
    }

    /**
     * Handle offline event
     */
    private handleOffline(): void {
        this.status.isOnline = false;
        this.status.lastOfflineAt = Date.now();
        this.status.connectionQuality = 'offline';

        console.log('Connectivity lost');

        // Start checking for reconnection
        this.startReconnectionCheck();

        // Notify callbacks
        this.notifyCallbacks({
            type: 'offline',
            status: { ...this.status },
            timestamp: Date.now()
        });
    }

    /**
     * Handle reconnection after being offline
     */
    private handleReconnection(): void {
        console.log('Reconnection detected - triggering sync');

        // Import and trigger sync manager
        import('./offline-sync-manager').then(({ offlineSyncManager }) => {
            offlineSyncManager.syncPendingOperations().catch(error => {
                console.error('Auto-sync failed after reconnection:', error);
            });
        }).catch(error => {
            console.error('Failed to import sync manager:', error);
        });
    }

    /**
     * Initialize Network Information API monitoring
     */
    private initializeNetworkInformation(): void {
        // Check if Network Information API is available
        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            // Update initial connection info
            this.updateNetworkInformation(connection);

            // Listen for connection changes
            connection.addEventListener('change', () => {
                this.updateNetworkInformation(connection);
                this.assessConnectionQuality();
            });
        }
    }

    /**
     * Update network information from the API
     */
    private updateNetworkInformation(connection: any): void {
        this.status.effectiveType = connection.effectiveType;
        this.status.downlink = connection.downlink;
        this.status.rtt = connection.rtt;
    }

    /**
     * Assess connection quality based on available metrics
     */
    private assessConnectionQuality(): void {
        if (!this.status.isOnline) {
            this.status.connectionQuality = 'offline';
            return;
        }

        const previousQuality = this.status.connectionQuality;

        // Use Network Information API if available
        if (this.status.effectiveType && this.status.downlink && this.status.rtt) {
            this.status.connectionQuality = this.calculateQualityFromMetrics(
                this.status.effectiveType,
                this.status.downlink,
                this.status.rtt
            );
        } else {
            // Fallback to basic quality assessment
            this.status.connectionQuality = 'good';
        }

        // Notify if quality changed significantly
        if (previousQuality !== this.status.connectionQuality &&
            previousQuality !== 'offline') {
            this.notifyCallbacks({
                type: 'quality-change',
                status: { ...this.status },
                timestamp: Date.now()
            });
        }
    }

    /**
     * Calculate connection quality from network metrics
     */
    private calculateQualityFromMetrics(
        effectiveType: string,
        downlink: number,
        rtt: number
    ): 'excellent' | 'good' | 'poor' {
        // Excellent: 4G with good metrics
        if (effectiveType === '4g' && downlink >= 10 && rtt <= 100) {
            return 'excellent';
        }

        // Good: 4G or 3G with decent metrics
        if ((effectiveType === '4g' && downlink >= 1.5) ||
            (effectiveType === '3g' && downlink >= 0.7 && rtt <= 300)) {
            return 'good';
        }

        // Poor: 2G or slow connections
        return 'poor';
    }

    /**
     * Start periodic connectivity verification
     */
    private startPeriodicConnectivityCheck(): void {
        // Check every 30 seconds
        this.qualityCheckInterval = setInterval(async () => {
            if (this.isDestroyed) return;

            try {
                // Try to fetch a small resource to verify actual connectivity
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch('/favicon.ico', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const actuallyOnline = response.ok;

                // If navigator.onLine disagrees with actual connectivity, update
                if (actuallyOnline !== this.status.isOnline) {
                    if (actuallyOnline) {
                        this.handleOnline();
                    } else {
                        this.handleOffline();
                    }
                } else if (actuallyOnline) {
                    // We're online, assess quality
                    this.assessConnectionQuality();
                }
            } catch (error) {
                // If fetch fails, we're likely offline
                if (this.status.isOnline) {
                    this.handleOffline();
                }
            }
        }, 30000);
    }

    /**
     * Start checking for reconnection when offline
     */
    private startReconnectionCheck(): void {
        if (this.reconnectionCheckInterval) {
            clearInterval(this.reconnectionCheckInterval);
        }

        // Check every 10 seconds when offline
        this.reconnectionCheckInterval = setInterval(async () => {
            if (this.isDestroyed || this.status.isOnline) {
                if (this.reconnectionCheckInterval) {
                    clearInterval(this.reconnectionCheckInterval);
                    this.reconnectionCheckInterval = undefined;
                }
                return;
            }

            try {
                // Try to reach the server
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch('/favicon.ico', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    // We're back online!
                    this.handleOnline();
                }
            } catch (error) {
                // Still offline, continue checking
                console.log('Still offline, continuing to check...');
            }
        }, 10000);
    }

    /**
     * Notify all registered callbacks
     */
    private notifyCallbacks(event: ConnectivityEvent): void {
        this.callbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in connectivity callback:', error);
            }
        });
    }

    /**
     * Register a callback for connectivity events
     */
    onConnectivityChange(callback: ConnectivityCallback): () => void {
        this.callbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Get current connectivity status
     */
    getStatus(): ConnectivityStatus {
        return { ...this.status };
    }

    /**
     * Check if currently online
     */
    isOnline(): boolean {
        return this.status.isOnline;
    }

    /**
     * Check if connection quality is good enough for sync operations
     */
    isGoodEnoughForSync(): boolean {
        return this.status.isOnline &&
            this.status.connectionQuality !== 'poor';
    }

    /**
     * Get time since last online (in milliseconds)
     */
    getTimeSinceLastOnline(): number {
        if (this.status.isOnline) return 0;
        return Date.now() - this.status.lastOnlineAt;
    }

    /**
     * Get time since last offline (in milliseconds)
     */
    getTimeSinceLastOffline(): number {
        if (!this.status.isOnline) return 0;
        return Date.now() - this.status.lastOfflineAt;
    }

    /**
     * Force a connectivity check
     */
    async checkConnectivity(): Promise<ConnectivityStatus> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('/favicon.ico', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const actuallyOnline = response.ok;

            if (actuallyOnline !== this.status.isOnline) {
                if (actuallyOnline) {
                    this.handleOnline();
                } else {
                    this.handleOffline();
                }
            }
        } catch (error) {
            if (this.status.isOnline) {
                this.handleOffline();
            }
        }

        return this.getStatus();
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.isDestroyed = true;

        // Remove event listeners
        window.removeEventListener('online', this.handleOnline.bind(this));
        window.removeEventListener('offline', this.handleOffline.bind(this));

        // Clear intervals
        if (this.qualityCheckInterval) {
            clearInterval(this.qualityCheckInterval);
            this.qualityCheckInterval = undefined;
        }

        if (this.reconnectionCheckInterval) {
            clearInterval(this.reconnectionCheckInterval);
            this.reconnectionCheckInterval = undefined;
        }

        // Clear callbacks
        this.callbacks.clear();
    }
}

// Export singleton instance
export const connectivityMonitor = new ConnectivityMonitor();