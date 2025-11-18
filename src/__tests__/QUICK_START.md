# Property-Based Testing Quick Start

## What is Property-Based Testing?

Property-based testing verifies that your code satisfies certain properties (invariants) for **all** valid inputs, not just specific examples. Instead of writing individual test cases, you define properties that should always hold true, and the testing framework generates hundreds of random test cases automatically.

## Quick Example

**Traditional Unit Test:**

```typescript
it("should add numbers correctly", () => {
  expect(add(2, 3)).toBe(5);
  expect(add(0, 0)).toBe(0);
  expect(add(-1, 1)).toBe(0);
});
```

**Property-Based Test:**

```typescript
it("addition should be commutative", () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      return add(a, b) === add(b, a);
    })
  );
});
// This runs 100 times with random integers!
```

## Getting Started

### 1. Import fast-check and utilities

```typescript
import * as fc from "fast-check";
import { colorArbitrary, viewportArbitrary } from "@/__tests__/utils";
```

### 2. Write a property test

```typescript
describe("My Component", () => {
  it("should handle any valid color", () => {
    fc.assert(
      fc.property(colorArbitrary(), (color) => {
        const result = processColor(color);
        return result !== null; // Property: always returns non-null
      }),
      { numRuns: 100 } // Run 100 times
    );
  });
});
```

## Common Patterns

### Testing UI Components

```typescript
// Test responsive behavior
it("should adapt to any viewport size", () => {
  fc.assert(
    fc.property(viewportArbitrary(), (viewport) => {
      const layout = calculateLayout(viewport);
      // Property: layout never exceeds viewport
      return layout.width <= viewport.width;
    })
  );
});

// Test touch targets
it("should have accessible touch targets", () => {
  fc.assert(
    fc.property(touchTargetArbitrary(), (size) => {
      const button = createButton(size);
      // Property: all buttons meet minimum size
      return button.width >= 44 && button.height >= 44;
    })
  );
});
```

### Testing Validation

```typescript
// Test that empty strings are rejected
it("should reject whitespace-only input", () => {
  fc.assert(
    fc.property(whitespaceStringArbitrary(), (input) => {
      const result = validateInput(input);
      // Property: whitespace is always invalid
      return result.isValid === false;
    })
  );
});

// Test that valid emails pass
it("should accept valid emails", () => {
  fc.assert(
    fc.property(emailArbitrary(), (email) => {
      const result = validateEmail(email);
      // Property: generated emails are always valid
      return result.isValid === true;
    })
  );
});
```

### Testing Invariants

```typescript
// Test that operations preserve properties
it("should preserve list length when sorting", () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted = sortArray(arr);
      // Property: sorting doesn't change length
      return sorted.length === arr.length;
    })
  );
});

// Test round-trip properties
it("should round-trip through serialization", () => {
  fc.assert(
    fc.property(fc.object(), (obj) => {
      const serialized = JSON.stringify(obj);
      const deserialized = JSON.parse(serialized);
      // Property: serialize then deserialize returns same value
      return deepEqual(obj, deserialized);
    })
  );
});
```

### Testing Accessibility

```typescript
// Test color contrast
it("should maintain minimum contrast", () => {
  fc.assert(
    fc.property(colorArbitrary(), colorArbitrary(), (fg, bg) => {
      const contrast = calculateContrast(fg, bg);
      // Property: contrast meets WCAG AA
      return contrast >= 4.5;
    })
  );
});

// Test ARIA attributes
it("should have valid ARIA roles", () => {
  fc.assert(
    fc.property(ariaRoleArbitrary(), (role) => {
      const element = createElement({ role });
      // Property: all roles are valid
      return isValidAriaRole(element.getAttribute("role"));
    })
  );
});
```

## Available Generators

Quick reference of most useful generators:

```typescript
// UI/UX
colorArbitrary(); // CSS colors
viewportArbitrary(); // Viewport sizes
buttonVariantArbitrary(); // Button variants
themeArbitrary(); // light/dark/system

// Data
nonEmptyStringArbitrary(); // Non-empty strings
emailArbitrary(); // Valid emails
urlArbitrary(); // Valid URLs
phoneArbitrary(); // Phone numbers

// Accessibility
touchTargetArbitrary(); // Touch target sizes (min 44x44)
ariaRoleArbitrary(); // Valid ARIA roles
contrastRatioArbitrary(); // Contrast ratios

// Validation
whitespaceStringArbitrary(); // Whitespace-only strings
```

## Tips

1. **Start with simple properties**: "output is never null", "length is preserved"
2. **Use 100 runs by default**: `{ numRuns: 100 }`
3. **Increase runs for critical code**: `{ numRuns: 200 }` for accessibility
4. **Let it fail**: When a test fails, fast-check shows the minimal failing case
5. **Combine with unit tests**: Use both property tests AND example tests

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run in watch mode
npm run test:watch

# Generate coverage
npm run test:coverage
```

## Example Test File

```typescript
import * as fc from "fast-check";
import { describe, it, expect } from "@jest/globals";
import { colorArbitrary, isValidColor } from "@/__tests__/utils";

describe("Color Utils", () => {
  // Property test
  it("should preserve valid colors", () => {
    fc.assert(
      fc.property(colorArbitrary(), (color) => {
        const processed = processColor(color);
        return isValidColor(processed);
      }),
      { numRuns: 100 }
    );
  });

  // Traditional unit test for specific case
  it("should handle black color", () => {
    expect(processColor("#000000")).toBe("#000000");
  });
});
```

## Next Steps

1. Read the full documentation in `src/__tests__/utils/README.md`
2. Look at `src/__tests__/example.test.ts` for more examples
3. Start writing property tests for your features!

## Resources

- [fast-check GitHub](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://github.com/dubzzz/fast-check/blob/main/documentation/Guides.md)
