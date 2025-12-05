/**
 * Property-Based Testing Configuration
 * 
 * This file contains configuration for property-based tests using fast-check.
 * All property tests should use these configurations to ensure consistency.
 */

import * as fc from 'fast-check';

/**
 * Standard PBT Configuration
 * 
 * This configuration should be used for most property-based tests.
 * It runs 100 iterations per property as specified in the design document.
 */
export const standardPBTConfig: fc.Parameters<unknown> = {
    numRuns: 100, // Minimum 100 iterations per property
    verbose: true, // Show detailed output on failure
    seed: undefined, // Use random seed (can be set for reproducibility)
    path: undefined, // Path for shrinking (set automatically on failure)
    endOnFailure: false, // Continue running other tests even if one fails
};

/**
 * Quick PBT Configuration
 * 
 * Use this for faster feedback during development.
 * Not recommended for CI/CD pipelines.
 */
export const quickPBTConfig: fc.Parameters<unknown> = {
    numRuns: 20,
    verbose: true,
    endOnFailure: true,
};

/**
 * Thorough PBT Configuration
 * 
 * Use this for critical components or before major releases.
 * Runs more iterations to increase confidence.
 */
export const thoroughPBTConfig: fc.Parameters<unknown> = {
    numRuns: 1000,
    verbose: true,
    endOnFailure: false,
};

/**
 * CI/CD PBT Configuration
 * 
 * Optimized for continuous integration environments.
 * Balances thoroughness with execution time.
 */
export const ciPBTConfig: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: false, // Less verbose in CI
    endOnFailure: true, // Fail fast in CI
};

/**
 * Get PBT configuration based on environment
 * 
 * @returns The appropriate PBT configuration for the current environment
 */
export function getPBTConfig(): fc.Parameters<unknown> {
    const env = process.env.NODE_ENV;
    const isCI = process.env.CI === 'true';

    if (isCI) {
        return ciPBTConfig;
    }

    if (env === 'development') {
        return standardPBTConfig;
    }

    return standardPBTConfig;
}

/**
 * Property Test Timeout
 * 
 * Recommended timeout for property-based tests in milliseconds.
 * Property tests run multiple iterations and may take longer than unit tests.
 */
export const PBT_TIMEOUT = 30000; // 30 seconds

/**
 * Property Test Tags
 * 
 * Use these tags to categorize property-based tests.
 * This helps with filtering and running specific test suites.
 */
export const PBT_TAGS = {
    COMPONENT: 'pbt:component',
    LAYOUT: 'pbt:layout',
    PERFORMANCE: 'pbt:performance',
    ACCESSIBILITY: 'pbt:accessibility',
    DESIGN_TOKENS: 'pbt:design-tokens',
    ANIMATION: 'pbt:animation',
    RESPONSIVE: 'pbt:responsive',
} as const;

/**
 * Helper function to create a tagged property test
 * 
 * @param tag - The tag to apply to the test
 * @param name - The test name
 * @param fn - The test function
 */
export function taggedPropertyTest(
    tag: string,
    name: string,
    fn: () => void | Promise<void>
) {
    return test(`[${tag}] ${name}`, fn, PBT_TIMEOUT);
}

/**
 * Helper function to run a property test with standard configuration
 * 
 * @param property - The property to test
 * @param config - Optional configuration override
 */
export async function runPropertyTest<T>(
    property: fc.IProperty<T>,
    config?: Partial<fc.Parameters<T>>
): Promise<void> {
    const finalConfig = { ...getPBTConfig(), ...config };
    await fc.assert(property, finalConfig);
}

/**
 * Example usage in a test file:
 * 
 * ```typescript
 * import { runPropertyTest, standardPBTConfig } from '@/__tests__/config/pbt-config';
 * import { buttonVariantArb, buttonSizeArb } from '@/__tests__/utils/property-generators';
 * import * as fc from 'fast-check';
 * 
 * // Feature: design-system-performance, Property 1: Component Consistency
 * test('button variants produce consistent output', async () => {
 *   await runPropertyTest(
 *     fc.property(
 *       fc.record({
 *         variant: buttonVariantArb,
 *         size: buttonSizeArb,
 *         children: fc.string(),
 *       }),
 *       (props) => {
 *         const result1 = render(<Button {...props} />);
 *         const result2 = render(<Button {...props} />);
 *         expect(result1.container.innerHTML).toBe(result2.container.innerHTML);
 *       }
 *     )
 *   );
 * });
 * ```
 */
