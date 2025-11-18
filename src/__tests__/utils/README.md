# Property-Based Testing Utilities

This directory contains utilities for property-based testing using fast-check.

## Overview

Property-based testing is a testing approach where you define properties (invariants) that should hold true for all valid inputs, and the testing framework generates random test cases to verify these properties.

## Installation

fast-check is already installed as a dev dependency. To use it in your tests:

```typescript
import * as fc from "fast-check";
import { generators, matchers, helpers } from "@/__tests__/utils";
```

## Usage

### Generators

Generators create random test data that matches domain constraints:

```typescript
import * as fc from "fast-check";
import { colorArbitrary, viewportArbitrary } from "@/__tests__/utils";

// Test that a function works with any valid color
fc.assert(
  fc.property(colorArbitrary(), (color) => {
    const result = processColor(color);
    return result !== null;
  })
);

// Test responsive behavior with random viewports
fc.assert(
  fc.property(viewportArbitrary(), (viewport) => {
    const layout = calculateLayout(viewport);
    return layout.width <= viewport.width;
  })
);
```

### Matchers

Matchers provide domain-specific assertions:

```typescript
import { hasMinimumContrast, meetsTouchTargetSize } from "@/__tests__/utils";

// Check color contrast
expect(hasMinimumContrast("#000000", "#FFFFFF", 4.5)).toBe(true);

// Check touch target size
expect(meetsTouchTargetSize(48, 48)).toBe(true);
expect(meetsTouchTargetSize(40, 40)).toBe(false);
```

### Helpers

Helpers provide utilities for test setup and execution:

```typescript
import { runPropertyTest, mockViewport, delay } from "@/__tests__/utils";

// Run a property test with custom iterations
await runPropertyTest(
  fc.property(fc.integer(), (n) => n + 0 === n),
  200 // Run 200 times instead of default 100
);

// Mock viewport for responsive tests
const viewport = mockViewport(375, 667); // iPhone size
expect(viewport.isMobile).toBe(true);

// Simulate async delays
await delay(100);
```

## Available Generators

### UI/UX Generators

- `colorArbitrary()` - Valid CSS colors (hex, rgb, hsl)
- `viewportArbitrary()` - Valid viewport sizes
- `breakpointArbitrary()` - Breakpoint names (mobile, tablet, desktop, wide)
- `classNameArbitrary()` - Valid CSS class names
- `animationDurationArbitrary()` - Animation durations (100-2000ms)
- `opacityArbitrary()` - Opacity values (0-1)
- `zIndexArbitrary()` - Z-index values
- `percentageArbitrary()` - Percentage strings
- `pixelArbitrary()` - Pixel values
- `touchTargetArbitrary()` - Touch target sizes (min 44x44px)

### Theme & Variants

- `themeArbitrary()` - Theme names (light, dark, system)
- `buttonVariantArbitrary()` - Button variants
- `cardVariantArbitrary()` - Card variants
- `toastTypeArbitrary()` - Toast notification types
- `loadingStateArbitrary()` - Loading states

### Data Generators

- `nonEmptyStringArbitrary()` - Non-empty strings
- `whitespaceStringArbitrary()` - Whitespace-only strings
- `emailArbitrary()` - Valid email addresses
- `phoneArbitrary()` - Valid phone numbers (US format)
- `urlArbitrary()` - Valid URLs
- `userIdArbitrary()` - User IDs (UUIDs)
- `timestampArbitrary()` - Valid timestamps
- `metricArbitrary()` - Metric objects with value, label, change

### Accessibility

- `ariaRoleArbitrary()` - Valid ARIA roles
- `contrastRatioArbitrary()` - Contrast ratios (1-21)

## Available Matchers

### Color & Contrast

- `hasMinimumContrast(fg, bg, minRatio)` - Check contrast ratio
- `meetsWCAGAA(ratio, isLargeText)` - WCAG AA compliance
- `meetsWCAGAAA(ratio, isLargeText)` - WCAG AAA compliance
- `isValidColor(color)` - Validate CSS color

### Responsive Design

- `isMobileViewport(width)` - Check if mobile (<768px)
- `isTabletViewport(width)` - Check if tablet (768-1024px)
- `isDesktopViewport(width)` - Check if desktop (>=1024px)
- `meetsTouchTargetSize(w, h, minSize)` - Check touch target size

### Validation

- `isEmptyOrWhitespace(str)` - Check empty/whitespace strings
- `isValidEmail(email)` - Validate email format
- `isValidUrl(url)` - Validate URL format
- `isValidPhone(phone)` - Validate phone format
- `isValidClassName(className)` - Validate CSS class name
- `isValidAriaRole(role)` - Validate ARIA role

### Utilities

- `isReasonableAnimationDuration(ms)` - Check animation duration
- `isReasonableZIndex(z)` - Check z-index value
- `isValidOpacity(opacity)` - Check opacity value
- `isWithinPercentage(val, target, pct)` - Check percentage tolerance
- `haveSameElements(arr1, arr2)` - Compare arrays (order-independent)
- `hasRequiredProperties(obj, props)` - Check required properties

## Available Helpers

### Test Execution

- `runPropertyTest(property, numRuns)` - Run property test with custom iterations
- `waitFor(condition, timeout, interval)` - Wait for condition
- `delay(ms)` - Async delay
- `measureTime(fn)` - Measure execution time

### Mocking

- `mockViewport(width, height)` - Mock viewport object
- `mockTheme(theme)` - Mock theme context
- `mockUser(overrides)` - Mock user object
- `mockToast(overrides)` - Mock toast notification
- `mockElement(overrides)` - Mock DOM element

### Utilities

- `expectToThrow(fn, errorMsg)` - Check if function throws
- `expectToThrowAsync(fn, errorMsg)` - Check if async function throws
- `createSpy()` - Create spy function
- `deepEqual(a, b)` - Deep equality check
- `range(start, end, step)` - Generate number range
- `shuffle(array)` - Shuffle array
- `groupBy(array, keyFn)` - Group array by key
- `randomSubset(array, minSize)` - Random array subset

## Example Test

Here's a complete example of a property-based test:

```typescript
import * as fc from "fast-check";
import { describe, it, expect } from "@jest/globals";
import { colorArbitrary, isValidColor } from "@/__tests__/utils";

describe("Color Processing", () => {
  it("should preserve valid colors", () => {
    fc.assert(
      fc.property(colorArbitrary(), (color) => {
        const processed = processColor(color);
        return isValidColor(processed);
      }),
      { numRuns: 100 }
    );
  });

  it("should handle all viewport sizes", () => {
    fc.assert(
      fc.property(fc.integer({ min: 320, max: 3840 }), (width) => {
        const layout = calculateLayout(width);
        return layout.width <= width;
      })
    );
  });
});
```

## Configuration

The default number of test runs is 100. You can configure this in your tests:

```typescript
fc.assert(property, { numRuns: 200 }); // Run 200 times
```

For the UI/UX enhancement spec, we recommend:

- **100 runs** for most properties (default)
- **200+ runs** for critical accessibility properties
- **50 runs** for expensive operations (e.g., rendering tests)

## Best Practices

1. **Start Simple**: Begin with basic properties and add complexity
2. **Use Domain Generators**: Use custom generators that match your domain constraints
3. **Test Invariants**: Focus on properties that should always be true
4. **Shrinking**: fast-check automatically shrinks failing cases to minimal examples
5. **Seed for Reproducibility**: Use `seed` option to reproduce specific test runs
6. **Combine with Unit Tests**: Use both property tests and example-based unit tests

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/Guides.md)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
