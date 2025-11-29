/**
 * CRM Integration Server Actions
 * Server-side functions for managing CRM integrations
 */

'use server';

import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createFollowUpBossClient } from '@/integrations/crm/followupboss';
import { createFacebookLeadAdsClient } from '@/integrations/crm/facebook-lead-ads';
import { createCalendlyClient } from '@/integrations/crm/calendly';
import { createHubSpotClient } from '@/integrations/crm/hubspot';

const OAUTH_TOKENS_TABLE = process.env.OAUTH_TOKENS_TABLE || 'oauth-tokens';

/**
 * Get OAuth tokens for a CRM platform
 */
export async function getCRMTokens(
    userId: string,
    platform: 'followupboss' | 'facebook_lead_ads' | 'calendly' | 'hubspot'
): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    metadata?: Record<string, any>;
} | null> {
    try {
        const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        const docClient = DynamoDBDocumentClient.from(dynamoClient);

        const result = await docClient.send(
            new GetCommand({
                TableName: OAUTH_TOKENS_TABLE,
                Key: { userId, provider: platform },
            })
        );

        if (!result.Item) {
            return null;
        }

        return {
            accessToken: result.Item.accessToken,
            refreshToken: result.Item.refreshToken,
            expiresAt: result.Item.expiresAt,
            metadata: result.Item.metadata,
        };
    } catch (error) {
        console.error(`Failed to get ${platform} tokens:`, error);
        return null;
    }
}

/**
 * Initiate OAuth flow for a CRM platform
 */
export async function initiateCRMOAuth(
    userId: string,
    platform: 'calendly' | 'hubspot'
): Promise<{ authUrl: string } | { error: string }> {
    try {
        const state = `${userId}:${Math.random().toString(36).substring(7)}`;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

        let authUrl: string;

        switch (platform) {
            case 'calendly':
                const calendlyClientId = process.env.CALENDLY_CLIENT_ID;
                const calendlyRedirectUri = `${baseUrl}/api/oauth/calendly/callback`;
                authUrl = `https://auth.calendly.com/oauth/authorize?` +
                    `client_id=${calendlyClientId}&` +
                    `response_type=code&` +
                    `redirect_uri=${encodeURIComponent(calendlyRedirectUri)}&` +
                    `state=${state}`;
                break;

            case 'hubspot':
                const hubspotClientId = process.env.HUBSPOT_CLIENT_ID;
                const hubspotRedirectUri = `${baseUrl}/api/oauth/hubspot/callback`;
                const scopes = 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read crm.objects.companies.write crm.objects.deals.read crm.objects.deals.write';
                authUrl = `https://app.hubspot.com/oauth/authorize?` +
                    `client_id=${hubspotClientId}&` +
                    `redirect_uri=${encodeURIComponent(hubspotRedirectUri)}&` +
                    `scope=${encodeURIComponent(scopes)}&` +
                    `state=${state}`;
                break;

            default:
                return { error: 'Unsupported platform' };
        }

        return { authUrl };
    } catch (error) {
        console.error('Failed to initiate OAuth:', error);
        return { error: 'Failed to initiate OAuth flow' };
    }
}

/**
 * Disconnect a CRM integration
 */
export async function disconnectCRM(
    userId: string,
    platform: 'followupboss' | 'facebook_lead_ads' | 'calendly' | 'hubspot'
): Promise<{ success: boolean; error?: string }> {
    try {
        const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        const docClient = DynamoDBDocumentClient.from(dynamoClient);

        await docClient.send(
            new DeleteCommand({
                TableName: OAUTH_TOKENS_TABLE,
                Key: { userId, provider: platform },
            })
        );

        return { success: true };
    } catch (error) {
        console.error(`Failed to disconnect ${platform}:`, error);
        return { success: false, error: 'Failed to disconnect integration' };
    }
}

/**
 * Get integration connection status
 */
export async function getCRMConnectionStatus(
    userId: string
): Promise<{
    followupboss: boolean;
    facebook_lead_ads: boolean;
    calendly: boolean;
    hubspot: boolean;
}> {
    try {
        const platforms = ['followupboss', 'facebook_lead_ads', 'calendly', 'hubspot'] as const;
        const statuses = await Promise.all(
            platforms.map(async (platform) => {
                const tokens = await getCRMTokens(userId, platform);
                return [platform, !!tokens];
            })
        );

        return Object.fromEntries(statuses) as any;
    } catch (error) {
        console.error('Failed to get connection status:', error);
        return {
            followupboss: false,
            facebook_lead_ads: false,
            calendly: false,
            hubspot: false,
        };
    }
}

/**
 * Sync Follow Up Boss leads
 */
export async function syncFollowUpBossLeads(
    userId: string,
    options?: { limit?: number; status?: string }
): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const tokens = await getCRMTokens(userId, 'followupboss');
        if (!tokens) {
            return { success: false, error: 'Not connected to Follow Up Boss' };
        }

        const client = createFollowUpBossClient(tokens.accessToken);
        const { leads, total } = await client.listLeads(options);

        // TODO: Implement lead import logic
        // - Map leads to internal client structure
        // - Create/update clients in database
        // - Handle duplicates

        return { success: true, count: leads.length };
    } catch (error) {
        console.error('Failed to sync Follow Up Boss leads:', error);
        return { success: false, error: 'Failed to sync leads' };
    }
}

/**
 * Get Calendly upcoming events
 */
export async function getCalendlyUpcomingEvents(
    userId: string,
    limit: number = 10
): Promise<{ success: boolean; events?: any[]; error?: string }> {
    try {
        const tokens = await getCRMTokens(userId, 'calendly');
        if (!tokens) {
            return { success: false, error: 'Not connected to Calendly' };
        }

        const client = createCalendlyClient(tokens.accessToken);
        const user = await client.getCurrentUser();

        const events = await client.listEvents({
            user: user.uri,
            min_start_time: new Date().toISOString(),
            status: 'active',
            count: limit,
        });

        return { success: true, events };
    } catch (error) {
        console.error('Failed to get Calendly events:', error);
        return { success: false, error: 'Failed to fetch events' };
    }
}

/**
 * Search HubSpot contacts
 */
export async function searchHubSpotContacts(
    userId: string,
    query: string
): Promise<{ success: boolean; contacts?: any[]; error?: string }> {
    try {
        const tokens = await getCRMTokens(userId, 'hubspot');
        if (!tokens) {
            return { success: false, error: 'Not connected to HubSpot' };
        }

        const client = createHubSpotClient(tokens.accessToken);
        const results = await client.searchContacts({
            filters: [{
                propertyName: 'email',
                operator: 'CONTAINS',
                value: query,
            }],
            limit: 20,
        });

        return { success: true, contacts: results.results };
    } catch (error) {
        console.error('Failed to search HubSpot contacts:', error);
        return { success: false, error: 'Failed to search contacts' };
    }
}

/**
 * Create HubSpot contact from client data
 */
export async function createHubSpotContactFromClient(
    userId: string,
    clientData: {
        email: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
    }
): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
        const tokens = await getCRMTokens(userId, 'hubspot');
        if (!tokens) {
            return { success: false, error: 'Not connected to HubSpot' };
        }

        const client = createHubSpotClient(tokens.accessToken);
        const contact = await client.createContact({
            email: clientData.email,
            firstname: clientData.firstName,
            lastname: clientData.lastName,
            phone: clientData.phone,
        });

        return { success: true, contactId: contact.id };
    } catch (error) {
        console.error('Failed to create HubSpot contact:', error);
        return { success: false, error: 'Failed to create contact' };
    }
}
