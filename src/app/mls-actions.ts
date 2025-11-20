'use server';

/**
 * MLS Integration Server Actions
 * 
 * Server actions for MLS listing import and management.
 * Handles authentication, import, retry logic, and photo storage.
 * 
 * Requirements Coverage:
 * - 2.1: Automatic listing import within 15 minutes
 * - 2.3: Store listings with MLS linkage
 * - 2.4: Retry logic with exponential backoff (3 attempts)
 */

import { getCognitoClient } from '@/aws/auth/cognito-client';
import { getRepository } from '@/aws/dynamodb/repository';
import { createMLSConnector, MLSAuthenticationError, MLSNetworkError } from '@/integrations/mls/connector';
import { uploadFile } from '@/aws/s3/client';
import type { Listing, MLSConnection, MLSCredentials } from '@/integrations/mls/types';

/**
 * Response type for MLS operations
 */
export interface MLSActionResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
}

/**
 * Import result with detailed statistics
 */
export interface ImportResult {
    totalListings: number;
    successfulImports: number;
    failedImports: number;
    errors: Array<{
        mlsNumber: string;
        error: string;
        attempts: number;
    }>;
}

/**
 * Gets the current authenticated user
 */
async function getCurrentUser() {
    try {
        const cognitoClient = getCognitoClient();
        const session = await cognitoClient.getSession();

        if (!session) {
            return null;
        }

        return await cognitoClient.getCurrentUser(session.accessToken);
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

/**
 * Exponential backoff delay calculation
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number): number {
    // Base delay: 1 second, exponential: 2^attempt
    // Attempt 0: 1s, Attempt 1: 2s, Attempt 2: 4s
    const baseDelay = 1000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Downloads and stores a photo to S3 with retry logic
 * Requirement 2.1: Download and store listing photos
 * Requirement 2.4: Retry logic with exponential backoff
 */
async function downloadAndStorePhoto(
    photoUrl: string,
    userId: string,
    listingId: string,
    photoIndex: number,
    maxAttempts: number = 3
): Promise<string | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Download photo
            const response = await fetch(photoUrl);

            if (!response.ok) {
                throw new Error(`Failed to download photo: ${response.statusText}`);
            }

            const blob = await response.blob();
            const buffer = Buffer.from(await blob.arrayBuffer());

            // Generate S3 key
            const fileExtension = photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
            const s3Key = `listings/${userId}/${listingId}/original/photo${photoIndex}.${fileExtension}`;

            // Upload to S3
            const s3Url = await uploadFile(
                s3Key,
                buffer,
                blob.type || 'image/jpeg',
                {
                    listingId,
                    photoIndex: photoIndex.toString(),
                    originalUrl: photoUrl,
                }
            );

            console.log(`Successfully stored photo ${photoIndex} for listing ${listingId}`);
            return s3Url;

        } catch (error) {
            lastError = error as Error;
            console.error(
                `Attempt ${attempt + 1}/${maxAttempts} failed for photo ${photoIndex}:`,
                error
            );

            // If not the last attempt, wait before retrying
            if (attempt < maxAttempts - 1) {
                const delay = calculateBackoffDelay(attempt);
                console.log(`Waiting ${delay}ms before retry...`);
                await sleep(delay);
            }
        }
    }

    // All attempts failed
    console.error(
        `Failed to download photo ${photoIndex} after ${maxAttempts} attempts:`,
        lastError
    );
    return null;
}

/**
 * Imports a single listing with retry logic
 * Requirement 2.3: Store imported listings in DynamoDB with MLS linkage
 * Requirement 2.4: Retry logic with exponential backoff (3 attempts)
 */
async function importSingleListing(
    listing: Listing,
    userId: string,
    mlsProvider: string,
    maxAttempts: number = 3
): Promise<{ success: boolean; error?: string; attempts: number }> {
    let lastError: Error | null = null;
    let attempts = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        attempts++;

        try {
            const repository = getRepository();

            // Generate unique listing ID
            const listingId = `${mlsProvider}-${listing.mlsNumber}-${Date.now()}`;

            // Download and store photos
            const storedPhotos = await Promise.all(
                listing.photos.map(async (photo, index) => {
                    const s3Url = await downloadAndStorePhoto(
                        photo.url,
                        userId,
                        listingId,
                        index,
                        2 // 2 attempts for photos
                    );

                    return {
                        url: s3Url || photo.url, // Fallback to original URL if download fails
                        caption: photo.caption,
                        order: photo.order,
                        originalUrl: photo.url,
                    };
                })
            );

            // Prepare listing data for storage
            const listingData = {
                listingId,
                mlsId: listing.mlsId,
                mlsNumber: listing.mlsNumber,
                mlsProvider,
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
            };

            // Store in DynamoDB
            await repository.createListing(userId, listingId, listingData);

            console.log(`Successfully imported listing ${listing.mlsNumber} on attempt ${attempt + 1}`);
            return { success: true, attempts };

        } catch (error) {
            lastError = error as Error;
            console.error(
                `Attempt ${attempt + 1}/${maxAttempts} failed for listing ${listing.mlsNumber}:`,
                error
            );

            // If not the last attempt, wait before retrying
            if (attempt < maxAttempts - 1) {
                const delay = calculateBackoffDelay(attempt);
                console.log(`Waiting ${delay}ms before retry...`);
                await sleep(delay);
            }
        }
    }

    // All attempts failed
    const errorMessage = lastError?.message || 'Unknown error';
    console.error(
        `Failed to import listing ${listing.mlsNumber} after ${maxAttempts} attempts:`,
        lastError
    );

    return {
        success: false,
        error: errorMessage,
        attempts,
    };
}

/**
 * Triggers MLS import for a user's listings
 * Requirement 2.1: Import listings from MLS
 * Requirement 2.3: Store listings with MLS linkage
 * Requirement 2.4: Implement retry logic with exponential backoff
 * 
 * @param connectionId - MLS connection ID
 * @returns Import result with statistics
 */
export async function importMLSListings(
    connectionId: string
): Promise<MLSActionResponse<ImportResult>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Get MLS connection
        const repository = getRepository();
        const connection = await repository.getMLSConnection<MLSConnection>(
            user.id,
            connectionId
        );

        if (!connection) {
            return {
                success: false,
                error: 'MLS connection not found',
            };
        }

        // Check if token is expired
        if (Date.now() >= connection.expiresAt) {
            return {
                success: false,
                error: 'MLS connection expired. Please re-authenticate.',
            };
        }

        // Create MLS connector
        const connector = createMLSConnector(connection.provider);

        // Fetch listings from MLS
        console.log(`Fetching listings for agent ${connection.agentId}...`);
        const listings = await connector.fetchListings(connection, connection.agentId);

        console.log(`Found ${listings.length} listings to import`);

        // Import each listing with retry logic
        const importResults = await Promise.all(
            listings.map(listing =>
                importSingleListing(listing, user.id, connection.provider)
            )
        );

        // Calculate statistics
        const successfulImports = importResults.filter(r => r.success).length;
        const failedImports = importResults.filter(r => !r.success).length;
        const errors = importResults
            .filter(r => !r.success)
            .map((r, index) => ({
                mlsNumber: listings[index].mlsNumber,
                error: r.error || 'Unknown error',
                attempts: r.attempts,
            }));

        const result: ImportResult = {
            totalListings: listings.length,
            successfulImports,
            failedImports,
            errors,
        };

        // Log errors to CloudWatch (in production, this would use proper logging)
        if (errors.length > 0) {
            console.error('Import errors:', JSON.stringify(errors, null, 2));
        }

        return {
            success: true,
            message: `Imported ${successfulImports} of ${listings.length} listings`,
            data: result,
        };

    } catch (error) {
        console.error('Import MLS listings error:', error);

        // Handle specific error types
        if (error instanceof MLSAuthenticationError) {
            return {
                success: false,
                error: `Authentication failed: ${error.message}`,
            };
        }

        if (error instanceof MLSNetworkError) {
            return {
                success: false,
                error: `Network error: ${error.message}`,
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to import listings',
        };
    }
}

/**
 * Gets import status and history for a user
 * 
 * @returns List of imported listings with metadata
 */
export async function getImportedListings(): Promise<MLSActionResponse<any[]>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Query all listings for the user
        const repository = getRepository();
        const result = await repository.queryListings(user.id, {
            limit: 100,
            scanIndexForward: false, // Most recent first
        });

        return {
            success: true,
            data: result.items,
        };

    } catch (error) {
        console.error('Get imported listings error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get listings',
        };
    }
}

/**
 * Gets a single listing by ID
 * 
 * @param listingId - Listing ID
 * @returns Listing data
 */
export async function getListing(
    listingId: string
): Promise<MLSActionResponse<any>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Get listing
        const repository = getRepository();
        const listing = await repository.getListing(user.id, listingId);

        if (!listing) {
            return {
                success: false,
                error: 'Listing not found',
            };
        }

        return {
            success: true,
            data: listing,
        };

    } catch (error) {
        console.error('Get listing error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get listing',
        };
    }
}

/**
 * Deletes a listing
 * 
 * @param listingId - Listing ID
 * @returns Success response
 */
export async function deleteListing(
    listingId: string
): Promise<MLSActionResponse<void>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Delete listing
        const repository = getRepository();
        await repository.deleteListing(user.id, listingId);

        return {
            success: true,
            message: 'Listing deleted successfully',
        };

    } catch (error) {
        console.error('Delete listing error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete listing',
        };
    }
}

/**
 * Connects to an MLS provider
 * Requirement 1.1: Establish secure connection
 * Requirement 1.2: Store credentials securely
 * Requirement 1.3: Handle authentication failures
 * Requirement 1.4: Retrieve agent and brokerage information
 * 
 * @param credentials - MLS credentials
 * @returns Connection result with agent information
 */
export async function connectMLSAction(
    credentials: MLSCredentials
): Promise<MLSActionResponse<MLSConnection>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Create MLS connector
        const connector = createMLSConnector(credentials.provider);

        // Authenticate with MLS provider
        console.log(`Authenticating with ${credentials.provider}...`);
        const connection = await connector.authenticate(credentials);

        // Add user ID to connection
        connection.userId = user.id;

        // Store connection in DynamoDB
        const repository = getRepository();
        await repository.createMLSConnection(user.id, connection.id, connection);

        console.log(`Successfully connected to ${credentials.provider}`);

        return {
            success: true,
            message: 'Successfully connected to MLS provider',
            data: connection,
        };

    } catch (error) {
        console.error('Connect MLS error:', error);

        // Handle specific error types
        if (error instanceof MLSAuthenticationError) {
            return {
                success: false,
                error: `Authentication failed: ${error.message}`,
            };
        }

        if (error instanceof MLSNetworkError) {
            return {
                success: false,
                error: `Network error: ${error.message}`,
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to MLS provider',
        };
    }
}

/**
 * Gets all MLS connections for a user
 * Requirement 1.5: Display connection status
 * 
 * @param userId - User ID
 * @returns List of MLS connections
 */
export async function getMLSConnectionsAction(
    userId: string
): Promise<MLSActionResponse<MLSConnection[]>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user || user.id !== userId) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Query all MLS connections
        const repository = getRepository();
        const result = await repository.queryMLSConnections<MLSConnection>(userId, {
            limit: 10,
            scanIndexForward: false, // Most recent first
        });

        return {
            success: true,
            data: result.items,
        };

    } catch (error) {
        console.error('Get MLS connections error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get MLS connections',
        };
    }
}

/**
 * Disconnects from an MLS provider
 * Requirement 1.5: Disconnect functionality
 * 
 * @param userId - User ID
 * @param connectionId - Connection ID
 * @returns Success response
 */
export async function disconnectMLSAction(
    userId: string,
    connectionId: string
): Promise<MLSActionResponse<void>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user || user.id !== userId) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Get connection
        const repository = getRepository();
        const connection = await repository.getMLSConnection<MLSConnection>(
            userId,
            connectionId
        );

        if (!connection) {
            return {
                success: false,
                error: 'MLS connection not found',
            };
        }

        // Disconnect from MLS provider
        const connector = createMLSConnector(connection.provider);
        await connector.disconnect(connectionId);

        // Delete connection from DynamoDB
        await repository.deleteMLSConnection(userId, connectionId);

        console.log(`Successfully disconnected from ${connection.provider}`);

        return {
            success: true,
            message: 'Successfully disconnected from MLS provider',
        };

    } catch (error) {
        console.error('Disconnect MLS error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to disconnect from MLS provider',
        };
    }
}

/**
 * Gets MLS sync history for a user
 * Requirement 1.5: Show sync history
 * 
 * @param userId - User ID
 * @returns Sync history
 */
export async function getMLSSyncHistoryAction(
    userId: string
): Promise<MLSActionResponse<Array<{ timestamp: number; status: string }>>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user || user.id !== userId) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // In a production system, this would query a sync history table
        // For now, we'll return mock data
        // TODO: Implement actual sync history tracking
        const mockHistory = [
            { timestamp: Date.now() - 1000 * 60 * 30, status: 'success' },
            { timestamp: Date.now() - 1000 * 60 * 60 * 2, status: 'success' },
            { timestamp: Date.now() - 1000 * 60 * 60 * 24, status: 'success' },
        ];

        return {
            success: true,
            data: mockHistory,
        };

    } catch (error) {
        console.error('Get MLS sync history error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get sync history',
        };
    }
}
