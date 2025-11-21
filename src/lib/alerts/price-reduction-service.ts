/**
 * Price Reduction Service
 * 
 * High-level service that orchestrates price reduction monitoring,
 * combining the monitor, data access, and alert generation.
 */

import { PriceReductionMonitor, createPriceReductionMonitor } from './price-reduction-monitor';
import { getPriceReductionDataAccess, PriceReductionDataAccess } from './price-reduction-data-access';
import { getAlertDataAccess, AlertDataAccess } from './data-access';
import {
    PriceReductionAlert,
    AlertSettings,
    TargetArea,
    MLSListingData,
} from './types';

export interface PriceReductionServiceOptions {
    checkIntervalHours?: number;
    batchSize?: number;
}

export class PriceReductionService {
    private monitor: PriceReductionMonitor;
    private priceReductionDataAccess: PriceReductionDataAccess;
    private alertDataAccess: AlertDataAccess;
    private readonly batchSize: number;

    constructor(options: PriceReductionServiceOptions = {}) {
        this.monitor = createPriceReductionMonitor({
            checkIntervalHours: options.checkIntervalHours,
        });
        this.priceReductionDataAccess = getPriceReductionDataAccess();
        this.alertDataAccess = getAlertDataAccess();
        this.batchSize = options.batchSize ?? 25;
    }

    /**
     * Processes price reduction monitoring for a user
     * @param userId User ID
     * @returns Array of generated alerts
     */
    async processPriceReductionMonitoring(userId: string): Promise<PriceReductionAlert[]> {
        try {
            // Get user's alert settings
            const settings = await this.alertDataAccess.getAlertSettings(userId);

            // Check if price reduction alerts are enabled
            if (!settings.enabledAlertTypes.includes('price-reduction')) {
                return [];
            }

            // Get target areas
            const targetAreas = settings.targetAreas;
            if (targetAreas.length === 0) {
                return [];
            }

            // Monitor price reductions
            const alerts = await this.monitor.monitorPriceReductions(targetAreas, settings);

            // Set user ID for all alerts
            const userAlerts = alerts.map(alert => ({
                ...alert,
                userId,
            }));

            // Save alerts to database
            if (userAlerts.length > 0) {
                await this.priceReductionDataAccess.savePriceReductionAlertsBatch(userId, userAlerts);
            }

            return userAlerts;
        } catch (error) {
            console.error(`Error processing price reduction monitoring for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Gets price reduction alerts for a user with filtering
     * @param userId User ID
     * @param options Filtering options
     * @returns Array of price reduction alerts
     */
    async getPriceReductionAlerts(
        userId: string,
        options: {
            limit?: number;
            priority?: 'high' | 'medium' | 'low';
            daysBack?: number;
        } = {}
    ): Promise<PriceReductionAlert[]> {
        let alerts = await this.priceReductionDataAccess.getPriceReductionAlerts(userId, options.limit);

        // Filter by priority if specified
        if (options.priority) {
            alerts = alerts.filter(alert => alert.priority === options.priority);
        }

        // Filter by date range if specified
        if (options.daysBack) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - options.daysBack);
            alerts = alerts.filter(alert => new Date(alert.createdAt) >= cutoffDate);
        }

        return alerts;
    }

    /**
     * Gets price reduction statistics for a user
     * @param userId User ID
     * @param daysBack Number of days to look back
     * @returns Price reduction statistics
     */
    async getPriceReductionStatistics(userId: string, daysBack: number = 30): Promise<{
        totalAlerts: number;
        averageReduction: number;
        averageReductionPercent: number;
        highPriorityCount: number;
        mediumPriorityCount: number;
        lowPriorityCount: number;
        topReductions: Array<{
            address: string;
            reduction: number;
            reductionPercent: number;
            priority: string;
        }>;
    }> {
        const stats = await this.priceReductionDataAccess.getPriceReductionStats(userId, daysBack);
        const alerts = await this.getPriceReductionAlerts(userId, { daysBack });

        // Count by priority
        const priorityCounts = alerts.reduce(
            (counts, alert) => {
                counts[alert.priority]++;
                return counts;
            },
            { high: 0, medium: 0, low: 0 }
        );

        // Get top 5 reductions by amount
        const topReductions = alerts
            .sort((a, b) => b.data.priceReduction - a.data.priceReduction)
            .slice(0, 5)
            .map(alert => ({
                address: alert.data.propertyAddress,
                reduction: alert.data.priceReduction,
                reductionPercent: alert.data.priceReductionPercent,
                priority: alert.priority,
            }));

        return {
            ...stats,
            mediumPriorityCount: priorityCounts.medium,
            lowPriorityCount: priorityCounts.low,
            topReductions,
        };
    }

    /**
     * Marks a price reduction alert as read
     * @param userId User ID
     * @param alertId Alert ID
     */
    async markAlertAsRead(userId: string, alertId: string): Promise<void> {
        await this.alertDataAccess.updateAlertStatus(userId, alertId, 'read');
    }

    /**
     * Dismisses a price reduction alert
     * @param userId User ID
     * @param alertId Alert ID
     */
    async dismissAlert(userId: string, alertId: string): Promise<void> {
        await this.alertDataAccess.updateAlertStatus(userId, alertId, 'dismissed');
    }

    /**
     * Updates price history for a listing
     * This method should be called whenever listing data is updated
     * @param userId User ID
     * @param listing Updated listing data
     */
    async updateListingPriceHistory(userId: string, listing: MLSListingData): Promise<void> {
        try {
            // Save current listing snapshot
            await this.priceReductionDataAccess.saveListingSnapshot(userId, listing);

            // Update price history
            const priceEntry = {
                date: new Date().toISOString(),
                price: listing.price,
                source: 'MLS',
            };

            await this.priceReductionDataAccess.updatePriceHistory(
                userId,
                listing.mlsNumber,
                priceEntry
            );
        } catch (error) {
            console.error(`Error updating price history for listing ${listing.mlsNumber}:`, error);
            // Don't throw error to avoid breaking the main flow
        }
    }

    /**
     * Validates that the service is properly configured
     * @returns Validation result
     */
    validateConfiguration(): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check if monitor is configured
        if (!this.monitor) {
            errors.push('Price reduction monitor is not initialized');
        }

        // Check if data access is configured
        if (!this.priceReductionDataAccess) {
            errors.push('Price reduction data access is not initialized');
        }

        if (!this.alertDataAccess) {
            errors.push('Alert data access is not initialized');
        }

        // Check batch size
        if (this.batchSize <= 0 || this.batchSize > 25) {
            errors.push('Batch size must be between 1 and 25');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Gets the check interval in hours
     * @returns Check interval in hours
     */
    getCheckIntervalHours(): number {
        return this.monitor.getCheckIntervalHours();
    }

    /**
     * Gets the batch size for processing alerts
     * @returns Batch size
     */
    getBatchSize(): number {
        return this.batchSize;
    }
}

/**
 * Creates a new price reduction service instance
 * @param options Configuration options
 * @returns PriceReductionService instance
 */
export function createPriceReductionService(options?: PriceReductionServiceOptions): PriceReductionService {
    return new PriceReductionService(options);
}

/**
 * Default price reduction service instance
 */
export const priceReductionService = createPriceReductionService();