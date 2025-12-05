# Component Documentation System

## Overview

This document serves as the central hub for all component documentation in the Bayon Coagent design system. It provides a comprehensive guide to all available components, their usage patterns, and best practices.

## Documentation Structure

The component documentation is organized into the following categories:

1. **Standard Components** - Core UI components with consistent patterns
2. **Layout Components** - Page structure and layout utilities
3. **Performance Components** - Optimized components for better performance
4. **Transition Components** - Animation and transition utilities
5. **UI Components** - Base shadcn/ui components
6. **Feature Components** - Domain-specific components

## Quick Links

### Core Documentation

- [Standard Components](../../src/components/standard/README.md) - Form fields, buttons, loading states, error displays
- [Layout Components](../../src/components/layouts/README.md) - Page headers, sections, grids, wrappers
- [Performance Components](../../src/components/performance/README.md) - Lazy loading, virtual lists, optimized images
- [Transition Components](../../src/components/transitions/README.md) - Page and content transitions

### Design System Guides

- [Design Tokens](./design-tokens.md) - Colors, spacing, typography, shadows
- [Animation System](./animation-system.md) - Animation utilities and patterns
- [Mobile Optimizations](./mobile-optimizations-summary.md) - Touch targets, gestures, responsive design
- [Bundle Analysis](./bundle-analysis.md) - Performance monitoring and optimization

### Migration Guides

- [Component Migration Guide](#migration-guide) - How to migrate from old patterns
- [Breaking Changes](#breaking-changes) - List of breaking changes

## Component Categories

### 1. Standard Components

Consistent, reusable components for common UI patterns.

**Location:** `src/components/standard/`

**Components:**

- `StandardFormField` - Form field wrapper with label, error, help text
- `StandardLoadingState` - Unified loading indicators (spinner, skeleton, pulse, shimmer)
- `StandardErrorDisplay` - Consistent error messaging
- `StandardEmptyState` - Empty state patterns with call-to-action
- `SaveButton`, `CancelButton`, `DeleteButton`, etc. - Semantic action buttons
- `FormActions` - Standardized form button groups
- `DialogActions` - Dialog-specific button groups

**Documentation:** [Standard Components README](../../src/components/standard/README.md)

**Quick Start:** [Standard Components Quick Start](../../src/components/standard/QUICK_START.md)

### 2. Layout Components

Components for consistent page structures and layouts.

**Location:** `src/components/layouts/`

**Components:**

- `PageHeader` - Standardized page header with title, description, icon, actions
- `SectionContainer` - Section wrapper with optional header and footer
- `GridLayout` - Responsive grid layout with consistent spacing
- `ContentWrapper` - Content container with max-width and padding

**Documentation:** [Layout Components README](../../src/components/layouts/README.md)

**Quick Start:** [Layout Components Quick Start](../../src/components/layouts/QUICK_START.md)

### 3. Performance Components

Optimized components for better performance and user experience.

**Location:** `src/components/performance/`

**Components:**

- `LazyComponent` - Dynamic import wrapper with loading fallback
- `VirtualList` - Virtualized list for large datasets
- `OptimizedImage` - Next.js Image wrapper with consistent patterns
- `HeroImage`, `CardImage`, `AvatarImage` - Preset image components

**Documentation:** [Performance Components README](../../src/components/performance/README.md)

**Quick Start:** [Performance Components Quick Start](../../src/components/performance/QUICK_START.md)

### 4. Transition Components

Animation and transition utilities for smooth user experiences.

**Location:** `src/components/transitions/`

**Components:**

- `PageTransition` - Smooth page transitions
- `ContentTransition` - Content fade-in animations

**Documentation:** [Transition Components README](../../src/components/transitions/README.md)

### 5. UI Components (shadcn/ui)

Base UI components from shadcn/ui library.

**Location:** `src/components/ui/`

**Key Components:**

- `Button` - Base button component with variants
- `Card` - Card container with variants
- `Input` - Form input component
- `Dialog` - Modal dialog component
- `Tabs` - Tab navigation component
- `AnimatedTabs` - Animated tab navigation (preferred)
- And many more...

**Note:** These are the foundation components. Prefer using Standard Components which wrap these with consistent patterns.

## Usage Patterns

### Standard Page Layout

```tsx
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
  GridLayout,
} from "@/components/layouts";
import { StandardLoadingState } from "@/components/standard";

export default function MyPage() {
  return (
    <ContentWrapper maxWidth="default">
      <div className="space-y-8">
        <PageHeader
          title="My Page"
          description="Page description"
          icon={Home}
          actions={<Button>Action</Button>}
          variant="default"
        />

        <SectionContainer
          title="Section Title"
          description="Section description"
          variant="elevated"
        >
          <GridLayout columns={3} gap="lg">
            {/* Content */}
          </GridLayout>
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

### Form with Standard Components

```tsx
import { StandardFormField, FormActions } from "@/components/standard";
import { Input } from "@/components/ui/input";

export default function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <StandardFormField
        label="Email Address"
        id="email"
        error={errors.email}
        helpText="We'll never share your email"
        required
      >
        <Input type="email" id="email" />
      </StandardFormField>

      <FormActions
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitText="Save Changes"
      />
    </form>
  );
}
```

### Performance-Optimized Component

```tsx
import { LazyComponent, OptimizedImage } from "@/components/performance";
import { StandardLoadingState } from "@/components/standard";

export default function MyPage() {
  return (
    <div>
      <OptimizedImage
        src="/hero.jpg"
        alt="Hero image"
        width={1200}
        height={600}
        priority
      />

      <LazyComponent
        loader={() => import("./HeavyChart")}
        fallback={<StandardLoadingState variant="skeleton" />}
        props={{ data: chartData }}
      />
    </div>
  );
}
```

## Design Principles

### 1. Consistency

All components follow consistent patterns for:

- Prop naming conventions
- Variant naming (default, elevated, bordered, etc.)
- Size naming (sm, md, lg, xl)
- Color usage (design tokens)
- Spacing (design system scale)

### 2. Accessibility

All components include:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader support
- Semantic HTML

### 3. Performance

Components are optimized for:

- Minimal bundle size
- Lazy loading where appropriate
- Virtual scrolling for large lists
- Image optimization
- Code splitting

### 4. Developer Experience

Components provide:

- TypeScript support with full type safety
- Clear prop interfaces with JSDoc comments
- Usage examples and demos
- Migration guides
- Quick start guides

## Component Prop Patterns

### Common Props

Most components accept these common props:

```typescript
interface CommonProps {
  className?: string; // Additional CSS classes
  children?: React.ReactNode; // Child elements
}
```

### Variant Props

Components with visual variants:

```typescript
interface VariantProps {
  variant?: "default" | "elevated" | "bordered" | "ghost";
}
```

### Size Props

Components with size options:

```typescript
interface SizeProps {
  size?: "sm" | "md" | "lg" | "xl";
}
```

### Loading Props

Components with loading states:

```typescript
interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
}
```

### Action Props

Components with actions:

```typescript
interface ActionProps {
  onClick?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}
```

## Testing Components

### Unit Testing

```tsx
import { render, screen } from "@testing-library/react";
import { StandardFormField } from "@/components/standard";

test("displays error message", () => {
  render(
    <StandardFormField label="Email" id="email" error="Invalid email">
      <input id="email" />
    </StandardFormField>
  );

  expect(screen.getByText("Invalid email")).toBeInTheDocument();
});
```

### Property-Based Testing

```tsx
import fc from "fast-check";
import { render } from "@testing-library/react";
import { Button } from "@/components/ui/button";

test("button renders consistently", () => {
  fc.assert(
    fc.property(
      fc.record({
        variant: fc.constantFrom("default", "outline", "ghost"),
        size: fc.constantFrom("sm", "md", "lg"),
        children: fc.string(),
      }),
      (props) => {
        const result1 = render(<Button {...props} />);
        const result2 = render(<Button {...props} />);
        expect(result1.container.innerHTML).toBe(result2.container.innerHTML);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Migration Guide

### From Custom Components to Standard Components

#### Before (Custom Button)

```tsx
<Button onClick={handleSave} disabled={isSaving}>
  {isSaving ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="mr-2 h-4 w-4" />
      Save
    </>
  )}
</Button>
```

#### After (Standard Button)

```tsx
<SaveButton onClick={handleSave} loading={isSaving} />
```

### From Manual Layout to Layout Components

#### Before (Manual Layout)

```tsx
<div className="container mx-auto px-4 max-w-7xl">
  <div className="mb-8">
    <h1 className="text-3xl font-bold">My Page</h1>
    <p className="text-muted-foreground">Page description</p>
  </div>

  <div className="bg-card rounded-lg p-6 shadow-md">
    <h2 className="text-xl font-semibold mb-4">Section Title</h2>
    {/* Content */}
  </div>
</div>
```

#### After (Layout Components)

```tsx
<ContentWrapper maxWidth="default">
  <div className="space-y-8">
    <PageHeader title="My Page" description="Page description" />

    <SectionContainer title="Section Title" variant="elevated">
      {/* Content */}
    </SectionContainer>
  </div>
</ContentWrapper>
```

### From Direct Image to Optimized Image

#### Before (Direct Next.js Image)

```tsx
<Image
  src="/image.jpg"
  alt="Image"
  width={800}
  height={600}
  loading="lazy"
  className="rounded-lg"
/>
```

#### After (Optimized Image)

```tsx
<OptimizedImage
  src="/image.jpg"
  alt="Image"
  width={800}
  height={600}
  aspectRatio="4/3"
/>
```

## Breaking Changes

### Version 1.0.0 (Current)

**Standard Components:**

- Renamed `LoadingSpinner` to `StandardLoadingState`
- Changed `FormField` to `StandardFormField`
- Removed `variant="primary"` from buttons (use `variant="default"`)

**Layout Components:**

- Changed `PageHeader` prop `subtitle` to `description`
- Removed `Container` component (use `ContentWrapper`)
- Changed `Section` to `SectionContainer`

**Performance Components:**

- Renamed `LazyLoad` to `LazyComponent`
- Changed `VirtualizedList` to `VirtualList`
- Removed `ImageOptimizer` (use `OptimizedImage`)

## Best Practices

### 1. Use Standard Components

Always prefer Standard Components over custom implementations:

```tsx
// ✅ Good
<SaveButton onClick={handleSave} loading={isSaving} />

// ❌ Avoid
<Button onClick={handleSave} disabled={isSaving}>
  {isSaving ? "Saving..." : "Save"}
</Button>
```

### 2. Use Layout Components

Use Layout Components for consistent page structures:

```tsx
// ✅ Good
<ContentWrapper maxWidth="default">
  <PageHeader title="My Page" />
  <SectionContainer title="Section">{/* Content */}</SectionContainer>
</ContentWrapper>

// ❌ Avoid
<div className="container mx-auto px-4">
  <h1>My Page</h1>
  <div className="bg-card p-6">{/* Content */}</div>
</div>
```

### 3. Optimize Performance

Use Performance Components for heavy content:

```tsx
// ✅ Good
<LazyComponent
  loader={() => import("./HeavyChart")}
  fallback={<StandardLoadingState variant="skeleton" />}
/>;

// ❌ Avoid
import HeavyChart from "./HeavyChart"; // Loaded immediately
```

### 4. Use Design Tokens

Reference design tokens instead of hardcoded values:

```tsx
// ✅ Good
<div className="bg-card text-foreground border-border">

// ❌ Avoid
<div className="bg-white text-black border-gray-300">
```

### 5. Provide Accessibility

Always include proper accessibility attributes:

```tsx
// ✅ Good
<StandardFormField label="Email" id="email" required>
  <Input type="email" id="email" aria-required="true" />
</StandardFormField>

// ❌ Avoid
<div>
  <label>Email</label>
  <input type="email" />
</div>
```

## Component Checklist

When creating or using components, ensure:

- [ ] Uses design tokens for colors, spacing, typography
- [ ] Includes TypeScript types with JSDoc comments
- [ ] Has proper accessibility attributes
- [ ] Follows naming conventions (Standard*, *Layout, Optimized\*)
- [ ] Includes loading states where appropriate
- [ ] Has error handling and fallbacks
- [ ] Is responsive and mobile-friendly
- [ ] Has usage examples and documentation
- [ ] Is tested (unit tests and/or property tests)
- [ ] Follows performance best practices

## Resources

### Documentation

- [Design Tokens](./design-tokens.md)
- [Animation System](./animation-system.md)
- [Mobile Optimizations](./mobile-optimizations-summary.md)
- [Bundle Analysis](./bundle-analysis.md)

### Examples

- [Standard Components Demo](../../src/components/standard/demo.tsx)
- [Layout Components Demo](../../src/components/layouts/demo.tsx)
- [Performance Components Demo](../../src/components/performance/demo.tsx)

### Testing

- [Property Test Examples](../../src/__tests__/examples/property-test-example.test.ts)
- [Test Configuration](../../src/__tests__/config/pbt-config.ts)
- [Property Generators](../../src/__tests__/utils/property-generators.ts)

## Support

For questions or issues with components:

1. Check the component's README file
2. Review the Quick Start guide
3. Look at the demo file for examples
4. Check the migration guide for breaking changes

## Contributing

When adding new components:

1. Follow the existing patterns and conventions
2. Add comprehensive documentation
3. Include usage examples
4. Write tests (unit and property-based)
5. Update this documentation index
6. Add to the appropriate category
