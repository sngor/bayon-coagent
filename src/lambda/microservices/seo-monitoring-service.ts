/**
 * SEO Monitoring Service Lambda
 * 
 * Microservice for keyword ranking tracking and SEO monitoring.
 * Validates Requirements 4.5: SEO monitoring service with keyword ranking tracking
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBRepository } from '@/aws/dynamodb/repository';

// Types
interface KeywordRanking {
    keyword: string;
    position: number;
    url: string;
    searchEngine: 'google' | 'bing' | 'yahoo';
    location: string;
    device: 'desktop' | 'mobile';
    timestamp: string;
    previousPosition?: number;
    change?: number;
}

interface SEOMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    category: 'rankings' | 'traffic' | 'technical' | 'content';
}

interface SEOMonitoringRequest {
    userId: string;
    keywords: string[];
    competitors?: string[];
    locations?: string[];
    searchEngines?: ('google' | 'bing' | 'yahoo')[];
    devices?: ('desktop' | 'mobile')[];
    alertThresholds?: {
        positionDrop?: number;
        positionImprovement?: number;
    };
}

interface SEOMonitoringResult {
    rankings: KeywordRanking[];
    metrics: SEOMetric[];
    competitorComparison?: Record<string, KeywordRanking[]>;
    alerts: SEOAlert[];
    monitoringId: string;
    timestamp: string;
    summary: {
        totalKeywords: number;
        averagePosition: number;
        topRankings: number; // Top 10 positions
        improvements: number;
        declines: number;
    };
}

interface SEOAlert {
    type: 'position_drop' | 'position_improvement' | 'new_ranking' | 'lost_ranking';
    keyword: string;
    currentPosition: number;
    previousPosition?: number;
    change: number;
    severity: 'low' | 'medium' | 'high';
    message: string;
}

interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

interface ServiceError {
    errorId: string;
    errorCode: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    traceId: string;
    service: string;
    retryable: boolean;
}

// Keyword ranking simulator (in production, this would integrate with real SEO APIs)
class KeywordRankingTracker {
    private static readonly REAL_ESTATE_KEYWORDS = [
        'real estate agent',
        'homes for sale',
        'buy house',
        'sell house',
        'property listings',
        'realtor near me',
        'home values',
        'market analysis',
        'first time buyer',
        'investment property',
    ];

    static async trackKeywords(
        keywords: string[],
        locations: string[],
        searchEngines: string[],
        devices: string[],
        userId: string,
        repository: DynamoDBRepository
    ): Promise<KeywordRanking[]> {
        const rankings: KeywordRanking[] = [];

        for (const keyword of keywords) {
            for (const location of locations) {
                for (const searchEngine of searchEngines) {
                    for (const device of devices) {
                        const ranking = await this.simulateKeywordRanking(
                            keyword,
                            location,
                            searchEngine as 'google' | 'bing' | 'yahoo',
                            device as 'desktop' | 'mobile',
                            userId,
                            repository
                        );
                        rankings.push(ranking);
                    }
                }
            }
        }

        return rankings;
    }

    private static async simulateKeywordRanking(
        keyword: string,
        location: string,
        searchEngine: 'google' | 'bing' | 'yahoo',
        device: 'desktop' | 'mobile',
        userId: string,
        repository: DynamoDBRepository
    ): Promise<KeywordRanking> {
        const timestamp = new Date().toISOString();

        // Try to get previous ranking for comparison
        let previousPosition: number | undefined;
        try {
            const previousRankings = await repository.query(`USER#${userId}`, `SEO_RANKING#${keyword}#${location}#${searchEngine}#${device}`);

            if (previousRankings.items.length > 0) {
                previousPosition = (previousRankings.items[0] as any).position;
            }
        } catch (error) {
            // No previous data available
        }

        // Simulate ranking position (1-100, with some keywords not ranking)
        let position: number;

        if (this.REAL_ESTATE_KEYWORDS.includes(keyword.toLowerCase())) {
            // Real estate keywords have better chances of ranking
            position = Math.random() > 0.1 ? Math.floor(Math.random() * 50) + 1 : 0;
        } else {
            // Other keywords have lower chances
            position = Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 1 : 0;
        }

        // Adjust position based on search engine (Google is most competitive)
        if (searchEngine === 'google') {
            position = position > 0 ? position + Math.floor(Math.random() * 10) : 0;
        } else if (searchEngine === 'bing') {
            position = position > 0 ? Math.max(1, position - Math.floor(Math.random() * 5)) : 0;
        }

        // Mobile vs desktop differences
        if (device === 'mobile' && position > 0) {
            position = Math.max(1, position + Math.floor(Math.random() * 3) - 1);
        }

        // Calculate change from previous position
        let change = 0;
        if (previousPosition !== undefined && position > 0 && previousPosition > 0) {
            change = previousPosition - position; // Positive = improvement, negative = decline
        }

        return {
            keyword,
            position,
            url: position > 0 ? `https://example-agent-site.com/${keyword.replace(/\s+/g, '-')}` : '',
            searchEngine,
            location,
            device,
            timestamp,
            previousPosition,
            change,
        };
    }

    static async trackCompetitors(
        keywords: string[],
        competitors: string[],
        locations: string[],
        searchEngines: string[]
    ): Promise<Record<string, KeywordRanking[]>> {
        const competitorRankings: Record<string, KeywordRanking[]> = {};

        for (const competitor of competitors) {
            competitorRankings[competitor] = [];

            for (const keyword of keywords) {
                for (const location of locations) {
                    for (const searchEngine of searchEngines) {
                        // Simulate competitor rankings
                        const position = Math.random() > 0.2 ? Math.floor(Math.random() * 30) + 1 : 0;

                        competitorRankings[competitor].push({
                            keyword,
                            position,
                            url: position > 0 ? `https://${competitor.toLowerCase().replace(/\s+/g, '')}.com` : '',
                            searchEngine: searchEngine as 'google' | 'bing' | 'yahoo',
                            location,
                            device: 'desktop', // Simplified for competitors
                            timestamp: new Date().toISOString(),
                        });
                    }
                }
            }
        }

        return competitorRankings;
    }
}

// SEO metrics calculator
class SEOMetricsCalculator {
    static calculateMetrics(rankings: KeywordRanking[]): SEOMetric[] {
        const metrics: SEOMetric[] = [];

        // Average position metric
        const rankedKeywords = rankings.filter(r => r.position > 0);
        const averagePosition = rankedKeywords.length > 0
            ? rankedKeywords.reduce((sum, r) => sum + r.position, 0) / rankedKeywords.length
            : 0;

        const previousAveragePosition = rankedKeywords.length > 0
            ? rankedKeywords
                .filter(r => r.previousPosition && r.previousPosition > 0)
                .reduce((sum, r) => sum + (r.previousPosition || 0), 0) / rankedKeywords.length
            : 0;

        const avgPositionChange = previousAveragePosition > 0
            ? ((previousAveragePosition - averagePosition) / previousAveragePosition) * 100
            : 0;

        metrics.push({
            name: 'Average Position',
            value: Math.round(averagePosition * 10) / 10,
            unit: 'position',
            trend: avgPositionChange > 2 ? 'up' : avgPositionChange < -2 ? 'down' : 'stable',
            changePercentage: Math.round(avgPositionChange * 10) / 10,
            category: 'rankings',
        });

        // Top 10 rankings count
        const top10Count = rankings.filter(r => r.position > 0 && r.position <= 10).length;
        const previousTop10Count = rankings.filter(r =>
            r.previousPosition && r.previousPosition > 0 && r.previousPosition <= 10
        ).length;

        const top10Change = previousTop10Count > 0
            ? ((top10Count - previousTop10Count) / previousTop10Count) * 100
            : 0;

        metrics.push({
            name: 'Top 10 Rankings',
            value: top10Count,
            unit: 'keywords',
            trend: top10Change > 0 ? 'up' : top10Change < 0 ? 'down' : 'stable',
            changePercentage: Math.round(top10Change * 10) / 10,
            category: 'rankings',
        });

        // Visibility score (weighted by position)
        const visibilityScore = rankings.reduce((sum, r) => {
            if (r.position === 0) return sum;
            // Higher weight for better positions
            const weight = r.position <= 3 ? 1 : r.position <= 10 ? 0.7 : r.position <= 20 ? 0.3 : 0.1;
            return sum + weight;
        }, 0);

        const previousVisibilityScore = rankings.reduce((sum, r) => {
            if (!r.previousPosition || r.previousPosition === 0) return sum;
            const weight = r.previousPosition <= 3 ? 1 : r.previousPosition <= 10 ? 0.7 : r.previousPosition <= 20 ? 0.3 : 0.1;
            return sum + weight;
        }, 0);

        const visibilityChange = previousVisibilityScore > 0
            ? ((visibilityScore - previousVisibilityScore) / previousVisibilityScore) * 100
            : 0;

        metrics.push({
            name: 'Visibility Score',
            value: Math.round(visibilityScore * 10) / 10,
            unit: 'score',
            trend: visibilityChange > 5 ? 'up' : visibilityChange < -5 ? 'down' : 'stable',
            changePercentage: Math.round(visibilityChange * 10) / 10,
            category: 'rankings',
        });

        // Ranking distribution
        const improvements = rankings.filter(r => r.change && r.change > 0).length;
        const declines = rankings.filter(r => r.change && r.change < 0).length;

        metrics.push({
            name: 'Improvements',
            value: improvements,
            unit: 'keywords',
            trend: 'stable',
            changePercentage: 0,
            category: 'rankings',
        });

        metrics.push({
            name: 'Declines',
            value: declines,
            unit: 'keywords',
            trend: 'stable',
            changePercentage: 0,
            category: 'rankings',
        });

        return metrics;
    }
}

// SEO alert system
class SEOAlertSystem {
    private snsClient: SNSClient;

    constructor() {
        this.snsClient = new SNSClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }

    generateAlerts(
        rankings: KeywordRanking[],
        thresholds: { positionDrop?: number; positionImprovement?: number }
    ): SEOAlert[] {
        const alerts: SEOAlert[] = [];
        const dropThreshold = thresholds.positionDrop || 5;
        const improvementThreshold = thresholds.positionImprovement || 5;

        for (const ranking of rankings) {
            if (!ranking.change || !ranking.previousPosition) continue;

            // Position drop alerts
            if (ranking.change < 0 && Math.abs(ranking.change) >= dropThreshold) {
                alerts.push({
                    type: 'position_drop',
                    keyword: ranking.keyword,
                    currentPosition: ranking.position,
                    previousPosition: ranking.previousPosition,
                    change: ranking.change,
                    severity: Math.abs(ranking.change) >= 10 ? 'high' : Math.abs(ranking.change) >= 7 ? 'medium' : 'low',
                    message: `"${ranking.keyword}" dropped ${Math.abs(ranking.change)} positions to #${ranking.position}`,
                });
            }

            // Position improvement alerts
            if (ranking.change > 0 && ranking.change >= improvementThreshold) {
                alerts.push({
                    type: 'position_improvement',
                    keyword: ranking.keyword,
                    currentPosition: ranking.position,
                    previousPosition: ranking.previousPosition,
                    change: ranking.change,
                    severity: ranking.change >= 10 ? 'high' : ranking.change >= 7 ? 'medium' : 'low',
                    message: `"${ranking.keyword}" improved ${ranking.change} positions to #${ranking.position}`,
                });
            }

            // New ranking alerts (previously not ranking, now ranking)
            if (ranking.position > 0 && (!ranking.previousPosition || ranking.previousPosition === 0)) {
                alerts.push({
                    type: 'new_ranking',
                    keyword: ranking.keyword,
                    currentPosition: ranking.position,
                    change: ranking.position,
                    severity: ranking.position <= 10 ? 'high' : ranking.position <= 30 ? 'medium' : 'low',
                    message: `"${ranking.keyword}" now ranking at #${ranking.position}`,
                });
            }

            // Lost ranking alerts (previously ranking, now not ranking)
            if (ranking.position === 0 && ranking.previousPosition && ranking.previousPosition > 0) {
                alerts.push({
                    type: 'lost_ranking',
                    keyword: ranking.keyword,
                    currentPosition: ranking.position,
                    previousPosition: ranking.previousPosition,
                    change: -ranking.previousPosition,
                    severity: ranking.previousPosition <= 10 ? 'high' : ranking.previousPosition <= 30 ? 'medium' : 'low',
                    message: `"${ranking.keyword}" lost ranking (was #${ranking.previousPosition})`,
                });
            }
        }

        return alerts;
    }

    async sendAlerts(alerts: SEOAlert[], userId: string): Promise<void> {
        if (alerts.length === 0) return;

        const highPriorityAlerts = alerts.filter(a => a.severity === 'high');

        if (highPriorityAlerts.length > 0) {
            try {
                const message = {
                    subject: `SEO Alert - ${highPriorityAlerts.length} high priority ranking changes`,
                    body: highPriorityAlerts.map(alert => alert.message).join('\n'),
                    alerts: highPriorityAlerts,
                };

                await this.snsClient.send(new PublishCommand({
                    TopicArn: process.env.SEO_ALERT_TOPIC_ARN,
                    Message: JSON.stringify(message),
                    MessageAttributes: {
                        userId: { DataType: 'String', StringValue: userId },
                        alertType: { DataType: 'String', StringValue: 'seo_ranking' },
                        severity: { DataType: 'String', StringValue: 'high' },
                    },
                }));
            } catch (error) {
                console.error('Failed to send SEO alerts:', error);
            }
        }
    }
}

// SEO Monitoring Service
class SEOMonitoringService {
    private repository: DynamoDBRepository;
    private alertSystem: SEOAlertSystem;

    constructor() {
        this.repository = new DynamoDBRepository();
        this.alertSystem = new SEOAlertSystem();
    }

    async monitorSEO(request: SEOMonitoringRequest): Promise<SEOMonitoringResult> {
        const monitoringId = `seo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        // Set defaults
        const locations = request.locations || ['United States'];
        const searchEngines = request.searchEngines || ['google'];
        const devices = request.devices || ['desktop', 'mobile'];

        // Track keyword rankings
        const rankings = await KeywordRankingTracker.trackKeywords(
            request.keywords,
            locations,
            searchEngines,
            devices,
            request.userId,
            this.repository
        );

        // Calculate SEO metrics
        const metrics = SEOMetricsCalculator.calculateMetrics(rankings);

        // Track competitor rankings if requested
        let competitorComparison: Record<string, KeywordRanking[]> | undefined;
        if (request.competitors && request.competitors.length > 0) {
            competitorComparison = await KeywordRankingTracker.trackCompetitors(
                request.keywords,
                request.competitors,
                locations,
                searchEngines
            );
        }

        // Generate alerts
        const alerts = this.alertSystem.generateAlerts(rankings, request.alertThresholds || {});

        // Send high-priority alerts
        await this.alertSystem.sendAlerts(alerts, request.userId);

        // Calculate summary
        const rankedKeywords = rankings.filter(r => r.position > 0);
        const summary = {
            totalKeywords: request.keywords.length,
            averagePosition: rankedKeywords.length > 0
                ? Math.round((rankedKeywords.reduce((sum, r) => sum + r.position, 0) / rankedKeywords.length) * 10) / 10
                : 0,
            topRankings: rankings.filter(r => r.position > 0 && r.position <= 10).length,
            improvements: rankings.filter(r => r.change && r.change > 0).length,
            declines: rankings.filter(r => r.change && r.change < 0).length,
        };

        const result: SEOMonitoringResult = {
            rankings,
            metrics,
            competitorComparison,
            alerts,
            monitoringId,
            timestamp,
            summary,
        };

        // Store monitoring results
        await this.storeMonitoringResults(request.userId, request, result);

        return result;
    }

    private async storeMonitoringResults(
        userId: string,
        request: SEOMonitoringRequest,
        result: SEOMonitoringResult
    ): Promise<void> {
        try {
            // Store monitoring configuration
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `SEO_CONFIG#${result.monitoringId}`,
                monitoringId: result.monitoringId,
                keywords: request.keywords,
                competitors: request.competitors,
                locations: request.locations,
                searchEngines: request.searchEngines,
                devices: request.devices,
                alertThresholds: request.alertThresholds,
                timestamp: result.timestamp,
                GSI1PK: `SEO_CONFIG#${userId}`,
                GSI1SK: result.timestamp,
            } as any);

            // Store monitoring summary
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `SEO_MONITORING#${result.monitoringId}`,
                monitoringId: result.monitoringId,
                summary: result.summary,
                metricsCount: result.metrics.length,
                alertsCount: result.alerts.length,
                timestamp: result.timestamp,
                GSI1PK: `SEO_MONITORING#${userId}`,
                GSI1SK: result.timestamp,
            } as any);

            // Store individual rankings
            for (const ranking of result.rankings) {
                const rankingKey = `${ranking.keyword}#${ranking.location}#${ranking.searchEngine}#${ranking.device}`;
                await this.repository.put({
                    PK: `USER#${userId}`,
                    SK: `SEO_RANKING#${rankingKey}#${result.timestamp}`,
                    monitoringId: result.monitoringId,
                    keyword: ranking.keyword,
                    position: ranking.position,
                    url: ranking.url,
                    searchEngine: ranking.searchEngine,
                    location: ranking.location,
                    device: ranking.device,
                    previousPosition: ranking.previousPosition,
                    change: ranking.change,
                    timestamp: ranking.timestamp,
                    GSI1PK: `SEO_RANKING#${userId}#${ranking.keyword}`,
                    GSI1SK: ranking.timestamp,
                } as any);
            }

            // Store alerts
            for (const alert of result.alerts) {
                await this.repository.put({
                    PK: `USER#${userId}`,
                    SK: `SEO_ALERT#${result.monitoringId}#${Date.now()}`,
                    monitoringId: result.monitoringId,
                    alertType: alert.type,
                    keyword: alert.keyword,
                    currentPosition: alert.currentPosition,
                    previousPosition: alert.previousPosition,
                    change: alert.change,
                    severity: alert.severity,
                    message: alert.message,
                    timestamp: result.timestamp,
                    GSI1PK: `SEO_ALERT#${userId}`,
                    GSI1SK: result.timestamp,
                } as any);
            }
        } catch (error) {
            console.error('Failed to store SEO monitoring results:', error);
            // Don't throw - monitoring can still return results even if storage fails
        }
    }

    public createErrorResponse(error: ServiceError, statusCode: number = 500): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Service': 'seo-monitoring-service',
                'X-Error-ID': error.errorId,
            },
            body: JSON.stringify({ error }),
        };
    }

    public createSuccessResponse(data: any, statusCode: number = 200): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Service': 'seo-monitoring-service',
                'X-Request-ID': `req-${Date.now()}`,
            },
            body: JSON.stringify(data),
        };
    }
}

// Lambda handler
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const service = new SEOMonitoringService();

    try {
        // Parse request body
        if (!event.body) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'MISSING_BODY',
                message: 'Request body is required',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'seo-monitoring-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        const request: SEOMonitoringRequest = JSON.parse(event.body);

        // Validate request
        if (!request.userId || !request.keywords) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'VALIDATION_ERROR',
                message: 'Missing required fields: userId, keywords',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'seo-monitoring-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        if (!Array.isArray(request.keywords) || request.keywords.length === 0) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'VALIDATION_ERROR',
                message: 'Keywords must be a non-empty array',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'seo-monitoring-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        // Process SEO monitoring request
        const result = await service.monitorSEO(request);

        return service.createSuccessResponse(result);

    } catch (error) {
        console.error('SEO monitoring service error:', error);

        const serviceError: ServiceError = {
            errorId: context.awsRequestId,
            errorCode: 'INTERNAL_ERROR',
            message: 'Internal service error occurred',
            details: { error: error instanceof Error ? error.message : String(error) },
            timestamp: new Date().toISOString(),
            traceId: context.awsRequestId,
            service: 'seo-monitoring-service',
            retryable: true,
        };

        return service.createErrorResponse(serviceError, 500);
    }
};

// Export service classes for testing
export { SEOMonitoringService, KeywordRankingTracker, SEOMetricsCalculator, SEOAlertSystem };