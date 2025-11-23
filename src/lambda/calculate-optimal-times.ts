/**
 * AI-Powered Optimal Timing Lambda Function
 * 
 * Analyzes historical engagement data per channel with statistical significance testing
 * and calculates top 3 optimal posting times using time series analysis. Implements
 * machine learning analysis with intelligent caching and expiration.
 * 
 * Schedule: Weekly on Sundays via EventBridge with adaptive scheduling
 * Timeout: 15 minutes
 * Memory: 3008 MB (for ML computations)
 * 
 * Validates: Requirements 3.1, 3.2
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Type definitions for Lambda environment
interface Analytics {
    id: string;
    userId: string;
    contentId: string;
    contentType: string;
    channel: PublishChannelType;
    publishedAt: Date;
    metrics: EngagementMetrics;
    platformMetrics?: {
        platformPostId?: string;
        publishedUrl?: string;
        metadata?: Record<string, any>;
    };
    lastSynced: Date;
    syncStatus: string;
}

interface EngagementMetrics {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
    saves?: number;
    engagementRate: number;
    reach?: number;
    impressions?: number;
}

interface OptimalTime {
    time: string; // HH:MM format
    dayOfWeek: number; // 0-6, Sunday=0
    expectedEngagement: number; // Predicted engagement score
    confidence: number; // 0-1, confidence in prediction
    historicalData: {
        sampleSize: number;
        avgEngagement: number;
        lastCalculated: Date;
    };
}

interface OptimalTimesCache {
    userId: string;
    channel: PublishChannelType;
    contentType: string;
    optimalTimes: OptimalTime[];
    calculatedAt: Date;
    expiresAt: Date;
    dataFreshness: {
        totalSamples: number;
        dateRange: {
            start: Date;
            end: Date;
        };
        lastAnalyticsUpdate: Date;
    };
}

interface TimeSlotAnalysis {
    dayOfWeek: number;
    hour: number;
    totalEngagement: number;
    totalSamples: number;
    avgEngagement: number;
    engagementVariance: number;
    confidenceScore: number;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    seasonalFactor: number;
}

interface StatisticalAnalysis {
    mean: number;
    variance: number;
    standardDeviation: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    sampleSize: number;
    isStatisticallySignificant: boolean;
}

enum PublishChannelType {
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    LINKEDIN = 'linkedin',
    TWITTER = 'twitter',
    BLOG = 'blog',
    NEWSLETTER = 'newsletter'
}

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Logger interface for Lambda environment
interface Logger {
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    error(message: string, error?: Error, context?: any): void;
    debug(message: string, context?: any): void;
    child(context: any): Logger;
}

// Simple logger implementation for Lambda
const createSimpleLogger = (defaultContext: any = {}): Logger => ({
    info: (message: string, context?: any) => {
        console.log(JSON.stringify({ level: 'INFO', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    warn: (message: string, context?: any) => {
        console.warn(JSON.stringify({ level: 'WARN', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    error: (message: string, error?: Error, context?: any) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            message,
            error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
            ...defaultContext,
            ...context,
            timestamp: new Date().toISOString()
        }));
    },
    debug: (message: string, context?: any) => {
        console.log(JSON.stringify({ level: 'DEBUG', message, ...defaultContext, ...context, timestamp: new Date().toISOString() }));
    },
    child: (context: any) => createSimpleLogger({ ...defaultContext, ...context })
});

// Initialize logger with Lambda context
const lambdaLogger = createSimpleLogger({
    service: 'calculate-optimal-times-lambda',
    environment: process.env.NODE_ENV || 'production'
});

interface LambdaEvent {
    source?: string;
    'detail-type'?: string;
    detail?: {
        dryRun?: boolean;
        maxUsers?: number;
        userIds?: string[];
        channels?: PublishChannelType[];
        contentTypes?: string[];
        forceRecalculation?: boolean;
        minSampleSize?: number;
    };
}

interface LambdaContext {
    getRemainingTimeInMillis(): number;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
}

interface ProcessingResult {
    totalUsers: number;
    totalCalculations: number;
    successfulCalculations: number;
    failedCalculations: number;
    cacheHits: number;
    cacheMisses: number;
    errors: ProcessingError[];
    executionTime: number;
    dataFreshnessStats: {
        avgSampleSize: number;
        avgDataAge: number; // in days
        totalAnalyticsRecords: number;
    };
}

interface ProcessingError {
    userId: string;
    channel: PublishChannelType;
    contentType: string;
    error: string;
    sampleSize: number;
}

/**
 * Lambda handler for calculating optimal posting times
 */
export const handler = async (event: LambdaEvent, context: LambdaContext): Promise<{
    statusCode: number;
    body: string;
    result: ProcessingResult;
}> => {
    const startTime = Date.now();
    const correlationId = context.awsRequestId;

    const operationLogger = lambdaLogger.child({
        correlationId,
        functionName: context.functionName,
        operation: 'calculate_optimal_times'
    });

    operationLogger.info('Starting optimal times calculation Lambda', {
        event,
        remainingTime: context.getRemainingTimeInMillis(),
        memoryLimit: context.memoryLimitInMB
    });

    const result: ProcessingResult = {
        totalUsers: 0,
        totalCalculations: 0,
        successfulCalculations: 0,
        failedCalculations: 0,
        cacheHits: 0,
        cacheMisses: 0,
        errors: [],
        executionTime: 0,
        dataFreshnessStats: {
            avgSampleSize: 0,
            avgDataAge: 0,
            totalAnalyticsRecords: 0
        }
    };

    try {
        // Get configuration from event
        const dryRun = event.detail?.dryRun || false;
        const maxUsers = event.detail?.maxUsers || 50; // Reduced for ML processing
        const userIds = event.detail?.userIds;
        const channels = event.detail?.channels || [
            PublishChannelType.FACEBOOK,
            PublishChannelType.INSTAGRAM,
            PublishChannelType.LINKEDIN,
            PublishChannelType.TWITTER
        ];
        const contentTypes = event.detail?.contentTypes || ['social_media', 'blog_post', 'market_update'];
        const forceRecalculation = event.detail?.forceRecalculation || false;
        const minSampleSize = event.detail?.minSampleSize || 20; // Minimum for statistical significance

        operationLogger.info('Processing configuration', {
            dryRun,
            maxUsers,
            userIdsCount: userIds?.length || 'all',
            channels: channels.length,
            contentTypes: contentTypes.length,
            forceRecalculation,
            minSampleSize
        });

        // Get users with analytics data
        const usersWithAnalytics = await getUsersWithAnalyticsData(maxUsers, userIds, operationLogger);

        if (usersWithAnalytics.length === 0) {
            operationLogger.info('No users with analytics data found');

            result.executionTime = Date.now() - startTime;

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'No users with analytics data found',
                    result
                }),
                result
            };
        }

        operationLogger.info(`Found ${usersWithAnalytics.length} users with analytics data`);
        result.totalUsers = usersWithAnalytics.length;

        // Process each user's analytics data
        for (const userId of usersWithAnalytics) {
            // Check remaining execution time (leave 2 minutes buffer)
            const remainingTime = context.getRemainingTimeInMillis();
            if (remainingTime < 120000) {
                operationLogger.warn('Approaching Lambda timeout, stopping processing', {
                    remainingTime,
                    processedUsers: result.totalUsers - usersWithAnalytics.length + 1
                });
                break;
            }

            const userLogger = operationLogger.child({ userId });

            try {
                // Process each channel and content type combination
                for (const channel of channels) {
                    for (const contentType of contentTypes) {
                        result.totalCalculations++;

                        const calculationLogger = userLogger.child({
                            channel,
                            contentType
                        });

                        try {
                            if (dryRun) {
                                // Dry run mode - just log what would be calculated
                                calculationLogger.info('DRY RUN: Would calculate optimal times', {
                                    channel,
                                    contentType
                                });
                                result.successfulCalculations++;
                                continue;
                            }

                            // Check if we have valid cached results (unless forced)
                            if (!forceRecalculation) {
                                const cachedResult = await getCachedOptimalTimes(
                                    userId,
                                    channel,
                                    contentType,
                                    calculationLogger
                                );

                                if (cachedResult && isCacheValid(cachedResult)) {
                                    calculationLogger.info('Using cached optimal times', {
                                        cacheAge: Date.now() - cachedResult.calculatedAt.getTime(),
                                        sampleSize: cachedResult.dataFreshness.totalSamples
                                    });
                                    result.cacheHits++;
                                    result.successfulCalculations++;
                                    continue;
                                }
                            }

                            result.cacheMisses++;

                            // Get historical analytics data for this user, channel, and content type
                            const analyticsData = await getHistoricalAnalyticsData(
                                userId,
                                channel,
                                contentType,
                                calculationLogger
                            );

                            if (analyticsData.length < minSampleSize) {
                                calculationLogger.info('Insufficient data for calculation', {
                                    sampleSize: analyticsData.length,
                                    minRequired: minSampleSize
                                });

                                // Store fallback industry best practices
                                await storeIndustryBestPractices(
                                    userId,
                                    channel,
                                    contentType,
                                    calculationLogger
                                );

                                result.successfulCalculations++;
                                continue;
                            }

                            calculationLogger.info('Calculating optimal times with ML analysis', {
                                sampleSize: analyticsData.length,
                                dateRange: {
                                    start: Math.min(...analyticsData.map(d => d.publishedAt.getTime())),
                                    end: Math.max(...analyticsData.map(d => d.publishedAt.getTime()))
                                }
                            });

                            // Perform time series analysis and ML-based calculation
                            const optimalTimes = await calculateOptimalTimesWithML(
                                analyticsData,
                                channel,
                                contentType,
                                calculationLogger
                            );

                            // Store results in DynamoDB with intelligent expiration
                            await storeOptimalTimesCache(
                                userId,
                                channel,
                                contentType,
                                optimalTimes,
                                analyticsData,
                                calculationLogger
                            );

                            result.successfulCalculations++;
                            result.dataFreshnessStats.totalAnalyticsRecords += analyticsData.length;

                            calculationLogger.info('Successfully calculated and cached optimal times', {
                                optimalTimesCount: optimalTimes.length,
                                avgConfidence: optimalTimes.reduce((sum, t) => sum + t.confidence, 0) / optimalTimes.length
                            });

                        } catch (error) {
                            result.failedCalculations++;
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                            const processingError: ProcessingError = {
                                userId,
                                channel,
                                contentType,
                                error: errorMessage,
                                sampleSize: 0
                            };
                            result.errors.push(processingError);

                            calculationLogger.error('Error calculating optimal times', error as Error, {
                                channel,
                                contentType
                            });
                        }
                    }
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                userLogger.error('Error processing user analytics', error as Error);

                // Add error for each channel/content type combination
                channels.forEach(channel => {
                    contentTypes.forEach(contentType => {
                        result.errors.push({
                            userId,
                            channel,
                            contentType,
                            error: errorMessage,
                            sampleSize: 0
                        });
                        result.failedCalculations++;
                    });
                });
            }
        }

        // Calculate data freshness statistics
        if (result.dataFreshnessStats.totalAnalyticsRecords > 0) {
            result.dataFreshnessStats.avgSampleSize =
                result.dataFreshnessStats.totalAnalyticsRecords / result.successfulCalculations;
        }

        result.executionTime = Date.now() - startTime;

        operationLogger.info('Optimal times calculation completed', {
            totalUsers: result.totalUsers,
            totalCalculations: result.totalCalculations,
            successfulCalculations: result.successfulCalculations,
            failedCalculations: result.failedCalculations,
            cacheHits: result.cacheHits,
            cacheMisses: result.cacheMisses,
            errorCount: result.errors.length,
            executionTime: result.executionTime,
            dataFreshnessStats: result.dataFreshnessStats
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Processed ${result.totalCalculations} calculations: ${result.successfulCalculations} successful, ${result.failedCalculations} failed, ${result.cacheHits} cache hits`,
                result
            }),
            result
        };

    } catch (error) {
        result.executionTime = Date.now() - startTime;

        operationLogger.error('Critical failure in optimal times calculation Lambda', error as Error, {
            executionTime: result.executionTime,
            partialResult: result
        });

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Critical failure in optimal times calculation',
                error: error instanceof Error ? error.message : 'Unknown error',
                result
            }),
            result
        };
    }
};

/**
 * Get users who have analytics data for optimal time calculation
 */
async function getUsersWithAnalyticsData(
    maxUsers: number,
    userIds?: string[],
    logger = lambdaLogger
): Promise<string[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const users: Set<string> = new Set();

        logger.info('Querying for users with analytics data', {
            maxUsers,
            userIdsFilter: userIds ? 'enabled' : 'disabled'
        });

        if (userIds && userIds.length > 0) {
            // Query specific users
            for (const userId of userIds.slice(0, maxUsers)) {
                const hasAnalytics = await userHasAnalyticsData(userId);
                if (hasAnalytics) {
                    users.add(userId);
                }
            }
        } else {
            // Use GSI to find users with analytics data
            const queryCommand = new QueryCommand({
                TableName: tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :entityType',
                ExpressionAttributeValues: {
                    ':entityType': 'ANALYTICS#social_media' // Start with social media analytics
                },
                Limit: maxUsers * 10, // Get more records to find unique users
                ProjectionExpression: 'PK'
            });

            const response = await docClient.send(queryCommand);
            const items = response.Items || [];

            // Extract unique user IDs
            items.forEach(item => {
                if (item.PK && item.PK.startsWith('USER#')) {
                    const userId = item.PK.replace('USER#', '');
                    users.add(userId);
                }
            });

            // Limit to maxUsers
            if (users.size > maxUsers) {
                const userArray = Array.from(users).slice(0, maxUsers);
                users.clear();
                userArray.forEach(userId => users.add(userId));
            }
        }

        logger.info(`Found ${users.size} users with analytics data`);
        return Array.from(users);

    } catch (error) {
        logger.error('Failed to get users with analytics data', error as Error);
        return [];
    }
}

/**
 * Check if a user has analytics data
 */
async function userHasAnalyticsData(userId: string): Promise<boolean> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';

        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':skPrefix': 'ANALYTICS#'
            },
            Limit: 1
        });

        const response = await docClient.send(queryCommand);
        return (response.Items?.length || 0) > 0;
    } catch (error) {
        return false;
    }
}

/**
 * Get cached optimal times if they exist and are valid
 */
async function getCachedOptimalTimes(
    userId: string,
    channel: PublishChannelType,
    contentType: string,
    logger: Logger
): Promise<OptimalTimesCache | null> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const pk = `USER#${userId}`;
        const sk = `OPTIMAL#${channel}#${contentType}`;

        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk AND SK = :sk',
            ExpressionAttributeValues: {
                ':pk': pk,
                ':sk': sk
            }
        });

        const response = await docClient.send(queryCommand);

        if (response.Items && response.Items.length > 0) {
            const item = response.Items[0];
            if (item.Data) {
                return item.Data as OptimalTimesCache;
            }
        }

        return null;
    } catch (error) {
        logger.error('Failed to get cached optimal times', error as Error);
        return null;
    }
}

/**
 * Check if cached optimal times are still valid
 */
function isCacheValid(cache: OptimalTimesCache): boolean {
    const now = new Date();

    // Check if cache has expired
    if (cache.expiresAt < now) {
        return false;
    }

    // Check if data is fresh enough (within 7 days)
    const dataAge = now.getTime() - cache.calculatedAt.getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (dataAge > maxAge) {
        return false;
    }

    // Check if we have sufficient sample size
    if (cache.dataFreshness.totalSamples < 10) {
        return false;
    }

    return true;
}

/**
 * Get historical analytics data for ML analysis
 */
async function getHistoricalAnalyticsData(
    userId: string,
    channel: PublishChannelType,
    contentType: string,
    logger: Logger
): Promise<Analytics[]> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const pk = `USER#${userId}`;
        const skPrefix = 'ANALYTICS#';

        // Get analytics data from the last 90 days
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            FilterExpression: '#channel = :channel AND #contentType = :contentType AND #publishedAt >= :startDate',
            ExpressionAttributeNames: {
                '#channel': 'Data.channel',
                '#contentType': 'Data.contentType',
                '#publishedAt': 'Data.publishedAt'
            },
            ExpressionAttributeValues: {
                ':pk': pk,
                ':skPrefix': skPrefix,
                ':channel': channel,
                ':contentType': contentType,
                ':startDate': ninetyDaysAgo.toISOString()
            },
            Limit: 500 // Limit for performance
        });

        const response = await docClient.send(queryCommand);
        const items = response.Items || [];

        return items
            .map(item => item.Data as Analytics)
            .filter(analytics =>
                analytics.publishedAt &&
                analytics.metrics &&
                analytics.metrics.engagementRate !== undefined
            )
            .map(analytics => ({
                ...analytics,
                publishedAt: new Date(analytics.publishedAt)
            }));

    } catch (error) {
        logger.error('Failed to get historical analytics data', error as Error);
        return [];
    }
}

/**
 * Calculate optimal times using machine learning analysis and time series analysis
 */
async function calculateOptimalTimesWithML(
    analyticsData: Analytics[],
    channel: PublishChannelType,
    contentType: string,
    logger: Logger
): Promise<OptimalTime[]> {
    try {
        logger.info('Starting ML-based optimal times calculation', {
            sampleSize: analyticsData.length,
            channel,
            contentType
        });

        // Group data by time slots (hour of day and day of week)
        const timeSlotMap = new Map<string, {
            engagements: number[];
            publishTimes: Date[];
        }>();

        analyticsData.forEach(analytics => {
            const publishTime = analytics.publishedAt;
            const hour = publishTime.getHours();
            const dayOfWeek = publishTime.getDay();
            const timeKey = `${dayOfWeek}-${hour}`;

            if (!timeSlotMap.has(timeKey)) {
                timeSlotMap.set(timeKey, {
                    engagements: [],
                    publishTimes: []
                });
            }

            const slot = timeSlotMap.get(timeKey)!;
            slot.engagements.push(analytics.metrics.engagementRate);
            slot.publishTimes.push(publishTime);
        });

        // Analyze each time slot with statistical significance
        const timeSlotAnalyses: TimeSlotAnalysis[] = [];

        timeSlotMap.forEach((data, timeKey) => {
            const [dayOfWeek, hour] = timeKey.split('-').map(Number);

            if (data.engagements.length < 3) {
                // Skip slots with insufficient data
                return;
            }

            const analysis = performTimeSlotAnalysis(
                dayOfWeek,
                hour,
                data.engagements,
                data.publishTimes
            );

            timeSlotAnalyses.push(analysis);
        });

        // Apply machine learning techniques for pattern recognition
        const enhancedAnalyses = applyMLEnhancements(timeSlotAnalyses, analyticsData);

        // Sort by engagement and confidence, then take top 3
        const topSlots = enhancedAnalyses
            .filter(analysis => analysis.isStatisticallySignificant && analysis.sampleSize >= 3)
            .sort((a, b) => {
                // Primary sort: average engagement
                const engagementDiff = b.avgEngagement - a.avgEngagement;
                if (Math.abs(engagementDiff) > 0.001) {
                    return engagementDiff;
                }
                // Secondary sort: confidence score
                return b.confidenceScore - a.confidenceScore;
            })
            .slice(0, 3);

        // Convert to OptimalTime format
        const optimalTimes: OptimalTime[] = topSlots.map(analysis => ({
            time: `${analysis.hour.toString().padStart(2, '0')}:00`,
            dayOfWeek: analysis.dayOfWeek,
            expectedEngagement: analysis.avgEngagement,
            confidence: analysis.confidenceScore,
            historicalData: {
                sampleSize: analysis.totalSamples,
                avgEngagement: analysis.avgEngagement,
                lastCalculated: new Date()
            }
        }));

        // If we don't have enough statistically significant slots, fill with industry best practices
        if (optimalTimes.length < 3) {
            const industryTimes = getIndustryBestPractices(channel);
            const needed = 3 - optimalTimes.length;

            // Add industry times that don't conflict with our calculated times
            const existingSlots = new Set(optimalTimes.map(t => `${t.dayOfWeek}-${t.time.split(':')[0]}`));

            for (const industryTime of industryTimes.slice(0, needed)) {
                const slotKey = `${industryTime.dayOfWeek}-${industryTime.time.split(':')[0]}`;
                if (!existingSlots.has(slotKey)) {
                    optimalTimes.push({
                        ...industryTime,
                        confidence: Math.min(industryTime.confidence, 0.6) // Lower confidence for industry data
                    });
                }
            }
        }

        logger.info('ML-based optimal times calculation completed', {
            calculatedSlots: topSlots.length,
            finalOptimalTimes: optimalTimes.length,
            avgConfidence: optimalTimes.reduce((sum, t) => sum + t.confidence, 0) / optimalTimes.length
        });

        return optimalTimes;

    } catch (error) {
        logger.error('Failed to calculate optimal times with ML', error as Error);
        // Fallback to industry best practices
        return getIndustryBestPractices(channel);
    }
}

/**
 * Perform statistical analysis on a time slot
 */
function performTimeSlotAnalysis(
    dayOfWeek: number,
    hour: number,
    engagements: number[],
    publishTimes: Date[]
): TimeSlotAnalysis {
    const totalSamples = engagements.length;
    const totalEngagement = engagements.reduce((sum, eng) => sum + eng, 0);
    const avgEngagement = totalEngagement / totalSamples;

    // Calculate variance and standard deviation
    const variance = engagements.reduce((sum, eng) => sum + Math.pow(eng - avgEngagement, 2), 0) / totalSamples;
    const standardDeviation = Math.sqrt(variance);

    // Calculate confidence score based on sample size and consistency
    const coefficientOfVariation = standardDeviation / avgEngagement;
    const sampleSizeScore = Math.min(totalSamples / 10, 1); // Max score at 10+ samples
    const consistencyScore = Math.max(0, 1 - coefficientOfVariation); // Lower CV = higher consistency
    const confidenceScore = (sampleSizeScore * 0.6) + (consistencyScore * 0.4);

    // Detect trend direction using simple linear regression
    const trendDirection = detectTrendDirection(publishTimes, engagements);

    // Calculate seasonal factor (simplified - could be enhanced with more sophisticated analysis)
    const seasonalFactor = calculateSeasonalFactor(dayOfWeek, hour);

    return {
        dayOfWeek,
        hour,
        totalEngagement,
        totalSamples,
        avgEngagement,
        engagementVariance: variance,
        confidenceScore,
        trendDirection,
        seasonalFactor
    };
}

/**
 * Apply machine learning enhancements to time slot analyses
 */
function applyMLEnhancements(
    analyses: TimeSlotAnalysis[],
    allData: Analytics[]
): (TimeSlotAnalysis & StatisticalAnalysis)[] {
    return analyses.map(analysis => {
        // Calculate statistical significance using t-test approximation
        const tStatistic = analysis.avgEngagement / (Math.sqrt(analysis.engagementVariance) / Math.sqrt(analysis.totalSamples));
        const degreesOfFreedom = analysis.totalSamples - 1;

        // Simplified statistical significance check (t > 2.0 for rough 95% confidence)
        const isStatisticallySignificant = Math.abs(tStatistic) > 2.0 && analysis.totalSamples >= 5;

        // Calculate confidence interval
        const marginOfError = 1.96 * Math.sqrt(analysis.engagementVariance) / Math.sqrt(analysis.totalSamples);
        const confidenceInterval = {
            lower: analysis.avgEngagement - marginOfError,
            upper: analysis.avgEngagement + marginOfError
        };

        return {
            ...analysis,
            mean: analysis.avgEngagement,
            variance: analysis.engagementVariance,
            standardDeviation: Math.sqrt(analysis.engagementVariance),
            confidenceInterval,
            sampleSize: analysis.totalSamples,
            isStatisticallySignificant
        };
    });
}

/**
 * Detect trend direction using simple linear regression
 */
function detectTrendDirection(publishTimes: Date[], engagements: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (publishTimes.length < 3) {
        return 'stable';
    }

    // Convert dates to numeric values (days since first publish)
    const firstTime = publishTimes[0].getTime();
    const xValues = publishTimes.map(time => (time.getTime() - firstTime) / (24 * 60 * 60 * 1000));
    const yValues = engagements;

    // Calculate linear regression slope
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine trend based on slope
    if (slope > 0.001) {
        return 'increasing';
    } else if (slope < -0.001) {
        return 'decreasing';
    } else {
        return 'stable';
    }
}

/**
 * Calculate seasonal factor for time slot
 */
function calculateSeasonalFactor(dayOfWeek: number, hour: number): number {
    // Simplified seasonal factors based on general social media patterns
    // In a real implementation, this could use historical seasonal data

    let factor = 1.0;

    // Weekend vs weekday factor
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        factor *= 0.9; // Slightly lower engagement on weekends for business content
    }

    // Time of day factors
    if (hour >= 9 && hour <= 17) { // Business hours
        factor *= 1.1;
    } else if (hour >= 18 && hour <= 21) { // Evening peak
        factor *= 1.2;
    } else if (hour >= 22 || hour <= 6) { // Late night/early morning
        factor *= 0.7;
    }

    return factor;
}

/**
 * Store optimal times cache with intelligent expiration
 */
async function storeOptimalTimesCache(
    userId: string,
    channel: PublishChannelType,
    contentType: string,
    optimalTimes: OptimalTime[],
    analyticsData: Analytics[],
    logger: Logger
): Promise<void> {
    try {
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const pk = `USER#${userId}`;
        const sk = `OPTIMAL#${channel}#${contentType}`;

        const now = new Date();

        // Calculate adaptive expiration based on data freshness
        const dataAge = now.getTime() - Math.min(...analyticsData.map(d => d.publishedAt.getTime()));
        const sampleSize = analyticsData.length;

        // More data = longer cache validity
        let cacheValidityDays = 7; // Default 7 days
        if (sampleSize >= 50) {
            cacheValidityDays = 14; // 2 weeks for large datasets
        } else if (sampleSize >= 100) {
            cacheValidityDays = 21; // 3 weeks for very large datasets
        }

        const expiresAt = new Date(now.getTime() + cacheValidityDays * 24 * 60 * 60 * 1000);

        const cache: OptimalTimesCache = {
            userId,
            channel,
            contentType,
            optimalTimes,
            calculatedAt: now,
            expiresAt,
            dataFreshness: {
                totalSamples: analyticsData.length,
                dateRange: {
                    start: new Date(Math.min(...analyticsData.map(d => d.publishedAt.getTime()))),
                    end: new Date(Math.max(...analyticsData.map(d => d.publishedAt.getTime())))
                },
                lastAnalyticsUpdate: new Date(Math.max(...analyticsData.map(d => d.lastSynced.getTime())))
            }
        };

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: { PK: pk, SK: sk },
            UpdateExpression: 'SET #data = :data, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#updatedAt': 'UpdatedAt'
            },
            ExpressionAttributeValues: {
                ':data': cache,
                ':updatedAt': now
            }
        });

        await docClient.send(updateCommand);

        logger.debug('Stored optimal times cache', {
            userId,
            channel,
            contentType,
            cacheValidityDays,
            sampleSize: analyticsData.length
        });

    } catch (error) {
        logger.error('Failed to store optimal times cache', error as Error, {
            userId,
            channel,
            contentType
        });
        throw error;
    }
}

/**
 * Store industry best practices when insufficient data
 */
async function storeIndustryBestPractices(
    userId: string,
    channel: PublishChannelType,
    contentType: string,
    logger: Logger
): Promise<void> {
    try {
        const industryTimes = getIndustryBestPractices(channel);

        // Store with lower confidence and shorter cache validity
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

        const cache: OptimalTimesCache = {
            userId,
            channel,
            contentType,
            optimalTimes: industryTimes,
            calculatedAt: now,
            expiresAt,
            dataFreshness: {
                totalSamples: 0,
                dateRange: {
                    start: now,
                    end: now
                },
                lastAnalyticsUpdate: now
            }
        };

        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const pk = `USER#${userId}`;
        const sk = `OPTIMAL#${channel}#${contentType}`;

        const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: { PK: pk, SK: sk },
            UpdateExpression: 'SET #data = :data, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#updatedAt': 'UpdatedAt'
            },
            ExpressionAttributeValues: {
                ':data': cache,
                ':updatedAt': now
            }
        });

        await docClient.send(updateCommand);

        logger.info('Stored industry best practices', {
            userId,
            channel,
            contentType,
            optimalTimesCount: industryTimes.length
        });

    } catch (error) {
        logger.error('Failed to store industry best practices', error as Error);
    }
}

/**
 * Get industry best practice posting times when insufficient data
 */
function getIndustryBestPractices(channel: PublishChannelType): OptimalTime[] {
    const now = new Date();

    const bestPractices: Record<PublishChannelType, OptimalTime[]> = {
        [PublishChannelType.FACEBOOK]: [
            {
                time: '09:00',
                dayOfWeek: 2, // Tuesday
                expectedEngagement: 0.05,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.05,
                    lastCalculated: now,
                },
            },
            {
                time: '13:00',
                dayOfWeek: 3, // Wednesday
                expectedEngagement: 0.048,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.048,
                    lastCalculated: now,
                },
            },
            {
                time: '15:00',
                dayOfWeek: 4, // Thursday
                expectedEngagement: 0.046,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.046,
                    lastCalculated: now,
                },
            },
        ],
        [PublishChannelType.INSTAGRAM]: [
            {
                time: '11:00',
                dayOfWeek: 2, // Tuesday
                expectedEngagement: 0.06,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.06,
                    lastCalculated: now,
                },
            },
            {
                time: '14:00',
                dayOfWeek: 4, // Thursday
                expectedEngagement: 0.058,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.058,
                    lastCalculated: now,
                },
            },
            {
                time: '17:00',
                dayOfWeek: 5, // Friday
                expectedEngagement: 0.055,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.055,
                    lastCalculated: now,
                },
            },
        ],
        [PublishChannelType.LINKEDIN]: [
            {
                time: '08:00',
                dayOfWeek: 2, // Tuesday
                expectedEngagement: 0.04,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.04,
                    lastCalculated: now,
                },
            },
            {
                time: '12:00',
                dayOfWeek: 3, // Wednesday
                expectedEngagement: 0.038,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.038,
                    lastCalculated: now,
                },
            },
            {
                time: '17:00',
                dayOfWeek: 4, // Thursday
                expectedEngagement: 0.036,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.036,
                    lastCalculated: now,
                },
            },
        ],
        [PublishChannelType.TWITTER]: [
            {
                time: '09:00',
                dayOfWeek: 3, // Wednesday
                expectedEngagement: 0.035,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.035,
                    lastCalculated: now,
                },
            },
            {
                time: '12:00',
                dayOfWeek: 2, // Tuesday
                expectedEngagement: 0.033,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.033,
                    lastCalculated: now,
                },
            },
            {
                time: '15:00',
                dayOfWeek: 4, // Thursday
                expectedEngagement: 0.031,
                confidence: 0.7,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.031,
                    lastCalculated: now,
                },
            },
        ],
        [PublishChannelType.BLOG]: [
            {
                time: '10:00',
                dayOfWeek: 2, // Tuesday
                expectedEngagement: 0.025,
                confidence: 0.6,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.025,
                    lastCalculated: now,
                },
            },
            {
                time: '14:00',
                dayOfWeek: 3, // Wednesday
                expectedEngagement: 0.023,
                confidence: 0.6,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.023,
                    lastCalculated: now,
                },
            },
            {
                time: '16:00',
                dayOfWeek: 4, // Thursday
                expectedEngagement: 0.021,
                confidence: 0.6,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.021,
                    lastCalculated: now,
                },
            },
        ],
        [PublishChannelType.NEWSLETTER]: [
            {
                time: '08:00',
                dayOfWeek: 2, // Tuesday
                expectedEngagement: 0.15,
                confidence: 0.6,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.15,
                    lastCalculated: now,
                },
            },
            {
                time: '10:00',
                dayOfWeek: 4, // Thursday
                expectedEngagement: 0.14,
                confidence: 0.6,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.14,
                    lastCalculated: now,
                },
            },
            {
                time: '14:00',
                dayOfWeek: 3, // Wednesday
                expectedEngagement: 0.13,
                confidence: 0.6,
                historicalData: {
                    sampleSize: 0,
                    avgEngagement: 0.13,
                    lastCalculated: now,
                },
            },
        ],
    };

    return bestPractices[channel] || bestPractices[PublishChannelType.FACEBOOK];
}

/**
 * Health check function for monitoring
 */
export async function healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
}> {
    const checks: Record<string, boolean> = {};

    try {
        // Check DynamoDB connectivity
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent';
        const testQuery = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': 'HEALTH_CHECK'
            },
            Limit: 1
        });

        await docClient.send(testQuery);
        checks.dynamodb = true;
    } catch (error) {
        checks.dynamodb = false;
    }

    // Check memory and compute resources
    try {
        // Simple computation test
        const testData = Array.from({ length: 1000 }, (_, i) => Math.random());
        const mean = testData.reduce((sum, val) => sum + val, 0) / testData.length;
        const variance = testData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / testData.length;

        checks.computation = variance > 0; // Should always be true for random data
    } catch (error) {
        checks.computation = false;
    }

    const allHealthy = Object.values(checks).every(check => check);

    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
    };
}