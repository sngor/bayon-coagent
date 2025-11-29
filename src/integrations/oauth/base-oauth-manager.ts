/**
 * Base OAuth Manager
 * 
 * Reusable OAuth 2.0 implementation that can be extended by different providers.
 * Handles the common OAuth flow: initiation, callback, token exchange, and refresh.
 */

import crypto from 'crypto';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import {
    IntegrationProvider,
    IntegrationType,
    IntegrationConnection,
    IntegrationCredentials,
    IntegrationResult
} from '../types';
import { integrationRepository } from '../integration-repository';
import { IntegrationService } from '../integration-manager';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const KMS_KEY_ID = process.env.INTEGRATION_KMS_KEY_ID;

const kmsClient = new KMSClient({ region: AWS_REGION });

/**
 * OAuth Configuration for a provider
 */
export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
    additionalParams?: Record<string, string>;
}

/**
 * OAuth State (stored temporarily during auth flow)
 */
interface OAuthState {
    userId: string;
    provider: IntegrationProvider;
    timestamp: number;
    nonce: string;
    metadata?: Record<string, any>;
}

/**
 * OAuth State Storage
 * In production, use Redis or DynamoDB with TTL for distributed storage
 */
class OAuthStateStorage {
    private memoryStore = new Map<string, OAuthState>();
    private readonly TTL = 10 * 60 * 1000; // 10 minutes

    async set(key: string, value: OAuthState): Promise<void> {
        this.memoryStore.set(key, value);

        // Auto-cleanup after TTL
        setTimeout(() => {
            this.memoryStore.delete(key);
        }, this.TTL);
    }

    async get(key: string): Promise<OAuthState | undefined> {
        const state = this.memoryStore.get(key);

        if (!state) {
            return undefined;
        }

        // Check if expired
        if (Date.now() - state.timestamp > this.TTL) {
            this.memoryStore.delete(key);
            return undefined;
        }

        return state;
    }

    async delete(key: string): Promise<void> {
        this.memoryStore.delete(key);
    }
}

const stateStorage = new OAuthStateStorage();

/**
 * Base OAuth Manager Abstract Class
 */
export abstract class BaseOAuthManager implements IntegrationService {
    abstract provider: IntegrationProvider;
    abstract type: IntegrationType;
    protected abstract config: OAuthConfig;

    /**
     * Encrypt token using KMS
     */
    protected async encryptToken(token: string): Promise<string> {
        if (!KMS_KEY_ID) {
            // Fallback for dev/test
            return Buffer.from(token).toString('base64');
        }

        try {
            const command = new EncryptCommand({
                KeyId: KMS_KEY_ID,
                Plaintext: Buffer.from(token)
            });

            const response = await kmsClient.send(command);
            return Buffer.from(response.CiphertextBlob!).toString('base64');
        } catch (error) {
            console.error('Token encryption failed:', error);
            throw new Error('Failed to encrypt token');
        }
    }

    /**
     * Decrypt token using KMS
     */
    protected async decryptToken(encryptedToken: string): Promise<string> {
        if (!KMS_KEY_ID) {
            // Fallback for dev/test
            return Buffer.from(encryptedToken, 'base64').toString('utf-8');
        }

        try {
            const command = new DecryptCommand({
                CiphertextBlob: Buffer.from(encryptedToken, 'base64')
            });

            const response = await kmsClient.send(command);
            return Buffer.from(response.Plaintext!).toString('utf-8');
        } catch (error) {
            console.error('Token decryption failed:', error);
            throw new Error('Failed to decrypt token');
        }
    }

    /**
     * Initiate OAuth flow
     */
    async connect(userId: string, config?: Record<string, any>): Promise<IntegrationResult<string>> {
        try {
            // Generate state for CSRF protection
            const nonce = crypto.randomBytes(16).toString('hex');
            const state = crypto.randomBytes(16).toString('hex');

            const oauthState: OAuthState = {
                userId,
                provider: this.provider,
                timestamp: Date.now(),
                nonce,
                metadata: config
            };

            await stateStorage.set(state, oauthState);

            // Build authorization URL
            const params = new URLSearchParams({
                client_id: this.config.clientId,
                redirect_uri: this.config.redirectUri,
                response_type: 'code',
                scope: this.config.scopes.join(' '),
                state,
                ...this.config.additionalParams
            });

            const authUrl = `${this.config.authUrl}?${params.toString()}`;

            return {
                success: true,
                data: authUrl
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to initiate OAuth'
            };
        }
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback(
        code: string,
        state: string
    ): Promise<IntegrationResult<IntegrationConnection>> {
        try {
            // Validate state
            const oauthState = await stateStorage.get(state);

            if (!oauthState) {
                return {
                    success: false,
                    error: 'Invalid or expired OAuth state'
                };
            }

            if (oauthState.provider !== this.provider) {
                return {
                    success: false,
                    error: 'Provider mismatch'
                };
            }

            // Clean up state
            await stateStorage.delete(state);

            // Exchange code for token
            const tokenResult = await this.exchangeCodeForToken(code);

            if (!tokenResult.success || !tokenResult.data) {
                return {
                    success: false,
                    error: tokenResult.error || 'Token exchange failed'
                };
            }

            // Get user info from provider
            const userInfo = await this.getUserInfo(tokenResult.data.access_token);

            // Create integration connection
            const connection: IntegrationConnection = {
                id: `${this.provider}#${Date.now()}`,
                userId: oauthState.userId,
                provider: this.provider,
                type: this.type,
                status: 'active',
                credentials: {
                    provider: this.provider,
                    authMethod: 'oauth2',
                    accessToken: tokenResult.data.access_token,
                    refreshToken: tokenResult.data.refresh_token,
                    expiresAt: tokenResult.data.expires_in
                        ? Date.now() + tokenResult.data.expires_in * 1000
                        : undefined,
                    scope: tokenResult.data.scope?.split(' ') || this.config.scopes,
                    metadata: userInfo
                },
                metadata: {
                    ...oauthState.metadata,
                    ...userInfo
                },
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // Save to database
            await integrationRepository.create(connection);

            return {
                success: true,
                data: connection
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Callback handling failed'
            };
        }
    }

    /**
     * Exchange authorization code for access token
     */
    protected async exchangeCodeForToken(code: string): Promise<IntegrationResult<{
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        scope?: string;
        token_type?: string;
    }>> {
        try {
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: this.config.redirectUri
            });

            const response = await fetch(this.config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params.toString()
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Token exchange failed: ${error}`);
            }

            const data = await response.json();

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token exchange failed'
            };
        }
    }

    /**
     * Refresh access token
     */
    async refresh(connection: IntegrationConnection): Promise<IntegrationResult<IntegrationConnection>> {
        try {
            if (!connection.credentials.refreshToken) {
                return {
                    success: false,
                    error: 'No refresh token available'
                };
            }

            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: connection.credentials.refreshToken,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret
            });

            const response = await fetch(this.config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params.toString()
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Token refresh failed: ${error}`);
            }

            const data = await response.json();

            // Update connection with new tokens
            const updatedConnection: IntegrationConnection = {
                ...connection,
                credentials: {
                    ...connection.credentials,
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token || connection.credentials.refreshToken,
                    expiresAt: data.expires_in
                        ? Date.now() + data.expires_in * 1000
                        : undefined
                },
                updatedAt: Date.now(),
                status: 'active',
                error: undefined
            };

            // Save to database
            await integrationRepository.update(updatedConnection);

            return {
                success: true,
                data: updatedConnection
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Token refresh failed'
            };
        }
    }

    /**
     * Disconnect (cleanup)
     */
    async disconnect(userId: string): Promise<IntegrationResult<void>> {
        try {
            // Subclasses can override to add provider-specific cleanup
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Disconnect failed'
            };
        }
    }

    /**
     * Validate connection (must be implemented by subclasses)
     */
    abstract validate(connection: IntegrationConnection): Promise<IntegrationResult<boolean>>;

    /**
     * Get user info from provider (must be implemented by subclasses)
     */
    protected abstract getUserInfo(accessToken: string): Promise<Record<string, any>>;
}
