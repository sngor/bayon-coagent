/**
 * Market Intelligence Alerts - Neighborhood Trend Detector
 * 
 * Analyzes market data for neighborhoods to detect emerging trends.
 * Creates alerts when significant changes are detected in:
 * - Median price changes (>10% increase)
 * - Inventory level changes (>20% decrease)
 * - Days on market changes (>15% decrease)
 */

import {
    TrendIndicators,
    MarketData,
    NeighborhoodTrendAlert,
    TargetArea,
    AlertPriority
} from './types';
import { getAlertDataAccess } from './data-access';

export interface TrendAnalysisResult {
    alerts: NeighborhoodTrendAlert[];
    indicators: TrendIndicators[];
}

export interface HistoricalContext {
    avg90Day: number;
    avg365Day: number;
}

export class NeighborhoodTrendDetector {
    private dataAccess = getAlertDataAccess();

    /**
     * Analyzes trends for multiple neighborhoods
     * @param neighborhoods Array of neighborhood identifiers
     * @returns Array of trend alerts
     */
    async analyzeTrends(neighborhoods: string[]): Promise<NeighborhoodTrendAlert[]> {
        const alerts: NeighborhoodTrendAlert[] = [];

        for (const neighborhood of neighborhoods) {
            try {
                const neighborhoodAlerts = await this.analyzeNeighborhoodTrends(neighborhood);
                alerts.push(...neighborhoodAlerts);
            } catch (error) {
                console.error(`Error analyzing trends for neighborhood ${neighborhood}:`, error);
                // Continue with other neighborhoods
            }
        }

        return alerts;
    }

    /**
     * Analyzes trends for a single neighborhood
     * @param neighborhood Neighborhood identifier
     * @returns Array of trend alerts for the neighborhood
     */
    async analyzeNeighborhoodTrends(neighborhood: string): Promise<NeighborhoodTrendAlert[]> {
        // Get market data for the neighborhood
        const marketData = await this.getMarketData(neighborhood);

        if (marketData.length < 2) {
            // Need at least 2 data points to calculate trends
            return [];
        }

        // Calculate current trend indicators
        const currentIndicators = this.calculateTrendIndicators(neighborhood, marketData);

        // Get historical context
        const historicalData = await this.getHistoricalMarketData(neighborhood);

        // Generate alerts based on thresholds
        const alerts: NeighborhoodTrendAlert[] = [];

        // Check price increase trend (>10%)
        if (currentIndicators.priceChange > 10) {
            const historicalContext = this.calculateHistoricalContext(
                historicalData,
                'medianPrice'
            );

            alerts.push(this.createTrendAlert(
                neighborhood,
                'price-increase',
                currentIndicators.medianPrice,
                this.getPreviousValue(marketData, 'medianPrice'),
                currentIndicators.priceChange,
                historicalContext
            ));
        }

        // Check inventory decrease trend (>20%)
        if (currentIndicators.inventoryChange < -20) {
            const historicalContext = this.calculateHistoricalContext(
                historicalData,
                'inventoryLevel'
            );

            alerts.push(this.createTrendAlert(
                neighborhood,
                'inventory-decrease',
                currentIndicators.inventoryLevel,
                this.getPreviousValue(marketData, 'inventoryLevel'),
                Math.abs(currentIndicators.inventoryChange),
                historicalContext
            ));
        }

        // Check days on market decrease trend (>15%)
        if (currentIndicators.domChange < -15) {
            const historicalContext = this.calculateHistoricalContext(
                historicalData,
                'avgDaysOnMarket'
            );

            alerts.push(this.createTrendAlert(
                neighborhood,
                'dom-decrease',
                currentIndicators.avgDaysOnMarket,
                this.getPreviousValue(marketData, 'avgDaysOnMarket'),
                Math.abs(currentIndicators.domChange),
                historicalContext
            ));
        }

        return alerts;
    }

    /**
     * Calculates trend indicators for a neighborhood
     * @param neighborhood Neighborhood identifier
     * @param marketData Array of market data points
     * @returns Trend indicators
     */
    calculateTrendIndicators(neighborhood: string, marketData: MarketData[]): TrendIndicators {
        if (marketData.length < 2) {
            throw new Error('At least 2 data points are required to calculate trend indicators');
        }

        // Sort data by date (most recent first)
        const sortedData = marketData.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const current = sortedData[0];
        const previous = sortedData[1];

        // Calculate percentage changes
        const priceChange = this.calculatePercentageChange(
            previous.medianPrice,
            current.medianPrice
        );

        const inventoryChange = this.calculatePercentageChange(
            previous.inventoryLevel,
            current.inventoryLevel
        );

        const domChange = this.calculatePercentageChange(
            previous.avgDaysOnMarket,
            current.avgDaysOnMarket
        );

        return {
            neighborhood,
            period: this.formatPeriod(current.date),
            medianPrice: current.medianPrice,
            priceChange,
            inventoryLevel: current.inventoryLevel,
            inventoryChange,
            avgDaysOnMarket: current.avgDaysOnMarket,
            domChange,
            salesVolume: current.salesVolume,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Compares current metrics to historical data
     * @param current Current trend indicators
     * @param historical Historical trend indicators
     * @returns Trend alert or null if no significant change
     */
    compareHistoricalData(
        current: TrendIndicators,
        historical: TrendIndicators
    ): NeighborhoodTrendAlert | null {
        // This method is used for comparing specific historical periods
        // The main trend detection logic is in analyzeNeighborhoodTrends

        // Check if any threshold is exceeded
        if (current.priceChange > 10) {
            return this.createTrendAlert(
                current.neighborhood,
                'price-increase',
                current.medianPrice,
                historical.medianPrice,
                current.priceChange,
                {
                    avg90Day: historical.medianPrice,
                    avg365Day: historical.medianPrice
                }
            );
        }

        if (current.inventoryChange < -20) {
            return this.createTrendAlert(
                current.neighborhood,
                'inventory-decrease',
                current.inventoryLevel,
                historical.inventoryLevel,
                Math.abs(current.inventoryChange),
                {
                    avg90Day: historical.inventoryLevel,
                    avg365Day: historical.inventoryLevel
                }
            );
        }

        if (current.domChange < -15) {
            return this.createTrendAlert(
                current.neighborhood,
                'dom-decrease',
                current.avgDaysOnMarket,
                historical.avgDaysOnMarket,
                Math.abs(current.domChange),
                {
                    avg90Day: historical.avgDaysOnMarket,
                    avg365Day: historical.avgDaysOnMarket
                }
            );
        }

        return null;
    }

    // ==================== Private Helper Methods ====================

    /**
     * Gets market data for a neighborhood
     * This would typically call an external API or database
     * @param neighborhood Neighborhood identifier
     * @returns Array of market data points
     */
    private async getMarketData(neighborhood: string): Promise<MarketData[]> {
        // TODO: Implement actual API call to get market data
        // For now, return mock data for testing
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return [
            {
                neighborhood,
                date: now.toISOString(),
                medianPrice: 450000,
                inventoryLevel: 120,
                avgDaysOnMarket: 25,
                salesVolume: 45
            },
            {
                neighborhood,
                date: thirtyDaysAgo.toISOString(),
                medianPrice: 400000,
                inventoryLevel: 160,
                avgDaysOnMarket: 30,
                salesVolume: 38
            }
        ];
    }

    /**
     * Gets historical market data for context (90-day and 365-day averages)
     * @param neighborhood Neighborhood identifier
     * @returns Array of historical market data
     */
    private async getHistoricalMarketData(neighborhood: string): Promise<MarketData[]> {
        // TODO: Implement actual API call to get historical data
        // For now, return mock historical data
        const now = new Date();
        const data: MarketData[] = [];

        // Generate 365 days of mock data
        for (let i = 0; i < 365; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            data.push({
                neighborhood,
                date: date.toISOString(),
                medianPrice: 420000 + Math.random() * 60000,
                inventoryLevel: 140 + Math.random() * 40,
                avgDaysOnMarket: 28 + Math.random() * 8,
                salesVolume: 35 + Math.random() * 20
            });
        }

        return data;
    }

    /**
     * Calculates historical context (90-day and 365-day averages)
     * @param historicalData Array of historical market data
     * @param metric Metric to calculate averages for
     * @returns Historical context with averages
     */
    private calculateHistoricalContext(
        historicalData: MarketData[],
        metric: keyof MarketData
    ): HistoricalContext {
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const threeSixtyFiveDaysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

        // Filter data for 90-day period
        const ninetyDayData = historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return dataDate >= ninetyDaysAgo && dataDate <= now;
        });

        // Filter data for 365-day period
        const threeSixtyFiveDayData = historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return dataDate >= threeSixtyFiveDaysAgo && dataDate <= now;
        });

        // Calculate averages
        const avg90Day = this.calculateAverage(ninetyDayData, metric);
        const avg365Day = this.calculateAverage(threeSixtyFiveDayData, metric);

        return { avg90Day, avg365Day };
    }

    /**
     * Calculates average for a specific metric
     * @param data Array of market data
     * @param metric Metric to calculate average for
     * @returns Average value
     */
    private calculateAverage(data: MarketData[], metric: keyof MarketData): number {
        if (data.length === 0) return 0;

        const sum = data.reduce((acc, item) => {
            const value = item[metric];
            return acc + (typeof value === 'number' ? value : 0);
        }, 0);

        return sum / data.length;
    }

    /**
     * Gets the previous value for a metric from market data
     * @param marketData Array of market data (sorted by date, most recent first)
     * @param metric Metric to get previous value for
     * @returns Previous value
     */
    private getPreviousValue(marketData: MarketData[], metric: keyof MarketData): number {
        if (marketData.length < 2) return 0;
        const value = marketData[1][metric];
        return typeof value === 'number' ? value : 0;
    }

    /**
     * Calculates percentage change between two values
     * @param oldValue Previous value
     * @param newValue Current value
     * @returns Percentage change
     */
    private calculatePercentageChange(oldValue: number, newValue: number): number {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * Formats a date string to period format (YYYY-MM)
     * @param dateString Date string
     * @returns Formatted period string
     */
    private formatPeriod(dateString: string): string {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Creates a trend alert
     * @param neighborhood Neighborhood identifier
     * @param trendType Type of trend detected
     * @param currentValue Current metric value
     * @param previousValue Previous metric value
     * @param changePercent Percentage change
     * @param historicalContext Historical context data
     * @returns Neighborhood trend alert
     */
    private createTrendAlert(
        neighborhood: string,
        trendType: 'price-increase' | 'inventory-decrease' | 'dom-decrease',
        currentValue: number,
        previousValue: number,
        changePercent: number,
        historicalContext: HistoricalContext
    ): NeighborhoodTrendAlert {
        // Determine priority based on magnitude of change
        let priority: AlertPriority = 'medium';
        if (changePercent > 25) {
            priority = 'high';
        } else if (changePercent < 15) {
            priority = 'low';
        }

        return {
            id: this.generateAlertId(),
            userId: '', // Will be set when saving
            type: 'neighborhood-trend',
            priority,
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                neighborhood,
                trendType,
                currentValue,
                previousValue,
                changePercent,
                historicalContext
            }
        };
    }

    /**
     * Generates a unique alert ID
     * @returns Unique alert ID
     */
    private generateAlertId(): string {
        return `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
let detectorInstance: NeighborhoodTrendDetector | null = null;

/**
 * Gets the singleton trend detector instance
 */
export function getNeighborhoodTrendDetector(): NeighborhoodTrendDetector {
    if (!detectorInstance) {
        detectorInstance = new NeighborhoodTrendDetector();
    }
    return detectorInstance;
}

/**
 * Resets the trend detector singleton
 * Useful for testing
 */
export function resetNeighborhoodTrendDetector(): void {
    detectorInstance = null;
}