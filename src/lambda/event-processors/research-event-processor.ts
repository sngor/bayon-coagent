/**
 * Research Event Processor
 * 
 * Handles events related to research queries and report generation
 */

import { EventBridgeEvent, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '@/aws/config';

interface ResearchQueryCompletedEvent {
    userId: string;
    queryId: string;
    query: string;
    results: any;
    sources: string[];
    timestamp: string;
}

interface ReportGeneratedEvent {
    userId: string;
    reportId: string;
    reportType: string;
    reportData: any;
    timestamp: string;
}

interface KnowledgeUpdatedEvent {
    userId: string;
    knowledgeId: string;
    updateType: 'added' | 'updated' | 'deleted';
    knowledgeData: any;
    timestamp: string;
}

const config = getConfig();
const eventBridge = new EventBridgeClient({ region: config.region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

export const handler = async (
    event: EventBridgeEvent<string, ResearchQueryCompletedEvent | ReportGeneratedEvent | KnowledgeUpdatedEvent>,
    _context: Context
) => {
    console.log('Processing research event:', JSON.stringify(event, null, 2));

    try {
        switch (event['detail-type']) {
            case 'Research Query Completed':
                await handleResearchQueryCompleted(event.detail as ResearchQueryCompletedEvent);
                break;

            case 'Report Generated':
                await handleReportGenerated(event.detail as ReportGeneratedEvent);
                break;

            case 'Knowledge Updated':
                await handleKnowledgeUpdated(event.detail as KnowledgeUpdatedEvent);
                break;

            default:
                console.warn('Unknown research event type:', event['detail-type']);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Research event processed successfully' })
        };

    } catch (error) {
        console.error('Error processing research event:', error);
        throw error;
    }
};

async function handleResearchQueryCompleted(detail: ResearchQueryCompletedEvent) {
    console.log('Handling research query completed for:', detail.queryId);

    // 1. Save research results to knowledge base
    await saveResearchResults(detail);

    // 2. Update user research analytics
    await updateResearchAnalytics(detail);

    // 3. Generate follow-up research suggestions
    await generateFollowUpSuggestions(detail);

    // 4. Send real-time notification
    await sendResearchCompletedNotification(detail);

    // 5. Trigger content generation if applicable
    await triggerContentGeneration(detail);
}

async function handleReportGenerated(detail: ReportGeneratedEvent) {
    console.log('Handling report generated:', detail.reportId);

    // 1. Save report to library
    await saveReportToLibrary(detail);

    // 2. Update report analytics
    await updateReportAnalytics(detail);

    // 3. Send notification
    await sendReportGeneratedNotification(detail);

    // 4. Schedule report sharing if configured
    await scheduleReportSharing(detail);
}

async function handleKnowledgeUpdated(detail: KnowledgeUpdatedEvent) {
    console.log('Handling knowledge updated:', detail.knowledgeId);

    // 1. Update knowledge base index
    await updateKnowledgeIndex(detail);

    // 2. Trigger related content refresh
    await triggerRelatedContentRefresh(detail);

    // 3. Update user knowledge metrics
    await updateKnowledgeMetrics(detail);
}

async function saveResearchResults(detail: ResearchQueryCompletedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `RESEARCH#${detail.queryId}`,
            GSI1PK: `RESEARCH#${detail.userId}`,
            GSI1SK: `DATE#${detail.timestamp}`,
            EntityType: 'ResearchQuery',
            UserId: detail.userId,
            QueryId: detail.queryId,
            Query: detail.query,
            Results: detail.results,
            Sources: detail.sources,
            SourceCount: detail.sources.length,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Research results saved:', detail.queryId);
}

async function updateResearchAnalytics(detail: ResearchQueryCompletedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `ANALYTICS#${today}`
        },
        UpdateExpression: `
      ADD 
        ResearchQueries :inc,
        SourcesAnalyzed :sources
      SET 
        LastResearchAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':inc': 1,
            ':sources': detail.sources.length,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
    console.log('Research analytics updated for user:', detail.userId);
}

async function generateFollowUpSuggestions(detail: ResearchQueryCompletedEvent) {
    // Analyze research results to suggest follow-up queries
    const suggestions = [];

    // Extract key topics from results for follow-up suggestions
    if (detail.results.keyTopics) {
        detail.results.keyTopics.forEach((topic: string) => {
            suggestions.push(`Learn more about ${topic} in your market`);
        });
    }

    if (suggestions.length > 0) {
        const suggestionEvent = {
            Source: 'bayon.coagent.research',
            DetailType: 'Research Suggestions Generated',
            Detail: JSON.stringify({
                userId: detail.userId,
                originalQuery: detail.query,
                suggestions,
                timestamp: new Date().toISOString()
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        };

        await eventBridge.send(new PutEventsCommand({
            Entries: [suggestionEvent]
        }));
    }
}

async function sendResearchCompletedNotification(detail: ResearchQueryCompletedEvent) {
    const notificationEvent = {
        Source: 'bayon.coagent.research',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'research_completed',
            message: `Research completed for: "${detail.query}"`,
            data: {
                queryId: detail.queryId,
                query: detail.query,
                sourceCount: detail.sources.length,
                timestamp: detail.timestamp
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [notificationEvent]
    }));
}

async function triggerContentGeneration(detail: ResearchQueryCompletedEvent) {
    // If research results are comprehensive, suggest content creation
    if (detail.sources.length >= 3) {
        const contentEvent = {
            Source: 'bayon.coagent.research',
            DetailType: 'Content Generation Suggested',
            Detail: JSON.stringify({
                userId: detail.userId,
                suggestedContentType: 'blog-post',
                topic: detail.query,
                researchData: detail.results,
                sources: detail.sources
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        };

        await eventBridge.send(new PutEventsCommand({
            Entries: [contentEvent]
        }));
    }
}

async function saveReportToLibrary(detail: ReportGeneratedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `REPORT#${detail.reportId}`,
            GSI1PK: `REPORT#${detail.reportType}`,
            GSI1SK: `DATE#${detail.timestamp}`,
            EntityType: 'Report',
            UserId: detail.userId,
            ReportId: detail.reportId,
            ReportType: detail.reportType,
            ReportData: detail.reportData,
            GeneratedAt: detail.timestamp,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Report saved to library:', detail.reportId);
}

async function updateReportAnalytics(detail: ReportGeneratedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `ANALYTICS#${today}`
        },
        UpdateExpression: `
      ADD ReportsGenerated :inc
      SET 
        #reportType = if_not_exists(#reportType, :zero) + :inc,
        LastReportAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#reportType': `${detail.reportType}Count`
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':zero': 0,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function sendReportGeneratedNotification(detail: ReportGeneratedEvent) {
    const notificationEvent = {
        Source: 'bayon.coagent.research',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'report_generated',
            message: `${detail.reportType} report has been generated successfully!`,
            data: {
                reportId: detail.reportId,
                reportType: detail.reportType,
                timestamp: detail.timestamp
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [notificationEvent]
    }));
}

async function scheduleReportSharing(detail: ReportGeneratedEvent) {
    // Check if user has auto-sharing configured
    const userPrefs = await getUserPreferences(detail.userId);

    if (userPrefs?.autoShareReports) {
        const sharingEvent = {
            Source: 'bayon.coagent.research',
            DetailType: 'Report Sharing Scheduled',
            Detail: JSON.stringify({
                userId: detail.userId,
                reportId: detail.reportId,
                shareChannels: userPrefs.shareChannels || ['email'],
                scheduleTime: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes delay
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        };

        await eventBridge.send(new PutEventsCommand({
            Entries: [sharingEvent]
        }));
    }
}

async function updateKnowledgeIndex(detail: KnowledgeUpdatedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `KNOWLEDGE#${detail.knowledgeId}`
        },
        UpdateExpression: `
      SET 
        KnowledgeData = :data,
        UpdateType = :updateType,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':data': detail.knowledgeData,
            ':updateType': detail.updateType,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function triggerRelatedContentRefresh(detail: KnowledgeUpdatedEvent) {
    // Find content related to this knowledge update
    const refreshEvent = {
        Source: 'bayon.coagent.research',
        DetailType: 'Content Refresh Requested',
        Detail: JSON.stringify({
            userId: detail.userId,
            knowledgeId: detail.knowledgeId,
            updateType: detail.updateType,
            timestamp: new Date().toISOString()
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [refreshEvent]
    }));
}

async function updateKnowledgeMetrics(detail: KnowledgeUpdatedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `ANALYTICS#${today}`
        },
        UpdateExpression: `
      ADD KnowledgeUpdates :inc
      SET UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':inc': 1,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function getUserPreferences(userId: string): Promise<any> {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${userId}`,
            SK: 'PREFERENCES'
        }
    };

    try {
        const result = await dynamoClient.send(new QueryCommand(params));
        return result.Items?.[0] || null;
    } catch (error) {
        console.error('Error getting user preferences:', error);
        return null;
    }
}