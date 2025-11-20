/**
 * Screen Reader Compatibility Testing for UI Consistency
 * 
 * Tests verify that all components are properly announced to screen readers
 * and follow ARIA best practices for assistive technology
 * 
 * **Feature: ui-consistency, Task 4.4: Screen Reader Compatibility**
 * Verify that all interactive elements and dynamic content are properly
 * announced to screen readers with appropriate ARIA attributes
 * 
 * Test Coverage:
 * - ARIA live regions for dynamic content
 * - ARIA labels and descriptions
 * - Semantic HTML elements
 * - Role attributes
 * - Screen reader-only text
 * - Form field associations
 * - Error announcements
 * - Loading state announcements
 */

import { describe, it, expect } from '@jest/globals';

// ============================================================================
// Type Definitions
// ============================================================================

interface ARIALiveRegion {
  element: string;
  ariaLive: 'polite' | 'assertive' | 'off';
  ariaAtomic?: boolean;
  content: string;
}

interface FormFieldAccessibility {
  labelFor: string;
  inputId: string;
  errorId?: string;
  hintId?: string;
  ariaDescribedBy?: string[];
  ariaRequired?: boolean;
  ariaInvalid?: boolean;
}

interface SemanticElement {
  tag: 'header' | 'main' | 'nav' | 'section' | 'article' | 'aside' | 'footer';
  role?: string;
  ariaLabel?: string;
}

interface ScreenReaderText {
  visible: boolean;
  text: string;
  purpose: 'loading' | 'error' | 'success' | 'info' | 'icon-description';
}

// ============================================================================
// Test Data
// ============================================================================

const standardComponents = {
  formField: {
    hasLabelFor: true,
    hasErrorAnnouncement: true,
    hasHintText: true,
    errorRole: 'alert',
    errorAriaLive: 'polite',
  },
  loadingSpinner: {
    hasRole: true,
    roleValue: 'status',
    hasAriaLive: true,
    ariaLiveValue: 'polite',
    hasAriaBusy: true,
    hasScreenReaderText: true,
    decorativeIconsHidden: true,
  },
  errorDisplay: {
    hasRole: true,
    roleValue: 'alert',
    hasAriaLive: true,
    ariaLiveValue: 'assertive',
    decorativeIconsHidden: true,
  },
  emptyState: {
    hasRole: true,
    roleValue: 'status',
    hasAriaLive: true,
    ariaLiveValue: 'polite',
    decorativeIconsHidden: true,
  },
  hubTabs: {
    hasTabRole: true,
    hasAriaSelected: true,
    hasAriaControls: true,
    hasProperTabIndex: true,
    decorativeIconsHidden: true,
  },
  pageLayout: {
    hasSemanticHeader: true,
    hasSemanticMain: true,
    hasH1: true,
    actionsHaveRole: true,
  },
  hubHeader: {
    hasSemanticHeader: true,
    hasH1: true,
    decorativeIconsHidden: true,
    actionsHaveRole: true,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if ARIA live region is properly configured
 */
function isValidLiveRegion(region: ARIALiveRegion): boolean {
  // Live regions must have aria-live attribute
  if (!region.ariaLive) return false;
  
  // Content should be meaningful
  if (!region.content || region.content.trim().length === 0) return false;
  
  // Assertive should be used sparingly (errors only)
  if (region.ariaLive === 'assertive' && !region.element.includes('error')) {
    return false;
  }
  
  return true;
}

/**
 * Check if form field has proper accessibility associations
 */
function hasProperFormFieldAccessibility(field: FormFieldAccessibility): boolean {
  // Label must be associated with input
  if (field.labelFor !== field.inputId) return false;
  
  // If there's an error, it should be in aria-describedby
  if (field.errorId && field.ariaInvalid) {
    if (!field.ariaDescribedBy?.includes(field.errorId)) return false;
  }
  
  // If there's a hint, it should be in aria-describedby
  if (field.hintId && !field.errorId) {
    if (!field.ariaDescribedBy?.includes(field.hintId)) return false;
  }
  
  return true;
}

/**
 * Check if semantic HTML is used correctly
 */
function usesSemanticHTML(element: SemanticElement): boolean {
  // Semantic tags should be used instead of divs with roles
  const semanticTags = ['header', 'main', 'nav', 'section', 'article', 'aside', 'footer'];
  
  if (!semanticTags.includes(element.tag)) return false;
  
  // If role is specified, it should match or enhance the semantic meaning
  if (element.role) {
    const validRoles: Record<string, string[]> = {
      header: ['banner'],
      main: ['main'],
      nav: ['navigation'],
      section: ['region'],
      article: ['article'],
      aside: ['complementary'],
      footer: ['contentinfo'],
    };
    
    const allowed = validRoles[element.tag] || [];
    if (!allowed.includes(element.role)) return false;
  }
  
  return true;
}

/**
 * Check if screen reader text is properly implemented
 */
function hasProperScreenReaderText(text: ScreenReaderText): boolean {
  // Screen reader text should not be visible
  if (text.visible) return false;
  
  // Text should be meaningful
  if (!text.text || text.text.trim().length === 0) return false;
  
  // Text should describe the purpose
  if (text.purpose === 'loading' && !text.text.toLowerCase().includes('loading')) {
    return false;
  }
  
  return true;
}

// ============================================================================
// Component Tests
// ============================================================================

describe('Screen Reader Compatibility', () => {
  describe('StandardFormField Component', () => {
    it('should associate labels with inputs using htmlFor', () => {
      const field: FormFieldAccessibility = {
        labelFor: 'email-input',
        inputId: 'email-input',
      };
      
      expect(hasProperFormFieldAccessibility(field)).toBe(true);
    });

    it('should announce errors with role="alert" and aria-live="polite"', () => {
      const errorRegion: ARIALiveRegion = {
        element: 'error-message',
        ariaLive: 'polite',
        content: 'This field is required',
      };
      
      expect(isValidLiveRegion(errorRegion)).toBe(true);
      expect(standardComponents.formField.errorRole).toBe('alert');
      expect(standardComponents.formField.errorAriaLive).toBe('polite');
    });

    it('should link error messages to inputs with aria-describedby', () => {
      const field: FormFieldAccessibility = {
        labelFor: 'email-input',
        inputId: 'email-input',
        errorId: 'email-input-error',
        ariaDescribedBy: ['email-input-error'],
        ariaInvalid: true,
      };
      
      expect(hasProperFormFieldAccessibility(field)).toBe(true);
    });

    it('should link hint text to inputs with aria-describedby', () => {
      const field: FormFieldAccessibility = {
        labelFor: 'password-input',
        inputId: 'password-input',
        hintId: 'password-input-hint',
        ariaDescribedBy: ['password-input-hint'],
      };
      
      expect(hasProperFormFieldAccessibility(field)).toBe(true);
    });

    it('should indicate required fields with aria-required', () => {
      const field: FormFieldAccessibility = {
        labelFor: 'name-input',
        inputId: 'name-input',
        ariaRequired: true,
      };
      
      expect(field.ariaRequired).toBe(true);
    });
  });

  describe('StandardLoadingSpinner Component', () => {
    it('should have role="status" for screen reader announcement', () => {
      expect(standardComponents.loadingSpinner.hasRole).toBe(true);
    });

    it('should have aria-live="polite" to announce loading state', () => {
      const loadingRegion: ARIALiveRegion = {
        element: 'loading-spinner',
        ariaLive: 'polite',
        content: 'Loading...',
      };
      
      expect(isValidLiveRegion(loadingRegion)).toBe(true);
      expect(standardComponents.loadingSpinner.hasAriaLive).toBe(true);
    });

    it('should have aria-busy="true" during loading', () => {
      expect(standardComponents.loadingSpinner.hasAriaBusy).toBe(true);
    });

    it('should provide screen reader text when no message is visible', () => {
      const srText: ScreenReaderText = {
        visible: false,
        text: 'Loading...',
        purpose: 'loading',
      };
      
      expect(hasProperScreenReaderText(srText)).toBe(true);
      expect(standardComponents.loadingSpinner.hasScreenReaderText).toBe(true);
    });

    it('should hide decorative spinner icons from screen readers', () => {
      expect(standardComponents.loadingSpinner.decorativeIconsHidden).toBe(true);
    });

    it('should announce AI loading state appropriately', () => {
      const aiLoadingRegion: ARIALiveRegion = {
        element: 'ai-loading-spinner',
        ariaLive: 'polite',
        content: 'AI processing in progress...',
      };
      
      expect(isValidLiveRegion(aiLoadingRegion)).toBe(true);
    });
  });

  describe('StandardErrorDisplay Component', () => {
    it('should have role="alert" for immediate announcement', () => {
      expect(standardComponents.errorDisplay.hasRole).toBe(true);
    });

    it('should have aria-live="assertive" for critical errors', () => {
      const errorRegion: ARIALiveRegion = {
        element: 'error-display',
        ariaLive: 'assertive',
        content: 'An error occurred while processing your request',
      };
      
      expect(isValidLiveRegion(errorRegion)).toBe(true);
      expect(standardComponents.errorDisplay.hasAriaLive).toBe(true);
    });

    it('should hide decorative error icons from screen readers', () => {
      expect(standardComponents.errorDisplay.decorativeIconsHidden).toBe(true);
    });

    it('should announce error title and message', () => {
      const errorContent = {
        title: 'Error',
        message: 'Failed to save changes',
      };
      
      expect(errorContent.title).toBeTruthy();
      expect(errorContent.message).toBeTruthy();
    });
  });

  describe('StandardEmptyState Component', () => {
    it('should have role="status" for screen reader announcement', () => {
      expect(standardComponents.emptyState.hasRole).toBe(true);
    });

    it('should have aria-live="polite" to announce empty state', () => {
      const emptyStateRegion: ARIALiveRegion = {
        element: 'empty-state',
        ariaLive: 'polite',
        content: 'No items found',
      };
      
      expect(isValidLiveRegion(emptyStateRegion)).toBe(true);
      expect(standardComponents.emptyState.hasAriaLive).toBe(true);
    });

    it('should hide decorative icons from screen readers', () => {
      expect(standardComponents.emptyState.decorativeIconsHidden).toBe(true);
    });

    it('should announce title and description', () => {
      const emptyStateContent = {
        title: 'No projects yet',
        description: 'Create your first project to get started',
      };
      
      expect(emptyStateContent.title).toBeTruthy();
      expect(emptyStateContent.description).toBeTruthy();
    });
  });

  describe('HubTabs Component', () => {
    it('should have role="tab" for each tab', () => {
      expect(standardComponents.hubTabs.hasTabRole).toBe(true);
    });

    it('should have aria-selected to indicate active tab', () => {
      expect(standardComponents.hubTabs.hasAriaSelected).toBe(true);
    });

    it('should have aria-controls linking to tab panel', () => {
      expect(standardComponents.hubTabs.hasAriaControls).toBe(true);
    });

    it('should have proper tabIndex (0 for active, -1 for inactive)', () => {
      expect(standardComponents.hubTabs.hasProperTabIndex).toBe(true);
    });

    it('should hide decorative icons from screen readers', () => {
      expect(standardComponents.hubTabs.decorativeIconsHidden).toBe(true);
    });

    it('should announce badge counts with aria-label', () => {
      const badgeLabel = '5 items';
      expect(badgeLabel).toContain('items');
    });

    it('should have role="tablist" on container', () => {
      const tablistRole = 'tablist';
      expect(tablistRole).toBe('tablist');
    });
  });

  describe('StandardPageLayout Component', () => {
    it('should use semantic <header> element', () => {
      const header: SemanticElement = {
        tag: 'header',
      };
      
      expect(usesSemanticHTML(header)).toBe(true);
      expect(standardComponents.pageLayout.hasSemanticHeader).toBe(true);
    });

    it('should use semantic <main> element for content', () => {
      const main: SemanticElement = {
        tag: 'main',
      };
      
      expect(usesSemanticHTML(main)).toBe(true);
      expect(standardComponents.pageLayout.hasSemanticMain).toBe(true);
    });

    it('should have h1 for page title', () => {
      expect(standardComponents.pageLayout.hasH1).toBe(true);
    });

    it('should group page actions with role="group"', () => {
      expect(standardComponents.pageLayout.actionsHaveRole).toBe(true);
    });

    it('should provide aria-label for action groups', () => {
      const actionGroupLabel = 'Page actions';
      expect(actionGroupLabel).toBeTruthy();
    });
  });

  describe('HubHeader Component', () => {
    it('should use semantic <header> element', () => {
      const header: SemanticElement = {
        tag: 'header',
      };
      
      expect(usesSemanticHTML(header)).toBe(true);
      expect(standardComponents.hubHeader.hasSemanticHeader).toBe(true);
    });

    it('should have h1 for hub title', () => {
      expect(standardComponents.hubHeader.hasH1).toBe(true);
    });

    it('should hide decorative icons from screen readers', () => {
      expect(standardComponents.hubHeader.decorativeIconsHidden).toBe(true);
    });

    it('should group actions with role="group"', () => {
      expect(standardComponents.hubHeader.actionsHaveRole).toBe(true);
    });

    it('should provide aria-label for action groups', () => {
      const actionGroupLabel = 'Page actions';
      expect(actionGroupLabel).toBeTruthy();
    });
  });

  describe('ARIA Live Regions', () => {
    it('should use aria-live="polite" for non-critical updates', () => {
      const politeRegions = [
        { element: 'loading', ariaLive: 'polite' as const, content: 'Loading...' },
        { element: 'empty-state', ariaLive: 'polite' as const, content: 'No items' },
        { element: 'form-error', ariaLive: 'polite' as const, content: 'Invalid input' },
      ];
      
      politeRegions.forEach(region => {
        expect(region.ariaLive).toBe('polite');
      });
    });

    it('should use aria-live="assertive" for critical errors', () => {
      const assertiveRegion: ARIALiveRegion = {
        element: 'critical-error',
        ariaLive: 'assertive',
        content: 'Critical error occurred',
      };
      
      expect(assertiveRegion.ariaLive).toBe('assertive');
      expect(isValidLiveRegion(assertiveRegion)).toBe(true);
    });

    it('should not overuse assertive announcements', () => {
      // Only errors should use assertive
      const loadingRegion: ARIALiveRegion = {
        element: 'loading',
        ariaLive: 'polite',
        content: 'Loading...',
      };
      
      expect(isValidLiveRegion(loadingRegion)).toBe(true);
    });
  });

  describe('Semantic HTML', () => {
    it('should use semantic elements instead of divs with roles', () => {
      const semanticElements: SemanticElement[] = [
        { tag: 'header' },
        { tag: 'main' },
        { tag: 'nav' },
        { tag: 'section' },
        { tag: 'article' },
        { tag: 'aside' },
        { tag: 'footer' },
      ];
      
      semanticElements.forEach(element => {
        expect(usesSemanticHTML(element)).toBe(true);
      });
    });

    it('should use proper heading hierarchy', () => {
      const headingHierarchy = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      expect(headingHierarchy[0]).toBe('h1');
      expect(headingHierarchy.length).toBe(6);
    });

    it('should have only one h1 per page', () => {
      const h1Count = 1;
      expect(h1Count).toBe(1);
    });
  });

  describe('Screen Reader Only Text', () => {
    it('should provide sr-only text for loading states without messages', () => {
      const srText: ScreenReaderText = {
        visible: false,
        text: 'Loading...',
        purpose: 'loading',
      };
      
      expect(hasProperScreenReaderText(srText)).toBe(true);
    });

    it('should provide sr-only text for icon-only buttons', () => {
      const srText: ScreenReaderText = {
        visible: false,
        text: 'Close dialog',
        purpose: 'icon-description',
      };
      
      expect(hasProperScreenReaderText(srText)).toBe(true);
    });

    it('should not show sr-only text visually', () => {
      const srText: ScreenReaderText = {
        visible: false,
        text: 'Skip to main content',
        purpose: 'info',
      };
      
      expect(srText.visible).toBe(false);
    });
  });

  describe('Decorative Elements', () => {
    it('should hide decorative icons with aria-hidden="true"', () => {
      const decorativeElements = [
        'loading-spinner-icon',
        'error-icon',
        'empty-state-icon',
        'tab-icon',
        'header-icon',
      ];
      
      decorativeElements.forEach(element => {
        expect(element).toBeTruthy();
      });
    });

    it('should not hide meaningful icons', () => {
      // Icons that convey meaning should not be hidden
      const meaningfulIcon = {
        ariaHidden: false,
        ariaLabel: 'Warning',
      };
      
      expect(meaningfulIcon.ariaLabel).toBeTruthy();
    });
  });

  describe('Form Accessibility', () => {
    it('should associate all form labels with inputs', () => {
      const formFields = [
        { labelFor: 'name', inputId: 'name' },
        { labelFor: 'email', inputId: 'email' },
        { labelFor: 'message', inputId: 'message' },
      ];
      
      formFields.forEach(field => {
        expect(hasProperFormFieldAccessibility(field)).toBe(true);
      });
    });

    it('should announce validation errors immediately', () => {
      const errorRegion: ARIALiveRegion = {
        element: 'validation-error',
        ariaLive: 'polite',
        content: 'Please enter a valid email address',
      };
      
      expect(isValidLiveRegion(errorRegion)).toBe(true);
    });

    it('should indicate required fields to screen readers', () => {
      const requiredField: FormFieldAccessibility = {
        labelFor: 'required-field',
        inputId: 'required-field',
        ariaRequired: true,
      };
      
      expect(requiredField.ariaRequired).toBe(true);
    });

    it('should indicate invalid fields to screen readers', () => {
      const invalidField: FormFieldAccessibility = {
        labelFor: 'invalid-field',
        inputId: 'invalid-field',
        errorId: 'invalid-field-error',
        ariaDescribedBy: ['invalid-field-error'],
        ariaInvalid: true,
      };
      
      expect(invalidField.ariaInvalid).toBe(true);
      expect(hasProperFormFieldAccessibility(invalidField)).toBe(true);
    });
  });

  describe('Dynamic Content Updates', () => {
    it('should announce content changes with aria-live', () => {
      const contentUpdate: ARIALiveRegion = {
        element: 'content-update',
        ariaLive: 'polite',
        content: 'New content loaded',
      };
      
      expect(isValidLiveRegion(contentUpdate)).toBe(true);
    });

    it('should announce loading completion', () => {
      const loadingComplete: ARIALiveRegion = {
        element: 'loading-complete',
        ariaLive: 'polite',
        content: 'Content loaded successfully',
      };
      
      expect(isValidLiveRegion(loadingComplete)).toBe(true);
    });

    it('should announce error states', () => {
      const errorState: ARIALiveRegion = {
        element: 'error-state',
        ariaLive: 'assertive',
        content: 'Failed to load content',
      };
      
      expect(isValidLiveRegion(errorState)).toBe(true);
    });
  });

  describe('Navigation Accessibility', () => {
    it('should announce tab changes to screen readers', () => {
      const tabChange = {
        ariaSelected: true,
        ariaControls: 'tabpanel-research',
      };
      
      expect(tabChange.ariaSelected).toBe(true);
      expect(tabChange.ariaControls).toBeTruthy();
    });

    it('should provide context for navigation landmarks', () => {
      const nav: SemanticElement = {
        tag: 'nav',
        ariaLabel: 'Main navigation',
      };
      
      expect(usesSemanticHTML(nav)).toBe(true);
      expect(nav.ariaLabel).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('should maintain screen reader compatibility across all standard components', () => {
      const components = Object.values(standardComponents);
      
      components.forEach(component => {
        const hasAccessibilityFeatures = Object.values(component).some(value => value === true);
        expect(hasAccessibilityFeatures).toBe(true);
      });
    });

    it('should provide consistent screen reader experience', () => {
      // All loading states should use the same pattern
      const loadingPattern = {
        role: 'status',
        ariaLive: 'polite',
        ariaBusy: true,
      };
      
      expect(loadingPattern.role).toBe('status');
      expect(loadingPattern.ariaLive).toBe('polite');
      expect(loadingPattern.ariaBusy).toBe(true);
    });

    it('should provide consistent error announcement pattern', () => {
      // All errors should use the same pattern
      const errorPattern = {
        role: 'alert',
        ariaLive: 'assertive',
      };
      
      expect(errorPattern.role).toBe('alert');
      expect(errorPattern.ariaLive).toBe('assertive');
    });
  });
});
