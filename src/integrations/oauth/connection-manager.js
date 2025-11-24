"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthConnectionManagerImpl = void 0;
exports.getOAuthConnectionManager = getOAuthConnectionManager;
exports.disconnectConnection = disconnectConnection;
const crypto_1 = require("crypto");
const repository_1 = require("@/aws/dynamodb/repository");
const keys_1 = require("@/aws/dynamodb/keys");
const constants_1 = require("../social/constants");
const schemas_1 = require("../social/schemas");
const oauthStateStore = new Map();
function getPlatformConfig(platform) {
    const baseRedirectUri = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    switch (platform) {
        case 'facebook':
            return {
                authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
                tokenUrl: `${constants_1.PLATFORM_API_ENDPOINTS.facebook}/oauth/access_token`,
                clientId: process.env.FACEBOOK_APP_ID || '',
                clientSecret: process.env.FACEBOOK_APP_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/facebook/callback`,
                scope: constants_1.OAUTH_SCOPES.facebook,
            };
        case 'instagram':
            return {
                authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
                tokenUrl: `${constants_1.PLATFORM_API_ENDPOINTS.instagram}/oauth/access_token`,
                clientId: process.env.FACEBOOK_APP_ID || '',
                clientSecret: process.env.FACEBOOK_APP_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/instagram/callback`,
                scope: constants_1.OAUTH_SCOPES.instagram,
            };
        case 'linkedin':
            return {
                authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
                tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
                clientId: process.env.LINKEDIN_CLIENT_ID || '',
                clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/linkedin/callback`,
                scope: constants_1.OAUTH_SCOPES.linkedin,
            };
        case 'twitter':
            return {
                authUrl: 'https://twitter.com/i/oauth2/authorize',
                tokenUrl: 'https://api.twitter.com/2/oauth2/token',
                clientId: process.env.TWITTER_CLIENT_ID || '',
                clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
                redirectUri: `${baseRedirectUri}/api/oauth/twitter/callback`,
                scope: constants_1.OAUTH_SCOPES.twitter,
            };
    }
}
function encryptToken(token) {
    return token;
}
function decryptToken(encryptedToken) {
    return encryptedToken;
}
class OAuthConnectionManagerImpl {
    async initiateConnection(platform, userId) {
        const config = getPlatformConfig(platform);
        const state = (0, crypto_1.randomUUID)();
        const nonce = (0, crypto_1.randomUUID)();
        const stateData = {
            userId,
            platform,
            timestamp: Date.now(),
            nonce,
        };
        oauthStateStore.set(state, stateData);
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        for (const [key, value] of oauthStateStore.entries()) {
            if (value.timestamp < tenMinutesAgo) {
                oauthStateStore.delete(key);
            }
        }
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scope.join(','),
            state,
            response_type: 'code',
        });
        return `${config.authUrl}?${params.toString()}`;
    }
    async handleCallback(platform, code, state) {
        const stateData = oauthStateStore.get(state);
        if (!stateData) {
            throw new Error('Invalid or expired OAuth state');
        }
        if (stateData.platform !== platform) {
            throw new Error('Platform mismatch in OAuth callback');
        }
        oauthStateStore.delete(state);
        const config = getPlatformConfig(platform);
        const tokenResponse = await this.exchangeCodeForToken(config, code);
        const userInfo = await this.getPlatformUserInfo(platform, tokenResponse.access_token);
        const connection = {
            id: (0, crypto_1.randomUUID)(),
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
        schemas_1.OAuthConnectionSchema.parse(connection);
        await this.storeConnection(connection);
        return connection;
    }
    async refreshToken(connection) {
        const config = getPlatformConfig(connection.platform);
        const refreshToken = decryptToken(connection.refreshToken);
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
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
        const updatedConnection = {
            ...connection,
            accessToken: encryptToken(tokenData.access_token),
            refreshToken: encryptToken(tokenData.refresh_token || connection.refreshToken),
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            updatedAt: Date.now(),
        };
        await this.storeConnection(updatedConnection);
        return updatedConnection;
    }
    async disconnect(connectionId) {
        throw new Error('disconnect method requires userId and platform - interface needs update');
    }
    async getConnection(userId, platform) {
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getSocialConnectionKeys)(userId, platform);
        try {
            const item = await repository.getItem(keys.PK, keys.SK);
            if (!item) {
                return null;
            }
            const connection = item.Data;
            connection.accessToken = decryptToken(connection.accessToken);
            connection.refreshToken = decryptToken(connection.refreshToken);
            if (connection.expiresAt < Date.now() + 5 * 60 * 1000) {
                return await this.refreshToken(connection);
            }
            return connection;
        }
        catch (error) {
            console.error('Failed to get OAuth connection:', error);
            return null;
        }
    }
    async exchangeCodeForToken(config, code) {
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
    async getPlatformUserInfo(platform, accessToken) {
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
    async getFacebookUserInfo(accessToken) {
        const response = await fetch(`${constants_1.PLATFORM_API_ENDPOINTS.facebook}/me?fields=id,name&access_token=${accessToken}`);
        if (!response.ok) {
            throw new Error('Failed to get Facebook user info');
        }
        const data = await response.json();
        const pagesResponse = await fetch(`${constants_1.PLATFORM_API_ENDPOINTS.facebook}/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesResponse.json();
        return {
            id: data.id,
            username: data.name,
            metadata: {
                pages: pagesData.data || [],
            },
        };
    }
    async getInstagramUserInfo(accessToken) {
        const response = await fetch(`${constants_1.PLATFORM_API_ENDPOINTS.instagram}/me?fields=id,username&access_token=${accessToken}`);
        if (!response.ok) {
            throw new Error('Failed to get Instagram user info');
        }
        const data = await response.json();
        const accountsResponse = await fetch(`${constants_1.PLATFORM_API_ENDPOINTS.instagram}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`);
        const accountsData = await accountsResponse.json();
        return {
            id: data.id,
            username: data.username,
            metadata: {
                businessAccounts: accountsData.data || [],
            },
        };
    }
    async getLinkedInUserInfo(accessToken) {
        const response = await fetch(`${constants_1.PLATFORM_API_ENDPOINTS.linkedin}/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
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
    async getTwitterUserInfo(accessToken) {
        const response = await fetch(`${constants_1.PLATFORM_API_ENDPOINTS.twitter}/users/me?user.fields=id,username,name,public_metrics`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
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
    async updateConnectionMetadata(userId, platform, metadata) {
        const connection = await this.getConnection(userId, platform);
        if (!connection) {
            throw new Error('Connection not found');
        }
        const updatedConnection = {
            ...connection,
            metadata: {
                ...connection.metadata,
                ...metadata,
            },
            updatedAt: Date.now(),
        };
        await this.storeConnection(updatedConnection);
        return updatedConnection;
    }
    async validateConnection(userId, platform) {
        try {
            const connection = await this.getConnection(userId, platform);
            if (!connection) {
                return {
                    isValid: false,
                    error: 'Connection not found',
                };
            }
            if (connection.expiresAt < Date.now()) {
                return {
                    isValid: false,
                    error: 'Token expired',
                };
            }
            const testResult = await this.testPlatformAPI(platform, connection.accessToken);
            await this.updateConnectionMetadata(userId, platform, {
                lastValidated: Date.now(),
                lastValidationResult: testResult,
            });
            return testResult;
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Validation failed',
            };
        }
    }
    async validateAnalyticsAccess(userId, platform) {
        try {
            const connection = await this.getConnection(userId, platform);
            if (!connection) {
                return {
                    hasAccess: false,
                    error: 'Connection not found',
                };
            }
            if (connection.expiresAt < Date.now()) {
                return {
                    hasAccess: false,
                    error: 'Token expired',
                };
            }
            const analyticsResult = await this.testAnalyticsAPI(platform, connection.accessToken);
            await this.updateConnectionMetadata(userId, platform, {
                lastAnalyticsValidated: Date.now(),
                analyticsValidationResult: analyticsResult,
                analyticsScopes: connection.scope.filter(scope => this.isAnalyticsScope(platform, scope)),
            });
            return analyticsResult;
        }
        catch (error) {
            return {
                hasAccess: false,
                error: error instanceof Error ? error.message : 'Analytics validation failed',
            };
        }
    }
    async getConnectionForAnalytics(userId, platform) {
        const connection = await this.getConnection(userId, platform);
        if (!connection) {
            return null;
        }
        const analyticsValidation = await this.validateAnalyticsAccess(userId, platform);
        if (!analyticsValidation.hasAccess) {
            throw new Error(`Analytics access not available: ${analyticsValidation.error}`);
        }
        return connection;
    }
    async testPlatformAPI(platform, accessToken) {
        try {
            let testUrl;
            let headers = {};
            switch (platform) {
                case 'facebook':
                    testUrl = `${constants_1.PLATFORM_API_ENDPOINTS.facebook}/me?fields=id,name&access_token=${accessToken}`;
                    break;
                case 'instagram':
                    testUrl = `${constants_1.PLATFORM_API_ENDPOINTS.instagram}/me?fields=id,username&access_token=${accessToken}`;
                    break;
                case 'linkedin':
                    testUrl = `${constants_1.PLATFORM_API_ENDPOINTS.linkedin}/me`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
                case 'twitter':
                    testUrl = `${constants_1.PLATFORM_API_ENDPOINTS.twitter}/users/me`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
            }
            const response = await fetch(testUrl, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) {
                const errorText = await response.text();
                return {
                    isValid: false,
                    error: `API call failed: ${response.status} ${errorText}`,
                };
            }
            return { isValid: true };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'API test failed',
            };
        }
    }
    async testAnalyticsAPI(platform, accessToken) {
        try {
            let testUrl;
            let headers = {};
            switch (platform) {
                case 'facebook':
                    testUrl = `${constants_1.ANALYTICS_API_ENDPOINTS.facebook}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`;
                    break;
                case 'instagram':
                    testUrl = `${constants_1.ANALYTICS_API_ENDPOINTS.instagram}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`;
                    break;
                case 'linkedin':
                    testUrl = `${constants_1.ANALYTICS_API_ENDPOINTS.linkedin}/organizationAcls?q=roleAssignee`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
                case 'twitter':
                    testUrl = `${constants_1.ANALYTICS_API_ENDPOINTS.twitter}/users/me?user.fields=public_metrics`;
                    headers['Authorization'] = `Bearer ${accessToken}`;
                    break;
            }
            const response = await fetch(testUrl, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) {
                const errorText = await response.text();
                return {
                    hasAccess: false,
                    error: `Analytics API call failed: ${response.status} ${errorText}`,
                };
            }
            const availableMetrics = constants_1.ANALYTICS_METRICS[platform] || [];
            return {
                hasAccess: true,
                availableMetrics,
            };
        }
        catch (error) {
            return {
                hasAccess: false,
                error: error instanceof Error ? error.message : 'Analytics API test failed',
            };
        }
    }
    isAnalyticsScope(platform, scope) {
        const analyticsScopes = {
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
    async storeConnection(connection) {
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getSocialConnectionKeys)(connection.userId, connection.platform);
        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'SocialConnection',
            Data: connection,
            CreatedAt: connection.createdAt,
            UpdatedAt: connection.updatedAt,
        });
    }
}
exports.OAuthConnectionManagerImpl = OAuthConnectionManagerImpl;
let managerInstance = null;
function getOAuthConnectionManager() {
    if (!managerInstance) {
        managerInstance = new OAuthConnectionManagerImpl();
    }
    return managerInstance;
}
async function disconnectConnection(userId, platform) {
    const repository = (0, repository_1.getRepository)();
    const keys = (0, keys_1.getSocialConnectionKeys)(userId, platform);
    await repository.delete(keys.PK, keys.SK);
}
