/**
 * Integration Service Fallback Wrapper
 * 
 * Provides fallback to direct OAuth and MLS calls when the Integration Service is unavailable.
 * 
 * Requirements: 1.5 - Implement fallback for integration service failures
 */

import { oauthClient, mlsClient } from './client';
import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';
import { importMLSListings } from '@/app/mls-actions';

/**
 * Initiate OAuth flow with fallback
 */
export async function initiateOAuthWithFallback(
    platform: 'google' | 'facebook' | 'instagram' | 'linkedin' | 'twitter',
    userId: string
): Promise<{ authUrl: string; state: string }> {
    try {
        // Try integration service first
        if (platform === 'google') {
            return await oauthClient.initiateGoogleOAuth(userId);
        } else {
            return await oauthClient.initiateSocialOAuth(platform, userId);
        }
    } catch (error) {
        console.warn(`Integration service failed for ${platform} OAuth, falling back to direct call:`, error);

        // Fallback to direct OAuth manager
        const manager = getOAuthConnectionManager();
        const authUrl = await manager.initiateConnection(
            platform === 'google' ? 'google' : platform,
            userId
        );

        return {
            authUrl,
            state: Buffer.from(
                JSON.stringify({
                    userId,
                    platform,
                    timestamp: Date.now(),
                    nonce: Math.random().toString(36).substring(7),
                })
            ).toString('base64'),
        };
    }
}

/**
 * Sync MLS data with fallback
 */
export async function syncMLSDataWithFallback(
    userId: string,
    connectionId: string
): Promise<{
    syncId?: string;
    totalListings: number;
    successfulImports: number;
    failedImports: number;
}> {
    try {
        // Try integration service first
        // Note: This requires getting connection details first
        // For now, we'll fall back to the direct implementation
        throw new Error('Integration service MLS sync not yet fully implemented');
    } catch (error) {
        console.warn('Integration service failed for MLS sync, falling back to direct call:', error);

        // Fallback to direct MLS import
        const result = await importMLSListings(connectionId);

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to import MLS listings');
        }

        return {
            totalListings: result.data.totalListings,
            successfulImports: result.data.successfulImports,
            failedImports: result.data.failedImports,
        };
    }
}

/**
 * Check if integration service is available
 */
export async function checkIntegrationServiceHealth(): Promise<boolean> {
    try {
        const response = await fetch(
            `${process.env.INTEGRATION_SERVICE_API_URL || ''}/health`,
            {
                method: 'GET',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            }
        );

        return response.ok;
    } catch (error) {
        console.warn('Integration service health check failed:', error);
        return false;
    }
}
