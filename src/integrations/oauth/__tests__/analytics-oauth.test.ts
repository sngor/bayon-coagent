/**
 * Analytics OAuth Integration Tests
 * 
 * Unit tests for enhanced OAuth functionality supporting content workflow features
 * including analytics access validation and token management.
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
        put: mockPutItem,
        delete: mockDeleteItem,
    })),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Analytics OAuth Integration', () => {
    let manager: OAuthConnectionManagerImpl;
    const mockUserId = 'user-123';

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
        process.env.TWITTER_CLIENT_ID = 'test-twitter-client-id';
        process.env.TWITTER_CLIENT_SECRET = 'test-twitter-secret';
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Enhanced OAuth Scopes', () => {
        it('should include analytics scopes for Facebook', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);

            expect(authUrl).toContain('pages_read_engagement');
            expect(authUrl).toContain('read_insights');
            expect(authUrl).toContain('business_management');
        });

        it('should include analytics scopes for Instagram', async () => {
            const authUrl = await manager.initiateConnection('instagram', mockUserId);

            expect(authUrl).toContain('instagram_manage_insights');
            expect(authUrl).toContain('read_insights');
            expect(authUrl).toContain('business_management');
        });

        it('should include analytics scopes for LinkedIn', async () => {
            const authUrl = await manager.initiateConnection('linkedin', mockUserId);

            expect(authUrl).toContain('r_analytics');
            expect(authUrl).toContain('r_organization_followers_statistics');
            expect(authUrl).toContain('r_organization_admin');
        });

        it('should include analytics scopes for Twitter', async () => {
            const authUrl = await manager.initiateConnection('twitter', mockUserId);

            expect(authUrl).toContain('follows.read');
            expect(authUrl).toContain('tweet.moderate.write');
        });
    });

    describe('validateAnalyticsAccess', () => {
        const createMockConnection = (platform: Platform, scopes: string[]): OAuthConnection => ({
            id: 'conn-123',
            userId: mockUserId,
            platform,
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiresAt: Date.now() + 3600000, // Valid for 1 hour
            scope: scopes,
            platformUserId: 'platform-user-123',
            platformUsername: 'Test User',
            metadata: {},
            createdAt: Date.now() - 10000,
            updatedAt: Date.now() - 10000,
        });

        it('should validate Facebook analytics access successfully', async () => {
            const mockConnection = createMockConnection('facebook', [
                'pages_manage_posts',
                'pages_read_engagement',
                'read_insights',
                'business_management'
            ]);

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });
            mockPutItem.mockResolvedValueOnce(undefined);

            // Mock successful analytics API call
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [] }),
                } as Response);

            const result = await manager.validateAnalyticsAccess(mockUserId, 'facebook');

            expect(result.hasAccess).toBe(true);
            expect(result.availableMetrics).toContain('post_impressions');
            expect(result.availableMetrics).toContain('post_engaged_users');
        });

        it('should handle analytics API failure', async () => {
            const mockConnection = createMockConnection('facebook', [
                'pages_manage_posts',
                'pages_read_engagement'
            ]);

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });

            // Mock failed analytics API call
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 403,
                    text: async () => 'Insufficient permissions',
                } as Response);

            const result = await manager.validateAnalyticsAccess(mockUserId, 'facebook');

            expect(result.hasAccess).toBe(false);
            expect(result.error).toContain('Analytics API call failed');
        });

        it('should return error for missing connection', async () => {
            mockGetItem.mockResolvedValueOnce(null);

            const result = await manager.validateAnalyticsAccess(mockUserId, 'facebook');

            expect(result.hasAccess).toBe(false);
            expect(result.error).toBe('Connection not found');
        });

        it('should return error for expired token', async () => {
            const mockConnection = createMockConnection('facebook', ['pages_manage_posts']);
            mockConnection.expiresAt = Date.now() - 1000; // Expired

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });

            const result = await manager.validateAnalyticsAccess(mockUserId, 'facebook');

            expect(result.hasAccess).toBe(false);
            expect(result.error).toBe('Token expired');
        });

        it('should validate LinkedIn analytics access', async () => {
            const mockConnection = createMockConnection('linkedin', [
                'w_member_social',
                'r_analytics',
                'r_organization_followers_statistics'
            ]);

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });
            mockPutItem.mockResolvedValueOnce(undefined);

            // Mock successful LinkedIn analytics API call
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ elements: [] }),
                } as Response);

            const result = await manager.validateAnalyticsAccess(mockUserId, 'linkedin');

            expect(result.hasAccess).toBe(true);
            expect(result.availableMetrics).toContain('impressions');
            expect(result.availableMetrics).toContain('engagement');
        });

        it('should validate Twitter analytics access', async () => {
            const mockConnection = createMockConnection('twitter', [
                'tweet.read',
                'tweet.write',
                'follows.read'
            ]);

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });
            mockPutItem.mockResolvedValueOnce(undefined);

            // Mock successful Twitter analytics API call
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        data: {
                            id: 'twitter-user-123',
                            public_metrics: { followers_count: 100 }
                        }
                    }),
                } as Response);

            const result = await manager.validateAnalyticsAccess(mockUserId, 'twitter');

            expect(result.hasAccess).toBe(true);
            expect(result.availableMetrics).toContain('impression_count');
            expect(result.availableMetrics).toContain('like_count');
        });
    });

    describe('getConnectionForAnalytics', () => {
        it('should return connection with valid analytics access', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000,
                scope: ['pages_manage_posts', 'read_insights'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });
            mockPutItem.mockResolvedValueOnce(undefined);

            // Mock successful analytics validation
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [] }),
                } as Response);

            const connection = await manager.getConnectionForAnalytics(mockUserId, 'facebook');

            expect(connection).toBeDefined();
            expect(connection?.platform).toBe('facebook');
            expect(connection?.scope).toContain('read_insights');
        });

        it('should throw error when analytics access is not available', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000,
                scope: ['pages_manage_posts'], // Missing analytics scopes
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });

            // Mock failed analytics validation
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 403,
                    text: async () => 'Insufficient permissions',
                } as Response);

            await expect(
                manager.getConnectionForAnalytics(mockUserId, 'facebook')
            ).rejects.toThrow('Analytics access not available');
        });

        it('should return null for non-existent connection', async () => {
            mockGetItem.mockResolvedValueOnce(null);

            const connection = await manager.getConnectionForAnalytics(mockUserId, 'facebook');

            expect(connection).toBeNull();
        });
    });

    describe('Analytics scope validation', () => {
        it('should identify Facebook analytics scopes correctly', async () => {
            const manager = new OAuthConnectionManagerImpl();

            // Access private method for testing
            const isAnalyticsScope = (manager as any).isAnalyticsScope.bind(manager);

            expect(isAnalyticsScope('facebook', 'pages_read_engagement')).toBe(true);
            expect(isAnalyticsScope('facebook', 'read_insights')).toBe(true);
            expect(isAnalyticsScope('facebook', 'business_management')).toBe(true);
            expect(isAnalyticsScope('facebook', 'pages_manage_posts')).toBe(false);
        });

        it('should identify LinkedIn analytics scopes correctly', async () => {
            const manager = new OAuthConnectionManagerImpl();
            const isAnalyticsScope = (manager as any).isAnalyticsScope.bind(manager);

            expect(isAnalyticsScope('linkedin', 'r_analytics')).toBe(true);
            expect(isAnalyticsScope('linkedin', 'r_organization_followers_statistics')).toBe(true);
            expect(isAnalyticsScope('linkedin', 'r_organization_admin')).toBe(true);
            expect(isAnalyticsScope('linkedin', 'w_member_social')).toBe(false);
        });

        it('should identify Twitter analytics scopes correctly', async () => {
            const manager = new OAuthConnectionManagerImpl();
            const isAnalyticsScope = (manager as any).isAnalyticsScope.bind(manager);

            expect(isAnalyticsScope('twitter', 'follows.read')).toBe(true);
            expect(isAnalyticsScope('twitter', 'tweet.moderate.write')).toBe(true);
            expect(isAnalyticsScope('twitter', 'tweet.read')).toBe(false);
        });
    });

    describe('Analytics API endpoints', () => {
        it('should use correct analytics endpoints for each platform', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000,
                scope: ['read_insights'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });
            mockPutItem.mockResolvedValueOnce(undefined);

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [] }),
                } as Response);

            await manager.validateAnalyticsAccess(mockUserId, 'facebook');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('https://graph.facebook.com/v18.0'),
                expect.any(Object)
            );
        });
    });

    describe('Error handling and timeouts', () => {
        it('should handle API timeout errors', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000,
                scope: ['read_insights'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });

            // Mock timeout error
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockRejectedValueOnce(new Error('Request timeout'));

            const result = await manager.validateAnalyticsAccess(mockUserId, 'facebook');

            expect(result.hasAccess).toBe(false);
            expect(result.error).toContain('Request timeout');
        });

        it('should handle network errors gracefully', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'linkedin',
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000,
                scope: ['r_analytics'],
                platformUserId: 'li-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });

            // Mock network error
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockRejectedValueOnce(new Error('Network error'));

            const result = await manager.validateAnalyticsAccess(mockUserId, 'linkedin');

            expect(result.hasAccess).toBe(false);
            expect(result.error).toContain('Network error');
        });
    });

    describe('Metadata updates', () => {
        it('should update connection metadata with analytics validation results', async () => {
            const mockConnection: OAuthConnection = {
                id: 'conn-123',
                userId: mockUserId,
                platform: 'facebook',
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000,
                scope: ['read_insights'],
                platformUserId: 'fb-user-123',
                platformUsername: 'Test User',
                metadata: {},
                createdAt: Date.now() - 10000,
                updatedAt: Date.now() - 10000,
            };

            mockGetItem.mockResolvedValueOnce({ Data: mockConnection });
            mockPutItem.mockResolvedValueOnce(undefined);

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ data: [] }),
                } as Response);

            await manager.validateAnalyticsAccess(mockUserId, 'facebook');

            // Verify metadata update was called
            expect(mockPutItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    Data: expect.objectContaining({
                        metadata: expect.objectContaining({
                            lastAnalyticsValidated: expect.any(Number),
                            analyticsValidationResult: expect.objectContaining({
                                hasAccess: true
                            }),
                            analyticsScopes: expect.arrayContaining(['read_insights'])
                        })
                    })
                })
            );
        });
    });
});