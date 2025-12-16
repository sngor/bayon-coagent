/**
 * EventBridge Client Utility
 * 
 * Provides utilities for publishing events to the custom EventBridge event bus
 * with proper trace ID correlation and error handling.
 */

import { EventBridgeClient, PutEventsCommand, PutEventsCommandInput } from '@aws-sdk/client-eventbridge';
import * as AWSXRay from 'aws-xray-sdk-core';

// Initialize EventBridge client with X-Ray tracing (if available)
let eventBridgeClient: EventBridgeClient;
try {
    if (AWSXRay && typeof AWSXRay.captureAWSv3Client === 'function') {
        eventBridgeClient = AWSXRay.captureAWSv3Client(new EventBridgeClient({
            region: process.env.AWS_REGION || 'us-east-1',
        }));
    } else {
        eventBridgeClient = new EventBridgeClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }
} catch (error) {
    // Fallback for testing or when X-Ray is not available
    eventBridgeClient = new EventBridgeClient({
        region: process.env.AWS_REGION || 'us-east-1',
    });
}

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || `bayon-coagent-events-${process.env.NODE_ENV || process.env.JEST_WORKER_ID ? 'test' : 'development'}`;

/**
 * Event detail types
 */
export enum EventDetailType {
    USER_CREATED = 'User Created',
    CONTENT_PUBLISHED = 'Content Published',
    AI_JOB_COMPLETED = 'AI Job Completed',
    AI_JOB_FAILED = 'AI Job Failed',
    INTEGRATION_SYNC_COMPLETED = 'Integration Sync Completed',
    INTEGRATION_SYNC_FAILED = 'Integration Sync Failed',
}

/**
 * Event sources
 */
export enum EventSource {
    USER = 'bayon.coagent.user',
    CONTENT = 'bayon.coagent.content',
    AI = 'bayon.coagent.ai',
    INTEGRATION = 'bayon.coagent.integration',
    NOTIFICATION = 'bayon.coagent.notification',
    ALERT = 'bayon.coagent.alert',
    AUDIT = 'bayon.coagent.audit',
    CONFIGURATION = 'bayon.coagent.configuration',
    HEALTH = 'bayon.coagent.health',
}

/**
 * Base event detail interface
 */
interface BaseEventDetail {
    traceId?: string;
    [key: string]: any;
}

/**
 * User Created Event Detail
 */
export interface UserCreatedEventDetail extends BaseEventDetail {
    userId: string;
    email: string;
    createdAt: string;
}

/**
 * Content Published Event Detail
 */
export interface ContentPublishedEventDetail extends BaseEventDetail {
    contentId: string;
    userId: string;
    contentType: string;
    platform: string;
    publishedAt: string;
}

/**
 * AI Job Completed Event Detail
 */
export interface AiJobCompletedEventDetail extends BaseEventDetail {
    jobId: string;
    userId: string;
    jobType: string;
    status: 'completed' | 'failed';
    completedAt: string;
    error?: string;
}

/**
 * Integration Sync Completed Event Detail
 */
export interface IntegrationSyncCompletedEventDetail extends BaseEventDetail {
    syncId: string;
    userId: string;
    provider: string;
    status: 'completed' | 'failed';
    itemsSynced?: number;
    completedAt: string;
    error?: string;
}

/**
 * Publish an event to EventBridge
 * 
 * @param source - Event source (e.g., bayon.coagent.user)
 * @param detailType - Event detail type (e.g., User Created)
 * @param detail - Event detail object
 * @param traceId - Optional X-Ray trace ID for correlation
 * @returns Promise<void>
 */
export async function publishEvent(
    source: EventSource,
    detailType: EventDetailType,
    detail: BaseEventDetail,
    traceId?: string
): Promise<void> {
    try {
        // Add trace ID to detail if provided
        const eventDetail = {
            ...detail,
            traceId: traceId || detail.traceId || process.env._X_AMZN_TRACE_ID,
        };

        const params: PutEventsCommandInput = {
            Entries: [
                {
                    Source: source,
                    DetailType: detailType,
                    Detail: JSON.stringify(eventDetail),
                    EventBusName: EVENT_BUS_NAME,
                    Time: new Date(),
                },
            ],
        };

        const command = new PutEventsCommand(params);
        const response = await eventBridgeClient.send(command);

        // Check for failed entries
        if (response.FailedEntryCount && response.FailedEntryCount > 0) {
            const failedEntry = response.Entries?.[0];
            throw new Error(
                `Failed to publish event: ${failedEntry?.ErrorCode} - ${failedEntry?.ErrorMessage}`
            );
        }

        console.log(`Event published successfully: ${source} - ${detailType}`, {
            eventId: response.Entries?.[0]?.EventId,
            traceId: eventDetail.traceId,
        });
    } catch (error) {
        console.error('Error publishing event to EventBridge:', error);
        // Don't throw - we don't want event publishing failures to break the main flow
        // Log the error and continue
    }
}

/**
 * Publish a User Created event
 */
export async function publishUserCreatedEvent(
    detail: UserCreatedEventDetail,
    traceId?: string
): Promise<void> {
    await publishEvent(EventSource.USER, EventDetailType.USER_CREATED, detail, traceId);
}

/**
 * Publish a Content Published event
 */
export async function publishContentPublishedEvent(
    detail: ContentPublishedEventDetail,
    traceId?: string
): Promise<void> {
    await publishEvent(EventSource.CONTENT, EventDetailType.CONTENT_PUBLISHED, detail, traceId);
}

/**
 * Publish an AI Job Completed event
 */
export async function publishAiJobCompletedEvent(
    detail: AiJobCompletedEventDetail,
    traceId?: string
): Promise<void> {
    const detailType = detail.status === 'completed'
        ? EventDetailType.AI_JOB_COMPLETED
        : EventDetailType.AI_JOB_FAILED;

    await publishEvent(EventSource.AI, detailType, detail, traceId);
}

/**
 * Publish an Integration Sync Completed event
 */
export async function publishIntegrationSyncCompletedEvent(
    detail: IntegrationSyncCompletedEventDetail,
    traceId?: string
): Promise<void> {
    const detailType = detail.status === 'completed'
        ? EventDetailType.INTEGRATION_SYNC_COMPLETED
        : EventDetailType.INTEGRATION_SYNC_FAILED;

    await publishEvent(EventSource.INTEGRATION, detailType, detail, traceId);
}

/**
 * Batch publish multiple events
 * 
 * @param events - Array of events to publish
 * @returns Promise<void>
 */
export async function publishEventsBatch(
    events: Array<{
        source: EventSource;
        detailType: EventDetailType;
        detail: BaseEventDetail;
    }>
): Promise<void> {
    try {
        const entries = events.map((event) => ({
            Source: event.source,
            DetailType: event.detailType,
            Detail: JSON.stringify({
                ...event.detail,
                traceId: event.detail.traceId || process.env._X_AMZN_TRACE_ID,
            }),
            EventBusName: EVENT_BUS_NAME,
            Time: new Date(),
        }));

        const params: PutEventsCommandInput = {
            Entries: entries,
        };

        const command = new PutEventsCommand(params);
        const response = await eventBridgeClient.send(command);

        // Check for failed entries
        if (response.FailedEntryCount && response.FailedEntryCount > 0) {
            console.error('Some events failed to publish:', response.Entries);
        } else {
            console.log(`Batch of ${events.length} events published successfully`);
        }
    } catch (error) {
        console.error('Error publishing batch events to EventBridge:', error);
        // Don't throw - we don't want event publishing failures to break the main flow
    }
}
