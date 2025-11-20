/**
 * OAuth Connection Manager Unit Tests
 * 
 * Focused unit tests for OAuth connection management core logic.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OAuthConnectionManagerImpl } from '../connection-manager';
import type { Platform } from '../../social/types';

describe('OAuthConnectionManager - Unit Tests', () => {
    let manager: OAuthConnectionManagerImpl;
    const mockUserId = 'user-123';

    beforeEach(() => {
        manager = new OAuthConnectionManagerImpl();

        // Set required environment variables
        process.env.FACEBOOK_APP_ID = 'test-facebook-app-id';
        process.env.FACEBOOK_APP_SECRET = 'test-facebook-secret';
        process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id';
        process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-secret';
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    });

    describe('initiateConnection', () => {
        it('should generate valid authorization URL for Facebook', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);

            expect(authUrl).toContain('https://www.facebook.com/v18.0/dialog/oauth');
            expect(authUrl).toContain('client_id=test-facebook-app-id');
            expect(authUrl).toContain('redirect_uri=');
            expect(authUrl).toContain('scope=');
            expect(authUrl).toContain('state=');
            expect(authUrl).toContain('response_type=code');
        });

        it('should generate valid authorization URL for Instagram', async () => {
            const authUrl = await manager.initiateConnection('instagram', mockUserId);

            expect(authUrl).toContain('https://www.facebook.com/v18.0/dialog/oauth');
            expect(authUrl).toContain('client_id=test-facebook-app-id');
            expect(authUrl).toContain('instagram');
        });

        it('should generate valid authorization URL for LinkedIn', async () => {
            const authUrl = await manager.initiateConnection('linkedin', mockUserId);

            expect(authUrl).toContain('https://www.linkedin.com/oauth/v2/authorization');
            expect(authUrl).toContain('client_id=test-linkedin-client-id');
        });

        it('should include unique state parameter for CSRF protection', async () => {
            const authUrl1 = await manager.initiateConnection('facebook', mockUserId);
            const authUrl2 = await manager.initiateConnection('facebook', mockUserId);

            const url1 = new URL(authUrl1);
            const url2 = new URL(authUrl2);
            const state1 = url1.searchParams.get('state');
            const state2 = url2.searchParams.get('state');

            expect(state1).toBeTruthy();
            expect(state2).toBeTruthy();
            expect(state1).not.toBe(state2); // Each state should be unique
            expect(state1).toHaveLength(36); // UUID length
        });

        it('should include correct scopes for Facebook', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);

            expect(authUrl).toContain('pages_manage_posts');
            expect(authUrl).toContain('pages_read_engagement');
            expect(authUrl).toContain('pages_show_list');
            expect(authUrl).toContain('public_profile');
        });

        it('should include correct scopes for Instagram', async () => {
            const authUrl = await manager.initiateConnection('instagram', mockUserId);

            expect(authUrl).toContain('instagram_basic');
            expect(authUrl).toContain('instagram_content_publish');
        });

        it('should include correct scopes for LinkedIn', async () => {
            const authUrl = await manager.initiateConnection('linkedin', mockUserId);

            expect(authUrl).toContain('w_member_social');
            expect(authUrl).toContain('r_basicprofile');
        });

        it('should use correct redirect URI for each platform', async () => {
            const facebookUrl = await manager.initiateConnection('facebook', mockUserId);
            const instagramUrl = await manager.initiateConnection('instagram', mockUserId);
            const linkedinUrl = await manager.initiateConnection('linkedin', mockUserId);

            expect(facebookUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Foauth%2Ffacebook%2Fcallback');
            expect(instagramUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Foauth%2Finstagram%2Fcallback');
            expect(linkedinUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Foauth%2Flinkedin%2Fcallback');
        });
    });

    describe('handleCallback - State Validation', () => {
        it('should reject invalid state parameter', async () => {
            await expect(
                manager.handleCallback('facebook', 'test-code', 'invalid-state')
            ).rejects.toThrow('Invalid or expired OAuth state');
        });

        it('should reject platform mismatch', async () => {
            // Generate state for Facebook
            const facebookUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(facebookUrl);
            const state = url.searchParams.get('state')!;

            // Try to use Facebook state for Instagram
            await expect(
                manager.handleCallback('instagram', 'test-code', state)
            ).rejects.toThrow('Platform mismatch');
        });

        it('should accept valid state for correct platform', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(authUrl);
            const state = url.searchParams.get('state')!;

            // This will fail at token exchange, but state validation should pass
            await expect(
                manager.handleCallback('facebook', 'test-code', state)
            ).rejects.not.toThrow('Invalid or expired OAuth state');

            await expect(
                manager.handleCallback('facebook', 'test-code', state)
            ).rejects.not.toThrow('Platform mismatch');
        });
    });

    describe('URL Generation', () => {
        it('should generate properly encoded URLs', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);

            // URL should be valid
            expect(() => new URL(authUrl)).not.toThrow();

            // Parameters should be properly encoded
            const url = new URL(authUrl);
            expect(url.searchParams.get('client_id')).toBe('test-facebook-app-id');
            expect(url.searchParams.get('response_type')).toBe('code');
        });

        it('should include all required OAuth parameters', async () => {
            const authUrl = await manager.initiateConnection('facebook', mockUserId);
            const url = new URL(authUrl);

            expect(url.searchParams.has('client_id')).toBe(true);
            expect(url.searchParams.has('redirect_uri')).toBe(true);
            expect(url.searchParams.has('scope')).toBe(true);
            expect(url.searchParams.has('state')).toBe(true);
            expect(url.searchParams.has('response_type')).toBe(true);
        });
    });

    describe('Platform Configuration', () => {
        it('should use correct auth endpoints for each platform', async () => {
            const facebookUrl = await manager.initiateConnection('facebook', mockUserId);
            const instagramUrl = await manager.initiateConnection('instagram', mockUserId);
            const linkedinUrl = await manager.initiateConnection('linkedin', mockUserId);

            expect(facebookUrl).toMatch(/^https:\/\/www\.facebook\.com\/v18\.0\/dialog\/oauth/);
            expect(instagramUrl).toMatch(/^https:\/\/www\.facebook\.com\/v18\.0\/dialog\/oauth/);
            expect(linkedinUrl).toMatch(/^https:\/\/www\.linkedin\.com\/oauth\/v2\/authorization/);
        });
    });
});
