/**
 * Intelligence Hub Visual Regression Tests
 * 
 * **Feature: ui-consistency, Task 4.2: Visual Regression Testing**
 * Validates Intelligence pages render correctly with standard components
 * 
 * **Validates: Requirements AC1, AC2, AC3, AC4, AC5, AC7**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const INTELLIGENCE_PAGES = {
  research: 'src/app/(app)/intelligence/research/page.tsx',
  competitors: 'src/app/(app)/intelligence/competitors/page.tsx',
  marketInsights: 'src/app/(app)/intelligence/market-insights/page.tsx',
};

const REQUIRED_COMPONENTS = [
  'StandardPageLayout',
  'StandardCard',
  'StandardFormField',
  'StandardFormActions',
  'StandardLoadingSpinner',
  'StandardEmptyState',
];

const EXPECTED_SPACING = {
  primary: ['space-y-6', 'gap-6'],
  secondary: ['space-y-4', 'gap-4'],
};

const EXPECTED_GRID_PATTERNS = [
  'grid-cols-1',
  'md:grid-cols-2',
  'lg:grid-cols-3',
];

function readPageContent(pagePath: string): string {
  const fullPath = path.join(process.cwd(), pagePath);
  return fs.readFileSync(fullPath, 'utf-8');
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
// Intelligence Research Page Tests
// ============================================================================

describe('Intelligence Research Page Visual Regression', () => {
  let researchContent: string;

  beforeAll(() => {
    researchContent = readPageContent(INTELLIGENCE_PAGES.research);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(researchContent).toContain('StandardPageLayout');
      expect(researchContent).toMatch(/title=["']Research Agent["']/);
      expect(researchContent).toMatch(/description=/);
    });

    it('should import all required standard components', () => {
      REQUIRED_COMPONENTS.forEach((component) => {
        expect(researchContent).toContain(component);
      });
    });

    it('should use StandardCard for form section', () => {
      expect(researchContent).toContain('<StandardCard');
      expect(researchContent).toContain('New Research Task');
    });

    it('should use StandardFormField for research topic input', () => {
      expect(researchContent).toContain('<StandardFormField');
      expect(researchContent).toContain('Research Topic');
    });

    it('should use StandardFormActions for submit button', () => {
      expect(researchContent).toContain('<StandardFormActions');
      expect(researchContent).toContain('Start Research');
    });

    it('should use StandardSkeleton for loading states', () => {
      expect(researchContent).toContain('StandardSkeleton');
      expect(researchContent).toContain('variant="card"');
    });

    it('should use StandardEmptyState for empty reports', () => {
      expect(researchContent).toContain('StandardEmptyState');
      expect(researchContent).toContain('Your Knowledge Base is Empty');
    });
  });

  describe('Spacing Consistency', () => {
    it('should use primary spacing (space-y-6, gap-6)', () => {
      expect(researchContent).toContain('space-y-6');
      expect(researchContent).toContain('gap-6');
    });

    it('should specify spacing prop on StandardPageLayout', () => {
      expect(researchContent).toMatch(/spacing=["']default["']/);
    });

    it('should use design system spacing values', () => {
      expect(usesDesignSystemSpacing(researchContent)).toBe(true);
    });

    it('should use space-y-4 for form fields', () => {
      expect(researchContent).toContain('space-y-4');
    });
  });

  describe('Responsive Layout', () => {
    it('should use responsive grid patterns', () => {
      expect(usesResponsiveGrids(researchContent)).toBe(true);
    });

    it('should have 3-column grid for reports', () => {
      expect(researchContent).toContain('md:grid-cols-2');
      expect(researchContent).toContain('lg:grid-cols-3');
    });

    it('should have mobile-first grid layout', () => {
      expect(researchContent).toContain('grid-cols-1');
    });
  });


  describe('Form Patterns', () => {
    it('should use StandardFormField with label', () => {
      expect(researchContent).toMatch(/label=["']Research Topic["']/);
    });

    it('should use StandardFormField with error handling', () => {
      expect(researchContent).toContain('error=');
    });

    it('should use StandardFormField with hint text', () => {
      expect(researchContent).toContain('hint=');
    });

    it('should use AI variant for primary action', () => {
      expect(researchContent).toContain("variant: 'ai'");
    });

    it('should handle loading states in form actions', () => {
      expect(researchContent).toContain('loading:');
    });
  });

  describe('Search Functionality', () => {
    it('should have SearchInput component', () => {
      expect(researchContent).toContain('SearchInput');
      expect(researchContent).toContain('Search recent reports');
    });

    it('should use NoResultsEmptyState for no search results', () => {
      expect(researchContent).toContain('NoResultsEmptyState');
    });

    it('should use filterBySearch utility', () => {
      expect(researchContent).toContain('filterBySearch');
    });

    it('should use highlightMatches for search highlighting', () => {
      expect(researchContent).toContain('highlightMatches');
    });
  });

  describe('Loading States', () => {
    it('should use StandardSkeleton for loading reports', () => {
      expect(researchContent).toContain('isLoadingReports');
      expect(researchContent).toContain('<StandardSkeleton');
    });

    it('should show loading state during form submission', () => {
      expect(researchContent).toContain('isPending');
      expect(researchContent).toContain('useActionState');
    });
  });

  describe('Empty States', () => {
    it('should use StandardEmptyState with icon', () => {
      expect(researchContent).toContain('icon={<Library');
    });

    it('should have descriptive empty state message', () => {
      expect(researchContent).toContain("You haven't saved any research reports yet");
    });
  });

  describe('Card Patterns', () => {
    it('should use Card components for report items', () => {
      expect(researchContent).toContain('<Card');
      expect(researchContent).toContain('card-interactive');
    });

    it('should have CardHeader with title', () => {
      expect(researchContent).toContain('CardHeader');
      expect(researchContent).toContain('CardTitle');
    });

    it('should have CardFooter with metadata', () => {
      expect(researchContent).toContain('CardFooter');
      expect(researchContent).toContain('Calendar');
    });
  });

  describe('Typography', () => {
    it('should use font-headline for titles', () => {
      expect(researchContent).toContain('font-headline');
    });

    it('should use proper text sizing', () => {
      expect(researchContent).toContain('text-2xl');
      expect(researchContent).toContain('text-xl');
    });

    it('should use muted-foreground for secondary text', () => {
      expect(researchContent).toContain('text-muted-foreground');
    });
  });
});


// ============================================================================
// Intelligence Competitors Page Tests
// ============================================================================

describe('Intelligence Competitors Page Visual Regression', () => {
  let competitorsContent: string;

  beforeAll(() => {
    competitorsContent = readPageContent(INTELLIGENCE_PAGES.competitors);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(competitorsContent).toContain('StandardPageLayout');
      expect(competitorsContent).toMatch(/title=["']Competitive Analysis["']/);
      expect(competitorsContent).toMatch(/description=/);
    });

    it('should import all required standard components', () => {
      REQUIRED_COMPONENTS.forEach((component) => {
        expect(competitorsContent).toContain(component);
      });
    });

    it('should use StandardCard for AI discovery section', () => {
      expect(competitorsContent).toContain('<StandardCard');
      expect(competitorsContent).toContain('AI Competitor Discovery');
    });

    it('should use StandardFormField for form inputs', () => {
      const formFieldCount = countOccurrences(competitorsContent, /<StandardFormField/g);
      expect(formFieldCount).toBeGreaterThanOrEqual(2);
    });

    it('should use StandardFormActions for submit buttons', () => {
      const formActionsCount = countOccurrences(competitorsContent, /<StandardFormActions/g);
      expect(formActionsCount).toBeGreaterThanOrEqual(2);
    });

    it('should use StandardLoadingSpinner for loading states', () => {
      expect(competitorsContent).toContain('StandardLoadingSpinner');
    });

    it('should use StandardEmptyState for no competitors', () => {
      expect(competitorsContent).toContain('StandardEmptyState');
      expect(competitorsContent).toContain('No Competitors Yet');
    });

    it('should use StandardErrorDisplay for errors', () => {
      expect(competitorsContent).toContain('StandardErrorDisplay');
    });
  });

  describe('Spacing Consistency', () => {
    it('should use primary spacing (space-y-6, gap-6)', () => {
      expect(competitorsContent).toContain('space-y-6');
      expect(competitorsContent).toContain('gap-6');
    });

    it('should specify spacing prop on StandardPageLayout', () => {
      expect(competitorsContent).toMatch(/spacing=["']default["']/);
    });

    it('should use design system spacing values', () => {
      expect(usesDesignSystemSpacing(competitorsContent)).toBe(true);
    });

    it('should use space-y-4 for form sections', () => {
      expect(competitorsContent).toContain('space-y-4');
    });

    it('should use gap-4 for grid layouts', () => {
      expect(competitorsContent).toContain('gap-4');
    });
  });

  describe('Responsive Layout', () => {
    it('should use responsive grid patterns', () => {
      expect(usesResponsiveGrids(competitorsContent)).toBe(true);
    });

    it('should have 3-column grid layout', () => {
      expect(competitorsContent).toContain('lg:grid-cols-3');
    });

    it('should have 2-column form layout', () => {
      expect(competitorsContent).toContain('md:grid-cols-2');
    });

    it('should have mobile-first approach', () => {
      expect(competitorsContent).toContain('grid-cols-1');
    });
  });


  describe('Form Patterns', () => {
    it('should use StandardFormField with labels', () => {
      expect(competitorsContent).toContain('Your Agent Name');
      expect(competitorsContent).toContain('Your Agency Name');
    });

    it('should use StandardFormField with hints', () => {
      expect(competitorsContent).toContain('hint=');
    });

    it('should use StandardFormField with error handling', () => {
      expect(competitorsContent).toContain('error=');
    });

    it('should use AI variant for primary actions', () => {
      expect(competitorsContent).toContain("variant: 'ai'");
    });

    it('should handle loading states', () => {
      expect(competitorsContent).toContain('loading:');
      expect(competitorsContent).toContain('disabled:');
    });
  });

  describe('Table Component', () => {
    it('should use ResponsiveTableWrapper', () => {
      expect(competitorsContent).toContain('ResponsiveTableWrapper');
      expect(competitorsContent).toContain('mobileLayout="scroll"');
    });

    it('should have proper table structure', () => {
      expect(competitorsContent).toContain('<Table>');
      expect(competitorsContent).toContain('TableHeader');
      expect(competitorsContent).toContain('TableBody');
      expect(competitorsContent).toContain('TableRow');
    });

    it('should show loading state in table', () => {
      expect(competitorsContent).toContain('isLoadingTable');
      expect(competitorsContent).toContain('StandardLoadingSpinner');
    });

    it('should show empty state in table', () => {
      expect(competitorsContent).toContain('allCompetitors.length === 0');
      expect(competitorsContent).toContain('StandardEmptyState');
    });
  });

  describe('Chart Component', () => {
    it('should use ChartContainer for visualization', () => {
      expect(competitorsContent).toContain('ChartContainer');
      expect(competitorsContent).toContain('chartConfig');
    });

    it('should use BarChart for review volume', () => {
      expect(competitorsContent).toContain('BarChart');
      expect(competitorsContent).toContain('Review Volume');
    });

    it('should have chart configuration', () => {
      expect(competitorsContent).toContain('const chartConfig');
      expect(competitorsContent).toContain('reviewCount');
    });
  });

  describe('AI Suggestions', () => {
    it('should display AI suggestions in grid', () => {
      expect(competitorsContent).toContain('AI Suggestions');
      expect(competitorsContent).toContain('findState.data');
    });

    it('should use Card for suggestion items', () => {
      expect(competitorsContent).toContain('card-interactive');
    });

    it('should have add to tracker button', () => {
      expect(competitorsContent).toContain('Add to Tracker');
      expect(competitorsContent).toContain('handleAddSuggestion');
    });
  });

  describe('Error Handling', () => {
    it('should use StandardErrorDisplay for form errors', () => {
      const errorDisplayCount = countOccurrences(competitorsContent, /<StandardErrorDisplay/g);
      expect(errorDisplayCount).toBeGreaterThanOrEqual(2);
    });

    it('should handle error messages from state', () => {
      expect(competitorsContent).toContain('.message');
      expect(competitorsContent).toContain("!== 'success'");
    });

    it('should display error titles', () => {
      expect(competitorsContent).toContain('Discovery Failed');
      expect(competitorsContent).toContain('Ranking Analysis Failed');
    });
  });

  describe('Typography', () => {
    it('should use font-headline for titles', () => {
      expect(competitorsContent).toContain('font-headline');
    });

    it('should use proper heading hierarchy', () => {
      expect(competitorsContent).toContain('CardTitle');
      expect(competitorsContent).toContain('CardDescription');
    });

    it('should use muted-foreground for secondary text', () => {
      expect(competitorsContent).toContain('text-muted-foreground');
    });
  });
});


// ============================================================================
// Intelligence Market Insights Page Tests
// ============================================================================

describe('Intelligence Market Insights Page Visual Regression', () => {
  let marketInsightsContent: string;

  beforeAll(() => {
    marketInsightsContent = readPageContent(INTELLIGENCE_PAGES.marketInsights);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(marketInsightsContent).toContain('StandardPageLayout');
      expect(marketInsightsContent).toMatch(/title=["']Market Intelligence Tools["']/);
      expect(marketInsightsContent).toMatch(/description=/);
    });

    it('should specify spacing prop on StandardPageLayout', () => {
      expect(marketInsightsContent).toMatch(/spacing=["']default["']/);
    });

    it('should use Tabs component for navigation', () => {
      expect(marketInsightsContent).toContain('Tabs');
      expect(marketInsightsContent).toContain('TabsList');
      expect(marketInsightsContent).toContain('TabsContent');
      expect(marketInsightsContent).toContain('TabsTrigger');
    });

    it('should have investment opportunity tab', () => {
      expect(marketInsightsContent).toContain('investment');
      expect(marketInsightsContent).toContain('Investment Opportunities');
      expect(marketInsightsContent).toContain('TrendingUp');
    });

    it('should have life events tab', () => {
      expect(marketInsightsContent).toContain('life-events');
      expect(marketInsightsContent).toContain('Life Event Predictor');
      expect(marketInsightsContent).toContain('HeartPulse');
    });
  });

  describe('Dynamic Imports', () => {
    it('should use dynamic imports for tool components', () => {
      expect(marketInsightsContent).toContain("dynamic(() => import('./investment')");
      expect(marketInsightsContent).toContain("dynamic(() => import('./life-events')");
    });

    it('should have loading states for dynamic imports', () => {
      expect(marketInsightsContent).toContain('loading:');
      expect(marketInsightsContent).toContain('Loading...');
    });
  });

  describe('Tab Navigation', () => {
    it('should manage active tab state', () => {
      expect(marketInsightsContent).toContain('activeTab');
      expect(marketInsightsContent).toContain('setActiveTab');
    });

    it('should sync with URL search params', () => {
      expect(marketInsightsContent).toContain('useSearchParams');
      expect(marketInsightsContent).toContain('toolParam');
    });

    it('should have proper tab structure', () => {
      expect(marketInsightsContent).toContain('value={activeTab}');
      expect(marketInsightsContent).toContain('onValueChange={setActiveTab}');
    });
  });

  describe('Spacing Consistency', () => {
    it('should use design system spacing', () => {
      expect(marketInsightsContent).toContain('space-y-6');
    });

    it('should use gap spacing for tabs', () => {
      expect(marketInsightsContent).toContain('gap-2');
    });

    it('should have proper margin for tab content', () => {
      expect(marketInsightsContent).toContain('mt-6');
    });
  });

  describe('Responsive Layout', () => {
    it('should have responsive tab layout', () => {
      expect(marketInsightsContent).toContain('grid-cols-2');
      expect(marketInsightsContent).toContain('max-w-md');
    });

    it('should use client-side rendering', () => {
      expect(marketInsightsContent).toContain("'use client'");
    });
  });

  describe('Icons', () => {
    it('should use lucide-react icons', () => {
      expect(marketInsightsContent).toContain("from 'lucide-react'");
    });

    it('should have proper icon sizing', () => {
      expect(marketInsightsContent).toContain('h-4 w-4');
    });

    it('should use icons in tabs', () => {
      expect(marketInsightsContent).toContain('flex items-center gap-2');
    });
  });

  describe('Typography', () => {
    it('should have proper page title', () => {
      expect(marketInsightsContent).toContain('Market Intelligence Tools');
    });

    it('should have descriptive subtitle', () => {
      expect(marketInsightsContent).toContain('Advanced AI tools');
    });
  });
});


// ============================================================================
// Cross-Page Consistency Tests
// ============================================================================

describe('Intelligence Pages Cross-Page Consistency', () => {
  let researchContent: string;
  let competitorsContent: string;
  let marketInsightsContent: string;

  beforeAll(() => {
    researchContent = readPageContent(INTELLIGENCE_PAGES.research);
    competitorsContent = readPageContent(INTELLIGENCE_PAGES.competitors);
    marketInsightsContent = readPageContent(INTELLIGENCE_PAGES.marketInsights);
  });

  describe('StandardPageLayout Usage', () => {
    it('should all use StandardPageLayout', () => {
      expect(researchContent).toContain('StandardPageLayout');
      expect(competitorsContent).toContain('StandardPageLayout');
      expect(marketInsightsContent).toContain('StandardPageLayout');
    });

    it('should all specify spacing prop', () => {
      expect(researchContent).toMatch(/spacing=["']default["']/);
      expect(competitorsContent).toMatch(/spacing=["']default["']/);
      expect(marketInsightsContent).toMatch(/spacing=["']default["']/);
    });

    it('should all have title and description', () => {
      [researchContent, competitorsContent, marketInsightsContent].forEach((content) => {
        expect(content).toMatch(/title=/);
        expect(content).toMatch(/description=/);
      });
    });
  });

  describe('Standard Components Usage', () => {
    it('should all use StandardCard', () => {
      expect(researchContent).toContain('StandardCard');
      expect(competitorsContent).toContain('StandardCard');
    });

    it('should all use StandardFormField', () => {
      expect(researchContent).toContain('StandardFormField');
      expect(competitorsContent).toContain('StandardFormField');
    });

    it('should all use StandardFormActions', () => {
      expect(researchContent).toContain('StandardFormActions');
      expect(competitorsContent).toContain('StandardFormActions');
    });

    it('should all use StandardEmptyState', () => {
      expect(researchContent).toContain('StandardEmptyState');
      expect(competitorsContent).toContain('StandardEmptyState');
    });

    it('should all use StandardLoadingSpinner', () => {
      expect(researchContent).toContain('StandardLoadingSpinner');
      expect(competitorsContent).toContain('StandardLoadingSpinner');
    });
  });

  describe('Spacing Consistency', () => {
    it('should all use design system spacing', () => {
      expect(usesDesignSystemSpacing(researchContent)).toBe(true);
      expect(usesDesignSystemSpacing(competitorsContent)).toBe(true);
      expect(usesDesignSystemSpacing(marketInsightsContent)).toBe(true);
    });

    it('should all use primary spacing (gap-6, space-y-6)', () => {
      [researchContent, competitorsContent, marketInsightsContent].forEach((content) => {
        const hasPrimarySpacing = content.includes('gap-6') || content.includes('space-y-6');
        expect(hasPrimarySpacing).toBe(true);
      });
    });
  });

  describe('Responsive Patterns', () => {
    it('should all use responsive grid patterns', () => {
      expect(usesResponsiveGrids(researchContent)).toBe(true);
      expect(usesResponsiveGrids(competitorsContent)).toBe(true);
    });

    it('should all use mobile-first approach', () => {
      [researchContent, competitorsContent].forEach((content) => {
        const hasMobileFirst = 
          content.includes('grid-cols-1') || 
          content.includes('grid gap-6');
        expect(hasMobileFirst).toBe(true);
      });
    });
  });

  describe('Import Consistency', () => {
    it('should all import from standard components', () => {
      expect(researchContent).toContain("from '@/components/standard'");
      expect(competitorsContent).toContain("from '@/components/standard'");
      expect(marketInsightsContent).toContain("from '@/components/standard'");
    });

    it('should all use client-side rendering', () => {
      expect(researchContent).toContain("'use client'");
      expect(competitorsContent).toContain("'use client'");
      expect(marketInsightsContent).toContain("'use client'");
    });
  });

  describe('Form Patterns', () => {
    it('should use AI variant for primary actions', () => {
      expect(researchContent).toContain("variant: 'ai'");
      expect(competitorsContent).toContain("variant: 'ai'");
    });

    it('should handle loading states consistently', () => {
      expect(researchContent).toContain('loading:');
      expect(competitorsContent).toContain('loading:');
    });

    it('should handle disabled states consistently', () => {
      expect(researchContent).toContain('disabled:');
      expect(competitorsContent).toContain('disabled:');
    });
  });

  describe('Typography Consistency', () => {
    it('should all use font-headline for titles', () => {
      expect(researchContent).toContain('font-headline');
      expect(competitorsContent).toContain('font-headline');
    });

    it('should all use muted-foreground for secondary text', () => {
      expect(researchContent).toContain('text-muted-foreground');
      expect(competitorsContent).toContain('text-muted-foreground');
    });
  });
});


// ============================================================================
// Summary Test
// ============================================================================

describe('Intelligence Pages Overall Quality', () => {
  it('should meet all visual regression criteria', () => {
    const researchContent = readPageContent(INTELLIGENCE_PAGES.research);
    const competitorsContent = readPageContent(INTELLIGENCE_PAGES.competitors);
    const marketInsightsContent = readPageContent(INTELLIGENCE_PAGES.marketInsights);

    const criteria = {
      researchUsesStandardPageLayout: researchContent.includes('StandardPageLayout'),
      competitorsUsesStandardPageLayout: competitorsContent.includes('StandardPageLayout'),
      marketInsightsUsesStandardPageLayout: marketInsightsContent.includes('StandardPageLayout'),
      researchUsesStandardCard: researchContent.includes('StandardCard'),
      competitorsUsesStandardCard: competitorsContent.includes('StandardCard'),
      researchUsesStandardFormField: researchContent.includes('StandardFormField'),
      competitorsUsesStandardFormField: competitorsContent.includes('StandardFormField'),
      researchUsesStandardFormActions: researchContent.includes('StandardFormActions'),
      competitorsUsesStandardFormActions: competitorsContent.includes('StandardFormActions'),
      researchUsesStandardEmptyState: researchContent.includes('StandardEmptyState'),
      competitorsUsesStandardEmptyState: competitorsContent.includes('StandardEmptyState'),
      researchUsesStandardLoadingSpinner: researchContent.includes('StandardLoadingSpinner'),
      competitorsUsesStandardLoadingSpinner: competitorsContent.includes('StandardLoadingSpinner'),
      competitorsUsesStandardErrorDisplay: competitorsContent.includes('StandardErrorDisplay'),
      researchUsesDesignSpacing: usesDesignSystemSpacing(researchContent),
      competitorsUsesDesignSpacing: usesDesignSystemSpacing(competitorsContent),
      marketInsightsUsesDesignSpacing: usesDesignSystemSpacing(marketInsightsContent),
      researchUsesResponsiveGrids: usesResponsiveGrids(researchContent),
      competitorsUsesResponsiveGrids: usesResponsiveGrids(competitorsContent),
      allSpecifySpacing:
        researchContent.includes('spacing="default"') &&
        competitorsContent.includes('spacing="default"') &&
        marketInsightsContent.includes('spacing="default"'),
    };

    const passedCriteria = Object.values(criteria).filter(Boolean).length;
    const totalCriteria = Object.keys(criteria).length;
    const passRate = (passedCriteria / totalCriteria) * 100;

    console.log('\n=== Intelligence Pages Visual Regression Summary ===');
    console.log(`Passed: ${passedCriteria}/${totalCriteria} criteria (${passRate.toFixed(1)}%)`);
    console.log('\nCriteria Status:');
    Object.entries(criteria).forEach(([key, value]) => {
      console.log(`  ${value ? '✓' : '✗'} ${key}`);
    });
    console.log('====================================================\n');

    expect(passedCriteria).toBe(totalCriteria);
  });
});
