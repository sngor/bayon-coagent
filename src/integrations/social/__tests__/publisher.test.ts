/**
 * Social Media Publisher Service Tests
 * 
 * Tests for the social media publisher service that handles
 * publishing to Facebook, Instagram, and LinkedIn.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SocialPublisherService } from '../publisher';
import { SocialPost, OAuthConnection, Platform } from '../types';

// Mock DynamoDB repository
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn(() => ({
        put: jest.fn().mockImplementation(() => Promise.resolve()),
        getItem: jest.fn().mockImplementation(() => Promise.resolve(null)),
        delete: jest.fn().mockImplementation(() => Promise.resolve()),
    })),
}));

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('SocialPublisherService', () => {
    let publisher: SocialPublisherService;
    let mockConnection: OAuthConnection;
    let mockPost: SocialPost;

    beforeEach(() => {
        publisher = new SocialPublisherService();

        // Reset fetch mock
        (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();

        // Mock OAuth connection
        mockConnection = {
            id: 'conn-123',
            userId: 'user-123',
            platform: 'facebook',
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresAt: Date.now() + 3600000,
            scope: ['pages_manage_posts'],
            platformUserId: 'platform-user-123',
            platformUsername: 'Test User',
            metadata: {
                pages: [{ id: 'page-123', name: 'Test Page' }],
                selectedPageId: 'page-123',
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Mock social post
        mockPost = {
            listingId: 'listing-123',
            content: 'Beautiful 3-bedroom home in downtown',
            images: ['https://example.com/photo1.jpg'],
            hashtags: ['#realestate', '#dreamhome'],
            platform: 'facebook',
        };
    });

    describe('publishToFacebook', () => {
        it('should publish successfully with images', async () => {
            // Mock page access token request
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'page-token' }),
                } as Response)
                // Mock photo upload
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'post-123' }),
                } as Response);

            const result = await publisher.publishToFacebook(mockPost, mockConnection);

            expect(result.success).toBe(true);
            expect(result.postId).toBe('post-123');
            expect(result.postUrl).toContain('facebook.com');
        });

        it('should handle missing page ID', async () => {
            const connectionWithoutPage = {
                ...mockConnection,
                metadata: {},
            };

            const result = await publisher.publishToFacebook(mockPost, connectionWithoutPage);

            expect(result.success).toBe(false);
            expect(result.error).toContain('No Facebook page selected');
        });

        it('should handle API errors', async () => {
            // Mock page access token request
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ access_token: 'page-token' }),
                } as Response)
                // Mock failed photo upload
                .mockResolvedValueOnce({
                    ok: false,
                    text: async () => 'API Error',
                } as Response);

            const result = await publisher.publishToFacebook(mockPost, mockConnection);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('publishToInstagram', () => {
        beforeEach(() => {
            mockConnection.platform = 'instagram';
            mockConnection.metadata = {
                businessAccounts: [
                    {
                        instagram_business_account: { id: 'ig-account-123' },
                    },
                ],
            };
            mockPost.platform = 'instagram';
        });

        it('should publish successfully', async () => {
            // Mock container creation
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'container-123' }),
                } as Response)
                // Mock publish
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'post-123' }),
                } as Response);

            const result = await publisher.publishToInstagram(mockPost, mockConnection);

            expect(result.success).toBe(true);
            expect(result.postId).toBe('post-123');
            expect(result.postUrl).toContain('instagram.com');
        });

        it('should require at least one image', async () => {
            const postWithoutImages = {
                ...mockPost,
                images: [],
            };

            const result = await publisher.publishToInstagram(postWithoutImages, mockConnection);

            expect(result.success).toBe(false);
            expect(result.error).toContain('require at least one image');
        });

        it('should handle missing business account', async () => {
            const connectionWithoutAccount = {
                ...mockConnection,
                metadata: {},
            };

            const result = await publisher.publishToInstagram(mockPost, connectionWithoutAccount);

            expect(result.success).toBe(false);
            expect(result.error).toContain('No Instagram business account');
        });
    });

    describe('publishToLinkedIn', () => {
        beforeEach(() => {
            mockConnection.platform = 'linkedin';
            mockPost.platform = 'linkedin';
        });

        it('should publish successfully', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'post-123' }),
                } as Response);

            const result = await publisher.publishToLinkedIn(mockPost, mockConnection);

            expect(result.success).toBe(true);
            expect(result.postId).toBe('post-123');
            expect(result.postUrl).toContain('linkedin.com');
        });

        it('should handle API errors', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: false,
                    text: async () => 'API Error',
                } as Response);

            const result = await publisher.publishToLinkedIn(mockPost, mockConnection);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should support text-only posts', async () => {
            const textOnlyPost = {
                ...mockPost,
                images: [],
            };

            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ id: 'post-123' }),
                } as Response);

            const result = await publisher.publishToLinkedIn(textOnlyPost, mockConnection);

            expect(result.success).toBe(true);
        });
    });

    describe('unpublishPost', () => {
        it('should unpublish Facebook post', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                } as Response);

            await expect(
                publisher.unpublishPost('facebook', 'post-123', mockConnection)
            ).resolves.not.toThrow();
        });

        it('should unpublish Instagram post', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                } as Response);

            await expect(
                publisher.unpublishPost('instagram', 'post-123', mockConnection)
            ).resolves.not.toThrow();
        });

        it('should unpublish LinkedIn post', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: true,
                } as Response);

            await expect(
                publisher.unpublishPost('linkedin', 'post-123', mockConnection)
            ).resolves.not.toThrow();
        });

        it('should handle unpublish errors', async () => {
            (global.fetch as jest.MockedFunction<typeof fetch>)
                .mockResolvedValueOnce({
                    ok: false,
                    text: async () => 'Delete failed',
                } as Response);

            await expect(
                publisher.unpublishPost('facebook', 'post-123', mockConnection)
            ).rejects.toThrow();
        });
    });

    describe('formatPostContent', () => {
        it('should format content with hashtags', () => {
            const service = publisher as any;
            const formatted = service.formatPostContent(mockPost);

            expect(formatted).toContain(mockPost.content);
            expect(formatted).toContain('#realestate');
            expect(formatted).toContain('#dreamhome');
        });

        it('should handle posts without hashtags', () => {
            const postWithoutHashtags = {
                ...mockPost,
                hashtags: [],
            };

            const service = publisher as any;
            const formatted = service.formatPostContent(postWithoutHashtags);

            expect(formatted).toBe(mockPost.content);
        });
    });
});
