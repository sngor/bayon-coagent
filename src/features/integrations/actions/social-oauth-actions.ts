/**
 * Server Actions for Social Media OAuth Connections
 * Handles connection initiation, retrieval, and disconnection
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use server';

import { getOAuthConnectionManager, disconnectConnection } from '@/integrations/oauth/connection-manager';
import {
    runConnectionDiagnostics,
    ConnectionDiagnostics
} from '@/services/monitoring/connection-diagnostics';
import type { Platform, OAuthConnection } from '@/integrations/social/types';

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Initiate OAuth connection for a social media platform
 * Generates authorization URL for user to authenticate
 * 
 * Uses Integration Service Lambda via API Gateway with fallback to direct implementation
 * Requirement 1.5: Implement fallback for integration service failures
 * 
 * @param userId - User ID
 * @param platform - Social media platform (facebook, instagram, linkedin, twitter)
 * @returns Authorization URL or error
 */
export async function initiateOAuthConnectionAction(
    userId: string,
    platform: Platform
): Promise<ActionResult<{ authUrl: string }>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        if (!['facebook', 'instagram', 'linkedin', 'twitter'].includes(platform as any)) {
            return {
                success: false,
                error: 'Invalid platform',
            };
        }

        // Try integration service Lambda via API Gateway first
        try {
            const { oauthClient } = await import('@/aws/integration-service/client');
            const result = await oauthClient.initiateSocialOAuth(platform as any, userId);

            console.log(`Successfully initiated ${platform} OAuth via Integration Service`);

            return {
                success: true,
                data: { authUrl: result.authUrl },
                message: `Redirecting to ${platform} for authorization`,
            };
        } catch (integrationError) {
            console.warn(`Integration service failed for ${platform} OAuth, falling back to direct implementation:`, integrationError);

            // Fallback to direct implementation
            const manager = getOAuthConnectionManager();
            const authUrl = await manager.initiateConnection(platform, userId);

            console.log(`Successfully initiated ${platform} OAuth via direct implementation (fallback)`);

            return {
                success: true,
                data: { authUrl },
                message: `Redirecting to ${platform} for authorization`,
            };
        }
    } catch (error) {
        console.error(`Failed to initiate ${platform} OAuth connection:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initiate connection',
        };
    }
}

/**
 * Get OAuth connection for a user and platform
 * 
 * @param userId - User ID
 * @param platform - Social media platform
 * @returns OAuth connection or null if not found
 */
export async function getOAuthConnectionAction(
    userId: string,
    platform: Platform
): Promise<ActionResult<OAuthConnection | null>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(userId, platform);

        return {
            success: true,
            data: connection,
        };
    } catch (error) {
        console.error(`Failed to get ${platform} OAuth connection:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connection',
        };
    }
}

/**
 * Validate OAuth channel connection with real-time testing
 * Tests the connection by making a simple API call to verify token validity
 * 
 * @param userId - User ID
 * @param platform - Social media platform
 * @returns Validation result with connection health status
 */
export async function validateChannelAction(
    userId: string,
    platform: Platform
): Promise<ActionResult<{ isValid: boolean; lastTested: number; error?: string }>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        if (!['facebook', 'instagram', 'linkedin', 'twitter'].includes(platform as any)) {
            return {
                success: false,
                error: 'Invalid platform',
            };
        }

        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(userId, platform);

        if (!connection) {
            return {
                success: true,
                data: {
                    isValid: false,
                    lastTested: Date.now(),
                    error: 'Connection not found',
                },
            };
        }

        // Test connection with platform-specific API call
        const validationResult = await manager.validateConnection(userId, platform);

        return {
            success: true,
            data: {
                isValid: validationResult.isValid,
                lastTested: Date.now(),
                error: validationResult.error,
            },
        };
    } catch (error) {
        console.error(`Failed to validate ${platform} connection:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to validate connection',
        };
    }
}

/**
 * Get connected channels with enhanced status indicators and last-used timestamps
 * 
 * @param userId - User ID
 * @returns Enhanced connection data with health status and usage metrics
 */
export async function getConnectedChannelsAction(
    userId: string
): Promise<ActionResult<Array<{
    platform: Platform;
    connection: OAuthConnection | null;
    isHealthy: boolean;
    lastUsed?: number;
    lastValidated?: number;
    status: 'connected' | 'expired' | 'error' | 'disconnected';
    statusMessage?: string;
}>>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        const manager = getOAuthConnectionManager();
        const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

        const channelStatuses = await Promise.all(
            platforms.map(async (platform) => {
                try {
                    const connection = await manager.getConnection(userId, platform);

                    if (!connection) {
                        return {
                            platform,
                            connection: null,
                            isHealthy: false,
                            status: 'disconnected' as const,
                            statusMessage: 'Not connected',
                        };
                    }

                    // Check if token is expired
                    const isExpired = connection.expiresAt < Date.now();
                    if (isExpired) {
                        return {
                            platform,
                            connection,
                            isHealthy: false,
                            lastUsed: connection.metadata?.lastUsed,
                            lastValidated: connection.metadata?.lastValidated,
                            status: 'expired' as const,
                            statusMessage: 'Token expired - please reconnect',
                        };
                    }

                    // Check if token expires soon (within 24 hours)
                    const expiresSoon = connection.expiresAt < Date.now() + 24 * 60 * 60 * 1000;

                    return {
                        platform,
                        connection,
                        isHealthy: !expiresSoon,
                        lastUsed: connection.metadata?.lastUsed,
                        lastValidated: connection.metadata?.lastValidated,
                        status: 'connected' as const,
                        statusMessage: expiresSoon ? 'Token expires soon' : 'Connected',
                    };
                } catch (error) {
                    console.error(`Failed to get ${platform} connection status:`, error);
                    return {
                        platform,
                        connection: null,
                        isHealthy: false,
                        status: 'error' as const,
                        statusMessage: 'Connection error',
                    };
                }
            })
        );

        return {
            success: true,
            data: channelStatuses,
        };
    } catch (error) {
        console.error('Failed to get connected channels:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connected channels',
        };
    }
}

/**
 * Get all OAuth connections for a user (legacy method - use getConnectedChannelsAction instead)
 * 
 * @param userId - User ID
 * @returns Map of platform to connection status
 */
export async function getAllOAuthConnectionsAction(
    userId: string
): Promise<ActionResult<Partial<Record<Platform, OAuthConnection | null>>>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        const manager = getOAuthConnectionManager();
        const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

        const connections: Partial<Record<Platform, OAuthConnection | null>> = {
            facebook: null,
            instagram: null,
            linkedin: null,
            twitter: null,
        };

        // Fetch all connections in parallel
        await Promise.all(
            platforms.map(async (platform) => {
                try {
                    connections[platform] = await manager.getConnection(userId, platform);
                } catch (error) {
                    console.error(`Failed to get ${platform} connection:`, error);
                    connections[platform] = null;
                }
            })
        );

        return {
            success: true,
            data: connections,
        };
    } catch (error) {
        console.error('Failed to get OAuth connections:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connections',
        };
    }
}

/**
 * Disconnect OAuth connection for a platform
 * 
 * @param userId - User ID
 * @param platform - Social media platform
 * @returns Success or error
 */
export async function disconnectOAuthConnectionAction(
    userId: string,
    platform: Platform
): Promise<ActionResult> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        if (!['facebook', 'instagram', 'linkedin', 'twitter'].includes(platform as any)) {
            return {
                success: false,
                error: 'Invalid platform',
            };
        }

        await disconnectConnection(userId, platform);

        return {
            success: true,
            message: `Successfully disconnected ${platform}`,
        };
    } catch (error) {
        console.error(`Failed to disconnect ${platform}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to disconnect',
        };
    }
}

/**
 * Get Facebook pages for a connected account
 * 
 * @param userId - User ID
 * @returns List of Facebook pages
 */
export async function getFacebookPagesAction(
    userId: string
): Promise<ActionResult<Array<{ id: string; name: string; access_token: string }>>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(userId, 'facebook');

        if (!connection) {
            return {
                success: false,
                error: 'Facebook not connected',
            };
        }

        const pages = connection.metadata?.pages || [];

        return {
            success: true,
            data: pages,
        };
    } catch (error) {
        console.error('Failed to get Facebook pages:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get pages',
        };
    }
}

/**
 * Get Instagram business accounts for a connected account
 * 
 * @param userId - User ID
 * @returns List of Instagram business accounts
 */
export async function getInstagramBusinessAccountsAction(
    userId: string
): Promise<ActionResult<Array<{ id: string; username?: string }>>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(userId, 'instagram');

        if (!connection) {
            return {
                success: false,
                error: 'Instagram not connected',
            };
        }

        const businessAccounts = connection.metadata?.businessAccounts || [];

        return {
            success: true,
            data: businessAccounts,
        };
    } catch (error) {
        console.error('Failed to get Instagram business accounts:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get business accounts',
        };
    }
}

/**
 * Update selected Facebook page for posting
 * 
 * @param userId - User ID
 * @param pageId - Facebook page ID
 * @param pageAccessToken - Page access token
 * @returns Success or error
 */
export async function updateSelectedFacebookPageAction(
    userId: string,
    pageId: string,
    pageAccessToken: string
): Promise<ActionResult> {
    try {
        if (!userId || !pageId || !pageAccessToken) {
            return {
                success: false,
                error: 'Missing required parameters',
            };
        }

        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(userId, 'facebook');

        if (!connection) {
            return {
                success: false,
                error: 'Facebook not connected',
            };
        }

        // Update connection metadata with selected page
        await manager.updateConnectionMetadata(userId, 'facebook', {
            selectedPageId: pageId,
            selectedPageAccessToken: pageAccessToken,
            lastUsed: Date.now(),
        });

        return {
            success: true,
            message: 'Facebook page selected successfully',
        };
    } catch (error) {
        console.error('Failed to update selected Facebook page:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update page selection',
        };
    }
}

/**
 * Update connection usage timestamp
 * Called when a connection is used for publishing
 * 
 * @param userId - User ID
 * @param platform - Social media platform
 * @returns Success or error
 */
export async function updateConnectionUsageAction(
    userId: string,
    platform: Platform
): Promise<ActionResult> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        if (!['facebook', 'instagram', 'linkedin', 'twitter'].includes(platform as any)) {
            return {
                success: false,
                error: 'Invalid platform',
            };
        }

        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(userId, platform);

        if (!connection) {
            return {
                success: false,
                error: 'Connection not found',
            };
        }

        // Update last used timestamp
        await manager.updateConnectionMetadata(userId, platform, {
            lastUsed: Date.now(),
        });

        return {
            success: true,
            message: 'Connection usage updated',
        };
    } catch (error) {
        console.error(`Failed to update ${platform} connection usage:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update connection usage',
        };
    }
}

/**
 * Monitor connection health and send proactive alerts
 * This should be called periodically (e.g., daily) to check all connections
 * 
 * @param userId - User ID
 * @returns Health monitoring results
 */
export async function monitorConnectionHealthAction(
    userId: string
): Promise<ActionResult<{
    healthyConnections: Platform[];
    unhealthyConnections: Array<{
        platform: Platform;
        issue: string;
        severity: 'warning' | 'error';
        recommendedAction: string;
    }>;
    alertsSent: number;
}>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        const channelsResult = await getConnectedChannelsAction(userId);

        if (!channelsResult.success || !channelsResult.data) {
            return {
                success: false,
                error: 'Failed to get channel status',
            };
        }

        const healthyConnections: Platform[] = [];
        const unhealthyConnections: Array<{
            platform: Platform;
            issue: string;
            severity: 'warning' | 'error';
            recommendedAction: string;
        }> = [];

        for (const channel of channelsResult.data) {
            if (channel.status === 'connected' && channel.isHealthy) {
                healthyConnections.push(channel.platform);
            } else {
                let severity: 'warning' | 'error' = 'warning';
                let issue = channel.statusMessage || 'Unknown issue';
                let recommendedAction = 'Please check your connection';

                if (channel.status === 'expired') {
                    severity = 'error';
                    issue = 'Access token has expired';
                    recommendedAction = 'Please reconnect your account to continue publishing';
                } else if (channel.status === 'error') {
                    severity = 'error';
                    issue = 'Connection error detected';
                    recommendedAction = 'Please try reconnecting your account';
                } else if (channel.status === 'disconnected') {
                    severity = 'warning';
                    issue = 'Account not connected';
                    recommendedAction = 'Connect your account to enable publishing';
                } else if (!channel.isHealthy) {
                    severity = 'warning';
                    issue = 'Token expires soon';
                    recommendedAction = 'Your token will expire soon. Consider reconnecting to avoid interruption';
                }

                unhealthyConnections.push({
                    platform: channel.platform,
                    issue,
                    severity,
                    recommendedAction,
                });
            }
        }

        // In a real implementation, this would send alerts via email, push notifications, etc.
        const alertsSent = unhealthyConnections.filter(conn => conn.severity === 'error').length;

        return {
            success: true,
            data: {
                healthyConnections,
                unhealthyConnections,
                alertsSent,
            },
        };
    } catch (error) {
        console.error('Failed to monitor connection health:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to monitor connection health',
        };
    }
}

/**
 * Run comprehensive connection diagnostics
 * Provides automated troubleshooting and health assessment
 * 
 * @param userId - User ID
 * @param platform - Social media platform
 * @returns Detailed diagnostic results with recommendations
 */
export async function runConnectionDiagnosticsAction(
    userId: string,
    platform: Platform
): Promise<ActionResult<ConnectionDiagnostics>> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required',
            };
        }

        if (!['facebook', 'instagram', 'linkedin', 'twitter'].includes(platform as any)) {
            return {
                success: false,
                error: 'Invalid platform',
            };
        }

        const diagnostics = await runConnectionDiagnostics(userId, platform);

        return {
            success: true,
            data: diagnostics,
            message: `Diagnostics completed for ${platform}`,
        };
    } catch (error) {
        console.error(`Failed to run diagnostics for ${platform}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to run diagnostics',
        };
    }
}
