/**
 * Server-side Authentication Utilities
 * 
 * This module provides server-side authentication functionality for Next.js server actions.
 * Since the current architecture uses client-side localStorage for sessions,
 * we'll implement a temporary solution that bypasses server-side auth for development.
 */

import { cookies, headers } from 'next/headers';
import { getCognitoClient, CognitoUser } from './cognito-client';

const SESSION_COOKIE_NAME = 'bayon-session';
const ACCESS_TOKEN_HEADER = 'x-access-token';

/**
 * Get the current authenticated user from server context
 * This function works in server actions and API routes
 * 
 * NOTE: This is a temporary implementation that returns a mock user
 * for development purposes since the current auth system is client-side only.
 */
export async function getCurrentUserServer(): Promise<CognitoUser | null> {
    const cookieStore = await cookies();

    try {
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let sessionData: any = null;

        // Parse session cookie
        if (sessionCookie?.value) {
            try {
                sessionData = JSON.parse(sessionCookie.value);

                // Validate required session fields
                if (!sessionData.accessToken || !sessionData.refreshToken) {
                    console.warn('⚠️ Server-side auth: Invalid session data structure, clearing cookie');
                    await clearSessionCookie();
                    return null;
                }

                accessToken = sessionData.accessToken;
                refreshToken = sessionData.refreshToken;
            } catch (parseError) {
                console.error('❌ Failed to parse session cookie, clearing cookie:', parseError);
                await clearSessionCookie();
                return null;
            }
        }

        // Fallback to header (for API requests)
        if (!accessToken) {
            const headersList = await headers();
            accessToken = headersList.get(ACCESS_TOKEN_HEADER);

            if (!accessToken) {
                console.debug('⚠️ Server-side auth: No access token in cookie or header');
                return null;
            }
        }

        const client = getCognitoClient();

        try {
            // Validate token with Cognito
            const user = await client.getCurrentUser(accessToken);
            console.log('✅ Server-side auth: User authenticated:', user.id);
            return user;
        } catch (validationError) {
            const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown error';
            console.warn(`⚠️ Access token validation failed: ${errorMessage}`);

            // If token is invalid/expired and we have a refresh token, try to refresh
            if (refreshToken) {
                console.log('🔄 Attempting token refresh...');
                try {
                    const newSession = await client.refreshSession(refreshToken);

                    // Update session cookie with new tokens
                    await setSessionCookie(
                        newSession.accessToken,
                        newSession.idToken,
                        newSession.refreshToken,
                        newSession.expiresAt
                    );

                    // Retry getting user with new access token
                    const user = await client.getCurrentUser(newSession.accessToken);
                    console.log('✅ Server-side auth: User authenticated after token refresh:', user.id);
                    return user;
                } catch (refreshError) {
                    const refreshErrorMessage = refreshError instanceof Error ? refreshError.message : 'Unknown error';
                    console.error(`❌ Token refresh failed: ${refreshErrorMessage}`);

                    // Clear invalid session cookie
                    console.log('🧹 Clearing invalid session cookie');
                    await clearSessionCookie();
                    return null;
                }
            }

            // No refresh token available, clear session
            console.warn('⚠️ No refresh token available, clearing session cookie');
            await clearSessionCookie();
            return null;
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Server authentication failed: ${errorMessage}`, error);

        // Clear potentially corrupted session
        await clearSessionCookie();
        return null;
    }
}

/**
 * Set session cookie (to be called from client-side after authentication)
 */
export async function setSessionCookie(accessToken: string, idToken: string, refreshToken: string, expiresAt: number) {
    const sessionData = {
        accessToken,
        idToken,
        refreshToken,
        expiresAt,
    };

    // Set cookie with httpOnly for security
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Middleware helper to extract user ID from request
 */
export async function getUserIdFromRequest(): Promise<string | null> {
    const user = await getCurrentUserServer();
    return user?.id || null;
}