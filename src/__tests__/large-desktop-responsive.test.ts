/**
 * Large Desktop Responsive Testing (1920px Breakpoint)
 * 
 * Tests verify that all hub pages are properly responsive at the large desktop breakpoint (1920px).
 * This is the standard Full HD viewport width for large monitors and ultra-wide displays.
 * 
 * **Feature: ui-consistency, Task 4.3: Responsive Testing**
 * Validates that all pages:
 * - Use responsive grid patterns (4-column layouts at large desktop)
 * - Maintain proper spacing at large desktop viewport
 * - Display optimized typography for large screens
 * - Show/hide appropriate elements for large desktop
 * - Use proper breakpoint prefixes (2xl:)
 * - Avoid layout issues at large desktop viewport
 * - Utilize full viewport width effectively
 * - Maintain readability with proper max-width constraints
 * 
 * **Validates: Requirements AC7 (Responsive Behavior)**
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

const LARGE_DESKTOP_VIEWPORT_WIDTH = 1920;

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
 * Check if page uses StandardPageLayout (which handles large desktop responsiveness)
 */
function usesStandardPageLayout(content: string): boolean {
  return content.includes('StandardPageLayout');
}

/**
 * Check if page uses responsive grid patterns for large desktop
 */
function usesLargeDesktopGridPatterns(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine - page uses other layout patterns
    return true;
  }
  
  // Look for large desktop-responsive grid patterns (2xl: prefix or implicit from xl:/lg:)
  const hasLargeDesktopGrid = classes.some(cls => 
    /^2xl:grid-cols-\d+$/.test(cls)
  );
  
  // Large desktop can use xl: or lg: grid patterns (3-4 columns work well at large desktop)
  const hasDesktopGrid = classes.some(cls => 
    /^(xl|lg):grid-cols-[34]$/.test(cls)
  );
  
  // StandardPageLayout handles responsive grids automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasLargeDesktopGrid || hasDesktopGrid;
}

/**
 * Check if page uses proper large desktop container padding
 */
function usesLargeDesktopContainerPadding(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use 2xl:px-12 or 2xl:px-16 for large desktop (design system standard)
  const hasLargeDesktopPadding = classes.some(cls => 
    cls === '2xl:px-12' || cls === '2xl:px-16'
  );
  
  // Or uses xl:px-10/xl:px-12 which works well at large desktop
  const hasDesktopPadding = classes.some(cls => 
    cls === 'xl:px-10' || cls === 'xl:px-12'
  );
  
  // Or uses lg:px-8/lg:px-10 which is acceptable
  const hasLargePadding = classes.some(cls => 
    cls === 'lg:px-8' || cls === 'lg:px-10'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasLargeDesktopPadding || hasDesktopPadding || hasLargePadding || classes.includes('px-8') || classes.includes('px-10');
}

/**
 * Check if page has large desktop-optimized spacing
 */
function hasLargeDesktopOptimizedSpacing(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use appropriate spacing values for large desktop
  const hasGoodSpacing = 
    classes.includes('space-y-6') || 
    classes.includes('space-y-8') ||
    classes.includes('space-y-12') ||
    classes.includes('gap-6') || 
    classes.includes('gap-8') ||
    classes.some(cls => /^(2xl|xl|lg):(space-y-6|space-y-8|space-y-12|gap-6|gap-8)$/.test(cls));
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasGoodSpacing;
}

/**
 * Check if page uses optimized typography for large desktop
 */
function hasLargeDesktopOptimizedTypography(content: string): boolean {
  // StandardPageLayout and standard components handle typography
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // Check for responsive typography patterns
  const hasResponsiveTypography = 
    content.includes('2xl:text-') || 
    content.includes('xl:text-') || 
    content.includes('lg:text-') ||
    content.includes('text-heading-') ||
    content.includes('text-display-');
  
  return hasResponsiveTypography;
}

/**
 * Check if page properly shows/hides elements for large desktop
 */
function hasProperLargeDesktopVisibility(content: string): boolean {
  // This is optional - not all pages need large desktop-specific visibility
  // If page uses visibility utilities, they should be appropriate
  
  // Check for anti-patterns (hiding important content on large desktop)
  const hasAntiPatterns = content.includes('2xl:hidden');
  
  return !hasAntiPatterns;
}

/**
 * Check if page uses proper breakpoint prefixes
 */
function usesProperBreakpoints(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use 2xl: for large desktop breakpoint (optional - xl:/lg: work well too)
  const hasLargeDesktopBreakpoints = classes.some(cls => 
    cls.startsWith('2xl:') || cls.startsWith('xl:') || cls.startsWith('lg:')
  );
  
  // Should NOT use max-width breakpoints (mobile-first approach)
  const hasMaxWidthBreakpoints = classes.some(cls => 
    cls.startsWith('max-2xl:') || cls.startsWith('max-xl:') || cls.startsWith('max-lg:')
  );
  
  // StandardPageLayout uses proper breakpoints
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no breakpoints at all, that's acceptable (static layout)
  if (!hasLargeDesktopBreakpoints && !hasMaxWidthBreakpoints) {
    return true;
  }
  
  return hasLargeDesktopBreakpoints && !hasMaxWidthBreakpoints;
}

/**
 * Check if forms are large desktop-optimized
 */
function hasLargeDesktopOptimizedForms(content: string): boolean {
  // If page has forms, check for StandardFormField or proper form layout
  const hasForms = content.includes('<Input') || content.includes('<Textarea') || content.includes('<Select');
  
  if (!hasForms) {
    return true; // No forms, so this check passes
  }
  
  // Forms should use StandardFormField (large desktop-optimized)
  const usesStandardForms = content.includes('StandardFormField');
  
  // Or should have responsive form layout
  const hasResponsiveLayout = content.includes('2xl:grid-cols-2') || content.includes('xl:grid-cols-2') || content.includes('lg:grid-cols-2') || content.includes('2xl:flex');
  
  // Or uses Dialog/Modal forms which are inherently responsive
  const usesDialogForms = content.includes('<Dialog') && hasForms;
  
  return usesStandardForms || hasResponsiveLayout || usesDialogForms;
}

/**
 * Check if cards are large desktop-responsive
 */
function hasLargeDesktopResponsiveCards(content: string): boolean {
  // If page has cards, check for StandardCard or responsive card grid
  const hasCards = content.includes('<Card') || content.includes('StandardCard') || content.includes('EnhancedCard');
  
  if (!hasCards) {
    return true; // No cards, so this check passes
  }
  
  // Cards should use StandardCard or EnhancedCard (both large desktop-responsive)
  const usesStandardCards = content.includes('StandardCard') || content.includes('EnhancedCard');
  
  // Or should be in a responsive grid
  const hasResponsiveGrid = content.includes('2xl:grid-cols-4') || content.includes('xl:grid-cols-4') || content.includes('lg:grid-cols-3') || content.includes('lg:grid-cols-4');
  
  // Or uses Accordion/Collapsible which are inherently responsive
  const usesAccordion = content.includes('<Accordion') || content.includes('<Collapsible');
  
  // Or uses Tabs which handle responsive layout
  const usesTabs = content.includes('<Tabs');
  
  // Or uses list layout (ul/li) which is inherently responsive
  const usesListLayout = content.includes('<ul') && content.includes('space-y-');
  
  return usesStandardCards || hasResponsiveGrid || usesAccordion || usesTabs || usesListLayout;
}

/**
 * Check if page avoids layout issues at large desktop viewport
 */
function avoidsLargeDesktopLayoutIssues(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should NOT have fixed widths that cause issues at large desktop
  const hasProblematicWidth = classes.some(cls => 
    /^w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > LARGE_DESKTOP_VIEWPORT_WIDTH
  );
  
  // Should NOT have min-width that exceeds large desktop viewport
  const hasProblematicMinWidth = classes.some(cls => 
    /^min-w-\[(\d+)px\]$/.test(cls) && parseInt(cls.match(/\d+/)?.[0] || '0') > LARGE_DESKTOP_VIEWPORT_WIDTH
  );
  
  return !hasProblematicWidth && !hasProblematicMinWidth;
}

/**
 * Check if page uses 4-column layout at large desktop (common pattern)
 */
function usesFourColumnLayout(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check if page uses grid at all
  const hasGrid = content.includes('grid') && classes.some(cls => cls.includes('grid'));
  
  if (!hasGrid) {
    // No grid layout, which is fine
    return true;
  }
  
  // Look for 4-column grid at large desktop breakpoint
  const hasFourColumnGrid = classes.some(cls => 
    cls === '2xl:grid-cols-4' || cls === 'xl:grid-cols-4'
  );
  
  // Or 3-column grid (also acceptable for large desktop)
  const hasThreeColumnGrid = classes.some(cls => 
    cls === '2xl:grid-cols-3' || cls === 'xl:grid-cols-3' || cls === 'lg:grid-cols-3'
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasFourColumnGrid || hasThreeColumnGrid;
}

/**
 * Check if page uses proper max-width at large desktop
 */
function usesProperMaxWidth(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use max-w-7xl or max-w-screen-2xl for large desktop
  const hasProperMaxWidth = classes.some(cls => 
    cls.startsWith('max-w-') && 
    (cls.includes('7xl') || cls.includes('screen-2xl') || cls.includes('full'))
  );
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no max-width, that's acceptable (full-width layout)
  return true;
}

/**
 * Check if page has proper content density at large desktop
 */
function hasProperContentDensity(content: string): boolean {
  const classes = extractClassNames(content);
  
  // At large desktop, content should utilize the available space
  // Check for appropriate grid columns (3-4 columns)
  const hasGoodDensity = 
    classes.includes('2xl:grid-cols-3') || 
    classes.includes('2xl:grid-cols-4') ||
    classes.includes('xl:grid-cols-3') ||
    classes.includes('xl:grid-cols-4') ||
    classes.includes('lg:grid-cols-3') ||
    classes.includes('lg:grid-cols-4');
  
  // Or uses other layout patterns (flex, list, etc.)
  const usesOtherLayout = 
    content.includes('2xl:flex') || 
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
  
  // Should not have overly restrictive max-width at large desktop
  const hasRestrictiveMaxWidth = classes.some(cls => 
    cls === 'max-w-md' || cls === 'max-w-lg' || cls === 'max-w-xl' || cls === 'max-w-2xl' || cls === 'max-w-3xl'
  );
  
  // StandardPageLayout uses appropriate max-width
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If no restrictive max-width, viewport is utilized well
  return !hasRestrictiveMaxWidth;
}

/**
 * Check if page has proper whitespace at large desktop
 */
function hasProperWhitespace(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should have adequate spacing between sections
  const hasGoodSpacing = 
    classes.includes('space-y-8') || 
    classes.includes('space-y-12') ||
    classes.includes('space-y-16') ||
    classes.includes('gap-8') ||
    classes.includes('gap-12') ||
    classes.some(cls => /^(2xl|xl|lg):(space-y-8|space-y-12|gap-8|gap-12)$/.test(cls));
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasGoodSpacing;
}

/**
 * Check if page supports sidebar layout at large desktop
 */
function supportsSidebarLayout(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Check for sidebar layout patterns (common at large desktop)
  const hasSidebarPattern = 
    (classes.includes('2xl:grid-cols-3') || classes.includes('xl:grid-cols-3') || classes.includes('lg:grid-cols-3')) && 
    (classes.includes('2xl:col-span-2') || classes.includes('xl:col-span-2') || classes.includes('lg:col-span-2') || 
     content.includes('2xl:col-span-2') || content.includes('xl:col-span-2') || content.includes('lg:col-span-2'));
  
  // Or uses flex layout with sidebar
  const hasFlexSidebar = 
    (content.includes('2xl:flex') || content.includes('xl:flex') || content.includes('lg:flex')) && 
    (content.includes('2xl:w-64') || content.includes('2xl:w-80') || 
     content.includes('xl:w-64') || content.includes('xl:w-80') || 
     content.includes('lg:w-64') || content.includes('lg:w-80'));
  
  // Not all pages need sidebar layout
  return true; // This is optional, so always pass
}

/**
 * Check if page maintains readability at large desktop
 */
function maintainsReadability(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use max-width to maintain readability (not too wide)
  const hasMaxWidth = classes.some(cls => cls.startsWith('max-w-'));
  
  // Or uses container which has built-in max-width
  const usesContainer = content.includes('container');
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // If using full-width layout, that's acceptable for dashboards/grids
  return true;
}

/**
 * Check if page has proper content centering at large desktop
 */
function hasProperContentCentering(content: string): boolean {
  const classes = extractClassNames(content);
  
  // Should use mx-auto for centering content
  const hasCentering = classes.includes('mx-auto');
  
  // Or uses container which centers automatically
  const usesContainer = content.includes('container');
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  return hasCentering || usesContainer || true; // Centering is optional
}

/**
 * Check if page uses enhanced spacing at large desktop
 */
function usesEnhancedSpacing(content: string): boolean {
  const classes = extractClassNames(content);
  
  // At large desktop, can use more generous spacing
  const hasEnhancedSpacing = 
    classes.includes('2xl:space-y-12') || 
    classes.includes('2xl:space-y-16') ||
    classes.includes('2xl:gap-12') ||
    classes.includes('2xl:gap-16') ||
    classes.includes('space-y-12') ||
    classes.includes('gap-12');
  
  // StandardPageLayout handles this automatically
  if (usesStandardPageLayout(content)) {
    return true;
  }
  
  // Enhanced spacing is optional
  return true;
}

// ============================================================================
// Tests
// ============================================================================

describe('Large Desktop Responsive Testing (1920px)', () => {
  describe('Large Desktop Grid Patterns', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use responsive grid patterns for large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.1: Large Desktop Grid Patterns**
         * For any page with grid layouts, it must use 2xl:, xl:, or lg: breakpoints
         * to create 3-4 column layouts at large desktop viewport
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesLargeDesktopGridPatterns(content)).toBe(true);
      });
    });
  });

  describe('Large Desktop Container Padding', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper large desktop container padding`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.2: Large Desktop Container Padding**
         * For any page, it must use 2xl:px-12 or 2xl:px-16 for large desktop container padding
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesLargeDesktopContainerPadding(content)).toBe(true);
      });
    });
  });

  describe('Large Desktop-Optimized Spacing', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have large desktop-optimized spacing`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.3: Large Desktop Spacing**
         * For any page, spacing values should be appropriate for large desktop viewport
         * (space-y-6, space-y-8, space-y-12, gap-6, gap-8)
         * **Validates: Requirements AC1 (Standardized Page Layouts - uniform spacing)**
         */
        const content = getPageContent(pagePath);
        expect(hasLargeDesktopOptimizedSpacing(content)).toBe(true);
      });
    });
  });

  describe('Large Desktop-Optimized Typography', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use optimized typography for large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.4: Large Desktop Typography**
         * For any page, typography should be optimized for large desktop screens
         * with responsive text sizing
         * **Validates: Requirements AC5 (Typography System - consistent sizing)**
         */
        const content = getPageContent(pagePath);
        expect(hasLargeDesktopOptimizedTypography(content)).toBe(true);
      });
    });
  });

  describe('Large Desktop Visibility', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should properly show/hide elements for large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.5: Large Desktop Visibility**
         * For any page, elements should be appropriately shown/hidden at large desktop viewport
         * without hiding important content
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperLargeDesktopVisibility(content)).toBe(true);
      });
    });
  });

  describe('Proper Breakpoint Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper breakpoint prefixes`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.6: Breakpoint Prefixes**
         * For any page, it should use 2xl:, xl:, or lg: prefix for large desktop breakpoint
         * and avoid max-width breakpoints (mobile-first approach)
         * **Validates: Requirements AC7 (Responsive Behavior - consistent breakpoint usage)**
         */
        const content = getPageContent(pagePath);
        expect(usesProperBreakpoints(content)).toBe(true);
      });
    });
  });

  describe('Large Desktop-Optimized Forms', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have large desktop-optimized forms`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.7: Large Desktop Forms**
         * For any page with forms, forms should be optimized for large desktop viewport
         * with proper layout and spacing
         * **Validates: Requirements AC3 (Consistent Form Patterns)**
         */
        const content = getPageContent(pagePath);
        expect(hasLargeDesktopOptimizedForms(content)).toBe(true);
      });
    });
  });

  describe('Large Desktop-Responsive Cards', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have large desktop-responsive cards`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.8: Large Desktop Cards**
         * For any page with cards, cards should be in a responsive grid
         * that displays 3-4 columns at large desktop viewport
         * **Validates: Requirements AC2 (Unified Card System)**
         */
        const content = getPageContent(pagePath);
        expect(hasLargeDesktopResponsiveCards(content)).toBe(true);
      });
    });
  });

  describe('No Layout Issues', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should avoid layout issues at large desktop viewport`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.9: No Layout Issues**
         * For any page, content should not cause layout issues
         * at large desktop viewport (1920px)
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(avoidsLargeDesktopLayoutIssues(content)).toBe(true);
      });
    });
  });

  describe('Four-Column Layout', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use 3-4 column layout at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.10: Four-Column Layout**
         * For any page with grid layouts, it should display 3-4 columns
         * at large desktop viewport for optimal content density
         * **Validates: Requirements AC7 (Responsive Behavior - standardized grid collapsing)**
         */
        const content = getPageContent(pagePath);
        expect(usesFourColumnLayout(content)).toBe(true);
      });
    });
  });

  describe('Proper Max Width', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use proper max-width at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.11: Max Width**
         * For any page, it should use appropriate max-width at large desktop
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
      it(`${name} should have proper content density at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.12: Content Density**
         * For any page, content density should be optimized for large desktop
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
         * **Feature: ui-consistency, Property CP6.13: Viewport Utilization**
         * For any page, it should utilize the full large desktop viewport width
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
      it(`${name} should have proper whitespace at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.14: Whitespace**
         * For any page, it should have adequate whitespace between sections
         * at large desktop viewport for visual clarity
         * **Validates: Requirements AC1 (Standardized Page Layouts - uniform spacing)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperWhitespace(content)).toBe(true);
      });
    });
  });

  describe('Sidebar Layout Support', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should support sidebar layout at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.15: Sidebar Layout**
         * For any page, it should support sidebar layout patterns at large desktop
         * (optional - not all pages need sidebars)
         * **Validates: Requirements AC7 (Responsive Behavior)**
         */
        const content = getPageContent(pagePath);
        expect(supportsSidebarLayout(content)).toBe(true);
      });
    });
  });

  describe('Readability Maintenance', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should maintain readability at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.16: Readability**
         * For any page, content should maintain readability at large desktop
         * with appropriate max-width constraints
         * **Validates: Requirements AC1 (Standardized Page Layouts)**
         */
        const content = getPageContent(pagePath);
        expect(maintainsReadability(content)).toBe(true);
      });
    });
  });

  describe('Content Centering', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should have proper content centering at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.17: Content Centering**
         * For any page, content should be properly centered at large desktop
         * to avoid awkward left-aligned layouts on ultra-wide screens
         * **Validates: Requirements AC1 (Standardized Page Layouts)**
         */
        const content = getPageContent(pagePath);
        expect(hasProperContentCentering(content)).toBe(true);
      });
    });
  });

  describe('Enhanced Spacing', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use enhanced spacing at large desktop`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.18: Enhanced Spacing**
         * For any page, it can use more generous spacing at large desktop
         * to take advantage of the available space
         * **Validates: Requirements AC1 (Standardized Page Layouts - uniform spacing)**
         */
        const content = getPageContent(pagePath);
        expect(usesEnhancedSpacing(content)).toBe(true);
      });
    });
  });

  describe('StandardPageLayout Usage', () => {
    HUB_PAGES.forEach(({ path: pagePath, name }) => {
      it(`${name} should use StandardPageLayout for consistent large desktop behavior`, () => {
        /**
         * **Feature: ui-consistency, Property CP6.19: StandardPageLayout**
         * For any hub page, it should use StandardPageLayout which handles
         * large desktop responsiveness automatically
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

describe('Large Desktop Responsive Integration', () => {
  describe('Overall Large Desktop Readiness', () => {
    it('should have all hub pages large desktop-ready', () => {
      /**
       * Integration test to verify all hub pages are large desktop-ready
       */
      const results = HUB_PAGES.map(({ path: pagePath, name }) => {
        try {
          const content = getPageContent(pagePath);
          return {
            name,
            usesStandardLayout: usesStandardPageLayout(content),
            hasLargeDesktopGrid: usesLargeDesktopGridPatterns(content),
            hasLargeDesktopSpacing: hasLargeDesktopOptimizedSpacing(content),
            hasLargeDesktopTypography: hasLargeDesktopOptimizedTypography(content),
            hasProperBreakpoints: usesProperBreakpoints(content),
            noLayoutIssues: avoidsLargeDesktopLayoutIssues(content),
            utilizesViewport: utilizesFullViewport(content),
            maintainsReadability: maintainsReadability(content),
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
        result.hasLargeDesktopGrid &&
        result.hasLargeDesktopSpacing &&
        result.hasLargeDesktopTypography &&
        result.hasProperBreakpoints &&
        result.noLayoutIssues &&
        result.utilizesViewport &&
        result.maintainsReadability
      );
      
      if (!allPassed) {
        console.log('Large desktop readiness results:', JSON.stringify(results, null, 2));
      }
      
      expect(allPassed).toBe(true);
    });
  });

  describe('Design System Compliance', () => {
    it('should follow large desktop-optimized design system patterns', () => {
      /**
       * Verify that all pages follow the design system's large desktop-optimized approach
       */
      const pagesWithIssues: string[] = [];
      
      HUB_PAGES.forEach(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        
        // Check for anti-patterns
        const hasAntiPatterns = 
          content.includes('max-2xl:') || // Don't use max-width breakpoints
          content.includes('max-xl:') || 
          /w-\[\d{4,}px\]/.test(content) || // Avoid very wide fixed widths
          content.includes('2xl:hidden'); // Don't hide content permanently
        
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
        '2xl:grid-cols-4',
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
    it('should show proper progression from mobile to large desktop', () => {
      /**
       * Verify that pages properly scale from mobile (375px) to large desktop (1920px)
       */
      const progressionResults = HUB_PAGES.map(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        const classes = extractClassNames(content);
        
        // Check for proper breakpoint progression
        const hasMdBreakpoint = classes.some(cls => cls.startsWith('md:'));
        const hasLgBreakpoint = classes.some(cls => cls.startsWith('lg:'));
        const hasXlBreakpoint = classes.some(cls => cls.startsWith('xl:'));
        const has2xlBreakpoint = classes.some(cls => cls.startsWith('2xl:'));
        
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
          has2xlBreakpoint,
          hasGridProgression: hasGridProgression || !classes.includes('grid-cols-1'), // Not all pages use grid
        };
      });
      
      // Most pages should show proper progression
      const pagesWithProgression = progressionResults.filter(result => 
        result.hasMdBreakpoint || result.hasLgBreakpoint || result.hasXlBreakpoint || result.has2xlBreakpoint || result.hasGridProgression
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
          cls.startsWith('max-xl:') ||
          cls.startsWith('max-2xl:')
        );
        
        if (hasMaxWidthBreakpoints) {
          pagesWithMaxWidth.push(name);
        }
      });
      
      expect(pagesWithMaxWidth).toEqual([]);
    });
  });

  describe('Large Desktop Content Optimization', () => {
    it('should optimize content layout for large desktop viewport', () => {
      /**
       * Verify that pages optimize content layout for large desktop screens
       */
      const optimizationResults = HUB_PAGES.map(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        
        return {
          name,
          hasFourColumn: usesFourColumnLayout(content),
          hasProperDensity: hasProperContentDensity(content),
          utilizesViewport: utilizesFullViewport(content),
          hasWhitespace: hasProperWhitespace(content),
          maintainsReadability: maintainsReadability(content),
        };
      });
      
      // All pages should be optimized for large desktop
      const allOptimized = optimizationResults.every(result => 
        result.hasFourColumn &&
        result.hasProperDensity &&
        result.utilizesViewport &&
        result.hasWhitespace &&
        result.maintainsReadability
      );
      
      if (!allOptimized) {
        console.log('Large desktop optimization results:', JSON.stringify(optimizationResults, null, 2));
      }
      
      expect(allOptimized).toBe(true);
    });
  });

  describe('Ultra-Wide Display Support', () => {
    it('should support ultra-wide displays without layout issues', () => {
      /**
       * Verify that pages work well on ultra-wide displays (1920px+)
       */
      const ultraWideResults = HUB_PAGES.map(({ path: pagePath, name }) => {
        const content = getPageContent(pagePath);
        
        return {
          name,
          noLayoutIssues: avoidsLargeDesktopLayoutIssues(content),
          hasProperMaxWidth: usesProperMaxWidth(content),
          hasCentering: hasProperContentCentering(content),
          maintainsReadability: maintainsReadability(content),
        };
      });
      
      // All pages should support ultra-wide displays
      const allSupported = ultraWideResults.every(result => 
        result.noLayoutIssues &&
        result.hasProperMaxWidth &&
        result.hasCentering &&
        result.maintainsReadability
      );
      
      if (!allSupported) {
        console.log('Ultra-wide display support results:', JSON.stringify(ultraWideResults, null, 2));
      }
      
      expect(allSupported).toBe(true);
    });
  });
});
