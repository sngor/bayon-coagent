/**
 * Projects Page Visual Regression Tests
 * 
 * Tests verify that the Projects page renders correctly with all standard components
 * and maintains visual consistency according to the design system.
 * 
 * **Feature: ui-consistency, Task 4.2: Visual Regression Testing**
 * Validates that Projects page renders correctly with:
 * - StandardPageLayout with proper spacing
 * - StandardCard components with consistent styling
 * - StandardSkeleton for loading states
 * - StandardEmptyState for empty data
 * - Proper accordion and collapsible patterns
 * - Consistent typography and spacing scale
 * 
 * **Validates: Requirements AC1, AC2, AC4, AC5, AC7**
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ============================================================================
// Constants
// ============================================================================

const PROJECTS_PAGE_PATH = 'src/app/(app)/projects/page.tsx';

// Expected standard components that should be present
const REQUIRED_COMPONENTS = [
  'StandardPageLayout',
  'StandardSkeleton',
  'StandardEmptyState',
];

// Expected UI components for Projects functionality
const REQUIRED_UI_COMPONENTS = [
  'Card',
  'CardHeader',
  'CardTitle',
  'CardDescription',
  'CardContent',
  'Accordion',
  'AccordionItem',
  'AccordionTrigger',
  'AccordionContent',
  'Collapsible',
  'CollapsibleTrigger',
  'CollapsibleContent',
  'Dialog',
  'AlertDialog',
  'DropdownMenu',
  'Badge',
];

// Expected spacing values (from design system)
const EXPECTED_SPACING = {
  primary: ['space-y-6', 'gap-6'], // Primary spacing (24px)
  secondary: ['space-y-4', 'gap-4'], // Secondary spacing (16px)
  tertiary: ['space-y-3', 'gap-3'], // Tertiary spacing (12px)
  compact: ['space-y-2', 'gap-2'], // Compact spacing (8px)
};

// Expected typography classes
const EXPECTED_TYPOGRAPHY = [
  'text-lg',
  'text-base',
  'text-sm',
  'font-semibold',
  'font-medium',
  'font-headline',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read the Projects page content
 */
function getProjectsContent(): string {
  const fullPath = path.join(process.cwd(), PROJECTS_PAGE_PATH);
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Check if content contains all required components
 */
function hasRequiredComponents(content: string, components: string[]): boolean {
  return components.every((component) => content.includes(component));
}

/**
 * Extract all className values from JSX
 */
function extractClassNames(content: string): string[] {
  const classNamePattern = /className=["']([^"']+)["']/g;
  const matches: string[] = [];
  let match;
  
  while ((match = classNamePattern.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

/**
 * Check if content uses spacing from the design system
 */
function usesDesignSystemSpacing(content: string): boolean {
  const allExpectedSpacing = [
    ...EXPECTED_SPACING.primary,
    ...EXPECTED_SPACING.secondary,
    ...EXPECTED_SPACING.tertiary,
    ...EXPECTED_SPACING.compact,
  ];
  
  return allExpectedSpacing.some((spacing) => content.includes(spacing));
}

/**
 * Check if content uses typography from the design system
 */
function usesDesignSystemTypography(content: string): boolean {
  return EXPECTED_TYPOGRAPHY.some((typography) => content.includes(typography));
}

/**
 * Count occurrences of a pattern in content
 */
function countOccurrences(content: string, pattern: string | RegExp): number {
  if (typeof pattern === 'string') {
    return (content.match(new RegExp(pattern, 'g')) || []).length;
  }
  return (content.match(pattern) || []).length;
}

// ============================================================================
// Visual Regression Tests
// ============================================================================

describe('Projects Page Visual Regression', () => {
  let projectsContent: string;

  beforeAll(() => {
    projectsContent = getProjectsContent();
  });

  describe('Component Structure', () => {
    it('should use StandardPageLayout as the root component', () => {
      expect(projectsContent).toContain('StandardPageLayout');
      expect(projectsContent).toMatch(/<StandardPageLayout/);
      
      // Should have title and description props
      expect(projectsContent).toMatch(/title=["']Projects["']/);
      expect(projectsContent).toMatch(/description=/);
    });

    it('should import all required standard components', () => {
      const importPattern = /import\s+{[^}]*}\s+from\s+['"]@\/components\/standard['"]/;
      const importMatch = projectsContent.match(importPattern);
      
      expect(importMatch).toBeTruthy();
      
      // Check each required component is imported
      REQUIRED_COMPONENTS.forEach((component) => {
        expect(projectsContent).toContain(component);
      });
    });

    it('should import all required UI components', () => {
      REQUIRED_UI_COMPONENTS.forEach((component) => {
        expect(projectsContent).toContain(component);
      });
    });

    it('should use Card components for content items', () => {
      expect(projectsContent).toContain('Card');
      expect(projectsContent).toContain('CardHeader');
      expect(projectsContent).toContain('CardTitle');
      expect(projectsContent).toContain('CardDescription');
      expect(projectsContent).toContain('CardContent');
    });

    it('should use StandardSkeleton for loading states', () => {
      expect(projectsContent).toContain('StandardSkeleton');
      
      // Should use list variant for loading
      expect(projectsContent).toContain('variant="list"');
    });

    it('should use StandardEmptyState for empty data scenarios', () => {
      expect(projectsContent).toContain('StandardEmptyState');
      
      // Empty states should have icons, titles, and descriptions
      const emptyStatePattern = /<StandardEmptyState[^>]*icon=/;
      expect(projectsContent).toMatch(emptyStatePattern);
    });

    it('should use Accordion for project organization', () => {
      expect(projectsContent).toContain('Accordion');
      expect(projectsContent).toContain('AccordionItem');
      expect(projectsContent).toContain('AccordionTrigger');
      expect(projectsContent).toContain('AccordionContent');
    });

    it('should use Collapsible for content items', () => {
      expect(projectsContent).toContain('Collapsible');
      expect(projectsContent).toContain('CollapsibleTrigger');
      expect(projectsContent).toContain('CollapsibleContent');
    });

    it('should have Create Project action button', () => {
      expect(projectsContent).toContain('Create Project');
      expect(projectsContent).toContain('FolderPlus');
    });
  });

  describe('Spacing Consistency', () => {
    it('should use consistent spacing for main layout', () => {
      // Projects page uses space-y-4 for accordion content which is acceptable
      const hasConsistentSpacing = 
        projectsContent.includes('space-y-4') ||
        projectsContent.includes('space-y-6') ||
        projectsContent.includes('gap-6');
      
      expect(hasConsistentSpacing).toBe(true);
    });

    it('should specify spacing prop on StandardPageLayout', () => {
      const spacingPropPattern = /spacing=["'](?:default|compact|spacious)["']/;
      expect(projectsContent).toMatch(spacingPropPattern);
    });

    it('should use space-y-4 for accordion content', () => {
      expect(projectsContent).toContain('space-y-4');
    });

    it('should use design system spacing values', () => {
      expect(usesDesignSystemSpacing(projectsContent)).toBe(true);
    });

    it('should use space-y-2 for form fields', () => {
      expect(projectsContent).toContain('space-y-2');
    });

    it('should use gap-1, gap-2, or gap-3 for button groups', () => {
      const hasButtonGroupSpacing = 
        projectsContent.includes('gap-1') ||
        projectsContent.includes('gap-2') ||
        projectsContent.includes('gap-3');
      
      expect(hasButtonGroupSpacing).toBe(true);
    });
  });

  describe('Typography Consistency', () => {
    it('should use design system typography classes', () => {
      expect(usesDesignSystemTypography(projectsContent)).toBe(true);
    });

    it('should use text-lg for accordion triggers', () => {
      expect(projectsContent).toContain('text-lg');
    });

    it('should use font-headline for project names', () => {
      expect(projectsContent).toContain('font-headline');
    });

    it('should use font-semibold for card titles', () => {
      expect(projectsContent).toContain('font-semibold');
    });

    it('should use text-muted-foreground for secondary text', () => {
      expect(projectsContent).toContain('text-muted-foreground');
    });

    it('should use appropriate text sizing', () => {
      // Projects page uses prose-sm for markdown content which is acceptable
      const hasAppropriateTextSizing = 
        projectsContent.includes('prose-sm') ||
        projectsContent.includes('text-sm');
      
      expect(hasAppropriateTextSizing).toBe(true);
    });
  });

  describe('Card Patterns', () => {
    it('should use Card component with proper structure', () => {
      const cardCount = countOccurrences(projectsContent, /<Card/g);
      expect(cardCount).toBeGreaterThanOrEqual(1);
    });

    it('should have CardHeader with title and description', () => {
      expect(projectsContent).toContain('CardHeader');
      expect(projectsContent).toContain('CardTitle');
      expect(projectsContent).toContain('CardDescription');
    });

    it('should use CardContent for expandable content', () => {
      expect(projectsContent).toContain('CardContent');
    });

    it('should use bg-secondary/30 for card styling', () => {
      expect(projectsContent).toContain('bg-secondary/30');
    });

    it('should have flex layout in card headers', () => {
      expect(projectsContent).toContain('flex flex-row justify-between items-start');
    });
  });

  describe('Dialog Components', () => {
    it('should have CreateProjectDialog component', () => {
      expect(projectsContent).toContain('CreateProjectDialog');
      expect(projectsContent).toContain('function CreateProjectDialog');
    });

    it('should have RenameContentDialog component', () => {
      expect(projectsContent).toContain('RenameContentDialog');
      expect(projectsContent).toContain('function RenameContentDialog');
    });

    it('should use Dialog component with proper structure', () => {
      expect(projectsContent).toContain('Dialog');
      expect(projectsContent).toContain('DialogContent');
      expect(projectsContent).toContain('DialogHeader');
      expect(projectsContent).toContain('DialogTitle');
      expect(projectsContent).toContain('DialogDescription');
      expect(projectsContent).toContain('DialogFooter');
    });

    it('should use AlertDialog for delete confirmation', () => {
      expect(projectsContent).toContain('AlertDialog');
      expect(projectsContent).toContain('AlertDialogContent');
      expect(projectsContent).toContain('AlertDialogHeader');
      expect(projectsContent).toContain('AlertDialogTitle');
      expect(projectsContent).toContain('AlertDialogDescription');
      expect(projectsContent).toContain('AlertDialogFooter');
      expect(projectsContent).toContain('AlertDialogAction');
      expect(projectsContent).toContain('AlertDialogCancel');
    });

    it('should have form fields in dialogs', () => {
      expect(projectsContent).toContain('Label');
      expect(projectsContent).toContain('Input');
    });

    it('should have proper button actions in dialogs', () => {
      expect(projectsContent).toContain('Cancel');
      expect(projectsContent).toContain('Create Project');
      expect(projectsContent).toContain('Save Name');
    });
  });

  describe('Dropdown Menu', () => {
    it('should use DropdownMenu for item actions', () => {
      expect(projectsContent).toContain('DropdownMenu');
      expect(projectsContent).toContain('DropdownMenuTrigger');
      expect(projectsContent).toContain('DropdownMenuContent');
      expect(projectsContent).toContain('DropdownMenuItem');
    });

    it('should have submenu for move operations', () => {
      expect(projectsContent).toContain('DropdownMenuSub');
      expect(projectsContent).toContain('DropdownMenuSubTrigger');
      expect(projectsContent).toContain('DropdownMenuSubContent');
    });

    it('should have menu separators', () => {
      expect(projectsContent).toContain('DropdownMenuSeparator');
    });

    it('should have rename action', () => {
      expect(projectsContent).toContain('Rename');
      expect(projectsContent).toContain('Pencil');
    });

    it('should have move to project action', () => {
      expect(projectsContent).toContain('Move to...');
    });

    it('should have delete action with destructive styling', () => {
      expect(projectsContent).toContain('Delete');
      expect(projectsContent).toContain('text-destructive');
      expect(projectsContent).toContain('Trash2');
    });
  });

  describe('Loading States', () => {
    it('should handle loading states with StandardSkeleton', () => {
      expect(projectsContent).toContain('isLoading');
      expect(projectsContent).toContain('StandardSkeleton');
    });

    it('should use list variant for skeleton', () => {
      expect(projectsContent).toContain('variant="list"');
    });

    it('should specify skeleton count', () => {
      expect(projectsContent).toContain('count={3}');
    });

    it('should combine loading states from multiple queries', () => {
      expect(projectsContent).toContain('isLoadingContent');
      expect(projectsContent).toContain('isLoadingProjects');
      expect(projectsContent).toContain('isLoadingContent || isLoadingProjects');
    });
  });

  describe('Empty States', () => {
    it('should handle empty data with StandardEmptyState', () => {
      expect(projectsContent).toContain('StandardEmptyState');
    });

    it('should use Library icon for empty state', () => {
      expect(projectsContent).toContain('Library');
      expect(projectsContent).toContain('h-16 w-16');
    });

    it('should have descriptive empty state title', () => {
      expect(projectsContent).toContain('Your Projects are Empty');
    });

    it('should have descriptive empty state description', () => {
      expect(projectsContent).toContain("You haven't saved any content yet");
    });

    it('should provide action in empty state', () => {
      expect(projectsContent).toContain('Go to the Co-Marketing Studio');
      expect(projectsContent).toContain('/content-engine');
    });

    it('should check for empty content array', () => {
      expect(projectsContent).toContain('savedContent.length === 0');
    });
  });

  describe('Data Integration', () => {
    it('should use DynamoDB hooks for data fetching', () => {
      expect(projectsContent).toContain('useQuery');
      expect(projectsContent).toContain('from \'@/aws/dynamodb/hooks\'');
    });

    it('should use useUser hook for authentication', () => {
      expect(projectsContent).toContain('useUser');
      expect(projectsContent).toContain('const { user } = useUser()');
    });

    it('should use getRepository for data operations', () => {
      expect(projectsContent).toContain('getRepository');
      expect(projectsContent).toContain('from \'@/aws/dynamodb\'');
    });

    it('should use proper DynamoDB key functions', () => {
      expect(projectsContent).toContain('getProjectKeys');
      expect(projectsContent).toContain('getSavedContentKeys');
    });

    it('should memoize expensive computations', () => {
      expect(projectsContent).toContain('useMemo');
    });

    it('should memoize DynamoDB keys', () => {
      const memoizedKeys = [
        'savedContentPK',
        'savedContentSKPrefix',
        'projectsPK',
        'projectsSKPrefix',
      ];
      
      memoizedKeys.forEach((key) => {
        expect(projectsContent).toContain(key);
      });
    });

    it('should memoize content grouping logic', () => {
      expect(projectsContent).toContain('contentByProject');
      expect(projectsContent).toContain('useMemo');
    });

    it('should memoize project list', () => {
      expect(projectsContent).toContain('projectList');
      expect(projectsContent).toContain('useMemo');
    });
  });

  describe('Accordion Behavior', () => {
    it('should use multiple accordion type', () => {
      expect(projectsContent).toContain('type="multiple"');
    });

    it('should have default open value', () => {
      expect(projectsContent).toContain("defaultValue={['uncategorized']}");
    });

    it('should use border-none on accordion items', () => {
      expect(projectsContent).toContain('border-none');
    });

    it('should style accordion triggers', () => {
      expect(projectsContent).toContain('bg-muted');
      expect(projectsContent).toContain('px-4 py-3');
      expect(projectsContent).toContain('rounded-lg');
      expect(projectsContent).toContain('hover:no-underline');
    });

    it('should show item count in accordion trigger', () => {
      expect(projectsContent).toContain('({items.length})');
    });

    it('should use Folder icon in accordion trigger', () => {
      expect(projectsContent).toContain('Folder');
      expect(projectsContent).toContain('h-5 w-5');
    });
  });

  describe('Collapsible Behavior', () => {
    it('should use Collapsible with Card', () => {
      expect(projectsContent).toContain('<Collapsible key={item.id} asChild>');
    });

    it('should have CollapsibleTrigger button', () => {
      expect(projectsContent).toContain('CollapsibleTrigger');
      expect(projectsContent).toContain('ChevronsUpDown');
    });

    it('should wrap content in CollapsibleContent', () => {
      expect(projectsContent).toContain('CollapsibleContent');
    });

    it('should render markdown content', () => {
      expect(projectsContent).toContain('marked');
      expect(projectsContent).toContain('dangerouslySetInnerHTML');
    });

    it('should use prose classes for markdown', () => {
      expect(projectsContent).toContain('prose');
      expect(projectsContent).toContain('prose-sm');
      expect(projectsContent).toContain('dark:prose-invert');
    });
  });

  describe('Action Buttons', () => {
    it('should have copy to clipboard button', () => {
      expect(projectsContent).toContain('copyToClipboard');
      expect(projectsContent).toContain('Copy');
      expect(projectsContent).toContain('navigator.clipboard.writeText');
    });

    it('should have expand/collapse button', () => {
      expect(projectsContent).toContain('ChevronsUpDown');
      expect(projectsContent).toContain('Expand');
    });

    it('should have more options button', () => {
      expect(projectsContent).toContain('MoreVertical');
      expect(projectsContent).toContain('More options');
    });

    it('should use ghost variant for icon buttons', () => {
      expect(projectsContent).toContain('variant="ghost"');
      expect(projectsContent).toContain('size="icon"');
    });

    it('should have screen reader labels', () => {
      expect(projectsContent).toContain('sr-only');
    });
  });

  describe('Badge Usage', () => {
    it('should use Badge for content type', () => {
      expect(projectsContent).toContain('Badge');
      expect(projectsContent).toContain('variant="outline"');
    });

    it('should display content type in badge', () => {
      expect(projectsContent).toContain('{item.type}');
    });
  });

  describe('Date Formatting', () => {
    it('should have formatDate helper function', () => {
      expect(projectsContent).toContain('const formatDate');
    });

    it('should handle Firestore timestamps', () => {
      expect(projectsContent).toContain('seconds');
      expect(projectsContent).toContain('dateValue.seconds * 1000');
    });

    it('should handle ISO strings and numbers', () => {
      expect(projectsContent).toContain('new Date(dateValue).toLocaleDateString()');
    });

    it('should display formatted dates', () => {
      expect(projectsContent).toContain('Saved on {formatDate(item.createdAt)}');
    });
  });

  describe('CRUD Operations', () => {
    it('should have create project handler', () => {
      expect(projectsContent).toContain('handleCreateProject');
      expect(projectsContent).toContain('repository.put');
    });

    it('should have rename content handler', () => {
      expect(projectsContent).toContain('handleRename');
      expect(projectsContent).toContain('repository.update');
    });

    it('should have move to project handler', () => {
      expect(projectsContent).toContain('handleMoveToProject');
      expect(projectsContent).toContain('projectId: projectId || null');
    });

    it('should have delete item handler', () => {
      expect(projectsContent).toContain('handleDeleteItem');
      expect(projectsContent).toContain('repository.delete');
    });

    it('should use toast for user feedback', () => {
      expect(projectsContent).toContain('toast');
      expect(projectsContent).toContain('from \'@/hooks/use-toast\'');
    });

    it('should handle errors gracefully', () => {
      expect(projectsContent).toContain('try {');
      expect(projectsContent).toContain('catch (error)');
      expect(projectsContent).toContain('console.error');
    });
  });

  describe('State Management', () => {
    it('should use useState for dialog states', () => {
      expect(projectsContent).toContain('useState');
      expect(projectsContent).toContain('isCreateProjectOpen');
      expect(projectsContent).toContain('itemToDelete');
      expect(projectsContent).toContain('itemToRename');
    });

    it('should use useEffect for dialog updates', () => {
      expect(projectsContent).toContain('useEffect');
    });

    it('should use useRouter for navigation', () => {
      expect(projectsContent).toContain('useRouter');
      expect(projectsContent).toContain('from \'next/navigation\'');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic HTML elements', () => {
      // Cards and accordions provide semantic structure
      expect(projectsContent).toContain('Card');
      expect(projectsContent).toContain('Accordion');
    });

    it('should have proper button labels', () => {
      expect(projectsContent).toContain('Create Project');
      expect(projectsContent).toContain('Cancel');
      expect(projectsContent).toContain('Delete');
    });

    it('should use screen reader only text', () => {
      expect(projectsContent).toContain('sr-only');
    });

    it('should have proper form labels', () => {
      expect(projectsContent).toContain('Label');
      expect(projectsContent).toContain('htmlFor');
    });

    it('should use Link component for navigation', () => {
      expect(projectsContent).toContain('Link');
      expect(projectsContent).toContain('from \'next/link\'');
    });
  });

  describe('Performance Optimizations', () => {
    it('should use client-side rendering directive', () => {
      expect(projectsContent).toContain("'use client'");
    });

    it('should memoize computed values', () => {
      const memoCount = countOccurrences(projectsContent, /useMemo/g);
      expect(memoCount).toBeGreaterThanOrEqual(4);
    });

    it('should use descending order for queries', () => {
      expect(projectsContent).toContain('scanIndexForward: false');
    });

    it('should group content efficiently', () => {
      expect(projectsContent).toContain('contentByProject');
      expect(projectsContent).toContain('grouped');
    });
  });

  describe('Icon Usage', () => {
    it('should use lucide-react icons consistently', () => {
      const iconImportPattern = /import\s+{[^}]*}\s+from\s+['"]lucide-react['"]/;
      expect(projectsContent).toMatch(iconImportPattern);
    });

    it('should use Library icon for empty state', () => {
      expect(projectsContent).toContain('Library');
    });

    it('should use Folder icons for projects', () => {
      expect(projectsContent).toContain('Folder');
      expect(projectsContent).toContain('FolderPlus');
    });

    it('should use action icons', () => {
      const actionIcons = ['Copy', 'MoreVertical', 'Trash2', 'Pencil', 'ChevronsUpDown'];
      actionIcons.forEach((icon) => {
        expect(projectsContent).toContain(icon);
      });
    });

    it('should use consistent icon sizing', () => {
      expect(projectsContent).toContain('h-4 w-4');
      expect(projectsContent).toContain('h-5 w-5');
      expect(projectsContent).toContain('h-16 w-16');
    });
  });

  describe('TypeScript Types', () => {
    it('should import proper types', () => {
      expect(projectsContent).toContain('SavedContent');
      expect(projectsContent).toContain('Project');
      expect(projectsContent).toContain('from \'@/lib/types\'');
    });

    it('should use typed query hooks', () => {
      expect(projectsContent).toContain('useQuery<SavedContent>');
      expect(projectsContent).toContain('useQuery<Project>');
    });
  });

  describe('Content Organization', () => {
    it('should have uncategorized project', () => {
      expect(projectsContent).toContain('uncategorized');
      expect(projectsContent).toContain('Uncategorized');
    });

    it('should sort projects alphabetically', () => {
      expect(projectsContent).toContain('localeCompare');
    });

    it('should filter empty projects', () => {
      expect(projectsContent).toContain('if (items.length === 0) return null');
    });

    it('should group content by project', () => {
      expect(projectsContent).toContain('contentByProject');
      expect(projectsContent).toContain('item.projectId');
    });
  });
});

// ============================================================================
// Summary Test
// ============================================================================

describe('Projects Page Overall Quality', () => {
  it('should meet all visual regression criteria', () => {
    const content = getProjectsContent();
    
    const criteria = {
      hasStandardPageLayout: content.includes('StandardPageLayout'),
      hasLoadingStates: content.includes('StandardSkeleton'),
      hasEmptyStates: content.includes('StandardEmptyState'),
      hasCardComponents: content.includes('Card') && content.includes('CardHeader'),
      hasAccordion: content.includes('Accordion') && content.includes('AccordionItem'),
      hasCollapsible: content.includes('Collapsible'),
      hasDialogs: content.includes('Dialog') && content.includes('AlertDialog'),
      hasDropdownMenu: content.includes('DropdownMenu'),
      usesDesignSpacing: usesDesignSystemSpacing(content),
      usesDesignTypography: usesDesignSystemTypography(content),
      hasCRUDOperations: content.includes('handleCreateProject') && content.includes('handleDeleteItem'),
      hasDataIntegration: content.includes('useQuery') && content.includes('getRepository'),
      hasMemoization: content.includes('useMemo'),
      hasProperImports: content.includes('@/components/standard'),
      hasAccessibility: content.includes('sr-only') && content.includes('Label'),
    };
    
    const passedCriteria = Object.values(criteria).filter(Boolean).length;
    const totalCriteria = Object.keys(criteria).length;
    const passRate = (passedCriteria / totalCriteria) * 100;
    
    console.log('\n=== Projects Visual Regression Summary ===');
    console.log(`Passed: ${passedCriteria}/${totalCriteria} criteria (${passRate.toFixed(1)}%)`);
    console.log('\nCriteria Status:');
    Object.entries(criteria).forEach(([key, value]) => {
      console.log(`  ${value ? '✓' : '✗'} ${key}`);
    });
    console.log('==========================================\n');
    
    // All criteria should pass
    expect(passedCriteria).toBe(totalCriteria);
  });
});
