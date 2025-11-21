/**
 * Competitor Monitoring Data Access Layer
 * 
 * Provides data access functions for competitor tracking, listing events,
 * and competitor alert management.
 */

import { getRepository } from '@/aws/dynamodb/repository';
import {
    Competitor,
    ListingEvent,
    CompetitorAlert,
    Alert,
    AlertFilters,
    AlertQueryOptions,
    AlertsResponse,
} from './types';

export class CompetitorDataAccess {
    private repository = getRepository();

    // ==================== Competitor Management ====================

    /**
     * Saves a tracked competitor
     * @param userId User ID
     * @param competitor Competitor data
     */
    async saveTrackedCompetitor(userId: string, competitor: Competitor): Promise<void> {
        await this.repository.createTrackedCompetitor(userId, competitor.id, competitor);
    }

    /**
     * Gets a tracked competitor by ID
     * @param userId User ID
     * @param competitorId Competitor ID
     * @returns Competitor data or null if not found
     */
    async getTrackedCompetitor(userId: string, competitorId: string): Promise<Competitor | null> {
        return this.repository.getTrackedCompetitor<Competitor>(userId, competitorId);
    }

    /**
     * Gets all tracked competitors for a user
     * @param userId User ID
     * @returns Array of tracked competitors
     */
    async getTrackedCompetitors(userId: string): Promise<Competitor[]> {
        const result = await this.repository.queryTrackedCompetitors<Competitor>(userId);
        return result.items;
    }

    /**
     * Updates a tracked competitor
     * @param userId User ID
     * @param competitorId Competitor ID
     * @param updates Partial competitor data to update
     */
    async updateTrackedCompetitor(
        userId: string,
        competitorId: string,
        updates: Partial<Competitor>
    ): Promise<void> {
        await this.repository.updateTrackedCompetitor(userId, competitorId, updates);
    }

    /**
     * Removes a tracked competitor
     * @param userId User ID
     * @param competitorId Competitor ID
     */
    async removeTrackedCompetitor(userId: string, competitorId: string): Promise<void> {
        await this.repository.deleteTrackedCompetitor(userId, competitorId);
    }

    /**
     * Gets the count of tracked competitors for a user
     * @param userId User ID
     * @returns Number of tracked competitors
     */
    async getTrackedCompetitorCount(userId: string): Promise<number> {
        const result = await this.repository.queryTrackedCompetitors<Competitor>(userId);
        return result.count;
    }

    /**
     * Validates if a user can add more competitors
     * @param userId User ID
     * @param maxCompetitors Maximum allowed competitors
     * @returns True if user can add more competitors
     */
    async canAddMoreCompetitors(userId: string, maxCompetitors: number = 20): Promise<boolean> {
        const count = await this.getTrackedCompetitorCount(userId);
        return count < maxCompetitors;
    }

    // ==================== Listing Event Management ====================

    /**
     * Saves a listing event
     * @param userId User ID
     * @param event Listing event data
     */
    async saveListingEvent(userId: string, event: ListingEvent): Promise<void> {
        await this.repository.createListingEvent(userId, event.id, event);
    }

    /**
     * Gets a listing event by ID
     * @param userId User ID
     * @param eventId Event ID
     * @returns Listing event data or null if not found
     */
    async getListingEvent(userId: string, eventId: string): Promise<ListingEvent | null> {
        return this.repository.getListingEvent<ListingEvent>(userId, eventId);
    }

    /**
     * Gets all listing events for a user
     * @param userId User ID
     * @param options Query options
     * @returns Array of listing events
     */
    async getListingEvents(
        userId: string,
        options: AlertQueryOptions = {}
    ): Promise<ListingEvent[]> {
        const queryOptions = {
            limit: options.limit,
            exclusiveStartKey: options.offset ? { PK: `USER#${userId}`, SK: `LISTING_EVENT#${options.offset}` } : undefined,
            scanIndexForward: options.sortOrder === 'asc',
        };

        const result = await this.repository.queryListingEvents<ListingEvent>(userId, queryOptions);
        return result.items;
    }

    /**
     * Gets listing events for a specific competitor
     * @param userId User ID
     * @param competitorId Competitor ID
     * @param options Query options
     * @returns Array of listing events
     */
    async getListingEventsForCompetitor(
        userId: string,
        competitorId: string,
        options: AlertQueryOptions = {}
    ): Promise<ListingEvent[]> {
        const allEvents = await this.getListingEvents(userId, options);
        return allEvents.filter(event => event.competitorId === competitorId);
    }

    // ==================== Competitor Alert Management ====================

    /**
     * Saves a competitor alert
     * @param userId User ID
     * @param alert Competitor alert data
     */
    async saveCompetitorAlert(userId: string, alert: CompetitorAlert): Promise<void> {
        const alertWithUserId = { ...alert, userId };
        const timestamp = new Date(alert.createdAt).getTime().toString();
        await this.repository.createAlert(userId, alert.id, alertWithUserId);
    }

    /**
     * Gets competitor alerts for a user
     * @param userId User ID
     * @param filters Alert filters
     * @param options Query options
     * @returns Alerts response with competitor alerts
     */
    async getCompetitorAlerts(
        userId: string,
        filters: AlertFilters = {},
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        // Filter for competitor alert types
        const competitorTypes = [
            'competitor-new-listing',
            'competitor-price-reduction',
            'competitor-withdrawal'
        ];

        const competitorFilters = {
            ...filters,
            types: filters.types
                ? filters.types.filter(type => competitorTypes.includes(type))
                : competitorTypes
        };

        return this.getAlerts(userId, competitorFilters, options);
    }

    /**
     * Gets all alerts for a user with filtering and pagination
     * @param userId User ID
     * @param filters Alert filters
     * @param options Query options
     * @returns Alerts response
     */
    async getAlerts(
        userId: string,
        filters: AlertFilters = {},
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const queryOptions = {
            limit: options.limit || 50,
            exclusiveStartKey: options.offset ? { PK: `USER#${userId}`, SK: `ALERT#${options.offset}` } : undefined,
            scanIndexForward: options.sortOrder === 'asc',
        };

        // If filtering by specific types, use GSI queries
        if (filters.types && filters.types.length === 1) {
            const result = await this.repository.queryAlertsByType<Alert>(
                userId,
                filters.types[0],
                queryOptions
            );

            const filteredAlerts = this.applyAlertFilters(result.items, filters);
            const unreadCount = filteredAlerts.filter(alert => alert.status === 'unread').length;

            return {
                alerts: filteredAlerts,
                totalCount: result.count,
                unreadCount,
                hasMore: !!result.lastEvaluatedKey,
            };
        }

        // Otherwise, query all alerts and filter
        const result = await this.repository.queryAlerts<Alert>(userId, queryOptions);
        const filteredAlerts = this.applyAlertFilters(result.items, filters);
        const unreadCount = filteredAlerts.filter(alert => alert.status === 'unread').length;

        return {
            alerts: filteredAlerts,
            totalCount: result.count,
            unreadCount,
            hasMore: !!result.lastEvaluatedKey,
        };
    }

    /**
     * Marks a competitor alert as read
     * @param userId User ID
     * @param alertId Alert ID
     * @param timestamp Alert timestamp
     */
    async markCompetitorAlertAsRead(
        userId: string,
        alertId: string,
        timestamp: string
    ): Promise<void> {
        const updates = {
            status: 'read' as const,
            readAt: new Date().toISOString(),
        };
        await this.repository.updateAlert(userId, alertId, timestamp, updates);
    }

    /**
     * Dismisses a competitor alert
     * @param userId User ID
     * @param alertId Alert ID
     * @param timestamp Alert timestamp
     */
    async dismissCompetitorAlert(
        userId: string,
        alertId: string,
        timestamp: string
    ): Promise<void> {
        const updates = {
            status: 'dismissed' as const,
            dismissedAt: new Date().toISOString(),
        };
        await this.repository.updateAlert(userId, alertId, timestamp, updates);
    }

    /**
     * Gets the count of unread competitor alerts
     * @param userId User ID
     * @returns Number of unread competitor alerts
     */
    async getUnreadCompetitorAlertCount(userId: string): Promise<number> {
        const response = await this.getCompetitorAlerts(userId, { status: ['unread'] });
        return response.unreadCount;
    }

    // ==================== Helper Methods ====================

    /**
     * Applies filters to an array of alerts
     * @param alerts Array of alerts
     * @param filters Alert filters
     * @returns Filtered array of alerts
     */
    private applyAlertFilters(alerts: Alert[], filters: AlertFilters): Alert[] {
        let filtered = alerts;

        // Filter by types
        if (filters.types && filters.types.length > 0) {
            filtered = filtered.filter(alert => filters.types!.includes(alert.type));
        }

        // Filter by status
        if (filters.status && filters.status.length > 0) {
            filtered = filtered.filter(alert => filters.status!.includes(alert.status));
        }

        // Filter by priority
        if (filters.priority && filters.priority.length > 0) {
            filtered = filtered.filter(alert => filters.priority!.includes(alert.priority));
        }

        // Filter by date range
        if (filters.dateRange) {
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            filtered = filtered.filter(alert => {
                const alertDate = new Date(alert.createdAt);
                return alertDate >= startDate && alertDate <= endDate;
            });
        }

        // Filter by search query (search in property addresses and competitor names)
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

    /**
     * Validates competitor data
     * @param competitor Competitor data to validate
     * @returns True if valid, throws error if invalid
     */
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

    /**
     * Creates a new competitor with default values
     * @param competitorData Partial competitor data
     * @returns Complete competitor object
     */
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
}

/**
 * Creates a new competitor data access instance
 * @returns CompetitorDataAccess instance
 */
export function createCompetitorDataAccess(): CompetitorDataAccess {
    return new CompetitorDataAccess();
}

/**
 * Default competitor data access instance
 */
export const competitorDataAccess = createCompetitorDataAccess();