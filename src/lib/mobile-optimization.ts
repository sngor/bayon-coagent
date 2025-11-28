/**
 * Mobile Optimization Utilities
 * 
 * This module provides utilities for ensuring mobile-friendly layouts,
 * touch-friendly controls, and appropriate keyboard types for form inputs.
 * 
 * Requirements: 4.1, 4.5, 16.1, 16.3
 */

/**
 * Minimum touch target size in pixels (44x44px per WCAG guidelines)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

/**
 * Input type mappings for mobile keyboards
 */
export const INPUT_TYPES = {
  email: 'email',
  phone: 'tel',
  number: 'number',
  url: 'url',
  search: 'search',
  date: 'date',
  time: 'time',
} as const;

/**
 * Check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.mobile;
}

/**
 * Check if current viewport is tablet
 */
export function isTabletViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.desktop;
}

/**
 * Get appropriate input type for mobile keyboard
 */
export function getInputType(fieldName: string): string {
  const lowerName = fieldName.toLowerCase();

  if (lowerName.includes('email')) return INPUT_TYPES.email;
  if (lowerName.includes('phone') || lowerName.includes('tel')) return INPUT_TYPES.phone;
  if (lowerName.includes('url') || lowerName.includes('website')) return INPUT_TYPES.url;
  if (lowerName.includes('search')) return INPUT_TYPES.search;
  if (lowerName.includes('date')) return INPUT_TYPES.date;
  if (lowerName.includes('time')) return INPUT_TYPES.time;
  if (
    lowerName.includes('number') ||
    lowerName.includes('years') ||
    lowerName.includes('experience') ||
    lowerName.includes('age') ||
    lowerName.includes('count') ||
    lowerName.includes('quantity') ||
    lowerName.includes('amount')
  ) return INPUT_TYPES.number;

  return 'text';
}

/**
 * Tailwind classes for ensuring touch-friendly controls
 */
export const TOUCH_FRIENDLY_CLASSES = {
  button: 'min-h-[44px] min-w-[44px] touch-manipulation',
  input: 'min-h-[44px] touch-manipulation text-base', // text-base prevents zoom on iOS
  select: 'min-h-[44px] touch-manipulation text-base',
  checkbox: 'min-h-[24px] min-w-[24px] touch-manipulation',
  radio: 'min-h-[24px] min-w-[24px] touch-manipulation',
  link: 'min-h-[44px] inline-flex items-center touch-manipulation',
} as const;

/**
 * Tailwind classes for single-column mobile layouts
 */
export const MOBILE_LAYOUT_CLASSES = {
  container: 'w-full px-4 sm:px-6 md:px-8',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
  stack: 'flex flex-col space-y-4 md:space-y-6',
  form: 'space-y-4 md:space-y-6',
  card: 'w-full',
} as const;

/**
 * Utility to combine mobile-friendly classes
 */
export function getMobileClasses(type: keyof typeof TOUCH_FRIENDLY_CLASSES, additionalClasses?: string): string {
  const baseClasses = TOUCH_FRIENDLY_CLASSES[type];
  return additionalClasses ? `${baseClasses} ${additionalClasses}` : baseClasses;
}

/**
 * Check if an element meets minimum touch target size
 */
export function meetsMinTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_TOUCH_TARGET_SIZE && rect.height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Audit page for mobile responsiveness issues
 */
export function auditMobileResponsiveness(): {
  issues: string[];
  warnings: string[];
  passed: boolean;
} {
  if (typeof window === 'undefined') {
    return { issues: [], warnings: [], passed: true };
  }

  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for horizontal overflow
  if (document.body.scrollWidth > window.innerWidth) {
    issues.push('Page has horizontal overflow');
  }

  // Check interactive elements for touch target size
  const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
  let smallTargets = 0;

  interactiveElements.forEach((el) => {
    if (!meetsMinTouchTarget(el as HTMLElement)) {
      smallTargets++;
    }
  });

  if (smallTargets > 0) {
    warnings.push(`${smallTargets} interactive elements are smaller than 44x44px`);
  }

  // Check for appropriate input types
  const inputs = document.querySelectorAll('input[type="text"]');
  let missingTypes = 0;

  inputs.forEach((input) => {
    const name = input.getAttribute('name') || input.getAttribute('id') || '';
    const suggestedType = getInputType(name);
    if (suggestedType !== 'text') {
      missingTypes++;
    }
  });

  if (missingTypes > 0) {
    warnings.push(`${missingTypes} inputs could use more specific types for mobile keyboards`);
  }

  return {
    issues,
    warnings,
    passed: issues.length === 0,
  };
}

/**
 * Gesture-related utilities
 * 
 * For comprehensive gesture handling, use the GestureHandler class from @/lib/gesture-handler
 * or the React hooks from @/hooks/use-gesture-handler
 */

/**
 * Check if device supports touch events
 */
export function supportsTouchEvents(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if device supports pointer events
 */
export function supportsPointerEvents(): boolean {
  if (typeof window === 'undefined') return false;
  return 'onpointerdown' in window;
}

/**
 * Check if device supports haptic feedback
 */
export function supportsHapticFeedback(): boolean {
  if (typeof window === 'undefined') return false;
  return 'vibrate' in navigator;
}

/**
 * Provide haptic feedback if supported
 */
export function triggerHapticFeedback(pattern: number | number[] = 50): void {
  if (supportsHapticFeedback()) {
    navigator.vibrate(pattern);
  }
}
