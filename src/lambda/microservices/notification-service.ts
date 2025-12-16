/**
 * Notification Service Microservice
 * 
 * Handles multi-channel notification delivery with support for:
 * - Email notifications via SES
 * - SMS notifications via SNS
 * - Push notifications via SNS
 * - Webhook notifications via HTTP
 * 
 * **Validates: Requirements 5.1**
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Types
interface NotificationChannel {
    type: 'email' | 'sms' | 'push' | 'webhook';
    endpoint: string;
    active: boolean;
    priority: number;
}

interface NotificationRequest {
    id: string;
    userId: string;
    category: 'marketing' | 'transactional' | 'alerts' | 'reminders';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    message: string;
    channels: string[];
    metadata?: Record<string, any>;
    scheduledAt?: string;
}

interface ChannelDeliveryResult {
    channel: string;
    success: boolean;
    timestamp: string;
    error?: string;
    deliveryId?: string;
    retryCount: number;
}

interface NotificationDeliveryResult {
    notificationId: string;
    attemptedChannels: string[];
    channelResults: Record<string, ChannelDeliveryResult>;
    overallSuccess: boolean;
    deliveredAt: string;
}

interface ServiceResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

// AWS Clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const sesClient = new SESClient({ region: process.env.AWS_REGION });

class NotificationService {
    async deliverNotification(request: NotificationRequest): Promise<NotificationDeliveryResult> {
        const channelResults: Record<string, ChannelDeliveryResult> = {};
        let successCount = 0;

        // Attempt delivery to each specified channel
        for (const channel of request.channels) {
            try {
                const deliveryResult = await this.deliverToChannel(request, channel);
                channelResults[channel] = deliveryResult;
                if (deliveryResult.success) {
                    successCount++;
                }
            } catch (error) {
                channelResults[channel] = {
                    channel,
                    success: false,
                    timestamp: new Date().toISOString(),
                    error: error instanceof Error ? error.message : 'Unknown error',
                    retryCount: 0,
                };
            }
        }

        return {
            notificationId: request.id,
            attemptedChannels: request.channels,
            channelResults,
            overallSuccess: successCount > 0,
            deliveredAt: new Date().toISOString(),
        };
    }

    private async deliverToChannel(
        request: NotificationRequest,
        channel: string
    ): Promise<ChannelDeliveryResult> {
        const timestamp = new Date().toISOString();

        try {
            let deliveryId: string | undefined;

            switch (channel) {
                case 'email':
                    deliveryId = await this.sendEmail(request);
                    break;
                case 'sms':
                    deliveryId = await this.sendSMS(request);
                    break;
                case 'push':
                    deliveryId = await this.sendPushNotification(request);
                    break;
                case 'webhook':
                    deliveryId = await this.sendWebhook(request);
                    break;
                default:
                    throw new Error(`Unsupported channel: ${channel}`);
            }

            return {
                channel,
                success: true,
                timestamp,
                deliveryId,
                retryCount: 0,
            };
        } catch (error) {
            return {
                channel,
                success: false,
                timestamp,
                error: error instanceof Error ? error.message : 'Unknown error',
                retryCount: 0,
            };
        }
    }

    private async sendEmail(request: NotificationRequest): Promise<string> {
        // Get user email from user preferences or metadata
        const emailAddress = request.metadata?.email || `user-${request.userId}@example.com`;

        const command = new SendEmailCommand({
            Source: process.env.FROM_EMAIL || 'notifications@bayon.co',
            Destination: {
                ToAddresses: [emailAddress],
            },
            Message: {
                Subject: {
                    Data: request.title,
                    Charset: 'UTF-8',
                },
                Body: {
                    Text: {
                        Data: request.message,
                        Charset: 'UTF-8',
                    },
                    Html: {
                        Data: `<html><body><h2>${request.title}</h2><p>${request.message}</p></body></html>`,
                        Charset: 'UTF-8',
                    },
                },
            },
        });

        const result = await sesClient.send(command);
        return result.MessageId || `email-${Date.now()}`;
    }

    private async sendSMS(request: NotificationRequest): Promise<string> {
        // Get user phone from user preferences or metadata
        const phoneNumber = request.metadata?.phone || '+1234567890';

        const command = new PublishCommand({
            PhoneNumber: phoneNumber,
            Message: `${request.title}\n\n${request.message}`,
            MessageAttributes: {
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: request.priority === 'urgent' ? 'Transactional' : 'Promotional',
                },
            },
        });

        const result = await snsClient.send(command);
        return result.MessageId || `sms-${Date.now()}`;
    }

    private async sendPushNotification(request: NotificationRequest): Promise<string> {
        // Get device token from user preferences or metadata
        const deviceToken = request.metadata?.deviceToken || 'mock-device-token';

        // For push notifications, we would typically use SNS with platform applications
        const message = {
            default: request.message,
            APNS: JSON.stringify({
                aps: {
                    alert: {
                        title: request.title,
                        body: request.message,
                    },
                    badge: 1,
                    sound: 'default',
                },
            }),
            GCM: JSON.stringify({
                data: {
                    title: request.title,
                    message: request.message,
                    priority: request.priority,
                },
            }),
        };

        const command = new PublishCommand({
            TargetArn: deviceToken, // This would be the endpoint ARN in real implementation
            Message: JSON.stringify(message),
            MessageStructure: 'json',
        });

        const result = await snsClient.send(command);
        return result.MessageId || `push-${Date.now()}`;
    }

    private async sendWebhook(request: NotificationRequest): Promise<string> {
        // Get webhook URL from user preferences or metadata
        const webhookUrl = request.metadata?.webhookUrl || 'https://example.com/webhook';

        const payload = {
            notificationId: request.id,
            userId: request.userId,
            category: request.category,
            priority: request.priority,
            title: request.title,
            message: request.message,
            timestamp: new Date().toISOString(),
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Bayon-Notification-Service/1.0',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
        }

        return `webhook-${Date.now()}-${response.status}`;
    }

    createResponse(statusCode: number, data: any, error?: string): ServiceResponse {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'X-Request-ID': (global as any).testUtils?.generateTestId() || `req-${Date.now()}`,
            },
            body: JSON.stringify(error ? { error, data } : { data }),
        };
    }
}

// Lambda handler
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const service = new NotificationService();

    try {
        // Parse request body
        const request: NotificationRequest = JSON.parse(event.body || '{}');

        // Validate required fields
        if (!request.id || !request.userId || !request.title || !request.message || !request.channels?.length) {
            return service.createResponse(400, null, 'Missing required fields: id, userId, title, message, channels');
        }

        // Deliver notification
        const result = await service.deliverNotification(request);

        return service.createResponse(200, result);
    } catch (error) {
        console.error('Notification service error:', error);
        return service.createResponse(500, null, 'Internal server error');
    }
};

// Export service class for testing
export { NotificationService };