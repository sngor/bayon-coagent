/**
 * AWS SNS Client for Push Notifications
 * 
 * This module provides SNS client configuration and utilities for sending
 * push notifications to mobile devices.
 */

import { SNSClient, CreatePlatformEndpointCommand, PublishCommand, DeleteEndpointCommand } from '@aws-sdk/client-sns';
import { getConfig, getAWSCredentials } from '../config';

let snsClient: SNSClient | null = null;

/**
 * Get or create SNS client instance
 */
export function getSNSClient(): SNSClient {
    if (!snsClient) {
        const config = getConfig();
        const credentials = getAWSCredentials();

        snsClient = new SNSClient({
            region: config.sns.region,
            credentials: credentials.accessKeyId ? credentials : undefined,
            endpoint: config.sns.endpoint,
        });
    }

    return snsClient;
}

/**
 * Create a platform endpoint for a device
 */
export async function createPlatformEndpoint(
    token: string,
    customUserData?: string
): Promise<string> {
    const config = getConfig();

    if (!config.sns.platformApplicationArn) {
        throw new Error('SNS Platform Application ARN not configured');
    }

    const client = getSNSClient();

    const command = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: config.sns.platformApplicationArn,
        Token: token,
        CustomUserData: customUserData,
    });

    const response = await client.send(command);

    if (!response.EndpointArn) {
        throw new Error('Failed to create platform endpoint');
    }

    return response.EndpointArn;
}

/**
 * Send a push notification to a specific endpoint
 */
export async function sendPushNotification(
    endpointArn: string,
    message: string,
    title?: string,
    data?: Record<string, any>
): Promise<void> {
    const client = getSNSClient();

    // Create platform-specific message payload
    const payload = {
        default: message,
        APNS: JSON.stringify({
            aps: {
                alert: {
                    title: title || 'Bayon Coagent',
                    body: message,
                },
                sound: 'default',
                badge: 1,
            },
            data: data || {},
        }),
        GCM: JSON.stringify({
            notification: {
                title: title || 'Bayon Coagent',
                body: message,
                sound: 'default',
            },
            data: data || {},
        }),
    };

    const command = new PublishCommand({
        TargetArn: endpointArn,
        Message: JSON.stringify(payload),
        MessageStructure: 'json',
    });

    await client.send(command);
}

/**
 * Delete a platform endpoint
 */
export async function deletePlatformEndpoint(endpointArn: string): Promise<void> {
    const client = getSNSClient();

    const command = new DeleteEndpointCommand({
        EndpointArn: endpointArn,
    });

    await client.send(command);
}

/**
 * Send a market alert notification
 */
export async function sendMarketAlert(
    endpointArn: string,
    alertType: 'price-change' | 'new-listing' | 'trend-shift',
    alertData: {
        location: string;
        message: string;
        data?: Record<string, any>;
    }
): Promise<void> {
    const titles = {
        'price-change': 'Price Change Alert',
        'new-listing': 'New Listing Alert',
        'trend-shift': 'Market Trend Alert',
    };

    const title = titles[alertType];
    const message = `${alertData.location}: ${alertData.message}`;

    await sendPushNotification(endpointArn, message, title, {
        type: alertType,
        location: alertData.location,
        ...alertData.data,
    });
}

/**
 * Reset SNS client (useful for testing)
 */
export function resetSNSClient(): void {
    snsClient = null;
}