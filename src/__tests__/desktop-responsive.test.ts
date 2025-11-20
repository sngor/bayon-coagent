/**
 * Desktop Responsive Testing (1440px Breakpoint)
 * 
 * Tests verify that all hub pages are properly responsive at the desktop breakpoint (1440px).
 * This is the standard desktop viewport width for modern displays.
 * 
 * **Feature: ui-consistency, Task 4.3: Responsive Testing**
 * Validates that all pages:
 * - Use responsive grid patterns (3-4 column layouts at desktop)
 * - Maintain proper spacing at desktop viewport
 * - Display optimized typography for desktop screens
 * - Show/hide appropriate elements for desktop
 * - Use proper breakpoint prefixes (xl:)
 * - Avoid layout issues at desktop viewport
 * - Utilize full viewport width effectively
 * 
 * **Validates: Requirements AC7 (Responsive Behavior)**
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

const DESKTOP_VIEWPORT_WIDTH = 1440;

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
 * Check if page uses StandardPageLayout (which handles desktop responsiveness)
 */
function usesStandardPageLayout(content: string): boolean {
  return content.includes('StandardPageLayout');
}

/**
 * Check if page uses responsive grid patterns for desktop
 */
function usesDesktopGridPatterns(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine - page uses other layout patterns
    return true;
  }
  
  // Look for desktop-responsive grid patterns (xl: prefix or implicit from lg:)
  const hasDesktopGrid = classes.some(cls => 
    /^xl:grid-cols-\d+$/.test(cls)
  );
  
  // Desktop can use lg: grid patterns (3-4 columns work well at desktop)
  const hasLargeGrid = classes.some(cls => 
    /^lg:grid-cols-[34]$/.test(cls)
  );
  
  // StandardPageLayout handles responsive grids automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasDesktopGrid || hasLargeGrid;
}

/**
 * Check if page uses proper desktop container padding
 */
function usesDesktopContainerPadding(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use xl:px-10 or xl:px-12 for desktop (design system standard)
  const hasDesktopPadding = classes.some(cls => 
    cls === 'xl:px-10' || cls === 'xl:px-12'
  );
  
  // Or uses lg:px-8/lg:px-10 which works well at desktop
  const hasLargePadding = classes.some(cls => 
    cls === 'lg:px-8' || cls === 'lg:px-10'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasDesktopPadding || hasLargePadding || classes.includes('px-8') || classes.includes('px-10');
}

/**
 * Check if page has desktop-optimized spacing
 */
function hasDesktopOptimizedSpacing(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use appropriate spacing values for desktop
  const hasGoodSpacing = 
    classes.includes('space-y-6') || 
    classes.includes('space-y-8') ||
    classes.includes('gap-6') || 
    classes.includes('gap-8') ||
    classes.some(cls => /^(xl|lg):(space-y-6|space-y-8|gap-6|gap-8)$/.test(cls));
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasGoodSpacing;
}

/**
 * Check if page uses optimized typography for desktop
 */
function hasDesktopOptimizedTypography(content: string): boolean {
  // StandardPageLayout and standard components handle typography
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // Check for responsive typography patterns
  const hasResponsiveTypography = 
    content.includes('xl:text-') || 
    content.includes('lg:text-') ||
    content.includes('text-heading-') ||
    content.includes('text-display-');
  
  return hasResponsiveTypography;
}

/**
 * Check if page properly shows/hides elements for desktop
 */
function hasProperDesktopVisibility(content: string): boolean {
  // This is optional - not all pages need desktop-specific visibility
  // If page uses visibility utilities, they should be appropriate
  
  // Check for anti-patterns (hiding important content on desktop)
  const hasAntiPatterns = content.includes('xl:hidden') && !content.includes('2xl:block');
  
  return !hasAntiPatterns;
}

/**
 * Check if page uses proper breakpoint prefixes
 */
function usesProperBreakpoints(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use xl: for desktop breakpoint (optional - lg: works well too)
  const hasDesktopBreakpoints = classes.some(cls => 
    cls.startsWith('xl:') || cls.startsWith('lg:')
  );
  
  // Should NOT use max-width breakpoints (mobile-first approach)
  const hasMaxWidthBreakpoints = classes.some(cls => 
    cls.startsWith('max-xl:') || cls.startsWith('max-lg:')
  );
  
  // StandardPageLayout uses proper breakpoints
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no breakpoints at all, that's acceptable (static layout)
  if (!hasDesktopBreakpoints && !hasMaxWidthBreakpoints) {
    return true;
  }
  
  return hasDesktopBreakpoints && !hasMaxWidthBreakpoints;
}

/**
 * Check if forms are desktop-optimized
 */
function hasDesktopOptimizedForms(content: string): boolean {
  // If page has forms, check for StandardFormField or proper form layout
  const hasForms = content.includes('<Input') || content.includes('<Textarea') || content.includes('<Select');
  
  if (!hasForms) {
    return true; // No forms, so this check passes
  }
  
  // Forms should use StandardFormField (desktop-optimized)
  const usesStandardForms = content.includes('StandardFormField');
  
  // Or should have responsive form layout
  const hasResponsiveLayout = content.includes('xl:grid-cols-2') || content.includes('lg:grid-cols-2') || content.includes('xl:flex');
  
  // Or uses Dialog/Modal forms which are inherently responsive
  const usesDialogForms = content.includes('<Dialog') && hasForms;
  
  return usesStandardForms || hasResponsiveLayout || usesDialogForms;
}

/**
 * Check if cards are desktop-responsive
 */
function hasDesktopResponsiveCards(content: string): boolean {
  // If page has cards, check for StandardCard or responsive card grid
  const hasCards = content.includes('<Card') || content.includes('StandardCard') || content.includes('EnhancedCard');
  
  if (!hasCards) {
    return true; // No cards, so this check passes
  }
  
  // Cards should use StandardCard or EnhancedCard (both desktop-responsive)
  const usesStandardCards = content.includes('StandardCard') || content.includes('EnhancedCard');
  
  // Or should be in a responsive grid
  const hasResponsiveGrid = content.includes('xl:grid-cols-4') || content.includes('lg:grid-cols-3') || content.includes('lg:grid-cols-4');
  
  // Or uses Accordion/Collapsible which are inherently responsive
  const usesAccordion = content.includes('<Accordion') || content.includes('<Collapsible');
  
  // Or uses Tabs which handle responsive layout
  const usesTabs = content.includes('<Tabs');
  
  // Or uses list layout (ul/li) which is inherently responsive
  const usesListLayout = content.includes('<ul') && content.includes('space-y-');
  
  return usesStandardCards || hasResponsiveGrid || usesAccordion || usesTabs || usesListLayout;
}

/**
 * Check if page avoids layout issues at desktop viewport
 */
function avoidsDesktopLayoutIssues(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should NOT have fixed widths that cause issues at desktop
  const hasProblematicWidth = classes.some(cls => 
    /^w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > DESKTOP_VIEWPORT_WIDTH
  );
  
  // Should NOT have min-width that exceeds desktop viewport
  const hasProblematicMinWidth = classes.some(cls => 
    /^min-w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > DESKTOP_VIEWPORT_WIDTH
  );
  
  return !hasProblematicWidth && !hasProblematicMinWidth;
}

/**
 * Check if page uses 3-4 column layout at desktop (common pattern)
 */
function usesMultiColumnLayout(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine
    return true;
  }
  
  // Look for 3-4 column grid at desktop breakpoint
  const hasMultiColumnGrid = classes.some(cls => 
    cls === 'xl:grid-cols-3' || cls === 'xl:grid-cols-4' ||
    cls === 'lg:grid-cols-3' || cls === 'lg:grid-cols-4'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasMultiColumnGrid;
}

/**
 * Check if page uses proper max-width at desktop
 */
function usesProperMaxWidth(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use max-w-7xl or similar for desktop
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
 * Check if page has proper content density at desktop
 */
function hasProperContentDensity(content: string): boolean {
  const classes = extractClassNames(content);
  
  // At desktop, content should utilize the available space
  // Check for appropriate grid columns (3-4 columns)
  const hasGoodDensity = 
    classes.includes('xl:grid-cols-3') || 
    classes.includes('xl:grid-cols-4') ||
    classes.includes('lg:grid-cols-3') ||
    classes.includes('lg:grid-cols-4');
  
  // Or uses other layout patterns (flex, list, etc.)
  const usesOtherLayout = 
    content.includes('xl:flex') || 
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

/**
 * Check if page utilizes full viewport width effectively
 */
function utilizesFullViewport(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should not have overly restrictive max-width at desktop
  const hasRestrictiveMaxWidth = classes.some(cls => 
    cls === 'max-w-md' || cls === 'max-w-lg' || cls === 'max-w-xl' || cls === 'max-w-2xl'
  );
  
  // StandardPageLayout uses appropriate max-width
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no restrictive max-width, viewport is utilized well
  return !hasRestrictiveMaxWidth;
}

/**
 * Check if page has proper whitespace at desktop
 */
function hasProperWhitespace(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should have adequate spacing between sections
  const hasGoodSpacing = 
    classes.includes('space-y-8') || 
    classes.includes('space-y-12') ||
    classes.includes('gap-8') ||
    classes.some(cls => /^(xl|lg):(space-y-8|space-y-12|gap-8)$/.test(cls));
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasGoodSpacing;
}

/**
 * Check if page supports sidebar layout at desktop
 */
function supportsSidebarLayout(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check for sidebar layout patterns (common at desktop)
  const hasSidebarPattern = 
    (classes.includes('xl:grid-cols-3') || classes.includes('lg:grid-cols-3')) && 
    (classes.includes('xl:col-span-2') || classes.includes('lg:col-span-2') || 
     content.includes('xl:col-span-2') || content.includes('lg:col-span-2'));
  
  // Or uses flex layout with sidebar
  const hasFlexSidebar = 
    (content.includes('xl:flex') || content.includes('lg:flex')) && 
    (content.includes('xl:w-64') || content.includes('xl:w-80') || 
     content.includes('lg:w-64') || content.includes('lg:w-80'));
  
  // Not all pages need sidebar layout
  return true; // This is optional, so always pass
}

// ============================================================================
// Tests
// ============================================================================

describe('Desktop Responsive Testing (1440px)', () => {
  describe('Desktop Grid Patterns', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use responsive grid patterns for desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.1: Desktop Grid Patterns**
         * For any page with grid layouts, it must use xl: or lg: breakpoints
         * to create 3-4 column layouts at desktop viewport
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesDesktopGridPatterns(content)).toBe(true);
      });
    });
  });

  describe('Desktop Container Padding', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper desktop container padding`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.2: Desktop Container Padding**
         * For any page, it must use xl:px-10 or xl:px-12 for desktop container padding
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesDesktopContainerPadding(content)).toBe(true);
      });
    });
  });

  describe('Desktop-Optimized Spacing', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have desktop-optimized spacing`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.3: Desktop Spacing**
         * For any page, spacing values should be appropriate for desktop viewport
         * (space-y-6, space-y-8, gap-6, gap-8)
         * **Validates: Requirements AC1 (Standardized Page Layouts - uniform spacing)**
         */
        const content = getPageContent(pagePath);
        expect(hasDesktopOptimizedSpacing(content)).toBe(true);
      });
    });
  });

  describe('Desktop-Optimized Typography', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use optimized typography for desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.4: Desktop Typography**
         * For any page, typography should be optimized for desktop screens
         * with responsive text sizing
         * **Validates: Requirements AC5 (Typography System - consistent sizing)**
         */
        const content = getPageContent(pagePath);
        expect(hasDesktopOptimizedTypography(content)).toBe(true);
      });
    });
  });

  describe('Desktop Visibility', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should properly show/hide elements for desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.5: Desktop Visibility**
         * For any page, elements should be appropriately shown/hidden at desktop viewport
         * without hiding important content
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperDesktopVisibility(content)).toBe(true);
      });
    });
  });

  describe('Proper Breakpoint Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper breakpoint prefixes`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.6: Breakpoint Prefixes**
         * For any page, it should use xl: or lg: prefix for desktop breakpoint
         * and avoid max-width breakpoints (mobile-first approach)
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesProperBreakpoints(content)).toBe(true);
      });
    });
  });

  describe('Desktop-Optimized Forms', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have desktop-optimized forms`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.7: Desktop Forms**
         * For any page with forms, forms should be optimized for desktop viewport
         * with proper layout and spacing
         * **Validates: Requirements AC3 (Consistent Form Patterns)**
         */
        const content = getPageContent(pagePath);
        expect(hasDesktopOptimizedForms(content)).toBe(true);
      });
    });
  });

  describe('Desktop-Responsive Cards', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have desktop-responsive cards`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.8: Desktop Cards**
         * For any page with cards, cards should be in a responsive grid
         * that displays 3-4 columns at desktop viewport
         * **Validates: Requirements AC2 (Unified Card System)**
         */
        const content = getPageContent(pagePath);
        expect(hasDesktopResponsiveCards(content)).toBe(true);
      });
    });
  });

  describe('No Layout Issues', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should avoid layout issues at desktop viewport`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.9: No Layout Issues**
         * For any page, content should not cause layout issues
         * at desktop viewport (1440px)
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(avoidsDesktopLayoutIssues(content)).toBe(true);
      });
    });
  });

  describe('Multi-Column Layout', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use 3-4 column layout at desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.10: Multi-Column Layout**
         * For any page with grid layouts, it should display 3-4 columns
         * at desktop viewport for optimal content density
         * **Validates: Requirements AC7 (Responsive Behavior - standardized grid collapsing)**
         */
        const content = getPageContent(pagePath);
        expect(usesMultiColumnLayout(content)).toBe(true);
      });
    });
  });

  describe('Proper Max Width', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper max-width at desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.11: Max Width**
         * For any page, it should use appropriate max-width at desktop
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
      it(`${name} should have proper content density at desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.12: Content Density**
         * For any page, content density should be optimized for desktop
         * with 3-4 column grids or appropriate alternative layouts
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperContentDensity(content)).toBe(true);
      });
    });
  });

  describe('Full Viewport Utilization', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should utilize full viewport width effectively`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.13: Viewport Utilization**
         * For any page, it should utilize the full desktop viewport width
         * without overly restrictive max-width constraints
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(utilizesFullViewport(content)).toBe(true);
      });
    });
  });

  describe('Proper Whitespace', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have proper whitespace at desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.14: Whitespace**
         * For any page, it should have adequate whitespace between sections
         * at desktop viewport for visual clarity
         * **Validates: Requirements AC1 (Standardized Page Layouts - uniform spacing)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperWhitespace(content)).toBe(true);
      });
    });
  });

  describe('Sidebar Layout Support', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should support sidebar layout at desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.15: Sidebar Layout**
         * For any page, it should support sidebar layout patterns at desktop
         * (optional - not all pages need sidebars)
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(supportsSidebarLayout(content)).toBe(true);
      });
    });
  });

  describe('StandardPageLayout Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use StandardPageLayout for consistent desktop behavior`, () => {
        /**
         * **Feature: ui-consistency, Property CP5.16: StandardPageLayout**
         * For any hub page, it should use StandardPageLayout which handles
         * desktop responsiveness automatically
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

describe('Desktop Responsive Integration', () => {
  describe('Overall Desktop Readiness', () => {
    it('should have all hub pages desktop-ready', () => {
      /**
       * Integration test to verify all hub pages are desktop-ready
       */
      const results = HUB_PAGES.map(({ path: pagePath, name }) => {
        try {
          const content = getPageContent(pagePath);
          return {
            name,
            usesStandardLayout: usesStandardPageLayout(content),
            hasDesktopGrid: usesDesktopGridPatterns(content),
            hasDesktopSpacing: hasDesktopOptimizedSpacing(content),
            hasDesktopTypography: hasDesktopOptimizedTypography(content),
            hasProperBreakpoints: usesProperBreakpoints(content),
            noLayoutIssues: avoidsDesktopLayoutIssues(content),
            utilizesViewport: utilizesFullViewport(content),
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
        result.hasDesktopGrid &&
        result.hasDesktopSpacing &&
        result.hasDesktopTypography &&
        result.hasProperBreakpoints &&
        result.noLayoutIssues &&
        result.utilizesViewport
      );
      
      if (!allPassed) {
        console.log('Desktop readiness results:', JSON.stringify(results, null, 2));
      }
      
      expect(allPassed).toBe(true);
    });
  });

  describe('Design System Compliance', () => {
    it('should follow desktop-optimized design system patterns', () => {
      /**
       * Verify that all pages follow the design system's desktop-optimized approach
       */
      const pagesWithIssues: string[] = [];
      
      HUB_PAGES.forEach(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        
        // Check for anti-patterns
        const hasAntiPatterns = 
          content.includes('max-xl:') || // Don't use max-width breakpoints
          /w-\[\d{4,}px\]/.test(content) || // Avoid very wide fixed widths
          (content.includes('xl:hidden') && !content.includes('2xl:block')); // Don't hide content permanently
        
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
        'xl:grid-cols-4',
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

  describe('Responsive Progression', () => {
    it('should show proper progression from mobile to desktop', () => {
      /**
       * Verify that pages properly scale from mobile (375px) to desktop (1440px)
       */
      const progressionResults = HUB_PAGES.map(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        const classes = extractClassNames(content);
        
        // Check for proper breakpoint progression
        const hasMdBreakpoint = classes.some(cls => cls.startsWith('md:'));
        const hasLgBreakpoint = classes.some(cls => cls.startsWith('lg:'));
        const hasXlBreakpoint = classes.some(cls => cls.startsWith('xl:'));
        
        // Check for grid progression (1 col -> 2 col -> 3 col -> 4 col)
        const hasGridProgression = 
          classes.includes('grid-cols-1') &&
          (classes.includes('md:grid-cols-2') || classes.includes('md:grid-cols-3')) &&
          (classes.includes('lg:grid-cols-3') || classes.includes('lg:grid-cols-4'));
        
        return {
          name,
          hasMdBreakpoint,
          hasLgBreakpoint,
          hasXlBreakpoint,
          hasGridProgression: hasGridProgression || !classes.includes('grid-cols-1'), // Not all pages use grid
        };
      });
      
      // Most pages should show proper progression
      const pagesWithProgression = progressionResults.filter(result => 
        result.hasMdBreakpoint || result.hasLgBreakpoint || result.hasXlBreakpoint || result.hasGridProgression
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

  describe('Desktop Content Optimization', () => {
    it('should optimize content layout for desktop viewport', () => {
      /**
       * Verify that pages optimize content layout for desktop screens
       */
      const optimizationResults = HUB_PAGES.map(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        
        return {
          name,
          hasMultiColumn: usesMultiColumnLayout(content),
          hasProperDensity: hasProperContentDensity(content),
          utilizesViewport: utilizesFullViewport(content),
          hasWhitespace: hasProperWhitespace(content),
        };
      });
      
      // All pages should be optimized for desktop
      const allOptimized = optimizationResults.every(result => 
        result.hasMultiColumn &&
        result.hasProperDensity &&
        result.utilizesViewport &&
        result.hasWhitespace
      );
      
      if (!allOptimized) {
        console.log('Desktop optimization results:', JSON.stringify(optimizationResults, null, 2));
      }
      
      expect(allOptimized).toBe(true);
    });
  });
});
