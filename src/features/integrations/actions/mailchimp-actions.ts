/**
 * Mailchimp Integration Server Actions
 * 
 * Server actions for Mailchimp integration functionality.
 */

'use server';

import { integrationManager } from '@/integrations/integration-manager';
import { integrationRepository } from '@/integrations/integration-repository';
import { createMailchimpClient } from '@/integrations/mailchimp';
import { MailchimpContact } from '@/integrations/mailchimp/types';

/**
 * Initiate Mailchimp OAuth flow
 */
export async function initiateMailchimpOAuth(userId: string): Promise<{
    success: boolean;
    data?: string;
    error?: string;
}> {
    try {
        const result = await integrationManager.connect(userId, 'mailchimp');
        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initiate Mailchimp OAuth'
        };
    }
}

/**
 * Disconnect Mailchimp
 */
export async function disconnectMailchimp(userId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const result = await integrationManager.disconnect(userId, 'mailchimp');
        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to disconnect Mailchimp'
        };
    }
}

/**
 * List Mailchimp audiences
 */
export async function listMailchimpAudiences(userId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const connection = await integrationManager.getConnection(userId, 'mailchimp');

        if (!connection) {
            return {
                success: false,
                error: 'Mailchimp not connected'
            };
        }

        const client = createMailchimpClient(connection);
        const result = await client.listAudiences();

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to list audiences'
        };
    }
}

/**
 * Add contact to Mailchimp audience
 */
export async function addContactToAudience(
    userId: string,
    listId: string,
    contact: MailchimpContact
): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const connection = await integrationManager.getConnection(userId, 'mailchimp');

        if (!connection) {
            return {
                success: false,
                error: 'Mailchimp not connected'
            };
        }

        const client = createMailchimpClient(connection);
        const result = await client.addOrUpdateContact(listId, contact);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add contact'
        };
    }
}

/**
 * Send Mailchimp campaign
 */
export async function sendMailchimpCampaign(
    userId: string,
    campaignId: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const connection = await integrationManager.getConnection(userId, 'mailchimp');

        if (!connection) {
            return {
                success: false,
                error: 'Mailchimp not connected'
            };
        }

        const client = createMailchimpClient(connection);
        await client.sendCampaign(campaignId);

        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send campaign'
        };
    }
}
