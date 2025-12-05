# Testing Infrastructure

This directory contains the testing infrastructure for the Bayon Coagent application, including unit tests, property-based tests, and testing utilities.

## Directory Structure

```
src/__tests__/
├── config/
│   └── pbt-config.ts          # Property-based testing configuration
├── utils/
│   └── property-generators.ts # fast-check generators for components
├── examples/
│   └── property-test-example.test.ts # Example property tests
├── mocks/
│   └── setup.ts               # Test setup and mocks
└── README.md                  # This file
```

## Testing Approach

We use a dual testing approach:

### 1. Unit Tests

- Test specific examples and edge cases
- Verify individual component behavior
- Test integration between components
- Use Jest and React Testing Library

### 2. Property-Based Tests

- Test universal properties across many inputs
- Verify correctness properties from design document
- Use fast-check for property-based testing
- Run minimum 100 iterations per property

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only property-based tests
npm test -- --testNamePattern="pbt:"

# Run specific test file
npm test -- path/to/test.test.ts
```

## Writing Unit Tests

Unit tests verify specific examples and edge cases:

```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with primary variant", () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByRole("button").click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Writing Property-Based Tests

Property-based tests verify universal properties:

```typescript
import * as fc from "fast-check";
import {
  runPropertyTest,
  PBT_TAGS,
  taggedPropertyTest,
} from "../config/pbt-config";
import { buttonVariantArb, buttonSizeArb } from "../utils/property-generators";

describe("Button Properties", () => {
  // Feature: design-system-performance, Property 1: Component Consistency
  taggedPropertyTest(
    PBT_TAGS.COMPONENT,
    "button renders consistently",
    async () => {
      await runPropertyTest(
        fc.property(
          fc.record({
            variant: buttonVariantArb,
            size: buttonSizeArb,
            children: fc.string(),
          }),
          (props) => {
            // For any button props, rendering twice should produce identical output
            const result1 = render(<Button {...props} />);
            const result2 = render(<Button {...props} />);
            expect(result1.container.innerHTML).toBe(
              result2.container.innerHTML
            );
          }
        )
      );
    }
  );
});
```

## Property-Based Testing Guidelines

### 1. Use Appropriate Generators

Always use generators from `property-generators.ts`:

```typescript
import {
  buttonVariantArb,
  loadingVariantArb,
  touchTargetSizeArb,
  nonEmptyStringArb,
} from "../utils/property-generators";
```

### 2. Tag Your Tests

Use tags to categorize tests:

```typescript
import { PBT_TAGS, taggedPropertyTest } from "../config/pbt-config";

taggedPropertyTest(PBT_TAGS.ACCESSIBILITY, "test name", async () => {
  // test implementation
});
```

Available tags:

- `PBT_TAGS.COMPONENT` - Component behavior tests
- `PBT_TAGS.LAYOUT` - Layout and structure tests
- `PBT_TAGS.PERFORMANCE` - Performance constraint tests
- `PBT_TAGS.ACCESSIBILITY` - Accessibility requirement tests
- `PBT_TAGS.DESIGN_TOKENS` - Design token usage tests
- `PBT_TAGS.ANIMATION` - Animation and transition tests
- `PBT_TAGS.RESPONSIVE` - Responsive design tests

### 3. Reference Design Document

Always reference the correctness property and requirements:

```typescript
/**
 * Property 8: Touch Target Size
 *
 * For any interactive element on mobile, the touch target should be at least 44x44 pixels
 *
 * **Validates: Requirements 9.1**
 */
taggedPropertyTest(
  PBT_TAGS.ACCESSIBILITY,
  "touch targets meet minimum size",
  async () => {
    // test implementation
  }
);
```

### 4. Use Standard Configuration

Always use `runPropertyTest()` helper:

```typescript
await runPropertyTest(
  fc.property(/* arbitraries */, (/* args */) => {
    // test logic
  })
);
```

This ensures:

- Minimum 100 iterations
- Proper error reporting
- Consistent configuration

### 5. Test Universal Properties

Focus on properties that should hold for all inputs:

**Invariants:**

```typescript
// Array length preserved after map
fc.property(fc.array(fc.integer()), (arr) => {
  const mapped = arr.map((x) => x * 2);
  expect(mapped.length).toBe(arr.length);
});
```

**Round-trip:**

```typescript
// Encode/decode returns original
fc.property(fc.object(), (obj) => {
  const encoded = JSON.stringify(obj);
  const decoded = JSON.parse(encoded);
  expect(decoded).toEqual(obj);
});
```

**Idempotence:**

```typescript
// Doing it twice = doing it once
fc.property(fc.array(fc.integer()), (arr) => {
  const unique1 = [...new Set(arr)];
  const unique2 = [...new Set(unique1)];
  expect(unique2).toEqual(unique1);
});
```

**Metamorphic:**

```typescript
// Relationship between operations
fc.property(fc.array(fc.integer()), (arr) => {
  const filtered = arr.filter((x) => x > 0);
  expect(filtered.length).toBeLessThanOrEqual(arr.length);
});
```

## Common Patterns

### Testing Component Consistency

```typescript
// Property 1: Component Consistency
taggedPropertyTest(
  PBT_TAGS.COMPONENT,
  "component renders consistently",
  async () => {
    await runPropertyTest(
      fc.property(componentPropsArb, (props) => {
        const result1 = render(<Component {...props} />);
        const result2 = render(<Component {...props} />);
        expect(result1.container.innerHTML).toBe(result2.container.innerHTML);
      })
    );
  }
);
```

### Testing Design Token Usage

```typescript
// Property 6: Design Token Usage
taggedPropertyTest(PBT_TAGS.DESIGN_TOKENS, "uses design tokens", async () => {
  await runPropertyTest(
    fc.property(colorTokenArb, (token) => {
      const element = render(<Component color={token} />);
      const style = window.getComputedStyle(element.container.firstChild);
      // Verify color comes from design token
      expect(style.color).toMatch(/hsl\(var\(--/);
    })
  );
});
```

### Testing Performance Constraints

```typescript
// Property 4: Bundle Size Constraint
taggedPropertyTest(
  PBT_TAGS.PERFORMANCE,
  "bundle size within limits",
  async () => {
    await runPropertyTest(
      fc.property(bundleSizeArb, (size) => {
        const MAX_BUNDLE_SIZE_KB = 200;
        expect(size).toBeLessThanOrEqual(MAX_BUNDLE_SIZE_KB);
      })
    );
  }
);
```

### Testing Accessibility

```typescript
// Property 8: Touch Target Size
taggedPropertyTest(
  PBT_TAGS.ACCESSIBILITY,
  "touch targets meet minimum",
  async () => {
    await runPropertyTest(
      fc.property(touchTargetSizeArb, touchTargetSizeArb, (width, height) => {
        expect(width).toBeGreaterThanOrEqual(44);
        expect(height).toBeGreaterThanOrEqual(44);
      })
    );
  }
);
```

## Troubleshooting

### Test Failures

When a property test fails, fast-check will:

1. Show the failing input
2. Attempt to shrink it to the smallest failing case
3. Provide a seed for reproducibility

Example failure output:

```
Property failed after 42 tests
{ seed: 1234567890, path: "42:0:1", endOnFailure: true }
Counterexample: { variant: "primary", size: "sm", disabled: false }
Shrunk 5 time(s)
Got error: Expected "bg-primary" but received "bg-secondary"
```

To reproduce:

```typescript
await runPropertyTest(property, { seed: 1234567890, path: "42:0:1" });
```

### Slow Tests

If property tests are too slow:

1. Reduce `numRuns` during development (use `quickPBTConfig`)
2. Simplify generators to produce smaller inputs
3. Use `fc.sample()` to inspect generated values
4. Consider if the property is too complex

### Flaky Tests

If tests are flaky:

1. Check for non-deterministic behavior (random, Date.now(), etc.)
2. Ensure generators produce valid inputs
3. Verify test doesn't depend on execution order
4. Use fixed seeds to reproduce issues

## Best Practices

1. **Write properties, not examples** - Think about what should be true for all inputs
2. **Use descriptive names** - Test names should explain the property being tested
3. **Keep tests focused** - One property per test
4. **Reference design docs** - Link to correctness properties and requirements
5. **Use appropriate generators** - Constrain to valid input domains
6. **Tag tests** - Use PBT_TAGS for categorization
7. **Run minimum 100 iterations** - Use standard configuration
8. **Handle edge cases** - Empty arrays, null values, boundary conditions
9. **Test pure functions first** - Easier to reason about properties
10. **Combine with unit tests** - Use both approaches for comprehensive coverage

## Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Property-Based Testing Guide](https://fsharpforfunandprofit.com/posts/property-based-testing/)
- [Design System Performance Spec](.kiro/specs/design-system-performance/design.md)
- [Design Token Documentation](docs/design-system/design-tokens.md)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)

## Questions?

If you have questions about testing:

1. Check this README
2. Review example tests in `examples/`
3. Consult the design document
4. Ask the team in #engineering
