/**
 * URL redirect mapping for feature consolidation
 * Maps old URLs to new hub-based structure
 */

export const REDIRECT_MAP: Record<string, string> = {
  // Studio Hub
  '/content-engine': '/studio/write',
  '/listing-description-generator': '/studio/describe',
  '/reimagine': '/studio/reimagine',

  // Intelligence Hub
  '/research-agent': '/intelligence/research',
  '/knowledge-base': '/intelligence/research?tab=saved',
  '/competitive-analysis': '/intelligence/competitors',
  '/investment-opportunity-identification': '/intelligence/market-insights?tool=investment',
  '/life-event-predictor': '/intelligence/market-insights?tool=life-events',

  // Brand Center Hub
  '/profile': '/brand-center/profile',
  '/brand-audit': '/brand-center/audit',
  '/marketing-plan': '/brand-center/strategy',

  // Training (simple rename)
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
