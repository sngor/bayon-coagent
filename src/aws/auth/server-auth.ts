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
    try {
        // Try to get access token from cookie first
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

        let accessToken: string | null = null;

        if (sessionCookie?.value) {
            try {
                const sessionData = JSON.parse(sessionCookie.value);
                accessToken = sessionData.accessToken;
            } catch (error) {
                console.error('Failed to parse session cookie:', error);
            }
        }

        // Fallback to header
        if (!accessToken) {
            const headersList = await headers();
            accessToken = headersList.get(ACCESS_TOKEN_HEADER);
        }

        if (accessToken) {
            // Validate token with Cognito
            const client = getCognitoClient();
            const user = await client.getCurrentUser(accessToken);
            console.log('✅ Server-side auth: Real user authenticated:', user.id);
            return user;
        }

        // No access token found
        console.warn('⚠️ Server-side auth: No access token found');
        return null;

    } catch (error) {
        console.error('❌ Server authentication failed:', error);
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