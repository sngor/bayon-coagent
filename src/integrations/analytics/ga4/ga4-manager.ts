/**
 * GA4 Integration Manager
 * 
 * Main integration service for Google Analytics 4.
 * Manages configuration and provides unified interface to Measurement Protocol and Data API.
 */

import {
    IntegrationProvider,
    IntegrationType,
    IntegrationConnection,
    IntegrationResult,
    IntegrationCredentials
} from '../../types';
import { IntegrationService } from '../../integration-manager';
import { integrationRepository } from '../../integration-repository';
import { MeasurementClient } from './measurement-client';
import { DataAPIClient } from './data-api-client';
import { GA4Config, GA4Event, GA4ConnectionMetadata } from './types';

/**
 * GA4 Integration Manager
 */
class GA4Manager implements IntegrationService {
    provider: IntegrationProvider = 'google-analytics';
    type: IntegrationType = 'analytics';

    private measurementClient: MeasurementClient | null = null;
    private dataAPIClient: DataAPIClient | null = null;

    /**
     * Connect GA4 (configure with API credentials)
     */
    async connect(userId: string, config?: GA4Config): Promise<IntegrationResult<string>> {
        try {
            if (!config) {
                return {
                    success: false,
                    error: 'GA4 configuration required'
                };
            }

            // Validate configuration
            if (!config.measurementId || !config.apiSecret) {
                return {
                    success: false,
                    error: 'Measurement ID and API Secret are required'
                };
            }

            // Create clients
            this.measurementClient = new MeasurementClient(config);

            if (config.propertyId) {
                this.dataAPIClient = new DataAPIClient(config.propertyId);
            }

            // Create integration connection
            const credentials: IntegrationCredentials = {
                provider: 'google-analytics',
                authMethod: 'api_key',
                apiKey: config.apiSecret,
                metadata: {
                    measurementId: config.measurementId,
                    propertyId: config.propertyId,
                    streamId: config.streamId
                }
            };

            const connection: IntegrationConnection = {
                id: `ga4#${Date.now()}`,
                userId,
                provider: 'google-analytics',
                type: 'analytics',
                status: 'active',
                credentials,
                metadata: {
                    measurementId: config.measurementId,
                    propertyId: config.propertyId,
                    streamId: config.streamId,
                    clientId: MeasurementClient.generateClientId()
                } as GA4ConnectionMetadata,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // Store connection
            await integrationRepository.create(connection);

            return {
                success: true,
                data: 'GA4 connected successfully'
            };
        } catch (error) {
            console.error('Failed to connect GA4:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection failed'
            };
        }
    }

    /**
     * Disconnect GA4
     */
    async disconnect(userId: string): Promise<IntegrationResult<void>> {
        try {
            await integrationRepository.deleteByProvider(userId, 'google-analytics');

            this.measurementClient = null;
            this.dataAPIClient = null;

            return {
                success: true
            };
        } catch (error) {
            console.error('Failed to disconnect GA4:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Disconnection failed'
            };
        }
    }

    /**
     * Validate GA4 connection
     */
    async validate(connection: IntegrationConnection): Promise<IntegrationResult<boolean>> {
        try {
            // For GA4, we can validate by sending a test event
            const config: GA4Config = {
                measurementId: connection.metadata.measurementId as string,
                apiSecret: connection.credentials.apiKey || '',
                propertyId: connection.metadata.propertyId as string
            };

            const testClient = new MeasurementClient(config);
            testClient.setDebugMode(true);

            const clientId = connection.metadata.clientId as string || MeasurementClient.generateClientId();

            const result = await testClient.sendEvent(
                clientId,
                {
                    name: 'page_view',
                    params: {
                        page_title: 'Validation Test',
                        page_location: '/test'
                    }
                }
            );

            return {
                success: result.success,
                data: result.success
            };
        } catch (error) {
            console.error('Failed to validate GA4 connection:', error);
            return {
                success: false,
                data: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Get or initialize measurement client
     */
    async getMeasurementClient(userId: string): Promise<MeasurementClient | null> {
        try {
            if (this.measurementClient) {
                return this.measurementClient;
            }

            const connection = await integrationRepository.getByProvider(userId, 'google-analytics');

            if (!connection) {
                return null;
            }

            const config: GA4Config = {
                measurementId: connection.metadata.measurementId as string,
                apiSecret: connection.credentials.apiKey || '',
                propertyId: connection.metadata.propertyId as string
            };

            this.measurementClient = new MeasurementClient(config);

            return this.measurementClient;
        } catch (error) {
            console.error('Failed to get measurement client:', error);
            return null;
        }
    }

    /**
     * Get or initialize data API client
     */
    async getDataAPIClient(userId: string): Promise<DataAPIClient | null> {
        try {
            if (this.dataAPIClient) {
                return this.dataAPIClient;
            }

            const connection = await integrationRepository.getByProvider(userId, 'google-analytics');

            if (!connection || !connection.metadata.propertyId) {
                return null;
            }

            this.dataAPIClient = new DataAPIClient(connection.metadata.propertyId as string);

            return this.dataAPIClient;
        } catch (error) {
            console.error('Failed to get data API client:', error);
            return null;
        }
    }

    /**
     * Track event
     */
    async trackEvent(
        userId: string,
        event: GA4Event
    ): Promise<IntegrationResult<void>> {
        try {
            const connection = await integrationRepository.getByProvider(userId, 'google-analytics');

            if (!connection) {
                return {
                    success: false,
                    error: 'GA4 not connected'
                };
            }

            const client = await this.getMeasurementClient(userId);

            if (!client) {
                return {
                    success: false,
                    error: 'Failed to initialize measurement client'
                };
            }

            const clientId = connection.metadata.clientId as string;
            const result = await client.sendEvent(clientId, event, userId);

            if (result.success) {
                // Update last synced timestamp
                const updatedConnection: IntegrationConnection = {
                    ...connection,
                    metadata: {
                        ...connection.metadata,
                        lastSyncedAt: Date.now()
                    },
                    updatedAt: Date.now()
                };

                await integrationRepository.update(updatedConnection);
            }

            return {
                success: result.success,
                error: result.error
            };
        } catch (error) {
            console.error('Failed to track GA4 event:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Event tracking failed'
            };
        }
    }
}

// Export singleton instance
export const ga4Manager = new GA4Manager();
