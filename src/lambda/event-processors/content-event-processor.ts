/**
 * Content Event Processor
 * 
 * Handles events related to content generation and management
 */

import { EventBridgeEvent, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '@/aws/config';

interface ContentGeneratedEvent {
    userId: string;
    contentId: string;
    contentType: 'blog-post' | 'social-media' | 'listing-description' | 'market-update' | 'video-script' | 'neighborhood-guide';
    title: string;
    content: string;
    metadata: {
        generationTime: number;
        tokensUsed: number;
        model: string;
        prompt: string;
    };
    timestamp: string;
}

interface ContentPublishedEvent {
    userId: string;
    contentId: string;
    contentType: string;
    publishedTo: string[];
    scheduledFor?: string;
    timestamp: string;
}

const config = getConfig();
const eventBridge = new EventBridgeClient({ region: config.region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

export const handler = async (
    event: EventBridgeEvent<string, ContentGeneratedEvent | ContentPublishedEvent>,
    context: Context
) => {
    console.log('Processing content event:', JSON.stringify(event, null, 2));

    try {
        switch (event['detail-type']) {
            case 'Content Generated':
                await handleContentGenerated(event.detail as ContentGeneratedEvent);
                break;

            case 'Content Published':
                await handleContentPublished(event.detail as ContentPublishedEvent);
                break;

            default:
                console.warn('Unknown event type:', event['detail-type']);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Event processed successfully' })
        };

    } catch (error) {
        console.error('Error processing content event:', error);

        // Send to DLQ for retry
        await sendToDLQ(event, error);

        throw error;
    }
};

async function handleContentGenerated(detail: ContentGeneratedEvent) {
    console.log('Handling content generated event for:', detail.contentId);

    // 1. Save content to library
    await saveContentToLibrary(detail);

    // 2. Update user analytics
    await updateUserAnalytics(detail);

    // 3. Trigger content optimization suggestions
    await triggerContentOptimization(detail);

    // 4. Send real-time notification to user
    await sendRealtimeNotification(detail);

    // 5. Publish follow-up events
    await publishFollowUpEvents(detail);
}

async function handleContentPublished(detail: ContentPublishedEvent) {
    console.log('Handling content published event for:', detail.contentId);

    // 1. Update content status
    await updateContentStatus(detail);

    // 2. Track publishing analytics
    await trackPublishingAnalytics(detail);

    // 3. Schedule follow-up actions
    await scheduleFollowUpActions(detail);
}

async function saveContentToLibrary(detail: ContentGeneratedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `CONTENT#${detail.contentId}`,
            GSI1PK: `CONTENT#${detail.contentType}`,
            GSI1SK: `DATE#${detail.timestamp}`,
            EntityType: 'Content',
            UserId: detail.userId,
            ContentId: detail.contentId,
            ContentType: detail.contentType,
            Title: detail.title,
            Content: detail.content,
            Status: 'generated',
            Metadata: detail.metadata,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Content saved to library:', detail.contentId);
}

async function updateUserAnalytics(detail: ContentGeneratedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `ANALYTICS#${today}`
        },
        UpdateExpression: `
      ADD 
        ContentGenerated :inc,
        TokensUsed :tokens,
        GenerationTime :time
      SET 
        #contentType = if_not_exists(#contentType, :zero) + :inc,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#contentType': `${detail.contentType}Count`
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':tokens': detail.metadata.tokensUsed,
            ':time': detail.metadata.generationTime,
            ':zero': 0,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
    console.log('User analytics updated for:', detail.userId);
}

async function triggerContentOptimization(detail: ContentGeneratedEvent) {
    // Publish event for content optimization service
    const optimizationEvent = {
        Source: 'bayon.coagent.content',
        DetailType: 'Content Optimization Requested',
        Detail: JSON.stringify({
            userId: detail.userId,
            contentId: detail.contentId,
            contentType: detail.contentType,
            content: detail.content,
            metadata: detail.metadata
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [optimizationEvent]
    }));

    console.log('Content optimization event published for:', detail.contentId);
}

async function sendRealtimeNotification(detail: ContentGeneratedEvent) {
    // Publish event for real-time notification service
    const notificationEvent = {
        Source: 'bayon.coagent.content',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'content_generated',
            message: `Your ${detail.contentType.replace('-', ' ')} "${detail.title}" has been generated successfully!`,
            data: {
                contentId: detail.contentId,
                contentType: detail.contentType,
                title: detail.title
            },
            timestamp: detail.timestamp
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [notificationEvent]
    }));

    console.log('Real-time notification sent for:', detail.contentId);
}

async function publishFollowUpEvents(detail: ContentGeneratedEvent) {
    const events = [];

    // Trigger SEO analysis for blog posts
    if (detail.contentType === 'blog-post') {
        events.push({
            Source: 'bayon.coagent.content',
            DetailType: 'SEO Analysis Requested',
            Detail: JSON.stringify({
                userId: detail.userId,
                contentId: detail.contentId,
                content: detail.content,
                title: detail.title
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        });
    }

    // Trigger social media scheduling for social content
    if (detail.contentType === 'social-media') {
        events.push({
            Source: 'bayon.coagent.content',
            DetailType: 'Social Media Scheduling Requested',
            Detail: JSON.stringify({
                userId: detail.userId,
                contentId: detail.contentId,
                content: detail.content,
                platforms: ['facebook', 'instagram', 'linkedin'] // Default platforms
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        });
    }

    if (events.length > 0) {
        await eventBridge.send(new PutEventsCommand({
            Entries: events
        }));
        console.log(`Published ${events.length} follow-up events for:`, detail.contentId);
    }
}

async function updateContentStatus(detail: ContentPublishedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `CONTENT#${detail.contentId}`
        },
        UpdateExpression: `
      SET 
        #status = :status,
        PublishedTo = :publishedTo,
        PublishedAt = :publishedAt,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#status': 'Status'
        },
        ExpressionAttributeValues: {
            ':status': 'published',
            ':publishedTo': detail.publishedTo,
            ':publishedAt': detail.timestamp,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
    console.log('Content status updated to published:', detail.contentId);
}

async function trackPublishingAnalytics(detail: ContentPublishedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `ANALYTICS#${today}`
        },
        UpdateExpression: `
      ADD ContentPublished :inc
      SET UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':inc': 1,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
    console.log('Publishing analytics tracked for:', detail.userId);
}

async function scheduleFollowUpActions(detail: ContentPublishedEvent) {
    // Schedule performance tracking after 24 hours
    const followUpEvent = {
        Source: 'bayon.coagent.content',
        DetailType: 'Content Performance Tracking Scheduled',
        Detail: JSON.stringify({
            userId: detail.userId,
            contentId: detail.contentId,
            publishedTo: detail.publishedTo,
            trackAfter: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [followUpEvent]
    }));

    console.log('Performance tracking scheduled for:', detail.contentId);
}

async function sendToDLQ(event: any, error: any) {
    // In a real implementation, you would send failed events to SQS DLQ
    console.error('Sending event to DLQ:', {
        event: event,
        error: error.message,
        timestamp: new Date().toISOString()
    });
}