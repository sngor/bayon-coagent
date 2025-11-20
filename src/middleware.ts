import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRedirectUrl, logRedirect } from '@/lib/redirects';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Check if this path needs to be redirected
  const redirectUrl = getRedirectUrl(pathname);

  if (redirectUrl) {
    // Log the redirect
    logRedirect(pathname, redirectUrl);

    // Create new URL with redirect path and preserve query params
    const url = request.nextUrl.clone();
    url.pathname = redirectUrl.split('?')[0]; // Get path without query params from redirect
    
    // Merge query params from redirect URL if any
    const redirectQueryParams = redirectUrl.split('?')[1];
    if (redirectQueryParams) {
      const params = new URLSearchParams(redirectQueryParams);
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    // Return permanent redirect (308)
    return NextResponse.redirect(url, { status: 308 });
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
