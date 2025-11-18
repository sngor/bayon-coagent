/**
 * Tablet Optimization Utilities
 * 
 * Utilities for optimizing layouts and interactions for tablet viewports (768px - 1024px)
 * Requirements: 4.2, 4.4
 */

/**
 * Tablet viewport range
 */
export const TABLET_MIN_WIDTH = 768;
export const TABLET_MAX_WIDTH = 1024;

/**
 * Check if current viewport is tablet size
 */
export function isTabletViewport(): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH;
}

/**
 * Check if device is in portrait orientation
 */
export function isPortraitOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
}

/**
 * Check if device is in landscape orientation
 */
export function isLandscapeOrientation(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * Get optimal column count for tablet viewport based on orientation
 */
export function getTabletColumnCount(
  portraitColumns: number = 2,
  landscapeColumns: number = 3
): number {
  if (!isTabletViewport()) {
    return 1; // Default for non-tablet
  }
  return isPortraitOrientation() ? portraitColumns : landscapeColumns;
}

/**
 * Audit tablet responsiveness
 */
export function auditTabletResponsiveness(): {
  issues: string[];
  warnings: string[];
  passed: boolean;
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (typeof window === 'undefined') {
    return { issues: ['Cannot audit: window is undefined'], warnings: [], passed: false };
  }

  const width = window.innerWidth;
  const isTablet = width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH;

  // Check for horizontal scrolling
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
    issues.push('Horizontal scrolling detected - content overflows viewport');
  }

  // Check for tablet-specific optimizations
  if (isTablet) {
    // Check if layouts are using tablet breakpoints
    const hasTabletClasses = document.querySelector('[class*="tablet:"]');
    if (!hasTabletClasses) {
      warnings.push('No tablet-specific classes found - layouts may not be optimized for tablet viewports');
    }

    // Check for orientation-aware layouts
    const hasOrientationClasses = document.querySelector('[class*="tablet-portrait:"], [class*="tablet-landscape:"]');
    if (!hasOrientationClasses) {
      warnings.push('No orientation-specific classes found - layouts may not adapt to orientation changes');
    }

    // Check for smooth transitions
    const hasOrientationTransition = document.querySelector('.orientation-transition');
    if (!hasOrientationTransition) {
      warnings.push('No orientation-transition classes found - orientation changes may not be smooth');
    }
  }

  // Check grid layouts
  const grids = document.querySelectorAll('[class*="grid-cols"]');
  if (grids.length > 0 && isTablet) {
    let hasAdaptiveGrid = false;
    grids.forEach((grid) => {
      const classes = grid.className;
      if (classes.includes('tablet:grid-cols') || classes.includes('md:grid-cols')) {
        hasAdaptiveGrid = true;
      }
    });
    if (!hasAdaptiveGrid) {
      warnings.push('Grid layouts may not be optimized for tablet viewports');
    }
  }

  const passed = issues.length === 0;

  return { issues, warnings, passed };
}

/**
 * Get recommended grid columns for different content types on tablet
 */
export function getRecommendedTabletGrid(contentType: 'cards' | 'metrics' | 'list' | 'dashboard'): {
  portrait: string;
  landscape: string;
} {
  const recommendations = {
    cards: {
      portrait: 'tablet-portrait:grid-cols-2',
      landscape: 'tablet-landscape:grid-cols-3',
    },
    metrics: {
      portrait: 'tablet-portrait:grid-cols-2',
      landscape: 'tablet-landscape:grid-cols-3',
    },
    list: {
      portrait: 'tablet-portrait:grid-cols-1',
      landscape: 'tablet-landscape:grid-cols-2',
    },
    dashboard: {
      portrait: 'tablet-portrait:grid-cols-1',
      landscape: 'tablet-landscape:grid-cols-3',
    },
  };

  return recommendations[contentType];
}

/**
 * Calculate optimal spacing for tablet viewport
 */
export function getTabletSpacing(baseSpacing: number = 16): {
  gap: number;
  padding: number;
} {
  if (!isTabletViewport()) {
    return { gap: baseSpacing, padding: baseSpacing };
  }

  // Slightly increase spacing on tablet for better visual hierarchy
  const multiplier = isLandscapeOrientation() ? 1.25 : 1.15;

  return {
    gap: Math.round(baseSpacing * multiplier),
    padding: Math.round(baseSpacing * multiplier),
  };
}

/**
 * Get CSS classes for tablet-optimized layouts
 */
export function getTabletLayoutClasses(layoutType: 'sidebar' | 'grid' | 'stack'): string {
  const baseClasses = 'orientation-transition';

  const layouts = {
    sidebar: `${baseClasses} grid grid-cols-1 tablet:grid-cols-3 lg:grid-cols-3 gap-6 tablet:gap-8`,
    grid: `${baseClasses} grid grid-cols-1 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-3 lg:grid-cols-4 gap-4 tablet:gap-6`,
    stack: `${baseClasses} flex flex-col tablet-landscape:flex-row gap-4 tablet:gap-6`,
  };

  return layouts[layoutType];
}

/**
 * Monitor orientation changes and execute callback
 */
export function onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOrientationChange = () => {
    const orientation = isPortraitOrientation() ? 'portrait' : 'landscape';
    callback(orientation);
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  // Call immediately to set initial state
  handleOrientationChange();

  // Return cleanup function
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
}
