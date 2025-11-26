/**
 * URL redirect mapping for feature consolidation
 * Maps old URLs to new hub-based structure
 */

export const REDIRECT_MAP: Record<string, string> = {
  // Studio Hub
  '/content-engine': '/studio/write',
  '/listing-description-generator': '/studio/describe',
  '/reimagine': '/studio/reimagine',

  // Research Hub
  '/research-agent': '/intelligence/agent',
  '/knowledge-base': '/intelligence/knowledge',
  '/intelligence/research': '/intelligence/agent',

  // Market Hub (formerly Intelligence)
  '/intelligence': '/market',
  '/intelligence/competitors': '/brand/competitors',
  '/intelligence/market-insights': '/market/trends',
  '/competitive-analysis': '/brand/competitors',
  '/investment-opportunity-identification': '/market/opportunities',
  '/life-event-predictor': '/market/trends',

  // Market consolidation redirects (legacy insights paths)
  '/market/insights': '/market/trends',

  // Tools Hub (moved from Market)
  '/market/calculator': '/tools/calculator',
  '/market/tools': '/tools/calculator',
  '/market/renovation-roi': '/tools/roi',
  '/market/valuation': '/tools/valuation',

  // Brand Hub (formerly Brand Center)
  '/brand-center': '/brand',
  '/brand-center/profile': '/brand/profile',
  '/brand-center/audit': '/brand/audit',
  '/brand-center/strategy': '/brand/strategy',
  '/profile': '/brand/profile',
  '/brand-audit': '/brand/audit',
  '/marketing-plan': '/brand/strategy',

  // Library redirects
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
