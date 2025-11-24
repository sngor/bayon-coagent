"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthConnectionManagerImpl = void 0;
exports.getOAuthConnectionManager = getOAuthConnectionManager;
exports.disconnectConnection = disconnectConnection;
const crypto_1 = require("crypto");
const repository_1 = require("@/aws/dynamodb/repository");
const keys_1 = require("@/aws/dynamodb/keys");
const constants_1 = require("../social/constants");
const schemas_1 = require("../social/schemas");
class OAuthStateStorage {
    constructor() {
        this.memoryStore = new Map();
    }
    async set(key, value) {
        if (process.env.NODE_ENV === 'production' && process.env.USE_DYNAMODB_STATE_STORAGE === 'true') {
            try {
                const repository = (0, repository_1.getRepository)();
                await repository.put({
                    PK: `OAUTH_STATE#${key}`,
                    SK: 'STATE',
                    EntityType: 'OAuthState',
                    Data: value,
                    TTL: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
                    CreatedAt: Date.now(),
                    UpdatedAt: Date.now(),
                });
            }
            catch (error) {
                console.error('Failed to store OAuth state in DynamoDB, falling back to memory:', error);
                this.memoryStore.set(key, value);
            }
        }
        else {
            this.memoryStore.set(key, value);
        }
    }
    async get(key) {
        if (process.env.NODE_ENV === 'production' && process.env.USE_DYNAMODB_STATE_STORAGE === 'true') {
            try {
                const repository = (0, repository_1.getRepository)();
                const item = await repository.getItem(`OAUTH_STATE#${key}`, 'STATE');
                return item?.Data;
            }
            catch (error) {
                console.error('Failed to get OAuth state from DynamoDB, checking memory:', error);
                return this.memoryStore.get(key);
            }
        }
        else {
            return this.memoryStore.get(key);
        }
    }
    async delete(key) {
        if (process.env.NODE_ENV === 'production' && process.env.USE_DYNAMODB_STATE_STORAGE === 'true') {
            try {
                const repository = (0, repository_1.getRepository)();
                await repository.delete(`OAUTH_STATE#${key}`, 'STATE');
            }
            catch (error) {
                console.error('Failed to delete OAuth state from DynamoDB:', error);
            }
        }
        this.memoryStore.delete(key);
    }
    async cleanup() {
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        for (const [key, value] of this.memoryStore.entries()) {
            if (value.timestamp < tenMinutesAgo) {
                this.memoryStore.delete(key);
            }
        }
    }
}
const oauthStateStore = new OAuthStateStorage();
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
async function encryptToken(token) {
    if (process.env.NODE_ENV === 'production' && process.env.KMS_KEY_ID) {
        try {
            const { KMSClient, EncryptCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-kms')));
            const kmsClient = new KMSClient({
                region: process.env.AWS_REGION || 'us-east-1'
            });
            const command = new EncryptCommand({
                KeyId: process.env.KMS_KEY_ID,
                Plaintext: Buffer.from(token, 'utf-8'),
            });
            const response = await kmsClient.send(command);
            return Buffer.from(response.CiphertextBlob).toString('base64');
        }
        catch (error) {
            console.error('KMS encryption failed, falling back to base64:', error);
            return Buffer.from(token, 'utf-8').toString('base64');
        }
    }
    return Buffer.from(token, 'utf-8').toString('base64');
}
async function decryptToken(encryptedToken) {
    if (process.env.NODE_ENV === 'production' && process.env.KMS_KEY_ID) {
        try {
            if (encryptedToken.length > 100) {
                const { KMSClient, DecryptCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-kms')));
                const kmsClient = new KMSClient({
                    region: process.env.AWS_REGION || 'us-east-1'
                });
                const command = new DecryptCommand({
                    CiphertextBlob: Buffer.from(encryptedToken, 'base64'),
                });
                const response = await kmsClient.send(command);
                return Buffer.from(response.Plaintext).toString('utf-8');
            }
        }
        catch (error) {
            console.error('KMS decryption failed, falling back to base64:', error);
        }
    }
    try {
        return Buffer.from(encryptedToken, 'base64').toString('utf-8');
    }
    catch (error) {
        return encryptedToken;
    }
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
        await oauthStateStore.set(state, stateData);
        await oauthStateStore.cleanup();
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
        const stateData = await oauthStateStore.get(state);
        if (!stateData) {
            throw new Error('Invalid or expired OAuth state');
        }
        if (stateData.platform !== platform) {
            throw new Error('Platform mismatch in OAuth callback');
        }
        await oauthStateStore.delete(state);
        const config = getPlatformConfig(platform);
        const tokenResponse = await this.exchangeCodeForToken(config, code);
        const userInfo = await this.getPlatformUserInfo(platform, tokenResponse.access_token);
        const connection = {
            id: (0, crypto_1.randomUUID)(),
            userId: stateData.userId,
            platform,
            accessToken: await encryptToken(tokenResponse.access_token),
            refreshToken: await encryptToken(tokenResponse.refresh_token || ''),
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
        const refreshToken = await decryptToken(connection.refreshToken);
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
            accessToken: await encryptToken(tokenData.access_token),
            refreshToken: await encryptToken(tokenData.refresh_token || connection.refreshToken),
            expiresAt: Date.now() + (tokenData.expires_in * 1000),
            updatedAt: Date.now(),
        };
        await this.storeConnection(updatedConnection);
        return updatedConnection;
    }
    async disconnect(connectionId) {
        const repository = (0, repository_1.getRepository)();
        try {
            const scanResult = await repository.scan({
                FilterExpression: '#entityType = :entityType AND #data.#id = :connectionId',
                ExpressionAttributeNames: {
                    '#entityType': 'EntityType',
                    '#data': 'Data',
                    '#id': 'id',
                },
                ExpressionAttributeValues: {
                    ':entityType': 'SocialConnection',
                    ':connectionId': connectionId,
                },
            });
            if (!scanResult.Items || scanResult.Items.length === 0) {
                throw new Error(`Connection with ID ${connectionId} not found`);
            }
            const connectionItem = scanResult.Items[0];
            await repository.delete(connectionItem.PK, connectionItem.SK);
            console.log(`Successfully disconnected OAuth connection: ${connectionId}`);
        }
        catch (error) {
            console.error(`Failed to disconnect connection ${connectionId}:`, error);
            throw error;
        }
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
            connection.accessToken = await decryptToken(connection.accessToken);
            connection.refreshToken = await decryptToken(connection.refreshToken);
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
        const startTime = Date.now();
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
            const duration = Date.now() - startTime;
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Analytics API test failed for ${platform}:`, {
                    status: response.status,
                    error: errorText,
                    duration,
                    url: testUrl.replace(accessToken, '[REDACTED]'),
                });
                if (response.status === 403) {
                    return {
                        hasAccess: false,
                        error: `Insufficient permissions for ${platform} analytics. Please reconnect with analytics permissions.`,
                    };
                }
                else if (response.status === 401) {
                    return {
                        hasAccess: false,
                        error: `Authentication failed for ${platform}. Please reconnect your account.`,
                    };
                }
                else if (response.status === 429) {
                    return {
                        hasAccess: false,
                        error: `Rate limit exceeded for ${platform}. Please try again later.`,
                    };
                }
                return {
                    hasAccess: false,
                    error: `Analytics API call failed: ${response.status} ${errorText}`,
                };
            }
            console.log(`Analytics API test successful for ${platform}:`, {
                duration,
                status: response.status,
            });
            const availableMetrics = constants_1.ANALYTICS_METRICS[platform] || [];
            return {
                hasAccess: true,
                availableMetrics,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`Analytics API test error for ${platform}:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
            });
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    return {
                        hasAccess: false,
                        error: `Analytics API test timed out for ${platform}. Please check your connection.`,
                    };
                }
                else if (error.message.includes('network')) {
                    return {
                        hasAccess: false,
                        error: `Network error testing ${platform} analytics. Please check your connection.`,
                    };
                }
            }
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
    async disconnectByUserAndPlatform(userId, platform) {
        const repository = (0, repository_1.getRepository)();
        const keys = (0, keys_1.getSocialConnectionKeys)(userId, platform);
        try {
            await repository.delete(keys.PK, keys.SK);
            console.log(`Successfully disconnected ${platform} for user ${userId}`);
        }
        catch (error) {
            console.error(`Failed to disconnect ${platform} for user ${userId}:`, error);
            throw error;
        }
    }
    async getAnalyticsHealthStatus(userId) {
        const platforms = ['facebook', 'instagram', 'linkedin', 'twitter'];
        const platformStatuses = [];
        let totalHealthScore = 0;
        for (const platform of platforms) {
            try {
                const connection = await this.getConnection(userId, platform);
                const issues = [];
                let healthScore = 0;
                if (!connection) {
                    platformStatuses.push({
                        platform,
                        isConnected: false,
                        hasAnalyticsAccess: false,
                        healthScore: 0,
                        issues: ['Not connected'],
                    });
                    continue;
                }
                healthScore += 25;
                const timeUntilExpiry = connection.expiresAt - Date.now();
                if (timeUntilExpiry < 0) {
                    issues.push('Token expired');
                }
                else if (timeUntilExpiry < 24 * 60 * 60 * 1000) {
                    issues.push('Token expires soon');
                    healthScore += 10;
                }
                else {
                    healthScore += 25;
                }
                const analyticsValidation = await this.validateAnalyticsAccess(userId, platform);
                if (analyticsValidation.hasAccess) {
                    healthScore += 25;
                }
                else {
                    issues.push(`Analytics access limited: ${analyticsValidation.error}`);
                }
                const lastValidated = connection.metadata?.lastAnalyticsValidated;
                if (lastValidated) {
                    const timeSinceValidation = Date.now() - lastValidated;
                    if (timeSinceValidation < 24 * 60 * 60 * 1000) {
                        healthScore += 25;
                    }
                    else if (timeSinceValidation < 7 * 24 * 60 * 60 * 1000) {
                        healthScore += 15;
                        issues.push('Analytics not validated recently');
                    }
                    else {
                        issues.push('Analytics validation overdue');
                    }
                }
                else {
                    issues.push('Analytics never validated');
                }
                platformStatuses.push({
                    platform,
                    isConnected: true,
                    hasAnalyticsAccess: analyticsValidation.hasAccess,
                    lastValidated,
                    healthScore,
                    issues,
                });
                totalHealthScore += healthScore;
            }
            catch (error) {
                console.error(`Failed to check health for ${platform}:`, error);
                platformStatuses.push({
                    platform,
                    isConnected: false,
                    hasAnalyticsAccess: false,
                    healthScore: 0,
                    issues: ['Health check failed'],
                });
            }
        }
        const overallHealth = Math.round(totalHealthScore / platforms.length);
        return {
            platforms: platformStatuses,
            overallHealth,
        };
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
    const manager = getOAuthConnectionManager();
    await manager.disconnectByUserAndPlatform(userId, platform);
}
