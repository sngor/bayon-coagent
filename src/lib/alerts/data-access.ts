/**
 * Alert Data Access Layer
 * 
 * Provides data access functions for Market Intelligence Alerts.
 * Implements saveAlert, getAlerts, updateAlertStatus, getUnreadCount functions
 * with filtering logic (by type, date range, status) and sorting (by date, descending).
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import {
    Alert,
    AlertFilters,
    AlertQueryOptions,
    AlertsResponse,
    AlertStatus,
    AlertType,
    AlertPriority,
    AlertSettings
} from './types';
import { QueryOptions } from '@/aws/dynamodb/types';
import { alertCache } from './cache';
import { queryOptimizer, resultMerger, performanceMonitor } from './query-optimization';

/**
 * Alert Data Access class
 * Provides type-safe CRUD operations for alerts with filtering and sorting
 */
export class AlertDataAccess {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Saves a new alert to the database
     * @param userId User ID
     * @param alert Alert data to save
     * @throws DynamoDBError if the operation fails
     */
    async saveAlert(userId: string, alert: Alert): Promise<void> {
        await this.repository.createAlert(userId, alert.id, alert);

        // Invalidate cache after new alert
        alertCache.invalidateNewAlert(userId);
    }

    /**
     * Gets alerts for a user with filtering and sorting
     * @param userId User ID
     * @param filters Optional filters to apply
     * @param options Optional query options (pagination, sorting)
     * @returns Alerts response with items and metadata
     * @throws DynamoDBError if the operation fails
     */
    async getAlerts(
        userId: string,
        filters: AlertFilters = {},
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const startTime = Date.now();

        // Check cache first
        const cachedResult = alertCache.get(userId, filters, options);
        if (cachedResult) {
            performanceMonitor.recordQuery('cache_hit', Date.now() - startTime);
            return cachedResult;
        }

        try {
            // Optimize query strategy
            const optimizedQuery = queryOptimizer.optimizeQuery(userId, filters, options);

            const {
                limit = 50,
                offset = 0,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            let allAlerts: Alert[] = [];
            let totalCount = 0;
            let unreadCount = 0;

            // Execute optimized query strategy
            if (optimizedQuery.strategy === 'gsi1_type') {
                // Single type query using GSI1
                const queryConfig = optimizedQuery.queries[0];
                const result = await this.repository.queryAlertsByType<Alert>(
                    userId,
                    filters.types![0],
                    {
                        limit: limit + offset,
                        scanIndexForward: queryConfig.scanIndexForward,
                        filterExpression: queryConfig.filterExpression,
                        expressionAttributeNames: queryConfig.expressionAttributeNames,
                        expressionAttributeValues: queryConfig.expressionAttributeValues,
                    }
                );
                allAlerts = result.items;
                totalCount = result.count;
            } else if (optimizedQuery.strategy === 'parallel_queries') {
                // Multiple type queries in parallel
                const promises = optimizedQuery.queries.map(async (queryConfig) => {
                    const alertType = queryConfig.expressionAttributeValues?.[':gsi1pk']?.split('#')[2] || '';
                    return this.repository.queryAlertsByType<Alert>(
                        userId,
                        alertType,
                        {
                            limit: queryConfig.limit,
                            scanIndexForward: queryConfig.scanIndexForward,
                            filterExpression: queryConfig.filterExpression,
                            expressionAttributeNames: queryConfig.expressionAttributeNames,
                            expressionAttributeValues: queryConfig.expressionAttributeValues,
                        }
                    );
                });

                const results = await Promise.all(promises);
                const allResults = results.map(r => r.items);
                allAlerts = resultMerger.mergeAndSort(allResults, sortOrder, limit + offset);
                totalCount = results.reduce((sum, r) => sum + r.count, 0);
            } else {
                // Main table query with filters
                const queryConfig = optimizedQuery.queries[0];
                const result = await this.repository.queryAlerts<Alert>(userId, {
                    limit: limit + offset,
                    scanIndexForward: queryConfig.scanIndexForward,
                    filterExpression: queryConfig.filterExpression,
                    expressionAttributeNames: queryConfig.expressionAttributeNames,
                    expressionAttributeValues: queryConfig.expressionAttributeValues,
                });
                allAlerts = result.items;
                totalCount = result.count;
            }

            // Apply search query filter if provided
            if (filters.searchQuery) {
                allAlerts = this.applySearchFilter(allAlerts, filters.searchQuery);
            }

            // Count unread alerts
            unreadCount = allAlerts.filter(alert => alert.status === 'unread').length;

            // Apply pagination
            const paginatedAlerts = allAlerts.slice(offset, offset + limit);

            const response: AlertsResponse = {
                alerts: paginatedAlerts,
                totalCount: allAlerts.length,
                unreadCount,
                hasMore: offset + limit < allAlerts.length
            };

            // Cache the result
            const cacheTTL = this.getCacheTTL(filters, options);
            alertCache.set(userId, response, filters, options, cacheTTL);

            // Record performance metrics
            performanceMonitor.recordQuery(optimizedQuery.strategy, Date.now() - startTime);

            return response;
        } catch (error) {
            performanceMonitor.recordQuery('error', Date.now() - startTime, false);
            throw error;
        }
    }

    /**
     * Applies search filter to alerts
     */
    private applySearchFilter(alerts: Alert[], searchQuery: string): Alert[] {
        const searchLower = searchQuery.toLowerCase();
        return alerts.filter(alert => {
            // Search in alert data based on type
            switch (alert.type) {
                case 'life-event-lead':
                    return alert.data.prospectLocation.toLowerCase().includes(searchLower) ||
                        alert.data.eventType.toLowerCase().includes(searchLower) ||
                        alert.data.recommendedAction.toLowerCase().includes(searchLower);

                case 'competitor-new-listing':
                case 'competitor-price-reduction':
                case 'competitor-withdrawal':
                    return alert.data.competitorName.toLowerCase().includes(searchLower) ||
                        alert.data.propertyAddress.toLowerCase().includes(searchLower);

                case 'neighborhood-trend':
                    return alert.data.neighborhood.toLowerCase().includes(searchLower) ||
                        alert.data.trendType.toLowerCase().includes(searchLower);

                case 'price-reduction':
                    return alert.data.propertyAddress.toLowerCase().includes(searchLower) ||
                        alert.data.propertyDetails.propertyType.toLowerCase().includes(searchLower);

                default:
                    return false;
            }
        });
    }

    /**
     * Determines cache TTL based on query characteristics
     */
    private getCacheTTL(filters: AlertFilters, options: AlertQueryOptions): number {
        // Shorter TTL for real-time queries, longer for historical data
        if (filters.dateRange && filters.dateRange.end) {
            const endDate = new Date(filters.dateRange.end);
            const now = new Date();
            const daysDiff = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);

            if (daysDiff > 7) {
                return 30 * 60 * 1000; // 30 minutes for historical data
            }
        }

        if (filters.searchQuery) {
            return 2 * 60 * 1000; // 2 minutes for search queries
        }

        return 5 * 60 * 1000; // 5 minutes default
    }

    /**
     * Updates the status of an alert
     * @param userId User ID
     * @param alertId Alert ID
     * @param status New status
     * @throws DynamoDBError if the operation fails
     */
    async updateAlertStatus(
        userId: string,
        alertId: string,
        status: AlertStatus
    ): Promise<void> {
        // First, get the alert to find its timestamp
        const alerts = await this.repository.queryAlerts<Alert>(userId, {
            filterExpression: '#data.#id = :alertId',
            expressionAttributeNames: {
                '#data': 'Data',
                '#id': 'id'
            },
            expressionAttributeValues: {
                ':alertId': alertId
            },
            limit: 1
        });

        if (alerts.items.length === 0) {
            throw new Error(`Alert with ID ${alertId} not found`);
        }

        const alert = alerts.items[0];
        const timestamp = new Date(alert.createdAt).getTime().toString();

        // Prepare updates
        const updates: Partial<Alert> = { status };

        if (status === 'read') {
            updates.readAt = new Date().toISOString();
        } else if (status === 'dismissed') {
            updates.dismissedAt = new Date().toISOString();
        }

        await this.repository.updateAlert(userId, alertId, timestamp, updates);

        // Invalidate cache after update
        alertCache.invalidateAlertUpdate(userId, alertId);
    }

    /**
     * Gets the count of unread alerts for a user
     * @param userId User ID
     * @returns Number of unread alerts
     * @throws DynamoDBError if the operation fails
     */
    async getUnreadCount(userId: string): Promise<number> {
        // Check cache first
        const cachedCount = alertCache.getUnreadCount(userId);
        if (cachedCount !== null) {
            return cachedCount;
        }

        const result = await this.repository.queryAlerts<Alert>(userId, {
            filterExpression: '#data.#status = :status',
            expressionAttributeNames: {
                '#data': 'Data',
                '#status': 'status'
            },
            expressionAttributeValues: {
                ':status': 'unread'
            }
        });

        // Cache the count with shorter TTL since it changes frequently
        alertCache.setUnreadCount(userId, result.count, 2 * 60 * 1000); // 2 minutes

        return result.count;
    }

    /**
     * Gets alerts filtered by type
     * @param userId User ID
     * @param alertType Alert type to filter by
     * @param options Optional query options
     * @returns Query result with alerts of the specified type
     * @throws DynamoDBError if the operation fails
     */
    async getAlertsByType(
        userId: string,
        alertType: AlertType,
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const {
            limit = 50,
            offset = 0,
            sortOrder = 'desc'
        } = options;

        const queryOptions: QueryOptions = {
            limit: limit + offset,
            scanIndexForward: sortOrder === 'asc',
        };

        const result = await this.repository.queryAlertsByType<Alert>(
            userId,
            alertType,
            queryOptions
        );

        // Apply pagination
        const paginatedAlerts = result.items.slice(offset, offset + limit);
        const unreadCount = result.items.filter(alert => alert.status === 'unread').length;

        return {
            alerts: paginatedAlerts,
            totalCount: result.count,
            unreadCount,
            hasMore: offset + limit < result.items.length
        };
    }

    /**
     * Gets alerts filtered by status
     * @param userId User ID
     * @param status Alert status to filter by
     * @param options Optional query options
     * @returns Query result with alerts of the specified status
     * @throws DynamoDBError if the operation fails
     */
    async getAlertsByStatus(
        userId: string,
        status: AlertStatus,
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const filters: AlertFilters = { status: [status] };
        return this.getAlerts(userId, filters, options);
    }

    /**
     * Gets alerts filtered by priority
     * @param userId User ID
     * @param priority Alert priority to filter by
     * @param options Optional query options
     * @returns Query result with alerts of the specified priority
     * @throws DynamoDBError if the operation fails
     */
    async getAlertsByPriority(
        userId: string,
        priority: AlertPriority,
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const filters: AlertFilters = { priority: [priority] };
        return this.getAlerts(userId, filters, options);
    }

    /**
     * Gets alerts within a date range
     * @param userId User ID
     * @param startDate Start date (ISO string)
     * @param endDate End date (ISO string)
     * @param options Optional query options
     * @returns Query result with alerts within the date range
     * @throws DynamoDBError if the operation fails
     */
    async getAlertsByDateRange(
        userId: string,
        startDate: string,
        endDate: string,
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const filters: AlertFilters = {
            dateRange: { start: startDate, end: endDate }
        };
        return this.getAlerts(userId, filters, options);
    }

    /**
     * Searches alerts by query string
     * @param userId User ID
     * @param searchQuery Search query string
     * @param options Optional query options
     * @returns Query result with alerts matching the search query
     * @throws DynamoDBError if the operation fails
     */
    async searchAlerts(
        userId: string,
        searchQuery: string,
        options: AlertQueryOptions = {}
    ): Promise<AlertsResponse> {
        const filters: AlertFilters = { searchQuery };
        return this.getAlerts(userId, filters, options);
    }

    /**
     * Marks multiple alerts as read
     * @param userId User ID
     * @param alertIds Array of alert IDs to mark as read
     * @throws DynamoDBError if the operation fails
     */
    async markAlertsAsRead(userId: string, alertIds: string[]): Promise<void> {
        const promises = alertIds.map(alertId =>
            this.updateAlertStatus(userId, alertId, 'read')
        );
        await Promise.all(promises);
    }

    /**
     * Dismisses multiple alerts
     * @param userId User ID
     * @param alertIds Array of alert IDs to dismiss
     * @throws DynamoDBError if the operation fails
     */
    async dismissAlerts(userId: string, alertIds: string[]): Promise<void> {
        const promises = alertIds.map(alertId =>
            this.updateAlertStatus(userId, alertId, 'dismissed')
        );
        await Promise.all(promises);
    }

    /**
     * Archives multiple alerts
     * @param userId User ID
     * @param alertIds Array of alert IDs to archive
     * @throws DynamoDBError if the operation fails
     */
    async archiveAlerts(userId: string, alertIds: string[]): Promise<void> {
        const promises = alertIds.map(alertId =>
            this.updateAlertStatus(userId, alertId, 'archived')
        );
        await Promise.all(promises);
    }

    /**
     * Gets alert statistics for a user
     * @param userId User ID
     * @returns Object with alert counts by status and type
     * @throws DynamoDBError if the operation fails
     */
    async getAlertStatistics(userId: string): Promise<{
        totalCount: number;
        unreadCount: number;
        readCount: number;
        dismissedCount: number;
        archivedCount: number;
        countsByType: Record<AlertType, number>;
    }> {
        const result = await this.repository.queryAlerts<Alert>(userId);
        const alerts = result.items;

        const stats = {
            totalCount: alerts.length,
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
            } as Record<AlertType, number>
        };

        alerts.forEach(alert => {
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

        return stats;
    }

    /**
     * Gets alert settings for a user
     * @param userId User ID
     * @returns Alert settings or default settings if none exist
     * @throws DynamoDBError if the operation fails
     */
    async getAlertSettings(userId: string): Promise<AlertSettings> {
        try {
            const result = await this.repository.get<AlertSettings>(`USER#${userId}`, 'SETTINGS#ALERTS');

            if (result) {
                return result;
            }

            // Return default settings if none exist
            return {
                userId,
                enabledAlertTypes: [],
                frequency: 'real-time',
                leadScoreThreshold: 70,
                targetAreas: [],
                trackedCompetitors: [],
                updatedAt: new Date().toISOString(),
            };
        } catch (error) {
            // Return default settings on error
            return {
                userId,
                enabledAlertTypes: [],
                frequency: 'real-time',
                leadScoreThreshold: 70,
                targetAreas: [],
                trackedCompetitors: [],
                updatedAt: new Date().toISOString(),
            };
        }
    }

    /**
     * Saves alert settings for a user
     * @param userId User ID
     * @param settings Alert settings to save
     * @throws DynamoDBError if the operation fails
     */
    async saveAlertSettings(userId: string, settings: AlertSettings): Promise<void> {
        await this.repository.put({
            PK: `USER#${userId}`,
            SK: 'SETTINGS#ALERTS',
            EntityType: 'AlertSettings',
            Data: settings,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });
    }
}

// Export a singleton instance
export const alertDataAccess = new AlertDataAccess();

// Export factory function for getting the data access instance
export const getAlertDataAccess = () => alertDataAccess;

// Export individual functions for convenience
export const saveAlert = (userId: string, alert: Alert) =>
    alertDataAccess.saveAlert(userId, alert);

export const getAlerts = (
    userId: string,
    filters?: AlertFilters,
    options?: AlertQueryOptions
) => alertDataAccess.getAlerts(userId, filters, options);

export const updateAlertStatus = (
    userId: string,
    alertId: string,
    status: AlertStatus
) => alertDataAccess.updateAlertStatus(userId, alertId, status);

export const getUnreadCount = (userId: string) =>
    alertDataAccess.getUnreadCount(userId);

export const getAlertsByType = (
    userId: string,
    alertType: AlertType,
    options?: AlertQueryOptions
) => alertDataAccess.getAlertsByType(userId, alertType, options);

export const getAlertsByStatus = (
    userId: string,
    status: AlertStatus,
    options?: AlertQueryOptions
) => alertDataAccess.getAlertsByStatus(userId, status, options);

export const getAlertsByPriority = (
    userId: string,
    priority: AlertPriority,
    options?: AlertQueryOptions
) => alertDataAccess.getAlertsByPriority(userId, priority, options);

export const getAlertsByDateRange = (
    userId: string,
    startDate: string,
    endDate: string,
    options?: AlertQueryOptions
) => alertDataAccess.getAlertsByDateRange(userId, startDate, endDate, options);

export const searchAlerts = (
    userId: string,
    searchQuery: string,
    options?: AlertQueryOptions
) => alertDataAccess.searchAlerts(userId, searchQuery, options);

export const markAlertsAsRead = (userId: string, alertIds: string[]) =>
    alertDataAccess.markAlertsAsRead(userId, alertIds);

export const dismissAlerts = (userId: string, alertIds: string[]) =>
    alertDataAccess.dismissAlerts(userId, alertIds);

export const archiveAlerts = (userId: string, alertIds: string[]) =>
    alertDataAccess.archiveAlerts(userId, alertIds);

export const getAlertStatistics = (userId: string) =>
    alertDataAccess.getAlertStatistics(userId);

export const getAlertSettings = (userId: string) =>
    alertDataAccess.getAlertSettings(userId);

export const saveAlertSettings = (userId: string, settings: AlertSettings) =>
    alertDataAccess.saveAlertSettings(userId, settings);