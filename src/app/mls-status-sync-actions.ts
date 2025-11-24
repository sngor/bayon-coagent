'use server';

/**
 * MLS Status Sync Server Actions
 * 
 * Handles automatic status synchronization between MLS and Bayon Coagent.
 * Implements polling, conflict resolution, and automatic post unpublishing.
 * 
 * Requirements Coverage:
 * - 5.1: Detect status changes within 15 minutes
 * - 5.2: Update listing record when status changes
 * - 5.3: Automatically unpublish posts when status changes to sold
 * - 5.4: Restore listing when status changes from pending to active
 * - 5.5: Prioritize MLS data as source of truth in conflicts
 */

import { getCognitoClient } from '@/aws/auth/cognito-client';
import { getRepository } from '@/aws/dynamodb/repository';
import { getListingKeys } from '@/aws/dynamodb/keys';
import { createMLSConnector, MLSAuthenticationError, MLSNetworkError } from '@/integrations/mls/connector';
import { createSocialPublisher } from '@/integrations/social/publisher';
import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';
import type { Listing, MLSConnection, ListingStatus, StatusUpdate } from '@/integrations/mls/types';
import type { Platform } from '@/integrations/social/types';

/**
 * Response type for sync operations
 */
export interface SyncActionResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

/**
 * Sync result with detailed statistics
 */
export interface SyncResult {
    totalListings: number;
    updatedListings: number;
    unpublishedPosts: number;
    restoredListings: number;
    errors: Array<{
        listingId: string;
        mlsNumber: string;
        error: string;
    }>;
    statusChanges: Array<{
        listingId: string;
        mlsNumber: string;
        oldStatus: ListingStatus;
        newStatus: ListingStatus;
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
 * Unpublish all posts for a listing across all platforms
 * Requirement 5.3: Automatically unpublish posts when status changes to sold
 */
async function unpublishListingPosts(
    userId: string,
    listingId: string
): Promise<number> {
    try {
        const repository = getRepository();
        const publisher = createSocialPublisher();
        const oauthManager = getOAuthConnectionManager();

        // Query all posts for this listing using GSI
        const postsResult = await repository.querySocialPostsByListing<any>(listingId);

        let unpublishedCount = 0;

        for (const post of postsResult.items) {
            // Only unpublish if post is currently published
            if (post.status !== 'published') {
                continue;
            }

            try {
                // Get OAuth connection for the platform
                const connection = await oauthManager.getConnection(
                    userId,
                    post.platform as Platform
                );

                if (!connection) {
                    console.warn(`No ${post.platform} connection found for unpublishing post ${post.postId}`);
                    continue;
                }

                // Unpublish the post
                await publisher.unpublishPost(
                    post.platform as Platform,
                    post.platformPostId,
                    connection
                );

                // Update post status in database
                await repository.updateSocialPost(userId, post.postId, {
                    status: 'unpublished',
                    updatedAt: Date.now(),
                });

                unpublishedCount++;
                console.log(`Unpublished ${post.platform} post ${post.postId} for listing ${listingId}`);
            } catch (error) {
                console.error(`Failed to unpublish post ${post.postId}:`, error);
                // Continue with other posts even if one fails
            }
        }

        return unpublishedCount;
    } catch (error) {
        console.error(`Failed to unpublish posts for listing ${listingId}:`, error);
        return 0;
    }
}

/**
 * Sync status for a single listing
 * Requirement 5.2: Update listing record when status changes
 * Requirement 5.3: Automatically unpublish posts when status changes to sold
 * Requirement 5.4: Restore listing when status changes from pending to active
 * Requirement 5.5: Prioritize MLS data as source of truth
 */
async function syncSingleListing(
    userId: string,
    listing: Listing & { listingId: string },
    mlsStatus: ListingStatus
): Promise<{
    updated: boolean;
    unpublishedPosts: number;
    restored: boolean;
    oldStatus: ListingStatus;
    newStatus: ListingStatus;
}> {
    const repository = getRepository();
    const oldStatus = listing.status;
    const newStatus = mlsStatus;

    // No change - skip
    if (oldStatus === newStatus) {
        return {
            updated: false,
            unpublishedPosts: 0,
            restored: false,
            oldStatus,
            newStatus,
        };
    }

    // Requirement 5.5: MLS data is source of truth - always update
    await repository.updateListing(userId, listing.listingId, {
        status: newStatus,
        syncedAt: Date.now(),
    });

    let unpublishedPosts = 0;
    let restored = false;

    // Requirement 5.3: Unpublish posts when status changes to sold
    if (newStatus === 'sold') {
        unpublishedPosts = await unpublishListingPosts(userId, listing.listingId);
        console.log(`Listing ${listing.mlsNumber} marked as sold, unpublished ${unpublishedPosts} posts`);
    }

    // Requirement 5.4: Restore listing when status changes from pending to active
    if (oldStatus === 'pending' && newStatus === 'active') {
        restored = true;
        console.log(`Listing ${listing.mlsNumber} restored from pending to active`);
    }

    return {
        updated: true,
        unpublishedPosts,
        restored,
        oldStatus,
        newStatus,
    };
}

/**
 * Sync status for all listings from a specific MLS connection
 * Uses Integration Service Lambda via API Gateway with fallback to direct implementation
 * Requirement 1.5: Implement fallback for integration service failures
 * Requirement 5.1: Detect status changes within 15 minutes
 * 
 * This function should be called by a scheduled job every 15 minutes
 * 
 * @param connectionId - MLS connection ID
 * @returns Sync result with statistics
 */
export async function syncMLSStatus(
    connectionId: string
): Promise<SyncActionResponse<SyncResult>> {
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

        // Get all listings for this user
        const listingsResult = await repository.queryListings<Listing>(user.id, {
            limit: 1000, // Process up to 1000 listings per sync
        });

        if (listingsResult.items.length === 0) {
            return {
                success: true,
                message: 'No listings to sync',
                data: {
                    totalListings: 0,
                    updatedListings: 0,
                    unpublishedPosts: 0,
                    restoredListings: 0,
                    errors: [],
                    statusChanges: [],
                },
            };
        }

        // Extract listing IDs and create lookup map
        const listingsMap = new Map<string, Listing & { listingId: string }>();
        const mlsIds: string[] = [];

        for (const item of listingsResult.items) {
            const listing = item.Data as Listing;
            const listingId = item.SK ? item.SK.replace('LISTING#', '') : 'unknown';

            listingsMap.set(listing.mlsId, {
                ...listing,
                listingId,
            });
            mlsIds.push(listing.mlsId);
        }

        // Try integration service Lambda via API Gateway first
        try {
            const { mlsClient } = await import('@/aws/integration-service/client');

            console.log(`Triggering MLS status sync via Integration Service for ${mlsIds.length} listings...`);

            // Trigger incremental sync via Integration Service
            const syncResult = await mlsClient.syncMLSData(
                user.id,
                connection.provider as 'mlsgrid' | 'bridgeInteractive',
                connection.agentId,
                'incremental'
            );

            console.log(`Successfully synced status for ${syncResult.syncedListings} listings via Integration Service`);

            // Note: The Integration Service handles the status sync internally
            // For now, we'll return a simplified result
            // In a full implementation, the Integration Service would return detailed status changes
            const result: SyncResult = {
                totalListings: listingsResult.items.length,
                updatedListings: syncResult.syncedListings,
                unpublishedPosts: 0, // Integration service handles this internally
                restoredListings: 0, // Integration service handles this internally
                errors: [],
                statusChanges: [],
            };

            return {
                success: true,
                message: `Synced ${result.totalListings} listings, ${result.updatedListings} updated`,
                data: result,
            };
        } catch (integrationError) {
            console.warn('Integration service failed for MLS status sync, falling back to direct implementation:', integrationError);

            // Fallback to direct implementation
            // Create MLS connector
            const connector = createMLSConnector(connection.provider);

            // Fetch current status from MLS
            console.log(`Syncing status for ${mlsIds.length} listings via direct implementation...`);
            const statusUpdates = await connector.syncStatus(connection, mlsIds);

            // Process each status update
            const result: SyncResult = {
                totalListings: listingsResult.items.length,
                updatedListings: 0,
                unpublishedPosts: 0,
                restoredListings: 0,
                errors: [],
                statusChanges: [],
            };

            for (const update of statusUpdates) {
                const listing = listingsMap.get(update.mlsId);

                if (!listing) {
                    console.warn(`Listing ${update.mlsNumber} not found in local database`);
                    continue;
                }

                try {
                    const syncResult = await syncSingleListing(
                        user.id,
                        listing,
                        update.newStatus
                    );

                    if (syncResult.updated) {
                        result.updatedListings++;
                        result.unpublishedPosts += syncResult.unpublishedPosts;

                        if (syncResult.restored) {
                            result.restoredListings++;
                        }

                        result.statusChanges.push({
                            listingId: listing.listingId,
                            mlsNumber: listing.mlsNumber,
                            oldStatus: syncResult.oldStatus,
                            newStatus: syncResult.newStatus,
                        });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`Failed to sync listing ${listing.mlsNumber}:`, error);

                    result.errors.push({
                        listingId: listing.listingId,
                        mlsNumber: listing.mlsNumber,
                        error: errorMessage,
                    });
                }
            }

            // Log summary
            console.log(`Status sync complete via direct implementation (fallback): ${result.updatedListings} updated, ${result.unpublishedPosts} posts unpublished, ${result.restoredListings} restored`);

            return {
                success: true,
                message: `Synced ${result.totalListings} listings, ${result.updatedListings} updated`,
                data: result,
            };
        }

    } catch (error) {
        console.error('Sync MLS status error:', error);

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
            error: error instanceof Error ? error.message : 'Failed to sync status',
        };
    }
}

/**
 * Sync status for all MLS connections for the current user
 * This is the main entry point for scheduled jobs
 * 
 * @returns Aggregated sync results across all connections
 */
export async function syncAllMLSConnections(): Promise<SyncActionResponse<{
    totalConnections: number;
    successfulSyncs: number;
    failedSyncs: number;
    aggregatedResults: SyncResult;
}>> {
    try {
        // Check authentication
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required',
            };
        }

        // Get all MLS connections for user
        const repository = getRepository();
        const connectionsResult = await repository.query<MLSConnection>(
            `USER#${user.id}`,
            'MLS_CONNECTION#'
        );

        if (connectionsResult.items.length === 0) {
            return {
                success: true,
                message: 'No MLS connections to sync',
                data: {
                    totalConnections: 0,
                    successfulSyncs: 0,
                    failedSyncs: 0,
                    aggregatedResults: {
                        totalListings: 0,
                        updatedListings: 0,
                        unpublishedPosts: 0,
                        restoredListings: 0,
                        errors: [],
                        statusChanges: [],
                    },
                },
            };
        }

        // Sync each connection
        const aggregatedResults: SyncResult = {
            totalListings: 0,
            updatedListings: 0,
            unpublishedPosts: 0,
            restoredListings: 0,
            errors: [],
            statusChanges: [],
        };

        let successfulSyncs = 0;
        let failedSyncs = 0;

        for (const item of connectionsResult.items) {
            const connection = item.Data as MLSConnection;
            const connectionId = item.SK ? item.SK.replace('MLS_CONNECTION#', '') : 'unknown';

            try {
                const syncResponse = await syncMLSStatus(connectionId);

                if (syncResponse.success && syncResponse.data) {
                    successfulSyncs++;

                    // Aggregate results
                    const data = syncResponse.data;
                    aggregatedResults.totalListings += data.totalListings;
                    aggregatedResults.updatedListings += data.updatedListings;
                    aggregatedResults.unpublishedPosts += data.unpublishedPosts;
                    aggregatedResults.restoredListings += data.restoredListings;
                    aggregatedResults.errors.push(...data.errors);
                    aggregatedResults.statusChanges.push(...data.statusChanges);
                } else {
                    failedSyncs++;
                    console.error(`Failed to sync connection ${connectionId}:`, syncResponse.error);
                }
            } catch (error) {
                failedSyncs++;
                console.error(`Failed to sync connection ${connectionId}:`, error);
            }
        }

        return {
            success: true,
            message: `Synced ${successfulSyncs} of ${connectionsResult.items.length} connections`,
            data: {
                totalConnections: connectionsResult.items.length,
                successfulSyncs,
                failedSyncs,
                aggregatedResults,
            },
        };

    } catch (error) {
        console.error('Sync all MLS connections error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sync connections',
        };
    }
}

/**
 * Manually trigger status sync for a specific listing
 * Useful for testing or immediate sync needs
 * 
 * @param listingId - Listing ID to sync
 * @returns Sync result for the single listing
 */
export async function syncListingStatus(
    listingId: string
): Promise<SyncActionResponse<{
    updated: boolean;
    oldStatus: ListingStatus;
    newStatus: ListingStatus;
    unpublishedPosts: number;
    restored: boolean;
}>> {
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
        const listing = await repository.getListing<Listing>(user.id, listingId);

        if (!listing) {
            return {
                success: false,
                error: 'Listing not found',
            };
        }

        // Get MLS connection for this listing's provider
        const connectionsResult = await repository.query<MLSConnection>(
            `USER#${user.id}`,
            'MLS_CONNECTION#'
        );

        const connection = connectionsResult.items
            .map(item => item.Data as MLSConnection)
            .find(conn => conn.provider === (listing as any).mlsProvider);

        if (!connection) {
            return {
                success: false,
                error: 'MLS connection not found for this listing',
            };
        }

        // Check if token is expired
        if (Date.now() >= connection.expiresAt) {
            return {
                success: false,
                error: 'MLS connection expired. Please re-authenticate.',
            };
        }

        // Create MLS connector and fetch current status
        const connector = createMLSConnector(connection.provider);
        const statusUpdates = await connector.syncStatus(connection, [listing.mlsId]);

        if (statusUpdates.length === 0) {
            return {
                success: false,
                error: 'Failed to fetch status from MLS',
            };
        }

        const mlsStatus = statusUpdates[0].newStatus;

        // Sync the listing
        const syncResult = await syncSingleListing(
            user.id,
            { ...listing, listingId },
            mlsStatus
        );

        return {
            success: true,
            message: syncResult.updated
                ? `Status updated from ${syncResult.oldStatus} to ${syncResult.newStatus}`
                : 'No status change detected',
            data: syncResult,
        };

    } catch (error) {
        console.error('Sync listing status error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sync listing status',
        };
    }
}
