/**
 * Competitor Monitor Tests
 * 
 * Tests for the competitor monitoring system including event detection,
 * alert generation, and capacity validation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CompetitorMonitor, createCompetitorMonitor } from '../competitor-monitor';
import {
    Competitor,
    TargetArea,
    ListingEvent,
    CompetitorAlert,
    MLSListingData,
} from '../types';

// Mock the repository
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn(() => ({
        createTrackedCompetitor: jest.fn(),
        getTrackedCompetitor: jest.fn(),
        queryTrackedCompetitors: jest.fn(),
        updateTrackedCompetitor: jest.fn(),
        deleteTrackedCompetitor: jest.fn(),
        createAlert: jest.fn(),
    })),
}));

describe('CompetitorMonitor', () => {
    let competitorMonitor: CompetitorMonitor;
    let mockCompetitors: Competitor[];
    let mockTargetAreas: TargetArea[];

    beforeEach(() => {
        competitorMonitor = createCompetitorMonitor();

        mockCompetitors = [
            {
                id: 'comp-1',
                name: 'John Smith',
                agency: 'ABC Realty',
                licenseNumber: '12345',
                targetAreas: ['90210', '90211'],
                isActive: true,
                addedAt: '2024-01-01T00:00:00Z',
            },
            {
                id: 'comp-2',
                name: 'Jane Doe',
                agency: 'XYZ Properties',
                targetAreas: ['90210'],
                isActive: true,
                addedAt: '2024-01-01T00:00:00Z',
            },
        ];

        mockTargetAreas = [
            {
                id: 'area-1',
                type: 'zip',
                value: '90210',
                label: 'Beverly Hills',
            },
            {
                id: 'area-2',
                type: 'city',
                value: 'Seattle',
                label: 'Seattle',
            },
        ];
    });

    describe('Constructor and Configuration', () => {
        it('should create with default options', () => {
            const monitor = new CompetitorMonitor();
            expect(monitor.getMaxCompetitors()).toBe(20);
        });

        it('should create with custom options', () => {
            const monitor = new CompetitorMonitor({
                maxCompetitors: 10,
                priceReductionThreshold: 10,
            });
            expect(monitor.getMaxCompetitors()).toBe(10);
        });

        it('should create using factory function', () => {
            const monitor = createCompetitorMonitor({ maxCompetitors: 15 });
            expect(monitor.getMaxCompetitors()).toBe(15);
        });
    });

    describe('Competitor Capacity Validation', () => {
        it('should validate competitor capacity within limits', () => {
            const result = competitorMonitor.validateCompetitorCapacity(10);
            expect(result).toBe(true);
        });

        it('should reject capacity over limit', () => {
            const result = competitorMonitor.validateCompetitorCapacity(25);
            expect(result).toBe(false);
        });

        it('should accept capacity at exact limit', () => {
            const result = competitorMonitor.validateCompetitorCapacity(20);
            expect(result).toBe(true);
        });

        it('should throw error when tracking too many competitors', async () => {
            const tooManyCompetitors = Array.from({ length: 25 }, (_, i) => ({
                ...mockCompetitors[0],
                id: `comp-${i}`,
            }));

            await expect(
                competitorMonitor.trackListingEvents(tooManyCompetitors, mockTargetAreas)
            ).rejects.toThrow('Cannot track more than 20 competitors');
        });
    });

    describe('Listing Event Detection', () => {
        it('should detect new listings', async () => {
            // Mock the private method for testing
            const mockMLSData: MLSListingData[] = [
                {
                    mlsNumber: 'MLS123',
                    address: '123 Main St, Beverly Hills, CA',
                    price: 1000000,
                    status: 'Active',
                    listDate: new Date().toISOString(), // Today
                    agentId: 'agent-1',
                    agentName: 'John Smith',
                    daysOnMarket: 1,
                    propertyType: 'Single Family',
                    bedrooms: 4,
                    bathrooms: 3,
                    squareFeet: 2500,
                },
            ];

            // Spy on the private method
            const fetchMLSDataSpy = jest.spyOn(
                competitorMonitor as any,
                'fetchMLSDataForCompetitor'
            );
            fetchMLSDataSpy.mockResolvedValue(mockMLSData);

            const events = await competitorMonitor.detectNewListings(
                mockCompetitors[0],
                mockTargetAreas
            );

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                competitorId: 'comp-1',
                propertyAddress: '123 Main St, Beverly Hills, CA',
                eventType: 'new-listing',
                listingPrice: 1000000,
            });

            fetchMLSDataSpy.mockRestore();
        });

        it('should not detect old listings as new', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 5); // 5 days ago

            const mockMLSData: MLSListingData[] = [
                {
                    mlsNumber: 'MLS123',
                    address: '123 Main St, Beverly Hills, CA',
                    price: 1000000,
                    status: 'Active',
                    listDate: oldDate.toISOString(),
                    agentId: 'agent-1',
                    agentName: 'John Smith',
                    daysOnMarket: 5,
                    propertyType: 'Single Family',
                    bedrooms: 4,
                    bathrooms: 3,
                    squareFeet: 2500,
                },
            ];

            const fetchMLSDataSpy = jest.spyOn(
                competitorMonitor as any,
                'fetchMLSDataForCompetitor'
            );
            fetchMLSDataSpy.mockResolvedValue(mockMLSData);

            const events = await competitorMonitor.detectNewListings(
                mockCompetitors[0],
                mockTargetAreas
            );

            expect(events).toHaveLength(0);
            fetchMLSDataSpy.mockRestore();
        });

        it('should detect price reductions above threshold', async () => {
            const mockMLSData: MLSListingData[] = [
                {
                    mlsNumber: 'MLS123',
                    address: '123 Main St, Beverly Hills, CA',
                    price: 900000, // Reduced from 1000000
                    status: 'Active',
                    listDate: '2024-01-01T00:00:00Z',
                    agentId: 'agent-1',
                    agentName: 'John Smith',
                    daysOnMarket: 30,
                    propertyType: 'Single Family',
                    bedrooms: 4,
                    bathrooms: 3,
                    squareFeet: 2500,
                },
            ];

            const fetchMLSDataSpy = jest.spyOn(
                competitorMonitor as any,
                'fetchMLSDataForCompetitor'
            );
            fetchMLSDataSpy.mockResolvedValue(mockMLSData);

            const getPriceHistorySpy = jest.spyOn(
                competitorMonitor as any,
                'getPriceHistory'
            );
            getPriceHistorySpy.mockResolvedValue([
                { date: '2024-01-01T00:00:00Z', price: 1000000 },
            ]);

            const events = await competitorMonitor.detectPriceReductions(
                mockCompetitors[0],
                mockTargetAreas
            );

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                competitorId: 'comp-1',
                propertyAddress: '123 Main St, Beverly Hills, CA',
                eventType: 'price-reduction',
                originalPrice: 1000000,
                newPrice: 900000,
            });

            fetchMLSDataSpy.mockRestore();
            getPriceHistorySpy.mockRestore();
        });

        it('should not detect price reductions below threshold', async () => {
            const mockMLSData: MLSListingData[] = [
                {
                    mlsNumber: 'MLS123',
                    address: '123 Main St, Beverly Hills, CA',
                    price: 980000, // Only 2% reduction
                    status: 'Active',
                    listDate: '2024-01-01T00:00:00Z',
                    agentId: 'agent-1',
                    agentName: 'John Smith',
                    daysOnMarket: 30,
                    propertyType: 'Single Family',
                    bedrooms: 4,
                    bathrooms: 3,
                    squareFeet: 2500,
                },
            ];

            const fetchMLSDataSpy = jest.spyOn(
                competitorMonitor as any,
                'fetchMLSDataForCompetitor'
            );
            fetchMLSDataSpy.mockResolvedValue(mockMLSData);

            const getPriceHistorySpy = jest.spyOn(
                competitorMonitor as any,
                'getPriceHistory'
            );
            getPriceHistorySpy.mockResolvedValue([
                { date: '2024-01-01T00:00:00Z', price: 1000000 },
            ]);

            const events = await competitorMonitor.detectPriceReductions(
                mockCompetitors[0],
                mockTargetAreas
            );

            expect(events).toHaveLength(0);

            fetchMLSDataSpy.mockRestore();
            getPriceHistorySpy.mockRestore();
        });

        it('should detect withdrawals and expirations', async () => {
            const mockMLSData: MLSListingData[] = [
                {
                    mlsNumber: 'MLS123',
                    address: '123 Main St, Beverly Hills, CA',
                    price: 1000000,
                    status: 'Withdrawn',
                    listDate: '2024-01-01T00:00:00Z',
                    agentId: 'agent-1',
                    agentName: 'John Smith',
                    daysOnMarket: 45,
                    propertyType: 'Single Family',
                    bedrooms: 4,
                    bathrooms: 3,
                    squareFeet: 2500,
                },
            ];

            const fetchMLSDataSpy = jest.spyOn(
                competitorMonitor as any,
                'fetchMLSDataForCompetitor'
            );
            fetchMLSDataSpy.mockResolvedValue(mockMLSData);

            const getStatusChangeDateSpy = jest.spyOn(
                competitorMonitor as any,
                'getStatusChangeDate'
            );
            getStatusChangeDateSpy.mockResolvedValue(new Date().toISOString());

            const events = await competitorMonitor.detectWithdrawals(
                mockCompetitors[0],
                mockTargetAreas
            );

            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({
                competitorId: 'comp-1',
                propertyAddress: '123 Main St, Beverly Hills, CA',
                eventType: 'withdrawal',
                daysOnMarket: 45,
            });

            fetchMLSDataSpy.mockRestore();
            getStatusChangeDateSpy.mockRestore();
        });
    });

    describe('Alert Generation', () => {
        it('should track listing events and generate alerts', async () => {
            // Mock all the detection methods
            const detectNewListingsSpy = jest.spyOn(competitorMonitor, 'detectNewListings');
            const detectPriceReductionsSpy = jest.spyOn(competitorMonitor, 'detectPriceReductions');
            const detectWithdrawalsSpy = jest.spyOn(competitorMonitor, 'detectWithdrawals');

            const mockNewListing: ListingEvent = {
                id: 'event-1',
                competitorId: 'comp-1',
                propertyAddress: '123 Main St',
                eventType: 'new-listing',
                eventDate: new Date().toISOString(),
                listingPrice: 1000000,
                mlsNumber: 'MLS123',
            };

            detectNewListingsSpy.mockResolvedValue([mockNewListing]);
            detectPriceReductionsSpy.mockResolvedValue([]);
            detectWithdrawalsSpy.mockResolvedValue([]);

            const alerts = await competitorMonitor.trackListingEvents(
                [mockCompetitors[0]], // Only track one competitor
                mockTargetAreas
            );

            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toMatchObject({
                type: 'competitor-new-listing',
                data: {
                    competitorName: 'John Smith',
                    propertyAddress: '123 Main St',
                    listingPrice: 1000000,
                },
            });

            detectNewListingsSpy.mockRestore();
            detectPriceReductionsSpy.mockRestore();
            detectWithdrawalsSpy.mockRestore();
        });

        it('should skip inactive competitors', async () => {
            const inactiveCompetitor = { ...mockCompetitors[0], isActive: false };

            const detectNewListingsSpy = jest.spyOn(competitorMonitor, 'detectNewListings');
            detectNewListingsSpy.mockResolvedValue([]);

            const alerts = await competitorMonitor.trackListingEvents(
                [inactiveCompetitor],
                mockTargetAreas
            );

            expect(alerts).toHaveLength(0);
            expect(detectNewListingsSpy).not.toHaveBeenCalled();

            detectNewListingsSpy.mockRestore();
        });

        it('should continue processing other competitors if one fails', async () => {
            const detectNewListingsSpy = jest.spyOn(competitorMonitor, 'detectNewListings');
            const detectPriceReductionsSpy = jest.spyOn(competitorMonitor, 'detectPriceReductions');
            const detectWithdrawalsSpy = jest.spyOn(competitorMonitor, 'detectWithdrawals');

            // First competitor throws error, second succeeds
            detectNewListingsSpy
                .mockRejectedValueOnce(new Error('API Error'))
                .mockResolvedValueOnce([]);
            detectPriceReductionsSpy.mockResolvedValue([]);
            detectWithdrawalsSpy.mockResolvedValue([]);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const alerts = await competitorMonitor.trackListingEvents(
                mockCompetitors, // Both competitors
                mockTargetAreas
            );

            expect(alerts).toHaveLength(0); // No alerts generated due to errors
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error tracking competitor John Smith:',
                expect.any(Error)
            );

            detectNewListingsSpy.mockRestore();
            detectPriceReductionsSpy.mockRestore();
            detectWithdrawalsSpy.mockRestore();
            consoleSpy.mockRestore();
        });
    });

    describe('Alert Priority Calculation', () => {
        it('should assign high priority to significant price reductions', () => {
            const event: ListingEvent = {
                id: 'event-1',
                competitorId: 'comp-1',
                propertyAddress: '123 Main St',
                eventType: 'price-reduction',
                eventDate: new Date().toISOString(),
                originalPrice: 1000000,
                newPrice: 800000, // 20% reduction
            };

            const priority = (competitorMonitor as any).calculateAlertPriority(event);
            expect(priority).toBe('high');
        });

        it('should assign high priority to quick withdrawals', () => {
            const event: ListingEvent = {
                id: 'event-1',
                competitorId: 'comp-1',
                propertyAddress: '123 Main St',
                eventType: 'withdrawal',
                eventDate: new Date().toISOString(),
                daysOnMarket: 15, // Quick withdrawal
            };

            const priority = (competitorMonitor as any).calculateAlertPriority(event);
            expect(priority).toBe('high');
        });

        it('should assign medium priority to expensive new listings', () => {
            const event: ListingEvent = {
                id: 'event-1',
                competitorId: 'comp-1',
                propertyAddress: '123 Main St',
                eventType: 'new-listing',
                eventDate: new Date().toISOString(),
                listingPrice: 750000, // Above $500k threshold
            };

            const priority = (competitorMonitor as any).calculateAlertPriority(event);
            expect(priority).toBe('medium');
        });

        it('should assign low priority to other events', () => {
            const event: ListingEvent = {
                id: 'event-1',
                competitorId: 'comp-1',
                propertyAddress: '123 Main St',
                eventType: 'new-listing',
                eventDate: new Date().toISOString(),
                listingPrice: 300000, // Below $500k threshold
            };

            const priority = (competitorMonitor as any).calculateAlertPriority(event);
            expect(priority).toBe('low');
        });
    });

    describe('Error Handling', () => {
        it('should handle MLS API errors gracefully', async () => {
            const fetchMLSDataSpy = jest.spyOn(
                competitorMonitor as any,
                'fetchMLSDataForCompetitor'
            );
            fetchMLSDataSpy.mockRejectedValue(new Error('MLS API Error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const events = await competitorMonitor.detectNewListings(
                mockCompetitors[0],
                mockTargetAreas
            );

            expect(events).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error detecting new listings for John Smith:',
                expect.any(Error)
            );

            fetchMLSDataSpy.mockRestore();
            consoleSpy.mockRestore();
        });

        it('should handle price history errors gracefully', async () => {
            const fetchMLSDataSpy = jest.spyOn(
                competitorMonitor as any,
                'fetchMLSDataForCompetitor'
            );
            fetchMLSDataSpy.mockResolvedValue([
                {
                    mlsNumber: 'MLS123',
                    address: '123 Main St',
                    price: 900000,
                    status: 'Active',
                    listDate: '2024-01-01T00:00:00Z',
                    agentId: 'agent-1',
                    agentName: 'John Smith',
                    daysOnMarket: 30,
                    propertyType: 'Single Family',
                    bedrooms: 4,
                    bathrooms: 3,
                    squareFeet: 2500,
                },
            ]);

            const getPriceHistorySpy = jest.spyOn(
                competitorMonitor as any,
                'getPriceHistory'
            );
            getPriceHistorySpy.mockRejectedValue(new Error('Price history error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const events = await competitorMonitor.detectPriceReductions(
                mockCompetitors[0],
                mockTargetAreas
            );

            expect(events).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error detecting price reductions for John Smith:',
                expect.any(Error)
            );

            fetchMLSDataSpy.mockRestore();
            getPriceHistorySpy.mockRestore();
            consoleSpy.mockRestore();
        });
    });
});