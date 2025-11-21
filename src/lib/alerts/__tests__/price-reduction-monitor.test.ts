/**
 * Price Reduction Monitor Tests
 * 
 * Tests for the price reduction monitoring system including detection logic,
 * alert generation, filtering, and multiple reduction handling.
 */

import { PriceReductionMonitor, createPriceReductionMonitor, PriceReductionEvent } from '../price-reduction-monitor';
import { TargetArea, AlertSettings } from '../types';

describe('PriceReductionMonitor', () => {
    let monitor: PriceReductionMonitor;

    beforeEach(() => {
        monitor = createPriceReductionMonitor();
    });

    describe('constructor', () => {
        it('should create monitor with default options', () => {
            const defaultMonitor = createPriceReductionMonitor();
            expect(defaultMonitor.getCheckIntervalHours()).toBe(4);
        });

        it('should create monitor with custom options', () => {
            const customMonitor = createPriceReductionMonitor({ checkIntervalHours: 2 });
            expect(customMonitor.getCheckIntervalHours()).toBe(2);
        });
    });

    describe('calculateAlertPriority', () => {
        it('should return high priority for significant percentage reductions', () => {
            const event: PriceReductionEvent = {
                id: 'test-1',
                propertyAddress: '123 Test St',
                mlsNumber: 'MLS123',
                originalPrice: 500000,
                newPrice: 425000, // 15% reduction
                priceReduction: 75000,
                priceReductionPercent: 15,
                daysOnMarket: 45,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 3,
                    bathrooms: 2,
                    squareFeet: 1800,
                    propertyType: 'Single Family',
                },
            };

            // Access private method through type assertion for testing
            const priority = (monitor as any).calculateAlertPriority(event);
            expect(priority).toBe('high');
        });

        it('should return high priority for large absolute reductions', () => {
            const event: PriceReductionEvent = {
                id: 'test-2',
                propertyAddress: '456 Test Ave',
                mlsNumber: 'MLS456',
                originalPrice: 1000000,
                newPrice: 940000, // 6% but $60k reduction
                priceReduction: 60000,
                priceReductionPercent: 6,
                daysOnMarket: 60,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 4,
                    bathrooms: 3,
                    squareFeet: 2500,
                    propertyType: 'Single Family',
                },
            };

            const priority = (monitor as any).calculateAlertPriority(event);
            expect(priority).toBe('high');
        });

        it('should return medium priority for moderate reductions', () => {
            const event: PriceReductionEvent = {
                id: 'test-3',
                propertyAddress: '789 Test Blvd',
                mlsNumber: 'MLS789',
                originalPrice: 400000,
                newPrice: 368000, // 8% reduction
                priceReduction: 32000,
                priceReductionPercent: 8,
                daysOnMarket: 90,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 3,
                    bathrooms: 2,
                    squareFeet: 1600,
                    propertyType: 'Townhouse',
                },
            };

            const priority = (monitor as any).calculateAlertPriority(event);
            expect(priority).toBe('medium');
        });

        it('should return medium priority for quick reductions', () => {
            const event: PriceReductionEvent = {
                id: 'test-4',
                propertyAddress: '321 Test Dr',
                mlsNumber: 'MLS321',
                originalPrice: 300000,
                newPrice: 285000, // 5% but only 30 days on market
                priceReduction: 15000,
                priceReductionPercent: 5,
                daysOnMarket: 30,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 2,
                    bathrooms: 1,
                    squareFeet: 1200,
                    propertyType: 'Condo',
                },
            };

            const priority = (monitor as any).calculateAlertPriority(event);
            expect(priority).toBe('medium');
        });

        it('should return low priority for small reductions', () => {
            const event: PriceReductionEvent = {
                id: 'test-5',
                propertyAddress: '654 Test Ln',
                mlsNumber: 'MLS654',
                originalPrice: 250000,
                newPrice: 240000, // 4% reduction, 60 days on market
                priceReduction: 10000,
                priceReductionPercent: 4,
                daysOnMarket: 60,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 2,
                    bathrooms: 2,
                    squareFeet: 1100,
                    propertyType: 'Condo',
                },
            };

            const priority = (monitor as any).calculateAlertPriority(event);
            expect(priority).toBe('low');
        });
    });

    describe('applyPriceRangeFilter', () => {
        const sampleEvents: PriceReductionEvent[] = [
            {
                id: 'test-1',
                propertyAddress: '123 Test St',
                mlsNumber: 'MLS123',
                originalPrice: 600000,
                newPrice: 550000,
                priceReduction: 50000,
                priceReductionPercent: 8.33,
                daysOnMarket: 30,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 3,
                    bathrooms: 2,
                    squareFeet: 1800,
                    propertyType: 'Single Family',
                },
            },
            {
                id: 'test-2',
                propertyAddress: '456 Test Ave',
                mlsNumber: 'MLS456',
                originalPrice: 400000,
                newPrice: 380000,
                priceReduction: 20000,
                priceReductionPercent: 5,
                daysOnMarket: 45,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 2,
                    bathrooms: 2,
                    squareFeet: 1400,
                    propertyType: 'Townhouse',
                },
            },
            {
                id: 'test-3',
                propertyAddress: '789 Test Blvd',
                mlsNumber: 'MLS789',
                originalPrice: 200000,
                newPrice: 190000,
                priceReduction: 10000,
                priceReductionPercent: 5,
                daysOnMarket: 60,
                eventDate: new Date().toISOString(),
                propertyDetails: {
                    bedrooms: 1,
                    bathrooms: 1,
                    squareFeet: 800,
                    propertyType: 'Condo',
                },
            },
        ];

        it('should return all events when no price range filter is specified', () => {
            const filtered = (monitor as any).applyPriceRangeFilter(sampleEvents, undefined);
            expect(filtered).toHaveLength(3);
            expect(filtered).toEqual(sampleEvents);
        });

        it('should filter by minimum price', () => {
            const filtered = (monitor as any).applyPriceRangeFilter(sampleEvents, { min: 300000 });
            expect(filtered).toHaveLength(2);
            expect(filtered.map((e: PriceReductionEvent) => e.id)).toEqual(['test-1', 'test-2']);
        });

        it('should filter by maximum price', () => {
            const filtered = (monitor as any).applyPriceRangeFilter(sampleEvents, { max: 400000 });
            expect(filtered).toHaveLength(2);
            expect(filtered.map((e: PriceReductionEvent) => e.id)).toEqual(['test-2', 'test-3']);
        });

        it('should filter by both minimum and maximum price', () => {
            const filtered = (monitor as any).applyPriceRangeFilter(sampleEvents, {
                min: 250000,
                max: 500000
            });
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('test-2');
        });

        it('should return empty array when no events match price range', () => {
            const filtered = (monitor as any).applyPriceRangeFilter(sampleEvents, {
                min: 700000,
                max: 800000
            });
            expect(filtered).toHaveLength(0);
        });
    });

    describe('validateMultipleReductionAlerts', () => {
        it('should validate that each event has a unique ID', () => {
            const events: PriceReductionEvent[] = [
                {
                    id: 'MLS123-reduction-1640995200000',
                    propertyAddress: '123 Test St',
                    mlsNumber: 'MLS123',
                    originalPrice: 500000,
                    newPrice: 480000,
                    priceReduction: 20000,
                    priceReductionPercent: 4,
                    daysOnMarket: 30,
                    eventDate: '2022-01-01T00:00:00.000Z',
                    propertyDetails: {
                        bedrooms: 3,
                        bathrooms: 2,
                        squareFeet: 1800,
                        propertyType: 'Single Family',
                    },
                },
                {
                    id: 'MLS123-reduction-1641081600000',
                    propertyAddress: '123 Test St',
                    mlsNumber: 'MLS123',
                    originalPrice: 480000,
                    newPrice: 460000,
                    priceReduction: 20000,
                    priceReductionPercent: 4.17,
                    daysOnMarket: 31,
                    eventDate: '2022-01-02T00:00:00.000Z',
                    propertyDetails: {
                        bedrooms: 3,
                        bathrooms: 2,
                        squareFeet: 1800,
                        propertyType: 'Single Family',
                    },
                },
            ];

            const isValid = monitor.validateMultipleReductionAlerts(events);
            expect(isValid).toBe(true);
        });

        it('should return false for duplicate IDs', () => {
            const events: PriceReductionEvent[] = [
                {
                    id: 'MLS123-reduction-1640995200000',
                    propertyAddress: '123 Test St',
                    mlsNumber: 'MLS123',
                    originalPrice: 500000,
                    newPrice: 480000,
                    priceReduction: 20000,
                    priceReductionPercent: 4,
                    daysOnMarket: 30,
                    eventDate: '2022-01-01T00:00:00.000Z',
                    propertyDetails: {
                        bedrooms: 3,
                        bathrooms: 2,
                        squareFeet: 1800,
                        propertyType: 'Single Family',
                    },
                },
                {
                    id: 'MLS123-reduction-1640995200000', // Duplicate ID
                    propertyAddress: '123 Test St',
                    mlsNumber: 'MLS123',
                    originalPrice: 480000,
                    newPrice: 460000,
                    priceReduction: 20000,
                    priceReductionPercent: 4.17,
                    daysOnMarket: 31,
                    eventDate: '2022-01-01T00:00:00.000Z',
                    propertyDetails: {
                        bedrooms: 3,
                        bathrooms: 2,
                        squareFeet: 1800,
                        propertyType: 'Single Family',
                    },
                },
            ];

            const isValid = monitor.validateMultipleReductionAlerts(events);
            expect(isValid).toBe(false);
        });
    });

    describe('createPriceReductionAlert', () => {
        it('should create alert with all required fields', async () => {
            const event: PriceReductionEvent = {
                id: 'test-event-1',
                propertyAddress: '123 Test Street, Test City, TS 12345',
                mlsNumber: 'MLS123456',
                originalPrice: 500000,
                newPrice: 475000,
                priceReduction: 25000,
                priceReductionPercent: 5,
                daysOnMarket: 45,
                eventDate: '2024-01-15T10:30:00.000Z',
                propertyDetails: {
                    bedrooms: 3,
                    bathrooms: 2,
                    squareFeet: 1800,
                    propertyType: 'Single Family',
                },
            };

            const alert = await (monitor as any).createPriceReductionAlert(event);

            expect(alert).toMatchObject({
                id: 'alert-test-event-1',
                userId: '',
                type: 'price-reduction',
                priority: 'low',
                status: 'unread',
                data: {
                    propertyAddress: '123 Test Street, Test City, TS 12345',
                    originalPrice: 500000,
                    newPrice: 475000,
                    priceReduction: 25000,
                    priceReductionPercent: 5,
                    daysOnMarket: 45,
                    propertyDetails: {
                        bedrooms: 3,
                        bathrooms: 2,
                        squareFeet: 1800,
                        propertyType: 'Single Family',
                    },
                },
            });

            expect(alert.createdAt).toBeDefined();
            expect(new Date(alert.createdAt)).toBeInstanceOf(Date);
        });
    });

    describe('monitorPriceReductions', () => {
        it('should handle empty target areas', async () => {
            const targetAreas: TargetArea[] = [];
            const settings: AlertSettings = {
                userId: 'test-user',
                enabledAlertTypes: ['price-reduction'],
                frequency: 'real-time',
                leadScoreThreshold: 70,
                targetAreas: [],
                trackedCompetitors: [],
                updatedAt: new Date().toISOString(),
            };

            const alerts = await monitor.monitorPriceReductions(targetAreas, settings);
            expect(alerts).toEqual([]);
        });
    });
});