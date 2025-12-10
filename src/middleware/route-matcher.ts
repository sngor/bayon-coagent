/**
 * Route Matcher Utility
 * 
 * Efficient route matching for middleware with caching and pattern matching
 */

export interface RoutePattern {
    pattern: string;
    exact?: boolean;
    regex?: RegExp;
}

export class RouteMatcher {
    private cache = new Map<string, boolean>();
    private patterns: RoutePattern[];

    constructor(patterns: (string | RoutePattern)[]) {
        this.patterns = patterns.map(p =>
            typeof p === 'string'
                ? { pattern: p, exact: false }
                : { ...p, regex: p.regex || new RegExp(`^${p.pattern.replace(/\*/g, '.*')}`) }
        );
    }

    /**
     * Check if a pathname matches any of the patterns
     */
    matches(pathname: string): boolean {
        // Check cache first
        if (this.cache.has(pathname)) {
            return this.cache.get(pathname)!;
        }

        const result = this.patterns.some(pattern => {
            if (pattern.regex) {
                return pattern.regex.test(pathname);
            }

            return pattern.exact
                ? pathname === pattern.pattern
                : pathname.startsWith(pattern.pattern);
        });

        // Cache result (limit cache size to prevent memory leaks)
        if (this.cache.size < 1000) {
            this.cache.set(pathname, result);
        }

        return result;
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Pre-defined route matchers
export const STATIC_ASSET_MATCHER = new RouteMatcher([
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/manifest.json',
    { pattern: '/.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$', regex: /\/.*\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/ }
]);

export const PUBLIC_ROUTE_MATCHER = new RouteMatcher([
    '/portal/login',
    '/portal/setup-password',
    '/portal/forgot-password',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email'
]);

export const ADMIN_ROUTE_MATCHER = new RouteMatcher(['/admin/']);

export const SUPER_ADMIN_ROUTE_MATCHER = new RouteMatcher([
    '/admin/billing',
    '/admin/integrations',
    '/admin/audit',
    '/admin/config/settings',
    '/admin/system/maintenance'
]);