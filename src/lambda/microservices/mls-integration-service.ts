/**
 * MLS Integration Service
 * 
 * Handles data synchronization and integration with Multiple Listing Service (MLS)
 * systems, providing real-time property data updates and search capabilities.
 * 
 * **Validates: Requirements 6.3**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { z } from 'zod';

// Service configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'mls-integration-service',
    version: '1.0.0',
    description: 'MLS data synchronization and integration service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
};

// Zod schemas for request/response validation
const MLSDataSourceSchema = z.object({
    name: z.string().min(1, 'MLS name is required'),
    region: z.string().min(1, 'Region is required'),
    apiEndpoint: z.string().url('Valid API endpoint is required'),
    authMethod: z.enum(['api_key', 'oauth', 'basic']),
    credentials: z.object({
        apiKey: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        oauthToken: z.string().optional(),
    }),
    dataTypes: z.array(z.enum(['listings', 'sales', 'agents', 'offices', 'media'])).min(1),
    updateFrequency: z.enum(['realtime', 'hourly', 'daily']),
    enabled: z.boolean().default(true),
});

const SyncRequestSchema = z.object({
    sourceId: z.string().min(1, 'Source ID is required'),
    dataTypes: z.array(z.string()).optional(),
    lastSyncTime: z.string().optional(),
    fullSync: z.boolean().default(false),
});

const SearchRequestSchema = z.object({
    sourceId: z.string().min(1, 'Source ID is required'),
    searchCriteria: z.object({
        location: z.object({
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            coordinates: z.object({
                lat: z.number(),
                lng: z.number(),
                radius: z.number().optional(),
            }).optional(),
        }).optional(),
        priceRange: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
        }).optional(),
        propertyType: z.array(z.string()).optional(),
        bedrooms: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
        }).optional(),
        bathrooms: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
        }).optional(),
        squareFootage: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
        }).optional(),
        listingStatus: z.array(z.string()).optional(),
        daysOnMarket: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
        }).optional(),
    }),
    limit: z.number().int().min(1).max(1000).default(50),
    offset: z.number().int().min(0).default(0),
});

// Response types
interface MLSSyncResult {
    sourceId: string;
    syncId: string;
    recordsProcessed: number;
    recordsUpdated: number;
    recordsCreated: number;
    recordsDeleted: number;
    errors: Array<{
        recordId: string;
        error: string;
        severity: 'warning' | 'error';
    }>;
    syncDuration: number;
    completedAt: string;
    nextSyncScheduled?: string;
}

interface MLSSearchResult {
    sourceId: string;
    searchId: string;
    totalResults: number;
    returnedResults: number;
    listings: Array<{
        mlsId: string;
        address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            coordinates?: {
                lat: number;
                lng: number;
            };
        };
        price: number;
        propertyType: string;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        lotSize?: number;
        yearBuilt?: number;
        listingStatus: string;
        listingDate: string;
        daysOnMarket: number;
        description?: string;
        features?: string[];
        media?: Array<{
            type: 'image' | 'video' | 'virtual_tour';
            url: string;
            caption?: string;
        }>;
        agent: {
            name: string;
            phone?: string;
            email?: string;
            office?: string;
        };
        lastUpdated: string;
    }>;
    searchCriteria: any;
    executedAt: string;
}

interface MLSDataSource {
    id: string;
    name: string;
    region: string;
    apiEndpoint: string;
    authMethod: string;
    dataTypes: string[];
    updateFrequency: string;
    enabled: boolean;
    lastSync?: string;
    status: 'active' | 'inactive' | 'error';
    createdAt: string;
    updatedAt: string;
}

/**
 * MLS Integration Service Handler
 */
class MLSIntegrationServiceHandler extends BaseLambdaHandler {
    private dataSources: Map<string, MLSDataSource> = new Map();
    private syncHistory: Map<string, MLSSyncResult[]> = new Map();

    constructor() {
        super(SERVICE_CONFIG);
        this.initializeDefaultDataSources();
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const { httpMethod, path } = event;

        try {
            // Route requests based on path and method
            if (httpMethod === 'POST' && path.includes('/datasources/register')) {
                return await this.registerDataSource(event);
            }

            if (httpMethod === 'GET' && path.includes('/datasources/list')) {
                return await this.listDataSources(event);
            }

            if (httpMethod === 'POST' && path.includes('/sync/start')) {
                return await this.startSync(event);
            }

            if (httpMethod === 'GET' && path.includes('/sync/status')) {
                return await this.getSyncStatus(event);
            }

            if (httpMethod === 'POST' && path.includes('/search')) {
                return await this.searchListings(event);
            }

            if (httpMethod === 'GET' && path.includes('/listings')) {
                return await this.getListingDetails(event);
            }

            if (httpMethod === 'GET' && path.includes('/health')) {
                return this.createHealthCheckResponse();
            }

            return this.createErrorResponseData(
                'INVALID_ENDPOINT',
                `Endpoint ${httpMethod} ${path} not found`,
                404
            );

        } catch (error) {
            this.logger.error('Error handling request:', error);
            return this.createErrorResponseData(
                'INTERNAL_ERROR',
                'Internal server error occurred',
                500,
                { error: error instanceof Error ? error.message : String(error) }
            );
        }
    }

    /**
     * Register a new MLS data source
     */
    private async registerDataSource(event: APIGatewayProxyEvent): Promise<ApiResponse<{ success: boolean; sourceId: string }>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                MLSDataSourceSchema.parse(data)
            );

            // Validate data source connection
            const isValid = await this.executeWithCircuitBreaker(
                'validate-mls-connection',
                async () => this.validateDataSourceConnection(requestBody)
            );

            if (!isValid) {
                throw new Error('Failed to connect to MLS data source');
            }

            // Create data source
            const sourceId = `mls_${requestBody.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
            const dataSource: MLSDataSource = {
                id: sourceId,
                name: requestBody.name,
                region: requestBody.region,
                apiEndpoint: requestBody.apiEndpoint,
                authMethod: requestBody.authMethod,
                dataTypes: requestBody.dataTypes,
                updateFrequency: requestBody.updateFrequency,
                enabled: requestBody.enabled,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Store data source (in real implementation, use DynamoDB)
            this.dataSources.set(sourceId, dataSource);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Data Source Registered',
                {
                    sourceId,
                    name: requestBody.name,
                    region: requestBody.region,
                    dataTypes: requestBody.dataTypes,
                }
            );

            return this.createSuccessResponse({
                success: true,
                sourceId,
            });

        } catch (error) {
            return this.createErrorResponseData(
                'DATA_SOURCE_REGISTRATION_FAILED',
                error instanceof Error ? error.message : 'Failed to register data source',
                400
            );
        }
    }

    /**
     * List registered MLS data sources
     */
    private async listDataSources(event: APIGatewayProxyEvent): Promise<ApiResponse<MLSDataSource[]>> {
        try {
            const region = event.queryStringParameters?.region;
            const enabled = event.queryStringParameters?.enabled;

            let dataSources = Array.from(this.dataSources.values());

            // Apply filters
            if (region) {
                dataSources = dataSources.filter(ds =>
                    ds.region.toLowerCase().includes(region.toLowerCase())
                );
            }

            if (enabled !== undefined) {
                const isEnabled = enabled.toLowerCase() === 'true';
                dataSources = dataSources.filter(ds => ds.enabled === isEnabled);
            }

            return this.createSuccessResponse(dataSources);

        } catch (error) {
            return this.createErrorResponseData(
                'DATA_SOURCE_LIST_FAILED',
                error instanceof Error ? error.message : 'Failed to list data sources',
                500
            );
        }
    }

    /**
     * Start data synchronization
     */
    private async startSync(event: APIGatewayProxyEvent): Promise<ApiResponse<MLSSyncResult>> {
        const startTime = Date.now();

        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                SyncRequestSchema.parse(data)
            );

            const { sourceId, dataTypes, lastSyncTime, fullSync } = requestBody;

            // Validate data source exists
            const dataSource = this.dataSources.get(sourceId);
            if (!dataSource) {
                throw new Error('Data source not found');
            }

            if (!dataSource.enabled) {
                throw new Error('Data source is disabled');
            }

            // Perform synchronization
            const syncResult = await this.executeWithCircuitBreaker(
                'perform-mls-sync',
                async () => this.performDataSync(dataSource, {
                    dataTypes: dataTypes || dataSource.dataTypes,
                    lastSyncTime,
                    fullSync,
                })
            );

            // Update data source last sync time
            dataSource.lastSync = syncResult.completedAt;
            dataSource.updatedAt = new Date().toISOString();

            // Store sync history
            const sourceHistory = this.syncHistory.get(sourceId) || [];
            sourceHistory.push(syncResult);
            // Keep only last 10 sync results
            if (sourceHistory.length > 10) {
                sourceHistory.shift();
            }
            this.syncHistory.set(sourceId, sourceHistory);

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Sync Completed',
                {
                    sourceId,
                    syncId: syncResult.syncId,
                    recordsProcessed: syncResult.recordsProcessed,
                    recordsUpdated: syncResult.recordsUpdated,
                    recordsCreated: syncResult.recordsCreated,
                    syncDuration: syncResult.syncDuration,
                    errorCount: syncResult.errors.length,
                }
            );

            return this.createSuccessResponse(syncResult);

        } catch (error) {
            return this.createErrorResponseData(
                'SYNC_FAILED',
                error instanceof Error ? error.message : 'Data synchronization failed',
                500
            );
        }
    }

    /**
     * Get synchronization status
     */
    private async getSyncStatus(event: APIGatewayProxyEvent): Promise<ApiResponse<{
        sourceId: string;
        lastSync?: string;
        status: string;
        recentSyncs: MLSSyncResult[];
    }>> {
        try {
            const sourceId = event.queryStringParameters?.sourceId;
            if (!sourceId) {
                throw new Error('Source ID is required');
            }

            const dataSource = this.dataSources.get(sourceId);
            if (!dataSource) {
                throw new Error('Data source not found');
            }

            const recentSyncs = this.syncHistory.get(sourceId) || [];

            return this.createSuccessResponse({
                sourceId,
                lastSync: dataSource.lastSync,
                status: dataSource.status,
                recentSyncs: recentSyncs.slice(-5), // Last 5 syncs
            });

        } catch (error) {
            return this.createErrorResponseData(
                'SYNC_STATUS_FAILED',
                error instanceof Error ? error.message : 'Failed to get sync status',
                400
            );
        }
    }

    /**
     * Search MLS listings
     */
    private async searchListings(event: APIGatewayProxyEvent): Promise<ApiResponse<MLSSearchResult>> {
        try {
            const requestBody = this.validateRequestBody(event, (data) =>
                SearchRequestSchema.parse(data)
            );

            const { sourceId, searchCriteria, limit, offset } = requestBody;

            // Validate data source exists
            const dataSource = this.dataSources.get(sourceId);
            if (!dataSource) {
                throw new Error('Data source not found');
            }

            // Perform search
            const searchResult = await this.executeWithCircuitBreaker(
                'search-mls-listings',
                async () => this.performListingSearch(dataSource, searchCriteria, limit, offset)
            );

            await this.publishServiceEvent(
                EventSource.INTEGRATION,
                'Search Executed',
                {
                    sourceId,
                    searchId: searchResult.searchId,
                    totalResults: searchResult.totalResults,
                    returnedResults: searchResult.returnedResults,
                }
            );

            return this.createSuccessResponse(searchResult);

        } catch (error) {
            return this.createErrorResponseData(
                'SEARCH_FAILED',
                error instanceof Error ? error.message : 'Listing search failed',
                400
            );
        }
    }

    /**
     * Get detailed listing information
     */
    private async getListingDetails(event: APIGatewayProxyEvent): Promise<ApiResponse<any>> {
        try {
            const mlsId = event.queryStringParameters?.mlsId;
            const sourceId = event.queryStringParameters?.sourceId;

            if (!mlsId || !sourceId) {
                throw new Error('MLS ID and Source ID are required');
            }

            // Validate data source exists
            const dataSource = this.dataSources.get(sourceId);
            if (!dataSource) {
                throw new Error('Data source not found');
            }

            // Fetch listing details
            const listingDetails = await this.executeWithCircuitBreaker(
                'fetch-listing-details',
                async () => this.fetchListingDetails(dataSource, mlsId)
            );

            return this.createSuccessResponse(listingDetails);

        } catch (error) {
            return this.createErrorResponseData(
                'LISTING_DETAILS_FAILED',
                error instanceof Error ? error.message : 'Failed to fetch listing details',
                400
            );
        }
    }

    // Helper methods
    private async validateDataSourceConnection(dataSource: any): Promise<boolean> {
        // In real implementation, test connection to MLS API
        // For now, simulate validation
        return dataSource.apiEndpoint.startsWith('http') &&
            dataSource.name.length > 0 &&
            dataSource.dataTypes.length > 0;
    }

    private async performDataSync(dataSource: MLSDataSource, options: {
        dataTypes: string[];
        lastSyncTime?: string;
        fullSync: boolean;
    }): Promise<MLSSyncResult> {
        const startTime = Date.now();

        // Simulate data processing
        const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
        const recordsUpdated = Math.floor(recordsProcessed * 0.3);
        const recordsCreated = Math.floor(recordsProcessed * 0.6);
        const recordsDeleted = Math.floor(recordsProcessed * 0.1);

        // Simulate some errors
        const errors: Array<{
            recordId: string;
            error: string;
            severity: 'warning' | 'error';
        }> = [];
        const errorCount = Math.floor(Math.random() * 5);
        for (let i = 0; i < errorCount; i++) {
            errors.push({
                recordId: `record_${i}`,
                error: 'Data validation failed',
                severity: Math.random() > 0.5 ? 'warning' : 'error',
            });
        }

        // Calculate next sync time based on frequency
        let nextSyncScheduled: string | undefined;
        if (dataSource.updateFrequency === 'hourly') {
            nextSyncScheduled = new Date(Date.now() + 3600000).toISOString();
        } else if (dataSource.updateFrequency === 'daily') {
            nextSyncScheduled = new Date(Date.now() + 86400000).toISOString();
        }

        return {
            sourceId: dataSource.id,
            syncId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recordsProcessed,
            recordsUpdated,
            recordsCreated,
            recordsDeleted,
            errors,
            syncDuration: Date.now() - startTime,
            completedAt: new Date().toISOString(),
            nextSyncScheduled,
        };
    }

    private async performListingSearch(
        dataSource: MLSDataSource,
        searchCriteria: any,
        limit: number,
        offset: number
    ): Promise<MLSSearchResult> {
        // Simulate search processing
        const totalResults = Math.floor(Math.random() * 500) + 50;
        const returnedResults = Math.min(limit, totalResults - offset);

        // Generate mock listings
        const listings = [];
        for (let i = 0; i < returnedResults; i++) {
            listings.push({
                mlsId: `MLS${Date.now()}${i}`,
                address: {
                    street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
                    city: 'Sample City',
                    state: 'CA',
                    zipCode: '90210',
                    coordinates: {
                        lat: 34.0522 + (Math.random() - 0.5) * 0.1,
                        lng: -118.2437 + (Math.random() - 0.5) * 0.1,
                    },
                },
                price: Math.floor(Math.random() * 1000000) + 200000,
                propertyType: 'Single Family Home',
                bedrooms: Math.floor(Math.random() * 5) + 1,
                bathrooms: Math.floor(Math.random() * 4) + 1,
                squareFootage: Math.floor(Math.random() * 2000) + 800,
                yearBuilt: Math.floor(Math.random() * 50) + 1970,
                listingStatus: 'Active',
                listingDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                daysOnMarket: Math.floor(Math.random() * 90),
                description: 'Beautiful home in great location',
                features: ['Garage', 'Pool', 'Garden'],
                agent: {
                    name: 'John Doe',
                    phone: '+1-555-123-4567',
                    email: 'john.doe@realty.com',
                    office: 'Sample Realty',
                },
                lastUpdated: new Date().toISOString(),
            });
        }

        return {
            sourceId: dataSource.id,
            searchId: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            totalResults,
            returnedResults,
            listings,
            searchCriteria,
            executedAt: new Date().toISOString(),
        };
    }

    private async fetchListingDetails(dataSource: MLSDataSource, mlsId: string): Promise<any> {
        // In real implementation, fetch from MLS API
        // For now, return mock detailed listing
        return {
            mlsId,
            address: {
                street: '123 Main St',
                city: 'Sample City',
                state: 'CA',
                zipCode: '90210',
                coordinates: {
                    lat: 34.0522,
                    lng: -118.2437,
                },
            },
            price: 750000,
            propertyType: 'Single Family Home',
            bedrooms: 3,
            bathrooms: 2,
            squareFootage: 1500,
            lotSize: 6000,
            yearBuilt: 1985,
            listingStatus: 'Active',
            listingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            daysOnMarket: 7,
            description: 'Charming 3-bedroom home with updated kitchen and beautiful backyard.',
            features: ['Updated Kitchen', 'Hardwood Floors', 'Fireplace', 'Garage', 'Pool'],
            media: [
                {
                    type: 'image',
                    url: 'https://example.com/image1.jpg',
                    caption: 'Front view',
                },
                {
                    type: 'image',
                    url: 'https://example.com/image2.jpg',
                    caption: 'Kitchen',
                },
            ],
            agent: {
                name: 'Jane Smith',
                phone: '+1-555-987-6543',
                email: 'jane.smith@realty.com',
                office: 'Premium Realty Group',
            },
            lastUpdated: new Date().toISOString(),
            sourceId: dataSource.id,
        };
    }

    private initializeDefaultDataSources(): void {
        // Initialize with some sample MLS data sources
        const sampleSources = [
            {
                id: 'mls_nwmls_sample',
                name: 'NWMLS',
                region: 'Pacific Northwest',
                apiEndpoint: 'https://api.nwmls.com/v1',
                authMethod: 'api_key',
                dataTypes: ['listings', 'sales', 'agents'],
                updateFrequency: 'hourly',
                enabled: true,
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'mls_crmls_sample',
                name: 'CRMLS',
                region: 'California',
                apiEndpoint: 'https://api.crmls.org/v2',
                authMethod: 'oauth',
                dataTypes: ['listings', 'sales', 'media'],
                updateFrequency: 'realtime',
                enabled: true,
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];

        sampleSources.forEach(source => {
            this.dataSources.set(source.id, source);
        });
    }
}

// Export the Lambda handler
export const handler = new MLSIntegrationServiceHandler().lambdaHandler.bind(
    new MLSIntegrationServiceHandler()
);