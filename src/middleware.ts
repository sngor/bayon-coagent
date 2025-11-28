/**
 * Next.js Middleware - Edge Runtime Compatible
 * 
 * Lightweight middleware that works in Edge Runtime without X-Ray dependencies.
 * X-Ray tracing is handled at the API route level instead.
 * 
 * This middleware also handles:
 * - Dashboard link authorization and validation
 * - Rate limiting for dashboard access
 * - Security headers
 * - Request correlation tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateDashboardLinkMiddleware,
  extractTokenFromRequest,
  addSecurityHeaders
} from './middleware/validate-dashboard-link';

/**
 * Main middleware function
 */
export default async function middleware(request: NextRequest): Promise<NextResponse> {
  // Skip processing for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/robots.txt') ||
    request.nextUrl.pathname.startsWith('/manifest.json')
  ) {
    return NextResponse.next();
  }

  // Handle dashboard link authorization for /d/[token] routes
  if (request.nextUrl.pathname.startsWith('/d/')) {
    const token = extractTokenFromRequest(request);

    if (token) {
      // Validate the dashboard link
      const authResponse = await validateDashboardLinkMiddleware(request, token);

      // If validation failed, return the error response
      if (authResponse) {
        return addSecurityHeaders(authResponse);
      }
    } else {
      // No token found - return unauthorized
      const errorResponse = new NextResponse(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Dashboard access token is required',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return addSecurityHeaders(errorResponse);
    }
  }

  // Handle authenticated portal routes (/portal/*)
  // These routes require client authentication
  if (request.nextUrl.pathname.startsWith('/portal/')) {
    // Allow public portal routes (login, setup-password, forgot-password)
    const publicRoutes = ['/portal/login', '/portal/setup-password', '/portal/forgot-password'];
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    if (!isPublicRoute) {
      // Check for client session
      const sessionCookie = request.cookies.get('client_portal_session');

      if (!sessionCookie) {
        // No session, redirect to login with return URL
        const loginUrl = new URL('/portal/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Session exists - validate it
      // Note: Full validation happens in the page component
      // Here we just check if the cookie exists
    }
  }

  const response = NextResponse.next();

  // Add correlation ID for request tracking
  const correlationId = crypto.randomUUID();
  response.headers.set('X-Correlation-Id', correlationId);

  // Add security headers
  return addSecurityHeaders(response);
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};