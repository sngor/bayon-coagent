/**
 * Price Reduction Monitoring System
 * 
 * Monitors listings in target areas for price reductions and generates alerts
 * for any price reduction, supporting multiple reductions per property and
 * price range filtering.
 */

import { getRepository } from '@/aws/dynamodb/repository';
import {
    PriceReductionAlert,
    TargetArea,
    MLSListingData,
    AlertPriority,
    AlertSettings,
} from './types';

export interface PriceReductionEvent {
    id: string;
    propertyAddress: string;
    mlsNumber: string;
    originalPrice: number;
    newPrice: number;
    priceReduction: number;
    priceReductionPercent: number;
    daysOnMarket: number;
    eventDate: string;
    propertyDetails: {
        bedrooms: number;
        bathrooms: number;
        squareFeet: number;
        propertyType: string;
    };
}

export interface PriceReductionMonitorOptions {
    checkIntervalHours?: number;
}

export class PriceReductionMonitor {
    private repository = getRepository();
    private readonly checkIntervalHours: number;

    constructor(options: PriceReductionMonitorOptions = {}) {
        this.checkIntervalHours = options.checkIntervalHours ?? 4; // Check every 4 hours
    }

    /**
     * Monitors price reductions in target areas and generates alerts
     * @param targetAreas Array of target areas to monitor
     * @param settings User alert settings for filtering
     * @returns Array of price reduction alerts generated
     */
    async monitorPriceReductions(
        targetAreas: TargetArea[],
        settings: AlertSettings
    ): Promise<PriceReductionAlert[]> {
        const alerts: PriceReductionAlert[] = [];

        for (const area of targetAreas) {
            try {
                // Detect price reduction events in this area
                const events = await this.detectPriceReductions(area);

                // Filter events by price range if specified
                const filteredEvents = this.applyPriceRangeFilter(events, settings.priceRangeFilters);

                // Create alerts for each filtered event
                for (const event of filteredEvents) {
                    const alert = await this.createPriceReductionAlert(event);
                    alerts.push(alert);
                }
            } catch (error) {
                console.error(`Error monitoring price reductions in area ${area.label}:`, error);
                // Continue with other areas
            }
        }

        return alerts;
    }

    /**
     * Detects all price reduction events in a target area within the last 24 hours
     * @param targetArea Target area to monitor
     * @returns Array of price reduction events
     */
    async detectPriceReductions(targetArea: TargetArea): Promise<PriceReductionEvent[]> {
        const events: PriceReductionEvent[] = [];

        try {
            // Get current listings in the target area
            const currentListings = await this.fetchCurrentListings(targetArea);

            for (const listing of currentListings) {
                // Get price history for this property
                const priceHistory = await this.getPriceHistory(listing.mlsNumber);

                if (priceHistory.length > 0) {
                    // Check for recent price reductions (within 24 hours)
                    const recentReductions = await this.findRecentPriceReductions(
                        listing,
                        priceHistory
                    );

                    events.push(...recentReductions);
                }
            }
        } catch (error) {
            console.error(`Error detecting price reductions in ${targetArea.label}:`, error);
        }

        return events;
    }

    /**
     * Finds recent price reductions for a specific listing
     * @param listing Current listing data
     * @param priceHistory Historical price data
     * @returns Array of recent price reduction events
     */
    private async findRecentPriceReductions(
        listing: MLSListingData,
        priceHistory: Array<{ date: string; price: number }>
    ): Promise<PriceReductionEvent[]> {
        const events: PriceReductionEvent[] = [];
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Sort price history by date (most recent first)
        const sortedHistory = priceHistory.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Check each price change in the last 24 hours
        for (let i = 0; i < sortedHistory.length - 1; i++) {
            const currentEntry = sortedHistory[i];
            const previousEntry = sortedHistory[i + 1];
            const changeDate = new Date(currentEntry.date);

            // Only consider changes within the last 24 hours
            if (changeDate < yesterday) {
                break;
            }

            // Check if this is a price reduction (any amount)
            if (currentEntry.price < previousEntry.price) {
                const priceReduction = previousEntry.price - currentEntry.price;
                const priceReductionPercent = (priceReduction / previousEntry.price) * 100;

                const event: PriceReductionEvent = {
                    id: `${listing.mlsNumber}-reduction-${changeDate.getTime()}`,
                    propertyAddress: listing.address,
                    mlsNumber: listing.mlsNumber,
                    originalPrice: previousEntry.price,
                    newPrice: currentEntry.price,
                    priceReduction,
                    priceReductionPercent: Math.round(priceReductionPercent * 100) / 100,
                    daysOnMarket: listing.daysOnMarket,
                    eventDate: currentEntry.date,
                    propertyDetails: {
                        bedrooms: listing.bedrooms,
                        bathrooms: listing.bathrooms,
                        squareFeet: listing.squareFeet,
                        propertyType: listing.propertyType,
                    },
                };

                events.push(event);
            }
        }

        return events;
    }

    /**
     * Applies price range filtering to events
     * @param events Array of price reduction events
     * @param priceRangeFilters Price range filters from settings
     * @returns Filtered array of events
     */
    private applyPriceRangeFilter(
        events: PriceReductionEvent[],
        priceRangeFilters?: { min?: number; max?: number }
    ): PriceReductionEvent[] {
        if (!priceRangeFilters) {
            return events;
        }

        return events.filter(event => {
            const price = event.newPrice; // Use current price for filtering

            if (priceRangeFilters.min && price < priceRangeFilters.min) {
                return false;
            }

            if (priceRangeFilters.max && price > priceRangeFilters.max) {
                return false;
            }

            return true;
        });
    }

    /**
     * Creates a price reduction alert from an event
     * @param event Price reduction event
     * @returns Price reduction alert
     */
    private async createPriceReductionAlert(event: PriceReductionEvent): Promise<PriceReductionAlert> {
        const alert: PriceReductionAlert = {
            id: `alert-${event.id}`,
            userId: '', // Will be set by the calling function
            type: 'price-reduction',
            priority: this.calculateAlertPriority(event),
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                propertyAddress: event.propertyAddress,
                originalPrice: event.originalPrice,
                newPrice: event.newPrice,
                priceReduction: event.priceReduction,
                priceReductionPercent: event.priceReductionPercent,
                daysOnMarket: event.daysOnMarket,
                propertyDetails: event.propertyDetails,
            },
        };

        return alert;
    }

    /**
     * Calculates alert priority based on price reduction characteristics
     * @param event Price reduction event
     * @returns Alert priority
     */
    private calculateAlertPriority(event: PriceReductionEvent): AlertPriority {
        // High priority for significant price reductions
        if (event.priceReductionPercent >= 15) {
            return 'high';
        }

        // High priority for large absolute reductions
        if (event.priceReduction >= 50000) {
            return 'high';
        }

        // Medium priority for moderate reductions or quick reductions
        if (event.priceReductionPercent >= 8 || event.daysOnMarket <= 30) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Validates that multiple price reductions create separate alerts
     * This method ensures each reduction event generates its own alert
     * @param events Array of price reduction events
     * @returns True if each event will generate a separate alert
     */
    validateMultipleReductionAlerts(events: PriceReductionEvent[]): boolean {
        // Each event should have a unique ID based on property and timestamp
        const uniqueIds = new Set(events.map(event => event.id));
        return uniqueIds.size === events.length;
    }

    /**
     * Gets the check interval in hours
     * @returns Check interval in hours
     */
    getCheckIntervalHours(): number {
        return this.checkIntervalHours;
    }

    // ==================== Mock/Simulation Methods ====================
    // These would be replaced with real MLS API calls in production

    /**
     * Fetches current listings in a target area (mock implementation)
     * @param targetArea Target area to search
     * @returns Array of current MLS listing data
     */
    private async fetchCurrentListings(targetArea: TargetArea): Promise<MLSListingData[]> {
        // Mock implementation - in reality this would call MLS APIs
        // Filter by target area (ZIP, city, or polygon)

        // For now, return empty array to avoid errors
        // In production, this would:
        // 1. Query MLS API based on target area type
        // 2. Filter by area boundaries
        // 3. Return active listings only
        return [];
    }

    /**
     * Gets price history for a listing (mock implementation)
     * @param mlsNumber MLS number
     * @returns Array of price history records sorted by date
     */
    private async getPriceHistory(mlsNumber: string): Promise<Array<{ date: string; price: number }>> {
        // Mock implementation - in reality this would query stored price history
        // This would track all price changes for a property over time

        // For now, return empty array to avoid errors
        // In production, this would:
        // 1. Query price history database/cache
        // 2. Return chronological price changes
        // 3. Include timestamps for each change
        return [];
    }

    /**
     * Stores current listing data for price comparison (mock implementation)
     * @param listing Listing data to store
     */
    private async storePriceSnapshot(listing: MLSListingData): Promise<void> {
        // Mock implementation - in reality this would store current prices
        // for future comparison to detect reductions

        // In production, this would:
        // 1. Store current price with timestamp
        // 2. Update existing records if price changed
        // 3. Maintain price history for trend analysis
    }
}

/**
 * Creates a new price reduction monitor instance
 * @param options Configuration options
 * @returns PriceReductionMonitor instance
 */
export function createPriceReductionMonitor(options?: PriceReductionMonitorOptions): PriceReductionMonitor {
    return new PriceReductionMonitor(options);
}

/**
 * Default price reduction monitor instance
 */
export const priceReductionMonitor = createPriceReductionMonitor();