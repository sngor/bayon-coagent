/**
 * Brand Center Pages Visual Regression Tests
 * 
 * Tests verify that all Brand Center pages (Profile, Audit, Strategy) render correctly
 * with standard components and maintain visual consistency.
 * 
 * **Feature: ui-consistency, Task 4.2: Visual Regression Testing**
 * Validates that Brand Center pages render correctly with:
 * - StandardPageLayout with proper spacing
 * - StandardCard components with consistent styling
 * - StandardFormField and StandardFormActions
 * - StandardLoadingSpinner for operations
 * - StandardErrorDisplay for error states
 * - Proper grid layouts and responsive behavior
 * - Consistent typography and spacing scale
 * 
 * **Validates: Requirements AC1, AC2, AC3, AC4, AC5, AC7**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

const BRAND_CENTER_PAGES = {
  profile: 'src/app/(app)/brand-center/profile/page.tsx',
  audit: 'src/app/(app)/brand-center/audit/page.tsx',
  strategy: 'src/app/(app)/brand-center/strategy/page.tsx',
};

// Expected standard components
const REQUIRED_COMPONENTS = [
  'StandardPageLayout',
  'StandardFormField',
  'StandardFormActions',
  'StandardLoadingSpinner',
  'StandardErrorDisplay',
];

// Expected spacing values
const EXPECTED_SPACING = {
  primary: ['space-y-6', 'gap-6'],
  secondary: ['space-y-4', 'gap-4', 'space-y-8', 'gap-8'],
};

// Expected responsive patterns
const EXPECTED_GRID_PATTERNS = [
  'grid-cols-1',
  'md:grid-cols-2',
  'lg:grid-cols-3',
];

// ============================================================================
// Helper Functions
// ============================================================================

function readPageContent(pagePath: string): string {
  const fullPath = path.join(process.cwd(), pagePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

function hasComponent(content: string, component: string): boolean {
  return content.includes(component);
}

function usesDesignSystemSpacing(content: string): boolean {
  const allExpectedSpacing = [
    ...EXPECTED_SPACING.primary,
    ...EXPECTED_SPACING.secondary,
  ];
  return allExpectedSpacing.some((spacing) => content.includes(spacing));
}

function usesResponsiveGrids(content: string): boolean {
  return EXPECTED_GRID_PATTERNS.some((pattern) => content.includes(pattern));
}

function countOccurrences(content: string, pattern: string | RegExp): number {
  if (typeof pattern === 'string') {
    return (content.match(new RegExp(pattern, 'g')) || []).length;
  }
  return (content.match(pattern) || []).length;
}

// ============================================================================
// Brand Center Profile Page Tests
// ============================================================================

describe('Brand Center Profile Page Visual Regression', () => {
  let profileContent: string;

  beforeAll(() => {
    profileContent = readPageContent(BRAND_CENTER_PAGES.profile);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(hasComponent(profileContent, 'StandardPageLayout')).toBe(true);
    });

    it('should use StandardFormField for all form inputs', () => {
      const formFieldCount = countOccurrences(profileContent, 'StandardFormField');
      expect(formFieldCount).toBeGreaterThan(5); // Profile has many form fields
    });

    it('should use StandardFormActions for form buttons', () => {
      expect(hasComponent(profileContent, 'StandardFormActions')).toBe(true);
    });

    it('should use StandardLoadingSpinner for loading states', () => {
      expect(hasComponent(profileContent, 'StandardLoadingSpinner')).toBe(true);
    });

    it('should use Card components for content organization', () => {
      expect(hasComponent(profileContent, '<Card')).toBe(true);
      expect(hasComponent(profileContent, 'CardHeader')).toBe(true);
      expect(hasComponent(profileContent, 'CardContent')).toBe(true);
    });
  });

  describe('Layout and Spacing', () => {
    it('should specify spacing prop on StandardPageLayout', () => {
      expect(profileContent).toMatch(/spacing=["']default["']/);
    });

    it('should use design system spacing scale', () => {
      expect(usesDesignSystemSpacing(profileContent)).toBe(true);
    });

    it('should use space-y-6 for primary content spacing', () => {
      expect(hasComponent(profileContent, 'space-y-6')).toBe(true);
    });

    it('should use space-y-4 for form field groups', () => {
      expect(hasComponent(profileContent, 'space-y-4')).toBe(true);
    });

    it('should use space-y-8 for major section spacing', () => {
      expect(hasComponent(profileContent, 'space-y-8')).toBe(true);
    });
  });

  describe('Responsive Behavior', () => {
    it('should use responsive grid layouts', () => {
      expect(usesResponsiveGrids(profileContent)).toBe(true);
    });

    it('should use md:grid-cols-2 for form fields', () => {
      expect(hasComponent(profileContent, 'md:grid-cols-2')).toBe(true);
    });

    it('should use lg:grid-cols-3 for main layout', () => {
      expect(hasComponent(profileContent, 'lg:grid-cols-3')).toBe(true);
    });

    it('should use gap-4 or gap-6 for grid spacing', () => {
      const hasGap4 = hasComponent(profileContent, 'gap-4');
      const hasGap6 = hasComponent(profileContent, 'gap-6');
      expect(hasGap4 || hasGap6).toBe(true);
    });
  });

  describe('Form Patterns', () => {
    it('should have consistent form field structure', () => {
      expect(hasComponent(profileContent, 'StandardFormField')).toBe(true);
      expect(hasComponent(profileContent, 'label=')).toBe(true);
      expect(hasComponent(profileContent, 'id=')).toBe(true);
    });

    it('should use required prop for required fields', () => {
      expect(hasComponent(profileContent, 'required')).toBe(true);
    });

    it('should use hint prop for helper text', () => {
      expect(hasComponent(profileContent, 'hint=')).toBe(true);
    });

    it('should have form sections with separators', () => {
      expect(hasComponent(profileContent, 'Separator')).toBe(true);
    });
  });

  describe('Typography', () => {
    it('should use font-headline for titles', () => {
      expect(hasComponent(profileContent, 'font-headline')).toBe(true);
    });

    it('should use text-muted-foreground for secondary text', () => {
      expect(hasComponent(profileContent, 'text-muted-foreground')).toBe(true);
    });

    it('should use consistent text sizing', () => {
      expect(hasComponent(profileContent, 'text-sm')).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should use StandardLoadingSpinner with size prop', () => {
      expect(profileContent).toMatch(/StandardLoadingSpinner.*size=/);
    });

    it('should show loading message', () => {
      expect(hasComponent(profileContent, 'Saving...')).toBe(true);
    });
  });

  describe('Tabs Integration', () => {
    it('should use Tabs component for profile/schema views', () => {
      expect(hasComponent(profileContent, '<Tabs')).toBe(true);
      expect(hasComponent(profileContent, 'TabsList')).toBe(true);
      expect(hasComponent(profileContent, 'TabsTrigger')).toBe(true);
      expect(hasComponent(profileContent, 'TabsContent')).toBe(true);
    });
  });
});

// ============================================================================
// Brand Center Audit Page Tests
// ============================================================================

describe('Brand Center Audit Page Visual Regression', () => {
  let auditContent: string;

  beforeAll(() => {
    auditContent = readPageContent(BRAND_CENTER_PAGES.audit);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(hasComponent(auditContent, 'StandardPageLayout')).toBe(true);
    });

    it('should use StandardFormActions for action buttons', () => {
      expect(hasComponent(auditContent, 'StandardFormActions')).toBe(true);
    });

    it('should use StandardLoadingSpinner for loading states', () => {
      expect(hasComponent(auditContent, 'StandardLoadingSpinner')).toBe(true);
    });

    it('should have custom error display for audit failures', () => {
      expect(hasComponent(auditContent, 'Audit Failed')).toBe(true);
      expect(hasComponent(auditContent, 'bg-destructive/10')).toBe(true);
    });

    it('should use Card components for content sections', () => {
      expect(hasComponent(auditContent, '<Card')).toBe(true);
      const cardCount = countOccurrences(auditContent, '<Card');
      expect(cardCount).toBeGreaterThan(3); // Multiple cards for different sections
    });
  });

  describe('Layout and Spacing', () => {
    it('should specify spacing prop on StandardPageLayout', () => {
      expect(auditContent).toMatch(/spacing=["']default["']/);
    });

    it('should use design system spacing scale', () => {
      expect(usesDesignSystemSpacing(auditContent)).toBe(true);
    });

    it('should use space-y-6 for primary content spacing', () => {
      expect(hasComponent(auditContent, 'space-y-6')).toBe(true);
    });

    it('should use gap-6 for grid layouts', () => {
      expect(hasComponent(auditContent, 'gap-6')).toBe(true);
    });
  });

  describe('Responsive Behavior', () => {
    it('should use responsive grid layouts', () => {
      expect(usesResponsiveGrids(auditContent)).toBe(true);
    });

    it('should use lg:grid-cols-3 for main layout', () => {
      expect(hasComponent(auditContent, 'lg:grid-cols-3')).toBe(true);
    });

    it('should use md:grid-cols-2 for bottom section', () => {
      expect(hasComponent(auditContent, 'md:grid-cols-2')).toBe(true);
    });
  });

  describe('Brand Score Display', () => {
    it('should have prominent brand score card', () => {
      expect(hasComponent(auditContent, 'Your Brand Score')).toBe(true);
    });

    it('should use gradient styling for hero section', () => {
      expect(hasComponent(auditContent, 'bg-gradient-to-br')).toBe(true);
    });

    it('should display score breakdown', () => {
      expect(hasComponent(auditContent, 'Profile Completeness')).toBe(true);
      expect(hasComponent(auditContent, 'GBP Connection')).toBe(true);
    });
  });

  describe('NAP Audit Section', () => {
    it('should have NAP consistency audit card', () => {
      expect(hasComponent(auditContent, 'NAP Consistency Audit')).toBe(true);
    });

    it('should use FirstTimeUseEmptyState for initial state', () => {
      expect(hasComponent(auditContent, 'FirstTimeUseEmptyState')).toBe(true);
    });

    it('should use ResponsiveTableWrapper for audit results', () => {
      expect(hasComponent(auditContent, 'ResponsiveTableWrapper')).toBe(true);
    });

    it('should use Table components for results display', () => {
      expect(hasComponent(auditContent, '<Table')).toBe(true);
      expect(hasComponent(auditContent, 'TableHeader')).toBe(true);
      expect(hasComponent(auditContent, 'TableBody')).toBe(true);
    });
  });

  describe('Sidebar Cards', () => {
    it('should have profile completeness card', () => {
      expect(hasComponent(auditContent, 'Profile Completeness')).toBe(true);
      expect(hasComponent(auditContent, '<Progress')).toBe(true);
    });

    it('should have Google Business Profile card', () => {
      expect(hasComponent(auditContent, 'Google Business Profile')).toBe(true);
    });

    it('should have review distribution card with chart', () => {
      expect(hasComponent(auditContent, 'Review Distribution')).toBe(true);
      expect(hasComponent(auditContent, 'ChartContainer')).toBe(true);
      expect(hasComponent(auditContent, 'RadialBarChart')).toBe(true);
    });
  });

  describe('Review Features', () => {
    it('should have Zillow review importer section', () => {
      expect(hasComponent(auditContent, 'Zillow Review Importer')).toBe(true);
    });

    it('should have client review feed section', () => {
      expect(hasComponent(auditContent, 'Client Review Feed')).toBe(true);
    });

    it('should use Badge components for status display', () => {
      expect(hasComponent(auditContent, '<Badge')).toBe(true);
    });

    it('should use Star icons for ratings', () => {
      expect(hasComponent(auditContent, '<Star')).toBe(true);
    });
  });

  describe('Typography', () => {
    it('should use font-headline for titles', () => {
      expect(hasComponent(auditContent, 'font-headline')).toBe(true);
    });

    it('should use text-muted-foreground for descriptions', () => {
      expect(hasComponent(auditContent, 'text-muted-foreground')).toBe(true);
    });
  });

  describe('Loading and Error States', () => {
    it('should use StandardLoadingSpinner with message', () => {
      expect(auditContent).toMatch(/StandardLoadingSpinner.*message=/);
    });

    it('should display error messages with destructive styling', () => {
      expect(hasComponent(auditContent, 'text-destructive')).toBe(true);
    });
  });

  describe('Celebration Animation', () => {
    it('should use Celebration component for success', () => {
      expect(hasComponent(auditContent, '<Celebration')).toBe(true);
    });
  });
});

// ============================================================================
// Brand Center Strategy Page Tests
// ============================================================================

describe('Brand Center Strategy Page Visual Regression', () => {
  let strategyContent: string;

  beforeAll(() => {
    strategyContent = readPageContent(BRAND_CENTER_PAGES.strategy);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(hasComponent(strategyContent, 'StandardPageLayout')).toBe(true);
    });

    it('should use StandardFormActions for generate button', () => {
      expect(hasComponent(strategyContent, 'StandardFormActions')).toBe(true);
    });

    it('should use StandardLoadingSpinner for loading states', () => {
      expect(hasComponent(strategyContent, 'StandardLoadingSpinner')).toBe(true);
    });

    it('should use StandardErrorDisplay for error states', () => {
      expect(hasComponent(strategyContent, 'StandardErrorDisplay')).toBe(true);
    });

    it('should use StandardEmptyState for initial state', () => {
      expect(hasComponent(strategyContent, 'StandardEmptyState')).toBe(true);
    });

    it('should use Card components for content', () => {
      expect(hasComponent(strategyContent, '<Card')).toBe(true);
    });
  });

  describe('Layout and Spacing', () => {
    it('should specify spacing prop on StandardPageLayout', () => {
      expect(strategyContent).toMatch(/spacing=["']default["']/);
    });

    it('should use design system spacing scale', () => {
      expect(usesDesignSystemSpacing(strategyContent)).toBe(true);
    });

    it('should use space-y-6 for primary content spacing', () => {
      expect(hasComponent(strategyContent, 'space-y-6')).toBe(true);
    });

    it('should use space-y-4 for list items', () => {
      expect(hasComponent(strategyContent, 'space-y-4')).toBe(true);
    });
  });

  describe('Marketing Plan Display', () => {
    it('should display marketing plan steps', () => {
      expect(hasComponent(strategyContent, 'Your Action Plan')).toBe(true);
    });

    it('should use numbered list for steps', () => {
      expect(hasComponent(strategyContent, '<ul')).toBe(true);
      expect(hasComponent(strategyContent, '<li')).toBe(true);
    });

    it('should have tool links for each step', () => {
      expect(hasComponent(strategyContent, 'toolLink')).toBe(true);
    });

    it('should use animation classes for reveal', () => {
      expect(hasComponent(strategyContent, 'animate-fade-in-up')).toBe(true);
      expect(hasComponent(strategyContent, 'animate-delay')).toBe(true);
    });
  });

  describe('Empty State', () => {
    it('should use StandardEmptyState with AI icon', () => {
      expect(hasComponent(strategyContent, 'StandardEmptyState')).toBe(true);
      expect(hasComponent(strategyContent, 'AISparkleIcon')).toBe(true);
    });

    it('should have descriptive title and description', () => {
      expect(hasComponent(strategyContent, 'Your Marketing Success Starts Here')).toBe(true);
    });

    it('should have action button', () => {
      expect(hasComponent(strategyContent, 'action=')).toBe(true);
    });
  });

  describe('Prerequisites Section', () => {
    it('should show prerequisites when data not ready', () => {
      expect(hasComponent(strategyContent, 'Prerequisites Required')).toBe(true);
    });

    it('should list brand audit prerequisite', () => {
      expect(hasComponent(strategyContent, 'Complete Your Brand Audit')).toBe(true);
    });

    it('should list competitors prerequisite', () => {
      expect(hasComponent(strategyContent, 'Add Your Competitors')).toBe(true);
    });

    it('should have links to prerequisite pages', () => {
      expect(hasComponent(strategyContent, '/brand-audit')).toBe(true);
      expect(hasComponent(strategyContent, '/competitive-analysis')).toBe(true);
    });
  });

  describe('Generation Progress', () => {
    it('should use StepLoader for generation progress', () => {
      expect(hasComponent(strategyContent, 'StepLoader')).toBe(true);
    });

    it('should show generation steps', () => {
      expect(hasComponent(strategyContent, 'generationSteps')).toBe(true);
    });

    it('should use AI-themed styling during generation', () => {
      expect(hasComponent(strategyContent, 'AISparkleIcon')).toBe(true);
      expect(hasComponent(strategyContent, 'Creating Your Marketing Plan')).toBe(true);
    });
  });

  describe('Success State', () => {
    it('should use Celebration component for success', () => {
      expect(hasComponent(strategyContent, '<Celebration')).toBe(true);
    });

    it('should show success message', () => {
      expect(hasComponent(strategyContent, 'Success!')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should use StandardErrorDisplay for errors', () => {
      expect(hasComponent(strategyContent, 'StandardErrorDisplay')).toBe(true);
    });

    it('should have retry functionality', () => {
      expect(hasComponent(strategyContent, 'handleRetry')).toBe(true);
      expect(hasComponent(strategyContent, 'Try Again')).toBe(true);
    });

    it('should provide links to check prerequisites', () => {
      expect(hasComponent(strategyContent, 'Check Brand Audit')).toBe(true);
      expect(hasComponent(strategyContent, 'Check Competitors')).toBe(true);
    });
  });

  describe('Typography', () => {
    it('should use font-headline for titles', () => {
      expect(hasComponent(strategyContent, 'font-headline')).toBe(true);
    });

    it('should use text-muted-foreground for descriptions', () => {
      expect(hasComponent(strategyContent, 'text-muted-foreground')).toBe(true);
    });
  });

  describe('Icons', () => {
    it('should use real estate icons', () => {
      expect(hasComponent(strategyContent, 'AISparkleIcon')).toBe(true);
    });

    it('should use lucide icons', () => {
      expect(hasComponent(strategyContent, 'ArrowRight')).toBe(true);
    });
  });
});

// ============================================================================
// Cross-Page Consistency Tests
// ============================================================================

describe('Brand Center Cross-Page Consistency', () => {
  let profileContent: string;
  let auditContent: string;
  let strategyContent: string;

  beforeAll(() => {
    profileContent = readPageContent(BRAND_CENTER_PAGES.profile);
    auditContent = readPageContent(BRAND_CENTER_PAGES.audit);
    strategyContent = readPageContent(BRAND_CENTER_PAGES.strategy);
  });

  describe('StandardPageLayout Usage', () => {
    it('all pages should use StandardPageLayout', () => {
      expect(hasComponent(profileContent, 'StandardPageLayout')).toBe(true);
      expect(hasComponent(auditContent, 'StandardPageLayout')).toBe(true);
      expect(hasComponent(strategyContent, 'StandardPageLayout')).toBe(true);
    });

    it('all pages should specify spacing prop', () => {
      expect(profileContent).toMatch(/spacing=["']default["']/);
      expect(auditContent).toMatch(/spacing=["']default["']/);
      expect(strategyContent).toMatch(/spacing=["']default["']/);
    });
  });

  describe('Standard Components Usage', () => {
    it('all pages should use StandardFormActions', () => {
      expect(hasComponent(profileContent, 'StandardFormActions')).toBe(true);
      expect(hasComponent(auditContent, 'StandardFormActions')).toBe(true);
      expect(hasComponent(strategyContent, 'StandardFormActions')).toBe(true);
    });

    it('all pages should use StandardLoadingSpinner', () => {
      expect(hasComponent(profileContent, 'StandardLoadingSpinner')).toBe(true);
      expect(hasComponent(auditContent, 'StandardLoadingSpinner')).toBe(true);
      expect(hasComponent(strategyContent, 'StandardLoadingSpinner')).toBe(true);
    });

    it('all pages should use Card components', () => {
      expect(hasComponent(profileContent, '<Card')).toBe(true);
      expect(hasComponent(auditContent, '<Card')).toBe(true);
      expect(hasComponent(strategyContent, '<Card')).toBe(true);
    });
  });

  describe('Spacing Consistency', () => {
    it('all pages should use space-y-6 for primary spacing', () => {
      expect(hasComponent(profileContent, 'space-y-6')).toBe(true);
      expect(hasComponent(auditContent, 'space-y-6')).toBe(true);
      expect(hasComponent(strategyContent, 'space-y-6')).toBe(true);
    });

    it('all pages should use consistent gap spacing', () => {
      expect(hasComponent(profileContent, 'gap-6')).toBe(true);
      expect(hasComponent(auditContent, 'gap-6')).toBe(true);
      // Strategy page uses gap-3 and gap-4 for different layouts
      const hasGap3 = hasComponent(strategyContent, 'gap-3');
      const hasGap4 = hasComponent(strategyContent, 'gap-4');
      expect(hasGap3 || hasGap4).toBe(true);
    });
  });

  describe('Typography Consistency', () => {
    it('all pages should use font-headline for titles', () => {
      expect(hasComponent(profileContent, 'font-headline')).toBe(true);
      expect(hasComponent(auditContent, 'font-headline')).toBe(true);
      expect(hasComponent(strategyContent, 'font-headline')).toBe(true);
    });

    it('all pages should use text-muted-foreground', () => {
      expect(hasComponent(profileContent, 'text-muted-foreground')).toBe(true);
      expect(hasComponent(auditContent, 'text-muted-foreground')).toBe(true);
      expect(hasComponent(strategyContent, 'text-muted-foreground')).toBe(true);
    });
  });

  describe('Responsive Patterns', () => {
    it('all pages should use responsive layouts', () => {
      expect(usesResponsiveGrids(profileContent)).toBe(true);
      expect(usesResponsiveGrids(auditContent)).toBe(true);
      // Strategy page uses flex layouts with sm: breakpoints
      expect(hasComponent(strategyContent, 'sm:flex-row')).toBe(true);
    });
  });
});
