/**
 * Zapier Integration Manager
 * 
 * Main integration service for Zapier platform.
 * Implements the IntegrationService interface for OAuth and connection management.
 */

import { randomUUID } from 'crypto';
import {
    IntegrationProvider,
    IntegrationType,
    IntegrationConnection,
    IntegrationResult,
    IntegrationCredentials,
    BaseIntegration
} from '../types';
import { IntegrationService } from '../integration-manager';
import { integrationRepository } from '../integration-repository';
import { ZAPIER_ENDPOINTS, ZAPIER_SCOPES } from './constants';
import { ZapierConnection, ZapConfig } from './types';

/**
 * Zapier OAuth Manager
 * Handles OAuth 2.0 authentication with Zapier
 */
class ZapierOAuthManager implements IntegrationService {
    provider: IntegrationProvider = 'zapier';
    type: IntegrationType = 'automation';

    /**
     * Initiate Zapier OAuth connection
     */
    async connect(userId: string, config?: Record<string, any>): Promise<IntegrationResult<string>> {
        try {
            const clientId = process.env.ZAPIER_CLIENT_ID;
            const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/zapier/callback`;

            if (!clientId) {
                return {
                    success: false,
                    error: 'Zapier client ID not configured'
                };
            }

            // Generate state for CSRF protection
            const state = randomUUID();

            // Store state temporarily (in production, use Redis or DynamoDB with TTL)
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify({
                    userId,
                    timestamp: Date.now()
                }));
            }

            // Build authorization URL
            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: ZAPIER_SCOPES.join(' '),
                state,
                response_type: 'code'
            });

            const authUrl = `${ZAPIER_ENDPOINTS.auth}?${params.toString()}`;

            return {
                success: true,
                data: authUrl,
                metadata: { state }
            };
        } catch (error) {
            console.error('Failed to initiate Zapier connection:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to connect to Zapier'
            };
        }
    }

    /**
     * Handle OAuth callback and exchange code for tokens
     */
    async handleCallback(code: string, state: string, userId: string): Promise<IntegrationResult<IntegrationConnection>> {
        try {
            const clientId = process.env.ZAPIER_CLIENT_ID;
            const clientSecret = process.env.ZAPIER_CLIENT_SECRET;
            const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/zapier/callback`;

            if (!clientId || !clientSecret) {
                return {
                    success: false,
                    error: 'Zapier credentials not configured'
                };
            }

            // Exchange code for access token
            const tokenResponse = await fetch(ZAPIER_ENDPOINTS.token, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: redirectUri,
                    client_id: clientId,
                    client_secret: clientSecret
                }).toString()
            });

            if (!tokenResponse.ok) {
                const error = await tokenResponse.text();
                return {
                    success: false,
                    error: `Token exchange failed: ${error}`
                };
            }

            const tokenData = await tokenResponse.json();

            // Create integration connection
            const credentials: IntegrationCredentials = {
                provider: 'zapier',
                authMethod: 'oauth2',
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: Date.now() + (tokenData.expires_in * 1000),
                scope: [...ZAPIER_SCOPES]
            };

            const connection: IntegrationConnection = {
                id: `zapier#${Date.now()}`,
                userId,
                provider: 'zapier',
                type: 'automation',
                status: 'active',
                credentials,
                metadata: {
                    webhookEndpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/zapier`,
                    subscribedZaps: []
                },
                createdAt: Date.now(),
                updatedAt: Date.now(),
                expiresAt: credentials.expiresAt
            };

            // Store connection
            await integrationRepository.create(connection);

            return {
                success: true,
                data: connection
            };
        } catch (error) {
            console.error('Failed to handle Zapier callback:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Callback handling failed'
            };
        }
    }

    /**
     * Disconnect Zapier integration
     */
    async disconnect(userId: string): Promise<IntegrationResult<void>> {
        try {
            await integrationRepository.deleteByProvider(userId, 'zapier');

            return {
                success: true
            };
        } catch (error) {
            console.error('Failed to disconnect Zapier:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Disconnection failed'
            };
        }
    }

    /**
     * Validate Zapier connection
     */
    async validate(connection: IntegrationConnection): Promise<IntegrationResult<boolean>> {
        try {
            // Check if token is expired
            if (connection.expiresAt && connection.expiresAt < Date.now()) {
                return {
                    success: false,
                    data: false,
                    error: 'Token expired'
                };
            }

            // Test API access with a simple call
            const response = await fetch(`${ZAPIER_ENDPOINTS.api}/profile`, {
                headers: {
                    'Authorization': `Bearer ${connection.credentials.accessToken}`
                }
            });

            if (!response.ok) {
                return {
                    success: false,
                    data: false,
                    error: 'API validation failed'
                };
            }

            return {
                success: true,
                data: true
            };
        } catch (error) {
            console.error('Failed to validate Zapier connection:', error);
            return {
                success: false,
                data: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Refresh OAuth token
     */
    async refresh(connection: IntegrationConnection): Promise<IntegrationResult<IntegrationConnection>> {
        try {
            const clientId = process.env.ZAPIER_CLIENT_ID;
            const clientSecret = process.env.ZAPIER_CLIENT_SECRET;

            if (!clientId || !clientSecret || !connection.credentials.refreshToken) {
                return {
                    success: false,
                    error: 'Missing credentials for token refresh'
                };
            }

            const response = await fetch(ZAPIER_ENDPOINTS.token, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: connection.credentials.refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret
                }).toString()
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: 'Token refresh failed'
                };
            }

            const tokenData = await response.json();

            // Update connection with new tokens
            const updatedConnection: IntegrationConnection = {
                ...connection,
                credentials: {
                    ...connection.credentials,
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token || connection.credentials.refreshToken,
                    expiresAt: Date.now() + (tokenData.expires_in * 1000)
                },
                updatedAt: Date.now(),
                expiresAt: Date.now() + (tokenData.expires_in * 1000)
            };

            await integrationRepository.update(updatedConnection);

            return {
                success: true,
                data: updatedConnection
            };
        } catch (error) {
            console.error('Failed to refresh Zapier token:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token refresh failed'
            };
        }
    }

    /**
     * Subscribe to a Zap trigger
     */
    async subscribeToZap(userId: string, zapConfig: ZapConfig): Promise<IntegrationResult<void>> {
        try {
            const connection = await integrationRepository.getByProvider(userId, 'zapier');

            if (!connection) {
                return {
                    success: false,
                    error: 'Zapier not connected'
                };
            }

            // Update connection metadata with new Zap
            const subscribedZaps = (connection.metadata.subscribedZaps as ZapConfig[]) || [];
            subscribedZaps.push(zapConfig);

            const updatedConnection: IntegrationConnection = {
                ...connection,
                metadata: {
                    ...connection.metadata,
                    subscribedZaps
                },
                updatedAt: Date.now()
            };

            await integrationRepository.update(updatedConnection);

            return {
                success: true
            };
        } catch (error) {
            console.error('Failed to subscribe to Zap:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Subscription failed'
            };
        }
    }

    /**
     * Unsubscribe from a Zap
     */
    async unsubscribeFromZap(userId: string, zapId: string): Promise<IntegrationResult<void>> {
        try {
            const connection = await integrationRepository.getByProvider(userId, 'zapier');

            if (!connection) {
                return {
                    success: false,
                    error: 'Zapier not connected'
                };
            }

            // Remove Zap from subscriptions
            const subscribedZaps = ((connection.metadata.subscribedZaps as ZapConfig[]) || [])
                .filter(zap => zap.id !== zapId);

            const updatedConnection: IntegrationConnection = {
                ...connection,
                metadata: {
                    ...connection.metadata,
                    subscribedZaps
                },
                updatedAt: Date.now()
            };

            await integrationRepository.update(updatedConnection);

            return {
                success: true
            };
        } catch (error) {
            console.error('Failed to unsubscribe from Zap:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unsubscribe failed'
            };
        }
    }

    /**
     * Get all subscribed Zaps for a user
     */
    async getSubscribedZaps(userId: string): Promise<IntegrationResult<ZapConfig[]>> {
        try {
            const connection = await integrationRepository.getByProvider(userId, 'zapier');

            if (!connection) {
                return {
                    success: false,
                    error: 'Zapier not connected'
                };
            }

            const subscribedZaps = (connection.metadata.subscribedZaps as ZapConfig[]) || [];

            return {
                success: true,
                data: subscribedZaps
            };
        } catch (error) {
            console.error('Failed to get subscribed Zaps:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve Zaps'
            };
        }
    }
}

// Export singleton instance
export const zapierManager = new ZapierOAuthManager();
