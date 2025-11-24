/**
 * Content + Publishing Workflow Saga
 * 
 * Coordinates content creation, scheduling, and multi-platform publishing.
 * If any step fails, compensating transactions roll back the changes.
 * 
 * Workflow:
 * 1. Create/update content
 * 2. Schedule content (if scheduled)
 * 3. Publish to multiple platforms
 * 4. Update analytics
 * 
 * Requirements: 7.2, 7.3
 */

import { SagaStep, SagaContext, createSagaCoordinator, SagaCoordinator } from '../saga-coordinator';
import { DynamoDBClient, PutItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { getAWSConfig } from '@/aws/config';

// Input for Content + Publishing saga
export interface ContentPublishingInput {
    userId: string;
    contentId?: string; // If updating existing content
    title: string;
    body: string;
    contentType: 'blog-post' | 'social-media' | 'newsletter';
    platforms: Array<'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'website'>;
    scheduledFor?: string; // ISO timestamp
    tags?: string[];
}

// Output from content creation step
interface ContentCreationOutput {
    contentId: string;
    version: number;
    createdAt: string;
}

// Output from scheduling step
interface SchedulingOutput {
    contentId: string;
    scheduleId: string;
    scheduledFor: string;
}

// Output from multi-platform publishing step
interface MultiPlatformPublishOutput {
    contentId: string;
    publications: Array<{
        platform: string;
        externalId: string;
        publishedAt: string;
        success: boolean;
    }>;
}

// Output from analytics update step
interface AnalyticsUpdateOutput {
    contentId: string;
    analyticsRecordId: string;
    updatedAt: string;
}

/**
 * Step 1: Create or Update Content
 */
const createContentStep: SagaStep<ContentPublishingInput, ContentCreationOutput> = {
    name: 'create-content',

    async action(input, context) {
        console.log(`[Saga ${context.sagaId}] Creating content: ${input.title}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        const contentId = input.contentId || `CONTENT#${Date.now()}`;
        const now = new Date().toISOString();

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${context.userId}`,
                    SK: contentId,
                    title: input.title,
                    body: input.body,
                    contentType: input.contentType,
                    platforms: input.platforms,
                    tags: input.tags || [],
                    version: 1,
                    sagaId: context.sagaId,
                    status: 'draft',
                    createdAt: now,
                    updatedAt: now,
                }),
            })
        );

        return {
            contentId,
            version: 1,
            createdAt: now,
        };
    },

    async compensation(output, context) {
        console.log(`[Saga ${context.sagaId}] Compensating content creation - deleting ${output.contentId}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        try {
            await dynamoClient.send(
                new DeleteItemCommand({
                    TableName: tableName,
                    Key: marshall({
                        PK: `USER#${context.userId}`,
                        SK: output.contentId,
                    }),
                })
            );
            console.log(`[Saga ${context.sagaId}] Successfully deleted content ${output.contentId}`);
        } catch (error) {
            console.error(`[Saga ${context.sagaId}] Failed to delete content:`, error);
            throw error;
        }
    },
};

/**
 * Step 2: Schedule Content (if scheduled)
 */
const scheduleContentStep: SagaStep<
    ContentCreationOutput & { scheduledFor: string },
    SchedulingOutput
> = {
    name: 'schedule-content',

    async action(input, context) {
        console.log(`[Saga ${context.sagaId}] Scheduling content ${input.contentId} for ${input.scheduledFor}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        const scheduleId = `SCHEDULE#${Date.now()}`;
        const now = new Date().toISOString();

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${context.userId}`,
                    SK: scheduleId,
                    contentId: input.contentId,
                    scheduledFor: input.scheduledFor,
                    status: 'pending',
                    sagaId: context.sagaId,
                    createdAt: now,
                }),
            })
        );

        // Update content status
        await dynamoClient.send(
            new UpdateItemCommand({
                TableName: tableName,
                Key: marshall({
                    PK: `USER#${context.userId}`,
                    SK: input.contentId,
                }),
                UpdateExpression: 'SET #status = :status, scheduleId = :scheduleId',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: marshall({
                    ':status': 'scheduled',
                    ':scheduleId': scheduleId,
                }),
            })
        );

        return {
            contentId: input.contentId,
            scheduleId,
            scheduledFor: input.scheduledFor,
        };
    },

    async compensation(output, context) {
        console.log(`[Saga ${context.sagaId}] Compensating schedule - deleting ${output.scheduleId}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        try {
            // Delete schedule record
            await dynamoClient.send(
                new DeleteItemCommand({
                    TableName: tableName,
                    Key: marshall({
                        PK: `USER#${context.userId}`,
                        SK: output.scheduleId,
                    }),
                })
            );

            // Update content status back to draft
            await dynamoClient.send(
                new UpdateItemCommand({
                    TableName: tableName,
                    Key: marshall({
                        PK: `USER#${context.userId}`,
                        SK: output.contentId,
                    }),
                    UpdateExpression: 'SET #status = :status REMOVE scheduleId',
                    ExpressionAttributeNames: {
                        '#status': 'status',
                    },
                    ExpressionAttributeValues: marshall({
                        ':status': 'draft',
                    }),
                })
            );

            console.log(`[Saga ${context.sagaId}] Successfully compensated schedule`);
        } catch (error) {
            console.error(`[Saga ${context.sagaId}] Failed to compensate schedule:`, error);
            throw error;
        }
    },
};

/**
 * Step 3: Publish to Multiple Platforms
 */
const publishToMultiplePlatformsStep: SagaStep<
    ContentCreationOutput & { platforms: string[]; title: string; body: string },
    MultiPlatformPublishOutput
> = {
    name: 'publish-to-platforms',

    async action(input, context) {
        console.log(`[Saga ${context.sagaId}] Publishing content ${input.contentId} to ${input.platforms.length} platforms`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        const publications: MultiPlatformPublishOutput['publications'] = [];
        const now = new Date().toISOString();

        // Publish to each platform
        for (const platform of input.platforms) {
            try {
                // Simulate external API call
                const externalId = `EXT#${platform}#${Date.now()}`;

                // In production, invoke Integration service Lambda
                // const response = await invokeIntegrationLambda(platform, input.title, input.body);

                // Save publication record
                await dynamoClient.send(
                    new PutItemCommand({
                        TableName: tableName,
                        Item: marshall({
                            PK: `USER#${context.userId}`,
                            SK: `PUBLISH#${input.contentId}#${platform}`,
                            contentId: input.contentId,
                            platform,
                            externalId,
                            sagaId: context.sagaId,
                            publishedAt: now,
                        }),
                    })
                );

                publications.push({
                    platform,
                    externalId,
                    publishedAt: now,
                    success: true,
                });
            } catch (error) {
                console.error(`Failed to publish to ${platform}:`, error);
                publications.push({
                    platform,
                    externalId: '',
                    publishedAt: now,
                    success: false,
                });
            }
        }

        // Update content status to published
        await dynamoClient.send(
            new UpdateItemCommand({
                TableName: tableName,
                Key: marshall({
                    PK: `USER#${context.userId}`,
                    SK: input.contentId,
                }),
                UpdateExpression: 'SET #status = :status, publishedAt = :publishedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: marshall({
                    ':status': 'published',
                    ':publishedAt': now,
                }),
            })
        );

        return {
            contentId: input.contentId,
            publications,
        };
    },

    async compensation(output, context) {
        console.log(`[Saga ${context.sagaId}] Compensating publications for ${output.contentId}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        try {
            // Delete all publication records
            for (const pub of output.publications) {
                if (pub.success) {
                    await dynamoClient.send(
                        new DeleteItemCommand({
                            TableName: tableName,
                            Key: marshall({
                                PK: `USER#${context.userId}`,
                                SK: `PUBLISH#${output.contentId}#${pub.platform}`,
                            }),
                        })
                    );

                    // In production, also call external API to delete the post
                    // await invokeIntegrationLambda('delete', pub.platform, pub.externalId);
                }
            }

            // Update content status back to draft
            await dynamoClient.send(
                new UpdateItemCommand({
                    TableName: tableName,
                    Key: marshall({
                        PK: `USER#${context.userId}`,
                        SK: output.contentId,
                    }),
                    UpdateExpression: 'SET #status = :status REMOVE publishedAt',
                    ExpressionAttributeNames: {
                        '#status': 'status',
                    },
                    ExpressionAttributeValues: marshall({
                        ':status': 'draft',
                    }),
                })
            );

            console.log(`[Saga ${context.sagaId}] Successfully compensated publications`);
        } catch (error) {
            console.error(`[Saga ${context.sagaId}] Failed to compensate publications:`, error);
            throw error;
        }
    },
};

/**
 * Step 4: Update Analytics
 */
const updateAnalyticsStep: SagaStep<MultiPlatformPublishOutput, AnalyticsUpdateOutput> = {
    name: 'update-analytics',

    async action(input, context) {
        console.log(`[Saga ${context.sagaId}] Updating analytics for ${input.contentId}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        const analyticsRecordId = `ANALYTICS#${input.contentId}`;
        const now = new Date().toISOString();

        const successfulPublications = input.publications.filter(p => p.success);

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${context.userId}`,
                    SK: analyticsRecordId,
                    contentId: input.contentId,
                    platformCount: successfulPublications.length,
                    platforms: successfulPublications.map(p => p.platform),
                    sagaId: context.sagaId,
                    createdAt: now,
                    updatedAt: now,
                }),
            })
        );

        return {
            contentId: input.contentId,
            analyticsRecordId,
            updatedAt: now,
        };
    },

    async compensation(output, context) {
        console.log(`[Saga ${context.sagaId}] Compensating analytics update - deleting ${output.analyticsRecordId}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        try {
            await dynamoClient.send(
                new DeleteItemCommand({
                    TableName: tableName,
                    Key: marshall({
                        PK: `USER#${context.userId}`,
                        SK: output.analyticsRecordId,
                    }),
                })
            );
            console.log(`[Saga ${context.sagaId}] Successfully deleted analytics record`);
        } catch (error) {
            console.error(`[Saga ${context.sagaId}] Failed to delete analytics:`, error);
            throw error;
        }
    },
};

/**
 * Execute Content + Publishing Saga
 */
export async function executeContentPublishingSaga(
    input: ContentPublishingInput,
    traceId?: string
) {
    const coordinator = createSagaCoordinator();
    const sagaId = SagaCoordinator.generateSagaId(input.userId);

    const context: SagaContext = {
        sagaId,
        userId: input.userId,
        metadata: {
            contentType: input.contentType,
            platforms: input.platforms,
            scheduled: !!input.scheduledFor,
        },
        traceId,
    };

    // Define saga steps
    const steps: SagaStep[] = [createContentStep];

    // Add scheduling step if scheduled
    if (input.scheduledFor) {
        steps.push(scheduleContentStep);
    }

    // Add publishing and analytics steps
    steps.push(publishToMultiplePlatformsStep, updateAnalyticsStep);

    // Execute saga
    const result = await coordinator.execute(steps, input, context);

    return result;
}
