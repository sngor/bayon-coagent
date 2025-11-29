"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimalTimes = exports.cancelSchedule = exports.updateSchedule = exports.getCalendarContent = exports.scheduleContent = exports.schedulingService = exports.SchedulingService = void 0;
exports.bulkSchedule = bulkSchedule;
const crypto_1 = require("crypto");
const repository_1 = require("@/aws/dynamodb/repository");
const keys_1 = require("@/aws/dynamodb/keys");
const connection_manager_1 = require("@/integrations/oauth/connection-manager");
const content_workflow_types_1 = require("@/lib/content-workflow-types");
const error_handling_framework_1 = require("@/lib/error-handling-framework");
const error_handling_1 = require("@/lib/error-handling");
class SchedulingService {
    constructor() {
        this.repository = (0, repository_1.getRepository)();
        this.oauthManager = (0, connection_manager_1.getOAuthConnectionManager)();
    }
    async scheduleContent(params) {
        const result = await (0, error_handling_framework_1.executeService)(async () => {
            const now = new Date();
            if (params.publishTime <= now) {
                throw (0, error_handling_framework_1.createServiceError)('Publishing time must be in the future', 'schedule_content', error_handling_1.ErrorCategory.VALIDATION);
            }
            const validationResult = await this.validateChannels(params.userId, params.channels);
            if (!validationResult.success) {
                throw (0, error_handling_framework_1.createServiceError)(validationResult.error || 'Channel validation failed', 'schedule_content', error_handling_1.ErrorCategory.VALIDATION);
            }
            const scheduleId = (0, crypto_1.randomUUID)();
            const scheduledContent = {
                id: scheduleId,
                userId: params.userId,
                contentId: params.contentId,
                title: params.title,
                content: params.content,
                contentType: params.contentType,
                publishTime: params.publishTime,
                channels: params.channels,
                status: content_workflow_types_1.ScheduledContentStatus.SCHEDULED,
                metadata: params.metadata,
                retryCount: 0,
                createdAt: now,
                updatedAt: now,
                GSI1PK: `SCHEDULE#${content_workflow_types_1.ScheduledContentStatus.SCHEDULED}`,
                GSI1SK: `TIME#${params.publishTime.toISOString()}`,
            };
            const keys = (0, keys_1.getScheduledContentKeys)(params.userId, scheduleId, content_workflow_types_1.ScheduledContentStatus.SCHEDULED, params.publishTime.toISOString());
            await this.repository.create(keys.PK, keys.SK, 'ScheduledContent', scheduledContent, {
                GSI1PK: keys.GSI1PK,
                GSI1SK: keys.GSI1SK,
            });
            return scheduledContent;
        }, {
            operation: 'schedule_content',
            userId: params.userId,
            timestamp: new Date(),
            metadata: {
                contentType: params.contentType,
                channelCount: params.channels.length,
                publishTime: params.publishTime.toISOString()
            }
        }, {
            maxRetries: 3,
            fallback: {
                enabled: false
            }
        });
        if (result.success && result.data) {
            return {
                success: true,
                data: result.data,
                message: `Content scheduled for ${params.publishTime.toLocaleString()}`,
                timestamp: result.timestamp,
            };
        }
        else {
            return {
                success: false,
                error: result.error?.userMessage || result.error?.message || 'Failed to schedule content',
                timestamp: result.timestamp,
            };
        }
    }
    async getCalendarContent(params) {
        const result = await (0, error_handling_framework_1.executeService)(async () => {
            const pk = `USER#${params.userId}`;
            const skPrefix = 'SCHEDULE#';
            const queryResult = await this.repository.query(pk, skPrefix, {
                filterExpression: '#publishTime BETWEEN :startDate AND :endDate',
                expressionAttributeNames: {
                    '#publishTime': 'Data.publishTime',
                },
                expressionAttributeValues: {
                    ':startDate': params.startDate.toISOString(),
                    ':endDate': params.endDate.toISOString(),
                },
            });
            let filteredItems = queryResult.items;
            if (params.channels && params.channels.length > 0) {
                filteredItems = filteredItems.filter(item => item.channels.some(channel => params.channels.includes(channel.type)));
            }
            if (params.contentTypes && params.contentTypes.length > 0) {
                filteredItems = filteredItems.filter(item => params.contentTypes.includes(item.contentType));
            }
            if (params.status && params.status.length > 0) {
                filteredItems = filteredItems.filter(item => params.status.includes(item.status));
            }
            const calendarData = this.groupContentByDate(filteredItems);
            return calendarData;
        }, {
            operation: 'get_calendar_content',
            userId: params.userId,
            timestamp: new Date(),
            metadata: {
                dateRange: {
                    start: params.startDate.toISOString(),
                    end: params.endDate.toISOString()
                },
                filters: {
                    channels: params.channels?.length || 0,
                    contentTypes: params.contentTypes?.length || 0,
                    status: params.status?.length || 0
                }
            }
        }, {
            maxRetries: 3,
            fallback: {
                enabled: true,
                fallbackValue: [],
                cacheKey: `calendar_${params.userId}_${params.startDate.toISOString()}_${params.endDate.toISOString()}`,
                cacheTTL: 5 * 60 * 1000
            }
        });
        if (result.success && result.data) {
            return {
                success: true,
                data: result.data,
                message: `Retrieved ${result.data.reduce((sum, day) => sum + day.totalItems, 0)} scheduled items`,
                timestamp: result.timestamp,
            };
        }
        else {
            return {
                success: false,
                error: result.error?.userMessage || result.error?.message || 'Failed to get calendar content',
                timestamp: result.timestamp,
            };
        }
    }
    async updateSchedule(params) {
        try {
            const keys = (0, keys_1.getScheduledContentKeys)(params.userId, params.scheduleId);
            const existingItem = await this.repository.get(keys.PK, keys.SK);
            if (!existingItem) {
                return {
                    success: false,
                    error: 'Scheduled content not found',
                    timestamp: new Date(),
                };
            }
            if (params.newPublishTime) {
                const now = new Date();
                if (params.newPublishTime <= now) {
                    return {
                        success: false,
                        error: 'New publishing time must be in the future',
                        timestamp: new Date(),
                    };
                }
                if (params.newPublishTime.getTime() !== existingItem.publishTime.getTime()) {
                    const conflicts = await this.detectConflicts(params.userId, params.newPublishTime, params.scheduleId);
                    if (conflicts.length > 0) {
                        return {
                            success: false,
                            error: 'Scheduling conflict detected',
                            data: {
                                conflicts,
                                suggestedTimes: await this.suggestAlternativeTimes(params.userId, params.newPublishTime, existingItem.channels),
                            },
                            timestamp: new Date(),
                        };
                    }
                }
            }
            if (params.channels) {
                const validationResult = await this.validateChannels(params.userId, params.channels);
                if (!validationResult.success) {
                    return {
                        success: false,
                        error: validationResult.error,
                        timestamp: new Date(),
                    };
                }
            }
            const updates = {
                updatedAt: new Date(),
            };
            if (params.newPublishTime) {
                updates.publishTime = params.newPublishTime;
                updates.GSI1SK = `TIME#${params.newPublishTime.toISOString()}`;
            }
            if (params.channels) {
                updates.channels = params.channels;
            }
            if (params.content) {
                updates.content = params.content;
            }
            if (params.title) {
                updates.title = params.title;
            }
            await this.repository.update(keys.PK, keys.SK, updates);
            const updatedItem = await this.repository.get(keys.PK, keys.SK);
            return {
                success: true,
                data: updatedItem,
                message: 'Schedule updated successfully',
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to update schedule:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update schedule',
                timestamp: new Date(),
            };
        }
    }
    async cancelSchedule(userId, scheduleId) {
        try {
            const keys = (0, keys_1.getScheduledContentKeys)(userId, scheduleId);
            const existingItem = await this.repository.get(keys.PK, keys.SK);
            if (!existingItem) {
                return {
                    success: false,
                    error: 'Scheduled content not found',
                    timestamp: new Date(),
                };
            }
            await this.repository.update(keys.PK, keys.SK, {
                status: content_workflow_types_1.ScheduledContentStatus.CANCELLED,
                updatedAt: new Date(),
                GSI1PK: `SCHEDULE#${content_workflow_types_1.ScheduledContentStatus.CANCELLED}`,
            });
            return {
                success: true,
                message: 'Schedule cancelled successfully',
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to cancel schedule:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to cancel schedule',
                timestamp: new Date(),
            };
        }
    }
    async getOptimalTimes(params) {
        try {
            const cacheKey = `OPTIMAL#${params.channel}#${params.contentType}`;
            const cachedTimes = await this.repository.get(`USER#${params.userId}`, cacheKey);
            if (cachedTimes && this.isCacheValid(cachedTimes)) {
                return {
                    success: true,
                    data: cachedTimes,
                    message: 'Retrieved cached optimal times',
                    timestamp: new Date(),
                };
            }
            const optimalTimes = await this.calculateOptimalTimes(params.userId, params.channel, params.contentType);
            await this.cacheOptimalTimes(params.userId, params.channel, params.contentType, optimalTimes);
            return {
                success: true,
                data: optimalTimes,
                message: 'Calculated optimal posting times',
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Failed to get optimal times:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get optimal times',
                timestamp: new Date(),
            };
        }
    }
    async validateChannels(userId, channels) {
        try {
            for (const channel of channels) {
                if (channel.type === content_workflow_types_1.PublishChannelType.BLOG || channel.type === content_workflow_types_1.PublishChannelType.NEWSLETTER) {
                    continue;
                }
                const platformMap = {
                    [content_workflow_types_1.PublishChannelType.FACEBOOK]: 'facebook',
                    [content_workflow_types_1.PublishChannelType.INSTAGRAM]: 'instagram',
                    [content_workflow_types_1.PublishChannelType.LINKEDIN]: 'linkedin',
                    [content_workflow_types_1.PublishChannelType.TWITTER]: 'linkedin',
                    [content_workflow_types_1.PublishChannelType.BLOG]: 'facebook',
                    [content_workflow_types_1.PublishChannelType.NEWSLETTER]: 'facebook',
                };
                const platform = platformMap[channel.type];
                if (platform) {
                    const connection = await this.oauthManager.getConnection(userId, platform);
                    if (!connection) {
                        return {
                            success: false,
                            error: `${channel.type} account not connected. Please connect your account in settings.`,
                        };
                    }
                    if (connection.expiresAt < Date.now()) {
                        return {
                            success: false,
                            error: `${channel.type} connection has expired. Please reconnect your account.`,
                        };
                    }
                }
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to validate channels',
            };
        }
    }
    groupContentByDate(items) {
        const groupedByDate = new Map();
        items.forEach(item => {
            const dateKey = item.publishTime.toISOString().split('T')[0];
            if (!groupedByDate.has(dateKey)) {
                groupedByDate.set(dateKey, []);
            }
            groupedByDate.get(dateKey).push(item);
        });
        const calendarData = [];
        groupedByDate.forEach((items, dateKey) => {
            const date = new Date(dateKey);
            const timeSlots = new Map();
            items.forEach(item => {
                const timeKey = item.publishTime.toISOString();
                if (!timeSlots.has(timeKey)) {
                    timeSlots.set(timeKey, []);
                }
                timeSlots.get(timeKey).push(item);
            });
            const hasConflicts = Array.from(timeSlots.values()).some(slot => slot.length > 1);
            const channelBreakdown = {
                [content_workflow_types_1.PublishChannelType.FACEBOOK]: 0,
                [content_workflow_types_1.PublishChannelType.INSTAGRAM]: 0,
                [content_workflow_types_1.PublishChannelType.LINKEDIN]: 0,
                [content_workflow_types_1.PublishChannelType.TWITTER]: 0,
                [content_workflow_types_1.PublishChannelType.BLOG]: 0,
                [content_workflow_types_1.PublishChannelType.NEWSLETTER]: 0,
            };
            items.forEach(item => {
                item.channels.forEach(channel => {
                    channelBreakdown[channel.type]++;
                });
            });
            calendarData.push({
                date,
                items,
                hasConflicts,
                totalItems: items.length,
                channelBreakdown,
            });
        });
        return calendarData.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    async detectConflicts(userId, publishTime, excludeScheduleId) {
        try {
            const startTime = new Date(publishTime.getTime() - 30 * 60 * 1000);
            const endTime = new Date(publishTime.getTime() + 30 * 60 * 1000);
            const result = await this.repository.query(`USER#${userId}`, 'SCHEDULE#', {
                filterExpression: '#publishTime BETWEEN :startTime AND :endTime AND #status = :status',
                expressionAttributeNames: {
                    '#publishTime': 'Data.publishTime',
                    '#status': 'Data.status',
                },
                expressionAttributeValues: {
                    ':startTime': startTime.toISOString(),
                    ':endTime': endTime.toISOString(),
                    ':status': content_workflow_types_1.ScheduledContentStatus.SCHEDULED,
                },
            });
            const conflictingItems = result.items.filter(item => item.id !== excludeScheduleId);
            if (conflictingItems.length === 0) {
                return [];
            }
            return [{
                    contentId: conflictingItems[0].contentId,
                    requestedTime: publishTime,
                    conflictingItems,
                    suggestedTimes: [],
                    resolution: 'manual',
                }];
        }
        catch (error) {
            console.error('Failed to detect conflicts:', error);
            return [];
        }
    }
    async suggestAlternativeTimes(userId, requestedTime, channels) {
        const suggestions = [];
        const baseTime = new Date(requestedTime);
        const offsets = [1, 2, 4];
        for (const offset of offsets) {
            const suggestedTime = new Date(baseTime.getTime() + offset * 60 * 60 * 1000);
            const conflicts = await this.detectConflicts(userId, suggestedTime);
            if (conflicts.length === 0) {
                suggestions.push(suggestedTime);
            }
        }
        return suggestions;
    }
    async calculateOptimalTimes(userId, channel, contentType) {
        try {
            const analyticsResult = await this.repository.query(`USER#${userId}`, 'ANALYTICS#', {
                filterExpression: '#channel = :channel AND #contentType = :contentType',
                expressionAttributeNames: {
                    '#channel': 'Data.channel',
                    '#contentType': 'Data.contentType',
                },
                expressionAttributeValues: {
                    ':channel': channel,
                    ':contentType': contentType,
                },
                limit: 100,
            });
            if (analyticsResult.items.length < 10) {
                return this.getIndustryBestPractices(channel);
            }
            const engagementByTime = new Map();
            analyticsResult.items.forEach((item) => {
                const publishedAt = new Date(item.publishedAt);
                const hour = publishedAt.getHours();
                const dayOfWeek = publishedAt.getDay();
                const timeKey = `${dayOfWeek}-${hour}`;
                const engagement = item.metrics.engagementRate || 0;
                if (!engagementByTime.has(timeKey)) {
                    engagementByTime.set(timeKey, { total: 0, count: 0 });
                }
                const current = engagementByTime.get(timeKey);
                current.total += engagement;
                current.count += 1;
            });
            const timeSlots = [];
            engagementByTime.forEach((data, timeKey) => {
                const [dayOfWeek, hour] = timeKey.split('-').map(Number);
                timeSlots.push({
                    dayOfWeek,
                    hour,
                    avgEngagement: data.total / data.count,
                    sampleSize: data.count,
                });
            });
            timeSlots.sort((a, b) => b.avgEngagement - a.avgEngagement);
            const topSlots = timeSlots.slice(0, 3);
            return topSlots.map(slot => ({
                time: `${slot.hour.toString().padStart(2, '0')}:00`,
                dayOfWeek: slot.dayOfWeek,
                expectedEngagement: slot.avgEngagement,
                confidence: Math.min(slot.sampleSize / 10, 1),
                historicalData: {
                    sampleSize: slot.sampleSize,
                    avgEngagement: slot.avgEngagement,
                    lastCalculated: new Date(),
                },
            }));
        }
        catch (error) {
            console.error('Failed to calculate optimal times:', error);
            return this.getIndustryBestPractices(channel);
        }
    }
    getIndustryBestPractices(channel) {
        const bestPractices = {
            [content_workflow_types_1.PublishChannelType.FACEBOOK]: [
                {
                    time: '09:00',
                    dayOfWeek: 2,
                    expectedEngagement: 0.05,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.05,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '13:00',
                    dayOfWeek: 3,
                    expectedEngagement: 0.048,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.048,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '15:00',
                    dayOfWeek: 4,
                    expectedEngagement: 0.046,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.046,
                        lastCalculated: new Date(),
                    },
                },
            ],
            [content_workflow_types_1.PublishChannelType.INSTAGRAM]: [
                {
                    time: '11:00',
                    dayOfWeek: 2,
                    expectedEngagement: 0.06,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.06,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '14:00',
                    dayOfWeek: 4,
                    expectedEngagement: 0.058,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.058,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '17:00',
                    dayOfWeek: 5,
                    expectedEngagement: 0.055,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.055,
                        lastCalculated: new Date(),
                    },
                },
            ],
            [content_workflow_types_1.PublishChannelType.LINKEDIN]: [
                {
                    time: '08:00',
                    dayOfWeek: 2,
                    expectedEngagement: 0.04,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.04,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '12:00',
                    dayOfWeek: 3,
                    expectedEngagement: 0.038,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.038,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '17:00',
                    dayOfWeek: 4,
                    expectedEngagement: 0.036,
                    confidence: 0.8,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.036,
                        lastCalculated: new Date(),
                    },
                },
            ],
            [content_workflow_types_1.PublishChannelType.TWITTER]: [
                {
                    time: '09:00',
                    dayOfWeek: 1,
                    expectedEngagement: 0.03,
                    confidence: 0.7,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.03,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '15:00',
                    dayOfWeek: 3,
                    expectedEngagement: 0.028,
                    confidence: 0.7,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.028,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '18:00',
                    dayOfWeek: 5,
                    expectedEngagement: 0.025,
                    confidence: 0.7,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.025,
                        lastCalculated: new Date(),
                    },
                },
            ],
            [content_workflow_types_1.PublishChannelType.BLOG]: [
                {
                    time: '10:00',
                    dayOfWeek: 2,
                    expectedEngagement: 0.02,
                    confidence: 0.6,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.02,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '14:00',
                    dayOfWeek: 4,
                    expectedEngagement: 0.018,
                    confidence: 0.6,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.018,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '16:00',
                    dayOfWeek: 1,
                    expectedEngagement: 0.016,
                    confidence: 0.6,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.016,
                        lastCalculated: new Date(),
                    },
                },
            ],
            [content_workflow_types_1.PublishChannelType.NEWSLETTER]: [
                {
                    time: '10:00',
                    dayOfWeek: 2,
                    expectedEngagement: 0.15,
                    confidence: 0.7,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.15,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '14:00',
                    dayOfWeek: 4,
                    expectedEngagement: 0.14,
                    confidence: 0.7,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.14,
                        lastCalculated: new Date(),
                    },
                },
                {
                    time: '09:00',
                    dayOfWeek: 3,
                    expectedEngagement: 0.13,
                    confidence: 0.7,
                    historicalData: {
                        sampleSize: 0,
                        avgEngagement: 0.13,
                        lastCalculated: new Date(),
                    },
                },
            ],
        };
        return bestPractices[channel] || bestPractices[content_workflow_types_1.PublishChannelType.FACEBOOK];
    }
    isCacheValid(cachedData) {
        if (!cachedData || !Array.isArray(cachedData) || cachedData.length === 0) {
            return false;
        }
        const lastCalculated = new Date(cachedData[0].historicalData?.lastCalculated);
        const now = new Date();
        const hoursSinceCalculated = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60);
        return hoursSinceCalculated < 24;
    }
    async cacheOptimalTimes(userId, channel, contentType, optimalTimes) {
        try {
            const cacheKey = `OPTIMAL#${channel}#${contentType}`;
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await this.repository.create(`USER#${userId}`, cacheKey, 'OptimalTimesCache', {
                channel,
                contentType,
                optimalTimes,
                calculatedAt: new Date(),
                expiresAt,
            });
        }
        catch (error) {
            console.error('Failed to cache optimal times:', error);
        }
    }
}
exports.SchedulingService = SchedulingService;
exports.schedulingService = new SchedulingService();
const scheduleContent = (params) => exports.schedulingService.scheduleContent(params);
exports.scheduleContent = scheduleContent;
const getCalendarContent = (params) => exports.schedulingService.getCalendarContent(params);
exports.getCalendarContent = getCalendarContent;
const updateSchedule = (params) => exports.schedulingService.updateSchedule(params);
exports.updateSchedule = updateSchedule;
const cancelSchedule = (userId, scheduleId) => exports.schedulingService.cancelSchedule(userId, scheduleId);
exports.cancelSchedule = cancelSchedule;
const getOptimalTimes = (params) => exports.schedulingService.getOptimalTimes(params);
exports.getOptimalTimes = getOptimalTimes;
async function bulkSchedule(params) {
    const schedulingService = new SchedulingService();
    try {
        const progress = {
            total: params.items.length,
            completed: 0,
            failed: 0,
            errors: []
        };
        const validationResult = await validateBulkScheduleParams(params);
        if (!validationResult.success) {
            return {
                success: false,
                error: validationResult.error,
                timestamp: new Date(),
            };
        }
        const scheduleDates = await generateScheduleDates(params.pattern, params.items.length);
        if (scheduleDates.length !== params.items.length) {
            return {
                success: false,
                error: `Could not generate ${params.items.length} valid dates within the specified pattern`,
                timestamp: new Date(),
            };
        }
        const conflicts = await detectBulkConflicts(params.userId, params.items, scheduleDates, params.channels);
        if (conflicts.length > 0) {
            const resolvedDates = await resolveConflicts(conflicts, scheduleDates, params.conflictResolution || 'skip');
            if (!resolvedDates.success) {
                return {
                    success: false,
                    error: 'Unable to resolve scheduling conflicts',
                    data: {
                        success: false,
                        scheduled: [],
                        failed: [],
                        conflicts,
                        totalProcessed: 0,
                        message: 'Conflicts detected and could not be resolved'
                    },
                    timestamp: new Date(),
                };
            }
        }
        const scheduledItems = [];
        const errors = [];
        for (let i = 0; i < params.items.length; i++) {
            const item = params.items[i];
            const publishTime = item.customTime || scheduleDates[i];
            try {
                progress.currentItem = item.title;
                params.progressCallback?.(progress);
                if (!publishTime || publishTime <= new Date()) {
                    throw new Error('Invalid publish time generated');
                }
                const scheduleId = (0, crypto_1.randomUUID)();
                const scheduledContent = {
                    id: scheduleId,
                    userId: params.userId,
                    contentId: item.contentId,
                    title: item.title,
                    content: item.content,
                    contentType: item.contentType,
                    publishTime,
                    channels: params.channels,
                    status: content_workflow_types_1.ScheduledContentStatus.SCHEDULED,
                    metadata: {
                        bulkScheduled: true,
                        bulkPattern: params.pattern.type,
                        priority: item.priority || 3,
                        generatedAt: new Date(),
                    },
                    retryCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    GSI1PK: `SCHEDULE#${content_workflow_types_1.ScheduledContentStatus.SCHEDULED}`,
                    GSI1SK: `TIME#${publishTime.toISOString()}`,
                };
                scheduledItems.push(scheduledContent);
                progress.completed++;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push({
                    itemId: item.contentId,
                    title: item.title,
                    error: errorMessage,
                    suggestedAction: 'Review content and try again'
                });
                progress.failed++;
            }
        }
        if (scheduledItems.length > 0) {
            const transactionResult = await saveScheduledItemsAtomically(scheduledItems);
            if (!transactionResult.success) {
                return {
                    success: false,
                    error: 'Failed to save scheduled items atomically',
                    data: {
                        success: false,
                        scheduled: [],
                        failed: errors,
                        conflicts: [],
                        totalProcessed: params.items.length,
                        message: 'Transaction failed - no items were scheduled'
                    },
                    timestamp: new Date(),
                };
            }
        }
        params.progressCallback?.(progress);
        const result = {
            success: scheduledItems.length > 0,
            scheduled: scheduledItems,
            failed: errors,
            conflicts: [],
            totalProcessed: params.items.length,
            message: `Successfully scheduled ${scheduledItems.length} of ${params.items.length} items`
        };
        return {
            success: true,
            data: result,
            message: result.message,
            timestamp: new Date(),
        };
    }
    catch (error) {
        console.error('Bulk scheduling failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Bulk scheduling failed',
            timestamp: new Date(),
        };
    }
}
async function validateBulkScheduleParams(params) {
    if (!params.userId || !params.items || !params.pattern || !params.channels) {
        return { success: false, error: 'Missing required parameters' };
    }
    if (params.items.length === 0) {
        return { success: false, error: 'No items provided for scheduling' };
    }
    if (params.items.length > 100) {
        return { success: false, error: 'Maximum 100 items allowed per bulk operation' };
    }
    for (const item of params.items) {
        if (!item.contentId || !item.title || !item.content || !item.contentType) {
            return { success: false, error: `Invalid item: ${item.title || 'Unknown'}` };
        }
    }
    if (!params.pattern.startDate || params.pattern.startDate <= new Date()) {
        return { success: false, error: 'Pattern start date must be in the future' };
    }
    if (params.channels.length === 0) {
        return { success: false, error: 'At least one channel must be specified' };
    }
    return { success: true };
}
async function generateScheduleDates(pattern, itemCount) {
    const dates = [];
    let currentDate = new Date(pattern.startDate);
    const holidays = await getHolidayCalendar();
    switch (pattern.type) {
        case content_workflow_types_1.SchedulingPatternType.DAILY:
            dates.push(...generateDailyDates(currentDate, itemCount, pattern, holidays));
            break;
        case content_workflow_types_1.SchedulingPatternType.WEEKLY:
            dates.push(...generateWeeklyDates(currentDate, itemCount, pattern, holidays));
            break;
        case content_workflow_types_1.SchedulingPatternType.CUSTOM:
            dates.push(...generateCustomDates(currentDate, itemCount, pattern, holidays));
            break;
        default:
            throw new Error(`Unsupported pattern type: ${pattern.type}`);
    }
    if (pattern.timeOfDay) {
        const [hours, minutes] = pattern.timeOfDay.split(':').map(Number);
        dates.forEach(date => {
            date.setHours(hours, minutes, 0, 0);
        });
    }
    if (pattern.endDate) {
        return dates.filter(date => date <= pattern.endDate);
    }
    return dates;
}
function generateDailyDates(startDate, itemCount, pattern, holidays) {
    const dates = [];
    let currentDate = new Date(startDate);
    const interval = pattern.interval || 1;
    while (dates.length < itemCount) {
        if (!shouldExcludeDate(currentDate, pattern, holidays)) {
            dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + interval);
        if (currentDate.getFullYear() > startDate.getFullYear() + 2) {
            break;
        }
    }
    return dates;
}
function generateWeeklyDates(startDate, itemCount, pattern, holidays) {
    const dates = [];
    let currentDate = new Date(startDate);
    const interval = pattern.interval || 1;
    const daysOfWeek = pattern.daysOfWeek || [1, 3, 5];
    while (dates.length < itemCount) {
        for (const dayOfWeek of daysOfWeek) {
            if (dates.length >= itemCount)
                break;
            const weekDate = new Date(currentDate);
            const currentDayOfWeek = weekDate.getDay();
            const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
            weekDate.setDate(weekDate.getDate() + daysToAdd);
            if (weekDate >= startDate && !shouldExcludeDate(weekDate, pattern, holidays)) {
                dates.push(new Date(weekDate));
            }
        }
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        if (currentDate.getFullYear() > startDate.getFullYear() + 2) {
            break;
        }
    }
    return dates.sort((a, b) => a.getTime() - b.getTime());
}
function generateCustomDates(startDate, itemCount, pattern, holidays) {
    if (pattern.customDates && pattern.customDates.length > 0) {
        return pattern.customDates
            .filter(date => date >= startDate && !shouldExcludeDate(date, pattern, holidays))
            .slice(0, itemCount);
    }
    return generateDailyDates(startDate, itemCount, pattern, holidays);
}
function shouldExcludeDate(date, pattern, holidays) {
    const dayOfWeek = date.getDay();
    if (pattern.excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return true;
    }
    if (pattern.excludeHolidays) {
        const dateString = date.toISOString().split('T')[0];
        const isHoliday = holidays.some(holiday => holiday.date.toISOString().split('T')[0] === dateString);
        if (isHoliday) {
            return true;
        }
    }
    return false;
}
async function getHolidayCalendar() {
    const currentYear = new Date().getFullYear();
    const holidays = [
        { date: new Date(currentYear, 0, 1), name: "New Year's Day", type: 'federal' },
        { date: new Date(currentYear, 0, 15), name: "Martin Luther King Jr. Day", type: 'federal' },
        { date: new Date(currentYear, 1, 19), name: "Presidents Day", type: 'federal' },
        { date: new Date(currentYear, 4, 27), name: "Memorial Day", type: 'federal' },
        { date: new Date(currentYear, 6, 4), name: "Independence Day", type: 'federal' },
        { date: new Date(currentYear, 8, 2), name: "Labor Day", type: 'federal' },
        { date: new Date(currentYear, 9, 14), name: "Columbus Day", type: 'federal' },
        { date: new Date(currentYear, 10, 11), name: "Veterans Day", type: 'federal' },
        { date: new Date(currentYear, 10, 28), name: "Thanksgiving", type: 'federal' },
        { date: new Date(currentYear, 11, 25), name: "Christmas Day", type: 'federal' },
        { date: new Date(currentYear, 10, 29), name: "Black Friday", type: 'real-estate' },
        { date: new Date(currentYear, 11, 31), name: "New Year's Eve", type: 'real-estate' },
    ];
    return holidays;
}
async function detectBulkConflicts(userId, items, scheduleDates, channels) {
    const conflicts = [];
    const schedulingService = new SchedulingService();
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const publishTime = item.customTime || scheduleDates[i];
        if (!publishTime)
            continue;
        const itemConflicts = await schedulingService.detectConflicts(userId, publishTime);
        if (itemConflicts.length > 0) {
            conflicts.push({
                contentId: item.contentId,
                requestedTime: publishTime,
                conflictingItems: itemConflicts[0].conflictingItems,
                suggestedTimes: await schedulingService.suggestAlternativeTimes(userId, publishTime, channels),
                resolution: 'manual'
            });
        }
    }
    return conflicts;
}
async function resolveConflicts(conflicts, originalDates, strategy) {
    switch (strategy) {
        case 'skip':
            return { success: true, resolvedDates: originalDates };
        case 'reschedule':
            const resolvedDates = [...originalDates];
            for (const conflict of conflicts) {
                const originalIndex = originalDates.findIndex(date => date.getTime() === conflict.requestedTime.getTime());
                if (originalIndex >= 0 && conflict.suggestedTimes.length > 0) {
                    resolvedDates[originalIndex] = conflict.suggestedTimes[0];
                }
            }
            return { success: true, resolvedDates };
        case 'override':
            return { success: true, resolvedDates: originalDates };
        default:
            return { success: false, error: `Unknown conflict resolution strategy: ${strategy}` };
    }
}
async function saveScheduledItemsAtomically(items) {
    try {
        const repository = (0, repository_1.getRepository)();
        const batchSize = 25;
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        for (const batch of batches) {
            const promises = batch.map(async (item) => {
                const keys = (0, keys_1.getScheduledContentKeys)(item.userId, item.id, item.status, item.publishTime.toISOString());
                return repository.create(keys.PK, keys.SK, 'ScheduledContent', item, {
                    GSI1PK: keys.GSI1PK,
                    GSI1SK: keys.GSI1SK,
                });
            });
            await Promise.all(promises);
        }
        return { success: true };
    }
    catch (error) {
        console.error('Atomic save failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save items atomically'
        };
    }
}
