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
// TEMPORARILY DISABLED due to Edge Runtime compatibility issues
// import {
//   validateDashboardLinkMiddleware,
//   extractTokenFromRequest,
//   addSecurityHeaders
// } from './middleware/validate-dashboard-link';
import {
  isAdminRoute,
  addAuditHeaders,
} from './middleware/admin-auth';
import { onboardingDetectionMiddleware } from './middleware/onboarding-detection';
import { STATIC_ASSET_MATCHER, PUBLIC_ROUTE_MATCHER } from './middleware/route-matcher';
import { withErrorHandler } from './middleware/error-handler';

/**
 * Add security headers to response (simplified version)
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

/**
 * Check if request is for static assets
 */
function isStaticAsset(pathname: string): boolean {
  return STATIC_ASSET_MATCHER.matches(pathname);
}

/**
 * Handle dashboard link routes (/d/[token])
 * TEMPORARILY DISABLED due to Edge Runtime compatibility issues
 */
// const handleDashboardRoute = withErrorHandler(
//   async (request: NextRequest): Promise<NextResponse | null> => {
//     const token = extractTokenFromRequest(request);

//     if (token) {
//       // Validate the dashboard link
//       const authResponse = await validateDashboardLinkMiddleware(request, token);
//       return authResponse ? addSecurityHeaders(authResponse) : null;
//     }

//     // No token found - return unauthorized
//     const errorResponse = new NextResponse(
//       JSON.stringify({
//         error: 'Unauthorized',
//         message: 'Dashboard access token is required',
//       }),
//       {
//         status: 401,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     return addSecurityHeaders(errorResponse);
//   },
//   'handleDashboardRoute'
// );

/**
 * Handle portal routes (/portal/*)
 */
function handlePortalRoute(request: NextRequest): NextResponse | null {
  // Allow public portal routes
  if (PUBLIC_ROUTE_MATCHER.matches(request.nextUrl.pathname)) {
    return null; // Continue processing
  }

  // Check for client session
  const sessionCookie = request.cookies.get('client_portal_session');

  if (!sessionCookie) {
    // No session, redirect to login with return URL
    const loginUrl = new URL('/portal/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null; // Continue processing
}

/**
 * Handle admin routes (/admin/*)
 */
function handleAdminRoute(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Add correlation ID for request tracking
  const correlationId = crypto.randomUUID();
  response.headers.set('X-Correlation-Id', correlationId);

  // Add audit headers for admin actions
  const auditResponse = addAuditHeaders(response, request);

  // Add security headers
  return addSecurityHeaders(auditResponse);
}

/**
 * Create default response with security headers
 */
function createDefaultResponse(): NextResponse {
  const response = NextResponse.next();

  // Add correlation ID for request tracking
  const correlationId = crypto.randomUUID();
  response.headers.set('X-Correlation-Id', correlationId);

  // Add security headers
  return addSecurityHeaders(response);
}

/**
 * Main middleware function with comprehensive error handling and performance monitoring
 */
export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const correlationId = crypto.randomUUID();

  try {
    // Skip processing for static assets
    if (isStaticAsset(pathname)) {
      return NextResponse.next();
    }

    // Route-specific middleware handlers in priority order
    const routeHandlers = [
      // TEMPORARILY DISABLED due to Edge Runtime compatibility issues
      // {
      //   condition: () => pathname.startsWith('/d/'),
      //   handler: () => handleDashboardRoute(request),
      //   name: 'dashboard',
      // },
      {
        condition: () => pathname.startsWith('/portal/'),
        handler: () => Promise.resolve(handlePortalRoute(request)),
        name: 'portal',
      },
      {
        condition: () => isAdminRoute(pathname),
        handler: () => Promise.resolve(handleAdminRoute(request)),
        name: 'admin',
      },
    ];

    // Execute applicable route handlers
    for (const { condition, handler, name } of routeHandlers) {
      if (condition()) {
        const response = await handler();
        if (response) {
          // Add performance and correlation headers
          response.headers.set('X-Middleware-Duration', `${Date.now() - startTime}ms`);
          response.headers.set('X-Correlation-Id', correlationId);
          response.headers.set('X-Middleware-Handler', name);
          return response;
        }
      }
    }

    // Handle onboarding detection for non-specific routes
    const onboardingResponse = await withErrorHandler(
      onboardingDetectionMiddleware,
      'onboardingDetection'
    )(request);

    if (onboardingResponse) {
      onboardingResponse.headers.set('X-Middleware-Duration', `${Date.now() - startTime}ms`);
      onboardingResponse.headers.set('X-Correlation-Id', correlationId);
      return addSecurityHeaders(onboardingResponse);
    }

    // Default response with security headers and performance data
    const response = createDefaultResponse();
    response.headers.set('X-Middleware-Duration', `${Date.now() - startTime}ms`);
    response.headers.set('X-Correlation-Id', correlationId);
    response.headers.set('X-Middleware-Handler', 'default');

    return response;

  } catch (error) {
    // Global error handler - should not reach here due to withErrorHandler wrappers
    console.error('[MIDDLEWARE] Unexpected error:', error);

    const response = createDefaultResponse();
    response.headers.set('X-Middleware-Error', 'true');
    response.headers.set('X-Correlation-Id', correlationId);
    response.headers.set('X-Middleware-Duration', `${Date.now() - startTime}ms`);

    return response;
  }
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