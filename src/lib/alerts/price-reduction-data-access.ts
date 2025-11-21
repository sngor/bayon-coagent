/**
 * Price Reduction Data Access Layer
 * 
 * Provides data access methods specifically for price reduction monitoring,
 * including price history tracking and listing data management.
 */

import { getRepository } from '../../aws/dynamodb/repository';
import {
    PriceReductionAlert,
    MLSListingData,
    TargetArea,
    AlertSettings,
} from './types';
import { getAlertDataAccess } from './data-access';

export interface PriceHistoryEntry {
    date: string;
    price: number;
    source: string;
}

export interface ListingPriceHistory {
    mlsNumber: string;
    propertyAddress: string;
    priceHistory: PriceHistoryEntry[];
    lastUpdated: string;
}

export class PriceReductionDataAccess {
    private repository = getRepository();
    private alertDataAccess = getAlertDataAccess();

    // ==================== Price Reduction Alert Operations ====================

    /**
     * Saves a price reduction alert
     * @param userId User ID
     * @param alert Price reduction alert
     */
    async savePriceReductionAlert(userId: string, alert: PriceReductionAlert): Promise<void> {
        await this.alertDataAccess.saveAlert(userId, alert);
    }

    /**
     * Gets price reduction alerts for a user
     * @param userId User ID
     * @param limit Optional limit on number of alerts
     * @returns Array of price reduction alerts
     */
    async getPriceReductionAlerts(userId: string, limit?: number): Promise<PriceReductionAlert[]> {
        const alerts = await this.alertDataAccess.getAlerts(userId, {
            types: ['price-reduction'],
        });

        const priceReductionAlerts = alerts.filter(
            (alert): alert is PriceReductionAlert => alert.type === 'price-reduction'
        );

        if (limit) {
            return priceReductionAlerts.slice(0, limit);
        }

        return priceReductionAlerts;
    }

    // ==================== Price History Operations ====================

    /**
     * Saves price history for a listing
     * @param userId User ID
     * @param mlsNumber MLS number
     * @param priceHistory Price history data
     */
    async savePriceHistory(
        userId: string,
        mlsNumber: string,
        priceHistory: ListingPriceHistory
    ): Promise<void> {
        await this.repository.createPriceHistory(userId, mlsNumber, {
            ...priceHistory,
            lastUpdated: new Date().toISOString(),
        });
    }

    /**
     * Gets price history for a listing
     * @param userId User ID
     * @param mlsNumber MLS number
     * @returns Price history or null if not found
     */
    async getPriceHistory(
        userId: string,
        mlsNumber: string
    ): Promise<ListingPriceHistory | null> {
        return this.repository.getPriceHistory<ListingPriceHistory>(userId, mlsNumber);
    }

    /**
     * Updates price history for a listing
     * @param userId User ID
     * @param mlsNumber MLS number
     * @param newEntry New price history entry
     */
    async updatePriceHistory(
        userId: string,
        mlsNumber: string,
        newEntry: PriceHistoryEntry
    ): Promise<void> {
        const existingHistory = await this.getPriceHistory(userId, mlsNumber);

        if (existingHistory) {
            // Add new entry to existing history
            const updatedHistory: ListingPriceHistory = {
                ...existingHistory,
                priceHistory: [...existingHistory.priceHistory, newEntry],
                lastUpdated: new Date().toISOString(),
            };

            await this.repository.updatePriceHistory(userId, mlsNumber, updatedHistory);
        } else {
            // Create new price history
            const newHistory: ListingPriceHistory = {
                mlsNumber,
                propertyAddress: '', // Will be filled by the calling function
                priceHistory: [newEntry],
                lastUpdated: new Date().toISOString(),
            };

            await this.savePriceHistory(userId, mlsNumber, newHistory);
        }
    }

    // ==================== Listing Data Operations ====================

    /**
     * Saves current listing snapshot for price comparison
     * @param userId User ID
     * @param listing Listing data
     */
    async saveListingSnapshot(userId: string, listing: MLSListingData): Promise<void> {
        await this.repository.createListingSnapshot(userId, listing.mlsNumber, {
            ...listing,
            snapshotDate: new Date().toISOString(),
        });
    }

    /**
     * Gets the most recent listing snapshot
     * @param userId User ID
     * @param mlsNumber MLS number
     * @returns Listing snapshot or null if not found
     */
    async getListingSnapshot(
        userId: string,
        mlsNumber: string
    ): Promise<MLSListingData | null> {
        return this.repository.getListingSnapshot<MLSListingData>(userId, mlsNumber);
    }

    /**
     * Gets all listing snapshots for target areas
     * @param userId User ID
     * @param targetAreas Target areas to filter by
     * @returns Array of listing snapshots
     */
    async getListingSnapshotsForAreas(
        userId: string,
        targetAreas: TargetArea[]
    ): Promise<MLSListingData[]> {
        const allSnapshots = await this.repository.queryListingSnapshots<MLSListingData>(userId);

        // Filter by target areas
        return allSnapshots.items.filter(listing =>
            this.isListingInTargetAreas(listing, targetAreas)
        );
    }

    // ==================== Target Area Operations ====================

    /**
     * Checks if a listing is within any of the target areas
     * @param listing Listing data
     * @param targetAreas Target areas to check
     * @returns True if listing is in any target area
     */
    private isListingInTargetAreas(listing: MLSListingData, targetAreas: TargetArea[]): boolean {
        for (const area of targetAreas) {
            if (this.isListingInTargetArea(listing, area)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a listing is within a specific target area
     * @param listing Listing data
     * @param targetArea Target area to check
     * @returns True if listing is in target area
     */
    private isListingInTargetArea(listing: MLSListingData, targetArea: TargetArea): boolean {
        switch (targetArea.type) {
            case 'zip':
                // Extract ZIP code from address (simplified implementation)
                const zipMatch = listing.address.match(/\b\d{5}\b/);
                return zipMatch ? zipMatch[0] === targetArea.value : false;

            case 'city':
                // Check if city name is in address (simplified implementation)
                return listing.address.toLowerCase().includes(
                    (targetArea.value as string).toLowerCase()
                );

            case 'polygon':
                // For polygon matching, we would need to implement point-in-polygon logic
                // This is a simplified implementation that always returns true
                // In production, this would use proper geospatial calculations
                return true;

            default:
                return false;
        }
    }

    // ==================== Batch Operations ====================

    /**
     * Processes multiple price reduction alerts in batch
     * @param userId User ID
     * @param alerts Array of price reduction alerts
     */
    async savePriceReductionAlertsBatch(
        userId: string,
        alerts: PriceReductionAlert[]
    ): Promise<void> {
        // Process alerts in batches to avoid overwhelming the database
        const batchSize = 25; // DynamoDB batch write limit

        for (let i = 0; i < alerts.length; i += batchSize) {
            const batch = alerts.slice(i, i + batchSize);

            // Save each alert in the batch
            await Promise.all(
                batch.map(alert => this.savePriceReductionAlert(userId, alert))
            );
        }
    }

    /**
     * Gets price reduction statistics for a user
     * @param userId User ID
     * @param days Number of days to look back
     * @returns Price reduction statistics
     */
    async getPriceReductionStats(userId: string, days: number = 30): Promise<{
        totalAlerts: number;
        averageReduction: number;
        averageReductionPercent: number;
        highPriorityCount: number;
    }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const alerts = await this.getPriceReductionAlerts(userId);
        const recentAlerts = alerts.filter(
            alert => new Date(alert.createdAt) >= cutoffDate
        );

        if (recentAlerts.length === 0) {
            return {
                totalAlerts: 0,
                averageReduction: 0,
                averageReductionPercent: 0,
                highPriorityCount: 0,
            };
        }

        const totalReduction = recentAlerts.reduce(
            (sum, alert) => sum + alert.data.priceReduction,
            0
        );

        const totalReductionPercent = recentAlerts.reduce(
            (sum, alert) => sum + alert.data.priceReductionPercent,
            0
        );

        const highPriorityCount = recentAlerts.filter(
            alert => alert.priority === 'high'
        ).length;

        return {
            totalAlerts: recentAlerts.length,
            averageReduction: Math.round(totalReduction / recentAlerts.length),
            averageReductionPercent: Math.round(
                (totalReductionPercent / recentAlerts.length) * 100
            ) / 100,
            highPriorityCount,
        };
    }
}

/**
 * Gets the singleton price reduction data access instance
 */
let priceReductionDataAccessInstance: PriceReductionDataAccess | null = null;

export function getPriceReductionDataAccess(): PriceReductionDataAccess {
    if (!priceReductionDataAccessInstance) {
        priceReductionDataAccessInstance = new PriceReductionDataAccess();
    }
    return priceReductionDataAccessInstance;
}

/**
 * Resets the price reduction data access singleton
 * Useful for testing
 */
export function resetPriceReductionDataAccess(): void {
    priceReductionDataAccessInstance = null;
}