/**
 * Price Reduction Data Access Tests
 * 
 * Tests for the price reduction data access layer including
 * alert operations, price history, and listing snapshots.
 */

import { PriceReductionDataAccess, getPriceReductionDataAccess, ListingPriceHistory, PriceHistoryEntry } from '../price-reduction-data-access';
import { PriceReductionAlert, MLSListingData, TargetArea } from '../types';

describe('PriceReductionDataAccess', () => {
    let dataAccess: PriceReductionDataAccess;
    const testUserId = 'test-user-123';

    beforeEach(() => {
        dataAccess = getPriceReductionDataAccess();
    });

    describe('constructor and singleton', () => {
        it('should return the same instance when called multiple times', () => {
            const instance1 = getPriceReductionDataAccess();
            const instance2 = getPriceReductionDataAccess();
            expect(instance1).toBe(instance2);
        });
    });

    describe('price reduction statistics', () => {
        it('should return zero statistics for no alerts', async () => {
            // Mock getPriceReductionAlerts to return empty array
            const originalMethod = dataAccess.getPriceReductionAlerts;
            dataAccess.getPriceReductionAlerts = async () => [];

            const stats = await dataAccess.getPriceReductionStats(testUserId, 30);

            expect(stats).toEqual({
                totalAlerts: 0,
                averageReduction: 0,
                averageReductionPercent: 0,
                highPriorityCount: 0,
            });

            // Restore original method
            dataAccess.getPriceReductionAlerts = originalMethod;
        });

        it('should calculate statistics correctly for sample alerts', async () => {
            const sampleAlerts: PriceReductionAlert[] = [
                {
                    id: 'alert-1',
                    userId: testUserId,
                    type: 'price-reduction',
                    priority: 'high',
                    status: 'unread',
                    createdAt: new Date().toISOString(),
                    data: {
                        propertyAddress: '123 Test St',
                        originalPrice: 500000,
                        newPrice: 450000,
                        priceReduction: 50000,
                        priceReductionPercent: 10,
                        daysOnMarket: 30,
                        propertyDetails: {
                            bedrooms: 3,
                            bathrooms: 2,
                            squareFeet: 1800,
                            propertyType: 'Single Family',
                        },
                    },
                },
                {
                    id: 'alert-2',
                    userId: testUserId,
                    type: 'price-reduction',
                    priority: 'medium',
                    status: 'unread',
                    createdAt: new Date().toISOString(),
                    data: {
                        propertyAddress: '456 Test Ave',
                        originalPrice: 300000,
                        newPrice: 280000,
                        priceReduction: 20000,
                        priceReductionPercent: 6.67,
                        daysOnMarket: 45,
                        propertyDetails: {
                            bedrooms: 2,
                            bathrooms: 2,
                            squareFeet: 1400,
                            propertyType: 'Townhouse',
                        },
                    },
                },
                {
                    id: 'alert-3',
                    userId: testUserId,
                    type: 'price-reduction',
                    priority: 'high',
                    status: 'unread',
                    createdAt: new Date().toISOString(),
                    data: {
                        propertyAddress: '789 Test Blvd',
                        originalPrice: 400000,
                        newPrice: 360000,
                        priceReduction: 40000,
                        priceReductionPercent: 10,
                        daysOnMarket: 60,
                        propertyDetails: {
                            bedrooms: 3,
                            bathrooms: 2,
                            squareFeet: 1600,
                            propertyType: 'Single Family',
                        },
                    },
                },
            ];

            // Mock getPriceReductionAlerts to return sample alerts
            const originalMethod = dataAccess.getPriceReductionAlerts;
            dataAccess.getPriceReductionAlerts = async () => sampleAlerts;

            const stats = await dataAccess.getPriceReductionStats(testUserId, 30);

            expect(stats.totalAlerts).toBe(3);
            expect(stats.averageReduction).toBe(Math.round((50000 + 20000 + 40000) / 3));
            expect(stats.averageReductionPercent).toBe(Math.round(((10 + 6.67 + 10) / 3) * 100) / 100);
            expect(stats.highPriorityCount).toBe(2);

            // Restore original method
            dataAccess.getPriceReductionAlerts = originalMethod;
        });
    });

    describe('target area filtering', () => {
        const sampleListing: MLSListingData = {
            mlsNumber: 'MLS123',
            address: '123 Test Street, Test City, TS 12345',
            price: 500000,
            status: 'Active',
            listDate: '2024-01-01',
            agentId: 'agent-1',
            agentName: 'Test Agent',
            daysOnMarket: 30,
            propertyType: 'Single Family',
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1800,
        };

        it('should match ZIP code target area', () => {
            const targetArea: TargetArea = {
                id: 'area-1',
                type: 'zip',
                value: '12345',
                label: 'ZIP 12345',
            };

            const isMatch = (dataAccess as any).isListingInTargetArea(sampleListing, targetArea);
            expect(isMatch).toBe(true);
        });

        it('should not match different ZIP code', () => {
            const targetArea: TargetArea = {
                id: 'area-1',
                type: 'zip',
                value: '54321',
                label: 'ZIP 54321',
            };

            const isMatch = (dataAccess as any).isListingInTargetArea(sampleListing, targetArea);
            expect(isMatch).toBe(false);
        });

        it('should match city target area', () => {
            const targetArea: TargetArea = {
                id: 'area-1',
                type: 'city',
                value: 'Test City',
                label: 'Test City',
            };

            const isMatch = (dataAccess as any).isListingInTargetArea(sampleListing, targetArea);
            expect(isMatch).toBe(true);
        });

        it('should not match different city', () => {
            const targetArea: TargetArea = {
                id: 'area-1',
                type: 'city',
                value: 'Other City',
                label: 'Other City',
            };

            const isMatch = (dataAccess as any).isListingInTargetArea(sampleListing, targetArea);
            expect(isMatch).toBe(false);
        });

        it('should match polygon target area (simplified)', () => {
            const targetArea: TargetArea = {
                id: 'area-1',
                type: 'polygon',
                value: {
                    coordinates: [
                        { lat: 40.0, lng: -74.0 },
                        { lat: 40.1, lng: -74.0 },
                        { lat: 40.1, lng: -73.9 },
                        { lat: 40.0, lng: -73.9 },
                    ],
                },
                label: 'Custom Area',
            };

            // The simplified implementation always returns true for polygons
            const isMatch = (dataAccess as any).isListingInTargetArea(sampleListing, targetArea);
            expect(isMatch).toBe(true);
        });

        it('should match listing in multiple target areas', () => {
            const targetAreas: TargetArea[] = [
                {
                    id: 'area-1',
                    type: 'zip',
                    value: '54321', // Different ZIP
                    label: 'ZIP 54321',
                },
                {
                    id: 'area-2',
                    type: 'city',
                    value: 'Test City', // Matching city
                    label: 'Test City',
                },
            ];

            const isMatch = (dataAccess as any).isListingInTargetAreas(sampleListing, targetAreas);
            expect(isMatch).toBe(true);
        });

        it('should not match listing in no target areas', () => {
            const targetAreas: TargetArea[] = [
                {
                    id: 'area-1',
                    type: 'zip',
                    value: '54321', // Different ZIP
                    label: 'ZIP 54321',
                },
                {
                    id: 'area-2',
                    type: 'city',
                    value: 'Other City', // Different city
                    label: 'Other City',
                },
            ];

            const isMatch = (dataAccess as any).isListingInTargetAreas(sampleListing, targetAreas);
            expect(isMatch).toBe(false);
        });
    });

    describe('batch operations', () => {
        it('should handle empty alert array', async () => {
            const alerts: PriceReductionAlert[] = [];

            // This should not throw an error
            await expect(
                dataAccess.savePriceReductionAlertsBatch(testUserId, alerts)
            ).resolves.not.toThrow();
        });

        it('should process alerts in batches', async () => {
            // Create 30 sample alerts (more than batch size of 25)
            const alerts: PriceReductionAlert[] = Array.from({ length: 30 }, (_, i) => ({
                id: `alert-${i}`,
                userId: testUserId,
                type: 'price-reduction',
                priority: 'medium',
                status: 'unread',
                createdAt: new Date().toISOString(),
                data: {
                    propertyAddress: `${i} Test St`,
                    originalPrice: 500000,
                    newPrice: 475000,
                    priceReduction: 25000,
                    priceReductionPercent: 5,
                    daysOnMarket: 30,
                    propertyDetails: {
                        bedrooms: 3,
                        bathrooms: 2,
                        squareFeet: 1800,
                        propertyType: 'Single Family',
                    },
                },
            }));

            // Mock savePriceReductionAlert to track calls
            let callCount = 0;
            const originalMethod = dataAccess.savePriceReductionAlert;
            dataAccess.savePriceReductionAlert = async () => {
                callCount++;
            };

            await dataAccess.savePriceReductionAlertsBatch(testUserId, alerts);

            // Should have been called 30 times (once for each alert)
            expect(callCount).toBe(30);

            // Restore original method
            dataAccess.savePriceReductionAlert = originalMethod;
        });
    });
});