/**
 * MLS Status Sync Cron API Route
 * 
 * This API route can be called by external cron services (e.g., Vercel Cron, AWS EventBridge)
 * to trigger status synchronization every 15 minutes.
 * 
 * Security: Protected by CRON_SECRET environment variable
 * 
 * Usage:
 *   POST /api/cron/sync-mls-status
 *   Headers:
 *     Authorization: Bearer <CRON_SECRET>
 * 
 * Requirements:
 * - 5.1: Detect status changes within 15 minutes (polling interval)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import { createMLSConnector, MLSAuthenticationError, MLSNetworkError } from '@/integrations/mls/connector';
import { createSocialPublisher } from '@/integrations/social/publisher';
import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';
import type { Listing, MLSConnection, ListingStatus } from '@/integrations/mls/types';
import type { Platform } from '@/integrations/social/types';

/**
 * Verify cron secret for security
 */
function verifyCronSecret(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.warn('CRON_SECRET not configured - cron endpoint is unprotected!');
        return true; // Allow in development
    }

    if (!authHeader) {
        return false;
    }

    const token = authHeader.replace('Bearer ', '');
    return token === cronSecret;
}

/**
 * Unpublish all posts for a listing
 */
async function unpublishListingPosts(
    userId: string,
    listingId: string
): Promise<number> {
    try {
        const repository = getRepository();
        const publisher = createSocialPublisher();
        const oauthManager = getOAuthConnectionManager();

        const postsResult = await repository.querySocialPostsByListing<any>(listingId);
        let unpublishedCount = 0;

        for (const post of postsResult.items) {
            if (post.status !== 'published') {
                continue;
            }

            try {
                const connection = await oauthManager.getConnection(
                    userId,
                    post.platform as Platform
                );

                if (!connection) {
                    console.warn(`No ${post.platform} connection for post ${post.postId}`);
                    continue;
                }

                await publisher.unpublishPost(
                    post.platform as Platform,
                    post.platformPostId,
                    connection
                );

                await repository.updateSocialPost(userId, post.postId, {
                    status: 'unpublished',
                    updatedAt: Date.now(),
                });

                unpublishedCount++;
            } catch (error) {
                console.error(`Failed to unpublish post ${post.postId}:`, error);
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

    if (oldStatus === newStatus) {
        return {
            updated: false,
            unpublishedPosts: 0,
            restored: false,
            oldStatus,
            newStatus,
        };
    }

    // Update status (MLS is source of truth)
    await repository.updateListing(userId, listing.listingId, {
        status: newStatus,
        syncedAt: Date.now(),
    });

    let unpublishedPosts = 0;
    let restored = false;

    // Unpublish posts when sold
    if (newStatus === 'sold') {
        unpublishedPosts = await unpublishListingPosts(userId, listing.listingId);
    }

    // Restore from pending to active
    if (oldStatus === 'pending' && newStatus === 'active') {
        restored = true;
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
 * Sync status for all users
 */
async function syncAllUsers(): Promise<{
    totalUsers: number;
    totalListings: number;
    updatedListings: number;
    unpublishedPosts: number;
    restoredListings: number;
    errors: number;
}> {
    const repository = getRepository();
    const results = {
        totalUsers: 0,
        totalListings: 0,
        updatedListings: 0,
        unpublishedPosts: 0,
        restoredListings: 0,
        errors: 0,
    };

    try {
        // In a real implementation, you would:
        // 1. Query all users with active MLS connections
        // 2. For each user, sync their listings
        // 
        // For now, this is a placeholder that demonstrates the pattern
        // The actual implementation would need to scan the table for all users
        // or maintain a separate index of users with MLS connections

        console.log('Sync all users - implementation needed');
        console.log('This requires scanning for all users with MLS connections');

        return results;
    } catch (error) {
        console.error('Failed to sync all users:', error);
        throw error;
    }
}

/**
 * POST /api/cron/sync-mls-status
 * Triggered by cron service every 15 minutes
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        if (!verifyCronSecret(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Starting MLS status sync cron job...');
        const startTime = Date.now();

        // Sync all users
        const results = await syncAllUsers();

        const duration = Date.now() - startTime;

        console.log('MLS status sync completed:', {
            duration: `${duration}ms`,
            ...results,
        });

        return NextResponse.json({
            success: true,
            message: 'Status sync completed',
            duration,
            results,
        });
    } catch (error) {
        console.error('MLS status sync cron job failed:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/sync-mls-status
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        endpoint: 'MLS Status Sync Cron',
        interval: '15 minutes',
        note: 'Use POST with Authorization header to trigger sync',
    });
}
