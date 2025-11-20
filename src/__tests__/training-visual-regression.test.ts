/**
 * Training Pages Visual Regression Tests
 * 
 * Tests verify that all Training pages (Lessons, AI Plan) render correctly
 * with standard components and maintain visual consistency.
 * 
 * **Feature: ui-consistency, Task 4.2: Visual Regression Testing**
 * Validates that Training pages render correctly with:
 * - StandardPageLayout with proper spacing
 * - Card components with consistent styling
 * - Proper grid layouts and responsive behavior
 * - Consistent typography and spacing scale
 * - Progress tracking components
 * - Accordion patterns for lessons
 * 
 * **Validates: Requirements AC1, AC2, AC5, AC7**
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

const TRAINING_PAGES = {
  lessons: 'src/app/(app)/training/lessons/page.tsx',
  aiPlan: 'src/app/(app)/training/ai-plan/page.tsx',
};

// Expected standard components
const REQUIRED_COMPONENTS = [
  'StandardPageLayout',
];

// Expected spacing values
const EXPECTED_SPACING = {
  primary: ['space-y-6', 'gap-6'],
  secondary: ['space-y-2', 'space-y-3', 'space-y-4', 'gap-4'],
};

// Expected responsive patterns
const EXPECTED_GRID_PATTERNS = [
  'grid-cols-1',
  'grid-cols-2',
  'md:grid-cols-2',
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
// Training Lessons Page Tests
// ============================================================================

describe('Training Lessons Page Visual Regression', () => {
  let lessonsContent: string;

  beforeAll(() => {
    lessonsContent = readPageContent(TRAINING_PAGES.lessons);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(hasComponent(lessonsContent, 'StandardPageLayout')).toBe(true);
    });

    it('should use Card components for content organization', () => {
      expect(hasComponent(lessonsContent, '<Card')).toBe(true);
      expect(hasComponent(lessonsContent, 'CardHeader')).toBe(true);
      expect(hasComponent(lessonsContent, 'CardContent')).toBe(true);
      expect(hasComponent(lessonsContent, 'CardTitle')).toBe(true);
      expect(hasComponent(lessonsContent, 'CardDescription')).toBe(true);
    });

    it('should use Accordion for lesson modules', () => {
      expect(hasComponent(lessonsContent, '<Accordion')).toBe(true);
      expect(hasComponent(lessonsContent, 'AccordionItem')).toBe(true);
      expect(hasComponent(lessonsContent, 'AccordionTrigger')).toBe(true);
      expect(hasComponent(lessonsContent, 'AccordionContent')).toBe(true);
    });

    it('should use Tabs for marketing/closing categories', () => {
      expect(hasComponent(lessonsContent, '<Tabs')).toBe(true);
      expect(hasComponent(lessonsContent, 'TabsList')).toBe(true);
      expect(hasComponent(lessonsContent, 'TabsTrigger')).toBe(true);
      expect(hasComponent(lessonsContent, 'TabsContent')).toBe(true);
    });

    it('should use Progress component for tracking', () => {
      expect(hasComponent(lessonsContent, '<Progress')).toBe(true);
    });

    it('should use Badge components for status display', () => {
      expect(hasComponent(lessonsContent, '<Badge')).toBe(true);
    });

    it('should use Quiz component for assessments', () => {
      expect(hasComponent(lessonsContent, '<Quiz')).toBe(true);
    });
  });

  describe('Layout and Spacing', () => {
    it('should specify spacing prop on StandardPageLayout', () => {
      expect(lessonsContent).toMatch(/spacing=["']default["']/);
    });

    it('should use design system spacing scale', () => {
      expect(usesDesignSystemSpacing(lessonsContent)).toBe(true);
    });

    it('should use space-y-3 for accordion items', () => {
      expect(hasComponent(lessonsContent, 'space-y-3')).toBe(true);
    });

    it('should use space-y-4 for card content sections', () => {
      expect(hasComponent(lessonsContent, 'space-y-4')).toBe(true);
    });

    it('should use gap-4 for grid layouts', () => {
      expect(hasComponent(lessonsContent, 'gap-4')).toBe(true);
    });

    it('should use gap-3 for smaller spacing', () => {
      expect(hasComponent(lessonsContent, 'gap-3')).toBe(true);
    });

    it('should use gap-2 for icon-text combinations', () => {
      expect(hasComponent(lessonsContent, 'gap-2')).toBe(true);
    });
  });

  describe('Responsive Behavior', () => {
    it('should use responsive grid layouts', () => {
      expect(usesResponsiveGrids(lessonsContent)).toBe(true);
    });

    it('should use grid-cols-2 for progress metrics', () => {
      expect(hasComponent(lessonsContent, 'grid-cols-2')).toBe(true);
    });

    it('should use responsive text sizing', () => {
      expect(hasComponent(lessonsContent, 'text-base md:text-lg')).toBe(true);
    });

    it('should use responsive display patterns', () => {
      expect(hasComponent(lessonsContent, 'hidden sm:inline')).toBe(true);
      expect(hasComponent(lessonsContent, 'sm:hidden')).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should display overall progress card', () => {
      expect(hasComponent(lessonsContent, 'Your Learning Journey')).toBe(true);
    });

    it('should show completion percentage', () => {
      expect(hasComponent(lessonsContent, 'Overall Progress')).toBe(true);
      expect(hasComponent(lessonsContent, 'completionPercentage')).toBe(true);
    });

    it('should display marketing and closing progress separately', () => {
      expect(hasComponent(lessonsContent, 'marketingCompletionPercentage')).toBe(true);
      expect(hasComponent(lessonsContent, 'closingCompletionPercentage')).toBe(true);
    });

    it('should use Progress component with proper styling', () => {
      expect(hasComponent(lessonsContent, '<Progress')).toBe(true);
      expect(hasComponent(lessonsContent, 'className="h-3"')).toBe(true);
      expect(hasComponent(lessonsContent, 'className="h-2"')).toBe(true);
    });

    it('should show completion badges', () => {
      expect(hasComponent(lessonsContent, 'Completed')).toBe(true);
      expect(hasComponent(lessonsContent, 'Expert')).toBe(true);
    });
  });

  describe('Module Display', () => {
    it('should display module numbers for incomplete modules', () => {
      expect(hasComponent(lessonsContent, 'index + 1')).toBe(true);
    });

    it('should show CheckCircle icon for completed modules', () => {
      expect(hasComponent(lessonsContent, '<CheckCircle')).toBe(true);
    });

    it('should display module metadata', () => {
      expect(hasComponent(lessonsContent, '15-20 min')).toBe(true);
      expect(hasComponent(lessonsContent, 'quiz questions')).toBe(true);
    });

    it('should use Clock and Target icons for metadata', () => {
      expect(hasComponent(lessonsContent, '<Clock')).toBe(true);
      expect(hasComponent(lessonsContent, '<Target')).toBe(true);
    });

    it('should have hover states on accordion items', () => {
      expect(hasComponent(lessonsContent, 'hover:border-primary')).toBe(true);
      expect(hasComponent(lessonsContent, 'group-hover:border-primary')).toBe(true);
    });
  });

  describe('Typography', () => {
    it('should use font-headline for titles', () => {
      expect(hasComponent(lessonsContent, 'font-headline')).toBe(true);
    });

    it('should use text-muted-foreground for secondary text', () => {
      expect(hasComponent(lessonsContent, 'text-muted-foreground')).toBe(true);
    });

    it('should use consistent text sizing', () => {
      expect(hasComponent(lessonsContent, 'text-sm')).toBe(true);
      expect(hasComponent(lessonsContent, 'text-xs')).toBe(true);
      expect(hasComponent(lessonsContent, 'text-lg')).toBe(true);
      expect(hasComponent(lessonsContent, 'text-2xl')).toBe(true);
    });

    it('should use font-semibold for emphasis', () => {
      expect(hasComponent(lessonsContent, 'font-semibold')).toBe(true);
    });

    it('should use font-bold for metrics', () => {
      expect(hasComponent(lessonsContent, 'font-bold')).toBe(true);
    });
  });

  describe('Icons', () => {
    it('should use BookOpen icon for learning journey', () => {
      expect(hasComponent(lessonsContent, '<BookOpen')).toBe(true);
    });

    it('should use TrendingUp icon for marketing', () => {
      expect(hasComponent(lessonsContent, '<TrendingUp')).toBe(true);
    });

    it('should use Handshake icon for closing', () => {
      expect(hasComponent(lessonsContent, '<Handshake')).toBe(true);
    });

    it('should use Award icon for achievements', () => {
      expect(hasComponent(lessonsContent, '<Award')).toBe(true);
    });
  });

  describe('Styling Patterns', () => {
    it('should use gradient backgrounds for hero sections', () => {
      expect(hasComponent(lessonsContent, 'bg-gradient-to-br')).toBe(true);
    });

    it('should use border styling for cards', () => {
      expect(hasComponent(lessonsContent, 'border-2')).toBe(true);
      expect(hasComponent(lessonsContent, 'rounded-lg')).toBe(true);
    });

    it('should use transition effects', () => {
      expect(hasComponent(lessonsContent, 'transition-all')).toBe(true);
      expect(hasComponent(lessonsContent, 'transition-colors')).toBe(true);
      expect(hasComponent(lessonsContent, 'duration-200')).toBe(true);
    });

    it('should use shadow effects for active states', () => {
      expect(hasComponent(lessonsContent, 'shadow-md')).toBe(true);
    });

    it('should use success colors for completed modules', () => {
      expect(hasComponent(lessonsContent, 'bg-green-50')).toBe(true);
      expect(hasComponent(lessonsContent, 'bg-green-500')).toBe(true);
      expect(hasComponent(lessonsContent, 'text-green-700')).toBe(true);
    });
  });

  describe('Content Rendering', () => {
    it('should render module content with dangerouslySetInnerHTML', () => {
      expect(hasComponent(lessonsContent, 'dangerouslySetInnerHTML')).toBe(true);
    });

    it('should use prose classes for content styling', () => {
      expect(hasComponent(lessonsContent, 'prose')).toBe(true);
      expect(hasComponent(lessonsContent, 'prose-sm')).toBe(true);
      expect(hasComponent(lessonsContent, 'prose-invert')).toBe(true);
    });
  });

  describe('Data Integration', () => {
    it('should use useUser hook for authentication', () => {
      expect(hasComponent(lessonsContent, 'useUser')).toBe(true);
    });

    it('should use useQuery hook for progress data', () => {
      expect(hasComponent(lessonsContent, 'useQuery')).toBe(true);
    });

    it('should use useMemo for performance optimization', () => {
      expect(hasComponent(lessonsContent, 'useMemo')).toBe(true);
    });

    it('should handle quiz completion', () => {
      expect(hasComponent(lessonsContent, 'handleQuizComplete')).toBe(true);
    });
  });
});

// ============================================================================
// Training AI Plan Page Tests
// ============================================================================

describe('Training AI Plan Page Visual Regression', () => {
  let aiPlanContent: string;

  beforeAll(() => {
    aiPlanContent = readPageContent(TRAINING_PAGES.aiPlan);
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as root component', () => {
      expect(hasComponent(aiPlanContent, 'StandardPageLayout')).toBe(true);
    });

    it('should use AITrainingPlan component', () => {
      expect(hasComponent(aiPlanContent, '<AITrainingPlan')).toBe(true);
    });
  });

  describe('Layout and Spacing', () => {
    it('should specify spacing prop on StandardPageLayout', () => {
      expect(aiPlanContent).toMatch(/spacing=["']default["']/);
    });

    it('should have descriptive title', () => {
      expect(hasComponent(aiPlanContent, 'AI Training Plan')).toBe(true);
    });

    it('should have descriptive subtitle', () => {
      expect(hasComponent(aiPlanContent, 'personalized training plan')).toBe(true);
    });
  });

  describe('Page Structure', () => {
    it('should be a client component', () => {
      expect(hasComponent(aiPlanContent, "'use client'")).toBe(true);
    });

    it('should import from standard components', () => {
      expect(hasComponent(aiPlanContent, '@/components/standard')).toBe(true);
    });

    it('should import AITrainingPlan component', () => {
      expect(hasComponent(aiPlanContent, '@/components/ai-training-plan')).toBe(true);
    });
  });
});

// ============================================================================
// Cross-Page Consistency Tests
// ============================================================================

describe('Training Cross-Page Consistency', () => {
  let lessonsContent: string;
  let aiPlanContent: string;

  beforeAll(() => {
    lessonsContent = readPageContent(TRAINING_PAGES.lessons);
    aiPlanContent = readPageContent(TRAINING_PAGES.aiPlan);
  });

  describe('StandardPageLayout Usage', () => {
    it('all pages should use StandardPageLayout', () => {
      expect(hasComponent(lessonsContent, 'StandardPageLayout')).toBe(true);
      expect(hasComponent(aiPlanContent, 'StandardPageLayout')).toBe(true);
    });

    it('all pages should specify spacing prop', () => {
      expect(lessonsContent).toMatch(/spacing=["']default["']/);
      expect(aiPlanContent).toMatch(/spacing=["']default["']/);
    });

    it('all pages should have descriptive titles', () => {
      expect(hasComponent(lessonsContent, 'title=')).toBe(true);
      expect(hasComponent(aiPlanContent, 'title=')).toBe(true);
    });

    it('all pages should have descriptions', () => {
      expect(hasComponent(lessonsContent, 'description=')).toBe(true);
      expect(hasComponent(aiPlanContent, 'description=')).toBe(true);
    });
  });

  describe('Client Component Pattern', () => {
    it('all pages should be client components', () => {
      expect(hasComponent(lessonsContent, "'use client'")).toBe(true);
      expect(hasComponent(aiPlanContent, "'use client'")).toBe(true);
    });
  });

  describe('Import Patterns', () => {
    it('all pages should import from standard components', () => {
      expect(hasComponent(lessonsContent, '@/components/standard')).toBe(true);
      expect(hasComponent(aiPlanContent, '@/components/standard')).toBe(true);
    });

    it('all pages should use proper import paths', () => {
      expect(hasComponent(lessonsContent, '@/components/')).toBe(true);
      expect(hasComponent(aiPlanContent, '@/components/')).toBe(true);
    });
  });
});

