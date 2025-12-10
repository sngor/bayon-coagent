/**
 * Analytics Event Batching
 * 
 * Batches analytics events to reduce network requests and improve performance.
 * Events are queued and sent in batches at regular intervals or when the batch size is reached.
 * 
 * Requirements: 8.5
 */

import type { OnboardingAnalyticsEvent } from '@/types/onboarding';

interface BatchConfig {
    maxBatchSize: number;
    flushInterval: number; // milliseconds
    maxRetries: number;
}

const DEFAULT_CONFIG: BatchConfig = {
    maxBatchSize: 10,
    flushInterval: 30000, // 30 seconds
    maxRetries: 3,
};

export class AnalyticsBatcher {
    private queue: OnboardingAnalyticsEvent[] = [];
    private flushTimer: NodeJS.Timeout | null = null;
    private config: BatchConfig;
    private flushCallback: (events: OnboardingAnalyticsEvent[]) => Promise<void>;
    private isOnline: boolean = true;

    constructor(
        flushCallback: (events: OnboardingAnalyticsEvent[]) => Promise<void>,
        config: Partial<BatchConfig> = {}
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.flushCallback = flushCallback;

        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.handleOnline);
            window.addEventListener('offline', this.handleOffline);
        }

        // Start flush timer
        this.startFlushTimer();
    }

    /**
     * Add an event to the batch queue
     */
    addEvent(event: OnboardingAnalyticsEvent): void {
        this.queue.push(event);

        // Flush if batch size reached
        if (this.queue.length >= this.config.maxBatchSize) {
            this.flush();
        }
    }

    /**
     * Flush all queued events
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0) {
            return;
        }

        // Don't flush if offline
        if (!this.isOnline) {
            console.log('[ANALYTICS_BATCHER] Offline, deferring flush');
            return;
        }

        const eventsToFlush = [...this.queue];
        this.queue = [];

        try {
            await this.flushCallback(eventsToFlush);
        } catch (error) {
            console.error('[ANALYTICS_BATCHER] Error flushing events:', error);
            // Re-queue events for retry
            this.queue.unshift(...eventsToFlush);
        }
    }

    /**
     * Start the flush timer
     */
    private startFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    /**
     * Handle online event
     */
    private handleOnline = (): void => {
        this.isOnline = true;
        console.log('[ANALYTICS_BATCHER] Back online, flushing queued events');
        this.flush();
    };

    /**
     * Handle offline event
     */
    private handleOffline = (): void => {
        this.isOnline = false;
        console.log('[ANALYTICS_BATCHER] Offline, queuing events');
    };

    /**
     * Get current queue size
     */
    getQueueSize(): number {
        return this.queue.length;
    }

    /**
     * Clear the queue
     */
    clearQueue(): void {
        this.queue = [];
    }

    /**
     * Destroy the batcher and clean up
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this.handleOnline);
            window.removeEventListener('offline', this.handleOffline);
        }

        // Flush remaining events
        this.flush();
    }
}

/**
 * Create a singleton batcher instance
 */
let batcherInstance: AnalyticsBatcher | null = null;

export function getAnalyticsBatcher(
    flushCallback: (events: OnboardingAnalyticsEvent[]) => Promise<void>,
    config?: Partial<BatchConfig>
): AnalyticsBatcher {
    if (!batcherInstance) {
        batcherInstance = new AnalyticsBatcher(flushCallback, config);
    }
    return batcherInstance;
}

/**
 * Destroy the singleton batcher instance
 */
export function destroyAnalyticsBatcher(): void {
    if (batcherInstance) {
        batcherInstance.destroy();
        batcherInstance = null;
    }
}
