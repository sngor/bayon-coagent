/**
 * Error Handling Integration Examples
 * 
 * This file demonstrates how to integrate the error handling and logging system
 * into existing MLS and social media integration code.
 */

import {
    getErrorHandler,
    withRetry,
    withGracefulDegradation,
    handleError,
    MLSSocialError,
    ErrorCategory,
} from './error-handler';
import {
    getNotificationSystem,
    notifyError,
    notifySuccess,
} from './notification-system';
import { createLogger } from '@/aws/logging';

// ============================================================================
// Example 1: MLS Authentication with Error Handling
// Requirement 1.3: Authentication error handling
// ============================================================================

export async function authenticateMLSWithErrorHandling(
    credentials: any,
    connector: any
): Promise<any> {
    const logger = createLogger({ service: 'mls-authentication' });
    const notifier = getNotificationSystem();

    try {
        logger.info('Starting MLS authentication', {
            provider: credentials.provider,
            username: credentials.username,
        });

        // Authenticate (no retry for auth failures)
        const connection = await connector.authenticate(credentials);

        logger.info('MLS authentication successful', {
            provider: credentials.provider,
            agentId: connection.agentId,
        });

        // Notify user of success
        notifier.notifyMLSConnectionSuccess(credentials.provider);

        return connection;
    } catch (error) {
        // Handle and classify the error
        const enhancedError = handleError(
            error as Error,
            'authenticateMLS',
            {
                provider: credentials.provider,
                username: credentials.username,
            }
        );

        // Notify user with appropriate message
        notifyError(enhancedError, {
            reconnectAction: () => {
                // Redirect to connection settings
                window.location.href = '/settings?tab=connections';
            },
        });

        throw enhancedError;
    }
}

// ============================================================================
// Example 2: MLS Listing Import with Retry
// Requirement 2.4: Retry logic with exponential backoff
// ============================================================================

export async function importListingWithRetry(
    listing: any,
    userId: string,
    mlsProvider: string
): Promise<{ success: boolean; error?: string }> {
    const logger = createLogger({ service: 'mls-import' });

    try {
        // Import with automatic retry (3 attempts with exponential backoff)
        await withRetry(
            async () => {
                logger.debug('Attempting to import listing', {
                    mlsNumber: listing.mlsNumber,
                    userId,
                });

                // Download photos with graceful degradation
                const photos = await withGracefulDegradation(
                    async () => await downloadPhotos(listing.photos),
                    [], // Fallback to empty array if photos fail
                    'downloadPhotos',
                    { listingId: listing.mlsId, userId }
                );

                // Store listing in database
                await storeListing({
                    ...listing,
                    photos,
                    userId,
                    mlsProvider,
                });

                logger.info('Listing imported successfully', {
                    mlsNumber: listing.mlsNumber,
                    photoCount: photos.length,
                });
            },
            'importListing',
            {
                maxAttempts: 3,
                baseDelay: 1000,
                exponential: true,
                jitter: true,
            },
            {
                mlsNumber: listing.mlsNumber,
                userId,
                mlsProvider,
            }
        );

        return { success: true };
    } catch (error) {
        const enhancedError = handleError(
            error as Error,
            'importListing',
            {
                mlsNumber: listing.mlsNumber,
                userId,
            }
        );

        logger.error('Failed to import listing after retries', enhancedError, {
            mlsNumber: listing.mlsNumber,
        });

        return {
            success: false,
            error: enhancedError.userMessage,
        };
    }
}

// ============================================================================
// Example 3: Bulk Import with Error Aggregation
// Requirement 2.4: Log errors for failed imports
// ============================================================================

export async function bulkImportListingsWithErrorHandling(
    listings: any[],
    userId: string,
    mlsProvider: string
): Promise<{
    successCount: number;
    failedCount: number;
    errors: Array<{ mlsNumber: string; error: string }>;
}> {
    const logger = createLogger({ service: 'mls-bulk-import' });
    const notifier = getNotificationSystem();

    logger.info('Starting bulk import', {
        totalListings: listings.length,
        userId,
        mlsProvider,
    });

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ mlsNumber: string; error: string }> = [];

    // Import listings sequentially to avoid overwhelming the system
    for (const listing of listings) {
        const result = await importListingWithRetry(listing, userId, mlsProvider);

        if (result.success) {
            successCount++;
        } else {
            failedCount++;
            errors.push({
                mlsNumber: listing.mlsNumber,
                error: result.error || 'Unknown error',
            });
        }
    }

    logger.info('Bulk import completed', {
        successCount,
        failedCount,
        totalListings: listings.length,
    });

    // Notify user of results
    notifier.notifyMLSImportComplete(successCount, failedCount, listings.length);

    return { successCount, failedCount, errors };
}

// ============================================================================
// Example 4: OAuth Connection with Error Handling
// Requirement 6.3: OAuth failure handling
// ============================================================================

export async function connectOAuthWithErrorHandling(
    platform: string,
    userId: string,
    oauthManager: any
): Promise<any> {
    const logger = createLogger({ service: 'oauth-connection' });
    const notifier = getNotificationSystem();

    try {
        logger.info('Initiating OAuth connection', { platform, userId });

        // Initiate connection (no retry for OAuth)
        const authUrl = await oauthManager.initiateConnection(platform, userId);

        logger.info('OAuth URL generated', { platform, userId });

        return authUrl;
    } catch (error) {
        const enhancedError = handleError(
            error as Error,
            'initiateOAuthConnection',
            { platform, userId }
        );

        logger.error('OAuth connection failed', enhancedError, {
            platform,
            userId,
        });

        // Notify user with reconnect action
        notifyError(enhancedError, {
            reconnectAction: () => {
                window.location.href = `/settings?reconnect=${platform}`;
            },
        });

        throw enhancedError;
    }
}

// ============================================================================
// Example 5: Social Media Publishing with Error Handling
// Requirement 7.5: Failed post error logging and user notification
// ============================================================================

export async function publishToSocialMediaWithErrorHandling(
    post: any,
    connection: any,
    platform: string,
    publisher: any
): Promise<{ success: boolean; postId?: string; error?: string }> {
    const logger = createLogger({ service: 'social-publishing' });
    const handler = getErrorHandler();

    try {
        logger.info('Publishing to social media', {
            platform,
            listingId: post.listingId,
        });

        // Publish with retry for transient failures
        const result = await withRetry(
            async () => {
                switch (platform) {
                    case 'facebook':
                        return await publisher.publishToFacebook(post, connection);
                    case 'instagram':
                        return await publisher.publishToInstagram(post, connection);
                    case 'linkedin':
                        return await publisher.publishToLinkedIn(post, connection);
                    default:
                        throw new Error(`Unsupported platform: ${platform}`);
                }
            },
            'publishToSocialMedia',
            {
                maxAttempts: 3,
                baseDelay: 2000,
                exponential: true,
                jitter: true,
            },
            {
                platform,
                listingId: post.listingId,
            }
        );

        if (result.success) {
            logger.info('Published successfully', {
                platform,
                postId: result.postId,
                listingId: post.listingId,
            });

            return {
                success: true,
                postId: result.postId,
            };
        } else {
            throw new Error(result.error || 'Publishing failed');
        }
    } catch (error) {
        const enhancedError = handleError(
            error as Error,
            'publishToSocialMedia',
            {
                platform,
                listingId: post.listingId,
            }
        );

        logger.error('Publishing failed', enhancedError, {
            platform,
            listingId: post.listingId,
        });

        return {
            success: false,
            error: enhancedError.userMessage,
        };
    }
}

// ============================================================================
// Example 6: Image Optimization with Graceful Degradation
// Requirement 10.5: Image optimization failure handling
// ============================================================================

export async function optimizeImagesWithErrorHandling(
    images: string[],
    platform: string,
    listingId: string,
    userId: string,
    optimizer: any
): Promise<any[]> {
    const logger = createLogger({ service: 'image-optimization' });
    const handler = getErrorHandler();
    const notifier = getNotificationSystem();

    logger.info('Starting image optimization', {
        imageCount: images.length,
        platform,
        listingId,
    });

    // Optimize each image with graceful degradation
    const optimizedImages: any[] = [];
    let failedCount = 0;

    for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];

        const optimized = await handler.withGracefulDegradation(
            async () => {
                return await optimizer.optimizeImage(
                    imageUrl,
                    platform,
                    listingId,
                    userId,
                    i
                );
            },
            {
                // Fallback to original image if optimization fails
                originalUrl: imageUrl,
                optimizedUrl: imageUrl,
                width: 0,
                height: 0,
                fileSize: 0,
            },
            'optimizeImage',
            {
                imageIndex: i,
                platform,
                listingId,
            }
        );

        if (optimized.optimizedUrl === imageUrl) {
            // Optimization failed, using original
            failedCount++;
            logger.warn('Image optimization failed, using original', {
                imageIndex: i,
                imageUrl,
            });
        }

        optimizedImages.push(optimized);
    }

    // Notify user if some images failed
    if (failedCount > 0) {
        notifier.notifyImageOptimizationFailure(failedCount, images.length);
    }

    logger.info('Image optimization completed', {
        totalImages: images.length,
        successfulOptimizations: images.length - failedCount,
        failedOptimizations: failedCount,
    });

    return optimizedImages;
}

// ============================================================================
// Example 7: Status Sync with Error Handling
// Requirement 5.1: Detect status changes with error handling
// ============================================================================

export async function syncListingStatusWithErrorHandling(
    connection: any,
    listingIds: string[],
    connector: any
): Promise<any[]> {
    const logger = createLogger({ service: 'status-sync' });
    const handler = getErrorHandler();

    logger.info('Starting status sync', {
        listingCount: listingIds.length,
    });

    try {
        // Sync with retry for network failures
        const statusUpdates = await withRetry(
            async () => {
                return await connector.syncStatus(connection, listingIds);
            },
            'syncListingStatus',
            {
                maxAttempts: 3,
                baseDelay: 2000,
                exponential: true,
                jitter: true,
            },
            {
                listingCount: listingIds.length,
            }
        );

        logger.info('Status sync completed', {
            updatedCount: statusUpdates.length,
        });

        return statusUpdates;
    } catch (error) {
        const enhancedError = handleError(
            error as Error,
            'syncListingStatus',
            {
                listingCount: listingIds.length,
            }
        );

        logger.error('Status sync failed', enhancedError);

        // Return empty array to allow graceful degradation
        // The system will continue with cached status
        return [];
    }
}

// ============================================================================
// Helper Functions (Mock implementations for examples)
// ============================================================================

async function downloadPhotos(photos: any[]): Promise<any[]> {
    // Mock implementation
    return photos;
}

async function storeListing(listing: any): Promise<void> {
    // Mock implementation
}
