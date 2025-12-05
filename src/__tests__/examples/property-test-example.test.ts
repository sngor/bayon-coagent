/**
 * Property-Based Testing Example
 * 
 * This file demonstrates how to write property-based tests using fast-check.
 * Use this as a reference when creating new property tests.
 * 
 * @see docs/design-system/design-tokens.md for design token documentation
 * @see .kiro/specs/design-system-performance/design.md for correctness properties
 */

import * as fc from 'fast-check';
import { runPropertyTest, PBT_TAGS, taggedPropertyTest } from '../config/pbt-config';
import {
    buttonVariantArb,
    buttonSizeArb,
    nonEmptyStringArb,
    booleanArb,
    dimensionArb,
    touchTargetSizeArb,
    bundleSizeArb,
    layoutShiftScoreArb,
} from '../utils/property-generators';

describe('Property-Based Testing Examples', () => {
    /**
     * Example 1: Testing Pure Functions
     * 
     * Property: For any two numbers, addition should be commutative
     * This demonstrates testing a simple mathematical property.
     */
    taggedPropertyTest(PBT_TAGS.COMPONENT, 'addition is commutative', async () => {
        await runPropertyTest(
            fc.property(fc.integer(), fc.integer(), (a, b) => {
                expect(a + b).toBe(b + a);
            })
        );
    });

    /**
     * Example 2: Testing String Operations
     * 
     * Property: For any string, reversing it twice returns the original
     * This demonstrates testing string transformations.
     */
    taggedPropertyTest(PBT_TAGS.COMPONENT, 'double reverse is identity', async () => {
        await runPropertyTest(
            fc.property(fc.string(), (str) => {
                const reversed = str.split('').reverse().join('');
                const doubleReversed = reversed.split('').reverse().join('');
                expect(doubleReversed).toBe(str);
            })
        );
    });

    /**
     * Example 3: Testing Array Operations
     * 
     * Property: For any array, filtering then mapping should preserve order
     * This demonstrates testing collection operations.
     */
    taggedPropertyTest(PBT_TAGS.COMPONENT, 'filter preserves order', async () => {
        await runPropertyTest(
            fc.property(fc.array(fc.integer()), (arr) => {
                const filtered = arr.filter((x) => x > 0);
                const mapped = filtered.map((x) => x * 2);

                // Check that order is preserved
                for (let i = 1; i < mapped.length; i++) {
                    const originalIndex = arr.indexOf(filtered[i]);
                    const prevOriginalIndex = arr.indexOf(filtered[i - 1]);
                    expect(originalIndex).toBeGreaterThan(prevOriginalIndex);
                }
            })
        );
    });

    /**
     * Example 4: Testing Component Props
     * 
     * Property: Button props should generate valid configurations
     * This demonstrates testing component prop combinations.
     */
    taggedPropertyTest(PBT_TAGS.COMPONENT, 'button props are valid', async () => {
        await runPropertyTest(
            fc.property(
                fc.record({
                    variant: buttonVariantArb,
                    size: buttonSizeArb,
                    disabled: booleanArb,
                    children: nonEmptyStringArb,
                }),
                (props) => {
                    // Validate that all props are defined
                    expect(props.variant).toBeDefined();
                    expect(props.size).toBeDefined();
                    expect(typeof props.disabled).toBe('boolean');
                    expect(props.children.length).toBeGreaterThan(0);

                    // Validate that variant is one of the allowed values
                    const validVariants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'ai', 'shimmer'];
                    expect(validVariants).toContain(props.variant);

                    // Validate that size is one of the allowed values
                    const validSizes = ['default', 'sm', 'lg', 'xl', 'icon'];
                    expect(validSizes).toContain(props.size);
                }
            )
        );
    });

    /**
     * Example 5: Testing Touch Target Sizes
     * 
     * Property: Touch targets should meet minimum size requirements (44x44px)
     * This demonstrates testing accessibility requirements.
     * 
     * **Validates: Requirements 9.1**
     */
    taggedPropertyTest(PBT_TAGS.ACCESSIBILITY, 'touch targets meet minimum size', async () => {
        await runPropertyTest(
            fc.property(
                fc.record({
                    width: touchTargetSizeArb,
                    height: touchTargetSizeArb,
                }),
                (dimensions) => {
                    // Property 8: Touch target size
                    // For any interactive element on mobile, the touch target should be at least 44x44 pixels
                    expect(dimensions.width).toBeGreaterThanOrEqual(44);
                    expect(dimensions.height).toBeGreaterThanOrEqual(44);
                }
            )
        );
    });

    /**
     * Example 6: Testing Bundle Size Constraints
     * 
     * Property: Bundle sizes should not exceed maximum threshold
     * This demonstrates testing performance requirements.
     * 
     * **Validates: Requirements 2.3, 10.1**
     */
    taggedPropertyTest(PBT_TAGS.PERFORMANCE, 'bundle size within limits', async () => {
        await runPropertyTest(
            fc.property(bundleSizeArb, (size) => {
                // Property 4: Bundle size constraint
                // For any page route, the initial JavaScript bundle size should not exceed 200KB
                const MAX_BUNDLE_SIZE_KB = 200;
                expect(size).toBeLessThanOrEqual(MAX_BUNDLE_SIZE_KB);
            })
        );
    });

    /**
     * Example 7: Testing Layout Shift Prevention
     * 
     * Property: Cumulative Layout Shift should be below threshold
     * This demonstrates testing Core Web Vitals.
     * 
     * **Validates: Requirements 2.5, 4.5, 7.5**
     */
    taggedPropertyTest(PBT_TAGS.PERFORMANCE, 'layout shift below threshold', async () => {
        await runPropertyTest(
            fc.property(layoutShiftScoreArb, (cls) => {
                // Property 5: Layout shift prevention
                // For any page load, the cumulative layout shift (CLS) should be less than 0.1
                const MAX_CLS = 0.1;
                expect(cls).toBeLessThan(MAX_CLS);
            })
        );
    });

    /**
     * Example 8: Testing Image Dimensions
     * 
     * Property: Images should have valid dimensions to prevent layout shift
     * This demonstrates testing image optimization requirements.
     * 
     * **Validates: Requirements 7.1, 7.2, 7.4**
     */
    taggedPropertyTest(PBT_TAGS.PERFORMANCE, 'images have valid dimensions', async () => {
        await runPropertyTest(
            fc.property(
                fc.record({
                    width: dimensionArb,
                    height: dimensionArb,
                }),
                (dimensions) => {
                    // Property 9: Image optimization
                    // Images should have proper sizing to prevent layout shift
                    expect(dimensions.width).toBeGreaterThan(0);
                    expect(dimensions.height).toBeGreaterThan(0);

                    // Reasonable dimension limits
                    expect(dimensions.width).toBeLessThanOrEqual(2000);
                    expect(dimensions.height).toBeLessThanOrEqual(2000);
                }
            )
        );
    });

    /**
     * Example 9: Testing Invariants
     * 
     * Property: Array length should be preserved after map operation
     * This demonstrates testing invariant properties.
     */
    taggedPropertyTest(PBT_TAGS.COMPONENT, 'map preserves array length', async () => {
        await runPropertyTest(
            fc.property(fc.array(fc.integer()), (arr) => {
                const mapped = arr.map((x) => x * 2);
                expect(mapped.length).toBe(arr.length);
            })
        );
    });

    /**
     * Example 10: Testing Round-Trip Properties
     * 
     * Property: Encoding then decoding should return original value
     * This demonstrates testing serialization/deserialization.
     */
    taggedPropertyTest(PBT_TAGS.COMPONENT, 'JSON round-trip preserves data', async () => {
        await runPropertyTest(
            fc.property(
                fc.record({
                    name: fc.string(),
                    age: fc.integer({ min: 0, max: 120 }),
                    active: fc.boolean(),
                }),
                (obj) => {
                    const encoded = JSON.stringify(obj);
                    const decoded = JSON.parse(encoded);
                    expect(decoded).toEqual(obj);
                }
            )
        );
    });
});

/**
 * Tips for Writing Property-Based Tests:
 * 
 * 1. **Think in terms of properties, not examples**
 *    - Instead of "button with variant='primary' should have blue background"
 *    - Think "for any button variant, the button should render consistently"
 * 
 * 2. **Use appropriate generators**
 *    - Use custom generators from property-generators.ts
 *    - Constrain generators to valid input domains
 *    - Avoid generating invalid inputs that should be caught by TypeScript
 * 
 * 3. **Test universal properties**
 *    - Invariants (properties that don't change)
 *    - Round-trip properties (encode/decode, serialize/deserialize)
 *    - Idempotence (doing it twice = doing it once)
 *    - Commutativity (order doesn't matter)
 *    - Metamorphic properties (relationships between inputs/outputs)
 * 
 * 4. **Tag your tests**
 *    - Use PBT_TAGS to categorize tests
 *    - Reference design document properties in comments
 *    - Link to requirements being validated
 * 
 * 5. **Handle edge cases in generators**
 *    - Empty arrays, empty strings, zero values
 *    - Boundary values (min/max)
 *    - Special characters, unicode
 * 
 * 6. **Keep tests focused**
 *    - One property per test
 *    - Clear, descriptive test names
 *    - Explain what property is being tested
 * 
 * 7. **Use standard configuration**
 *    - Always use runPropertyTest() helper
 *    - Minimum 100 iterations (standardPBTConfig)
 *    - Set appropriate timeouts for long-running tests
 */
