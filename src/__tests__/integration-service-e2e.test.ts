/**
 * Integration Service End-to-End Tests
 * 
 * Tests the integration between Next.js actions and Integration Service Lambda functions
 * via API Gateway, including fallback behavior.
 * 
 * Requirements: 1.5 - Implement fallback for integration service failures
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the integration service client
jest.mock('@/aws/integration-service/client', () => ({
    oauthClient: {
        initiateGoogleOAuth: jest.fn(),
        initiateSocialOAuth: jest.fn(),
    },
    mlsClient: {
        syncMLSData: jest.fn(),
        getSyncStatus: jest.fn(),
    },
}));

// Mock the OAuth connection manager
jest.mock('@/integrations/oauth/connection-manager', () => ({
    getOAuthConnectionManager: jest.fn(() => ({
        initiateConnection: jest.fn().mockResolvedValue('https://fallback-auth-url.com'),
    })),
}));

// Mock the MLS connector
jest.mock('@/integrations/mls/connector', () => ({
    createMLSConnector: jest.fn(() => ({
        fetchListings: jest.fn().mockResolvedValue([]),
        syncStatus: jest.fn().mockResolvedValue([]),
    })),
    MLSAuthenticationError: class MLSAuthenticationError extends Error { },
    MLSNetworkError: class MLSNetworkError extends Error { },
}));

// Mock Cognito client
jest.mock('@/aws/auth/cognito-client', () => ({
    getCognitoClient: jest.fn(() => ({
        getSession: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
        getCurrentUser: jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com' }),
    })),
}));

// Mock DynamoDB repository
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn(() => ({
        getMLSConnection: jest.fn().mockResolvedValue({
            id: 'test-connection-id',
            provider: 'mlsgrid',
            agentId: 'test-agent-id',
            expiresAt: Date.now() + 3600000, // 1 hour from now
        }),
        queryListings: jest.fn().mockResolvedValue({ items: [] }),
    })),
}));

describe('Integration Service End-to-End Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('OAuth Integration', () => {
        it('should successfully initiate social OAuth via Integration Service', async () => {
            const { oauthClient } = await import('@/aws/integration-service/client');
            const { initiateOAuthConnectionAction } = await import('@/features/integrations/actions/social-oauth-actions');

            // Mock successful Integration Service response
            (oauthClient.initiateSocialOAuth as jest.Mock).mockResolvedValue({
                authUrl: 'https://facebook.com/oauth/authorize',
                state: 'test-state',
            });

            const result = await initiateOAuthConnectionAction('test-user-id', 'facebook');

            expect(result.success).toBe(true);
            expect(result.data?.authUrl).toBe('https://facebook.com/oauth/authorize');
            expect(oauthClient.initiateSocialOAuth).toHaveBeenCalledWith('facebook', 'test-user-id');
        });

        it('should fallback to direct implementation when Integration Service fails', async () => {
            const { oauthClient } = await import('@/aws/integration-service/client');
            const { getOAuthConnectionManager } = await import('@/integrations/oauth/connection-manager');
            const { initiateOAuthConnectionAction } = await import('@/features/integrations/actions/social-oauth-actions');

            // Mock Integration Service failure
            (oauthClient.initiateSocialOAuth as jest.Mock).mockRejectedValue(
                new Error('Integration Service unavailable')
            );

            const result = await initiateOAuthConnectionAction('test-user-id', 'facebook');

            expect(result.success).toBe(true);
            expect(result.data?.authUrl).toBe('https://fallback-auth-url.com');

            // Verify fallback was used
            const manager = getOAuthConnectionManager();
            expect(manager.initiateConnection).toHaveBeenCalledWith('facebook', 'test-user-id');
        });

        it('should reject invalid platform', async () => {
            const { initiateOAuthConnectionAction } = await import('@/features/integrations/actions/social-oauth-actions');

            const result = await initiateOAuthConnectionAction('test-user-id', 'invalid' as any);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid platform');
        });

        it('should reject missing user ID', async () => {
            const { initiateOAuthConnectionAction } = await import('@/features/integrations/actions/social-oauth-actions');

            const result = await initiateOAuthConnectionAction('', 'facebook');

            expect(result.success).toBe(false);
            expect(result.error).toBe('User ID is required');
        });
    });

    describe('MLS Integration', () => {
        it('should successfully import MLS listings via Integration Service', async () => {
            const { mlsClient } = await import('@/aws/integration-service/client');
            const { importMLSListings } = await import('@/features/integrations/actions/mls-actions');

            // Mock successful Integration Service response
            (mlsClient.syncMLSData as jest.Mock).mockResolvedValue({
                syncId: 'test-sync-id',
                totalListings: 10,
                syncedListings: 10,
                failedListings: 0,
            });

            const result = await importMLSListings('test-connection-id');

            expect(result.success).toBe(true);
            expect(result.data?.totalListings).toBe(10);
            expect(result.data?.successfulImports).toBe(10);
            expect(result.data?.failedImports).toBe(0);
            expect(mlsClient.syncMLSData).toHaveBeenCalled();
        });

        it('should fallback to direct implementation when Integration Service fails', async () => {
            const { mlsClient } = await import('@/aws/integration-service/client');
            const { createMLSConnector } = await import('@/integrations/mls/connector');
            const { importMLSListings } = await import('@/features/integrations/actions/mls-actions');

            // Mock Integration Service failure
            (mlsClient.syncMLSData as jest.Mock).mockRejectedValue(
                new Error('Integration Service unavailable')
            );

            const result = await importMLSListings('test-connection-id');

            expect(result.success).toBe(true);

            // Verify fallback was used
            expect(createMLSConnector).toHaveBeenCalled();
        });

        it('should handle expired MLS connection', async () => {
            const { getRepository } = await import('@/aws/dynamodb/repository');
            const { importMLSListings } = await import('@/features/integrations/actions/mls-actions');

            // Mock expired connection
            const repository = getRepository();
            (repository.getMLSConnection as jest.Mock).mockResolvedValue({
                id: 'test-connection-id',
                provider: 'mlsgrid',
                agentId: 'test-agent-id',
                expiresAt: Date.now() - 3600000, // 1 hour ago
            });

            const result = await importMLSListings('test-connection-id');

            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });

        it('should successfully sync MLS status via Integration Service', async () => {
            const { mlsClient } = await import('@/aws/integration-service/client');
            const { syncMLSStatus } = await import('@/features/integrations/actions/mls-status-sync-actions');

            // Mock successful Integration Service response
            (mlsClient.syncMLSData as jest.Mock).mockResolvedValue({
                syncId: 'test-sync-id',
                totalListings: 5,
                syncedListings: 3,
                failedListings: 0,
            });

            const result = await syncMLSStatus('test-connection-id');

            expect(result.success).toBe(true);
            expect(result.data?.updatedListings).toBe(3);
            expect(mlsClient.syncMLSData).toHaveBeenCalledWith(
                'test-user-id',
                'mlsgrid',
                'test-agent-id',
                'incremental'
            );
        });

        it('should fallback to direct implementation for status sync when Integration Service fails', async () => {
            const { mlsClient } = await import('@/aws/integration-service/client');
            const { createMLSConnector } = await import('@/integrations/mls/connector');
            const { syncMLSStatus } = await import('@/features/integrations/actions/mls-status-sync-actions');

            // Mock Integration Service failure
            (mlsClient.syncMLSData as jest.Mock).mockRejectedValue(
                new Error('Integration Service unavailable')
            );

            const result = await syncMLSStatus('test-connection-id');

            expect(result.success).toBe(true);

            // Verify fallback was used
            expect(createMLSConnector).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            const { oauthClient } = await import('@/aws/integration-service/client');
            const { initiateOAuthConnectionAction } = await import('@/features/integrations/actions/social-oauth-actions');

            // Mock network error
            (oauthClient.initiateSocialOAuth as jest.Mock).mockRejectedValue(
                new Error('Network error')
            );

            const result = await initiateOAuthConnectionAction('test-user-id', 'facebook');

            // Should fallback and succeed
            expect(result.success).toBe(true);
        });

        it('should handle authentication errors', async () => {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const { importMLSListings } = await import('@/features/integrations/actions/mls-actions');

            // Mock authentication failure
            const cognitoClient = getCognitoClient();
            (cognitoClient.getSession as jest.Mock).mockResolvedValue(null);

            const result = await importMLSListings('test-connection-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Authentication required');
        });
    });
});
