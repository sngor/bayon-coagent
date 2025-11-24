"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncExternalAnalytics = exports.exportROIData = exports.getROIAnalytics = exports.trackROIEvent = exports.trackABTestMetrics = exports.getABTestResults = exports.createABTest = exports.getBenchmarkComparison = exports.getAnalyticsForTimeRange = exports.getAnalyticsByType = exports.getContentAnalytics = exports.trackPublication = exports.analyticsService = exports.AnalyticsService = exports.TimeRangePreset = void 0;
const crypto_1 = require("crypto");
const repository_1 = require("@/aws/dynamodb/repository");
const keys_1 = require("@/aws/dynamodb/keys");
const content_workflow_types_1 = require("@/lib/content-workflow-types");
const error_handling_framework_1 = require("@/lib/error-handling-framework");
class RateLimitError extends Error {
    constructor(message, retryAfter) {
        super(message);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
class ExternalAnalyticsRateLimiter {
    constructor(channel) {
        this.channel = channel;
        this.requestQueue = [];
        this.rateLimits = new Map();
        this.initializeRateLimits();
    }
    initializeRateLimits() {
        const limits = {
            [content_workflow_types_1.PublishChannelType.FACEBOOK]: {
                requestsPerHour: 200,
                requestsPerMinute: 10,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
            [content_workflow_types_1.PublishChannelType.INSTAGRAM]: {
                requestsPerHour: 200,
                requestsPerMinute: 10,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
            [content_workflow_types_1.PublishChannelType.LINKEDIN]: {
                requestsPerHour: 500,
                requestsPerMinute: 20,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
            [content_workflow_types_1.PublishChannelType.TWITTER]: {
                requestsPerHour: 300,
                requestsPerMinute: 15,
                currentRequests: 0,
                windowStart: Date.now(),
                isLimited: false,
            },
        };
        Object.entries(limits).forEach(([channel, limit]) => {
            this.rateLimits.set(channel, limit);
        });
    }
    async waitForRateLimit() {
        const limit = this.rateLimits.get(this.channel);
        if (!limit)
            return;
        if (limit.isLimited && limit.retryAfter && Date.now() < limit.retryAfter) {
            const waitTime = limit.retryAfter - Date.now();
            await this.sleep(waitTime);
            limit.isLimited = false;
            limit.retryAfter = undefined;
        }
        const now = Date.now();
        const windowDuration = 60 * 1000;
        if (now - limit.windowStart > windowDuration) {
            limit.currentRequests = 0;
            limit.windowStart = now;
        }
        if (limit.currentRequests >= limit.requestsPerMinute) {
            const waitTime = windowDuration - (now - limit.windowStart);
            if (waitTime > 0) {
                await this.sleep(waitTime);
                limit.currentRequests = 0;
                limit.windowStart = Date.now();
            }
        }
    }
    recordRequest() {
        const limit = this.rateLimits.get(this.channel);
        if (limit) {
            limit.currentRequests++;
        }
    }
    handleRateLimit(retryAfterMs) {
        const limit = this.rateLimits.get(this.channel);
        if (limit) {
            limit.isLimited = true;
            limit.retryAfter = Date.now() + retryAfterMs;
        }
    }
    getStatus() {
        const limit = this.rateLimits.get(this.channel);
        if (!limit) {
            return { remaining: 0, resetTime: new Date() };
        }
        const remaining = Math.max(0, limit.requestsPerMinute - limit.currentRequests);
        const resetTime = new Date(limit.windowStart + 60 * 1000);
        return { remaining, resetTime };
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.TimeRangePreset = {
    LAST_7_DAYS: '7d',
    LAST_30_DAYS: '30d',
    LAST_90_DAYS: '90d',
    CUSTOM: 'custom'
};
class AnalyticsService {
    constructor() {
        this.repository = (0, repository_1.getRepository)();
    }
    async trackPublication(params) {
        const result = await (0, error_handling_framework_1.executeService)(async () => {
            const analyticsId = (0, crypto_1.randomUUID)();
            const metrics = {
                views: params.initialMetrics?.views || 0,
                likes: params.initialMetrics?.likes || 0,
                shares: params.initialMetrics?.shares || 0,
                comments: params.initialMetrics?.comments || 0,
                clicks: params.initialMetrics?.clicks || 0,
                saves: params.initialMetrics?.saves || 0,
                engagementRate: params.initialMetrics?.engagementRate || 0,
                reach: params.initialMetrics?.reach || 0,
                impressions: params.initialMetrics?.impressions || 0,
            };
            const analytics = {
                id: analyticsId,
                userId: params.userId,
                contentId: params.contentId,
                contentType: params.contentType,
                channel: params.channel,
                publishedAt: params.publishedAt,
                metrics,
                platformMetrics: {
                    platformPostId: params.platformPostId,
                    publishedUrl: params.publishedUrl,
                    metadata: params.metadata,
                },
                lastSynced: new Date(),
                syncStatus: content_workflow_types_1.AnalyticsSyncStatus.COMPLETED,
                GSI1PK: `ANALYTICS#${params.contentType}`,
                GSI1SK: `DATE#${params.publishedAt.toISOString().split('T')[0]}`,
            };
            const keys = (0, keys_1.getAnalyticsKeys)(params.userId, params.contentId, params.channel, params.contentType, params.publishedAt.toISOString().split('T')[0]);
            await this.repository.create(keys.PK, keys.SK, 'Analytics', analytics, {
                GSI1PK: keys.GSI1PK,
                GSI1SK: keys.GSI1SK,
            });
            return analytics;
        }, {
            operation: 'track_publication',
            userId: params.userId,
            timestamp: new Date(),
            metadata: {
                contentType: params.contentType,
                channel: params.channel,
                contentId: params.contentId
            }
        }, {
            maxRetries: 3,
            fallback: {
                enabled: true,
                fallbackFunction: async () => {
                    const fallbackData = {
                        ...params,
                        timestamp: new Date().toISOString(),
                        fallback: true
                    };
                    if (typeof window !== 'undefined') {
                        const existing = localStorage.getItem('analytics_fallback') || '[]';
                        const fallbackQueue = JSON.parse(existing);
                        fallbackQueue.push(fallbackData);
                        localStorage.setItem('analytics_fallback', JSON.stringify(fallbackQueue));
                    }
                    return {
                        id: (0, crypto_1.randomUUID)(),
                        userId: params.userId,
                        contentId: params.contentId,
                        contentType: params.contentType,
                        channel: params.channel,
                        publishedAt: params.publishedAt,
                        metrics: {
                            views: 0, likes: 0, shares: 0, comments: 0, clicks: 0,
                            saves: 0, engagementRate: 0, reach: 0, impressions: 0
                        },
                        platformMetrics: {},
                        lastSynced: new Date(),
                        syncStatus: content_workflow_types_1.AnalyticsSyncStatus.PENDING,
                        GSI1PK: `ANALYTICS#${params.contentType}`,
                        GSI1SK: `DATE#${params.publishedAt.toISOString().split('T')[0]}`
                    };
                }
            }
        });
        if (result.success && result.data) {
            return {
                success: true,
                data: result.data,
                message: `Analytics tracking started for ${params.channel} content`,
                timestamp: result.timestamp,
            };
        }
        else {
            return {
                success: false,
                error: result.error?.userMessage || result.error?.message || 'Failed to track publication',
                timestamp: result.timestamp,
            };
        }
    }
    async getContentAnalytics(params) {
        try {
            const pk = `USER#${params.userId}`;
            const skPrefix = `ANALYTICS#${params.contentId}#`;
            const queryResult = await this.repository.query(pk, skPrefix);
            if (queryResult.items.length === 0) {
                return {
                    success: true,
                    data: [],
                    message: 'No analytics data found for this content',
                    timestamp: new Date(),
                };
            }
            let analyticsData = queryResult.items;
            if (params.includeTrendData) {
                analyticsData = await this.enrichWithTrendData(analyticsData);
            }
            analyticsData = analyticsData.map(analytics => ({
                ...analytics,
                metrics: {
                    ...analytics.metrics,
                    engagementRate: this.calculateEngagementRate(analytics.metrics),
                }
            }));
            return {
                success: true,
                data: analyticsData,
                message: `Retrieved analytics for ${analyticsData.length} channels`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to get content analytics:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get content analytics',
                timestamp: new Date(),
            };
        }
    }
    async getAnalyticsByType(params) {
        try {
            const pk = `USER#${params.userId}`;
            const skPrefix = 'ANALYTICS#';
            const startDateStr = params.startDate.toISOString().split('T')[0];
            const endDateStr = params.endDate.toISOString().split('T')[0];
            const queryResult = await this.repository.query(pk, skPrefix, {
                filterExpression: '#publishedAt BETWEEN :startDate AND :endDate',
                expressionAttributeNames: {
                    '#publishedAt': 'Data.publishedAt',
                },
                expressionAttributeValues: {
                    ':startDate': params.startDate.toISOString(),
                    ':endDate': params.endDate.toISOString(),
                },
            });
            let filteredItems = queryResult.items;
            if (params.contentTypes && params.contentTypes.length > 0) {
                filteredItems = filteredItems.filter(item => params.contentTypes.includes(item.contentType));
            }
            if (params.channels && params.channels.length > 0) {
                filteredItems = filteredItems.filter(item => params.channels.includes(item.channel));
            }
            const typeAnalytics = this.aggregateByContentType(filteredItems, params.groupBy || 'day', params.includeTopPerformers || false, params.limit);
            return {
                success: true,
                data: typeAnalytics,
                message: `Retrieved analytics for ${typeAnalytics.length} content types`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to get analytics by type:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get analytics by type',
                timestamp: new Date(),
            };
        }
    }
    async getAnalyticsForTimeRange(userId, preset, customStart, customEnd) {
        const { startDate, endDate } = this.getDateRangeFromPreset(preset, customStart, customEnd);
        return this.getAnalyticsByType({
            userId,
            startDate,
            endDate,
            includeTopPerformers: true,
        });
    }
    async createABTest(params) {
        try {
            if (params.variations.length === 0) {
                return {
                    success: false,
                    error: 'At least one variation is required',
                    timestamp: new Date(),
                };
            }
            if (params.variations.length > 3) {
                return {
                    success: false,
                    error: 'Maximum of 3 variations allowed per A/B test',
                    timestamp: new Date(),
                };
            }
            const variationNames = params.variations.map(v => v.name);
            const uniqueNames = new Set(variationNames);
            if (uniqueNames.size !== variationNames.length) {
                return {
                    success: false,
                    error: 'Variation names must be unique',
                    timestamp: new Date(),
                };
            }
            const testId = (0, crypto_1.randomUUID)();
            const variations = params.variations.map(variation => ({
                id: (0, crypto_1.randomUUID)(),
                name: variation.name,
                content: variation.content,
                metrics: {
                    views: 0,
                    likes: 0,
                    shares: 0,
                    comments: 0,
                    clicks: 0,
                    saves: 0,
                    engagementRate: 0,
                    reach: 0,
                    impressions: 0,
                },
                sampleSize: 0,
            }));
            const abTest = {
                id: testId,
                userId: params.userId,
                name: params.name,
                description: params.description,
                contentType: params.contentType,
                variations,
                status: content_workflow_types_1.ABTestStatus.ACTIVE,
                startedAt: new Date(),
                targetMetric: params.targetMetric,
                minimumSampleSize: params.minimumSampleSize || 100,
                confidenceLevel: params.confidenceLevel || 0.95,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const keys = (0, keys_1.getABTestKeys)(params.userId, testId);
            await this.repository.create(keys.PK, keys.SK, 'ABTest', abTest);
            return {
                success: true,
                data: abTest,
                message: `A/B test created with ${variations.length} variations`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to create A/B test:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create A/B test',
                timestamp: new Date(),
            };
        }
    }
    async getABTestResults(params) {
        try {
            const keys = (0, keys_1.getABTestKeys)(params.userId, params.testId);
            const testResult = await this.repository.get(keys.PK, keys.SK);
            if (!testResult.item) {
                return {
                    success: false,
                    error: 'A/B test not found',
                    timestamp: new Date(),
                };
            }
            const abTest = testResult.item;
            const variationResults = [];
            let bestVariation = null;
            let bestMetricValue = -1;
            for (const variation of abTest.variations) {
                const metrics = variation.metrics || {
                    views: 0,
                    likes: 0,
                    shares: 0,
                    comments: 0,
                    clicks: 0,
                    saves: 0,
                    engagementRate: 0,
                    reach: 0,
                    impressions: 0,
                };
                const sampleSize = variation.sampleSize || 0;
                const targetMetricValue = metrics[abTest.targetMetric] || 0;
                const conversionRate = sampleSize > 0 ? targetMetricValue / sampleSize : 0;
                const confidenceInterval = this.calculateConfidenceInterval(conversionRate, sampleSize, abTest.confidenceLevel);
                const variationResult = {
                    variationId: variation.id,
                    name: variation.name,
                    metrics,
                    sampleSize,
                    conversionRate,
                    confidenceInterval,
                    isWinner: false,
                };
                variationResults.push(variationResult);
                if (targetMetricValue > bestMetricValue) {
                    bestMetricValue = targetMetricValue;
                    bestVariation = variationResult;
                }
            }
            let statisticalSignificance = false;
            let pValue;
            let winner;
            let recommendedAction = 'Continue collecting data - insufficient sample size for statistical significance';
            if (variationResults.length >= 2 && params.includeStatisticalAnalysis !== false) {
                const allMeetMinimum = variationResults.every(v => v.sampleSize >= abTest.minimumSampleSize);
                if (allMeetMinimum) {
                    const { isSignificant, pVal } = this.performWelchsTTest(variationResults, bestVariation, abTest.targetMetric, abTest.confidenceLevel);
                    statisticalSignificance = isSignificant;
                    pValue = pVal;
                    if (statisticalSignificance && bestVariation) {
                        winner = bestVariation.variationId;
                        bestVariation.isWinner = true;
                        recommendedAction = `Variation "${bestVariation.name}" is the statistically significant winner. Implement this variation.`;
                    }
                    else {
                        recommendedAction = 'No statistically significant difference found. Consider running the test longer or increasing sample size.';
                    }
                }
                else {
                    const remainingSamples = Math.max(...variationResults.map(v => Math.max(0, abTest.minimumSampleSize - v.sampleSize)));
                    recommendedAction = `Need ${remainingSamples} more samples to reach minimum sample size for statistical analysis.`;
                }
            }
            let effectSize;
            if (winner && variationResults.length >= 2) {
                effectSize = this.calculateEffectSize(variationResults, winner, abTest.targetMetric);
            }
            const results = {
                testId: params.testId,
                variations: variationResults,
                winner,
                confidence: abTest.confidenceLevel,
                statisticalSignificance,
                pValue,
                effectSize,
                recommendedAction,
                calculatedAt: new Date(),
            };
            if (abTest.status === content_workflow_types_1.ABTestStatus.ACTIVE && statisticalSignificance && winner) {
                abTest.results = results;
                abTest.status = content_workflow_types_1.ABTestStatus.COMPLETED;
                abTest.completedAt = new Date();
                abTest.updatedAt = new Date();
                await this.repository.update(keys.PK, keys.SK, 'ABTest', abTest);
            }
            return {
                success: true,
                data: results,
                message: statisticalSignificance
                    ? `Statistical analysis complete - ${winner ? 'winner identified' : 'no clear winner'}`
                    : 'Statistical analysis in progress - more data needed',
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to get A/B test results:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get A/B test results',
                timestamp: new Date(),
            };
        }
    }
    async trackABTestMetrics(userId, testId, variationId, metrics) {
        try {
            const keys = (0, keys_1.getABTestKeys)(userId, testId);
            const testResult = await this.repository.get(keys.PK, keys.SK);
            if (!testResult.item) {
                return {
                    success: false,
                    error: 'A/B test not found',
                    timestamp: new Date(),
                };
            }
            const abTest = testResult.item;
            const variationIndex = abTest.variations.findIndex(v => v.id === variationId);
            if (variationIndex === -1) {
                return {
                    success: false,
                    error: 'Variation not found in A/B test',
                    timestamp: new Date(),
                };
            }
            const variation = abTest.variations[variationIndex];
            const currentMetrics = variation.metrics || {
                views: 0,
                likes: 0,
                shares: 0,
                comments: 0,
                clicks: 0,
                saves: 0,
                engagementRate: 0,
                reach: 0,
                impressions: 0,
            };
            const updatedMetrics = {
                views: metrics.views !== undefined ? metrics.views : currentMetrics.views,
                likes: metrics.likes !== undefined ? metrics.likes : currentMetrics.likes,
                shares: metrics.shares !== undefined ? metrics.shares : currentMetrics.shares,
                comments: metrics.comments !== undefined ? metrics.comments : currentMetrics.comments,
                clicks: metrics.clicks !== undefined ? metrics.clicks : currentMetrics.clicks,
                saves: metrics.saves !== undefined ? metrics.saves : currentMetrics.saves || 0,
                reach: metrics.reach !== undefined ? metrics.reach : currentMetrics.reach || 0,
                impressions: metrics.impressions !== undefined ? metrics.impressions : currentMetrics.impressions || 0,
                engagementRate: 0,
            };
            updatedMetrics.engagementRate = this.calculateEngagementRate(updatedMetrics);
            const sampleSize = updatedMetrics.views;
            abTest.variations[variationIndex] = {
                ...variation,
                metrics: updatedMetrics,
                sampleSize,
            };
            abTest.updatedAt = new Date();
            await this.repository.update(keys.PK, keys.SK, 'ABTest', abTest);
            return {
                success: true,
                message: `Metrics updated for variation "${variation.name}"`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to track A/B test metrics:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to track A/B test metrics',
                timestamp: new Date(),
            };
        }
    }
    async trackROIEvent(params) {
        try {
            const eventId = (0, crypto_1.randomUUID)();
            const attribution = await this.buildAttributionData(params.userId, params.contentId, params.touchPoints || [], params.attributionModel || 'linear');
            const roiEvent = {
                id: eventId,
                userId: params.userId,
                contentId: params.contentId,
                contentType: params.contentType,
                eventType: params.eventType,
                value: params.value,
                currency: params.currency || 'USD',
                attribution,
                clientInfo: params.clientInfo,
                conversionPath: params.conversionPath || [],
                occurredAt: new Date(),
                createdAt: new Date(),
            };
            const keys = (0, keys_1.getROIKeys)(params.userId, params.contentId, eventId);
            await this.repository.create(keys.PK, keys.SK, 'ROI', roiEvent);
            return {
                success: true,
                data: roiEvent,
                message: `ROI event tracked: ${params.eventType} worth ${params.currency || 'USD'} ${params.value}`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to track ROI event:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to track ROI event',
                timestamp: new Date(),
            };
        }
    }
    async getROIAnalytics(params) {
        try {
            const pk = `USER#${params.userId}`;
            const skPrefix = 'ROI#';
            const queryResult = await this.repository.query(pk, skPrefix, {
                filterExpression: '#occurredAt BETWEEN :startDate AND :endDate',
                expressionAttributeNames: {
                    '#occurredAt': 'Data.occurredAt',
                },
                expressionAttributeValues: {
                    ':startDate': params.startDate.toISOString(),
                    ':endDate': params.endDate.toISOString(),
                },
            });
            let roiEvents = queryResult.items;
            if (params.contentTypes && params.contentTypes.length > 0) {
                roiEvents = roiEvents.filter(event => params.contentTypes.includes(event.contentType));
            }
            const analytics = await this.calculateROIAnalytics(roiEvents, params.attributionModel || 'linear', params.includeConversionFunnel || false, params.groupBy || 'day');
            analytics.timeRange = {
                startDate: params.startDate,
                endDate: params.endDate,
            };
            analytics.lastUpdated = new Date();
            return {
                success: true,
                data: analytics,
                message: `ROI analytics calculated for ${roiEvents.length} events`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to get ROI analytics:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get ROI analytics',
                timestamp: new Date(),
            };
        }
    }
    async exportROIData(params) {
        try {
            const analyticsResult = await this.getROIAnalytics({
                userId: params.userId,
                startDate: params.startDate,
                endDate: params.endDate,
                attributionModel: params.attributionModel,
                includeConversionFunnel: params.includeDetails,
            });
            if (!analyticsResult.success || !analyticsResult.data) {
                return {
                    success: false,
                    error: 'Failed to retrieve ROI data for export',
                    timestamp: new Date(),
                };
            }
            const analytics = analyticsResult.data;
            let exportData;
            let contentType;
            switch (params.format) {
                case 'csv':
                    exportData = this.generateCSVExport(analytics, params.includeDetails || false);
                    contentType = 'text/csv';
                    break;
                case 'excel':
                    exportData = this.generateExcelExport(analytics, params.includeDetails || false);
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    break;
                case 'pdf':
                    exportData = this.generatePDFExport(analytics, params.includeDetails || false);
                    contentType = 'application/pdf';
                    break;
                default:
                    throw new Error(`Unsupported export format: ${params.format}`);
            }
            return {
                success: true,
                data: exportData,
                message: `ROI data exported in ${params.format.toUpperCase()} format`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to export ROI data:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to export ROI data',
                timestamp: new Date(),
            };
        }
    }
    async buildAttributionData(userId, contentId, touchPoints, attributionModel) {
        if (touchPoints.length === 0) {
            touchPoints = await this.findTouchPointsForContent(userId, contentId);
        }
        const isDirect = touchPoints.length <= 1;
        const isAssisted = touchPoints.length > 1;
        let attributionWeight = 1.0;
        if (isAssisted) {
            switch (attributionModel) {
                case 'first-touch':
                    attributionWeight = touchPoints[0]?.contentId === contentId ? 1.0 : 0.0;
                    break;
                case 'last-touch':
                    attributionWeight = touchPoints[touchPoints.length - 1]?.contentId === contentId ? 1.0 : 0.0;
                    break;
                case 'linear':
                    attributionWeight = 1.0 / touchPoints.length;
                    break;
                case 'time-decay':
                    attributionWeight = this.calculateTimeDecayWeight(touchPoints, contentId);
                    break;
            }
        }
        return {
            isDirect,
            isAssisted,
            touchPoints,
            attributionModel,
            attributionWeight,
        };
    }
    async findTouchPointsForContent(userId, contentId) {
        try {
            const pk = `USER#${userId}`;
            const skPrefix = `ANALYTICS#${contentId}#`;
            const queryResult = await this.repository.query(pk, skPrefix);
            const touchPoints = queryResult.items.map(analytics => ({
                contentId: analytics.contentId,
                channel: analytics.channel,
                touchedAt: analytics.publishedAt,
                interactionType: 'view',
            }));
            return touchPoints.sort((a, b) => a.touchedAt.getTime() - b.touchedAt.getTime());
        }
        catch (error) {
            console.error('Failed to find touch points:', error);
            return [];
        }
    }
    calculateTimeDecayWeight(touchPoints, contentId) {
        const targetTouchPoint = touchPoints.find(tp => tp.contentId === contentId);
        if (!targetTouchPoint)
            return 0.0;
        const conversionTime = Math.max(...touchPoints.map(tp => tp.touchedAt.getTime()));
        const touchTime = targetTouchPoint.touchedAt.getTime();
        const timeDiff = conversionTime - touchTime;
        const halfLife = 7 * 24 * 60 * 60 * 1000;
        const decayFactor = Math.pow(0.5, timeDiff / halfLife);
        const totalWeight = touchPoints.reduce((sum, tp) => {
            const tpTimeDiff = conversionTime - tp.touchedAt.getTime();
            const tpDecayFactor = Math.pow(0.5, tpTimeDiff / halfLife);
            return sum + tpDecayFactor;
        }, 0);
        return totalWeight > 0 ? decayFactor / totalWeight : 0.0;
    }
    async calculateROIAnalytics(roiEvents, attributionModel, includeConversionFunnel, groupBy) {
        const totalRevenue = roiEvents
            .filter(event => event.eventType === content_workflow_types_1.ROIEventType.REVENUE)
            .reduce((sum, event) => sum + (event.value * event.attribution.attributionWeight), 0);
        const totalLeads = roiEvents
            .filter(event => event.eventType === content_workflow_types_1.ROIEventType.LEAD)
            .length;
        const totalConversions = roiEvents
            .filter(event => event.eventType === content_workflow_types_1.ROIEventType.CONVERSION)
            .length;
        const conversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
        const averageOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;
        const estimatedCost = this.estimateContentCost(roiEvents);
        const costPerLead = totalLeads > 0 ? estimatedCost / totalLeads : 0;
        const returnOnAdSpend = estimatedCost > 0 ? (totalRevenue / estimatedCost) * 100 : 0;
        const byContentType = {};
        const contentTypeGroups = this.groupROIEventsByContentType(roiEvents);
        Array.from(contentTypeGroups.entries()).forEach(([contentType, events]) => {
            byContentType[contentType] = this.calculateROIMetricsForGroup(events, estimatedCost);
        });
        const byChannel = {};
        const channelGroups = this.groupROIEventsByChannel(roiEvents);
        Array.from(channelGroups.entries()).forEach(([channel, events]) => {
            byChannel[channel] = this.calculateROIMetricsForGroup(events, estimatedCost);
        });
        const topPerformingContent = this.getTopPerformingContentROI(roiEvents, 10);
        const conversionFunnel = includeConversionFunnel
            ? this.buildConversionFunnel(roiEvents)
            : [];
        return {
            totalRevenue,
            totalLeads,
            totalConversions,
            costPerLead,
            conversionRate,
            averageOrderValue,
            returnOnAdSpend,
            byContentType,
            byChannel,
            topPerformingContent,
            conversionFunnel,
            timeRange: {
                startDate: new Date(),
                endDate: new Date(),
            },
            lastUpdated: new Date(),
        };
    }
    groupROIEventsByContentType(roiEvents) {
        const groups = new Map();
        roiEvents.forEach(event => {
            if (!groups.has(event.contentType)) {
                groups.set(event.contentType, []);
            }
            groups.get(event.contentType).push(event);
        });
        return groups;
    }
    groupROIEventsByChannel(roiEvents) {
        const groups = new Map();
        roiEvents.forEach(event => {
            const primaryChannel = event.attribution.touchPoints[0]?.channel;
            if (primaryChannel) {
                if (!groups.has(primaryChannel)) {
                    groups.set(primaryChannel, []);
                }
                groups.get(primaryChannel).push(event);
            }
        });
        return groups;
    }
    calculateROIMetricsForGroup(events, totalCost) {
        const revenue = events
            .filter(event => event.eventType === content_workflow_types_1.ROIEventType.REVENUE)
            .reduce((sum, event) => sum + (event.value * event.attribution.attributionWeight), 0);
        const leads = events.filter(event => event.eventType === content_workflow_types_1.ROIEventType.LEAD).length;
        const conversions = events.filter(event => event.eventType === content_workflow_types_1.ROIEventType.CONVERSION).length;
        const groupCost = events.length > 0 ? (totalCost * events.length) / events.length : 0;
        const roi = groupCost > 0 ? ((revenue - groupCost) / groupCost) * 100 : 0;
        const roas = groupCost > 0 ? (revenue / groupCost) * 100 : 0;
        const cpl = leads > 0 ? groupCost / leads : 0;
        const cpa = conversions > 0 ? groupCost / conversions : 0;
        return {
            revenue,
            leads,
            conversions,
            cost: groupCost,
            roi,
            roas,
            cpl,
            cpa,
        };
    }
    getTopPerformingContentROI(roiEvents, limit) {
        const contentGroups = new Map();
        roiEvents.forEach(event => {
            if (!contentGroups.has(event.contentId)) {
                contentGroups.set(event.contentId, []);
            }
            contentGroups.get(event.contentId).push(event);
        });
        const contentROI = [];
        contentGroups.forEach((events, contentId) => {
            const totalRevenue = events
                .filter(event => event.eventType === content_workflow_types_1.ROIEventType.REVENUE)
                .reduce((sum, event) => sum + (event.value * event.attribution.attributionWeight), 0);
            const totalLeads = events.filter(event => event.eventType === content_workflow_types_1.ROIEventType.LEAD).length;
            const estimatedCost = this.estimateContentCost(events);
            const roi = estimatedCost > 0 ? ((totalRevenue - estimatedCost) / estimatedCost) * 100 : 0;
            const hasDirectConversions = events.some(event => event.attribution.isDirect);
            const hasAssistedConversions = events.some(event => event.attribution.isAssisted);
            let attribution;
            if (hasDirectConversions && hasAssistedConversions) {
                attribution = 'mixed';
            }
            else if (hasDirectConversions) {
                attribution = 'direct';
            }
            else {
                attribution = 'assisted';
            }
            contentROI.push({
                contentId,
                title: `Content ${contentId.slice(0, 8)}`,
                contentType: events[0].contentType,
                publishedAt: events[0].occurredAt,
                totalRevenue,
                totalLeads,
                roi,
                attribution,
            });
        });
        return contentROI
            .sort((a, b) => b.roi - a.roi)
            .slice(0, limit);
    }
    buildConversionFunnel(roiEvents) {
        const steps = [
            { step: 'Awareness', events: [] },
            { step: 'Interest', events: [] },
            { step: 'Consideration', events: [] },
            { step: 'Lead', events: [] },
            { step: 'Conversion', events: [] },
        ];
        roiEvents.forEach(event => {
            switch (event.eventType) {
                case content_workflow_types_1.ROIEventType.LEAD:
                    steps[3].events.push(event);
                    break;
                case content_workflow_types_1.ROIEventType.CONVERSION:
                    steps[4].events.push(event);
                    break;
                case content_workflow_types_1.ROIEventType.CONSULTATION:
                    steps[2].events.push(event);
                    break;
                case content_workflow_types_1.ROIEventType.LISTING_INQUIRY:
                    steps[1].events.push(event);
                    break;
                default:
                    steps[0].events.push(event);
            }
        });
        const totalTop = Math.max(...steps.map(step => step.events.length));
        return steps.map((step, index) => {
            const count = step.events.length;
            const conversionRate = totalTop > 0 ? (count / totalTop) * 100 : 0;
            const dropOffRate = index > 0 ?
                ((steps[index - 1].events.length - count) / Math.max(1, steps[index - 1].events.length)) * 100 : 0;
            return {
                step: step.step,
                count,
                conversionRate,
                dropOffRate,
            };
        });
    }
    estimateContentCost(events) {
        const baseContentCost = 50;
        const uniqueContentIds = new Set(events.map(event => event.contentId));
        return uniqueContentIds.size * baseContentCost;
    }
    generateCSVExport(analytics, includeDetails) {
        const headers = [
            'Content ID',
            'Content Type',
            'Total Revenue',
            'Total Leads',
            'ROI %',
            'Attribution'
        ];
        const rows = analytics.topPerformingContent.map(content => [
            content.contentId,
            content.contentType,
            content.totalRevenue.toFixed(2),
            content.totalLeads.toString(),
            content.roi.toFixed(2),
            content.attribution
        ]);
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        return csvContent;
    }
    generateExcelExport(analytics, includeDetails) {
        return this.generateCSVExport(analytics, includeDetails);
    }
    generatePDFExport(analytics, includeDetails) {
        const report = `
ROI Analytics Report
Generated: ${new Date().toISOString()}

Summary:
- Total Revenue: $${analytics.totalRevenue.toFixed(2)}
- Total Leads: ${analytics.totalLeads}
- Total Conversions: ${analytics.totalConversions}
- Conversion Rate: ${analytics.conversionRate.toFixed(2)}%
- Cost Per Lead: $${analytics.costPerLead.toFixed(2)}
- Return on Ad Spend: ${analytics.returnOnAdSpend.toFixed(2)}%

Top Performing Content:
${analytics.topPerformingContent.map(content => `- ${content.title}: $${content.totalRevenue.toFixed(2)} revenue, ${content.totalLeads} leads, ${content.roi.toFixed(2)}% ROI`).join('\n')}
        `;
        return report.trim();
    }
    calculateEngagementRate(metrics) {
        const totalEngagements = metrics.likes + metrics.shares + metrics.comments + (metrics.saves || 0);
        const totalReach = metrics.reach || metrics.impressions || metrics.views;
        if (totalReach === 0) {
            return 0;
        }
        return (totalEngagements / totalReach) * 100;
    }
    async enrichWithTrendData(analyticsData) {
        return analyticsData;
    }
    aggregateByContentType(items, groupBy, includeTopPerformers, limit) {
        const groupedByType = new Map();
        items.forEach(item => {
            if (!groupedByType.has(item.contentType)) {
                groupedByType.set(item.contentType, []);
            }
            groupedByType.get(item.contentType).push(item);
        });
        const typeAnalytics = [];
        groupedByType.forEach((typeItems, contentType) => {
            const totalPublished = typeItems.length;
            const aggregatedMetrics = typeItems.reduce((acc, item) => ({
                views: acc.views + item.metrics.views,
                likes: acc.likes + item.metrics.likes,
                shares: acc.shares + item.metrics.shares,
                comments: acc.comments + item.metrics.comments,
                clicks: acc.clicks + item.metrics.clicks,
                saves: acc.saves + (item.metrics.saves || 0),
                reach: acc.reach + (item.metrics.reach || 0),
                impressions: acc.impressions + (item.metrics.impressions || 0),
            }), {
                views: 0,
                likes: 0,
                shares: 0,
                comments: 0,
                clicks: 0,
                saves: 0,
                reach: 0,
                impressions: 0,
            });
            const totalEngagements = aggregatedMetrics.likes + aggregatedMetrics.shares +
                aggregatedMetrics.comments + aggregatedMetrics.saves;
            const avgEngagement = totalPublished > 0 ? totalEngagements / totalPublished : 0;
            const engagementRate = this.calculateEngagementRate({
                ...aggregatedMetrics,
                engagementRate: 0,
            });
            let topPerforming = [];
            if (includeTopPerformers) {
                topPerforming = this.getTopPerformingContent(typeItems, limit || 5);
            }
            const trendData = this.generateTrendData(typeItems, groupBy);
            typeAnalytics.push({
                contentType,
                totalPublished,
                avgEngagement,
                totalViews: aggregatedMetrics.views,
                totalLikes: aggregatedMetrics.likes,
                totalShares: aggregatedMetrics.shares,
                totalComments: aggregatedMetrics.comments,
                engagementRate,
                topPerforming,
                trendData,
                lastUpdated: new Date(),
            });
        });
        return typeAnalytics.sort((a, b) => b.avgEngagement - a.avgEngagement);
    }
    getTopPerformingContent(items, limit) {
        return items
            .map(item => {
            const totalEngagement = item.metrics.likes + item.metrics.shares +
                item.metrics.comments + (item.metrics.saves || 0);
            return {
                contentId: item.contentId,
                title: item.platformMetrics?.metadata?.title || `Content ${item.contentId.slice(0, 8)}`,
                contentType: item.contentType,
                publishedAt: item.publishedAt,
                totalEngagement,
                engagementRate: this.calculateEngagementRate(item.metrics),
                topChannel: item.channel,
            };
        })
            .sort((a, b) => b.totalEngagement - a.totalEngagement)
            .slice(0, limit);
    }
    generateTrendData(items, groupBy) {
        const groupedByTime = new Map();
        items.forEach(item => {
            const date = new Date(item.publishedAt);
            let timeKey;
            switch (groupBy) {
                case 'day':
                    timeKey = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    timeKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    timeKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    break;
                default:
                    timeKey = date.toISOString().split('T')[0];
            }
            if (!groupedByTime.has(timeKey)) {
                groupedByTime.set(timeKey, []);
            }
            groupedByTime.get(timeKey).push(item);
        });
        const trendData = [];
        groupedByTime.forEach((periodItems, timeKey) => {
            const totalEngagement = periodItems.reduce((sum, item) => sum + item.metrics.likes + item.metrics.shares + item.metrics.comments, 0);
            trendData.push({
                date: new Date(timeKey),
                value: totalEngagement,
                metric: 'likes',
            });
        });
        return trendData.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    getDateRangeFromPreset(preset, customStart, customEnd) {
        const now = new Date();
        const endDate = new Date(now);
        switch (preset) {
            case exports.TimeRangePreset.LAST_7_DAYS:
                const startDate7d = new Date(now);
                startDate7d.setDate(now.getDate() - 7);
                return { startDate: startDate7d, endDate };
            case exports.TimeRangePreset.LAST_30_DAYS:
                const startDate30d = new Date(now);
                startDate30d.setDate(now.getDate() - 30);
                return { startDate: startDate30d, endDate };
            case exports.TimeRangePreset.LAST_90_DAYS:
                const startDate90d = new Date(now);
                startDate90d.setDate(now.getDate() - 90);
                return { startDate: startDate90d, endDate };
            case exports.TimeRangePreset.CUSTOM:
                if (!customStart || !customEnd) {
                    throw new Error('Custom date range requires both start and end dates');
                }
                return { startDate: customStart, endDate: customEnd };
            default:
                const defaultStart = new Date(now);
                defaultStart.setDate(now.getDate() - 30);
                return { startDate: defaultStart, endDate };
        }
    }
    getIndustryBenchmarks() {
        return {
            [content_workflow_types_1.ContentCategory.SOCIAL_MEDIA]: {
                [content_workflow_types_1.PublishChannelType.FACEBOOK]: {
                    avgEngagementRate: 0.09,
                    goodEngagementRate: 0.15,
                    excellentEngagementRate: 0.25,
                },
                [content_workflow_types_1.PublishChannelType.INSTAGRAM]: {
                    avgEngagementRate: 1.22,
                    goodEngagementRate: 2.0,
                    excellentEngagementRate: 3.5,
                },
                [content_workflow_types_1.PublishChannelType.LINKEDIN]: {
                    avgEngagementRate: 0.54,
                    goodEngagementRate: 1.0,
                    excellentEngagementRate: 2.0,
                },
                [content_workflow_types_1.PublishChannelType.TWITTER]: {
                    avgEngagementRate: 0.045,
                    goodEngagementRate: 0.1,
                    excellentEngagementRate: 0.2,
                },
            },
            [content_workflow_types_1.ContentCategory.BLOG_POST]: {
                [content_workflow_types_1.PublishChannelType.BLOG]: {
                    avgEngagementRate: 2.0,
                    goodEngagementRate: 4.0,
                    excellentEngagementRate: 8.0,
                },
            },
            [content_workflow_types_1.ContentCategory.NEWSLETTER]: {
                [content_workflow_types_1.PublishChannelType.NEWSLETTER]: {
                    avgEngagementRate: 20.0,
                    goodEngagementRate: 25.0,
                    excellentEngagementRate: 35.0,
                },
            },
        };
    }
    getBenchmarkComparison(contentType, channel, engagementRate) {
        const benchmarks = this.getIndustryBenchmarks();
        const typeBenchmarks = benchmarks[contentType];
        const channelBenchmarks = typeBenchmarks?.[channel];
        if (!channelBenchmarks) {
            return {
                benchmark: 'average',
                percentile: 50,
                recommendation: 'No benchmark data available for this content type and channel combination.',
            };
        }
        let benchmark;
        let percentile;
        let recommendation;
        if (engagementRate >= channelBenchmarks.excellentEngagementRate) {
            benchmark = 'excellent';
            percentile = 90;
            recommendation = 'Outstanding performance! This content is performing in the top 10%.';
        }
        else if (engagementRate >= channelBenchmarks.goodEngagementRate) {
            benchmark = 'good';
            percentile = 75;
            recommendation = 'Great performance! This content is above average for your industry.';
        }
        else if (engagementRate >= channelBenchmarks.avgEngagementRate) {
            benchmark = 'average';
            percentile = 50;
            recommendation = 'Average performance. Consider optimizing content or posting times.';
        }
        else {
            benchmark = 'below';
            percentile = 25;
            recommendation = 'Below average performance. Review content strategy and audience targeting.';
        }
        return { benchmark, percentile, recommendation };
    }
    calculateConfidenceInterval(proportion, sampleSize, confidenceLevel) {
        if (sampleSize === 0) {
            return { lower: 0, upper: 0 };
        }
        const zScore = this.getZScore(confidenceLevel);
        const standardError = Math.sqrt((proportion * (1 - proportion)) / sampleSize);
        const marginOfError = zScore * standardError;
        return {
            lower: Math.max(0, proportion - marginOfError),
            upper: Math.min(1, proportion + marginOfError),
        };
    }
    getZScore(confidenceLevel) {
        const zScores = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576,
        };
        return zScores[confidenceLevel] || 1.96;
    }
    performWelchsTTest(variations, bestVariation, targetMetric, confidenceLevel) {
        if (variations.length < 2) {
            return { isSignificant: false, pVal: 1.0 };
        }
        let minPValue = 1.0;
        let isAnySignificant = false;
        for (const variation of variations) {
            if (variation.variationId === bestVariation.variationId) {
                continue;
            }
            const pValue = this.welchsTTest(bestVariation.conversionRate, bestVariation.sampleSize, variation.conversionRate, variation.sampleSize);
            minPValue = Math.min(minPValue, pValue);
            const alpha = 1 - confidenceLevel;
            if (pValue < alpha) {
                isAnySignificant = true;
            }
        }
        return {
            isSignificant: isAnySignificant,
            pVal: minPValue,
        };
    }
    welchsTTest(mean1, n1, mean2, n2) {
        if (n1 === 0 || n2 === 0) {
            return 1.0;
        }
        const var1 = mean1 * (1 - mean1);
        const var2 = mean2 * (1 - mean2);
        const se = Math.sqrt(var1 / n1 + var2 / n2);
        if (se === 0) {
            return mean1 === mean2 ? 1.0 : 0.0;
        }
        const t = (mean1 - mean2) / se;
        const df = Math.pow(var1 / n1 + var2 / n2, 2) /
            (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));
        const pValue = 2 * (1 - this.tDistributionCDF(Math.abs(t), df));
        return Math.max(0, Math.min(1, pValue));
    }
    tDistributionCDF(t, df) {
        if (df > 30) {
            return this.normalCDF(t);
        }
        const x = df / (df + t * t);
        const beta = this.incompleteBeta(x, df / 2, 0.5);
        return 1 - 0.5 * beta;
    }
    normalCDF(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1.0 + sign * y);
    }
    incompleteBeta(x, a, b) {
        if (x === 0)
            return 0;
        if (x === 1)
            return 1;
        return Math.pow(x, a) * Math.pow(1 - x, b) / (a * this.beta(a, b));
    }
    beta(a, b) {
        return this.gamma(a) * this.gamma(b) / this.gamma(a + b);
    }
    gamma(x) {
        if (x < 0.5) {
            return Math.PI / (Math.sin(Math.PI * x) * this.gamma(1 - x));
        }
        x -= 1;
        const g = 7;
        const c = [
            0.99999999999980993,
            676.5203681218851,
            -1259.1392167224028,
            771.32342877765313,
            -176.61502916214059,
            12.507343278686905,
            -0.13857109526572012,
            9.9843695780195716e-6,
            1.5056327351493116e-7
        ];
        let result = c[0];
        for (let i = 1; i < g + 2; i++) {
            result += c[i] / (x + i);
        }
        const t = x + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * result;
    }
    calculateEffectSize(variations, winnerId, targetMetric) {
        const winner = variations.find(v => v.variationId === winnerId);
        if (!winner || variations.length < 2) {
            return 0;
        }
        const others = variations.filter(v => v.variationId !== winnerId);
        const secondBest = others.reduce((best, current) => current.metrics[targetMetric] > best.metrics[targetMetric] ? current : best);
        const mean1 = winner.conversionRate;
        const mean2 = secondBest.conversionRate;
        const p1 = mean1;
        const p2 = mean2;
        const n1 = winner.sampleSize;
        const n2 = secondBest.sampleSize;
        if (n1 === 0 || n2 === 0) {
            return 0;
        }
        const pooledP = (n1 * p1 + n2 * p2) / (n1 + n2);
        const pooledSD = Math.sqrt(pooledP * (1 - pooledP));
        if (pooledSD === 0) {
            return 0;
        }
        return (mean1 - mean2) / pooledSD;
    }
    async syncExternalAnalytics(params) {
        try {
            const { userId, channel, contentIds, forceSync = false } = params;
            const supportedChannels = [
                content_workflow_types_1.PublishChannelType.FACEBOOK,
                content_workflow_types_1.PublishChannelType.INSTAGRAM,
                content_workflow_types_1.PublishChannelType.LINKEDIN,
                content_workflow_types_1.PublishChannelType.TWITTER
            ];
            if (!supportedChannels.includes(channel)) {
                return {
                    success: false,
                    error: `External analytics sync not supported for channel: ${channel}`,
                    timestamp: new Date(),
                };
            }
            if (!forceSync) {
                const lastSyncCheck = await this.getLastSyncTime(userId, channel);
                const timeSinceLastSync = Date.now() - lastSyncCheck;
                const syncInterval = 24 * 60 * 60 * 1000;
                if (timeSinceLastSync < syncInterval) {
                    return {
                        success: true,
                        data: {
                            channel,
                            success: true,
                            itemsSynced: 0,
                            errors: [],
                            lastSyncTime: new Date(lastSyncCheck),
                            nextSyncTime: new Date(lastSyncCheck + syncInterval),
                        },
                        message: 'Sync not needed - last sync was within 24 hours',
                        timestamp: new Date(),
                    };
                }
            }
            const { getOAuthConnectionManager } = await Promise.resolve().then(() => __importStar(require('@/integrations/oauth/connection-manager')));
            const manager = getOAuthConnectionManager();
            const connection = await manager.getConnection(userId, channel);
            if (!connection) {
                return {
                    success: false,
                    error: `No OAuth connection found for ${channel}`,
                    timestamp: new Date(),
                };
            }
            if (connection.expiresAt < Date.now()) {
                return {
                    success: false,
                    error: `OAuth token expired for ${channel}. Please reconnect your account.`,
                    timestamp: new Date(),
                };
            }
            const itemsToSync = await this.getContentItemsForSync(userId, channel, contentIds);
            if (itemsToSync.length === 0) {
                return {
                    success: true,
                    data: {
                        channel,
                        success: true,
                        itemsSynced: 0,
                        errors: [],
                        lastSyncTime: new Date(),
                        nextSyncTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                    message: 'No content items found to sync',
                    timestamp: new Date(),
                };
            }
            const syncResult = {
                channel,
                success: true,
                itemsSynced: 0,
                errors: [],
                lastSyncTime: new Date(),
                nextSyncTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            };
            const rateLimiter = new ExternalAnalyticsRateLimiter(channel);
            for (const item of itemsToSync) {
                try {
                    await rateLimiter.waitForRateLimit();
                    const externalData = await this.fetchExternalAnalyticsData(channel, connection.accessToken, item.platformMetrics?.platformPostId);
                    if (externalData) {
                        const normalizedMetrics = this.normalizeExternalMetrics(channel, externalData);
                        const validationResult = this.validateAndDetectAnomalies(item.metrics, normalizedMetrics);
                        if (validationResult.isValid) {
                            await this.updateAnalyticsWithExternalData(userId, item.contentId, channel, normalizedMetrics, externalData);
                            syncResult.itemsSynced++;
                        }
                        else {
                            syncResult.errors.push(`Validation failed for content ${item.contentId}: ${validationResult.reason}`);
                        }
                    }
                    rateLimiter.recordRequest();
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    syncResult.errors.push(`Failed to sync content ${item.contentId}: ${errorMessage}`);
                    if (this.isRateLimitError(error)) {
                        const retryAfter = this.extractRetryAfterFromError(error);
                        rateLimiter.handleRateLimit(retryAfter);
                        await this.queueForRetry(userId, channel, item.contentId, retryAfter);
                    }
                }
            }
            await this.updateLastSyncTime(userId, channel);
            const errorRate = syncResult.errors.length / itemsToSync.length;
            syncResult.success = errorRate < 0.1;
            syncResult.rateLimitStatus = rateLimiter.getStatus();
            return {
                success: true,
                data: syncResult,
                message: `Synced ${syncResult.itemsSynced} items with ${syncResult.errors.length} errors`,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to sync external analytics:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to sync external analytics',
                timestamp: new Date(),
            };
        }
    }
    async getLastSyncTime(userId, channel) {
        try {
            const pk = `USER#${userId}`;
            const skPrefix = `ANALYTICS#`;
            const queryResult = await this.repository.query(pk, skPrefix, {
                filterExpression: '#channel = :channel',
                expressionAttributeNames: {
                    '#channel': 'Data.channel',
                },
                expressionAttributeValues: {
                    ':channel': channel,
                },
                scanIndexForward: false,
                limit: 1,
            });
            if (queryResult.items.length > 0) {
                return queryResult.items[0].lastSynced.getTime();
            }
            return Date.now() - (25 * 60 * 60 * 1000);
        }
        catch (error) {
            console.error('Failed to get last sync time:', error);
            return Date.now() - (25 * 60 * 60 * 1000);
        }
    }
    async getContentItemsForSync(userId, channel, contentIds) {
        try {
            const pk = `USER#${userId}`;
            const skPrefix = 'ANALYTICS#';
            let queryResult;
            if (contentIds && contentIds.length > 0) {
                const items = [];
                for (const contentId of contentIds) {
                    const sk = `ANALYTICS#${contentId}#${channel}`;
                    const result = await this.repository.get(pk, sk);
                    if (result.item) {
                        items.push(result.item);
                    }
                }
                queryResult = { items };
            }
            else {
                queryResult = await this.repository.query(pk, skPrefix, {
                    filterExpression: '#channel = :channel AND #platformPostId <> :empty',
                    expressionAttributeNames: {
                        '#channel': 'Data.channel',
                        '#platformPostId': 'Data.platformMetrics.platformPostId',
                    },
                    expressionAttributeValues: {
                        ':channel': channel,
                        ':empty': '',
                    },
                });
            }
            return queryResult.items.filter(item => item.platformMetrics?.platformPostId &&
                item.syncStatus !== content_workflow_types_1.AnalyticsSyncStatus.SYNCING);
        }
        catch (error) {
            console.error('Failed to get content items for sync:', error);
            return [];
        }
    }
    async fetchExternalAnalyticsData(channel, accessToken, platformPostId) {
        if (!platformPostId) {
            return null;
        }
        try {
            switch (channel) {
                case content_workflow_types_1.PublishChannelType.FACEBOOK:
                    return await this.fetchFacebookInsights(accessToken, platformPostId);
                case content_workflow_types_1.PublishChannelType.INSTAGRAM:
                    return await this.fetchInstagramAnalytics(accessToken, platformPostId);
                case content_workflow_types_1.PublishChannelType.LINKEDIN:
                    return await this.fetchLinkedInAnalytics(accessToken, platformPostId);
                case content_workflow_types_1.PublishChannelType.TWITTER:
                    return await this.fetchTwitterAnalytics(accessToken, platformPostId);
                default:
                    throw new Error(`Unsupported channel: ${channel}`);
            }
        }
        catch (error) {
            console.error(`Failed to fetch ${channel} analytics:`, error);
            throw error;
        }
    }
    async fetchFacebookInsights(accessToken, postId) {
        const url = `https://graph.facebook.com/v18.0/${postId}/insights`;
        const params = new URLSearchParams({
            access_token: accessToken,
            metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total,post_reactions_haha_total,post_reactions_sorry_total,post_reactions_anger_total'
        });
        const response = await fetch(`${url}?${params}`);
        if (!response.ok) {
            if (response.status === 429) {
                throw new RateLimitError('Facebook API rate limit exceeded', response.headers.get('retry-after'));
            }
            throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const metrics = {};
        if (data.data) {
            data.data.forEach((insight) => {
                if (insight.values && insight.values.length > 0) {
                    const value = insight.values[0].value || 0;
                    switch (insight.name) {
                        case 'post_impressions':
                            metrics.impressions = value;
                            break;
                        case 'post_engaged_users':
                            metrics.engagedUsers = value;
                            break;
                        case 'post_clicks':
                            metrics.clicks = value;
                            break;
                        case 'post_reactions_like_total':
                            metrics.likes = value;
                            break;
                        default:
                            metrics[insight.name] = value;
                    }
                }
            });
        }
        return {
            platform: content_workflow_types_1.PublishChannelType.FACEBOOK,
            postId,
            metrics,
            rawData: data,
            retrievedAt: new Date(),
        };
    }
    async fetchInstagramAnalytics(accessToken, postId) {
        const url = `https://graph.facebook.com/v18.0/${postId}/insights`;
        const params = new URLSearchParams({
            access_token: accessToken,
            metric: 'impressions,reach,likes,comments,saves,shares'
        });
        const response = await fetch(`${url}?${params}`);
        if (!response.ok) {
            if (response.status === 429) {
                throw new RateLimitError('Instagram API rate limit exceeded', response.headers.get('retry-after'));
            }
            throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const metrics = {};
        if (data.data) {
            data.data.forEach((insight) => {
                if (insight.values && insight.values.length > 0) {
                    metrics[insight.name] = insight.values[0].value || 0;
                }
            });
        }
        return {
            platform: content_workflow_types_1.PublishChannelType.INSTAGRAM,
            postId,
            metrics,
            rawData: data,
            retrievedAt: new Date(),
        };
    }
    async fetchLinkedInAnalytics(accessToken, postId) {
        const url = `https://api.linkedin.com/v2/socialActions/${postId}/statistics`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        if (!response.ok) {
            if (response.status === 429) {
                throw new RateLimitError('LinkedIn API rate limit exceeded', response.headers.get('retry-after'));
            }
            throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const metrics = {
            likes: data.numLikes || 0,
            comments: data.numComments || 0,
            shares: data.numShares || 0,
            clicks: data.numClicks || 0,
            impressions: data.numImpressions || 0,
        };
        return {
            platform: content_workflow_types_1.PublishChannelType.LINKEDIN,
            postId,
            metrics,
            rawData: data,
            retrievedAt: new Date(),
        };
    }
    async fetchTwitterAnalytics(accessToken, postId) {
        const url = `https://api.twitter.com/2/tweets/${postId}`;
        const params = new URLSearchParams({
            'tweet.fields': 'public_metrics'
        });
        const response = await fetch(`${url}?${params}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        });
        if (!response.ok) {
            if (response.status === 429) {
                throw new RateLimitError('Twitter API rate limit exceeded', response.headers.get('retry-after'));
            }
            throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const publicMetrics = data.data?.public_metrics || {};
        const metrics = {
            views: publicMetrics.impression_count || 0,
            likes: publicMetrics.like_count || 0,
            shares: publicMetrics.retweet_count || 0,
            comments: publicMetrics.reply_count || 0,
            clicks: publicMetrics.url_link_clicks || 0,
        };
        return {
            platform: content_workflow_types_1.PublishChannelType.TWITTER,
            postId,
            metrics,
            rawData: data,
            retrievedAt: new Date(),
        };
    }
    normalizeExternalMetrics(channel, externalData) {
        const metrics = externalData.metrics;
        const normalized = {
            views: metrics.views || metrics.impressions || 0,
            likes: metrics.likes || 0,
            shares: metrics.shares || metrics.retweet_count || 0,
            comments: metrics.comments || metrics.reply_count || 0,
            clicks: metrics.clicks || metrics.url_link_clicks || 0,
            saves: metrics.saves || 0,
            reach: metrics.reach || 0,
            impressions: metrics.impressions || metrics.views || 0,
            engagementRate: 0,
        };
        normalized.engagementRate = this.calculateEngagementRate(normalized);
        return normalized;
    }
    validateAndDetectAnomalies(currentMetrics, newMetrics) {
        const decreaseThreshold = 0.1;
        const metricsToCheck = ['views', 'likes', 'shares', 'comments'];
        for (const metric of metricsToCheck) {
            const current = currentMetrics[metric];
            const updated = newMetrics[metric];
            if (current > 0 && updated < current * (1 - decreaseThreshold)) {
                return {
                    isValid: false,
                    reason: `${String(metric)} decreased significantly: ${current} -> ${updated}`
                };
            }
        }
        const spikeThreshold = 10;
        for (const metric of metricsToCheck) {
            const current = currentMetrics[metric];
            const updated = newMetrics[metric];
            if (current > 0 && updated > current * spikeThreshold) {
                return {
                    isValid: false,
                    reason: `${String(metric)} increased unrealistically: ${current} -> ${updated}`
                };
            }
        }
        return { isValid: true };
    }
    async updateAnalyticsWithExternalData(userId, contentId, channel, normalizedMetrics, externalData) {
        try {
            const keys = (0, keys_1.getAnalyticsKeys)(userId, contentId, channel, content_workflow_types_1.ContentCategory.SOCIAL_MEDIA, '');
            const pk = keys.PK;
            const sk = `ANALYTICS#${contentId}#${channel}`;
            const currentResult = await this.repository.get(pk, sk);
            if (!currentResult.item) {
                console.warn(`Analytics record not found for ${contentId} on ${channel}`);
                return;
            }
            const currentAnalytics = currentResult.item;
            const mergedMetrics = {
                views: Math.max(currentAnalytics.metrics.views, normalizedMetrics.views),
                likes: Math.max(currentAnalytics.metrics.likes, normalizedMetrics.likes),
                shares: Math.max(currentAnalytics.metrics.shares, normalizedMetrics.shares),
                comments: Math.max(currentAnalytics.metrics.comments, normalizedMetrics.comments),
                clicks: Math.max(currentAnalytics.metrics.clicks, normalizedMetrics.clicks),
                saves: Math.max(currentAnalytics.metrics.saves || 0, normalizedMetrics.saves || 0),
                reach: Math.max(currentAnalytics.metrics.reach || 0, normalizedMetrics.reach || 0),
                impressions: Math.max(currentAnalytics.metrics.impressions || 0, normalizedMetrics.impressions || 0),
                engagementRate: this.calculateEngagementRate(normalizedMetrics),
            };
            const updatedAnalytics = {
                ...currentAnalytics,
                metrics: mergedMetrics,
                platformMetrics: {
                    ...currentAnalytics.platformMetrics,
                    externalData: externalData.rawData,
                    lastExternalSync: externalData.retrievedAt,
                },
                lastSynced: new Date(),
                syncStatus: content_workflow_types_1.AnalyticsSyncStatus.COMPLETED,
            };
            await this.repository.update(pk, sk, 'Analytics', updatedAnalytics);
        }
        catch (error) {
            console.error('Failed to update analytics with external data:', error);
            throw error;
        }
    }
    async updateLastSyncTime(userId, channel) {
        try {
            const pk = `USER#${userId}`;
            const sk = `SYNC#${channel}`;
            const syncRecord = {
                userId,
                channel,
                lastSyncTime: new Date(),
                updatedAt: new Date(),
            };
            await this.repository.create(pk, sk, 'SyncRecord', syncRecord);
        }
        catch (error) {
            console.error('Failed to update last sync time:', error);
        }
    }
    isRateLimitError(error) {
        return error instanceof RateLimitError ||
            (error.response && error.response.status === 429) ||
            (error.message && error.message.toLowerCase().includes('rate limit'));
    }
    extractRetryAfterFromError(error) {
        if (error instanceof RateLimitError && error.retryAfter) {
            return parseInt(error.retryAfter, 10) * 1000;
        }
        if (error.response && error.response.headers) {
            const retryAfter = error.response.headers['retry-after'];
            if (retryAfter) {
                return parseInt(retryAfter, 10) * 1000;
            }
        }
        return 15 * 60 * 1000;
    }
    async queueForRetry(userId, channel, contentId, retryAfter) {
        try {
            const pk = `USER#${userId}`;
            const sk = `RETRY#${channel}#${contentId}`;
            const retryRecord = {
                userId,
                channel,
                contentId,
                retryAfter: new Date(Date.now() + retryAfter),
                attempts: 1,
                createdAt: new Date(),
            };
            await this.repository.create(pk, sk, 'RetryRecord', retryRecord);
        }
        catch (error) {
            console.error('Failed to queue for retry:', error);
        }
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
const trackPublication = (params) => exports.analyticsService.trackPublication(params);
exports.trackPublication = trackPublication;
const getContentAnalytics = (params) => exports.analyticsService.getContentAnalytics(params);
exports.getContentAnalytics = getContentAnalytics;
const getAnalyticsByType = (params) => exports.analyticsService.getAnalyticsByType(params);
exports.getAnalyticsByType = getAnalyticsByType;
const getAnalyticsForTimeRange = (userId, preset, customStart, customEnd) => exports.analyticsService.getAnalyticsForTimeRange(userId, preset, customStart, customEnd);
exports.getAnalyticsForTimeRange = getAnalyticsForTimeRange;
const getBenchmarkComparison = (contentType, channel, engagementRate) => exports.analyticsService.getBenchmarkComparison(contentType, channel, engagementRate);
exports.getBenchmarkComparison = getBenchmarkComparison;
const createABTest = (params) => exports.analyticsService.createABTest(params);
exports.createABTest = createABTest;
const getABTestResults = (params) => exports.analyticsService.getABTestResults(params);
exports.getABTestResults = getABTestResults;
const trackABTestMetrics = (userId, testId, variationId, metrics) => exports.analyticsService.trackABTestMetrics(userId, testId, variationId, metrics);
exports.trackABTestMetrics = trackABTestMetrics;
const trackROIEvent = (params) => exports.analyticsService.trackROIEvent(params);
exports.trackROIEvent = trackROIEvent;
const getROIAnalytics = (params) => exports.analyticsService.getROIAnalytics(params);
exports.getROIAnalytics = getROIAnalytics;
const exportROIData = (params) => exports.analyticsService.exportROIData(params);
exports.exportROIData = exportROIData;
const syncExternalAnalytics = (params) => exports.analyticsService.syncExternalAnalytics(params);
exports.syncExternalAnalytics = syncExternalAnalytics;
