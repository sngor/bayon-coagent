/**
 * AI + Integration Workflow Saga
 * 
 * Coordinates AI content generation with external integration publishing.
 * If any step fails, compensating transactions roll back the changes.
 * 
 * Workflow:
 * 1. Generate AI content
 * 2. Save content to database
 * 3. Publish to external platform (social media)
 * 
 * Requirements: 7.2, 7.3
 */

import { SagaStep, SagaContext, createSagaCoordinator, SagaCoordinator } from '../saga-coordinator';
import { DynamoDBClient, PutItemCommand, DeleteItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { getAWSConfig } from '@/aws/config';

// Input for AI + Integration saga
export interface AIIntegrationInput {
    userId: string;
    contentType: 'blog-post' | 'social-media' | 'listing-description';
    prompt: string;
    platform?: 'facebook' | 'instagram' | 'linkedin' | 'twitter';
    publishImmediately?: boolean;
}

// Output from AI generation step
interface AIGenerationOutput {
    contentId: string;
    generatedContent: string;
    metadata: Record<string, any>;
}

// Output from content save step
interface ContentSaveOutput {
    contentId: string;
    savedAt: string;
}

// Output from publishing step
interface PublishingOutput {
    contentId: string;
    platform: string;
    externalId: string;
    publishedAt: string;
}

/**
 * Step 1: Generate AI Content
 */
const generateAIContentStep: SagaStep<AIIntegrationInput, AIGenerationOutput> = {
    name: 'generate-ai-content',

    async action(input, context) {
        console.log(`[Saga ${context.sagaId}] Generating AI content for ${input.contentType}`);

        // Simulate AI generation (in real implementation, call Lambda)
        const contentId = `CONTENT#${Date.now()}`;
        const generatedContent = `Generated ${input.contentType} content: ${input.prompt}`;

        // In production, this would invoke the AI service Lambda
        // const response = await invokeAILambda(input.contentType, input.prompt);

        return {
            contentId,
            generatedContent,
            metadata: {
                contentType: input.contentType,
                prompt: input.prompt,
                generatedAt: new Date().toISOString(),
            },
        };
    },

    async compensation(output, context) {
        console.log(`[Saga ${context.sagaId}] Compensating AI content generation - no action needed`);
        // AI generation doesn't need compensation as it doesn't persist state
    },
};

/**
 * Step 2: Save Content to Database
 */
const saveContentStep: SagaStep<AIGenerationOutput, ContentSaveOutput> = {
    name: 'save-content',

    async action(input, context) {
        console.log(`[Saga ${context.sagaId}] Saving content ${input.contentId} to database`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        const now = new Date().toISOString();

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${context.userId}`,
                    SK: input.contentId,
                    content: input.generatedContent,
                    metadata: input.metadata,
                    sagaId: context.sagaId,
                    createdAt: now,
                    updatedAt: now,
                }),
            })
        );

        return {
            contentId: input.contentId,
            savedAt: now,
        };
    },

    async compensation(output, context) {
        console.log(`[Saga ${context.sagaId}] Compensating content save - deleting ${output.contentId}`);

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
 * Step 3: Publish to External Platform
 */
const publishToExternalPlatformStep: SagaStep<
    ContentSaveOutput & { platform: string; content: string },
    PublishingOutput
> = {
    name: 'publish-to-platform',

    async action(input, context) {
        console.log(`[Saga ${context.sagaId}] Publishing content ${input.contentId} to ${input.platform}`);

        // Simulate external API call (in real implementation, call Integration Lambda)
        const externalId = `EXT#${Date.now()}`;

        // In production, this would invoke the Integration service Lambda
        // const response = await invokeIntegrationLambda(input.platform, input.content);

        // Save publishing record
        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        const now = new Date().toISOString();

        await dynamoClient.send(
            new PutItemCommand({
                TableName: tableName,
                Item: marshall({
                    PK: `USER#${context.userId}`,
                    SK: `PUBLISH#${input.contentId}#${input.platform}`,
                    contentId: input.contentId,
                    platform: input.platform,
                    externalId,
                    sagaId: context.sagaId,
                    publishedAt: now,
                }),
            })
        );

        return {
            contentId: input.contentId,
            platform: input.platform,
            externalId,
            publishedAt: now,
        };
    },

    async compensation(output, context) {
        console.log(`[Saga ${context.sagaId}] Compensating publish - removing from ${output.platform}`);

        const dynamoClient = new DynamoDBClient(getAWSConfig());
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

        try {
            // Delete publishing record
            await dynamoClient.send(
                new DeleteItemCommand({
                    TableName: tableName,
                    Key: marshall({
                        PK: `USER#${context.userId}`,
                        SK: `PUBLISH#${output.contentId}#${output.platform}`,
                    }),
                })
            );

            // In production, also call external API to delete the post
            // await invokeIntegrationLambda('delete', output.platform, output.externalId);

            console.log(`[Saga ${context.sagaId}] Successfully removed publish record`);
        } catch (error) {
            console.error(`[Saga ${context.sagaId}] Failed to compensate publish:`, error);
            throw error;
        }
    },
};

/**
 * Execute AI + Integration Saga
 */
export async function executeAIIntegrationSaga(
    input: AIIntegrationInput,
    traceId?: string
) {
    const coordinator = createSagaCoordinator();
    const sagaId = SagaCoordinator.generateSagaId(input.userId);

    const context: SagaContext = {
        sagaId,
        userId: input.userId,
        metadata: {
            contentType: input.contentType,
            platform: input.platform,
        },
        traceId,
    };

    // Define saga steps
    const steps: SagaStep[] = [
        generateAIContentStep,
        saveContentStep,
    ];

    // Add publishing step if requested
    if (input.publishImmediately && input.platform) {
        steps.push(publishToExternalPlatformStep);
    }

    // Execute saga
    const result = await coordinator.execute(steps, input, context);

    return result;
}

/**
 * Helper to check if content was successfully published
 */
export async function checkPublishStatus(
    userId: string,
    contentId: string,
    platform: string
): Promise<boolean> {
    const dynamoClient = new DynamoDBClient(getAWSConfig());
    const tableName = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent-dev';

    try {
        const result = await dynamoClient.send(
            new GetItemCommand({
                TableName: tableName,
                Key: marshall({
                    PK: `USER#${userId}`,
                    SK: `PUBLISH#${contentId}#${platform}`,
                }),
            })
        );

        return !!result.Item;
    } catch (error) {
        console.error('Error checking publish status:', error);
        return false;
    }
}
