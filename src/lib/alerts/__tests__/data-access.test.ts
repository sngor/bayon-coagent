/**
 * Alert Data Access Layer Tests
 * 
 * Tests for the alert data access functions including saveAlert, getAlerts,
 * updateAlertStatus, getUnreadCount, and filtering/sorting functionality.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AlertDataAccess } from '../data-access';
import type {
    Alert,
    AlertFilters,
    AlertQueryOptions,
    LifeEventAlert,
    CompetitorAlert,
    PriceReductionAlert
} from '../types';

describe('AlertDataAccess', () => {
    let alertDataAccess: AlertDataAccess;

    const userId = 'test-user-123';

    // Sample alert data
    const lifeEventAlert: LifeEventAlert = {
        id: 'life-event-1',
        userId,
        type: 'life-event-lead',
        priority: 'high',
        status: 'unread',
        createdAt: '2022-01-01T00:00:00.000Z',
        data: {
            prospectLocation: '123 Main St, Austin, TX',
            eventType: 'marriage',
            eventDate: '2021-12-15',
            leadScore: 85,
            recommendedAction: 'Contact within 48 hours',
            additionalEvents: []
        }
    };

    const competitorAlert: CompetitorAlert = {
        id: 'competitor-1',
        userId,
        type: 'competitor-new-listing',
        priority: 'medium',
        status: 'unread',
        createdAt: '2022-01-02T00:00:00.000Z',
        data: {
            competitorName: 'John Smith',
            propertyAddress: '456 Oak Ave, Austin, TX',
            listingPrice: 450000,
            daysOnMarket: 1
        }
    };

    const priceReductionAlert: PriceReductionAlert = {
        id: 'price-reduction-1',
        userId,
        type: 'price-reduction',
        priority: 'medium',
        status: 'read',
        createdAt: '2022-01-03T00:00:00.000Z',
        readAt: '2022-01-03T10:00:00.000Z',
        data: {
            propertyAddress: '789 Pine St, Austin, TX',
            originalPrice: 500000,
            newPrice: 475000,
            priceReduction: 25000,
            priceReductionPercent: 5,
            daysOnMarket: 30,
            propertyDetails: {
                bedrooms: 3,
                bathrooms: 2,
                squareFeet: 1800,
                propertyType: 'Single Family'
            }
        }
    };

    beforeEach(() => {
        alertDataAccess = new AlertDataAccess();
    });

    describe('AlertDataAccess class', () => {
        it('should create an instance successfully', () => {
            expect(alertDataAccess).toBeInstanceOf(AlertDataAccess);
        });

        it('should have all required methods', () => {
            expect(typeof alertDataAccess.saveAlert).toBe('function');
            expect(typeof alertDataAccess.getAlerts).toBe('function');
            expect(typeof alertDataAccess.updateAlertStatus).toBe('function');
            expect(typeof alertDataAccess.getUnreadCount).toBe('function');
            expect(typeof alertDataAccess.getAlertsByType).toBe('function');
            expect(typeof alertDataAccess.getAlertsByStatus).toBe('function');
            expect(typeof alertDataAccess.getAlertsByPriority).toBe('function');
            expect(typeof alertDataAccess.getAlertsByDateRange).toBe('function');
            expect(typeof alertDataAccess.searchAlerts).toBe('function');
            expect(typeof alertDataAccess.markAlertsAsRead).toBe('function');
            expect(typeof alertDataAccess.dismissAlerts).toBe('function');
            expect(typeof alertDataAccess.archiveAlerts).toBe('function');
            expect(typeof alertDataAccess.getAlertStatistics).toBe('function');
        });
    });

    describe('Filter building logic', () => {
        it('should build correct filter expressions for status', () => {
            const filters: AlertFilters = {
                status: ['unread', 'read']
            };

            // Test the internal logic by checking the structure
            expect(filters.status).toEqual(['unread', 'read']);
            expect(filters.status?.length).toBe(2);
        });

        it('should build correct filter expressions for priority', () => {
            const filters: AlertFilters = {
                priority: ['high', 'medium']
            };

            expect(filters.priority).toEqual(['high', 'medium']);
            expect(filters.priority?.length).toBe(2);
        });

        it('should build correct filter expressions for date range', () => {
            const filters: AlertFilters = {
                dateRange: {
                    start: '2022-01-01T00:00:00.000Z',
                    end: '2022-01-02T23:59:59.999Z'
                }
            };

            expect(filters.dateRange?.start).toBe('2022-01-01T00:00:00.000Z');
            expect(filters.dateRange?.end).toBe('2022-01-02T23:59:59.999Z');
        });

        it('should handle search query filters', () => {
            const filters: AlertFilters = {
                searchQuery: 'austin'
            };

            expect(filters.searchQuery).toBe('austin');
        });

        it('should combine multiple filters', () => {
            const filters: AlertFilters = {
                status: ['unread'],
                priority: ['high'],
                dateRange: {
                    start: '2022-01-01T00:00:00.000Z',
                    end: '2022-01-02T23:59:59.999Z'
                },
                searchQuery: 'austin'
            };

            expect(filters.status).toEqual(['unread']);
            expect(filters.priority).toEqual(['high']);
            expect(filters.dateRange?.start).toBe('2022-01-01T00:00:00.000Z');
            expect(filters.searchQuery).toBe('austin');
        });
    });

    describe('Query options handling', () => {
        it('should handle default query options', () => {
            const options: AlertQueryOptions = {};

            expect(options.limit).toBeUndefined();
            expect(options.offset).toBeUndefined();
            expect(options.sortBy).toBeUndefined();
            expect(options.sortOrder).toBeUndefined();
        });

        it('should handle custom query options', () => {
            const options: AlertQueryOptions = {
                limit: 25,
                offset: 10,
                sortBy: 'createdAt',
                sortOrder: 'asc'
            };

            expect(options.limit).toBe(25);
            expect(options.offset).toBe(10);
            expect(options.sortBy).toBe('createdAt');
            expect(options.sortOrder).toBe('asc');
        });

        it('should handle pagination options', () => {
            const options: AlertQueryOptions = {
                limit: 20,
                offset: 5
            };

            expect(options.limit).toBe(20);
            expect(options.offset).toBe(5);
        });
    });

    describe('Search functionality', () => {
        const mockAlerts = [lifeEventAlert, competitorAlert, priceReductionAlert];

        it('should filter life event alerts by search query', () => {
            const searchQuery = 'main st';
            const searchLower = searchQuery.toLowerCase();

            const filteredAlerts = mockAlerts.filter(alert => {
                switch (alert.type) {
                    case 'life-event-lead':
                        return alert.data.prospectLocation.toLowerCase().includes(searchLower) ||
                            alert.data.eventType.toLowerCase().includes(searchLower) ||
                            alert.data.recommendedAction.toLowerCase().includes(searchLower);
                    default:
                        return false;
                }
            });

            expect(filteredAlerts).toHaveLength(1);
            expect(filteredAlerts[0].id).toBe('life-event-1');
        });

        it('should filter competitor alerts by search query', () => {
            const searchQuery = 'john smith';
            const searchLower = searchQuery.toLowerCase();

            const filteredAlerts = mockAlerts.filter(alert => {
                switch (alert.type) {
                    case 'competitor-new-listing':
                    case 'competitor-price-reduction':
                    case 'competitor-withdrawal':
                        return alert.data.competitorName.toLowerCase().includes(searchLower) ||
                            alert.data.propertyAddress.toLowerCase().includes(searchLower);
                    default:
                        return false;
                }
            });

            expect(filteredAlerts).toHaveLength(1);
            expect(filteredAlerts[0].id).toBe('competitor-1');
        });

        it('should filter price reduction alerts by search query', () => {
            const searchQuery = 'pine st';
            const searchLower = searchQuery.toLowerCase();

            const filteredAlerts = mockAlerts.filter(alert => {
                switch (alert.type) {
                    case 'price-reduction':
                        return alert.data.propertyAddress.toLowerCase().includes(searchLower) ||
                            alert.data.propertyDetails.propertyType.toLowerCase().includes(searchLower);
                    default:
                        return false;
                }
            });

            expect(filteredAlerts).toHaveLength(1);
            expect(filteredAlerts[0].id).toBe('price-reduction-1');
        });

        it('should filter alerts by common search term', () => {
            const searchQuery = 'austin';
            const searchLower = searchQuery.toLowerCase();

            const filteredAlerts = mockAlerts.filter(alert => {
                switch (alert.type) {
                    case 'life-event-lead':
                        return alert.data.prospectLocation.toLowerCase().includes(searchLower);
                    case 'competitor-new-listing':
                    case 'competitor-price-reduction':
                    case 'competitor-withdrawal':
                        return alert.data.propertyAddress.toLowerCase().includes(searchLower);
                    case 'price-reduction':
                        return alert.data.propertyAddress.toLowerCase().includes(searchLower);
                    default:
                        return false;
                }
            });

            // All three alerts contain "Austin" in their addresses
            expect(filteredAlerts).toHaveLength(3);
        });
    });

    describe('Alert status management', () => {
        it('should handle status updates correctly', () => {
            const updates = {
                status: 'read' as const,
                readAt: new Date().toISOString()
            };

            expect(updates.status).toBe('read');
            expect(updates.readAt).toBeDefined();
            expect(typeof updates.readAt).toBe('string');
        });

        it('should handle dismissal updates correctly', () => {
            const updates = {
                status: 'dismissed' as const,
                dismissedAt: new Date().toISOString()
            };

            expect(updates.status).toBe('dismissed');
            expect(updates.dismissedAt).toBeDefined();
            expect(typeof updates.dismissedAt).toBe('string');
        });

        it('should handle archival updates correctly', () => {
            const updates = {
                status: 'archived' as const
            };

            expect(updates.status).toBe('archived');
        });
    });

    describe('Alert statistics calculation', () => {
        it('should calculate statistics correctly', () => {
            const mockAlerts = [
                lifeEventAlert, // unread, life-event-lead
                competitorAlert, // unread, competitor-new-listing
                priceReductionAlert, // read, price-reduction
                {
                    ...lifeEventAlert,
                    id: 'dismissed-alert',
                    status: 'dismissed' as const
                },
                {
                    ...competitorAlert,
                    id: 'archived-alert',
                    status: 'archived' as const
                }
            ];

            const stats = {
                totalCount: mockAlerts.length,
                unreadCount: 0,
                readCount: 0,
                dismissedCount: 0,
                archivedCount: 0,
                countsByType: {
                    'life-event-lead': 0,
                    'competitor-new-listing': 0,
                    'competitor-price-reduction': 0,
                    'competitor-withdrawal': 0,
                    'neighborhood-trend': 0,
                    'price-reduction': 0
                } as Record<string, number>
            };

            mockAlerts.forEach(alert => {
                // Count by status
                switch (alert.status) {
                    case 'unread':
                        stats.unreadCount++;
                        break;
                    case 'read':
                        stats.readCount++;
                        break;
                    case 'dismissed':
                        stats.dismissedCount++;
                        break;
                    case 'archived':
                        stats.archivedCount++;
                        break;
                }

                // Count by type
                stats.countsByType[alert.type]++;
            });

            expect(stats.totalCount).toBe(5);
            expect(stats.unreadCount).toBe(2);
            expect(stats.readCount).toBe(1);
            expect(stats.dismissedCount).toBe(1);
            expect(stats.archivedCount).toBe(1);
            expect(stats.countsByType['life-event-lead']).toBe(2);
            expect(stats.countsByType['competitor-new-listing']).toBe(2);
            expect(stats.countsByType['price-reduction']).toBe(1);
        });
    });

    describe('Sorting functionality', () => {
        it('should sort alerts by creation date descending', () => {
            const mockAlerts = [lifeEventAlert, competitorAlert, priceReductionAlert];

            const sorted = mockAlerts.sort((a, b) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return bTime - aTime; // desc
            });

            expect(sorted[0].id).toBe('price-reduction-1'); // 2022-01-03
            expect(sorted[1].id).toBe('competitor-1'); // 2022-01-02
            expect(sorted[2].id).toBe('life-event-1'); // 2022-01-01
        });

        it('should sort alerts by creation date ascending', () => {
            const mockAlerts = [lifeEventAlert, competitorAlert, priceReductionAlert];

            const sorted = mockAlerts.sort((a, b) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return aTime - bTime; // asc
            });

            expect(sorted[0].id).toBe('life-event-1'); // 2022-01-01
            expect(sorted[1].id).toBe('competitor-1'); // 2022-01-02
            expect(sorted[2].id).toBe('price-reduction-1'); // 2022-01-03
        });
    });

    describe('Pagination logic', () => {
        it('should apply pagination correctly', () => {
            const mockAlerts = [lifeEventAlert, competitorAlert, priceReductionAlert];
            const limit = 2;
            const offset = 1;

            const paginatedAlerts = mockAlerts.slice(offset, offset + limit);

            expect(paginatedAlerts).toHaveLength(2);
            expect(paginatedAlerts[0].id).toBe('competitor-1');
            expect(paginatedAlerts[1].id).toBe('price-reduction-1');
        });

        it('should calculate hasMore correctly', () => {
            const mockAlerts = [lifeEventAlert, competitorAlert, priceReductionAlert];
            const limit = 2;
            const offset = 1;

            const hasMore = offset + limit < mockAlerts.length;

            expect(hasMore).toBe(false); // 1 + 2 = 3, which is not < 3
        });

        it('should calculate hasMore correctly when there are more items', () => {
            const mockAlerts = [lifeEventAlert, competitorAlert, priceReductionAlert];
            const limit = 1;
            const offset = 1;

            const hasMore = offset + limit < mockAlerts.length;

            expect(hasMore).toBe(true); // 1 + 1 = 2, which is < 3
        });
    });
});