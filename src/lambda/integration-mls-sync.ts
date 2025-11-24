/**
 * MLS Data Sync Integration Lambda
 * 
 * Handles MLS listing data synchronization.
 * 
 * Requirements: 1.1, 6.4 - MLS integration with secure credential management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getMLSAPICredentials } from '../aws/secrets-manager/client';
import { getRepository } from '../aws/dynamodb/repository';
import { uploadFile } from '../aws/s3/client';
import { withCircuitBreaker } from '../lib/circuit-breaker';
import { publishIntegrationSyncCompletedEvent } from './utils/eventbridge-client';

interface MLSSyncRequest {
    userId: string;
    provider: 'mlsgrid' | 'bridgeInteractive';
    agentId: string;
    syncType?: 'full' | 'incremental';
}

interface MLSListing {
    mlsId: string;
    mlsNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    propertyType: string;
    status: string;
    listDate: string;
    description: string;
    photos: Array<{
        url: string;
        caption?: string;
        order: number;
    }>;
    features: string[];
}

/**
 * Lambda handler for MLS data synchronization
 * 
 * POST /mls/sync - Trigger MLS data sync
 * GET /mls/status/{syncId} - Get sync status
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    console.log('MLS sync event:', JSON.stringify(event, null, 2));

    const path = event.path;
    const httpMethod = event.httpMethod;

    try {
        if (path.endsWith('/sync') && httpMethod === 'POST') {
            return await handleSync(event);
        } else if (path.includes('/status/') && httpMethod === 'GET') {
            return await handleStatus(event);
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Endpoint not found',
                    },
                }),
            };
        }
    } catch (error) {
        console.error('MLS sync error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Internal server error',
                },
            }),
        };
    }
}

/**
 * Handle MLS sync request
 */
async function handleSync(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    if (!event.body) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'MISSING_BODY',
                    message: 'Request body is required',
                },
            }),
        };
    }

    const request: MLSSyncRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.userId || !request.provider || !request.agentId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'userId, provider, and agentId are required',
                },
            }),
        };
    }

    // Get MLS API credentials from Secrets Manager
    const credentials = await getMLSAPICredentials();

    const syncId = `sync-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const repository = getRepository();

    // Create sync job record
    await repository.createItem(request.userId, `MLSSYNC#${syncId}`, {
        syncId,
        provider: request.provider,
        agentId: request.agentId,
        syncType: request.syncType || 'full',
        status: 'in_progress',
        startedAt: Date.now(),
        totalListings: 0,
        syncedListings: 0,
        failedListings: 0,
    });

    // Fetch listings from MLS provider
    let listings: MLSListing[];
    try {
        if (request.provider === 'mlsgrid') {
            listings = await fetchMLSGridListings(
                credentials.mlsgrid,
                request.agentId
            );
        } else {
            listings = await fetchBridgeListings(
                credentials.bridgeInteractive,
                request.agentId
            );
        }
    } catch (error) {
        console.error('Failed to fetch listings:', error);

        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch listings';

        await repository.updateItem(request.userId, `MLSSYNC#${syncId}`, {
            status: 'failed',
            error: errorMessage,
            completedAt: Date.now(),
        });

        // Publish Integration Sync Failed event
        await publishIntegrationSyncCompletedEvent({
            syncId,
            userId: request.userId,
            provider: request.provider,
            status: 'failed',
            completedAt: new Date().toISOString(),
            error: errorMessage,
            traceId: process.env._X_AMZN_TRACE_ID,
        });

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'FETCH_FAILED',
                    message: 'Failed to fetch listings from MLS provider',
                },
            }),
        };
    }

    // Process listings
    let syncedCount = 0;
    let failedCount = 0;

    for (const listing of listings) {
        try {
            // Download and store photos
            const storedPhotos = await Promise.all(
                listing.photos.map(async (photo, index) => {
                    try {
                        const response = await fetch(photo.url);
                        if (!response.ok) {
                            throw new Error(`Failed to download photo: ${response.statusText}`);
                        }

                        const blob = await response.blob();
                        const buffer = Buffer.from(await blob.arrayBuffer());

                        const fileExtension = photo.url.split('.').pop()?.split('?')[0] || 'jpg';
                        const s3Key = `listings/${request.userId}/${listing.mlsNumber}/photo${index}.${fileExtension}`;

                        const s3Url = await uploadFile(
                            s3Key,
                            buffer,
                            blob.type || 'image/jpeg',
                            {
                                listingId: listing.mlsNumber,
                                photoIndex: index.toString(),
                                originalUrl: photo.url,
                            }
                        );

                        return {
                            url: s3Url,
                            caption: photo.caption,
                            order: photo.order,
                            originalUrl: photo.url,
                        };
                    } catch (error) {
                        console.error(`Failed to store photo ${index}:`, error);
                        return {
                            url: photo.url,
                            caption: photo.caption,
                            order: photo.order,
                            originalUrl: photo.url,
                        };
                    }
                })
            );

            // Store listing in DynamoDB
            await repository.createItem(request.userId, `LISTING#${listing.mlsNumber}`, {
                listingId: listing.mlsNumber,
                mlsId: listing.mlsId,
                mlsNumber: listing.mlsNumber,
                mlsProvider: request.provider,
                address: listing.address,
                price: listing.price,
                bedrooms: listing.bedrooms,
                bathrooms: listing.bathrooms,
                squareFeet: listing.squareFeet,
                propertyType: listing.propertyType,
                status: listing.status,
                listDate: listing.listDate,
                description: listing.description,
                photos: storedPhotos,
                features: listing.features,
                syncedAt: Date.now(),
                syncId,
            });

            syncedCount++;
        } catch (error) {
            console.error(`Failed to process listing ${listing.mlsNumber}:`, error);
            failedCount++;
        }
    }

    // Update sync job record
    await repository.updateItem(request.userId, `MLSSYNC#${syncId}`, {
        status: 'completed',
        totalListings: listings.length,
        syncedListings: syncedCount,
        failedListings: failedCount,
        completedAt: Date.now(),
    });

    // Publish Integration Sync Completed event
    await publishIntegrationSyncCompletedEvent({
        syncId,
        userId: request.userId,
        provider: request.provider,
        status: 'completed',
        itemsSynced: syncedCount,
        completedAt: new Date().toISOString(),
        traceId: process.env._X_AMZN_TRACE_ID,
    });

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            success: true,
            data: {
                syncId,
                totalListings: listings.length,
                syncedListings: syncedCount,
                failedListings: failedCount,
            },
        }),
    };
}

/**
 * Handle sync status request
 */
async function handleStatus(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    const syncId = event.pathParameters?.syncId;
    const userId = event.queryStringParameters?.userId;

    if (!syncId || !userId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'syncId and userId are required',
                },
            }),
        };
    }

    const repository = getRepository();
    const syncJob = await repository.getItem(userId, `MLSSYNC#${syncId}`);

    if (!syncJob) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Sync job not found',
                },
            }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            success: true,
            data: syncJob,
        }),
    };
}

/**
 * Fetch listings from MLSGrid
 */
async function fetchMLSGridListings(
    credentials: { apiKey: string; apiSecret: string; baseUrl: string },
    agentId: string
): Promise<MLSListing[]> {
    const response = await withCircuitBreaker(
        'mlsgrid-api',
        async () => {
            return fetch(
                `${credentials.baseUrl}/listings?agentId=${agentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${credentials.apiKey}`,
                        'X-API-Secret': credentials.apiSecret,
                        'Content-Type': 'application/json',
                    },
                }
            );
        },
        {
            failureThreshold: 5,
            recoveryTimeout: 60000, // 1 minute
            requestTimeout: 30000, // 30 seconds
        }
    );

    if (!response.ok) {
        throw new Error(`MLSGrid API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.listings || [];
}

/**
 * Fetch listings from Bridge Interactive
 */
async function fetchBridgeListings(
    credentials: { apiKey: string; baseUrl: string },
    agentId: string
): Promise<MLSListing[]> {
    const response = await withCircuitBreaker(
        'bridge-api',
        async () => {
            return fetch(
                `${credentials.baseUrl}/listings?agentId=${agentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${credentials.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        },
        {
            failureThreshold: 5,
            recoveryTimeout: 60000, // 1 minute
            requestTimeout: 30000, // 30 seconds
        }
    );

    if (!response.ok) {
        throw new Error(`Bridge API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.listings || [];
}
