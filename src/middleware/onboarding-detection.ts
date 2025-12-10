/**
 * Onboarding Detection Middleware
 * 
 * Detects first-time users and redirects them to the onboarding flow.
 * Handles authentication checks, onboarding state verification, and preserves query parameters.
 * 
 * Features:
 * - Checks if user is authenticated
 * - Verifies onboarding completion status
 * - Redirects to appropriate onboarding step
 * - Preserves query parameters during redirects
 * - Prevents redirect loops for onboarding routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCognitoClient } from '@/aws/auth/cognito-client';

const SESSION_COOKIE_NAME = 'bayon-session';

/**
 * Checks if the current path is an onboarding route
 */
function isOnboardingRoute(pathname: string): boolean {
    return pathname.startsWith('/onboarding');
}

/**
 * Checks if the current path is a public route that doesn't require authentication
 */
function isPublicRoute(pathname: string): boolean {
    const publicRoutes = [
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/portal/login',
        '/portal/setup-password',
        '/portal/forgot-password',
    ];

    return publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * Extracts user ID from session cookie with JWT verification
 * Validates: Requirements 11.1 (JWT token verification)
 */
async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
    try {
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

        if (!sessionCookie?.value) {
            return null;
        }

        // Parse session data
        let sessionData: any;
        try {
            sessionData = JSON.parse(sessionCookie.value);
        } catch (parseError) {
            console.error('[ONBOARDING_MIDDLEWARE] Invalid session cookie format');
            return null;
        }

        if (!sessionData.accessToken) {
            return null;
        }

        // Verify JWT token with Cognito
        const client = getCognitoClient();
        let user;

        try {
            user = await client.getCurrentUser(sessionData.accessToken);
        } catch (tokenError) {
            console.error('[ONBOARDING_MIDDLEWARE] JWT token verification failed:', tokenError);
            return null;
        }

        if (!user || !user.id) {
            return null;
        }

        return user.id;
    } catch (error) {
        console.error('[ONBOARDING_MIDDLEWARE] Error extracting user ID:', error);
        return null;
    }
}

/**
 * Checks if user needs onboarding (Edge Runtime compatible version)
 * 
 * This is a simplified version that uses API routes instead of direct DynamoDB access
 * to maintain Edge Runtime compatibility. The actual onboarding state check is delegated
 * to an API route that runs in Node.js runtime.
 */
async function checkNeedsOnboarding(userId: string, request: NextRequest): Promise<{ needsOnboarding: boolean; nextStepPath: string | null }> {
    try {
        // Use API route to check onboarding status (runs in Node.js runtime)
        const apiUrl = new URL('/api/onboarding/check-status', request.url);

        // Create a simple fetch request with user ID
        const response = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward the session cookie for authentication
                'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            // If API fails, gracefully degrade - don't block user access
            console.warn('[ONBOARDING_MIDDLEWARE] API check failed, allowing access');
            return {
                needsOnboarding: false,
                nextStepPath: null,
            };
        }

        const result = await response.json();

        return {
            needsOnboarding: result.needsOnboarding || false,
            nextStepPath: result.nextStepPath || null,
        };

    } catch (error: any) {
        console.error('[ONBOARDING_MIDDLEWARE] Error checking onboarding status:', error);

        // On error, gracefully degrade - don't block user access
        // This is a deliberate design decision to prioritize user access over onboarding enforcement
        console.warn('[ONBOARDING_MIDDLEWARE] Graceful degradation: allowing access without onboarding check');
        return {
            needsOnboarding: false,
            nextStepPath: null,
        };
    }
}

/**
 * Preserves query parameters when redirecting
 */
function createRedirectWithParams(targetPath: string, request: NextRequest): NextResponse {
    const url = new URL(targetPath, request.url);

    // Copy all query parameters from the original request
    request.nextUrl.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
    });

    return NextResponse.redirect(url);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
    // Add security headers for onboarding routes
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

/**
 * Main onboarding detection middleware function
 * Validates: Requirements 11.1 (JWT verification on all routes)
 */
export async function onboardingDetectionMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;

    // Skip onboarding detection for:
    // 1. Already on onboarding routes (prevent redirect loops)
    // 2. Public routes (login, signup, etc.)
    // 3. API routes
    // 4. Static assets
    if (
        isOnboardingRoute(pathname) ||
        isPublicRoute(pathname) ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/robots') ||
        pathname.startsWith('/manifest')
    ) {
        return null; // Continue to next middleware
    }

    // Check if user is authenticated (includes JWT verification)
    const userId = await getUserIdFromSession(request);

    if (!userId) {
        // User is not authenticated, let them through
        // (auth middleware will handle redirecting to login if needed)
        return null;
    }

    // Check if user needs onboarding
    const { needsOnboarding, nextStepPath } = await checkNeedsOnboarding(userId, request);

    if (needsOnboarding && nextStepPath) {
        console.log(`[ONBOARDING_MIDDLEWARE] Redirecting user ${userId} to onboarding: ${nextStepPath}`);
        const redirectResponse = createRedirectWithParams(nextStepPath, request);
        return addSecurityHeaders(redirectResponse);
    }

    // User doesn't need onboarding, continue
    return null;
}
