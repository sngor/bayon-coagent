/**
 * Property-Based Tests for Event Publishing
 * 
 * **Feature: microservices-architecture, Property 20: Event Publishing**
 * **Validates: Requirements 7.1**
 * 
 * Property: For any data change, relevant events should be published to notify interested services
 * 
 * This test verifies that:
 * 1. Events are published when data changes occur
 * 2. Published events contain all required fields
 * 3. Events include trace IDs for correlation
 * 4. Events follow the defined schema structure
 */

import * as fc from 'fast-check';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
    publishEvent,
    publishUserCreatedEvent,
    publishContentPublishedEvent,
    publishAiJobCompletedEvent,
    publishIntegrationSyncCompletedEvent,
    EventSource,
    EventDetailType,
} from '../lambda/utils/eventbridge-client';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

// Mock EventBridge client
jest.mock('@aws-sdk/client-eventbridge');

describe('Property 20: Event Publishing', () => {
    let mockSend: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSend = jest.fn().mockResolvedValue({
            FailedEntryCount: 0,
            Entries: [{ EventId: 'test-event-id' }],
        });
        (EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>).prototype.send = mockSend;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    /**
     * Property: User Created events are published with required fields
     */
    it('should publish User Created events with all required fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    userId: fc.uuid(),
                    email: fc.emailAddress(),
                    createdAt: fc.date().map(d => d.toISOString()),
                    traceId: fc.uuid(), // Always provide trace ID
                }),
                async (userDetail) => {
                    // Clear mock before each iteration
                    mockSend.mockClear();

                    // Publish user created event
                    await publishUserCreatedEvent(userDetail, userDetail.traceId);

                    // Verify event was published
                    expect(mockSend).toHaveBeenCalledTimes(1);

                    const call = mockSend.mock.calls[0][0];
                    expect(call).toBeInstanceOf(PutEventsCommand);

                    const input = call.input;
                    expect(input.Entries).toHaveLength(1);

                    const entry = input.Entries[0];
                    expect(entry.Source).toBe(EventSource.USER);
                    expect(entry.DetailType).toBe(EventDetailType.USER_CREATED);
                    expect(entry.EventBusName).toBeDefined();

                    // Verify detail contains all required fields
                    const detail = JSON.parse(entry.Detail);
                    expect(detail.userId).toBe(userDetail.userId);
                    expect(detail.email).toBe(userDetail.email);
                    expect(detail.createdAt).toBe(userDetail.createdAt);
                    expect(detail.traceId).toBe(userDetail.traceId);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Content Published events are published with required fields
     */
    it('should publish Content Published events with all required fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    contentId: fc.uuid(),
                    userId: fc.uuid(),
                    contentType: fc.constantFrom('blog-post', 'social-media', 'listing-description', 'market-update'),
                    platform: fc.constantFrom('facebook', 'instagram', 'linkedin', 'twitter', 'website'),
                    publishedAt: fc.date().map(d => d.toISOString()),
                    traceId: fc.uuid(), // Always provide trace ID
                }),
                async (contentDetail) => {
                    // Clear mock before each iteration
                    mockSend.mockClear();

                    // Publish content published event
                    await publishContentPublishedEvent(contentDetail, contentDetail.traceId);

                    // Verify event was published
                    expect(mockSend).toHaveBeenCalledTimes(1);

                    const call = mockSend.mock.calls[0][0];
                    const input = call.input;
                    const entry = input.Entries[0];

                    expect(entry.Source).toBe(EventSource.CONTENT);
                    expect(entry.DetailType).toBe(EventDetailType.CONTENT_PUBLISHED);

                    // Verify detail contains all required fields
                    const detail = JSON.parse(entry.Detail);
                    expect(detail.contentId).toBe(contentDetail.contentId);
                    expect(detail.userId).toBe(contentDetail.userId);
                    expect(detail.contentType).toBe(contentDetail.contentType);
                    expect(detail.platform).toBe(contentDetail.platform);
                    expect(detail.publishedAt).toBe(contentDetail.publishedAt);
                    expect(detail.traceId).toBe(contentDetail.traceId);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: AI Job Completed events are published with required fields
     */
    it('should publish AI Job Completed events with all required fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    jobId: fc.uuid(),
                    userId: fc.uuid(),
                    jobType: fc.constantFrom('blog-post', 'social-media', 'listing-description', 'market-update'),
                    status: fc.constantFrom('completed', 'failed'),
                    completedAt: fc.date().map(d => d.toISOString()),
                    error: fc.option(fc.string(), { nil: undefined }),
                    traceId: fc.uuid(), // Always provide trace ID
                }),
                async (jobDetail) => {
                    // Clear mock before each iteration
                    mockSend.mockClear();

                    // Publish AI job completed event
                    await publishAiJobCompletedEvent(jobDetail, jobDetail.traceId);

                    // Verify event was published
                    expect(mockSend).toHaveBeenCalledTimes(1);

                    const call = mockSend.mock.calls[0][0];
                    const input = call.input;
                    const entry = input.Entries[0];

                    expect(entry.Source).toBe(EventSource.AI);
                    expect(entry.DetailType).toBe(
                        jobDetail.status === 'completed'
                            ? EventDetailType.AI_JOB_COMPLETED
                            : EventDetailType.AI_JOB_FAILED
                    );

                    // Verify detail contains all required fields
                    const detail = JSON.parse(entry.Detail);
                    expect(detail.jobId).toBe(jobDetail.jobId);
                    expect(detail.userId).toBe(jobDetail.userId);
                    expect(detail.jobType).toBe(jobDetail.jobType);
                    expect(detail.status).toBe(jobDetail.status);
                    expect(detail.completedAt).toBe(jobDetail.completedAt);
                    expect(detail.traceId).toBe(jobDetail.traceId);

                    if (jobDetail.error) {
                        expect(detail.error).toBe(jobDetail.error);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Integration Sync Completed events are published with required fields
     */
    it('should publish Integration Sync Completed events with all required fields', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    syncId: fc.uuid(),
                    userId: fc.uuid(),
                    provider: fc.constantFrom('google', 'facebook', 'instagram', 'linkedin', 'twitter', 'mls'),
                    status: fc.constantFrom('completed', 'failed'),
                    itemsSynced: fc.option(fc.nat(1000), { nil: undefined }),
                    completedAt: fc.date().map(d => d.toISOString()),
                    error: fc.option(fc.string(), { nil: undefined }),
                    traceId: fc.uuid(), // Always provide trace ID
                }),
                async (syncDetail) => {
                    // Clear mock before each iteration
                    mockSend.mockClear();

                    // Publish integration sync completed event
                    await publishIntegrationSyncCompletedEvent(syncDetail, syncDetail.traceId);

                    // Verify event was published
                    expect(mockSend).toHaveBeenCalledTimes(1);

                    const call = mockSend.mock.calls[0][0];
                    const input = call.input;
                    const entry = input.Entries[0];

                    expect(entry.Source).toBe(EventSource.INTEGRATION);
                    expect(entry.DetailType).toBe(
                        syncDetail.status === 'completed'
                            ? EventDetailType.INTEGRATION_SYNC_COMPLETED
                            : EventDetailType.INTEGRATION_SYNC_FAILED
                    );

                    // Verify detail contains all required fields
                    const detail = JSON.parse(entry.Detail);
                    expect(detail.syncId).toBe(syncDetail.syncId);
                    expect(detail.userId).toBe(syncDetail.userId);
                    expect(detail.provider).toBe(syncDetail.provider);
                    expect(detail.status).toBe(syncDetail.status);
                    expect(detail.completedAt).toBe(syncDetail.completedAt);
                    expect(detail.traceId).toBe(syncDetail.traceId);

                    if (syncDetail.itemsSynced !== undefined) {
                        expect(detail.itemsSynced).toBe(syncDetail.itemsSynced);
                    }

                    if (syncDetail.error) {
                        expect(detail.error).toBe(syncDetail.error);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Events include trace IDs when available for correlation
     */
    it('should include trace IDs in published events when provided', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    source: fc.constantFrom(
                        EventSource.USER,
                        EventSource.CONTENT,
                        EventSource.AI,
                        EventSource.INTEGRATION
                    ),
                    detailType: fc.constantFrom(
                        EventDetailType.USER_CREATED,
                        EventDetailType.CONTENT_PUBLISHED,
                        EventDetailType.AI_JOB_COMPLETED,
                        EventDetailType.INTEGRATION_SYNC_COMPLETED
                    ),
                    detail: fc.record({
                        id: fc.uuid(),
                        timestamp: fc.date().map(d => d.toISOString()),
                    }),
                    traceId: fc.uuid(), // Always provide a trace ID for this test
                }),
                async (eventData) => {
                    // Clear mock before each iteration
                    mockSend.mockClear();

                    // Publish event with trace ID
                    await publishEvent(
                        eventData.source,
                        eventData.detailType,
                        eventData.detail,
                        eventData.traceId
                    );

                    // Verify event was published with the provided trace ID
                    expect(mockSend).toHaveBeenCalledTimes(1);

                    const call = mockSend.mock.calls[0][0];
                    const input = call.input;
                    const entry = input.Entries[0];

                    const detail = JSON.parse(entry.Detail);
                    expect(detail.traceId).toBe(eventData.traceId);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Event publishing failures don't throw errors (graceful degradation)
     */
    it('should handle event publishing failures gracefully without throwing', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    userId: fc.uuid(),
                    email: fc.emailAddress(),
                    createdAt: fc.date().map(d => d.toISOString()),
                }),
                async (userDetail) => {
                    // Clear mock before each iteration
                    mockSend.mockClear();

                    // Mock EventBridge failure
                    mockSend.mockResolvedValueOnce({
                        FailedEntryCount: 1,
                        Entries: [
                            {
                                ErrorCode: 'InternalFailure',
                                ErrorMessage: 'Internal service error',
                            },
                        ],
                    });

                    // Publishing should not throw even on failure
                    await expect(publishUserCreatedEvent(userDetail)).resolves.not.toThrow();

                    // Verify attempt was made
                    expect(mockSend).toHaveBeenCalledTimes(1);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Events are published to the correct event bus
     */
    it('should publish events to the configured event bus', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    userId: fc.uuid(),
                    email: fc.emailAddress(),
                    createdAt: fc.date().map(d => d.toISOString()),
                }),
                async (userDetail) => {
                    // Clear mock before each iteration
                    mockSend.mockClear();

                    // Publish event
                    await publishUserCreatedEvent(userDetail);

                    // Verify event was published to an event bus
                    expect(mockSend).toHaveBeenCalledTimes(1);

                    const call = mockSend.mock.calls[0][0];
                    const input = call.input;
                    const entry = input.Entries[0];

                    // Verify event bus name is defined and follows expected pattern
                    expect(entry.EventBusName).toBeDefined();
                    expect(typeof entry.EventBusName).toBe('string');
                    expect(entry.EventBusName).toMatch(/bayon-coagent-events/);
                }
            ),
            { numRuns: 50 }
        );
    });
});
