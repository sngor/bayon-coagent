"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAlertSettings = exports.getAlertSettings = exports.getAlertStatistics = exports.archiveAlerts = exports.dismissAlerts = exports.markAlertsAsRead = exports.searchAlerts = exports.getAlertsByDateRange = exports.getAlertsByPriority = exports.getAlertsByStatus = exports.getAlertsByType = exports.getUnreadCount = exports.updateAlertStatus = exports.getAlerts = exports.saveAlert = exports.getAlertDataAccess = exports.alertDataAccess = exports.AlertDataAccess = void 0;
const repository_1 = require("@/aws/dynamodb/repository");
const cache_1 = require("./cache");
const query_optimization_1 = require("./query-optimization");
class AlertDataAccess {
    constructor() {
        this.repository = new repository_1.DynamoDBRepository();
    }
    async saveAlert(userId, alert) {
        await this.repository.createAlert(userId, alert.id, alert);
        cache_1.alertCache.invalidateNewAlert(userId);
    }
    async getAlerts(userId, filters = {}, options = {}) {
        const startTime = Date.now();
        const cachedResult = cache_1.alertCache.get(userId, filters, options);
        if (cachedResult) {
            query_optimization_1.performanceMonitor.recordQuery('cache_hit', Date.now() - startTime);
            return cachedResult;
        }
        try {
            const optimizedQuery = query_optimization_1.queryOptimizer.optimizeQuery(userId, filters, options);
            const { limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            let allAlerts = [];
            let totalCount = 0;
            let unreadCount = 0;
            if (optimizedQuery.strategy === 'gsi1_type') {
                const queryConfig = optimizedQuery.queries[0];
                const result = await this.repository.queryAlertsByType(userId, filters.types[0], {
                    limit: limit + offset,
                    scanIndexForward: queryConfig.scanIndexForward,
                    filterExpression: queryConfig.filterExpression,
                    expressionAttributeNames: queryConfig.expressionAttributeNames,
                    expressionAttributeValues: queryConfig.expressionAttributeValues,
                });
                allAlerts = result.items;
                totalCount = result.count;
            }
            else if (optimizedQuery.strategy === 'parallel_queries') {
                const promises = optimizedQuery.queries.map(async (queryConfig) => {
                    const alertType = queryConfig.expressionAttributeValues?.[':gsi1pk']?.split('#')[2] || '';
                    return this.repository.queryAlertsByType(userId, alertType, {
                        limit: queryConfig.limit,
                        scanIndexForward: queryConfig.scanIndexForward,
                        filterExpression: queryConfig.filterExpression,
                        expressionAttributeNames: queryConfig.expressionAttributeNames,
                        expressionAttributeValues: queryConfig.expressionAttributeValues,
                    });
                });
                const results = await Promise.all(promises);
                const allResults = results.map(r => r.items);
                allAlerts = query_optimization_1.resultMerger.mergeAndSort(allResults, sortOrder, limit + offset);
                totalCount = results.reduce((sum, r) => sum + r.count, 0);
            }
            else {
                const queryConfig = optimizedQuery.queries[0];
                const result = await this.repository.queryAlerts(userId, {
                    limit: limit + offset,
                    scanIndexForward: queryConfig.scanIndexForward,
                    filterExpression: queryConfig.filterExpression,
                    expressionAttributeNames: queryConfig.expressionAttributeNames,
                    expressionAttributeValues: queryConfig.expressionAttributeValues,
                });
                allAlerts = result.items;
                totalCount = result.count;
            }
            if (filters.searchQuery) {
                allAlerts = this.applySearchFilter(allAlerts, filters.searchQuery);
            }
            unreadCount = allAlerts.filter(alert => alert.status === 'unread').length;
            const paginatedAlerts = allAlerts.slice(offset, offset + limit);
            const response = {
                alerts: paginatedAlerts,
                totalCount: allAlerts.length,
                unreadCount,
                hasMore: offset + limit < allAlerts.length
            };
            const cacheTTL = this.getCacheTTL(filters, options);
            cache_1.alertCache.set(userId, response, filters, options, cacheTTL);
            query_optimization_1.performanceMonitor.recordQuery(optimizedQuery.strategy, Date.now() - startTime);
            return response;
        }
        catch (error) {
            query_optimization_1.performanceMonitor.recordQuery('error', Date.now() - startTime, false);
            throw error;
        }
    }
    applySearchFilter(alerts, searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return alerts.filter(alert => {
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
    getCacheTTL(filters, options) {
        if (filters.dateRange && filters.dateRange.end) {
            const endDate = new Date(filters.dateRange.end);
            const now = new Date();
            const daysDiff = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff > 7) {
                return 30 * 60 * 1000;
            }
        }
        if (filters.searchQuery) {
            return 2 * 60 * 1000;
        }
        return 5 * 60 * 1000;
    }
    async updateAlertStatus(userId, alertId, status) {
        const alerts = await this.repository.queryAlerts(userId, {
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
        const updates = { status };
        if (status === 'read') {
            updates.readAt = new Date().toISOString();
        }
        else if (status === 'dismissed') {
            updates.dismissedAt = new Date().toISOString();
        }
        await this.repository.updateAlert(userId, alertId, timestamp, updates);
        cache_1.alertCache.invalidateAlertUpdate(userId, alertId);
    }
    async getUnreadCount(userId) {
        const cachedCount = cache_1.alertCache.getUnreadCount(userId);
        if (cachedCount !== null) {
            return cachedCount;
        }
        const result = await this.repository.queryAlerts(userId, {
            filterExpression: '#data.#status = :status',
            expressionAttributeNames: {
                '#data': 'Data',
                '#status': 'status'
            },
            expressionAttributeValues: {
                ':status': 'unread'
            }
        });
        cache_1.alertCache.setUnreadCount(userId, result.count, 2 * 60 * 1000);
        return result.count;
    }
    async getAlertsByType(userId, alertType, options = {}) {
        const { limit = 50, offset = 0, sortOrder = 'desc' } = options;
        const queryOptions = {
            limit: limit + offset,
            scanIndexForward: sortOrder === 'asc',
        };
        const result = await this.repository.queryAlertsByType(userId, alertType, queryOptions);
        const paginatedAlerts = result.items.slice(offset, offset + limit);
        const unreadCount = result.items.filter(alert => alert.status === 'unread').length;
        return {
            alerts: paginatedAlerts,
            totalCount: result.count,
            unreadCount,
            hasMore: offset + limit < result.items.length
        };
    }
    async getAlertsByStatus(userId, status, options = {}) {
        const filters = { status: [status] };
        return this.getAlerts(userId, filters, options);
    }
    async getAlertsByPriority(userId, priority, options = {}) {
        const filters = { priority: [priority] };
        return this.getAlerts(userId, filters, options);
    }
    async getAlertsByDateRange(userId, startDate, endDate, options = {}) {
        const filters = {
            dateRange: { start: startDate, end: endDate }
        };
        return this.getAlerts(userId, filters, options);
    }
    async searchAlerts(userId, searchQuery, options = {}) {
        const filters = { searchQuery };
        return this.getAlerts(userId, filters, options);
    }
    async markAlertsAsRead(userId, alertIds) {
        const promises = alertIds.map(alertId => this.updateAlertStatus(userId, alertId, 'read'));
        await Promise.all(promises);
    }
    async dismissAlerts(userId, alertIds) {
        const promises = alertIds.map(alertId => this.updateAlertStatus(userId, alertId, 'dismissed'));
        await Promise.all(promises);
    }
    async archiveAlerts(userId, alertIds) {
        const promises = alertIds.map(alertId => this.updateAlertStatus(userId, alertId, 'archived'));
        await Promise.all(promises);
    }
    async getAlertStatistics(userId) {
        const result = await this.repository.queryAlerts(userId);
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
            }
        };
        alerts.forEach(alert => {
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
            stats.countsByType[alert.type]++;
        });
        return stats;
    }
    async getAlertSettings(userId) {
        try {
            const result = await this.repository.get(`USER#${userId}`, 'SETTINGS#ALERTS');
            if (result) {
                return result;
            }
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
        catch (error) {
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
    async saveAlertSettings(userId, settings) {
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
exports.AlertDataAccess = AlertDataAccess;
exports.alertDataAccess = new AlertDataAccess();
const getAlertDataAccess = () => exports.alertDataAccess;
exports.getAlertDataAccess = getAlertDataAccess;
const saveAlert = (userId, alert) => exports.alertDataAccess.saveAlert(userId, alert);
exports.saveAlert = saveAlert;
const getAlerts = (userId, filters, options) => exports.alertDataAccess.getAlerts(userId, filters, options);
exports.getAlerts = getAlerts;
const updateAlertStatus = (userId, alertId, status) => exports.alertDataAccess.updateAlertStatus(userId, alertId, status);
exports.updateAlertStatus = updateAlertStatus;
const getUnreadCount = (userId) => exports.alertDataAccess.getUnreadCount(userId);
exports.getUnreadCount = getUnreadCount;
const getAlertsByType = (userId, alertType, options) => exports.alertDataAccess.getAlertsByType(userId, alertType, options);
exports.getAlertsByType = getAlertsByType;
const getAlertsByStatus = (userId, status, options) => exports.alertDataAccess.getAlertsByStatus(userId, status, options);
exports.getAlertsByStatus = getAlertsByStatus;
const getAlertsByPriority = (userId, priority, options) => exports.alertDataAccess.getAlertsByPriority(userId, priority, options);
exports.getAlertsByPriority = getAlertsByPriority;
const getAlertsByDateRange = (userId, startDate, endDate, options) => exports.alertDataAccess.getAlertsByDateRange(userId, startDate, endDate, options);
exports.getAlertsByDateRange = getAlertsByDateRange;
const searchAlerts = (userId, searchQuery, options) => exports.alertDataAccess.searchAlerts(userId, searchQuery, options);
exports.searchAlerts = searchAlerts;
const markAlertsAsRead = (userId, alertIds) => exports.alertDataAccess.markAlertsAsRead(userId, alertIds);
exports.markAlertsAsRead = markAlertsAsRead;
const dismissAlerts = (userId, alertIds) => exports.alertDataAccess.dismissAlerts(userId, alertIds);
exports.dismissAlerts = dismissAlerts;
const archiveAlerts = (userId, alertIds) => exports.alertDataAccess.archiveAlerts(userId, alertIds);
exports.archiveAlerts = archiveAlerts;
const getAlertStatistics = (userId) => exports.alertDataAccess.getAlertStatistics(userId);
exports.getAlertStatistics = getAlertStatistics;
const getAlertSettings = (userId) => exports.alertDataAccess.getAlertSettings(userId);
exports.getAlertSettings = getAlertSettings;
const saveAlertSettings = (userId, settings) => exports.alertDataAccess.saveAlertSettings(userId, settings);
exports.saveAlertSettings = saveAlertSettings;
