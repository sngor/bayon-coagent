/**
 * Helper functions for property-based testing
 * 
 * These helpers provide utilities for setting up tests, mocking,
 * and common test operations.
 */

import * as fc from 'fast-check';

/**
 * Run a property test with a custom number of iterations
 * @param property - The property to test
 * @param numRuns - Number of test iterations (default: 100)
 */
export async function runPropertyTest<T>(
  property: fc.IProperty<T>,
  numRuns: number = 100
): Promise<void> {
  await fc.assert(property, { numRuns });
}

/**
 * Create a mock viewport for testing responsive behavior
 */
export function mockViewport(width: number, height: number) {
  return {
    width,
    height,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  };
}

/**
 * Create a mock theme context
 */
export function mockTheme(theme: 'light' | 'dark' | 'system' = 'light') {
  return {
    theme,
    setTheme: jest.fn(),
    systemTheme: 'light' as const,
  };
}

/**
 * Create a mock user object for testing
 */
export function mockUser(overrides: Partial<{
  id: string;
  email: string;
  name: string;
  profileComplete: boolean;
}> = {}) {
  return {
    id: overrides.id || 'test-user-id',
    email: overrides.email || 'test@example.com',
    name: overrides.name || 'Test User',
    profileComplete: overrides.profileComplete ?? false,
  };
}

/**
 * Create a mock toast notification
 */
export function mockToast(overrides: Partial<{
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error' | 'warning';
  duration: number;
}> = {}) {
  return {
    id: overrides.id || 'test-toast-id',
    title: overrides.title || 'Test Toast',
    description: overrides.description,
    variant: overrides.variant || 'default',
    duration: overrides.duration || 3000,
  };
}

/**
 * Wait for a condition to be true (useful for async tests)
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Simulate a delay (useful for testing loading states)
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random subset of an array
 */
export function randomSubset<T>(array: T[], minSize: number = 0): T[] {
  const size = Math.floor(Math.random() * (array.length - minSize + 1)) + minSize;
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, size);
}

/**
 * Check if a function throws an error
 */
export function expectToThrow(fn: () => void, errorMessage?: string): boolean {
  try {
    fn();
    return false;
  } catch (error) {
    if (errorMessage && error instanceof Error) {
      return error.message.includes(errorMessage);
    }
    return true;
  }
}

/**
 * Check if an async function throws an error
 */
export async function expectToThrowAsync(
  fn: () => Promise<void>,
  errorMessage?: string
): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch (error) {
    if (errorMessage && error instanceof Error) {
      return error.message.includes(errorMessage);
    }
    return true;
  }
}

/**
 * Create a spy function that tracks calls
 */
export function createSpy<T extends (...args: any[]) => any>() {
  const calls: Parameters<T>[] = [];
  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
  }) as T;
  
  return {
    spy,
    calls,
    callCount: () => calls.length,
    calledWith: (...args: Parameters<T>) => 
      calls.some((call) => JSON.stringify(call) === JSON.stringify(args)),
    reset: () => calls.splice(0, calls.length),
  };
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(fn: () => T | Promise<T>): Promise<{
  result: T;
  duration: number;
}> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Check if a value is deeply equal to another
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Generate a range of numbers
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Shuffle an array randomly
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Group an array by a key function
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Create a mock DOM element for testing
 */
export function mockElement(overrides: Partial<{
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  attributes: Record<string, string>;
}> = {}) {
  return {
    tagName: overrides.tagName || 'DIV',
    className: overrides.className || '',
    id: overrides.id || '',
    textContent: overrides.textContent || '',
    attributes: overrides.attributes || {},
    getAttribute: function(name: string) {
      return this.attributes[name];
    },
    setAttribute: function(name: string, value: string) {
      this.attributes[name] = value;
    },
  };
}
