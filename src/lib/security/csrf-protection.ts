/**
 * CSRF Protection Utilities
 * 
 * Provides Cross-Site Request Forgery (CSRF) protection for forms and API requests.
 * All state-changing operations should be protected with CSRF tokens.
 * 
 * Requirements: 10.1, 10.2 (Security)
 */

import { cookies } from 'next/headers';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_COOKIE_NAME = '__Host-csrf';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
    // Generate a random UUID v4
    return crypto.randomUUID();
}

/**
 * Set CSRF token in cookie
 * Uses __Host- prefix for additional security
 */
export async function setCSRFCookie(token: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF token from request
 * Compares token from request body/header with token in cookie
 */
export async function validateCSRFToken(requestToken: string): Promise<boolean> {
    if (!requestToken) {
        return false;
    }

    const cookieToken = await getCSRFCookie();

    if (!cookieToken) {
        return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(requestToken, cookieToken);
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by ensuring comparison takes constant time
 */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * Extract CSRF token from request
 * Checks both header and body
 */
export function extractCSRFToken(request: Request): string | null {
    // Try to get from header first
    const headerToken = request.headers.get('X-CSRF-Token');
    if (headerToken) {
        return headerToken;
    }

    // For form submissions, token should be in body
    // This will be handled by the form action
    return null;
}

/**
 * Middleware to validate CSRF token for POST/PUT/DELETE requests
 */
export async function validateCSRFMiddleware(request: Request): Promise<boolean> {
    // Only validate for state-changing methods
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        return true; // GET requests don't need CSRF protection
    }

    // Extract token from request
    const requestToken = extractCSRFToken(request);

    if (!requestToken) {
        return false;
    }

    // Validate token
    return await validateCSRFToken(requestToken);
}

/**
 * Generate CSRF token for forms
 * Returns both the token and a hidden input field
 */
export async function generateCSRFField(): Promise<{
    token: string;
    field: string;
}> {
    const token = generateCSRFToken();
    await setCSRFCookie(token);

    const field = `<input type="hidden" name="${CSRF_TOKEN_NAME}" value="${token}" />`;

    return { token, field };
}

/**
 * React component helper to get CSRF token
 * Use this in client components to include CSRF token in forms
 */
export async function getCSRFToken(): Promise<string> {
    let token = await getCSRFCookie();

    if (!token) {
        token = generateCSRFToken();
        await setCSRFCookie(token);
    }

    return token;
}
