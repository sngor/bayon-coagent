/**
 * AWS SQS Client Module
 * 
 * This module provides a client for interacting with AWS SQS queues,
 * specifically for AI job processing.
 */

import {
    SQSClient,
    SendMessageCommand,
    SendMessageCommandInput,
    ReceiveMessageCommand,
    ReceiveMessageCommandInput,
    DeleteMessageCommand,
    DeleteMessageCommandInput,
    GetQueueAttributesCommand,
    GetQueueAttributesCommandInput,
} from '@aws-sdk/client-sqs';
import { getConfig, getAWSCredentials } from '../config';

let sqsClient: SQSClient | null = null;

/**
 * Gets or creates the SQS client instance
 */
export function getSQSClient(): SQSClient {
    if (!sqsClient) {
        const config = getConfig();
        const credentials = getAWSCredentials();

        const clientConfig: any = {
            region: config.region,
        };

        // Only add credentials if they are defined
        if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
            clientConfig.credentials = credentials;
        }

        // Only add endpoint if it's defined
        if (config.sqs.endpoint) {
            clientConfig.endpoint = config.sqs.endpoint;
        }

        sqsClient = new SQSClient(clientConfig);
    }

    return sqsClient;
}

/**
 * AI Job message structure
 */
export interface AIJobMessage {
    jobId: string;
    userId: string;
    jobType: 'blog-post' | 'social-media' | 'listing-description' | 'market-update';
    input: Record<string, any>;
    timestamp: string;
    traceId?: string;
}

/**
 * AI Job result message structure
 */
export interface AIJobResultMessage {
    jobId: string;
    userId: string;
    jobType: string;
    status: 'completed' | 'failed';
    result?: Record<string, any>;
    error?: string;
    timestamp: string;
    processingTime?: number;
    traceId?: string;
}

/**
 * Sends an AI job request to the request queue
 */
export async function sendAIJobRequest(
    message: AIJobMessage
): Promise<{ messageId: string; jobId: string }> {
    const config = getConfig();
    const queueUrl = config.sqs.aiJobRequestQueueUrl;

    if (!queueUrl) {
        throw new Error('AI Job Request Queue URL is not configured');
    }

    const client = getSQSClient();

    const params: SendMessageCommandInput = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
            JobType: {
                DataType: 'String',
                StringValue: message.jobType,
            },
            UserId: {
                DataType: 'String',
                StringValue: message.userId,
            },
            JobId: {
                DataType: 'String',
                StringValue: message.jobId,
            },
        },
    };

    if (message.traceId) {
        params.MessageAttributes!.TraceId = {
            DataType: 'String',
            StringValue: message.traceId,
        };
    }

    const command = new SendMessageCommand(params);
    const response = await client.send(command);

    return {
        messageId: response.MessageId!,
        jobId: message.jobId,
    };
}

/**
 * Sends an AI job result to the response queue
 */
export async function sendAIJobResult(
    message: AIJobResultMessage
): Promise<{ messageId: string }> {
    const config = getConfig();
    const queueUrl = config.sqs.aiJobResponseQueueUrl;

    if (!queueUrl) {
        throw new Error('AI Job Response Queue URL is not configured');
    }

    const client = getSQSClient();

    const params: SendMessageCommandInput = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
            JobId: {
                DataType: 'String',
                StringValue: message.jobId,
            },
            UserId: {
                DataType: 'String',
                StringValue: message.userId,
            },
            Status: {
                DataType: 'String',
                StringValue: message.status,
            },
        },
    };

    if (message.traceId) {
        params.MessageAttributes!.TraceId = {
            DataType: 'String',
            StringValue: message.traceId,
        };
    }

    const command = new SendMessageCommand(params);
    const response = await client.send(command);

    return {
        messageId: response.MessageId!,
    };
}

/**
 * Receives messages from a queue
 */
export async function receiveMessages(
    queueUrl: string,
    maxMessages: number = 10,
    waitTimeSeconds: number = 20
): Promise<any[]> {
    const client = getSQSClient();

    const params: ReceiveMessageCommandInput = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: waitTimeSeconds,
        MessageAttributeNames: ['All'],
        AttributeNames: ['All'],
    };

    const command = new ReceiveMessageCommand(params);
    const response = await client.send(command);

    return response.Messages || [];
}

/**
 * Deletes a message from a queue
 */
export async function deleteMessage(
    queueUrl: string,
    receiptHandle: string
): Promise<void> {
    const client = getSQSClient();

    const params: DeleteMessageCommandInput = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
    };

    const command = new DeleteMessageCommand(params);
    await client.send(command);
}

/**
 * Gets queue attributes
 */
export async function getQueueAttributes(
    queueUrl: string,
    attributeNames: ('All' | 'ApproximateNumberOfMessages' | 'ApproximateNumberOfMessagesNotVisible' | 'ApproximateNumberOfMessagesDelayed')[] = ['All']
): Promise<Record<string, string>> {
    const client = getSQSClient();

    const params: GetQueueAttributesCommandInput = {
        QueueUrl: queueUrl,
        AttributeNames: attributeNames as any,
    };

    const command = new GetQueueAttributesCommand(params);
    const response = await client.send(command);

    return response.Attributes || {};
}

/**
 * Gets the approximate number of messages in a queue
 */
export async function getQueueMessageCount(queueUrl: string): Promise<{
    approximate: number;
    notVisible: number;
    delayed: number;
}> {
    const attributes = await getQueueAttributes(queueUrl, [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateNumberOfMessagesDelayed',
    ]);

    return {
        approximate: parseInt(attributes.ApproximateNumberOfMessages || '0', 10),
        notVisible: parseInt(attributes.ApproximateNumberOfMessagesNotVisible || '0', 10),
        delayed: parseInt(attributes.ApproximateNumberOfMessagesDelayed || '0', 10),
    };
}

/**
 * Resets the SQS client (useful for testing)
 */
export function resetSQSClient(): void {
    sqsClient = null;
}
