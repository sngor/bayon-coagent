/**
 * OAuth Connection Manager Tests
 * 
 * Unit tests for OAuth connection management functionality.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { OAuthConnectionManagerImpl } from '../connection-manager';
import type { Platform, OAuthConnection } from '../../social/types';

// Create mock repository functions
const mockGetItem = jest.fn();
const mockPutItem = jest.fn();
const mockDeleteItem = jest.fn();

// Mock the repository
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn(() => ({
        getItem: mockGetItem,
        putItem: mockPutItem,
        deleteItem: mockDeleteItem,
    })),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('OAuthConnectionManager', () => {
    let manager: OAuthConnectionManagerImpl;
    const mockUserId = 'user-123';
    const mockPlatform: Platform = 'facebook';

    beforeEach(() => {
        manager = new OAuthConnectionManagerImpl();
        jest.clearAllMocks();
        mockGetItem.mockClear();
        mockPutItem.mockClear();
        mockDeleteItem.mockClear();

        // Set required environment variables
        process.env.FACEBOOK_APP_ID = 'test-facebook-app-id';
        process.env.FACEBOOK_APP_SECRET = 'test-facebook-secret';
        process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id';
        process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-secret';
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('initiateConnection', () => {
        it('should generate authorization URL for Facebook', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);

            expect(authUrl).toContain('https://www.facebook.com/v18.0/dialog/oauth');
            expect(authUrl).toContain('client_id=test-facebook-app-id');
            expect(authUrl).toContain('redirect_uri=');
            expect(authUrl).toContain('scope=');
            expect(authUrl).toContain('state=');
            expect(authUrl).toContain('response_type=code');
        });

        it('should generate authorization URL for Instagram', async () => {
            const authUrl = await manager.initiateConnection('instagram', mockUserId);

            expect(authUrl).toContain('https://www.facebook.com/v18.0/dialog/oauth');
            expect(authUrl).toContain('client_id=test-facebook-app-id');
            expect(authUrl).toContain('instagram');
        });

        it('should generate authorization URL for LinkedIn', async () => {
            const authUrl = await manager.initiateConnection('linkedin', mockUserId);

            expect(authUrl).toContain('https://www.linkedin.com/oauth/v2/authorization');
            expect(authUrl).toContain('client_id=test-linkedin-client-id');
        });

        it('should include state parameter for CSRF protection', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(authUrl);
            const state = url.searchParams.get('state');

            expect(state).toBeTruthy();
            expect(state).toHaveLength(36); // UUID length
        });

        it('should include correct scopes for each platform', async () => {
            const facebookUrl = await manager.initiateConnection('facebook', mockUserId);
            expect(facebookUrl).toContain('pages_manage_posts');

            const instagramUrl = await manager.initiateConnection('instagram', mockUserId);
            expect(instagramUrl).toContain('instagram_content_publish');

            const linkedinUrl = await manager.initiateConnection('linkedin', mockUserId);
            expect(linkedinUrl).toContain('w_member_social');
        });
    });

    describe('handleCallback', () => {
        it('should throw error for invalid state', async () => {
            await expect(
                manager.handleCallback('facebook', 'test-code', 'invalid-state')
            ).rejects.toThrow('Invalid or expired OAuth state');
        });

        it('should throw error for platform mismatch', async () => {
            // First initiate connection for Facebook
            const authUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(authUrl);
            const state = url.searchParams.get('state')!;

            // Try to handle callback for Instagram with Facebook state
            await expect(
                manager.handleCallback('instagram', 'test-code', state)
            ).rejects.toThrow('Platform mismatch');
        });

        it('should exchange code for token and create connection', async () => {
            // Mock successful token exchange
            const mockTokenResponse = {
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                expires_in: 3600,
            };

            const mockUserInfo = {
                id: 'fb-user-123',
                name: 'Test User',
            };

            const mockPagesData = {
                data: [
                    { id: 'page-1', name: 'Test Page' },
                ],
            };

            mockPutItem.mockResolvedValueOnce(undefined);

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockTokenResponse,
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockUserInfo,
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPagesData,
                } as Response);

            // Initiate connection to get valid state
            const authUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(authUrl);
            const state = url.searchParams.get('state')!;

            // Handle callback
            const connection = await manager.handleCallback('facebook', 'test-code', state);

            expect(connection).toBeDefined();
            expect(connection.userId).toBe(mockUserId);
            expect(connection.platform).toBe('facebook');
            expect(connection.platformUserId).toBe('fb-user-123');
            expect(connection.platformUsername).toBe('Test User');
            expect(connection.metadata.pages).toHaveLength(1);
        });
    });

    describe('refreshToken', () => {
        it('should refresh expired token', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'old-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() - 1000, // Expired
                scope: ['pages_manage_posts'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            const mockRefreshResponse = {
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                expires_in: 3600,
            };

            mockPutItem.mockResolvedValueOnce(undefined);

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockRefreshResponse,
                } as Response);

            const updatedConnection = await manager.refreshToken(mockConnection);

            expect(updatedConnection.accessToken).not.toBe(mockConnection.accessToken);
            expect(updatedConnection.expiresAt).toBeGreaterThan(Date.now());
        });

        it('should throw error when refresh token is missing', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'old-access-token',
                refreshToken: '', // No refresh token
                expiresAt: Date.now() - 1000,
                scope: ['pages_manage_posts'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            await expect(
                manager.refreshToken(mockConnection)
            ).rejects.toThrow('No refresh token available');
        });

        it('should throw error when token refresh fails', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'old-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() - 1000,
                scope: ['pages_manage_posts'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: false,
                    text: async () => 'Invalid refresh token',
                } as Response);

            await expect(
                manager.refreshToken(mockConnection)
            ).rejects.toThrow('Token refresh failed');
        });
    });

    describe('getConnection', () => {
        it('should return null when connection does not exist', async () => {
            mockGetItem.mockResolvedValueOnce(null);

            const connection = await manager.getConnection(mockUserId, 'facebook');

            expect(connection).toBeNull();
        });

        it('should return connection when it exists and is valid', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000, // Valid for 1 hour
                scope: ['pages_manage_posts'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            mockGetItem.mockResolvedValueOnce(mockConnection);

            const connection = await manager.getConnection(mockUserId, 'facebook');

            expect(connection).toBeDefined();
            expect(connection?.userId).toBe(mockUserId);
            expect(connection?.platform).toBe('facebook');
        });

        it('should automatically refresh token if expiring soon', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'old-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 60000, // Expires in 1 minute
                scope: ['pages_manage_posts'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            const mockRefreshResponse = {
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                expires_in: 3600,
            };

            mockGetItem.mockResolvedValueOnce(mockConnection);
            mockPutItem.mockResolvedValueOnce(undefined);

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockRefreshResponse,
                } as Response);

            const connection = await manager.getConnection(mockUserId, 'facebook');

            expect(connection).toBeDefined();
            expect(connection?.expiresAt).toBeGreaterThan(mockConnection.expiresAt);
        });
    });

    describe('Platform-specific user info', () => {
        it('should fetch Facebook user info with pages', async () => {
            const mockUserInfo = {
                id: 'fb-user-123',
                name: 'Test User',
            };

            const mockPagesData = {
                data: [
                    { id: 'page-1', name: 'Test Page 1' },
                    { id: 'page-2', name: 'Test Page 2' },
                ],
            };

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockUserInfo,
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockPagesData,
                } as Response);

            // Access private method through any cast for testing
            const userInfo = await (manager as any).getFacebookUserInfo('test-token');

            expect(userInfo.id).toBe('fb-user-123');
            expect(userInfo.username).toBe('Test User');
            expect(userInfo.metadata.pages).toHaveLength(2);
        });

        it('should fetch Instagram user info with business accounts', async () => {
            const mockUserInfo = {
                id: 'ig-user-123',
                username: 'testuser',
            };

            const mockAccountsData = {
                data: [
                    { instagram_business_account: { id: 'ig-biz-123' } },
                ],
            };

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockUserInfo,
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockAccountsData,
                } as Response);

            const userInfo = await (manager as any).getInstagramUserInfo('test-token');

            expect(userInfo.id).toBe('ig-user-123');
            expect(userInfo.username).toBe('testuser');
            expect(userInfo.metadata.businessAccounts).toHaveLength(1);
        });

        it('should fetch LinkedIn user info', async () => {
            const mockUserInfo = {
                id: 'li-user-123',
                localizedFirstName: 'Test',
                localizedLastName: 'User',
            };

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockUserInfo,
                } as Response);

            const userInfo = await (manager as any).getLinkedInUserInfo('test-token');

            expect(userInfo.id).toBe('li-user-123');
            expect(userInfo.username).toBe('Test User');
        });
    });

    describe('Error handling', () => {
        it('should handle network errors during token exchange', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockRejectedValueOnce(new Error('Network error'));

            const authUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(authUrl);
            const state = url.searchParams.get('state')!;

            await expect(
                manager.handleCallback('facebook', 'test-code', state)
            ).rejects.toThrow('Network error');
        });

        it('should handle API errors during user info fetch', async () => {
            const mockTokenResponse = {
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                expires_in: 3600,
            };

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockTokenResponse,
                } as Response)
                .mockResolvedValueOnce({
                    ok: false,
                    text: async () => 'API Error',
                } as Response);

            const authUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(authUrl);
            const state = url.searchParams.get('state')!;

            await expect(
                manager.handleCallback('facebook', 'test-code', state)
            ).rejects.toThrow('Failed to get Facebook user info');
        });
    });
});
