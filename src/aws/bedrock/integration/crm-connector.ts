/**
 * CRM Connector
 * 
 * Integrates with CRM systems to pull client data, personalize content,
 * and sync activities back to the CRM.
 * 
 * Requirements: 12.2
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type {
    ClientData,
    ActivityRecord,
} from './types';

/**
 * CRM Connector Configuration
 */
export interface CRMConnectorConfig {
    /**
     * Default CRM provider to use
     */
    defaultProvider?: CRMProvider;

    /**
     * Whether to automatically sync activities
     */
    autoSync?: boolean;

    /**
     * Cache TTL for client data (in seconds)
     */
    cacheTTL?: number;

    /**
     * Maximum number of retries for failed operations
     */
    maxRetries?: number;
}

/**
 * Supported CRM providers
 */
export type CRMProvider = 'hubspot' | 'followupboss' | 'salesforce' | 'custom';

/**
 * CRM credentials stored in DynamoDB
 */
interface CRMCredentials {
    provider: CRMProvider;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    metadata?: Record<string, any>;
}

/**
 * Personalization context for content
 */
export interface PersonalizationContext {
    clientData: ClientData;
    contentType: string;
    template?: string;
    variables?: Record<string, any>;
}

/**
 * Personalized content result
 */
export interface PersonalizedContent {
    content: string;
    variables: Record<string, string>;
    clientId: string;
    personalizedAt: string;
}

/**
 * CRM Connector Class
 * 
 * Provides integration with CRM systems for client data retrieval,
 * content personalization, and activity syncing.
 */
export class CRMConnector {
    private config: Required<CRMConnectorConfig>;
    private repository = getRepository();
    private clientCache: Map<string, { data: ClientData; expiresAt: number }> = new Map();

    constructor(config: CRMConnectorConfig = {}) {
        this.config = {
            defaultProvider: config.defaultProvider || 'hubspot',
            autoSync: config.autoSync ?? true,
            cacheTTL: config.cacheTTL || 300, // 5 minutes
            maxRetries: config.maxRetries || 3,
        };
    }

    /**
     * Get client data from CRM
     * 
     * Retrieves client information from the connected CRM system,
     * with caching to reduce API calls.
     * 
     * @param clientId - CRM client ID
     * @param userId - User ID for credential lookup
     * @returns Client data including contact info, preferences, and history
     */
    async getClientData(clientId: string, userId: string): Promise<ClientData> {
        // Check cache first
        const cached = this.clientCache.get(clientId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }

        // Get CRM credentials
        const credentials = await this.getCRMCredentials(userId);
        if (!credentials) {
            throw new Error('No CRM credentials found for user');
        }

        // Fetch from CRM provider
        const clientData = await this.fetchClientFromProvider(
            clientId,
            credentials
        );

        // Cache the result
        this.clientCache.set(clientId, {
            data: clientData,
            expiresAt: Date.now() + this.config.cacheTTL * 1000,
        });

        return clientData;
    }

    /**
     * Personalize content with CRM data
     * 
     * Takes generic content and personalizes it using client data
     * from the CRM, replacing variables and customizing messaging.
     * 
     * @param content - Original content to personalize
     * @param context - Personalization context with client data
     * @returns Personalized content with replaced variables
     */
    async personalizeContent(
        content: string,
        context: PersonalizationContext
    ): Promise<PersonalizedContent> {
        const { clientData, variables = {} } = context;

        // Build personalization variables
        const personalizedVars: Record<string, string> = {
            // Client name variations
            firstName: clientData.name.split(' ')[0] || '',
            lastName: clientData.name.split(' ').slice(1).join(' ') || '',
            fullName: clientData.name,

            // Contact information
            email: clientData.email,
            phone: clientData.phone || '',

            // Custom fields
            ...this.extractCustomFields(clientData),

            // User-provided variables
            ...variables,
        };

        // Replace variables in content
        let personalizedContent = content;
        for (const [key, value] of Object.entries(personalizedVars)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            personalizedContent = personalizedContent.replace(regex, value);
        }

        // Apply preference-based customization
        if (clientData.preferences) {
            personalizedContent = this.applyPreferences(
                personalizedContent,
                clientData.preferences
            );
        }

        return {
            content: personalizedContent,
            variables: personalizedVars,
            clientId: clientData.id,
            personalizedAt: new Date().toISOString(),
        };
    }

    /**
     * Sync activity to CRM
     * 
     * Records an activity in the CRM system, such as email sent,
     * content shared, or property viewed.
     * 
     * @param activity - Activity record to sync
     * @returns Success status
     */
    async syncActivity(activity: ActivityRecord): Promise<boolean> {
        if (!this.config.autoSync) {
            // Store locally for manual sync
            await this.storeActivityLocally(activity);
            return true;
        }

        // Get CRM credentials
        const credentials = await this.getCRMCredentials(activity.userId);
        if (!credentials) {
            console.warn('No CRM credentials found, storing activity locally');
            await this.storeActivityLocally(activity);
            return false;
        }

        // Sync to CRM provider with retries
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                await this.syncActivityToProvider(activity, credentials);
                return true;
            } catch (error) {
                lastError = error as Error;
                console.warn(`Activity sync attempt ${attempt + 1} failed:`, error);

                // Exponential backoff
                if (attempt < this.config.maxRetries - 1) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }

        // All retries failed, store locally
        console.error('Failed to sync activity after retries:', lastError);
        await this.storeActivityLocally(activity);
        return false;
    }

    /**
     * Batch sync multiple activities
     * 
     * @param activities - Array of activities to sync
     * @returns Array of success statuses
     */
    async batchSyncActivities(activities: ActivityRecord[]): Promise<boolean[]> {
        const results = await Promise.allSettled(
            activities.map(activity => this.syncActivity(activity))
        );

        return results.map(result =>
            result.status === 'fulfilled' ? result.value : false
        );
    }

    /**
     * Get CRM credentials for a user
     */
    private async getCRMCredentials(userId: string): Promise<CRMCredentials | null> {
        try {
            const item = await this.repository.getItem(
                `USER#${userId}`,
                `CRM_CREDENTIALS#${this.config.defaultProvider}`
            );

            if (!item) {
                return null;
            }

            return {
                provider: item.provider as CRMProvider,
                accessToken: item.accessToken as string,
                refreshToken: item.refreshToken as string | undefined,
                expiresAt: item.expiresAt as string | undefined,
                metadata: item.metadata as Record<string, any> | undefined,
            };
        } catch (error) {
            console.error('Failed to get CRM credentials:', error);
            return null;
        }
    }

    /**
     * Fetch client data from CRM provider
     */
    private async fetchClientFromProvider(
        clientId: string,
        credentials: CRMCredentials
    ): Promise<ClientData> {
        // This is a simplified implementation
        // In production, this would call the actual CRM API

        switch (credentials.provider) {
            case 'hubspot':
                return await this.fetchFromHubSpot(clientId, credentials);
            case 'followupboss':
                return await this.fetchFromFollowUpBoss(clientId, credentials);
            case 'salesforce':
                return await this.fetchFromSalesforce(clientId, credentials);
            default:
                throw new Error(`Unsupported CRM provider: ${credentials.provider}`);
        }
    }

    /**
     * Fetch client from HubSpot
     */
    private async fetchFromHubSpot(
        clientId: string,
        credentials: CRMCredentials
    ): Promise<ClientData> {
        // Import HubSpot client dynamically to avoid circular dependencies
        const { HubSpotClient } = await import('@/integrations/crm/hubspot/client');

        const client = new HubSpotClient(credentials.accessToken);
        const contact = await client.getContact(clientId);

        return {
            id: contact.id,
            name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
            email: contact.properties.email,
            phone: contact.properties.phone,
            preferences: {},
            history: [],
            tags: [],
            customFields: contact.properties,
        };
    }

    /**
     * Fetch client from Follow Up Boss
     */
    private async fetchFromFollowUpBoss(
        clientId: string,
        credentials: CRMCredentials
    ): Promise<ClientData> {
        // Placeholder for Follow Up Boss integration
        // Would implement actual API calls here
        throw new Error('Follow Up Boss integration not yet implemented');
    }

    /**
     * Fetch client from Salesforce
     */
    private async fetchFromSalesforce(
        clientId: string,
        credentials: CRMCredentials
    ): Promise<ClientData> {
        // Placeholder for Salesforce integration
        // Would implement actual API calls here
        throw new Error('Salesforce integration not yet implemented');
    }

    /**
     * Sync activity to CRM provider
     */
    private async syncActivityToProvider(
        activity: ActivityRecord,
        credentials: CRMCredentials
    ): Promise<void> {
        switch (credentials.provider) {
            case 'hubspot':
                await this.syncToHubSpot(activity, credentials);
                break;
            case 'followupboss':
                await this.syncToFollowUpBoss(activity, credentials);
                break;
            case 'salesforce':
                await this.syncToSalesforce(activity, credentials);
                break;
            default:
                throw new Error(`Unsupported CRM provider: ${credentials.provider}`);
        }
    }

    /**
     * Sync activity to HubSpot
     */
    private async syncToHubSpot(
        activity: ActivityRecord,
        credentials: CRMCredentials
    ): Promise<void> {
        const { HubSpotClient } = await import('@/integrations/crm/hubspot/client');

        const client = new HubSpotClient(credentials.accessToken);

        // Create timeline event in HubSpot
        await client.createTimelineEvent({
            eventTemplateId: 'content_activity',
            email: activity.metadata?.email as string,
            tokens: {
                activityType: activity.type,
                description: activity.description,
                timestamp: activity.timestamp,
            },
        });
    }

    /**
     * Sync activity to Follow Up Boss
     */
    private async syncToFollowUpBoss(
        activity: ActivityRecord,
        credentials: CRMCredentials
    ): Promise<void> {
        // Placeholder for Follow Up Boss integration
        throw new Error('Follow Up Boss integration not yet implemented');
    }

    /**
     * Sync activity to Salesforce
     */
    private async syncToSalesforce(
        activity: ActivityRecord,
        credentials: CRMCredentials
    ): Promise<void> {
        // Placeholder for Salesforce integration
        throw new Error('Salesforce integration not yet implemented');
    }

    /**
     * Store activity locally for later sync
     */
    private async storeActivityLocally(activity: ActivityRecord): Promise<void> {
        const activityId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await this.repository.putItem({
            PK: `USER#${activity.userId}`,
            SK: `PENDING_ACTIVITY#${activityId}`,
            EntityType: 'PendingActivity',
            ...activity,
            storedAt: new Date().toISOString(),
        });
    }

    /**
     * Extract custom fields from client data
     */
    private extractCustomFields(clientData: ClientData): Record<string, string> {
        const fields: Record<string, string> = {};

        if (clientData.customFields) {
            for (const [key, value] of Object.entries(clientData.customFields)) {
                if (typeof value === 'string' || typeof value === 'number') {
                    fields[key] = String(value);
                }
            }
        }

        return fields;
    }

    /**
     * Apply client preferences to content
     */
    private applyPreferences(
        content: string,
        preferences: Record<string, any>
    ): string {
        // Apply communication preferences
        if (preferences.communicationStyle === 'formal') {
            // Make content more formal
            content = content.replace(/hey/gi, 'Hello');
            content = content.replace(/thanks/gi, 'Thank you');
        } else if (preferences.communicationStyle === 'casual') {
            // Make content more casual
            content = content.replace(/Hello/g, 'Hey');
            content = content.replace(/Thank you/g, 'Thanks');
        }

        // Apply language preferences
        if (preferences.language && preferences.language !== 'en') {
            // In production, would translate content here
            console.log(`Content translation to ${preferences.language} not yet implemented`);
        }

        return content;
    }

    /**
     * Delay helper for retries
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear client cache
     */
    clearCache(): void {
        this.clientCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; entries: string[] } {
        return {
            size: this.clientCache.size,
            entries: Array.from(this.clientCache.keys()),
        };
    }
}
