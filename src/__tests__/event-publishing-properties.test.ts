/**
 * Property-Based Tests for Event Publishing
 * 
 * **Feature: microservices-architecture, Property 20: Event Publishing**
 * **Validates: Requirements 7.1**
 * 
 * Property: For any data change, relevant events should be published to notify interested services
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import {
    publishEvent,
    publishUserCreatedEvent,
    publishContentPublishedEvent,
    publishAiJobCompletedEvent,
    publishIntegrationSyncCompletedEvent,
    EventSource,
    EventDetailType,
} from '../lambda/utils/eventbridge-client';

// Mock the EventBridge client
jest.mock('@aws-sdk/client-eventbridge');

describe('Property 20: Event Publishing', () => {
    let mockSend: jest.Mock;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock successful EventBridge response
        mockSend = jest.fn().mockResolvedValue({
            FailedEntryCount: 0,
            Entries: [{ EventId: 'test-event-id' }],
        });

        (EventBridgeClient as jest.MockedClass<typeof EventBridgeClient>).prototype.send = mockSend;
    });

    /**
     * Property: User creation events should be published
     */
    it(
        'should publish user.created events for any user creation',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: fc.uuid(),
                        email: fc.emailAddress(),
                        createdAt: fc.date().map(d => d.toISOString()),
                    }),
                    async (userDetail) => {
                        // Publish user created event
                        await publishUserCreatedEvent(userDetail);

                        // Verify EventBridge was called
                        expect(mockSend).toHaveBeenCalledTimes(1);

                        // Verify the event structure
                        const call = mockSend.mock.calls[0][0];
                        expect(call).toBeInstanceOf(PutEventsCommand);

                        const input = call.input;
                        expect(input.Entries).toHaveLength(1);

                        const entry = input.Entries[0];
                        expect(entry.Source).toBe(EventSource.USER);
                        expect(entry.DetailType).toBe(EventDetailType.USER_CREATED);

                        const detail = JSON.parse(entry.Detail);
                        expect(detail.userId).toBe(userDetail.userId);
                        expect(detail.email).toBe(userDetail.email);
                        expect(detail.createdAt).toBe(userDetail.createdAt);
                        expect(detail.traceId).toBeDefined();
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    /**
     * Property: Content publishing events should be published
     */
    it(
        'should publish content.published events for any content publication',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        contentId: fc.uuid(),
                        userId: fc.uuid(),
                        contentType: fc.constantFrom('blog-post', 'social-media', 'listing-description', 'market-update'),
                        platform: fc.constantFrom('facebook', 'instagram', 'linkedin', 'twitter', 'website'),
                        publishedAt: fc.date().map(d => d.toISOString()),
                    }),
                    async (contentDetail) => {
                        // Publish content published event
                        await publishContentPublishedEvent(contentDetail);

                        // Verify EventBridge was called
                        expect(mockSend).toHaveBeenCalledTimes(1);

                        // Verify the event structure
                        const call = mockSend.mock.calls[0][0];
                        const input = call.input;
                        const entry = input.Entries[0];

                        expect(entry.Source).toBe(EventSource.CONTENT);
                        expect(entry.DetailType).toBe(EventDetailType.CONTENT_PUBLISHED);

                        const detail = JSON.parse(entry.Detail);
                        expect(detail.contentId).toBe(contentDetail.contentId);
                        expect(detail.userId).toBe(contentDetail.userId);
                        expect(detail.contentType).toBe(contentDetail.contentType);
                        expect(detail.platform).toBe(contentDetail.platform);
                        expect(detail.publishedAt).toBe(contentDetail.publishedAt);
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    /**
     * Property: AI job completion events should be published
     */
    it(
        'should publish ai.job.completed events for any AI job completion',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        jobId: fc.uuid(),
                        userId: fc.uuid(),
                        jobType: fc.constantFrom('blog-post', 'social-media', 'listing-description', 'market-update'),
                        status: fc.constantFrom('completed', 'failed') as fc.Arbitrary<'completed' | 'failed'>,
                        completedAt: fc.date().map(d => d.toISOString()),
                    }),
                    async (jobDetail) => {
                        // Publish AI job completed event
                        await publishAiJobCompletedEvent(jobDetail);

                        // Verify EventBridge was called
                        expect(mockSend).toHaveBeenCalledTimes(1);

                        // Verify the event structure
                        const call = mockSend.mock.calls[0][0];
                        const input = call.input;
                        const entry = input.Entries[0];

                        expect(entry.Source).toBe(EventSource.AI);
                        expect([EventDetailType.AI_JOB_COMPLETED, EventDetailType.AI_JOB_FAILED]).toContain(entry.DetailType);

                        const detail = JSON.parse(entry.Detail);
                        expect(detail.jobId).toBe(jobDetail.jobId);
                        expect(detail.userId).toBe(jobDetail.userId);
                        expect(detail.jobType).toBe(jobDetail.jobType);
                        expect(detail.status).toBe(jobDetail.status);
                        expect(detail.completedAt).toBe(jobDetail.completedAt);
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    /**
     * Property: Integration sync completion events should be published
     */
    it(
        'should publish integration.sync.completed events for any integration sync',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        syncId: fc.uuid(),
                        userId: fc.uuid(),
                        provider: fc.constantFrom('mlsgrid', 'bridgeInteractive', 'facebook', 'instagram', 'linkedin', 'twitter'),
                        status: fc.constantFrom('completed', 'failed') as fc.Arbitrary<'completed' | 'failed'>,
                        itemsSynced: fc.integer({ min: 0, max: 1000 }),
                        completedAt: fc.date().map(d => d.toISOString()),
                    }),
                    async (syncDetail) => {
                        // Publish integration sync completed event
                        await publishIntegrationSyncCompletedEvent(syncDetail);

                        // Verify EventBridge was called
                        expect(mockSend).toHaveBeenCalledTimes(1);

                        // Verify the event structure
                        const call = mockSend.mock.calls[0][0];
                        const input = call.input;
                        const entry = input.Entries[0];

                        expect(entry.Source).toBe(EventSource.INTEGRATION);
                        expect([EventDetailType.INTEGRATION_SYNC_COMPLETED, EventDetailType.INTEGRATION_SYNC_FAILED]).toContain(
                            entry.DetailType
                        );

                        const detail = JSON.parse(entry.Detail);
                        expect(detail.syncId).toBe(syncDetail.syncId);
                        expect(detail.userId).toBe(syncDetail.userId);
                        expect(detail.provider).toBe(syncDetail.provider);
                        expect(detail.status).toBe(syncDetail.status);
                        expect(detail.completedAt).toBe(syncDetail.completedAt);
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    /**
     * Property: Events should include trace IDs for correlation
     */
    it(
        'should include trace IDs in all published events',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: fc.uuid(),
                        email: fc.emailAddress(),
                        createdAt: fc.date().map(d => d.toISOString()),
                    }),
                    fc.option(fc.uuid(), { nil: undefined }),
                    async (userDetail, traceId) => {
                        // Clear previous calls
                        mockSend.mockClear();

                        // Publish event with optional trace ID
                        await publishUserCreatedEvent(userDetail, traceId);

                        // Verify the event includes a trace ID
                        const call = mockSend.mock.calls[0][0];
                        const input = call.input;
                        const entry = input.Entries[0];
                        const detail = JSON.parse(entry.Detail);

                        // Should have a trace ID (either provided or from environment)
                        expect(detail.traceId).toBeDefined();
                        if (traceId) {
                            expect(detail.traceId).toBe(traceId);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );

    /**
     * Property: Event publishing failures should not throw errors
     */
    it(
        'should handle EventBridge failures gracefully without throwing',
        async () => {
            // Mock EventBridge failure
            mockSend.mockResolvedValue({
                FailedEntryCount: 1,
                Entries: [
                    {
                        ErrorCode: 'InternalException',
                        ErrorMessage: 'Internal service error',
                    },
                ],
            });

            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: fc.uuid(),
                        email: fc.emailAddress(),
                        createdAt: fc.date().map(d => d.toISOString()),
                    }),
                    async (userDetail) => {
                        // Should not throw even when EventBridge fails
                        await expect(publishUserCreatedEvent(userDetail)).resolves.not.toThrow();

                        // Verify EventBridge was still called
                        expect(mockSend).toHaveBeenCalled();
                    }
                ),
                { numRuns: 50 }
            );
        },
        30000
    );

    /**
     * Property: Events should be published to the correct event bus
     */
    it(
        'should publish all events to the configured event bus',
        async () => {
            const expectedEventBusName = process.env.EVENT_BUS_NAME || 'bayon-coagent-events-test';

            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        userId: fc.uuid(),
                        email: fc.emailAddress(),
                        createdAt: fc.date().map(d => d.toISOString()),
                    }),
                    async (userDetail) => {
                        mockSend.mockClear();

                        await publishUserCreatedEvent(userDetail);

                        const call = mockSend.mock.calls[0][0];
                        const input = call.input;
                        const entry = input.Entries[0];

                        expect(entry.EventBusName).toBe(expectedEventBusName);
                    }
                ),
                { numRuns: 100 }
            );
        },
        30000
    );
});
