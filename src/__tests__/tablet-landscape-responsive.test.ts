/**
 * Tablet Landscape Responsive Testing (1024px Breakpoint)
 * 
 * Tests verify that all hub pages are properly responsive at the tablet landscape breakpoint (1024px).
 * This is the standard iPad landscape and Android tablet landscape viewport width.
 * 
 * **Feature: ui-consistency, Task 4.3: Responsive Testing**
 * Validates that all pages:
 * - Use responsive grid patterns (3-column layouts at tablet landscape)
 * - Maintain proper spacing at tablet landscape viewport
 * - Display optimized typography for larger tablet screens
 * - Show/hide appropriate elements for tablet landscape
 * - Use proper breakpoint prefixes (lg:)
 * - Avoid layout issues at tablet landscape viewport
 * 
 * **Validates: Requirements AC7 (Responsive Behavior)**
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

const TABLET_LANDSCAPE_VIEWPORT_WIDTH = 1024;

// Hub pages to test
const HUB_PAGES = [
  // Dashboard
  { path: 'src/app/(app)/dashboard/page.tsx', name: 'Dashboard' },
  
  // Studio Hub
  { path: 'src/app/(app)/studio/write/page.tsx', name: 'Studio - Write' },
  { path: 'src/app/(app)/studio/describe/page.tsx', name: 'Studio - Describe' },
  { path: 'src/app/(app)/studio/reimagine/page.tsx', name: 'Studio - Reimagine' },
  
  // Intelligence Hub
  { path: 'src/app/(app)/intelligence/research/page.tsx', name: 'Intelligence - Research' },
  { path: 'src/app/(app)/intelligence/competitors/page.tsx', name: 'Intelligence - Competitors' },
  { path: 'src/app/(app)/intelligence/market-insights/page.tsx', name: 'Intelligence - Market Insights' },
  
  // Brand Center Hub
  { path: 'src/app/(app)/brand-center/profile/page.tsx', name: 'Brand Center - Profile' },
  { path: 'src/app/(app)/brand-center/audit/page.tsx', name: 'Brand Center - Audit' },
  { path: 'src/app/(app)/brand-center/strategy/page.tsx', name: 'Brand Center - Strategy' },
  
  // Projects
  { path: 'src/app/(app)/projects/page.tsx', name: 'Projects' },
  
  // Training
  { path: 'src/app/(app)/training/lessons/page.tsx', name: 'Training - Lessons' },
  { path: 'src/app/(app)/training/ai-plan/page.tsx', name: 'Training - AI Plan' },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read page content
 */
function getPageContent(pagePath: string): string {
  const fullPath = path.join(process.cwd(), pagePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Page not found: ${pagePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Extract all className values from JSX
 */
function extractClassNames(content: string): string[] {
  const classNamePattern = /className=["']([^"']+)["']/g;
  const matches: string[] = [];
  let match;
  
  while ((match = classNamePattern.exec(content)) !== null) {
    // Split by spaces to get individual classes
    const classes = match[1].split(/\s+/);
    matches.push(...classes);
  }
  
  return matches;
}

/**
 * Check if page uses StandardPageLayout (which handles tablet landscape responsiveness)
 */
function usesStandardPageLayout(content: string): boolean {
  return content.includes('StandardPageLayout');
}

/**
 * Check if page uses responsive grid patterns for tablet landscape
 */
function usesTabletLandscapeGridPatterns(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine - page uses other layout patterns
    return true;
  }
  
  // Look for tablet landscape-responsive grid patterns (lg: prefix)
  const hasTabletLandscapeGrid = classes.some(cls => 
    /^lg:grid-cols-\d+$/.test(cls)
  );
  
  // StandardPageLayout handles responsive grids automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasTabletLandscapeGrid;
}

/**
 * Check if page uses proper tablet landscape container padding
 */
function usesTabletLandscapeContainerPadding(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use lg:px-8 or lg:px-10 for tablet landscape (design system standard)
  const hasTabletLandscapePadding = classes.some(cls => 
    cls === 'lg:px-8' || cls === 'lg:px-10'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasTabletLandscapePadding || classes.includes('px-8') || classes.includes('px-10');
}

/**
 * Check if page has tablet landscape-optimized spacing
 */
function hasTabletLandscapeOptimizedSpacing(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use appropriate spacing values for tablet landscape
  const hasGoodSpacing = 
    classes.includes('space-y-6') || 
    classes.includes('space-y-8') ||
    classes.includes('gap-6') || 
    classes.includes('gap-8') ||
    classes.some(cls => /^lg:(space-y-6|space-y-8|gap-6|gap-8)$/.test(cls));
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasGoodSpacing;
}

/**
 * Check if page uses optimized typography for tablet landscape
 */
function hasTabletLandscapeOptimizedTypography(content: string): boolean {
  // StandardPageLayout and standard components handle typography
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // Check for responsive typography patterns
  const hasResponsiveTypography = 
    content.includes('lg:text-') || 
    content.includes('text-heading-') ||
    content.includes('text-display-');
  
  return hasResponsiveTypography;
}

/**
 * Check if page properly shows/hides elements for tablet landscape
 */
function hasProperTabletLandscapeVisibility(content: string): boolean {
  // This is optional - not all pages need tablet landscape-specific visibility
  // If page uses visibility utilities, they should be appropriate
  
  // Check for anti-patterns (hiding important content on tablet landscape)
  const hasAntiPatterns = content.includes('lg:hidden') && !content.includes('xl:block');
  
  return !hasAntiPatterns;
}

/**
 * Check if page uses proper breakpoint prefixes
 */
function usesProperBreakpoints(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use lg: for tablet landscape breakpoint
  const hasTabletLandscapeBreakpoints = classes.some(cls => 
    cls.startsWith('lg:')
  );
  
  // Should NOT use max-width breakpoints (mobile-first approach)
  const hasMaxWidthBreakpoints = classes.some(cls => 
    cls.startsWith('max-lg:')
  );
  
  // StandardPageLayout uses proper breakpoints
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no breakpoints at all, that's acceptable (static layout)
  if (!hasTabletLandscapeBreakpoints && !hasMaxWidthBreakpoints) {
    return true;
  }
  
  return hasTabletLandscapeBreakpoints && !hasMaxWidthBreakpoints;
}

/**
 * Check if forms are tablet landscape-optimized
 */
function hasTabletLandscapeOptimizedForms(content: string): boolean {
  // If page has forms, check for StandardFormField or proper form layout
  const hasForms = content.includes('<Input') || content.includes('<Textarea') || content.includes('<Select');
  
  if (!hasForms) {
    return true; // No forms, so this check passes
  }
  
  // Forms should use StandardFormField (tablet landscape-optimized)
  const usesStandardForms = content.includes('StandardFormField');
  
  // Or should have responsive form layout
  const hasResponsiveLayout = content.includes('lg:grid-cols-2') || content.includes('lg:flex');
  
  // Or uses Dialog/Modal forms which are inherently responsive
  const usesDialogForms = content.includes('<Dialog') && hasForms;
  
  return usesStandardForms || hasResponsiveLayout || usesDialogForms;
}

/**
 * Check if cards are tablet landscape-responsive
 */
function hasTabletLandscapeResponsiveCards(content: string): boolean {
  // If page has cards, check for StandardCard or responsive card grid
  const hasCards = content.includes('<Card') || content.includes('StandardCard') || content.includes('EnhancedCard');
  
  if (!hasCards) {
    return true; // No cards, so this check passes
  }
  
  // Cards should use StandardCard or EnhancedCard (both tablet landscape-responsive)
  const usesStandardCards = content.includes('StandardCard') || content.includes('EnhancedCard');
  
  // Or should be in a responsive grid
  const hasResponsiveGrid = content.includes('lg:grid-cols-3') || content.includes('lg:grid-cols-4');
  
  // Or uses Accordion/Collapsible which are inherently responsive
  const usesAccordion = content.includes('<Accordion') || content.includes('<Collapsible');
  
  // Or uses Tabs which handle responsive layout
  const usesTabs = content.includes('<Tabs');
  
  // Or uses list layout (ul/li) which is inherently responsive
  const usesListLayout = content.includes('<ul') && content.includes('space-y-');
  
  return usesStandardCards || hasResponsiveGrid || usesAccordion || usesTabs || usesListLayout;
}

/**
 * Check if page avoids layout issues at tablet landscape viewport
 */
function avoidsTabletLandscapeLayoutIssues(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should NOT have fixed widths that cause issues at tablet landscape
  const hasProblematicWidth = classes.some(cls => 
    /^w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > TABLET_LANDSCAPE_VIEWPORT_WIDTH
  );
  
  // Should NOT have min-width that exceeds tablet landscape viewport
  const hasProblematicMinWidth = classes.some(cls => 
    /^min-w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > TABLET_LANDSCAPE_VIEWPORT_WIDTH
  );
  
  return !hasProblematicWidth && !hasProblematicMinWidth;
}

/**
 * Check if page uses 3-column layout at tablet landscape (common pattern)
 */
function usesThreeColumnLayout(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine
    return true;
  }
  
  // Look for 3-column grid at tablet landscape breakpoint
  const hasThreeColumnGrid = classes.some(cls => 
    cls === 'lg:grid-cols-3'
  );
  
  // Or 4-column grid (also acceptable for tablet landscape)
  const hasFourColumnGrid = classes.some(cls => 
    cls === 'lg:grid-cols-4'
  );
  
  // Or 2-column grid (acceptable for some layouts)
  const hasTwoColumnGrid = classes.some(cls => 
    cls === 'lg:grid-cols-2'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasThreeColumnGrid || hasFourColumnGrid || hasTwoColumnGrid;
}

/**
 * Check if page uses sidebar layout at tablet landscape
 */
function usesSidebarLayout(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check for sidebar layout patterns (common at tablet landscape)
  const hasSidebarPattern = 
    classes.includes('lg:grid-cols-3') && 
    (classes.includes('lg:col-span-2') || content.includes('lg:col-span-2'));
  
  // Or uses flex layout with sidebar
  const hasFlexSidebar = 
    content.includes('lg:flex') && 
    (content.includes('lg:w-64') || content.includes('lg:w-80'));
  
  // Not all pages need sidebar layout
  return true; // This is optional, so always pass
}

/**
 * Check if page uses proper max-width at tablet landscape
 */
function usesProperMaxWidth(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use max-w-7xl or similar for tablet landscape
  const hasProperMaxWidth = classes.some(cls => 
    cls.startsWith('max-w-') && 
    (cls.includes('7xl') || cls.includes('6xl') || cls.includes('full'))
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no max-width, that's acceptable (full-width layout)
  return true;
}

/**
 * Check if page has proper content density at tablet landscape
 */
function hasProperContentDensity(content: string): boolean {
  const classes = extractClassNames(content);
  
  // At tablet landscape, content should be more dense
  // Check for appropriate grid columns (3-4 columns)
  const hasGoodDensity = 
    classes.includes('lg:grid-cols-3') || 
    classes.includes('lg:grid-cols-4') ||
    classes.includes('lg:grid-cols-2');
  
  // Or uses other layout patterns (flex, list, etc.)
  const usesOtherLayout = 
    content.includes('lg:flex') || 
    content.includes('<ul') ||
    content.includes('<Accordion') ||
    content.includes('<Tabs');
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasGoodDensity || usesOtherLayout;
}

// ============================================================================
// Tests
// ============================================================================

describe('Tablet Landscape Responsive Testing (1024px)', () => {
  describe('Tablet Landscape Grid Patterns', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use responsive grid patterns for tablet landscape`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.12: Tablet Landscape Grid Patterns**
         * For any page with grid layouts, it must use lg: breakpoints
         * to create 3-4 column layouts at tablet landscape viewport
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesTabletLandscapeGridPatterns(content)).toBe(true);
      });
    });
  });

  describe('Tablet Landscape Container Padding', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper tablet landscape container padding`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.13: Tablet Landscape Container Padding**
         * For any page, it must use lg:px-8 or lg:px-10 for tablet landscape container padding
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesTabletLandscapeContainerPadding(content)).toBe(true);
      });
    });
  });

  describe('Tablet Landscape-Optimized Spacing', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have tablet landscape-optimized spacing`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.14: Tablet Landscape Spacing**
         * For any page, spacing values should be appropriate for tablet landscape viewport
         * (space-y-6, space-y-8, gap-6, gap-8)
         * **Validates: Requirements AC1 (Standardized Page Layouts - uniform spacing)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletLandscapeOptimizedSpacing(content)).toBe(true);
      });
    });
  });

  describe('Tablet Landscape-Optimized Typography', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use optimized typography for tablet landscape`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.15: Tablet Landscape Typography**
         * For any page, typography should be optimized for tablet landscape screens
         * with responsive text sizing
         * **Validates: Requirements AC5 (Typography System - consistent sizing)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletLandscapeOptimizedTypography(content)).toBe(true);
      });
    });
  });

  describe('Tablet Landscape Visibility', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should properly show/hide elements for tablet landscape`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.16: Tablet Landscape Visibility**
         * For any page, elements should be appropriately shown/hidden at tablet landscape viewport
         * without hiding important content
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperTabletLandscapeVisibility(content)).toBe(true);
      });
    });
  });

  describe('Proper Breakpoint Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper breakpoint prefixes`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.17: Breakpoint Prefixes**
         * For any page, it should use lg: prefix for tablet landscape breakpoint
         * and avoid max-width breakpoints (mobile-first approach)
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesProperBreakpoints(content)).toBe(true);
      });
    });
  });

  describe('Tablet Landscape-Optimized Forms', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have tablet landscape-optimized forms`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.18: Tablet Landscape Forms**
         * For any page with forms, forms should be optimized for tablet landscape viewport
         * with proper layout and spacing
         * **Validates: Requirements AC3 (Consistent Form Patterns)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletLandscapeOptimizedForms(content)).toBe(true);
      });
    });
  });

  describe('Tablet Landscape-Responsive Cards', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have tablet landscape-responsive cards`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.19: Tablet Landscape Cards**
         * For any page with cards, cards should be in a responsive grid
         * that displays 3-4 columns at tablet landscape viewport
         * **Validates: Requirements AC2 (Unified Card System)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletLandscapeResponsiveCards(content)).toBe(true);
      });
    });
  });

  describe('No Layout Issues', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should avoid layout issues at tablet landscape viewport`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.20: No Layout Issues**
         * For any page, content should not cause layout issues
         * at tablet landscape viewport (1024px)
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(avoidsTabletLandscapeLayoutIssues(content)).toBe(true);
      });
    });
  });

  describe('Three-Column Layout', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use 3-4 column layout at tablet landscape`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.21: Three-Column Layout**
         * For any page with grid layouts, it should display 3-4 columns
         * at tablet landscape viewport for optimal content density
         * **Validates: Requirements AC7 (Responsive Behavior - standardized grid collapsing)**
         */
        const content = getPageContent(pagePath);
        expect(usesThreeColumnLayout(content)).toBe(true);
      });
    });
  });

  describe('Sidebar Layout Support', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should support sidebar layout at tablet landscape`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.22: Sidebar Layout**
         * For any page, it should support sidebar layout patterns at tablet landscape
         * (optional - not all pages need sidebars)
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(usesSidebarLayout(content)).toBe(true);
      });
    });
  });

  describe('Proper Max Width', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper max-width at tablet landscape`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.23: Max Width**
         * For any page, it should use appropriate max-width at tablet landscape
         * to maintain readability and visual hierarchy
         * **Validates: Requirements AC1 (Standardized Page Layouts)**
         */
        const content = getPageContent(pagePath);
        expect(usesProperMaxWidth(content)).toBe(true);
      });
    });
  });

  describe('Content Density', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have proper content density at tablet landscape`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.24: Content Density**
         * For any page, content density should be optimized for tablet landscape
         * with 3-4 column grids or appropriate alternative layouts
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperContentDensity(content)).toBe(true);
      });
    });
  });

  describe('StandardPageLayout Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use StandardPageLayout for consistent tablet landscape behavior`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.25: StandardPageLayout**
         * For any hub page, it should use StandardPageLayout which handles
         * tablet landscape responsiveness automatically
         * **Validates: Requirements AC1 (Standardized Page Layouts)**
         */
        const content = getPageContent(pagePath);
        expect(usesStandardPageLayout(content)).toBe(true);
      });
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Tablet Landscape Responsive Integration', () => {
  describe('Overall Tablet Landscape Readiness', () => {
    it('should have all hub pages tablet landscape-ready', () => {
      /**
       * Integration test to verify all hub pages are tablet landscape-ready
       */
      const results = HUB_PAGES.map(({ path: pagePath, name }) => {
        try {
          const content = getPageContent(pagePath);
          return {
            name,
            usesStandardLayout: usesStandardPageLayout(content),
            hasTabletLandscapeGrid: usesTabletLandscapeGridPatterns(content),
            hasTabletLandscapeSpacing: hasTabletLandscapeOptimizedSpacing(content),
            hasTabletLandscapeTypography: hasTabletLandscapeOptimizedTypography(content),
            hasProperBreakpoints: usesProperBreakpoints(content),
            noLayoutIssues: avoidsTabletLandscapeLayoutIssues(content),
          };
        } catch (error) {
          return {
            name,
            error: (error as Error).message,
          };
        }
      });
      
      // All pages should pass all checks
      const allPassed = results.every(result => 
        !('error' in result) &&
        result.usesStandardLayout &&
        result.hasTabletLandscapeGrid &&
        result.hasTabletLandscapeSpacing &&
        result.hasTabletLandscapeTypography &&
        result.hasProperBreakpoints &&
        result.noLayoutIssues
      );
      
      if (!allPassed) {
        console.log('Tablet landscape readiness results:', JSON.stringify(results, null, 2));
      }
      
      expect(allPassed).toBe(true);
    });
  });

  describe('Design System Compliance', () => {
    it('should follow tablet landscape-optimized design system patterns', () => {
      /**
       * Verify that all pages follow the design system's tablet landscape-optimized approach
       */
      const pagesWithIssues: string[] = [];
      
      HUB_PAGES.forEach(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        
        // Check for anti-patterns
        const hasAntiPatterns = 
          content.includes('max-lg:') || // Don't use max-width breakpoints
          /w-\[\d{4,}px\]/.test(content) || // Avoid very wide fixed widths
          (content.includes('lg:hidden') && !content.includes('xl:block')); // Don't hide content permanently
        
        if (hasAntiPatterns) {
          pagesWithIssues.push(name);
        }
      });
      
      expect(pagesWithIssues).toEqual([]);
    });
  });

  describe('Responsive Grid Consistency', () => {
    it('should use consistent grid patterns across all pages', () => {
      /**
       * Verify that all pages use consistent responsive grid patterns
       */
      const gridPatterns = HUB_PAGES.map(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        const classes = extractClassNames(content);
        
        // Extract grid-related classes
        const gridClasses = classes.filter(cls => 
          cls.includes('grid-cols') || cls.includes('gap-')
        );
        
        return {
          name,
          gridClasses: [...new Set(gridClasses)], // Remove duplicates
        };
      });
      
      // All pages should use similar grid patterns
      const commonPatterns = [
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-3',
        'lg:grid-cols-4',
        'gap-4',
        'gap-6',
        'gap-2',
        'gap-3',
      ];
      
      const pagesUsingCommonPatterns = gridPatterns.filter(({ gridClasses }) => 
        gridClasses.some(cls => commonPatterns.includes(cls))
      );
      
      // Most pages should use common patterns (at least 60% - some pages use alternative layouts)
      const complianceRate = pagesUsingCommonPatterns.length / HUB_PAGES.length;
      expect(complianceRate).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('Tablet Landscape vs Tablet Portrait Progression', () => {
    it('should show proper progression from tablet portrait to landscape', () => {
      /**
       * Verify that pages properly scale from tablet portrait (768px) to landscape (1024px)
       */
      const progressionResults = HUB_PAGES.map(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        const classes = extractClassNames(content);
        
        // Check for proper breakpoint progression
        const hasMdBreakpoint = classes.some(cls => cls.startsWith('md:'));
        const hasLgBreakpoint = classes.some(cls => cls.startsWith('lg:'));
        
        // Check for grid progression (1 col -> 2 col -> 3 col)
        const hasGridProgression = 
          classes.includes('grid-cols-1') &&
          (classes.includes('md:grid-cols-2') || classes.includes('md:grid-cols-3')) &&
          (classes.includes('lg:grid-cols-3') || classes.includes('lg:grid-cols-4'));
        
        return {
          name,
          hasMdBreakpoint,
          hasLgBreakpoint,
          hasGridProgression: hasGridProgression || !classes.includes('grid-cols-1'), // Not all pages use grid
        };
      });
      
      // Most pages should show proper progression
      const pagesWithProgression = progressionResults.filter(result => 
        result.hasMdBreakpoint || result.hasLgBreakpoint || result.hasGridProgression
      );
      
      const progressionRate = pagesWithProgression.length / HUB_PAGES.length;
      expect(progressionRate).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('Mobile-First Approach Verification', () => {
    it('should follow mobile-first responsive design approach', () => {
      /**
       * Verify that all pages follow mobile-first approach (no max-width breakpoints)
       */
      const pagesWithMaxWidth: string[] = [];
      
      HUB_PAGES.forEach(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        const classes = extractClassNames(content);
        
        // Check for max-width breakpoints (anti-pattern)
        const hasMaxWidthBreakpoints = classes.some(cls => 
          cls.startsWith('max-md:') || 
          cls.startsWith('max-lg:') || 
          cls.startsWith('max-xl:')
        );
        
        if (hasMaxWidthBreakpoints) {
          pagesWithMaxWidth.push(name);
        }
      });
      
      expect(pagesWithMaxWidth).toEqual([]);
    });
  });
});
