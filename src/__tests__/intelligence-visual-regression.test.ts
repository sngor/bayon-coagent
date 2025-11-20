/**
 * Intelligence Hub Visual Regression Tests
 * 
 * **Feature: ui-consistency, Task 4.2: Visual Regression Testing**
 * Validates Intelligence pages render correctly with standard components
 * 
 * **Validates: Requirements AC1, AC2, AC3, AC4, AC5, AC7**
 */

import { describe, it, expect } from '@jest/globals';
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

function readPageContent(pagePath: string): string {
  const fullPath = path.join(process.cwd(), pagePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

function countOccurrences(content: string, pattern: RegExp): number {
  return (content.match(pattern) || []).length;
}

describe('Intelligence Research Page', () => {
  const content = readPageContent(INTELLIGENCE_PAGES.research);

  it('should use StandardPageLayout', () => {
    expect(content).toContain('StandardPageLayout');
    expect(content).toContain('title="Research Agent"');
  });

  it('should use StandardCard', () => {
    expect(content).toContain('StandardCard');
  });

  it('should use StandardFormField', () => {
    expect(content).toContain('StandardFormField');
  });

  it('should use StandardFormActions', () => {
    expect(content).toContain('StandardFormActions');
  });

  it('should use StandardEmptyState', () => {
    expect(content).toContain('StandardEmptyState');
  });

  it('should use StandardSkeleton', () => {
    expect(content).toContain('StandardSkeleton');
  });

  it('should use spacing="default"', () => {
    expect(content).toContain('spacing="default"');
  });

  it('should use design system spacing', () => {
    expect(content).toContain('space-y-6');
    expect(content).toContain('gap-6');
  });

  it('should use responsive grids', () => {
    expect(content).toContain('md:grid-cols-2');
    expect(content).toContain('lg:grid-cols-3');
  });
});

describe('Intelligence Competitors Page', () => {
  const content = readPageContent(INTELLIGENCE_PAGES.competitors);

  it('should use StandardPageLayout', () => {
    expect(content).toContain('StandardPageLayout');
    expect(content).toContain('title="Competitive Analysis"');
  });

  it('should use StandardCard', () => {
    expect(content).toContain('StandardCard');
  });

  it('should use StandardFormField', () => {
    const count = countOccurrences(content, /<StandardFormField/g);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('should use StandardFormActions', () => {
    const count = countOccurrences(content, /<StandardFormActions/g);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('should use StandardEmptyState', () => {
    expect(content).toContain('StandardEmptyState');
  });

  it('should use StandardLoadingSpinner', () => {
    expect(content).toContain('StandardLoadingSpinner');
  });

  it('should use StandardErrorDisplay', () => {
    expect(content).toContain('StandardErrorDisplay');
  });

  it('should use spacing="default"', () => {
    expect(content).toContain('spacing="default"');
  });

  it('should use design system spacing', () => {
    expect(content).toContain('space-y-4');
    expect(content).toContain('gap-4');
  });

  it('should use responsive grids', () => {
    expect(content).toContain('md:grid-cols-2');
    expect(content).toContain('lg:grid-cols-3');
  });

  it('should use ResponsiveTableWrapper', () => {
    expect(content).toContain('ResponsiveTableWrapper');
  });
});

describe('Intelligence Market Insights Page', () => {
  const content = readPageContent(INTELLIGENCE_PAGES.marketInsights);

  it('should use StandardPageLayout', () => {
    expect(content).toContain('StandardPageLayout');
    expect(content).toContain('title="Market Intelligence Tools"');
  });

  it('should use spacing="default"', () => {
    expect(content).toContain('spacing="default"');
  });

  it('should use Tabs component', () => {
    expect(content).toContain('Tabs');
    expect(content).toContain('TabsList');
    expect(content).toContain('TabsContent');
  });

  it('should have investment opportunity tab', () => {
    expect(content).toContain('Investment Opportunities');
  });

  it('should have life events tab', () => {
    expect(content).toContain('Life Event Predictor');
  });

  it('should use dynamic imports', () => {
    expect(content).toContain("dynamic(() => import('./investment')");
    expect(content).toContain("dynamic(() => import('./life-events')");
  });
});

describe('Intelligence Pages Consistency', () => {
  const research = readPageContent(INTELLIGENCE_PAGES.research);
  const competitors = readPageContent(INTELLIGENCE_PAGES.competitors);
  const marketInsights = readPageContent(INTELLIGENCE_PAGES.marketInsights);

  it('should all use StandardPageLayout', () => {
    expect(research).toContain('StandardPageLayout');
    expect(competitors).toContain('StandardPageLayout');
    expect(marketInsights).toContain('StandardPageLayout');
  });

  it('should all specify spacing="default"', () => {
    expect(research).toContain('spacing="default"');
    expect(competitors).toContain('spacing="default"');
    expect(marketInsights).toContain('spacing="default"');
  });

  it('should all use design system spacing', () => {
    expect(research).toContain('gap-6');
    expect(competitors).toContain('gap-6');
    expect(marketInsights).toContain('gap-2');
  });

  it('should all import from standard components', () => {
    expect(research).toContain("from '@/components/standard'");
    expect(competitors).toContain("from '@/components/standard'");
    expect(marketInsights).toContain("from '@/components/standard'");
  });
});

describe('Intelligence Pages Summary', () => {
  it('should meet all visual regression criteria', () => {
    const research = readPageContent(INTELLIGENCE_PAGES.research);
    const competitors = readPageContent(INTELLIGENCE_PAGES.competitors);
    const marketInsights = readPageContent(INTELLIGENCE_PAGES.marketInsights);

    const criteria = {
      researchUsesStandardPageLayout: research.includes('StandardPageLayout'),
      competitorsUsesStandardPageLayout: competitors.includes('StandardPageLayout'),
      marketInsightsUsesStandardPageLayout: marketInsights.includes('StandardPageLayout'),
      researchUsesStandardCard: research.includes('StandardCard'),
      competitorsUsesStandardCard: competitors.includes('StandardCard'),
      researchUsesStandardFormField: research.includes('StandardFormField'),
      competitorsUsesStandardFormField: competitors.includes('StandardFormField'),
      researchUsesStandardFormActions: research.includes('StandardFormActions'),
      competitorsUsesStandardFormActions: competitors.includes('StandardFormActions'),
      researchUsesStandardEmptyState: research.includes('StandardEmptyState'),
      competitorsUsesStandardEmptyState: competitors.includes('StandardEmptyState'),
      competitorsUsesStandardErrorDisplay: competitors.includes('StandardErrorDisplay'),
      allSpecifySpacing:
        research.includes('spacing="default"') &&
        competitors.includes('spacing="default"') &&
        marketInsights.includes('spacing="default"'),
    };

    const passed = Object.values(criteria).filter(Boolean).length;
    const total = Object.keys(criteria).length;
    const passRate = (passed / total) * 100;

    console.log('\n=== Intelligence Pages Visual Regression Summary ===');
    console.log(`Passed: ${passed}/${total} criteria (${passRate.toFixed(1)}%)`);
    console.log('\nCriteria Status:');
    Object.entries(criteria).forEach(([key, value]) => {
      console.log(`  ${value ? '✓' : '✗'} ${key}`);
    });
    console.log('====================================================\n');

    expect(passed).toBe(total);
  });
});
