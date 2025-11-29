/**
 * Twilio Integration Server Actions
 * 
 * Server actions for Twilio SMS functionality.
 */

'use server';

import { integrationManager } from '@/integrations/integration-manager';
import { integrationRepository } from '@/integrations/integration-repository';
import { createTwilioClient } from '@/integrations/twilio';
import { SMSMessage } from '@/integrations/twilio/types';

/**
 * Configure Twilio credentials
 */
export async function configureTwilio(
    userId: string,
    accountSid: string,
    authToken: string,
    phoneNumber?: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const result = await integrationManager.connect(userId, 'twilio', {
            accountSid,
            authToken,
            phoneNumber
        });

        return result as { success: boolean; error?: string };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to configure Twilio'
        };
    }
}

/**
 * Disconnect Twilio
 */
export async function disconnectTwilio(userId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const result = await integrationManager.disconnect(userId, 'twilio');
        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to disconnect Twilio'
        };
    }
}

/**
 * Send SMS message
 */
export async function sendSMS(
    userId: string,
    message: SMSMessage
): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const connection = await integrationManager.getConnection(userId, 'twilio');

        if (!connection) {
            return {
                success: false,
                error: 'Twilio not connected'
            };
        }

        const client = createTwilioClient(connection);
        const result = await client.sendSMS(message);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS'
        };
    }
}

/**
 * Check SMS delivery status
 */
export async function checkMessageStatus(
    userId: string,
    messageSid: string
): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const connection = await integrationManager.getConnection(userId, 'twilio');

        if (!connection) {
            return {
                success: false,
                error: 'Twilio not connected'
            };
        }

        const client = createTwilioClient(connection);
        const result = await client.getMessageStatus(messageSid);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check message status'
        };
    }
}

/**
 * List Twilio phone numbers
 */
export async function getPhoneNumbers(userId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const connection = await integrationManager.getConnection(userId, 'twilio');

        if (!connection) {
            return {
                success: false,
                error: 'Twilio not connected'
            };
        }

        const client = createTwilioClient(connection);
        const result = await client.listPhoneNumbers();

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get phone numbers'
        };
    }
}
