/**
 * URL redirect mapping for feature consolidation
 * Maps old URLs to new hub-based structure
 */

export const REDIRECT_MAP: Record<string, string> = {
  // Studio Hub
  '/content-engine': '/studio/write',
  '/listing-description-generator': '/studio/describe',
  '/reimagine': '/studio/reimagine',

  // Market Hub (formerly Intelligence)
  '/intelligence': '/market',
  '/intelligence/research': '/market/research',
  '/intelligence/competitors': '/brand/competitors',
  '/intelligence/market-insights': '/market/trends',
  '/research-agent': '/market/research',
  '/knowledge-base': '/library/reports',
  '/competitive-analysis': '/brand/competitors',
  '/investment-opportunity-identification': '/market/opportunities',
  '/life-event-predictor': '/market/trends',

  // Brand Hub (formerly Brand Center)
  '/brand-center': '/brand',
  '/brand-center/profile': '/brand/profile',
  '/brand-center/audit': '/brand/audit',
  '/brand-center/strategy': '/brand/strategy',
  '/profile': '/brand/profile',
  '/brand-audit': '/brand/audit',
  '/marketing-plan': '/brand/strategy',

  // Library (formerly Projects)
  '/projects': '/library/content',

  // Training (removed from main nav)
  '/training-hub': '/training',
};

/**
 * Get redirect URL for a given path
 * Returns null if no redirect is needed
 */
export function getRedirectUrl(pathname: string): string | null {
  // Check exact match first
  if (REDIRECT_MAP[pathname]) {
    return REDIRECT_MAP[pathname];
  }

  // Check if path starts with any redirect key (for nested routes)
  for (const [oldPath, newPath] of Object.entries(REDIRECT_MAP)) {
    if (pathname.startsWith(oldPath + '/')) {
      // Preserve the nested path
      const nestedPath = pathname.slice(oldPath.length);
      return newPath + nestedPath;
    }
  }

  return null;
}

/**
 * Log redirect for analytics
 */
export function logRedirect(from: string, to: string) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Track redirect event
    console.log(`[Redirect] ${from} → ${to}`);
    // TODO: Add analytics tracking here
  }
}
