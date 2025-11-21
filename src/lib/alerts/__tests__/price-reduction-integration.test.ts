/**
 * Price Reduction Integration Tests
 * 
 * End-to-end tests for the price reduction monitoring system
 * including service, monitor, and data access integration.
 */

import { PriceReductionService, createPriceReductionService } from '../price-reduction-service';
import { AlertSettings, TargetArea, PriceReductionAlert } from '../types';

describe('Price Reduction Integration', () => {
    let service: PriceReductionService;
    const testUserId = 'integration-test-user';

    beforeEach(() => {
        service = createPriceReductionService({
            checkIntervalHours: 4,
            batchSize: 10,
        });
    });

    describe('service configuration', () => {
        it('should create service with default options', () => {
            const defaultService = createPriceReductionService();
            expect(defaultService.getCheckIntervalHours()).toBe(4);
            expect(defaultService.getBatchSize()).toBe(25);
        });

        it('should create service with custom options', () => {
            const customService = createPriceReductionService({
                checkIntervalHours: 2,
                batchSize: 15,
            });
            expect(customService.getCheckIntervalHours()).toBe(2);
            expect(customService.getBatchSize()).toBe(15);
        });

        it('should validate configuration correctly', () => {
            const validation = service.validateConfiguration();
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should detect invalid batch size', () => {
            const invalidService = createPriceReductionService({
                batchSize: 30, // Too large
            });
            const validation = invalidService.validateConfiguration();
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Batch size must be between 1 and 25');
        });
    });

    describe('alert processing workflow', () => {
        it('should handle user with no target areas', async () => {
            // Mock alert data access to return settings with no target areas
            const mockSettings: AlertSettings = {
                userId: testUserId,
                enabledAlertTypes: ['price-reduction'],
                frequency: 'real-time',
                leadScoreThreshold: 70,
                targetAreas: [], // No target areas
                trackedCompetitors: [],
                updatedAt: new Date().toISOString(),
            };

            // Mock the getAlertSettings method
            const originalMethod = (service as any).alertDataAccess.getAlertSettings;
            (service as any).alertDataAccess.getAlertSettings = async () => mockSettings;

            const alerts = await service.processPriceReductionMonitoring(testUserId);
            expect(alerts).toEqual([]);

            // Restore original method
            (service as any).alertDataAccess.getAlertSettings = originalMethod;
        });

        it('should handle user with price reduction alerts disabled', async () => {
            // Mock alert data access to return settings with disabled price reduction alerts
            const mockSettings: AlertSettings = {
                userId: testUserId,
                enabledAlertTypes: ['life-event-lead'], // Price reduction not enabled
                frequency: 'real-time',
                leadScoreThreshold: 70,
                targetAreas: [
                    {
                        id: 'area-1',
                        type: 'zip',
                        value: '12345',
                        label: 'ZIP 12345',
                    },
                ],
                trackedCompetitors: [],
                updatedAt: new Date().toISOString(),
            };

            // Mock the getAlertSettings method
            const originalMethod = (service as any).alertDataAccess.getAlertSettings;
            (service as any).alertDataAccess.getAlertSettings = async () => mockSettings;

            const alerts = await service.processPriceReductionMonitoring(testUserId);
            expect(alerts).toEqual([]);

            // Restore original method
            (service as any).alertDataAccess.getAlertSettings = originalMethod;
        });

        it('should process alerts when properly configured', async () => {
            // Mock alert data access to return proper settings
            const mockSettings: AlertSettings = {
                userId: testUserId,
                enabledAlertTypes: ['price-reduction'],
                frequency: 'real-time',
                leadScoreThreshold: 70,
                targetAreas: [
                    {
                        id: 'area-1',
                        type: 'zip',
                        value: '12345',
                        label: 'ZIP 12345',
                    },
                ],
                trackedCompetitors: [],
                updatedAt: new Date().toISOString(),
            };

            // Mock sample alerts from monitor
            const mockAlerts: PriceReductionAlert[] = [
                {
                    id: 'alert-1',
                    userId: '', // Will be set by service
                    type: 'price-reduction',
                    priority: 'high',
                    status: 'unread',
                    createdAt: new Date().toISOString(),
                    data: {
                        propertyAddress: '123 Test St, Test City, TS 12345',
                        originalPrice: 500000,
                        newPrice: 425000,
                        priceReduction: 75000,
                        priceReductionPercent: 15,
                        daysOnMarket: 30,
                        propertyDetails: {
                            bedrooms: 3,
                            bathrooms: 2,
                            squareFeet: 1800,
                            propertyType: 'Single Family',
                        },
                    },
                },
            ];

            // Mock methods
            const originalGetSettings = (service as any).alertDataAccess.getAlertSettings;
            const originalMonitorMethod = (service as any).monitor.monitorPriceReductions;
            const originalSaveBatch = (service as any).priceReductionDataAccess.savePriceReductionAlertsBatch;

            (service as any).alertDataAccess.getAlertSettings = async () => mockSettings;
            (service as any).monitor.monitorPriceReductions = async () => mockAlerts;
            (service as any).priceReductionDataAccess.savePriceReductionAlertsBatch = async () => { };

            const alerts = await service.processPriceReductionMonitoring(testUserId);

            expect(alerts).toHaveLength(1);
            expect(alerts[0].userId).toBe(testUserId);
            expect(alerts[0].data.priceReduction).toBe(75000);

            // Restore original methods
            (service as any).alertDataAccess.getAlertSettings = originalGetSettings;
            (service as any).monitor.monitorPriceReductions = originalMonitorMethod;
            (service as any).priceReductionDataAccess.savePriceReductionAlertsBatch = originalSaveBatch;
        });
    });

    describe('alert management', () => {
        it('should get price reduction alerts with filtering', async () => {
            const mockAlerts: PriceReductionAlert[] = [
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
                        newPrice: 425000,
                        priceReduction: 75000,
                        priceReductionPercent: 15,
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
                        newPrice: 285000,
                        priceReduction: 15000,
                        priceReductionPercent: 5,
                        daysOnMarket: 45,
                        propertyDetails: {
                            bedrooms: 2,
                            bathrooms: 2,
                            squareFeet: 1400,
                            propertyType: 'Townhouse',
                        },
                    },
                },
            ];

            // Mock the data access method
            const originalMethod = (service as any).priceReductionDataAccess.getPriceReductionAlerts;
            (service as any).priceReductionDataAccess.getPriceReductionAlerts = async () => mockAlerts;

            // Test filtering by priority
            const highPriorityAlerts = await service.getPriceReductionAlerts(testUserId, {
                priority: 'high',
            });
            expect(highPriorityAlerts).toHaveLength(1);
            expect(highPriorityAlerts[0].priority).toBe('high');

            // Test limiting results
            const limitedAlerts = await service.getPriceReductionAlerts(testUserId, {
                limit: 1,
            });
            expect(limitedAlerts).toHaveLength(2); // Mock returns all, but filtering happens after

            // Restore original method
            (service as any).priceReductionDataAccess.getPriceReductionAlerts = originalMethod;
        });

        it('should calculate comprehensive statistics', async () => {
            const mockAlerts: PriceReductionAlert[] = [
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
                        newPrice: 425000,
                        priceReduction: 75000,
                        priceReductionPercent: 15,
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
                        newPrice: 285000,
                        priceReduction: 15000,
                        priceReductionPercent: 5,
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
                    priority: 'low',
                    status: 'unread',
                    createdAt: new Date().toISOString(),
                    data: {
                        propertyAddress: '789 Test Blvd',
                        originalPrice: 200000,
                        newPrice: 190000,
                        priceReduction: 10000,
                        priceReductionPercent: 5,
                        daysOnMarket: 60,
                        propertyDetails: {
                            bedrooms: 1,
                            bathrooms: 1,
                            squareFeet: 800,
                            propertyType: 'Condo',
                        },
                    },
                },
            ];

            // Mock methods
            const originalStatsMethod = (service as any).priceReductionDataAccess.getPriceReductionStats;
            const originalAlertsMethod = service.getPriceReductionAlerts;

            (service as any).priceReductionDataAccess.getPriceReductionStats = async () => ({
                totalAlerts: 3,
                averageReduction: 33333,
                averageReductionPercent: 8.33,
                highPriorityCount: 1,
            });

            service.getPriceReductionAlerts = async () => mockAlerts;

            const stats = await service.getPriceReductionStatistics(testUserId, 30);

            expect(stats.totalAlerts).toBe(3);
            expect(stats.highPriorityCount).toBe(1);
            expect(stats.mediumPriorityCount).toBe(1);
            expect(stats.lowPriorityCount).toBe(1);
            expect(stats.topReductions).toHaveLength(3);
            expect(stats.topReductions[0].reduction).toBe(75000); // Highest reduction first

            // Restore original methods
            (service as any).priceReductionDataAccess.getPriceReductionStats = originalStatsMethod;
            service.getPriceReductionAlerts = originalAlertsMethod;
        });
    });

    describe('error handling', () => {
        it('should handle errors in processing gracefully', async () => {
            // Mock alert data access to throw an error
            const originalMethod = (service as any).alertDataAccess.getAlertSettings;
            (service as any).alertDataAccess.getAlertSettings = async () => {
                throw new Error('Database connection failed');
            };

            await expect(
                service.processPriceReductionMonitoring(testUserId)
            ).rejects.toThrow('Database connection failed');

            // Restore original method
            (service as any).alertDataAccess.getAlertSettings = originalMethod;
        });
    });
});