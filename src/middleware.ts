/**
 * Next.js Middleware - Edge Runtime Compatible
 * 
 * Lightweight middleware that works in Edge Runtime without X-Ray dependencies.
 * X-Ray tracing is handled at the API route level instead.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Main middleware function
 */
export default function middleware(request: NextRequest): NextResponse {
  // Skip processing for static assets
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.startsWith('/robots.txt') ||
    request.nextUrl.pathname.startsWith('/manifest.json')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Add correlation ID for request tracking
  const correlationId = crypto.randomUUID();
  response.headers.set('X-Correlation-Id', correlationId);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
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