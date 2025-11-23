/**
 * OAuth Connection Manager
 * 
 * Manages OAuth 2.0 connections for social media platforms (Facebook, Instagram, LinkedIn).
 * Handles authentication flows, token storage, refresh logic, and connection management.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import { randomUUID } from 'crypto';
import { getRepository } from '@/aws/dynamodb/repository';
import { getSocialConnectionKeys } from '@/aws/dynamodb/keys';
import {
    OAuthConnection,
    Platform
} from '../social/types';
import {
    OAUTH_SCOPES,
    PLATFORM_API_ENDPOINTS,
    ANALYTICS_API_ENDPOINTS,
    ANALYTICS_METRICS
} from '../social/constants';
import { OAuthConnectionSchema } from '../social/schemas';

/**
 * OAuth Connection Manager Interface
 */
export interface OAuthConnectionManager {
    initiateConnection(platform: Platform, userId: string): Promise<string>;
    handleCallback(platform: Platform, code: string, state: string): Promise<OAuthConnection>;
    refreshToken(connection: OAuthConnection): Promise<OAuthConnection>;
    disconnect(connectionId: string): Promise<void>;
    getConnection(userId: string, platform: Platform): Promise<OAuthConnection | null>;
    updateConnectionMetadata(userId: string, platform: Platform, metadata: Record<string, any>): Promise<OAuthConnection>;
    validateConnection(userId: string, platform: Platform): Promise<{ isValid: boolean; error?: string }>;
    // New methods for content workflow features
    validateAnalyticsAccess(userId: string, platform: Platform): Promise<{ hasAccess: boolean; error?: string; availableMetrics?: string[] }>;
    getConnectionForAnalytics(userId: string, platform: Platform): Promise<OAuthConnection | null>;
}

/**
 * OAuth state data stored temporarily during auth flow
 */
interface OAuthState {
    userId: string;
    platform: Platform;
    timestamp: number;
    nonce: string;
}

/**
 * Platform-specific OAuth configuration
 */
interface PlatformOAuthConfig {
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string[];
}

/**
 * In-memory state storage for OAuth flows
 * In production, this should be replaced with Redis or DynamoDB with TTL
 */
const oauthStateStore = new Map<string, OAuthState>();

/**
 * Get OAuth configuration for a platform
 */
function getPlatformConfig(platform: Platform): PlatformOAuthConfig {
    const baseRedirectUri = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    switch (platform) {
        case 'facebook':
            return {
                authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
                tokenUrl: `${PLATFORM_API_ENDPOINTS.facebook}/oauth/access_token`,
                clientId: process.env.FACEBOOK_APP_ID || '',
                clientSecret: process.env.FACEBOOK_APP_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/facebook/callback`,
                scope: OAUTH_SCOPES.facebook,
            };
        case 'instagram':
            return {
                authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
                tokenUrl: `${PLATFORM_API_ENDPOINTS.instagram}/oauth/access_token`,
                clientId: process.env.FACEBOOK_APP_ID || '', // Instagram uses Facebook App
                clientSecret: process.env.FACEBOOK_APP_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/instagram/callback`,
                scope: OAUTH_SCOPES.instagram,
            };
        case 'linkedin':
            return {
                authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
                tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
                clientId: process.env.LINKEDIN_CLIENT_ID || '',
                clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/linkedin/callback`,
                scope: OAUTH_SCOPES.linkedin,
            };
        case 'twitter':
            return {
                authUrl: 'https://twitter.com/i/oauth2/authorize',
                tokenUrl: 'https://api.twitter.com/2/oauth2/token',
                clientId: process.env.TWITTER_CLIENT_ID || '',
                clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/twitter/callback`,
                scope: OAUTH_SCOPES.twitter,
            };
    }
}

/**
 * Encrypt sensitive data (tokens)
 * In production, use AWS KMS for encryption
 */
function encryptToken(token: string): string {
    // TODO: Implement proper encryption using AWS KMS
    // For now, return as-is (will be encrypted at rest by DynamoDB encryption)
    return token;
}

/**
 * Decrypt sensitive data (tokens)
 */
function decryptToken(encryptedToken: string): string {
    // TODO: Implement proper decryption using AWS KMS
    return encryptedToken;
}

/**
 * OAuth Connection Manager Implementation
 */
export class OAuthConnectionManagerImpl implements OAuthConnectionManager {
    /**
     * Initiate OAuth connection flow
     * Generates authorization URL and stores state
     * 
     * @param platform - Social media platform
     * @param userId - User ID
     * @returns Authorization URL to redirect user to
     */
    async initiateConnection(platform: Platform, userId: string): Promise<string> {
        const config = getPlatformConfig(platform);

        // Generate state parameter for CSRF protection
        const state = randomUUID();
        const nonce = randomUUID();

        // Store state temporarily (expires in 10 minutes)
        const stateData: OAuthState = {
            userId,
            platform,
            timestamp: Date.now(),
            nonce,
        };
        oauthStateStore.set(state, stateData);

        // Clean up expired states (older than 10 minutes)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        for (const [key, value] of oauthStateStore.entries()) {
            if (value.timestamp < tenMinutesAgo) {
                oauthStateStore.delete(key);
            }
        }

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scope.join(','),
            state,
            response_type: 'code',
        });

        return `${config.authUrl}?${params.toString()}`;
    }

    /**
     * Handle OAuth callback
     * Exchanges authorization code for access token and stores connection
     * 
     * @param platform - Social media platform
     * @param code - Authorization code from OAuth provider
     * @param state - State parameter for CSRF validation
     * @returns OAuth connection object
     */
    async handleCallback(
        platform: Platform,
        code: string,
        state: string
    ): Promise<OAuthConnection> {
        // Validate state parameter
        const stateData = oauthStateStore.get(state);
        if (!stateData) {
            throw new Error('Invalid or expired OAuth state');
        }

        if (stateData.platform !== platform) {
            throw new Error('Platform mismatch in OAuth callback');
        }

        // Remove used state
        oauthStateStore.delete(state);

        const config = getPlatformConfig(platform);

        // Exchange code for access token
        const tokenResponse = await this.exchangeCodeForToken(
            config,
            code
        );

        // Get user info from platform
        const userInfo = await this.getPlatformUserInfo(
            platform,
            tokenResponse.access_token
        );

        // Create connection object
        const connection: OAuthConnection = {
            id: randomUUID(),
            userId: stateData.userId,
            platform,
            accessToken: encryptToken(tokenResponse.access_token),
            refreshToken: encryptToken(tokenResponse.refresh_token || ''),
            expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
            scope: config.scope,
            platformUserId: userInfo.id,
            platformUsername: userInfo.username,
            metadata: userInfo.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Validate connection data
        OAuthConnectionSchema.parse(connection);

        // Store connection in DynamoDB
        await this.storeConnection(connection);

        return connection;
    }

    /**
     * Refresh OAuth access token
     * 
     * @param connection - Existing OAuth connection
     * @returns Updated OAuth connection with new tokens
     */
    async refreshToken(connection: OAuthConnection): Promise<OAuthConnection> {
        const config = getPlatformConfig(connection.platform);

        // Decrypt refresh token
        const refreshToken = decryptToken(connection.refreshToken);

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        // Request new access token
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: config.clientId,
            client_secret: config.clientSecret,
        });

        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token refresh failed: ${error}`);
        }

        const tokenData = await response.json();

        // Update connection with new tokens
        const updatedConnection: OAuthConnection = {
            ...connection,
            accessToken: encryptToken(tokenData.access_token),
            refreshToken: encryptToken(tokenData.refresh_token || connection.refreshToken),
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            updatedAt: Date.now(),
        };

        // Store updated connection
        await this.storeConnection(updatedConnection);

        return updatedConnection;
    }

    /**
     * Disconnect OAuth connection
     * Removes connection from database
     * 
     * @param connectionId - Connection ID to disconnect
     */
    async disconnect(connectionId: string): Promise<void> {
        // Note: We need to query by connectionId to get userId and platform
        // This is a limitation of the current key structure
        // In production, consider adding a GSI for connectionId lookups

        // For now, we'll need to pass userId and platform separately
        // This method signature should be updated in the interface
        throw new Error('disconnect method requires userId and platform - interface needs update');
    }

    /**
     * Get OAuth connection for a user and platform
     * 
     * @param userId - User ID
     * @param platform - Social media platform
     * @returns OAuth connection or null if not found
     */
    async getConnection(
        userId: string,
        platform: Platform
    ): Promise<OAuthConnection | null> {
        const repository = getRepository();
        const keys = getSocialConnectionKeys(userId, platform);

        try {
            const item = await repository.getItem<OAuthConnection>(keys.PK, keys.SK);

            if (!item) {
                return null;
            }

            // Extract connection from Data field
            const connection = item.Data;

            // Decrypt tokens before returning
            connection.accessToken = decryptToken(connection.accessToken);
            connection.refreshToken = decryptToken(connection.refreshToken);

            // Check if token is expired and refresh if needed
            if (connection.expiresAt < Date.now() + 5 * 60 * 1000) { // Refresh if expires in < 5 minutes
                return await this.refreshToken(connection);
            }

            return connection;
        } catch (error) {
            console.error('Failed to get OAuth connection:', error);
            return null;
        }
    }

    /**
     * Exchange authorization code for access token
     * @private
     */
    private async exchangeCodeForToken(
        config: PlatformOAuthConfig,
        code: string
    ): Promise<{
        access_token: string;
        refresh_token?: string;
        expires_in: number;
    }> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: config.redirectUri,
            client_id: config.clientId,
            client_secret: config.clientSecret,
        });

        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token exchange failed: ${error}`);
        }

        return await response.json();
    }

    /**
     * Get user information from platform API
     * @private
     */
    private async getPlatformUserInfo(
        platform: Platform,
        accessToken: string
    ): Promise<{
        id: string;
        username: string;
        metadata?: Record<string, any>;
    }> {
        switch (platform) {
            case 'facebook':
                return await this.getFacebookUserInfo(accessToken);
            case 'instagram':
                return await this.getInstagramUserInfo(accessToken);
            case 'linkedin':
                return await this.getLinkedInUserInfo(accessToken);
            case 'twitter':
                return await this.getTwitterUserInfo(accessToken);
        }
    }

    /**
     * Get Facebook user info
     * @private
     */
    private async getFacebookUserInfo(accessToken: string): Promise<{
        id: string;
        username: string;
        metadata?: Record<string, any>;
    }> {
        const response = await fetch(
            `${PLATFORM_API_ENDPOINTS.facebook}/me?fields=id,name&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error('Failed to get Facebook user info');
        }

        const data = await response.json();

        // Get user's pages for posting
        const pagesResponse = await fetch(
            `${PLATFORM_API_ENDPOINTS.facebook}/me/accounts?access_token=${accessToken}`
        );

        const pagesData = await pagesResponse.json();

        return {
            id: data.id,
            username: data.name,
            metadata: {
                pages: pagesData.data || [],
            },
        };
    }

    /**
     * Get Instagram user info
     * @private
     */
    private async getInstagramUserInfo(accessToken: string): Promise<{
        id: string;
        username: string;
        metadata?: Record<string, any>;
    }> {
        // Instagram uses Facebook Graph API
        const response = await fetch(
            `${PLATFORM_API_ENDPOINTS.instagram}/me?fields=id,username&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error('Failed to get Instagram user info');
        }

        const data = await response.json();

        // Get Instagram business account
        const accountsResponse = await fetch(
            `${PLATFORM_API_ENDPOINTS.instagram}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
        );

        const accountsData = await accountsResponse.json();

        return {
            id: data.id,
            username: data.username,
            metadata: {
                businessAccounts: accountsData.data || [],
            },
        };
    }

    /**
     * Get LinkedIn user info
     * @private
     */
    private async getLinkedInUserInfo(accessToken: string): Promise<{
        id: string;
        username: string;
        metadata?: Record<string, any>;
    }> {
        const response = await fetch(
            `${PLATFORM_API_ENDPOINTS.linkedin}/me`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get LinkedIn user info');
        }

        const data = await response.json();

        return {
            id: data.id,
            username: `${data.localizedFirstName} ${data.localizedLastName}`,
            metadata: {},
        };
    }

    /**
     * Get Twitter user info
     * @private
     */
    private async getTwitterUserInfo(accessToken: string): Promise<{
        id: string;
        username: string;
        metadata?: Record<string, any>;
    }> {
        const response = await fetch(
            `${PLATFORM_API_ENDPOINTS.twitter}/users/me?user.fields=id,username,name,public_metrics`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to get Twitter user info');
        }

        const data = await response.json();

        return {
            id: data.data.id,
            username: `@${data.data.username}`,
            metadata: {
                name: data.data.name,
                publicMetrics: data.data.public_metrics,
            },
        };
    }

    /**
     * Update connection metadata
     * 
     * @param userId - User ID
     * @param platform - Social media platform
     * @param metadata - Metadata to update
     * @returns Updated OAuth connection
     */
    async updateConnectionMetadata(
        userId: string,
        platform: Platform,
        metadata: Record<string, any>
    ): Promise<OAuthConnection> {
        const connection = await this.getConnection(userId, platform);

        if (!connection) {
            throw new Error('Connection not found');
        }

        // Update metadata and timestamp
        const updatedConnection: OAuthConnection = {
            ...connection,
            metadata: {
                ...connection.metadata,
                ...metadata,
            },
            updatedAt: Date.now(),
        };

        // Store updated connection
        await this.storeConnection(updatedConnection);

        return updatedConnection;
    }

    /**
     * Validate connection by testing API access
     * 
     * @param userId - User ID
     * @param platform - Social media platform
     * @returns Validation result
     */
    async validateConnection(
        userId: string,
        platform: Platform
    ): Promise<{ isValid: boolean; error?: string }> {
        try {
            const connection = await this.getConnection(userId, platform);

            if (!connection) {
                return {
                    isValid: false,
                    error: 'Connection not found',
                };
            }

            // Check if token is expired
            if (connection.expiresAt < Date.now()) {
                return {
                    isValid: false,
                    error: 'Token expired',
                };
            }

            // Test API access with a simple call
            const testResult = await this.testPlatformAPI(platform, connection.accessToken);

            // Update last validated timestamp
            await this.updateConnectionMetadata(userId, platform, {
                lastValidated: Date.now(),
                lastValidationResult: testResult,
            });

            return testResult;
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Validation failed',
            };
        }
    }

    /**
     * Validate analytics access for a connection
     * Tests if the connection has proper scopes for analytics data access
     * 
     * @param userId - User ID
     * @param platform - Social media platform
     * @returns Analytics validation result
     */
    async validateAnalyticsAccess(
        userId: string,
        platform: Platform
    ): Promise<{ hasAccess: boolean; error?: string; availableMetrics?: string[] }> {
        try {
            const connection = await this.getConnection(userId, platform);

            if (!connection) {
                return {
                    hasAccess: false,
                    error: 'Connection not found',
                };
            }

            // Check if token is expired
            if (connection.expiresAt < Date.now()) {
                return {
                    hasAccess: false,
                    error: 'Token expired',
                };
            }

            // Test analytics API access
            const analyticsResult = await this.testAnalyticsAPI(platform, connection.accessToken);

            // Update analytics validation metadata
            await this.updateConnectionMetadata(userId, platform, {
                lastAnalyticsValidated: Date.now(),
                analyticsValidationResult: analyticsResult,
                analyticsScopes: connection.scope.filter(scope =>
                    this.isAnalyticsScope(platform, scope)
                ),
            });

            return analyticsResult;
        } catch (error) {
            return {
                hasAccess: false,
                error: error instanceof Error ? error.message : 'Analytics validation failed',
            };
        }
    }

    /**
     * Get connection with automatic token refresh for analytics access
     * Ensures the connection is valid and has analytics permissions
     * 
     * @param userId - User ID
     * @param platform - Social media platform
     * @returns OAuth connection with valid analytics access
     */
    async getConnectionForAnalytics(
        userId: string,
        platform: Platform
    ): Promise<OAuthConnection | null> {
        const connection = await this.getConnection(userId, platform);

        if (!connection) {
            return null;
        }

        // Validate analytics access
        const analyticsValidation = await this.validateAnalyticsAccess(userId, platform);

        if (!analyticsValidation.hasAccess) {
            throw new Error(`Analytics access not available: ${analyticsValidation.error}`);
        }

        return connection;
    }

    /**
     * Test platform API access
     * @private
     */
    private async testPlatformAPI(
        platform: Platform,
        accessToken: string
    ): Promise<{ isValid: boolean; error?: string }> {
        try {
            let testUrl: string;
            let headers: Record<string, string> = {};

            switch (platform) {
                case 'facebook':
                    testUrl = `${PLATFORM_API_ENDPOINTS.facebook}/me?fields=id,name&access_token=${accessToken}`;
                    break;
                case 'instagram':
                    testUrl = `${PLATFORM_API_ENDPOINTS.instagram}/me?fields=id,username&access_token=${accessToken}`;
                    break;
                case 'linkedin':
                    testUrl = `${PLATFORM_API_ENDPOINTS.linkedin}/me`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
                case 'twitter':
                    testUrl = `${PLATFORM_API_ENDPOINTS.twitter}/users/me`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
            }

            const response = await fetch(testUrl, {
                method: 'GET',
                headers,
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    isValid: false,
                    error: `API call failed: ${response.status} ${errorText}`,
                };
            }

            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'API test failed',
            };
        }
    }

    /**
     * Test analytics API access for content workflow features
     * @private
     */
    private async testAnalyticsAPI(
        platform: Platform,
        accessToken: string
    ): Promise<{ hasAccess: boolean; error?: string; availableMetrics?: string[] }> {
        try {
            let testUrl: string;
            let headers: Record<string, string> = {};

            switch (platform) {
                case 'facebook':
                    // Test Facebook Insights API access
                    testUrl = `${ANALYTICS_API_ENDPOINTS.facebook}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`;
                    break;
                case 'instagram':
                    // Test Instagram Insights API access
                    testUrl = `${ANALYTICS_API_ENDPOINTS.instagram}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`;
                    break;
                case 'linkedin':
                    // Test LinkedIn Analytics API access
                    testUrl = `${ANALYTICS_API_ENDPOINTS.linkedin}/organizationAcls?q=roleAssignee`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
                case 'twitter':
                    // Test Twitter Analytics API access
                    testUrl = `${ANALYTICS_API_ENDPOINTS.twitter}/users/me?user.fields=public_metrics`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
            }

            const response = await fetch(testUrl, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    hasAccess: false,
                    error: `Analytics API call failed: ${response.status} ${errorText}`,
                };
            }

            // Get available metrics for this platform
            const availableMetrics = ANALYTICS_METRICS[platform] || [];

            return {
                hasAccess: true,
                availableMetrics,
            };
        } catch (error) {
            return {
                hasAccess: false,
                error: error instanceof Error ? error.message : 'Analytics API test failed',
            };
        }
    }

    /**
     * Check if a scope is analytics-related for content workflow features
     * @private
     */
    private isAnalyticsScope(platform: Platform, scope: string): boolean {
        const analyticsScopes: Record<Platform, string[]> = {
            facebook: [
                'pages_read_engagement',
                'read_insights',
                'pages_read_user_content',
                'business_management',
            ],
            instagram: [
                'pages_read_engagement',
                'instagram_manage_insights',
                'read_insights',
                'business_management',
            ],
            linkedin: [
                'r_organization_social',
                'r_organization_admin',
                'r_analytics',
                'r_organization_followers_statistics',
                'r_organization_lookup',
            ],
            twitter: [
                'tweet.moderate.write',
                'follows.read',
                'follows.write',
                'space.read',
                'mute.read',
                'mute.write',
                'block.read',
                'block.write',
            ],
        };

        return analyticsScopes[platform]?.includes(scope) || false;
    }

    /**
     * Store OAuth connection in DynamoDB
     * @private
     */
    private async storeConnection(connection: OAuthConnection): Promise<void> {
        const repository = getRepository();
        const keys = getSocialConnectionKeys(connection.userId, connection.platform);

        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'SocialConnection' as const,
            Data: connection,
            CreatedAt: connection.createdAt,
            UpdatedAt: connection.updatedAt,
        });
    }
}

/**
 * Singleton instance of OAuth Connection Manager
 */
let managerInstance: OAuthConnectionManager | null = null;

/**
 * Get OAuth Connection Manager instance
 */
export function getOAuthConnectionManager(): OAuthConnectionManager {
    if (!managerInstance) {
        managerInstance = new OAuthConnectionManagerImpl();
    }
    return managerInstance;
}

/**
 * Helper function to disconnect a connection by userId and platform
 * This is a workaround for the disconnect method limitation
 */
export async function disconnectConnection(
    userId: string,
    platform: Platform
): Promise<void> {
    const repository = getRepository();
    const keys = getSocialConnectionKeys(userId, platform);

    await repository.delete(keys.PK, keys.SK);
}
