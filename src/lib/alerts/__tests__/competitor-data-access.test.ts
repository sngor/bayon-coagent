/**
 * Competitor Data Access Tests
 * 
 * Tests for the competitor data access layer including CRUD operations,
 * validation, and alert management.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    Competitor,
    CompetitorAlert,
    ListingEvent,
    AlertFilters,
    AlertQueryOptions,
    AlertsResponse,
} from '../types';

// Create a mock implementation of CompetitorDataAccess for testing
class MockCompetitorDataAccess {
    private competitors: Map<string, Competitor> = new Map();
    private listingEvents: Map<string, ListingEvent> = new Map();
    private alerts: Map<string, CompetitorAlert> = new Map();

    // Competitor Management
    async saveTrackedCompetitor(userId: string, competitor: Competitor): Promise<void> {
        this.competitors.set(`${userId}:${competitor.id}`, competitor);
    }

    async getTrackedCompetitor(userId: string, competitorId: string): Promise<Competitor | null> {
        return this.competitors.get(`${userId}:${competitorId}`) || null;
    }

    async getTrackedCompetitors(userId: string): Promise<Competitor[]> {
        const userCompetitors: Competitor[] = [];
        for (const [key, competitor] of this.competitors.entries()) {
            if (key.startsWith(`${userId}:`)) {
                userCompetitors.push(competitor);
            }
        }
        return userCompetitors;
    }

    async updateTrackedCompetitor(
        userId: string,
        competitorId: string,
        updates: Partial<Competitor>
    ): Promise<void> {
        const key = `${userId}:${competitorId}`;
        const existing = this.competitors.get(key);
        if (existing) {
            this.competitors.set(key, { ...existing, ...updates });
        }
    }

    async removeTrackedCompetitor(userId: string, competitorId: string): Promise<void> {
        this.competitors.delete(`${userId}:${competitorId}`);
    }

    async getTrackedCompetitorCount(userId: string): Promise<number> {
        return (await this.getTrackedCompetitors(userId)).length;
    }

    async canAddMoreCompetitors(userId: string, maxCompetitors: number = 20): Promise<boolean> {
        const count = await this.getTrackedCompetitorCount(userId);
        return count < maxCompetitors;
    }

    // Listing Event Management
    async saveListingEvent(userId: string, event: ListingEvent): Promise<void> {
        this.listingEvents.set(`${userId}:${event.id}`, event);
    }

    async getListingEvent(userId: string, eventId: string): Promise<ListingEvent | null> {
        return this.listingEvents.get(`${userId}:${eventId}`) || null;
    }

    async getListingEvents(
        userId: string,
        options: AlertQueryOptions = {}
    ): Promise<ListingEvent[]> {
        const userEvents: ListingEvent[] = [];
        for (const [key, event] of this.listingEvents.entries()) {
            if (key.startsWith(`${userId}:`)) {
                userEvents.push(event);
            }
        }
        return userEvents.slice(0, options.limit || 50);
    }

    async getListingEventsForCompetitor(
        userId: string,
        competitorId: string,
        options: AlertQueryOptions = {}
    ): Promise<ListingEvent[]> {
        const allEvents = await this.getListingEvents(userId, options);
        return allEvents.filter(event => event.competitorId === competitorId);
    }

    // Alert Management
    async saveCompetitorAlert(userId: string, alert: CompetitorAlert): Promise<void> {
        this.alerts.set(`${userId}:${alert.id}`, { ...alert, userId });
    }

    async getCompetitorAlerts(
        userId: string,
        filters: AlertFilters = {},
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const userAlerts: CompetitorAlert[] = [];
        for (const [key, alert] of this.alerts.entries()) {
            if (key.startsWith(`${userId}:`)) {
                userAlerts.push(alert);
            }
        }

        const competitorTypes = [
            'competitor-new-listing',
            'competitor-price-reduction',
            'competitor-withdrawal'
        ];

        const filteredAlerts = userAlerts.filter(alert =>
            competitorTypes.includes(alert.type)
        );

        const unreadCount = filteredAlerts.filter(alert => alert.status === 'unread').length;

        return {
            alerts: filteredAlerts,
            totalCount: filteredAlerts.length,
            unreadCount,
            hasMore: false,
        };
    }

    async markCompetitorAlertAsRead(
        userId: string,
        alertId: string,
        timestamp: string
    ): Promise<void> {
        const key = `${userId}:${alertId}`;
        const alert = this.alerts.get(key);
        if (alert) {
            this.alerts.set(key, {
                ...alert,
                status: 'read',
                readAt: new Date().toISOString(),
            });
        }
    }

    async dismissCompetitorAlert(
        userId: string,
        alertId: string,
        timestamp: string
    ): Promise<void> {
        const key = `${userId}:${alertId}`;
        const alert = this.alerts.get(key);
        if (alert) {
            this.alerts.set(key, {
                ...alert,
                status: 'dismissed',
                dismissedAt: new Date().toISOString(),
            });
        }
    }

    async getUnreadCompetitorAlertCount(userId: string): Promise<number> {
        const response = await this.getCompetitorAlerts(userId, { status: ['unread'] });
        return response.unreadCount;
    }

    // Validation methods
    validateCompetitor(competitor: Partial<Competitor>): boolean {
        if (!competitor.name || competitor.name.trim().length === 0) {
            throw new Error('Competitor name is required');
        }

        if (!competitor.agency || competitor.agency.trim().length === 0) {
            throw new Error('Competitor agency is required');
        }

        if (!competitor.targetAreas || competitor.targetAreas.length === 0) {
            throw new Error('At least one target area is required');
        }

        return true;
    }

    createCompetitor(competitorData: Partial<Competitor>): Competitor {
        this.validateCompetitor(competitorData);

        return {
            id: competitorData.id || `competitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: competitorData.name!,
            agency: competitorData.agency!,
            licenseNumber: competitorData.licenseNumber,
            targetAreas: competitorData.targetAreas!,
            isActive: competitorData.isActive ?? true,
            addedAt: competitorData.addedAt || new Date().toISOString(),
        };
    }

    // Helper method for filtering (simplified version)
    applyAlertFilters(alerts: CompetitorAlert[], filters: AlertFilters): CompetitorAlert[] {
        let filtered = alerts;

        if (filters.types && filters.types.length > 0) {
            filtered = filtered.filter(alert => filters.types!.includes(alert.type));
        }

        if (filters.status && filters.status.length > 0) {
            filtered = filtered.filter(alert => filters.status!.includes(alert.status));
        }

        if (filters.priority && filters.priority.length > 0) {
            filtered = filtered.filter(alert => filters.priority!.includes(alert.priority));
        }

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(alert => {
                if ('data' in alert && alert.data) {
                    const data = alert.data as any;
                    const searchableText = [
                        data.competitorName,
                        data.propertyAddress,
                    ].filter(Boolean).join(' ').toLowerCase();
                    return searchableText.includes(query);
                }
                return false;
            });
        }

        return filtered;
    }
}

describe('CompetitorDataAccess', () => {
    let dataAccess: MockCompetitorDataAccess;
    let mockCompetitor: Competitor;
    let mockAlert: CompetitorAlert;
    let mockListingEvent: ListingEvent;

    beforeEach(() => {
        dataAccess = new MockCompetitorDataAccess();

        mockCompetitor = {
            id: 'comp-1',
            name: 'John Smith',
            agency: 'ABC Realty',
            licenseNumber: '12345',
            targetAreas: ['90210', '90211'],
            isActive: true,
            addedAt: '2024-01-01T00:00:00Z',
        };

        mockAlert = {
            id: 'alert-1',
            userId: 'user-1',
            type: 'competitor-new-listing',
            priority: 'medium',
            status: 'unread',
            createdAt: '2024-01-01T00:00:00Z',
            data: {
                competitorName: 'John Smith',
                propertyAddress: '123 Main St',
                listingPrice: 1000000,
            },
        };

        mockListingEvent = {
            id: 'event-1',
            competitorId: 'comp-1',
            propertyAddress: '123 Main St',
            eventType: 'new-listing',
            eventDate: '2024-01-01T00:00:00Z',
            listingPrice: 1000000,
            mlsNumber: 'MLS123',
        };
    });

    describe('Competitor Management', () => {
        it('should save a tracked competitor', async () => {
            await dataAccess.saveTrackedCompetitor('user-1', mockCompetitor);
            const result = await dataAccess.getTrackedCompetitor('user-1', 'comp-1');
            expect(result).toEqual(mockCompetitor);
        });

        it('should get a tracked competitor by ID', async () => {
            await dataAccess.saveTrackedCompetitor('user-1', mockCompetitor);
            const result = await dataAccess.getTrackedCompetitor('user-1', 'comp-1');
            expect(result).toEqual(mockCompetitor);
        });

        it('should return null for non-existent competitor', async () => {
            const result = await dataAccess.getTrackedCompetitor('user-1', 'non-existent');
            expect(result).toBeNull();
        });

        it('should get all tracked competitors for a user', async () => {
            await dataAccess.saveTrackedCompetitor('user-1', mockCompetitor);
            const result = await dataAccess.getTrackedCompetitors('user-1');
            expect(result).toEqual([mockCompetitor]);
        });

        it('should update a tracked competitor', async () => {
            await dataAccess.saveTrackedCompetitor('user-1', mockCompetitor);
            const updates = { name: 'John Updated', isActive: false };
            await dataAccess.updateTrackedCompetitor('user-1', 'comp-1', updates);

            const result = await dataAccess.getTrackedCompetitor('user-1', 'comp-1');
            expect(result).toMatchObject(updates);
        });

        it('should remove a tracked competitor', async () => {
            await dataAccess.saveTrackedCompetitor('user-1', mockCompetitor);
            await dataAccess.removeTrackedCompetitor('user-1', 'comp-1');

            const result = await dataAccess.getTrackedCompetitor('user-1', 'comp-1');
            expect(result).toBeNull();
        });

        it('should get tracked competitor count', async () => {
            await dataAccess.saveTrackedCompetitor('user-1', mockCompetitor);
            const count = await dataAccess.getTrackedCompetitorCount('user-1');
            expect(count).toBe(1);
        });

        it('should validate if user can add more competitors', async () => {
            await dataAccess.saveTrackedCompetitor('user-1', mockCompetitor);
            const canAdd = await dataAccess.canAddMoreCompetitors('user-1', 20);
            expect(canAdd).toBe(true);
        });

        it('should reject adding competitors when at capacity', async () => {
            // Add 20 competitors
            for (let i = 0; i < 20; i++) {
                const competitor = { ...mockCompetitor, id: `comp-${i}` };
                await dataAccess.saveTrackedCompetitor('user-1', competitor);
            }

            const canAdd = await dataAccess.canAddMoreCompetitors('user-1', 20);
            expect(canAdd).toBe(false);
        });
    });

    describe('Listing Event Management', () => {
        it('should save a listing event', async () => {
            await dataAccess.saveListingEvent('user-1', mockListingEvent);
            const result = await dataAccess.getListingEvent('user-1', 'event-1');
            expect(result).toEqual(mockListingEvent);
        });

        it('should get a listing event by ID', async () => {
            await dataAccess.saveListingEvent('user-1', mockListingEvent);
            const result = await dataAccess.getListingEvent('user-1', 'event-1');
            expect(result).toEqual(mockListingEvent);
        });

        it('should get listing events with query options', async () => {
            await dataAccess.saveListingEvent('user-1', mockListingEvent);
            const result = await dataAccess.getListingEvents('user-1', { limit: 10 });
            expect(result).toEqual([mockListingEvent]);
        });

        it('should get listing events for a specific competitor', async () => {
            await dataAccess.saveListingEvent('user-1', mockListingEvent);
            const result = await dataAccess.getListingEventsForCompetitor('user-1', 'comp-1');
            expect(result).toEqual([mockListingEvent]);
        });
    });

    describe('Competitor Alert Management', () => {
        it('should save a competitor alert', async () => {
            await dataAccess.saveCompetitorAlert('user-1', mockAlert);
            const response = await dataAccess.getCompetitorAlerts('user-1');
            expect(response.alerts).toContainEqual({ ...mockAlert, userId: 'user-1' });
        });

        it('should get competitor alerts with filters', async () => {
            await dataAccess.saveCompetitorAlert('user-1', mockAlert);
            const result = await dataAccess.getCompetitorAlerts('user-1');

            expect(result).toMatchObject({
                alerts: [{ ...mockAlert, userId: 'user-1' }],
                totalCount: 1,
                unreadCount: 1,
                hasMore: false,
            });
        });

        it('should mark competitor alert as read', async () => {
            await dataAccess.saveCompetitorAlert('user-1', mockAlert);
            await dataAccess.markCompetitorAlertAsRead('user-1', 'alert-1', '1234567890');

            const response = await dataAccess.getCompetitorAlerts('user-1');
            expect(response.alerts[0].status).toBe('read');
            expect(response.alerts[0].readAt).toBeDefined();
        });

        it('should dismiss competitor alert', async () => {
            await dataAccess.saveCompetitorAlert('user-1', mockAlert);
            await dataAccess.dismissCompetitorAlert('user-1', 'alert-1', '1234567890');

            const response = await dataAccess.getCompetitorAlerts('user-1');
            expect(response.alerts[0].status).toBe('dismissed');
            expect(response.alerts[0].dismissedAt).toBeDefined();
        });

        it('should get unread competitor alert count', async () => {
            await dataAccess.saveCompetitorAlert('user-1', mockAlert);
            const count = await dataAccess.getUnreadCompetitorAlertCount('user-1');
            expect(count).toBe(1);
        });
    });

    describe('Alert Filtering', () => {
        it('should filter alerts by type', () => {
            const alerts = [
                { ...mockAlert, type: 'competitor-new-listing' },
                { ...mockAlert, id: 'alert-2', type: 'competitor-price-reduction' },
                { ...mockAlert, id: 'alert-3', type: 'life-event-lead' },
            ] as CompetitorAlert[];

            const filters: AlertFilters = {
                types: ['competitor-new-listing', 'competitor-price-reduction'],
            };

            const filtered = dataAccess.applyAlertFilters(alerts, filters);

            expect(filtered).toHaveLength(2);
            expect(filtered.map(a => a.type)).toEqual([
                'competitor-new-listing',
                'competitor-price-reduction',
            ]);
        });

        it('should filter alerts by status', () => {
            const alerts = [
                { ...mockAlert, status: 'unread' },
                { ...mockAlert, id: 'alert-2', status: 'read' },
                { ...mockAlert, id: 'alert-3', status: 'dismissed' },
            ] as CompetitorAlert[];

            const filters: AlertFilters = {
                status: ['unread', 'read'],
            };

            const filtered = dataAccess.applyAlertFilters(alerts, filters);

            expect(filtered).toHaveLength(2);
            expect(filtered.map(a => a.status)).toEqual(['unread', 'read']);
        });

        it('should filter alerts by priority', () => {
            const alerts = [
                { ...mockAlert, priority: 'high' },
                { ...mockAlert, id: 'alert-2', priority: 'medium' },
                { ...mockAlert, id: 'alert-3', priority: 'low' },
            ] as CompetitorAlert[];

            const filters: AlertFilters = {
                priority: ['high', 'medium'],
            };

            const filtered = dataAccess.applyAlertFilters(alerts, filters);

            expect(filtered).toHaveLength(2);
            expect(filtered.map(a => a.priority)).toEqual(['high', 'medium']);
        });

        it('should filter alerts by search query', () => {
            const alerts = [
                {
                    ...mockAlert,
                    data: { competitorName: 'John Smith', propertyAddress: '123 Main St' },
                },
                {
                    ...mockAlert,
                    id: 'alert-2',
                    data: { competitorName: 'Jane Doe', propertyAddress: '456 Oak Ave' },
                },
            ] as CompetitorAlert[];

            const filters: AlertFilters = {
                searchQuery: 'john',
            };

            const filtered = dataAccess.applyAlertFilters(alerts, filters);

            expect(filtered).toHaveLength(1);
            expect((filtered[0].data as any).competitorName).toBe('John Smith');
        });
    });

    describe('Competitor Validation', () => {
        it('should validate valid competitor data', () => {
            const result = dataAccess.validateCompetitor(mockCompetitor);
            expect(result).toBe(true);
        });

        it('should reject competitor without name', () => {
            const invalidCompetitor = { ...mockCompetitor, name: '' };

            expect(() => dataAccess.validateCompetitor(invalidCompetitor)).toThrow(
                'Competitor name is required'
            );
        });

        it('should reject competitor without agency', () => {
            const invalidCompetitor = { ...mockCompetitor, agency: '' };

            expect(() => dataAccess.validateCompetitor(invalidCompetitor)).toThrow(
                'Competitor agency is required'
            );
        });

        it('should reject competitor without target areas', () => {
            const invalidCompetitor = { ...mockCompetitor, targetAreas: [] };

            expect(() => dataAccess.validateCompetitor(invalidCompetitor)).toThrow(
                'At least one target area is required'
            );
        });

        it('should create competitor with default values', () => {
            const partialData = {
                name: 'Test Competitor',
                agency: 'Test Agency',
                targetAreas: ['90210'],
            };

            const competitor = dataAccess.createCompetitor(partialData);

            expect(competitor).toMatchObject({
                name: 'Test Competitor',
                agency: 'Test Agency',
                targetAreas: ['90210'],
                isActive: true,
                id: expect.any(String),
                addedAt: expect.any(String),
            });
        });

        it('should preserve provided values when creating competitor', () => {
            const fullData = {
                id: 'custom-id',
                name: 'Test Competitor',
                agency: 'Test Agency',
                licenseNumber: '54321',
                targetAreas: ['90210'],
                isActive: false,
                addedAt: '2024-01-01T00:00:00Z',
            };

            const competitor = dataAccess.createCompetitor(fullData);

            expect(competitor).toEqual(fullData);
        });
    });

    describe('Error Handling', () => {
        it('should handle validation errors in createCompetitor', () => {
            const invalidData = { name: '', agency: '', targetAreas: [] };

            expect(() => dataAccess.createCompetitor(invalidData)).toThrow();
        });
    });
});