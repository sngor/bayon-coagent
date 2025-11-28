/**
 * Notification Batch Processor
 * 
 * Optimizes bulk notification operations by batching database queries
 * and email sends to improve performance.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { Alert } from './types';
import { NotificationPreferences } from './notification-types';
import { preferencesCache } from './notification-cache';

export interface BatchConfig {
    // Maximum batch size for database operations
    maxBatchSize: number;
    // Maximum batch size for email operations
    maxEmailBatchSize: number;
    // Delay before processing batch (ms)
    batchDelay: number;
    // Enable automatic batching
    autoFlush: boolean;
}

export interface BatchResult<T> {
    successful: T[];
    failed: Array<{ item: T; error: string }>;
    totalProcessed: number;
}

/**
 * Batch Processor for notifications
 */
export class NotificationBatchProcessor {
    private repository: DynamoDBRepository;
    private config: BatchConfig;
    private pendingBatches: Map<string, any[]>;
    private flushTimers: Map<string, NodeJS.Timeout>;

    constructor(config?: Partial<BatchConfig>) {
        this.repository = new DynamoDBRepository();
        this.config = {
            maxBatchSize: config?.maxBatchSize ?? 25,
            maxEmailBatchSize: config?.maxEmailBatchSize ?? 50,
            batchDelay: config?.batchDelay ?? 100,
            autoFlush: config?.autoFlush ?? true,
        };
        this.pendingBatches = new Map();
        this.flushTimers = new Map();
    }

    /**
     * Batch loads user preferences
     */
    async batchLoadPreferences(userIds: string[]): Promise<Map<string, NotificationPreferences>> {
        const result = new Map<string, NotificationPreferences>();
        const uncachedUserIds: string[] = [];

        // Check cache first
        for (const userId of userIds) {
            const cached = preferencesCache.getUserPreferences(userId);
            if (cached) {
                result.set(userId, cached);
            } else {
                uncachedUserIds.push(userId);
            }
        }

        // Batch load uncached preferences
        if (uncachedUserIds.length > 0) {
            const keys = uncachedUserIds.map(userId => ({
                PK: `USER#${userId}`,
                SK: 'SETTINGS#NOTIFICATIONS',
            }));

            const batchResult = await this.repository.batchGet<NotificationPreferences>(keys);

            // Process results and update cache
            for (let i = 0; i < uncachedUserIds.length; i++) {
                const userId = uncachedUserIds[i];
                const preferences = batchResult.items[i];

                if (preferences) {
                    result.set(userId, preferences);
                    preferencesCache.setUserPreferences(userId, preferences);
                } else {
                    // Use default preferences
                    const defaultPrefs: NotificationPreferences = {
                        userId,
                        emailNotifications: true,
                        frequency: 'real-time',
                        enabledAlertTypes: [
                            'life-event-lead',
                            'competitor-new-listing',
                            'competitor-price-reduction',
                            'competitor-withdrawal',
                            'neighborhood-trend',
                            'price-reduction',
                        ],
                        updatedAt: new Date().toISOString(),
                    };
                    result.set(userId, defaultPrefs);
                    preferencesCache.setUserPreferences(userId, defaultPrefs);
                }
            }
        }

        return result;
    }

    /**
     * Batch loads alerts
     */
    async batchLoadAlerts(alertIds: string[], userId: string): Promise<Map<string, Alert>> {
        const result = new Map<string, Alert>();

        // Create keys for batch get
        const keys = alertIds.map(alertId => ({
            PK: `USER#${userId}`,
            SK: `ALERT#${alertId}`,
        }));

        const batchResult = await this.repository.batchGet<Alert>(keys);

        // Map results
        for (const alert of batchResult.items) {
            if (alert && alert.id) {
                result.set(alert.id, alert);
            }
        }

        return result;
    }

    /**
     * Batch creates notification events
     */
    async batchCreateEvents(
        events: Array<{
            userId: string;
            type: 'email_sent' | 'email_failed' | 'email_bounced' | 'email_complained';
            alertId?: string;
            messageId?: string;
            details?: Record<string, any>;
        }>
    ): Promise<BatchResult<any>> {
        const successful: any[] = [];
        const failed: Array<{ item: any; error: string }> = [];

        // Create DynamoDB items
        const items = events.map(event => {
            const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date().toISOString();

            return {
                PK: `USER#${event.userId}`,
                SK: `NOTIFICATION_EVENT#${timestamp}#${id}`,
                EntityType: 'NotificationEvent' as const,
                Data: {
                    id,
                    ...event,
                    timestamp,
                },
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
            };
        });

        // Batch write
        try {
            await this.repository.batchWrite(items as any, []);
            successful.push(...events);
        } catch (error) {
            // If batch write fails, try individual writes
            for (let i = 0; i < items.length; i++) {
                try {
                    await this.repository.put(items[i] as any);
                    successful.push(events[i]);
                } catch (err) {
                    failed.push({
                        item: events[i],
                        error: err instanceof Error ? err.message : 'Unknown error',
                    });
                }
            }
        }

        return {
            successful,
            failed,
            totalProcessed: events.length,
        };
    }

    /**
     * Batch updates notification statuses
     */
    async batchUpdateStatuses(
        updates: Array<{
            userId: string;
            notificationId: string;
            status: string;
            additionalFields?: Record<string, any>;
        }>
    ): Promise<BatchResult<any>> {
        const successful: any[] = [];
        const failed: Array<{ item: any; error: string }> = [];

        // Process updates individually (DynamoDB doesn't support batch updates)
        for (const update of updates) {
            try {
                await this.repository.update(
                    `USER#${update.userId}`,
                    `NOTIFICATION#${update.notificationId}`,
                    {
                        status: update.status,
                        ...update.additionalFields,
                    }
                );
                successful.push(update);
            } catch (error) {
                failed.push({
                    item: update,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            successful,
            failed,
            totalProcessed: updates.length,
        };
    }

    /**
     * Adds an item to a batch for later processing
     */
    addToBatch<T>(batchKey: string, item: T): void {
        if (!this.pendingBatches.has(batchKey)) {
            this.pendingBatches.set(batchKey, []);
        }

        const batch = this.pendingBatches.get(batchKey)!;
        batch.push(item);

        // Auto-flush if batch is full
        if (this.config.autoFlush && batch.length >= this.config.maxBatchSize) {
            this.flushBatch(batchKey);
        } else if (this.config.autoFlush) {
            // Schedule flush
            this.scheduleFlush(batchKey);
        }
    }

    /**
     * Flushes a specific batch
     */
    async flushBatch(batchKey: string): Promise<any[]> {
        const batch = this.pendingBatches.get(batchKey);
        if (!batch || batch.length === 0) {
            return [];
        }

        // Clear the batch
        this.pendingBatches.delete(batchKey);

        // Clear any pending flush timer
        const timer = this.flushTimers.get(batchKey);
        if (timer) {
            clearTimeout(timer);
            this.flushTimers.delete(batchKey);
        }

        return batch;
    }

    /**
     * Flushes all pending batches
     */
    async flushAll(): Promise<Map<string, any[]>> {
        const result = new Map<string, any[]>();

        for (const batchKey of this.pendingBatches.keys()) {
            const batch = await this.flushBatch(batchKey);
            result.set(batchKey, batch);
        }

        return result;
    }

    /**
     * Gets pending batch size
     */
    getPendingBatchSize(batchKey: string): number {
        return this.pendingBatches.get(batchKey)?.length ?? 0;
    }

    /**
     * Gets all pending batch keys
     */
    getPendingBatchKeys(): string[] {
        return Array.from(this.pendingBatches.keys());
    }

    // ==================== Private Methods ====================

    /**
     * Schedules a batch flush
     */
    private scheduleFlush(batchKey: string): void {
        // Clear existing timer
        const existingTimer = this.flushTimers.get(batchKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Schedule new flush
        const timer = setTimeout(() => {
            this.flushBatch(batchKey);
        }, this.config.batchDelay);

        this.flushTimers.set(batchKey, timer);
    }
}

// Export singleton instance
export const batchProcessor = new NotificationBatchProcessor();

// Export factory function
export const createBatchProcessor = (config?: Partial<BatchConfig>) => {
    return new NotificationBatchProcessor(config);
};
