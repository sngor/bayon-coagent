/**
 * Property-Based Testing Generators
 * 
 * This file contains fast-check generators for component property testing.
 * These generators create random but valid props for components to test
 * universal properties across many input combinations.
 * 
 * @see https://github.com/dubzzz/fast-check
 */

import * as fc from 'fast-check';

/**
 * Button Variant Generator
 * Generates valid button variant values
 */
export const buttonVariantArb = fc.constantFrom(
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
    'ai',
    'shimmer'
);

/**
 * Button Size Generator
 * Generates valid button size values
 */
export const buttonSizeArb = fc.constantFrom(
    'default',
    'sm',
    'lg',
    'xl',
    'icon'
);

/**
 * Card Variant Generator
 * Generates valid card variant values
 */
export const cardVariantArb = fc.constantFrom(
    'base',
    'elevated',
    'floating',
    'modal',
    'premium',
    'bordered',
    'glass'
);

/**
 * Card Hover Effect Generator
 * Generates valid card hover effect values
 */
export const cardHoverEffectArb = fc.constantFrom(
    'lift',
    'glow',
    'scale',
    'none'
);

/**
 * Loading Variant Generator
 * Generates valid loading state variant values
 */
export const loadingVariantArb = fc.constantFrom(
    'spinner',
    'skeleton',
    'pulse',
    'shimmer'
);

/**
 * Loading Size Generator
 * Generates valid loading size values
 */
export const loadingSizeArb = fc.constantFrom('sm', 'md', 'lg');

/**
 * Error/Status Variant Generator
 * Generates valid error/status variant values
 */
export const statusVariantArb = fc.constantFrom('error', 'warning', 'info');

/**
 * Page Header Variant Generator
 * Generates valid page header variant values
 */
export const pageHeaderVariantArb = fc.constantFrom(
    'default',
    'hub',
    'compact'
);

/**
 * Section Container Variant Generator
 * Generates valid section container variant values
 */
export const sectionContainerVariantArb = fc.constantFrom(
    'default',
    'elevated',
    'bordered'
);

/**
 * Grid Column Count Generator
 * Generates valid grid column counts (1-4)
 */
export const gridColumnsArb = fc.constantFrom(1, 2, 3, 4);

/**
 * Gap Size Generator
 * Generates valid gap size values
 */
export const gapSizeArb = fc.constantFrom('sm', 'md', 'lg');

/**
 * Non-Empty String Generator
 * Generates non-empty strings for required text fields
 */
export const nonEmptyStringArb = fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);

/**
 * Optional String Generator
 * Generates optional strings (can be undefined)
 */
export const optionalStringArb = fc.option(
    fc.string({ minLength: 0, maxLength: 200 }),
    { nil: undefined }
);

/**
 * CSS Class Name Generator
 * Generates valid CSS class names
 */
export const classNameArb = fc.option(
    fc.stringMatching(/^[a-z][a-z0-9-]*( [a-z][a-z0-9-]*)*$/),
    { nil: undefined }
);

/**
 * Boolean Generator
 * Generates boolean values
 */
export const booleanArb = fc.boolean();

/**
 * Positive Integer Generator
 * Generates positive integers for dimensions, counts, etc.
 */
export const positiveIntArb = fc.integer({ min: 1, max: 1000 });

/**
 * Dimension Generator (width/height)
 * Generates valid dimension values in pixels
 */
export const dimensionArb = fc.integer({ min: 16, max: 2000 });

/**
 * Image Source Generator
 * Generates valid image source URLs or paths
 */
export const imageSourceArb = fc.oneof(
    fc.constant('/placeholder.jpg'),
    fc.constant('/test-image.png'),
    fc.webUrl({ validSchemes: ['https'] })
);

/**
 * Color Token Generator
 * Generates valid design token color references
 */
export const colorTokenArb = fc.constantFrom(
    'primary',
    'secondary',
    'success',
    'warning',
    'error',
    'muted',
    'accent'
);

/**
 * Spacing Token Generator
 * Generates valid spacing token values
 */
export const spacingTokenArb = fc.constantFrom(
    'xs',
    'sm',
    'md',
    'lg',
    'xl',
    '2xl',
    '3xl'
);

/**
 * Touch Target Size Generator
 * Generates dimensions that meet minimum touch target size (44x44px)
 */
export const touchTargetSizeArb = fc.integer({ min: 44, max: 200 });

/**
 * Bundle Size Generator (in KB)
 * Generates bundle sizes for testing performance constraints
 */
export const bundleSizeArb = fc.integer({ min: 1, max: 500 });

/**
 * Layout Shift Score Generator
 * Generates CLS (Cumulative Layout Shift) scores
 */
export const layoutShiftScoreArb = fc.double({ min: 0, max: 1, noNaN: true });

/**
 * Animation Duration Generator
 * Generates valid animation duration values in milliseconds
 */
export const animationDurationArb = fc.constantFrom(150, 200, 250, 300, 350, 400, 500);

/**
 * Transition Timing Function Generator
 * Generates valid CSS timing functions
 */
export const timingFunctionArb = fc.constantFrom(
    'ease',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'linear'
);

/**
 * Breadcrumb Generator
 * Generates breadcrumb items for navigation
 */
export const breadcrumbArb = fc.array(
    fc.record({
        label: nonEmptyStringArb,
        href: fc.option(fc.webUrl(), { nil: undefined }),
    }),
    { minLength: 0, maxLength: 5 }
);

/**
 * Action Button Generator
 * Generates action button configurations
 */
export const actionButtonArb = fc.option(
    fc.record({
        label: nonEmptyStringArb,
        onClick: fc.func(fc.constant(undefined)),
        variant: fc.option(buttonVariantArb, { nil: undefined }),
    }),
    { nil: undefined }
);

/**
 * Form Field Props Generator
 * Generates props for form field components
 */
export const formFieldPropsArb = fc.record({
    label: nonEmptyStringArb,
    id: fc.stringMatching(/^[a-z][a-z0-9-]*$/),
    error: optionalStringArb,
    helpText: optionalStringArb,
    required: booleanArb,
    className: classNameArb,
});

/**
 * Loading State Props Generator
 * Generates props for loading state components
 */
export const loadingStatePropsArb = fc.record({
    variant: loadingVariantArb,
    size: loadingSizeArb,
    text: optionalStringArb,
    fullScreen: booleanArb,
    className: classNameArb,
});

/**
 * Error Display Props Generator
 * Generates props for error display components
 */
export const errorDisplayPropsArb = fc.record({
    title: nonEmptyStringArb,
    message: nonEmptyStringArb,
    variant: statusVariantArb,
    action: actionButtonArb,
    className: classNameArb,
});

/**
 * Empty State Props Generator
 * Generates props for empty state components
 */
export const emptyStatePropsArb = fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    action: actionButtonArb,
    className: classNameArb,
});

/**
 * Page Header Props Generator
 * Generates props for page header components
 */
export const pageHeaderPropsArb = fc.record({
    title: nonEmptyStringArb,
    description: optionalStringArb,
    variant: pageHeaderVariantArb,
    breadcrumbs: breadcrumbArb,
});

/**
 * Section Container Props Generator
 * Generates props for section container components
 */
export const sectionContainerPropsArb = fc.record({
    title: optionalStringArb,
    description: optionalStringArb,
    variant: sectionContainerVariantArb,
    className: classNameArb,
});

/**
 * Grid Layout Props Generator
 * Generates props for grid layout components
 */
export const gridLayoutPropsArb = fc.record({
    columns: gridColumnsArb,
    gap: gapSizeArb,
    className: classNameArb,
});

/**
 * Image Props Generator
 * Generates props for optimized image components
 */
export const imagePropsArb = fc.record({
    src: imageSourceArb,
    alt: nonEmptyStringArb,
    width: dimensionArb,
    height: dimensionArb,
    priority: booleanArb,
    className: classNameArb,
});

/**
 * Helper: Run property test with standard configuration
 * 
 * @param property - The property to test
 * @param options - Optional fast-check configuration
 */
export function runPropertyTest<T>(
    property: fc.IProperty<T>,
    options?: fc.Parameters<T>
) {
    return fc.assert(property, {
        numRuns: 100, // Minimum 100 iterations as per design doc
        verbose: true,
        ...options,
    });
}

/**
 * Helper: Create a property test with standard configuration
 * 
 * @param arbitraries - The arbitraries to use
 * @param predicate - The property predicate to test
 */
export function createProperty<T extends unknown[]>(
    arbitraries: fc.Arbitrary<T[number]>[],
    predicate: (...args: T) => boolean | void
) {
    return fc.property(...(arbitraries as any), predicate);
}
