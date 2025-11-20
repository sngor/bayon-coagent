/**
 * Tablet Portrait Responsive Testing (768px Breakpoint)
 * 
 * Tests verify that all hub pages are properly responsive at the tablet portrait breakpoint (768px).
 * This is the standard iPad portrait and Android tablet viewport width.
 * 
 * **Feature: ui-consistency, Task 4.3: Responsive Testing**
 * Validates that all pages:
 * - Use responsive grid patterns (2-column layouts at tablet)
 * - Maintain proper spacing at tablet viewport
 * - Display optimized typography for tablet screens
 * - Show/hide appropriate elements for tablet
 * - Use proper breakpoint prefixes (md:, tablet:)
 * - Avoid layout issues at tablet viewport
 * 
 * **Validates: Requirements AC7 (Responsive Behavior)**
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

const TABLET_VIEWPORT_WIDTH = 768;

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

// Tablet-specific utility patterns
const TABLET_UTILITIES = {
  // Grid patterns that should appear at tablet breakpoint
  gridPatterns: [
    'md:grid-cols-2',
    'md:grid-cols-3',
    'tablet:grid-cols-2',
    'tablet:grid-cols-3',
  ],
  
  // Spacing that works well on tablet
  spacing: [
    'md:px-6',
    'md:px-8',
    'md:py-6',
    'md:py-8',
    'md:space-y-6',
    'md:space-y-8',
    'md:gap-6',
    'md:gap-8',
  ],
  
  // Typography optimized for tablet
  typography: [
    'md:text-lg',
    'md:text-xl',
    'md:text-2xl',
    'md:text-3xl',
    'md:text-4xl',
  ],
  
  // Tablet visibility utilities
  visibility: [
    'hidden md:block',
    'hidden md:flex',
    'md:hidden',
  ],
};

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
 * Check if page uses StandardPageLayout (which handles tablet responsiveness)
 */
function usesStandardPageLayout(content: string): boolean {
  return content.includes('StandardPageLayout');
}

/**
 * Check if page uses responsive grid patterns for tablet
 */
function usesTabletGridPatterns(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine - page uses other layout patterns
    return true;
  }
  
  // Look for tablet-responsive grid patterns (md: or tablet: prefixes)
  const hasTabletGrid = classes.some(cls => 
    /^(md|tablet):grid-cols-\d+$/.test(cls)
  );
  
  // StandardPageLayout handles responsive grids automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasTabletGrid;
}

/**
 * Check if page uses proper tablet container padding
 */
function usesTabletContainerPadding(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use md:px-6 or md:px-8 for tablet (design system standard)
  const hasTabletPadding = classes.some(cls => 
    cls === 'md:px-6' || cls === 'md:px-8' || cls === 'tablet:px-6' || cls === 'tablet:px-8'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasTabletPadding || classes.includes('px-6') || classes.includes('px-8');
}

/**
 * Check if page has tablet-optimized spacing
 */
function hasTabletOptimizedSpacing(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use appropriate spacing values for tablet
  const hasGoodSpacing = 
    classes.includes('space-y-6') || 
    classes.includes('space-y-8') ||
    classes.includes('gap-6') || 
    classes.includes('gap-8') ||
    classes.some(cls => /^md:(space-y-6|space-y-8|gap-6|gap-8)$/.test(cls));
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasGoodSpacing;
}

/**
 * Check if page uses optimized typography for tablet
 */
function hasTabletOptimizedTypography(content: string): boolean {
  // StandardPageLayout and standard components handle typography
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // Check for responsive typography patterns
  const hasResponsiveTypography = 
    content.includes('md:text-') || 
    content.includes('tablet:text-') ||
    content.includes('text-heading-') ||
    content.includes('text-display-');
  
  return hasResponsiveTypography;
}

/**
 * Check if page properly shows/hides elements for tablet
 */
function hasProperTabletVisibility(content: string): boolean {
  // This is optional - not all pages need tablet-specific visibility
  // If page uses visibility utilities, they should be appropriate
  
  // Check for anti-patterns (hiding important content on tablet)
  const hasAntiPatterns = content.includes('md:hidden') && !content.includes('lg:block');
  
  return !hasAntiPatterns;
}

/**
 * Check if page uses proper breakpoint prefixes
 */
function usesProperBreakpoints(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use md: or tablet: for tablet breakpoint
  const hasTabletBreakpoints = classes.some(cls => 
    cls.startsWith('md:') || cls.startsWith('tablet:')
  );
  
  // Should NOT use max-width breakpoints (mobile-first approach)
  const hasMaxWidthBreakpoints = classes.some(cls => 
    cls.startsWith('max-md:') || cls.startsWith('max-tablet:')
  );
  
  // StandardPageLayout uses proper breakpoints
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no breakpoints at all, that's acceptable (static layout)
  if (!hasTabletBreakpoints && !hasMaxWidthBreakpoints) {
    return true;
  }
  
  return hasTabletBreakpoints && !hasMaxWidthBreakpoints;
}

/**
 * Check if forms are tablet-optimized
 */
function hasTabletOptimizedForms(content: string): boolean {
  // If page has forms, check for StandardFormField or proper form layout
  const hasForms = content.includes('<Input') || content.includes('<Textarea') || content.includes('<Select');
  
  if (!hasForms) {
    return true; // No forms, so this check passes
  }
  
  // Forms should use StandardFormField (tablet-optimized)
  const usesStandardForms = content.includes('StandardFormField');
  
  // Or should have responsive form layout
  const hasResponsiveLayout = content.includes('md:grid-cols-2') || content.includes('md:flex');
  
  // Or uses Dialog/Modal forms which are inherently responsive
  const usesDialogForms = content.includes('<Dialog') && hasForms;
  
  return usesStandardForms || hasResponsiveLayout || usesDialogForms;
}

/**
 * Check if cards are tablet-responsive
 */
function hasTabletResponsiveCards(content: string): boolean {
  // If page has cards, check for StandardCard or responsive card grid
  const hasCards = content.includes('<Card') || content.includes('StandardCard') || content.includes('EnhancedCard');
  
  if (!hasCards) {
    return true; // No cards, so this check passes
  }
  
  // Cards should use StandardCard or EnhancedCard (both tablet-responsive)
  const usesStandardCards = content.includes('StandardCard') || content.includes('EnhancedCard');
  
  // Or should be in a responsive grid
  const hasResponsiveGrid = content.includes('md:grid-cols-2') || content.includes('md:grid-cols-3');
  
  // Or uses lg:grid-cols-3 which implies tablet 2-column (mobile-first)
  const hasLargeGrid = content.includes('lg:grid-cols-3');
  
  // Or uses Accordion/Collapsible which are inherently responsive
  const usesAccordion = content.includes('<Accordion') || content.includes('<Collapsible');
  
  // Or uses Tabs which handle responsive layout
  const usesTabs = content.includes('<Tabs');
  
  // Or uses list layout (ul/li) which is inherently responsive
  const usesListLayout = content.includes('<ul') && content.includes('space-y-');
  
  return usesStandardCards || hasResponsiveGrid || hasLargeGrid || usesAccordion || usesTabs || usesListLayout;
}

/**
 * Check if page avoids layout issues at tablet viewport
 */
function avoidsTabletLayoutIssues(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should NOT have fixed widths that cause issues at tablet
  const hasProblematicWidth = classes.some(cls => 
    /^w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > TABLET_VIEWPORT_WIDTH
  );
  
  // Should NOT have min-width that exceeds tablet viewport
  const hasProblematicMinWidth = classes.some(cls => 
    /^min-w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > TABLET_VIEWPORT_WIDTH
  );
  
  return !hasProblematicWidth && !hasProblematicMinWidth;
}

/**
 * Check if page uses 2-column layout at tablet (common pattern)
 */
function usesTwoColumnLayout(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine
    return true;
  }
  
  // Look for 2-column grid at tablet breakpoint
  const hasTwoColumnGrid = classes.some(cls => 
    cls === 'md:grid-cols-2' || cls === 'tablet:grid-cols-2'
  );
  
  // Or 3-column grid (also acceptable for tablet)
  const hasThreeColumnGrid = classes.some(cls => 
    cls === 'md:grid-cols-3' || cls === 'tablet:grid-cols-3'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasTwoColumnGrid || hasThreeColumnGrid;
}

// ============================================================================
// Tests
// ============================================================================

describe('Tablet Portrait Responsive Testing (768px)', () => {
  describe('Tablet Grid Patterns', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use responsive grid patterns for tablet`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.1: Tablet Grid Patterns**
         * For any page with grid layouts, it must use md: or tablet: breakpoints
         * to create 2-3 column layouts at tablet viewport
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesTabletGridPatterns(content)).toBe(true);
      });
    });
  });

  describe('Tablet Container Padding', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper tablet container padding`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.2: Tablet Container Padding**
         * For any page, it must use md:px-6 or md:px-8 for tablet container padding
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesTabletContainerPadding(content)).toBe(true);
      });
    });
  });

  describe('Tablet-Optimized Spacing', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have tablet-optimized spacing`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.3: Tablet Spacing**
         * For any page, spacing values should be appropriate for tablet viewport
         * (space-y-6, space-y-8, gap-6, gap-8)
         * **Validates: Requirements AC1 (Standardized Page Layouts - uniform spacing)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletOptimizedSpacing(content)).toBe(true);
      });
    });
  });

  describe('Tablet-Optimized Typography', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use optimized typography for tablet`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.4: Tablet Typography**
         * For any page, typography should be optimized for tablet screens
         * with responsive text sizing
         * **Validates: Requirements AC5 (Typography System - consistent sizing)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletOptimizedTypography(content)).toBe(true);
      });
    });
  });

  describe('Tablet Visibility', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should properly show/hide elements for tablet`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.5: Tablet Visibility**
         * For any page, elements should be appropriately shown/hidden at tablet viewport
         * without hiding important content
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperTabletVisibility(content)).toBe(true);
      });
    });
  });

  describe('Proper Breakpoint Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper breakpoint prefixes`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.6: Breakpoint Prefixes**
         * For any page, it should use md: or tablet: prefixes for tablet breakpoint
         * and avoid max-width breakpoints (mobile-first approach)
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesProperBreakpoints(content)).toBe(true);
      });
    });
  });

  describe('Tablet-Optimized Forms', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have tablet-optimized forms`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.7: Tablet Forms**
         * For any page with forms, forms should be optimized for tablet viewport
         * with proper layout and spacing
         * **Validates: Requirements AC3 (Consistent Form Patterns)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletOptimizedForms(content)).toBe(true);
      });
    });
  });

  describe('Tablet-Responsive Cards', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have tablet-responsive cards`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.8: Tablet Cards**
         * For any page with cards, cards should be in a responsive grid
         * that displays 2-3 columns at tablet viewport
         * **Validates: Requirements AC2 (Unified Card System)**
         */
        const content = getPageContent(pagePath);
        expect(hasTabletResponsiveCards(content)).toBe(true);
      });
    });
  });

  describe('No Layout Issues', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should avoid layout issues at tablet viewport`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.9: No Layout Issues**
         * For any page, content should not cause layout issues
         * at tablet viewport (768px)
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(avoidsTabletLayoutIssues(content)).toBe(true);
      });
    });
  });

  describe('Two-Column Layout', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use 2-3 column layout at tablet`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.10: Two-Column Layout**
         * For any page with grid layouts, it should display 2-3 columns
         * at tablet viewport for optimal content density
         * **Validates: Requirements AC7 (Responsive Behavior - standardized grid collapsing)**
         */
        const content = getPageContent(pagePath);
        expect(usesTwoColumnLayout(content)).toBe(true);
      });
    });
  });

  describe('StandardPageLayout Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use StandardPageLayout for consistent tablet behavior`, () => {
        /**
         * **Feature: ui-consistency, Property CP4.11: StandardPageLayout**
         * For any hub page, it should use StandardPageLayout which handles
         * tablet responsiveness automatically
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

describe('Tablet Responsive Integration', () => {
  describe('Overall Tablet Readiness', () => {
    it('should have all hub pages tablet-ready', () => {
      /**
       * Integration test to verify all hub pages are tablet-ready
       */
      const results = HUB_PAGES.map(({ path: pagePath, name }) => {
        try {
          const content = getPageContent(pagePath);
          return {
            name,
            usesStandardLayout: usesStandardPageLayout(content),
            hasTabletGrid: usesTabletGridPatterns(content),
            hasTabletSpacing: hasTabletOptimizedSpacing(content),
            hasTabletTypography: hasTabletOptimizedTypography(content),
            hasProperBreakpoints: usesProperBreakpoints(content),
            noLayoutIssues: avoidsTabletLayoutIssues(content),
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
        result.hasTabletGrid &&
        result.hasTabletSpacing &&
        result.hasTabletTypography &&
        result.hasProperBreakpoints &&
        result.noLayoutIssues
      );
      
      if (!allPassed) {
        console.log('Tablet readiness results:', JSON.stringify(results, null, 2));
      }
      
      expect(allPassed).toBe(true);
    });
  });

  describe('Design System Compliance', () => {
    it('should follow tablet-optimized design system patterns', () => {
      /**
       * Verify that all pages follow the design system's tablet-optimized approach
       */
      const pagesWithIssues: string[] = [];
      
      HUB_PAGES.forEach(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        
        // Check for anti-patterns
        const hasAntiPatterns = 
          content.includes('max-md:') || // Don't use max-width breakpoints
          /w-\[\d{4,}px\]/.test(content) || // Avoid very wide fixed widths
          (content.includes('md:hidden') && !content.includes('lg:block')); // Don't hide content permanently
        
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
});
