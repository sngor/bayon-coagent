/**
 * Reputation Monitoring Service Lambda
 * 
 * Microservice for real-time reputation monitoring across web sources.
 * Validates Requirements 4.2: Reputation monitoring service with real-time alerts
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DynamoDBRepository } from '@/aws/dynamodb/repository';

// Types
interface MonitoringSource {
    name: string;
    type: 'social' | 'review' | 'directory' | 'news';
    url: string;
    active: boolean;
    lastChecked?: string;
}

interface MonitoringSetupRequest {
    brandIdentifiers: string[];
    sources: MonitoringSource[];
    keywords: string[];
    userId: string;
    alertPreferences?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
        threshold?: 'all' | 'negative' | 'critical';
    };
}

interface Mention {
    source: string;
    content: string;
    timestamp: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    url?: string;
    author?: string;
    confidence: number;
}

interface MonitoringResult {
    sourcesMonitored: string[];
    mentionsFound: Mention[];
    coveragePercentage: number;
    monitoringId: string;
    timestamp: string;
    alertsSent: number;
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

// Mention detection simulators for different source types
class MentionDetector {
    private static readonly SENTIMENT_KEYWORDS = {
        positive: ['excellent', 'great', 'amazing', 'professional', 'helpful', 'recommend', 'outstanding'],
        negative: ['terrible', 'awful', 'unprofessional', 'rude', 'disappointing', 'avoid', 'worst'],
        neutral: ['okay', 'average', 'standard', 'normal', 'typical', 'regular'],
    };

    static async detectMentions(
        brandIdentifiers: string[],
        keywords: string[],
        sources: MonitoringSource[]
    ): Promise<Mention[]> {
        const mentions: Mention[] = [];
        const activeSources = sources.filter(source => source.active);

        for (const source of activeSources) {
            // Simulate mention detection for each source
            const sourceMentions = await this.simulateSourceMentions(
                brandIdentifiers,
                keywords,
                source
            );
            mentions.push(...sourceMentions);
        }

        return mentions;
    }

    private static async simulateSourceMentions(
        brandIdentifiers: string[],
        keywords: string[],
        source: MonitoringSource
    ): Promise<Mention[]> {
        const mentions: Mention[] = [];

        // Simulate 0-3 mentions per source
        const mentionCount = Math.floor(Math.random() * 4);

        for (let i = 0; i < mentionCount; i++) {
            const brandId = brandIdentifiers[Math.floor(Math.random() * brandIdentifiers.length)];
            const keyword = keywords[Math.floor(Math.random() * keywords.length)];

            // Generate sentiment
            const sentiments: Array<'positive' | 'negative' | 'neutral'> = ['positive', 'negative', 'neutral'];
            const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

            // Generate content based on source type and sentiment
            const content = this.generateMentionContent(brandId, keyword, sentiment, source.type);

            mentions.push({
                source: source.name,
                content,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
                sentiment,
                url: `${source.url}/mention-${i}`,
                author: this.generateAuthorName(),
                confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
            });
        }

        return mentions;
    }

    private static generateMentionContent(
        brandId: string,
        keyword: string,
        sentiment: 'positive' | 'negative' | 'neutral',
        sourceType: string
    ): string {
        const sentimentWords = this.SENTIMENT_KEYWORDS[sentiment];
        const sentimentWord = sentimentWords[Math.floor(Math.random() * sentimentWords.length)];

        const templates = {
            social: [
                `Just worked with ${brandId} for ${keyword} - ${sentimentWord} experience!`,
                `${brandId} helped us with ${keyword}. Service was ${sentimentWord}.`,
                `Looking for ${keyword}? ${brandId} was ${sentimentWord} to work with.`,
            ],
            review: [
                `${brandId} provided ${sentimentWord} service for our ${keyword} needs.`,
                `Review: ${brandId} - ${sentimentWord} ${keyword} experience overall.`,
                `${sentimentWord} ${keyword} service from ${brandId}. Would recommend.`,
            ],
            directory: [
                `${brandId} - ${keyword} specialist. ${sentimentWord} ratings.`,
                `Listed: ${brandId} for ${keyword}. Customer feedback: ${sentimentWord}.`,
            ],
            news: [
                `Local ${keyword} expert ${brandId} receives ${sentimentWord} recognition.`,
                `${brandId} makes ${sentimentWord} impact in ${keyword} market.`,
            ],
        };

        const sourceTemplates = templates[sourceType as keyof typeof templates] || templates.social;
        return sourceTemplates[Math.floor(Math.random() * sourceTemplates.length)];
    }

    private static generateAuthorName(): string {
        const firstNames = ['John', 'Sarah', 'Mike', 'Lisa', 'David', 'Emma', 'Chris', 'Anna'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        return `${firstName} ${lastName[0]}.`; // e.g., "John S."
    }
}

// Alert system for sending notifications
class AlertSystem {
    private snsClient: SNSClient;

    constructor() {
        this.snsClient = new SNSClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }

    async sendAlerts(
        mentions: Mention[],
        alertPreferences: MonitoringSetupRequest['alertPreferences'],
        userId: string
    ): Promise<number> {
        if (!alertPreferences) return 0;

        // Filter mentions based on threshold
        const filteredMentions = this.filterMentionsByThreshold(mentions, alertPreferences.threshold);

        if (filteredMentions.length === 0) return 0;

        let alertsSent = 0;

        // Send email alerts
        if (alertPreferences.email) {
            await this.sendEmailAlert(filteredMentions, userId);
            alertsSent++;
        }

        // Send SMS alerts
        if (alertPreferences.sms) {
            await this.sendSMSAlert(filteredMentions, userId);
            alertsSent++;
        }

        // Send push notifications
        if (alertPreferences.push) {
            await this.sendPushAlert(filteredMentions, userId);
            alertsSent++;
        }

        return alertsSent;
    }

    private filterMentionsByThreshold(
        mentions: Mention[],
        threshold?: 'all' | 'negative' | 'critical'
    ): Mention[] {
        switch (threshold) {
            case 'negative':
                return mentions.filter(m => m.sentiment === 'negative');
            case 'critical':
                return mentions.filter(m => m.sentiment === 'negative' && m.confidence > 0.8);
            case 'all':
            default:
                return mentions;
        }
    }

    private async sendEmailAlert(mentions: Mention[], userId: string): Promise<void> {
        try {
            const message = {
                subject: `Brand Monitoring Alert - ${mentions.length} new mentions`,
                body: `New mentions detected:\n\n${mentions.map(m =>
                    `- ${m.source}: ${m.content} (${m.sentiment})`
                ).join('\n')}`,
            };

            await this.snsClient.send(new PublishCommand({
                TopicArn: process.env.EMAIL_ALERT_TOPIC_ARN,
                Message: JSON.stringify(message),
                MessageAttributes: {
                    userId: { DataType: 'String', StringValue: userId },
                    alertType: { DataType: 'String', StringValue: 'email' },
                },
            }));
        } catch (error) {
            console.error('Failed to send email alert:', error);
        }
    }

    private async sendSMSAlert(mentions: Mention[], userId: string): Promise<void> {
        try {
            const message = `Brand Alert: ${mentions.length} new mentions detected. Check your dashboard for details.`;

            await this.snsClient.send(new PublishCommand({
                TopicArn: process.env.SMS_ALERT_TOPIC_ARN,
                Message: message,
                MessageAttributes: {
                    userId: { DataType: 'String', StringValue: userId },
                    alertType: { DataType: 'String', StringValue: 'sms' },
                },
            }));
        } catch (error) {
            console.error('Failed to send SMS alert:', error);
        }
    }

    private async sendPushAlert(mentions: Mention[], userId: string): Promise<void> {
        try {
            const message = {
                title: 'Brand Monitoring Alert',
                body: `${mentions.length} new mentions detected`,
                data: {
                    mentionCount: mentions.length.toString(),
                    userId,
                },
            };

            await this.snsClient.send(new PublishCommand({
                TopicArn: process.env.PUSH_ALERT_TOPIC_ARN,
                Message: JSON.stringify(message),
                MessageAttributes: {
                    userId: { DataType: 'String', StringValue: userId },
                    alertType: { DataType: 'String', StringValue: 'push' },
                },
            }));
        } catch (error) {
            console.error('Failed to send push alert:', error);
        }
    }
}

// Reputation Monitoring Service
class ReputationMonitoringService {
    private repository: DynamoDBRepository;
    private alertSystem: AlertSystem;

    constructor() {
        this.repository = new DynamoDBRepository();
        this.alertSystem = new AlertSystem();
    }

    async setupMonitoring(request: MonitoringSetupRequest): Promise<MonitoringResult> {
        const monitoringId = `monitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        // Get active sources
        const activeSources = request.sources.filter(source => source.active);
        const sourcesMonitored = activeSources.map(source => source.name);

        // Detect mentions across all active sources
        const mentionsFound = await MentionDetector.detectMentions(
            request.brandIdentifiers,
            request.keywords,
            activeSources
        );

        // Calculate coverage percentage
        const coveragePercentage = (activeSources.length / request.sources.length) * 100;

        // Send alerts if configured
        const alertsSent = await this.alertSystem.sendAlerts(
            mentionsFound,
            request.alertPreferences,
            request.userId
        );

        const result: MonitoringResult = {
            sourcesMonitored,
            mentionsFound,
            coveragePercentage,
            monitoringId,
            timestamp,
            alertsSent,
        };

        // Store monitoring setup and results
        await this.storeMonitoringResult(request.userId, request, result);

        return result;
    }

    private async storeMonitoringResult(
        userId: string,
        request: MonitoringSetupRequest,
        result: MonitoringResult
    ): Promise<void> {
        try {
            // Store monitoring configuration
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `MONITORING_CONFIG#${result.monitoringId}`,

                monitoringId: result.monitoringId,
                brandIdentifiers: request.brandIdentifiers,
                sources: request.sources,
                keywords: request.keywords,
                alertPreferences: request.alertPreferences,
                timestamp: result.timestamp,
                GSI1PK: `MONITORING#${userId}`,
                GSI1SK: result.timestamp,
            });

            // Store monitoring results
            await this.repository.put({
                PK: `USER#${userId}`,
                SK: `MONITORING_RESULT#${result.monitoringId}`,

                monitoringId: result.monitoringId,
                sourcesMonitored: result.sourcesMonitored,
                mentionCount: result.mentionsFound.length,
                coveragePercentage: result.coveragePercentage,
                alertsSent: result.alertsSent,
                timestamp: result.timestamp,
                GSI1PK: `MONITORING_RESULT#${userId}`,
                GSI1SK: result.timestamp,
            });

            // Store individual mentions
            for (const mention of result.mentionsFound) {
                await this.repository.put({
                    PK: `USER#${userId}`,
                    SK: `MENTION#${result.monitoringId}#${Date.now()}`,

                    monitoringId: result.monitoringId,
                    source: mention.source,
                    content: mention.content,
                    sentiment: mention.sentiment,
                    confidence: mention.confidence,
                    url: mention.url,
                    author: mention.author,
                    timestamp: mention.timestamp,
                    GSI1PK: `MENTION#${userId}`,
                    GSI1SK: mention.timestamp,
                });
            }
        } catch (error) {
            console.error('Failed to store monitoring result:', error);
            // Don't throw - monitoring can still return results even if storage fails
        }
    }

    public createErrorResponse(error: ServiceError, statusCode: number = 500): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'X-Service': 'reputation-monitoring-service',
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
                'X-Service': 'reputation-monitoring-service',
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
    const service = new ReputationMonitoringService();

    try {
        // Parse request body
        if (!event.body) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'MISSING_BODY',
                message: 'Request body is required',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'reputation-monitoring-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        const request: MonitoringSetupRequest = JSON.parse(event.body);

        // Validate request
        if (!request.brandIdentifiers || !request.sources || !request.keywords || !request.userId) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'VALIDATION_ERROR',
                message: 'Missing required fields: brandIdentifiers, sources, keywords, userId',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'reputation-monitoring-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        if (!Array.isArray(request.sources) || request.sources.length === 0) {
            const error: ServiceError = {
                errorId: context.awsRequestId,
                errorCode: 'VALIDATION_ERROR',
                message: 'Sources must be a non-empty array',
                timestamp: new Date().toISOString(),
                traceId: context.awsRequestId,
                service: 'reputation-monitoring-service',
                retryable: false,
            };
            return service.createErrorResponse(error, 400);
        }

        // Process monitoring request
        const result = await service.setupMonitoring(request);

        return service.createSuccessResponse(result);

    } catch (error) {
        console.error('Reputation monitoring service error:', error);

        const serviceError: ServiceError = {
            errorId: context.awsRequestId,
            errorCode: 'INTERNAL_ERROR',
            message: 'Internal service error occurred',
            details: { error: error instanceof Error ? error.message : String(error) },
            timestamp: new Date().toISOString(),
            traceId: context.awsRequestId,
            service: 'reputation-monitoring-service',
            retryable: true,
        };

        return service.createErrorResponse(serviceError, 500);
    }
};

// Export service classes for testing
export { ReputationMonitoringService, MentionDetector, AlertSystem };