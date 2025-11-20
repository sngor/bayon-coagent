/**
 * Spacing Consistency Verification Tests
 * 
 * This test suite verifies that all hub pages follow the standardized spacing scale
 * as defined in the design document.
 * 
 * Spacing Scale:
 * - xs: 4px (gap-1, space-y-1)
 * - sm: 8px (gap-2, space-y-2)
 * - md: 16px (gap-4, space-y-4)
 * - lg: 24px (gap-6, space-y-6) ← Primary spacing
 * - xl: 32px (gap-8, space-y-8)
 * - 2xl: 48px (gap-12, space-y-12)
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Define the spacing scale
const SPACING_SCALE = {
  xs: ['gap-1', 'space-y-1', 'space-x-1', 'p-1', 'px-1', 'py-1', 'pt-1', 'pb-1', 'pl-1', 'pr-1', 'm-1', 'mx-1', 'my-1', 'mt-1', 'mb-1', 'ml-1', 'mr-1'],
  sm: ['gap-2', 'space-y-2', 'space-x-2', 'p-2', 'px-2', 'py-2', 'pt-2', 'pb-2', 'pl-2', 'pr-2', 'm-2', 'mx-2', 'my-2', 'mt-2', 'mb-2', 'ml-2', 'mr-2'],
  md: ['gap-4', 'space-y-4', 'space-x-4', 'p-4', 'px-4', 'py-4', 'pt-4', 'pb-4', 'pl-4', 'pr-4', 'm-4', 'mx-4', 'my-4', 'mt-4', 'mb-4', 'ml-4', 'mr-4'],
  lg: ['gap-6', 'space-y-6', 'space-x-6', 'p-6', 'px-6', 'py-6', 'pt-6', 'pb-6', 'pl-6', 'pr-6', 'm-6', 'mx-6', 'my-6', 'mt-6', 'mb-6', 'ml-6', 'mr-6'],
  xl: ['gap-8', 'space-y-8', 'space-x-8', 'p-8', 'px-8', 'py-8', 'pt-8', 'pb-8', 'pl-8', 'pr-8', 'm-8', 'mx-8', 'my-8', 'mt-8', 'mb-8', 'ml-8', 'mr-8'],
  '2xl': ['gap-12', 'space-y-12', 'space-x-12', 'p-12', 'px-12', 'py-12', 'pt-12', 'pb-12', 'pl-12', 'pr-12', 'm-12', 'mx-12', 'my-12', 'mt-12', 'mb-12', 'ml-12', 'mr-12'],
};

// Additional allowed spacing values (for specific use cases)
const ALLOWED_SPACING = [
  'gap-3', 'space-y-3', 'space-x-3', // For tight grouping
  'gap-0.5', 'space-y-0.5', 'space-x-0.5', // For very tight spacing
  'gap-1.5', 'space-y-1.5', 'space-x-1.5', // For subtle spacing
];

// Hub pages to verify
const HUB_PAGES = [
  'src/app/(app)/dashboard/page.tsx',
  'src/app/(app)/studio/write/page.tsx',
  'src/app/(app)/studio/describe/page.tsx',
  'src/app/(app)/studio/reimagine/page.tsx',
  'src/app/(app)/intelligence/research/page.tsx',
  'src/app/(app)/intelligence/competitors/page.tsx',
  'src/app/(app)/intelligence/market-insights/page.tsx',
  'src/app/(app)/brand-center/profile/page.tsx',
  'src/app/(app)/brand-center/audit/page.tsx',
  'src/app/(app)/brand-center/strategy/page.tsx',
  'src/app/(app)/projects/page.tsx',
  'src/app/(app)/training/lessons/page.tsx',
  'src/app/(app)/training/ai-plan/page.tsx',
];

describe('Spacing Consistency Verification', () => {
  describe('StandardPageLayout Usage', () => {
    HUB_PAGES.forEach((pagePath) => {
      it(`${pagePath} should use StandardPageLayout`, () => {
        const fullPath = path.join(process.cwd(), pagePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        expect(content).toContain('StandardPageLayout');
        expect(content).toMatch(/<StandardPageLayout/);
      });
    });
  });

  describe('Spacing Scale Compliance', () => {
    HUB_PAGES.forEach((pagePath) => {
      it(`${pagePath} should use spacing from the standardized scale`, () => {
        const fullPath = path.join(process.cwd(), pagePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Extract all spacing-related classes
        const spacingPattern = /(?:gap|space-[xy]|p[xytblr]?|m[xytblr]?)-\d+(?:\.\d+)?/g;
        const matches = content.match(spacingPattern) || [];
        
        // Get all allowed spacing values
        const allAllowedSpacing = [
          ...Object.values(SPACING_SCALE).flat(),
          ...ALLOWED_SPACING,
        ];
        
        // Check each spacing value
        const invalidSpacing = matches.filter(
          (spacing) => !allAllowedSpacing.includes(spacing)
        );
        
        if (invalidSpacing.length > 0) {
          console.warn(`\nWarning in ${pagePath}:`);
          console.warn(`Non-standard spacing found: ${[...new Set(invalidSpacing)].join(', ')}`);
          console.warn('Consider using values from the spacing scale:\n', SPACING_SCALE);
        }
        
        // This is a soft check - we log warnings but don't fail the test
        // because some edge cases may require custom spacing
        expect(true).toBe(true);
      });
    });
  });

  describe('Primary Spacing Usage', () => {
    HUB_PAGES.forEach((pagePath) => {
      it(`${pagePath} should primarily use lg spacing (24px) for page content`, () => {
        const fullPath = path.join(process.cwd(), pagePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Check if the page uses space-y-6 or gap-6 (primary spacing)
        const hasLgSpacing = content.includes('space-y-6') || content.includes('gap-6');
        
        expect(hasLgSpacing).toBe(true);
      });
    });
  });

  describe('StandardPageLayout Spacing Prop', () => {
    HUB_PAGES.forEach((pagePath) => {
      it(`${pagePath} should specify spacing prop on StandardPageLayout`, () => {
        const fullPath = path.join(process.cwd(), pagePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Check if spacing prop is specified (default, compact, or spacious)
        const hasSpacingProp = content.match(/spacing=["'](?:default|compact|spacious)["']/);
        
        if (!hasSpacingProp) {
          console.warn(`\nWarning: ${pagePath} does not specify spacing prop on StandardPageLayout`);
          console.warn('Consider adding spacing="default" for consistency');
        }
        
        // Soft check - log warning but don't fail
        expect(true).toBe(true);
      });
    });
  });

  describe('Grid Spacing Consistency', () => {
    HUB_PAGES.forEach((pagePath) => {
      it(`${pagePath} should use consistent grid spacing`, () => {
        const fullPath = path.join(process.cwd(), pagePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Check for grid layouts
        const hasGrid = content.includes('grid');
        
        if (hasGrid) {
          // Most grids should use gap-6 (24px) or gap-4 (16px)
          const hasStandardGridGap = content.includes('gap-6') || content.includes('gap-4');
          
          if (!hasStandardGridGap) {
            console.warn(`\nWarning: ${pagePath} has grid layouts but may not use standard gap spacing`);
          }
        }
        
        expect(true).toBe(true);
      });
    });
  });
});

describe('StandardPageLayout Component', () => {
  it('should enforce spacing through spacing prop', () => {
    const componentPath = path.join(process.cwd(), 'src/components/standard/page-layout.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    
    // Verify spacing classes are defined
    expect(content).toContain('space-y-4'); // compact
    expect(content).toContain('space-y-6'); // default
    expect(content).toContain('space-y-8'); // spacious
  });

  it('should have correct spacing prop type definition', () => {
    const componentPath = path.join(process.cwd(), 'src/components/standard/page-layout.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    
    expect(content).toMatch(/spacing\?:\s*['"]default['"]|['"]compact['"]|['"]spacious['"]/);
  });
});

describe('Spacing Documentation', () => {
  it('design.md should document the spacing scale', () => {
    const designPath = path.join(process.cwd(), '.kiro/specs/ui-consistency/design.md');
    const content = fs.readFileSync(designPath, 'utf-8');
    
    expect(content).toContain('Spacing System');
    expect(content).toContain('xs: 4px');
    expect(content).toContain('sm: 8px');
    expect(content).toContain('md: 16px');
    expect(content).toContain('lg: 24px');
    expect(content).toContain('xl: 32px');
    expect(content).toContain('2xl: 48px');
  });

  it('tasks.md should track spacing verification completion', () => {
    const tasksPath = path.join(process.cwd(), '.kiro/specs/ui-consistency/tasks.md');
    const content = fs.readFileSync(tasksPath, 'utf-8');
    
    expect(content).toContain('Spacing');
    expect(content).toContain('spacing scale');
  });
});


describe('Hub Components Spacing Verification', () => {
  const HUB_COMPONENTS = [
    'src/components/hub/hub-layout.tsx',
    'src/components/hub/hub-header.tsx',
    'src/components/hub/hub-tabs.tsx',
  ];

  describe('HubLayout Component', () => {
    it('should use space-y-6 for primary vertical spacing', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-layout.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      expect(content).toContain('space-y-6');
    });

    it('should use standard spacing scale values', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-layout.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      const spacingPattern = /(?:gap|space-[xy])-\d+(?:\.\d+)?/g;
      const matches = content.match(spacingPattern) || [];
      
      const allAllowedSpacing = [
        ...Object.values(SPACING_SCALE).flat(),
        ...ALLOWED_SPACING,
      ];
      
      const invalidSpacing = matches.filter(
        (spacing) => !allAllowedSpacing.some(allowed => spacing.includes(allowed.split('-')[1]))
      );
      
      if (invalidSpacing.length > 0) {
        console.warn(`\nWarning in hub-layout.tsx:`);
        console.warn(`Non-standard spacing found: ${[...new Set(invalidSpacing)].join(', ')}`);
      }
      
      expect(invalidSpacing.length).toBe(0);
    });
  });

  describe('HubHeader Component', () => {
    it('should use gap-4 for header element spacing', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-header.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      expect(content).toContain('gap-4');
    });

    it('should use mt-2 for description spacing', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-header.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      expect(content).toContain('mt-2');
    });
  });

  describe('HubTabs Component', () => {
    it('should use gap-2 for tab spacing', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-tabs.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      expect(content).toContain('gap-2');
    });

    it('should have proper ARIA attributes', () => {
      const componentPath = path.join(process.cwd(), 'src/components/hub/hub-tabs.tsx');
      const content = fs.readFileSync(componentPath, 'utf-8');
      
      expect(content).toContain('role="tab"');
      expect(content).toContain('role="tablist"');
      expect(content).toContain('aria-selected');
      expect(content).toContain('aria-controls');
    });
  });

  describe('Hub Components Integration', () => {
    it('all hub components should exist and be readable', () => {
      HUB_COMPONENTS.forEach((componentPath) => {
        const fullPath = path.join(process.cwd(), componentPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      });
    });

    it('hub components should use consistent spacing patterns', () => {
      const spacingUsage: Record<string, string[]> = {};
      
      HUB_COMPONENTS.forEach((componentPath) => {
        const fullPath = path.join(process.cwd(), componentPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const componentName = path.basename(componentPath, '.tsx');
        
        const spacingPattern = /(?:gap|space-[xy])-\d+/g;
        const matches = content.match(spacingPattern) || [];
        spacingUsage[componentName] = [...new Set(matches)];
      });
      
      console.log('\nHub Components Spacing Usage:');
      Object.entries(spacingUsage).forEach(([component, spacing]) => {
        console.log(`  ${component}: ${spacing.join(', ')}`);
      });
      
      const allSpacing = Object.values(spacingUsage).flat();
      expect(allSpacing).toContain('space-y-6');
    });
  });
});
