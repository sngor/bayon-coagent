/**
 * Connectivity Monitoring for Offline Support
 * 
 * This module provides utilities for monitoring network connectivity
 * and managing online/offline state transitions.
 */

/**
 * Connectivity status
 */
export type ConnectivityStatus = 'online' | 'offline' | 'unknown';

/**
 * Connectivity event listener callback
 */
export type ConnectivityListener = (status: ConnectivityStatus) => void;

/**
 * Connectivity monitor class
 */
class ConnectivityMonitor {
    private listeners: Set<ConnectivityListener> = new Set();
    private currentStatus: ConnectivityStatus = 'unknown';
    private isInitialized = false;

    /**
     * Initialize the connectivity monitor
     */
    initialize(): void {
        if (this.isInitialized) {
            return;
        }

        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            this.currentStatus = 'unknown';
            return;
        }

        // Set initial status
        this.currentStatus = navigator.onLine ? 'online' : 'offline';

        // Add event listeners for connectivity changes
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        this.isInitialized = true;
    }

    /**
     * Clean up event listeners
     */
    cleanup(): void {
        if (typeof window === 'undefined') {
            return;
        }

        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        this.listeners.clear();
        this.isInitialized = false;
    }

    /**
     * Handle online event
     */
    private handleOnline = (): void => {
        this.updateStatus('online');
    };

    /**
     * Handle offline event
     */
    private handleOffline = (): void => {
        this.updateStatus('offline');
    };

    /**
     * Update connectivity status and notify listeners
     */
    private updateStatus(status: ConnectivityStatus): void {
        const previousStatus = this.currentStatus;
        this.currentStatus = status;

        // Only notify if status actually changed
        if (previousStatus !== status) {
            console.log(`Connectivity status changed: ${previousStatus} -> ${status}`);
            this.notifyListeners(status);
        }
    }

    /**
     * Notify all registered listeners
     */
    private notifyListeners(status: ConnectivityStatus): void {
        this.listeners.forEach(listener => {
            try {
                listener(status);
            } catch (error) {
                console.error('Error in connectivity listener:', error);
            }
        });
    }

    /**
     * Get current connectivity status
     */
    getStatus(): ConnectivityStatus {
        if (!this.isInitialized) {
            this.initialize();
        }
        return this.currentStatus;
    }

    /**
     * Check if currently online
     */
    isOnline(): boolean {
        return this.getStatus() === 'online';
    }

    /**
     * Check if currently offline
     */
    isOffline(): boolean {
        return this.getStatus() === 'offline';
    }

    /**
     * Add a connectivity change listener
     */
    addListener(listener: ConnectivityListener): () => void {
        if (!this.isInitialized) {
            this.initialize();
        }

        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Remove a connectivity change listener
     */
    removeListener(listener: ConnectivityListener): void {
        this.listeners.delete(listener);
    }

    /**
     * Perform a connectivity check by attempting to fetch a resource
     * This is more reliable than just checking navigator.onLine
     */
    async performConnectivityCheck(timeoutMs: number = 5000): Promise<boolean> {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            // Try to fetch a small resource from the same origin
            const response = await fetch('/favicon.svg', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const isConnected = response.ok;

            // Update status based on actual connectivity
            if (isConnected && this.currentStatus === 'offline') {
                this.updateStatus('online');
            } else if (!isConnected && this.currentStatus === 'online') {
                this.updateStatus('offline');
            }

            return isConnected;
        } catch (error) {
            // Network error or timeout - we're offline
            if (this.currentStatus === 'online') {
                this.updateStatus('offline');
            }
            return false;
        }
    }

    /**
     * Wait for online connectivity
     * Returns a promise that resolves when connectivity is restored
     */
    async waitForOnline(timeoutMs?: number): Promise<void> {
        if (this.isOnline()) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            let timeoutId: NodeJS.Timeout | undefined;

            const unsubscribe = this.addListener((status) => {
                if (status === 'online') {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    unsubscribe();
                    resolve();
                }
            });

            // Set timeout if specified
            if (timeoutMs) {
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    reject(new Error('Timeout waiting for online connectivity'));
                }, timeoutMs);
            }
        });
    }
}

// Export singleton instance
export const connectivityMonitor = new ConnectivityMonitor();

// Note: The useConnectivity hook is implemented in use-offline-sync.ts
// to avoid circular dependencies and ensure proper React imports
