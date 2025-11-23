/**
 * Content Workflow OAuth Actions
 * 
 * Server actions for managing OAuth connections with enhanced analytics scopes
 * for content workflow features including scheduling and performance tracking.
 * 
 * Requirements: 8.1
 */

'use server';

import { z } from 'zod';
import { getOAuthConnectionManager } from '@/integrations/oauth';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import { Platform } from '@/integrations/social/types';

/**
 * Input validation schemas
 */
const InitiateConnectionSchema = z.object({
    platform: z.enum(['facebook', 'instagram', 'linkedin', 'twitter']),
});

const ValidateAnalyticsSchema = z.object({
    platform: z.enum(['facebook', 'instagram', 'linkedin', 'twitter']),
});

const DisconnectConnectionSchema = z.object({
    platform: z.enum(['facebook', 'instagram', 'linkedin', 'twitter']),
});

/**
 * Response types
 */
interface ActionResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Initiate OAuth connection with enhanced analytics scopes
 * 
 * @param input - Platform to connect
 * @returns Authorization URL or error
 */
export async function initiateContentWorkflowConnection(
    input: z.infer<typeof InitiateConnectionSchema>
): Promise<ActionResponse<{ authUrl: string }>> {
    try {
        // Validate input
        const { platform } = InitiateConnectionSchema.parse(input);

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }

        // Get OAuth manager and initiate connection
        const manager = getOAuthConnectionManager();
        const authUrl = await manager.initiateConnection(platform, user.id);

        return {
            success: true,
            data: { authUrl },
            message: `Redirecting to ${platform} for authorization with analytics permissions`,
        };
    } catch (error) {
        console.error('Failed to initiate content workflow connection:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to initiate connection',
        };
    }
}

/**
 * Validate analytics access for existing connection
 * 
 * @param input - Platform to validate
 * @returns Analytics validation result
 */
export async function validateAnalyticsAccess(
    input: z.infer<typeof ValidateAnalyticsSchema>
): Promise<ActionResponse<{
    hasAccess: boolean;
    availableMetrics?: string[];
    connectionStatus: string;
}>> {
    try {
        // Validate input
        const { platform } = ValidateAnalyticsSchema.parse(input);

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }

        // Get OAuth manager and validate analytics access
        const manager = getOAuthConnectionManager();
        const validation = await manager.validateAnalyticsAccess(user.id, platform);

        // Also check general connection status
        const connectionValidation = await manager.validateConnection(user.id, platform);

        return {
            success: true,
            data: {
                hasAccess: validation.hasAccess,
                availableMetrics: validation.availableMetrics,
                connectionStatus: connectionValidation.isValid ? 'connected' : 'disconnected',
            },
            message: validation.hasAccess
                ? `Analytics access confirmed for ${platform}`
                : `Analytics access not available: ${validation.error}`,
        };
    } catch (error) {
        console.error('Failed to validate analytics access:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to validate analytics access',
        };
    }
}

/**
 * Get connection status with analytics capabilities
 * 
 * @param input - Platform to check
 * @returns Connection status and capabilities
 */
export async function getConnectionStatus(
    input: z.infer<typeof ValidateAnalyticsSchema>
): Promise<ActionResponse<{
    isConnected: boolean;
    hasAnalyticsAccess: boolean;
    platformUsername?: string;
    lastValidated?: number;
    availableMetrics?: string[];
    scopes?: string[];
}>> {
    try {
        // Validate input
        const { platform } = ValidateAnalyticsSchema.parse(input);

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }

        // Get OAuth manager and connection
        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(user.id, platform);

        if (!connection) {
            return {
                success: true,
                data: {
                    isConnected: false,
                    hasAnalyticsAccess: false,
                },
                message: `No ${platform} connection found`,
            };
        }

        // Validate analytics access
        const analyticsValidation = await manager.validateAnalyticsAccess(user.id, platform);

        return {
            success: true,
            data: {
                isConnected: true,
                hasAnalyticsAccess: analyticsValidation.hasAccess,
                platformUsername: connection.platformUsername,
                lastValidated: connection.metadata?.lastValidated,
                availableMetrics: analyticsValidation.availableMetrics,
                scopes: connection.scope,
            },
            message: `${platform} connection status retrieved`,
        };
    } catch (error) {
        console.error('Failed to get connection status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connection status',
        };
    }
}

/**
 * Disconnect OAuth connection
 * 
 * @param input - Platform to disconnect
 * @returns Disconnection result
 */
export async function disconnectContentWorkflowConnection(
    input: z.infer<typeof DisconnectConnectionSchema>
): Promise<ActionResponse> {
    try {
        // Validate input
        const { platform } = DisconnectConnectionSchema.parse(input);

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }

        // Import the disconnect helper function
        const { disconnectConnection } = await import('@/integrations/oauth');
        await disconnectConnection(user.id, platform);

        return {
            success: true,
            message: `Successfully disconnected ${platform} account`,
        };
    } catch (error) {
        console.error('Failed to disconnect connection:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to disconnect connection',
        };
    }
}

/**
 * Get all connected platforms with their analytics capabilities
 * 
 * @returns List of connected platforms and their capabilities
 */
export async function getAllConnectionStatuses(): Promise<ActionResponse<{
    connections: Array<{
        platform: Platform;
        isConnected: boolean;
        hasAnalyticsAccess: boolean;
        platformUsername?: string;
        lastValidated?: number;
        availableMetrics?: string[];
    }>;
}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }

        const manager = getOAuthConnectionManager();
        const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];
        const connections = [];

        // Check each platform
        for (const platform of platforms) {
            try {
                const connection = await manager.getConnection(user.id, platform);

                if (connection) {
                    const analyticsValidation = await manager.validateAnalyticsAccess(user.id, platform);

                    connections.push({
                        platform,
                        isConnected: true,
                        hasAnalyticsAccess: analyticsValidation.hasAccess,
                        platformUsername: connection.platformUsername,
                        lastValidated: connection.metadata?.lastValidated,
                        availableMetrics: analyticsValidation.availableMetrics,
                    });
                } else {
                    connections.push({
                        platform,
                        isConnected: false,
                        hasAnalyticsAccess: false,
                    });
                }
            } catch (error) {
                console.error(`Failed to check ${platform} connection:`, error);
                connections.push({
                    platform,
                    isConnected: false,
                    hasAnalyticsAccess: false,
                });
            }
        }

        return {
            success: true,
            data: { connections },
            message: 'Retrieved all connection statuses',
        };
    } catch (error) {
        console.error('Failed to get all connection statuses:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connection statuses',
        };
    }
}

/**
 * Refresh connection token and validate analytics access
 * 
 * @param input - Platform to refresh
 * @returns Refresh result
 */
export async function refreshConnectionToken(
    input: z.infer<typeof ValidateAnalyticsSchema>
): Promise<ActionResponse<{
    refreshed: boolean;
    hasAnalyticsAccess: boolean;
    expiresAt: number;
}>> {
    try {
        // Validate input
        const { platform } = ValidateAnalyticsSchema.parse(input);

        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated',
            };
        }

        // Get OAuth manager and connection
        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(user.id, platform);

        if (!connection) {
            return {
                success: false,
                error: `No ${platform} connection found`,
            };
        }

        // Refresh token
        const refreshedConnection = await manager.refreshToken(connection);

        // Validate analytics access with new token
        const analyticsValidation = await manager.validateAnalyticsAccess(user.id, platform);

        return {
            success: true,
            data: {
                refreshed: true,
                hasAnalyticsAccess: analyticsValidation.hasAccess,
                expiresAt: refreshedConnection.expiresAt,
            },
            message: `Successfully refreshed ${platform} token`,
        };
    } catch (error) {
        console.error('Failed to refresh connection token:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to refresh token',
        };
    }
}