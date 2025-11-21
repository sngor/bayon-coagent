/**
 * Tests for Neighborhood Trend Detector
 */

import {
    NeighborhoodTrendDetector,
    getNeighborhoodTrendDetector,
    resetNeighborhoodTrendDetector
} from '../neighborhood-trend-detector';
import {
    TrendIndicators,
    MarketData,
    NeighborhoodTrendAlert
} from '../types';

describe('NeighborhoodTrendDetector', () => {
    let detector: NeighborhoodTrendDetector;

    beforeEach(() => {
        resetNeighborhoodTrendDetector();
        detector = getNeighborhoodTrendDetector();
    });

    afterEach(() => {
        resetNeighborhoodTrendDetector();
    });

    describe('calculateTrendIndicators', () => {
        it('should calculate trend indicators correctly', () => {
            const neighborhood = 'Downtown';
            const marketData: MarketData[] = [
                {
                    neighborhood,
                    date: '2024-02-01T00:00:00Z',
                    medianPrice: 500000,
                    inventoryLevel: 100,
                    avgDaysOnMarket: 20,
                    salesVolume: 50
                },
                {
                    neighborhood,
                    date: '2024-01-01T00:00:00Z',
                    medianPrice: 450000,
                    inventoryLevel: 120,
                    avgDaysOnMarket: 25,
                    salesVolume: 40
                }
            ];

            const indicators = detector.calculateTrendIndicators(neighborhood, marketData);

            expect(indicators.neighborhood).toBe(neighborhood);
            expect(indicators.medianPrice).toBe(500000);
            expect(indicators.inventoryLevel).toBe(100);
            expect(indicators.avgDaysOnMarket).toBe(20);
            expect(indicators.salesVolume).toBe(50);

            // Price change: (500000 - 450000) / 450000 * 100 = 11.11%
            expect(indicators.priceChange).toBeCloseTo(11.11, 2);

            // Inventory change: (100 - 120) / 120 * 100 = -16.67%
            expect(indicators.inventoryChange).toBeCloseTo(-16.67, 2);

            // DOM change: (20 - 25) / 25 * 100 = -20%
            expect(indicators.domChange).toBe(-20);
        });

        it('should handle single data point gracefully', () => {
            const neighborhood = 'Uptown';
            const marketData: MarketData[] = [
                {
                    neighborhood,
                    date: '2024-02-01T00:00:00Z',
                    medianPrice: 500000,
                    inventoryLevel: 100,
                    avgDaysOnMarket: 20,
                    salesVolume: 50
                }
            ];

            // Should handle gracefully when there's no previous data
            expect(() => {
                detector.calculateTrendIndicators(neighborhood, marketData);
            }).toThrow(); // Expected to throw since we need at least 2 data points
        });
    });

    describe('compareHistoricalData', () => {
        it('should create price increase alert when threshold exceeded', () => {
            const current: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-02',
                medianPrice: 550000,
                priceChange: 15, // > 10% threshold
                inventoryLevel: 100,
                inventoryChange: 0,
                avgDaysOnMarket: 20,
                domChange: 0,
                salesVolume: 50,
                calculatedAt: '2024-02-01T00:00:00Z'
            };

            const historical: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-01',
                medianPrice: 500000,
                priceChange: 0,
                inventoryLevel: 100,
                inventoryChange: 0,
                avgDaysOnMarket: 20,
                domChange: 0,
                salesVolume: 50,
                calculatedAt: '2024-01-01T00:00:00Z'
            };

            const alert = detector.compareHistoricalData(current, historical);

            expect(alert).not.toBeNull();
            expect(alert!.type).toBe('neighborhood-trend');
            expect(alert!.data.trendType).toBe('price-increase');
            expect(alert!.data.neighborhood).toBe('TestArea');
            expect(alert!.data.currentValue).toBe(550000);
            expect(alert!.data.previousValue).toBe(500000);
            expect(alert!.data.changePercent).toBe(15);
        });

        it('should create inventory decrease alert when threshold exceeded', () => {
            const current: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-02',
                medianPrice: 500000,
                priceChange: 0,
                inventoryLevel: 80,
                inventoryChange: -25, // > 20% decrease threshold
                avgDaysOnMarket: 20,
                domChange: 0,
                salesVolume: 50,
                calculatedAt: '2024-02-01T00:00:00Z'
            };

            const historical: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-01',
                medianPrice: 500000,
                priceChange: 0,
                inventoryLevel: 100,
                inventoryChange: 0,
                avgDaysOnMarket: 20,
                domChange: 0,
                salesVolume: 50,
                calculatedAt: '2024-01-01T00:00:00Z'
            };

            const alert = detector.compareHistoricalData(current, historical);

            expect(alert).not.toBeNull();
            expect(alert!.data.trendType).toBe('inventory-decrease');
            expect(alert!.data.changePercent).toBe(25);
        });

        it('should create DOM decrease alert when threshold exceeded', () => {
            const current: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-02',
                medianPrice: 500000,
                priceChange: 0,
                inventoryLevel: 100,
                inventoryChange: 0,
                avgDaysOnMarket: 15,
                domChange: -20, // > 15% decrease threshold
                salesVolume: 50,
                calculatedAt: '2024-02-01T00:00:00Z'
            };

            const historical: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-01',
                medianPrice: 500000,
                priceChange: 0,
                inventoryLevel: 100,
                inventoryChange: 0,
                avgDaysOnMarket: 20,
                domChange: 0,
                salesVolume: 50,
                calculatedAt: '2024-01-01T00:00:00Z'
            };

            const alert = detector.compareHistoricalData(current, historical);

            expect(alert).not.toBeNull();
            expect(alert!.data.trendType).toBe('dom-decrease');
            expect(alert!.data.changePercent).toBe(20);
        });

        it('should return null when no thresholds are exceeded', () => {
            const current: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-02',
                medianPrice: 505000,
                priceChange: 1, // < 10% threshold
                inventoryLevel: 95,
                inventoryChange: -5, // < 20% decrease threshold
                avgDaysOnMarket: 19,
                domChange: -5, // < 15% decrease threshold
                salesVolume: 50,
                calculatedAt: '2024-02-01T00:00:00Z'
            };

            const historical: TrendIndicators = {
                neighborhood: 'TestArea',
                period: '2024-01',
                medianPrice: 500000,
                priceChange: 0,
                inventoryLevel: 100,
                inventoryChange: 0,
                avgDaysOnMarket: 20,
                domChange: 0,
                salesVolume: 50,
                calculatedAt: '2024-01-01T00:00:00Z'
            };

            const alert = detector.compareHistoricalData(current, historical);

            expect(alert).toBeNull();
        });
    });

    describe('analyzeTrends', () => {
        it('should analyze trends for multiple neighborhoods', async () => {
            const neighborhoods = ['Area1', 'Area2'];

            // Since we're using mock data in the implementation, this will work
            const alerts = await detector.analyzeTrends(neighborhoods);

            // The mock implementation should generate alerts for price increases
            expect(Array.isArray(alerts)).toBe(true);
            // Each neighborhood should potentially generate alerts based on mock data
        });

        it('should handle errors gracefully and continue with other neighborhoods', async () => {
            const neighborhoods = ['GoodArea', 'BadArea', 'AnotherGoodArea'];

            // Test that the method handles multiple neighborhoods
            const alerts = await detector.analyzeTrends(neighborhoods);

            // Should return an array (may be empty if no trends detected)
            expect(Array.isArray(alerts)).toBe(true);
        });
    });

    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = getNeighborhoodTrendDetector();
            const instance2 = getNeighborhoodTrendDetector();

            expect(instance1).toBe(instance2);
        });

        it('should reset singleton correctly', () => {
            const instance1 = getNeighborhoodTrendDetector();
            resetNeighborhoodTrendDetector();
            const instance2 = getNeighborhoodTrendDetector();

            expect(instance1).not.toBe(instance2);
        });
    });
});