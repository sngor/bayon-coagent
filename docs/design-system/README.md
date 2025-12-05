# Design System Documentation

Welcome to the Bayon Coagent Design System documentation. This comprehensive guide covers all aspects of the design system, from components to patterns to performance optimization.

## Quick Start

New to the design system? Start here:

1. **[Component Documentation](./COMPONENT_DOCUMENTATION.md)** - Overview of all components and how to use them
2. **[Usage Examples](./USAGE_EXAMPLES.md)** - Real-world examples and patterns
3. **[Migration Guide](./MIGRATION_GUIDE.md)** - Migrate from old patterns to new components

## Documentation Structure

### Core Documentation

#### [Component Documentation](./COMPONENT_DOCUMENTATION.md)

Central hub for all component documentation. Includes:

- Component categories and organization
- Quick links to specific components
- Usage patterns and best practices
- Testing guidelines
- Component checklist

#### [Component Catalog](./COMPONENT_CATALOG.md)

Comprehensive catalog with detailed prop tables and examples:

- Standard Components (forms, buttons, loading, errors)
- Layout Components (headers, sections, grids, wrappers)
- Performance Components (lazy loading, virtual lists, optimized images)
- Transition Components (animations and transitions)
- UI Components (base shadcn/ui components)
- Accessibility notes for each component
- Performance impact metrics

#### [Usage Examples](./USAGE_EXAMPLES.md)

Real-world examples demonstrating:

- Page layouts (standard, hub, dashboard)
- Forms (simple, multi-step)
- Data display (tables, grids)
- Loading states
- Error handling
- Performance optimization
- Common patterns

#### [Migration Guide](./MIGRATION_GUIDE.md)

Step-by-step guide for migrating to the new design system:

- Breaking changes
- Component migrations with before/after examples
- Pattern migrations
- Common issues and solutions
- Migration checklist

### Design System Guides

#### [Design Tokens](./design-tokens.md)

Centralized design tokens for consistency:

- Color system
- Typography scale
- Spacing scale
- Shadow system
- Border styles
- Transition timing
- Usage guidelines

#### [Animation System](./animation-system.md)

Animation utilities and patterns:

- Animation classes
- Transition utilities
- Reduced motion support
- Performance considerations
- Usage examples

#### [Mobile Optimizations](./mobile-optimizations-summary.md)

Mobile-specific optimizations:

- Touch target sizes
- Momentum scrolling
- Responsive layouts
- Touch feedback
- Mobile-first approach

#### [Bundle Analysis](./bundle-analysis.md)

Performance monitoring and optimization:

- Bundle size analysis
- Code splitting strategies
- Dependency optimization
- Performance budgets
- Monitoring tools

## Component Categories

### Standard Components

**Location:** `src/components/standard/`

Consistent, reusable components for common UI patterns:

- **StandardFormField** - Form field wrapper with label, error, help text
- **StandardLoadingState** - Unified loading indicators (spinner, skeleton, pulse, shimmer)
- **StandardErrorDisplay** - Consistent error messaging
- **StandardEmptyState** - Empty state patterns with call-to-action
- **SaveButton, CancelButton, DeleteButton, etc.** - Semantic action buttons
- **FormActions** - Standardized form button groups
- **DialogActions** - Dialog-specific button groups

**Documentation:**

- [README](../../src/components/standard/README.md)
- [Quick Start](../../src/components/standard/QUICK_START.md)
- [Implementation Summary](../../src/components/standard/IMPLEMENTATION_SUMMARY.md)

### Layout Components

**Location:** `src/components/layouts/`

Components for consistent page structures and layouts:

- **PageHeader** - Standardized page header with title, description, icon, actions
- **SectionContainer** - Section wrapper with optional header and footer
- **GridLayout** - Responsive grid layout with consistent spacing
- **ContentWrapper** - Content container with max-width and padding

**Documentation:**

- [README](../../src/components/layouts/README.md)
- [Quick Start](../../src/components/layouts/QUICK_START.md)
- [Implementation Summary](../../src/components/layouts/IMPLEMENTATION_SUMMARY.md)

### Performance Components

**Location:** `src/components/performance/`

Optimized components for better performance:

- **LazyComponent** - Dynamic import wrapper with loading fallback
- **VirtualList** - Virtualized list for large datasets
- **OptimizedImage** - Next.js Image wrapper with consistent patterns
- **HeroImage, CardImage, AvatarImage** - Preset image components

**Documentation:**

- [README](../../src/components/performance/README.md)
- [Quick Start](../../src/components/performance/QUICK_START.md)
- [Implementation Summary](../../src/components/performance/IMPLEMENTATION_SUMMARY.md)

### Transition Components

**Location:** `src/components/transitions/`

Animation and transition utilities:

- **PageTransition** - Smooth page transitions
- **ContentTransition** - Content fade-in animations

**Documentation:**

- [README](../../src/components/transitions/README.md)

### UI Components

**Location:** `src/components/ui/`

Base UI components from shadcn/ui library:

- Button, Card, Input, Dialog, Tabs, and many more
- AnimatedTabs (preferred over standard Tabs)
- Foundation components for the design system

**Note:** Prefer using Standard Components which wrap these with consistent patterns.

## Design Principles

### 1. Consistency

All components follow consistent patterns:

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
- Minimum 44x44px touch targets

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

## Getting Started

### Installation

Components are already installed as part of the project. Simply import them:

```tsx
// Standard Components
import {
  StandardFormField,
  SaveButton,
  FormActions,
} from "@/components/standard";

// Layout Components
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
} from "@/components/layouts";

// Performance Components
import {
  LazyComponent,
  VirtualList,
  OptimizedImage,
} from "@/components/performance";

// UI Components
import { Button, Card, Input } from "@/components/ui";
```

### Basic Usage

```tsx
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
} from "@/components/layouts";
import { StandardFormField, FormActions } from "@/components/standard";
import { Input } from "@/components/ui/input";

export default function MyPage() {
  return (
    <ContentWrapper maxWidth="default">
      <div className="space-y-8">
        <PageHeader title="My Page" description="Page description" />

        <SectionContainer title="Form" variant="elevated">
          <form className="space-y-6">
            <StandardFormField label="Name" id="name" required>
              <Input id="name" />
            </StandardFormField>

            <FormActions
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </form>
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

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

## Testing

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

## Performance Metrics

### Target Metrics

- Initial Bundle (JS): < 200KB
- Time to Interactive: < 3s
- First Contentful Paint: < 1.5s
- Cumulative Layout Shift: < 0.1

### Component Impact

**LazyComponent:**

- Reduces initial bundle by 30-50%
- Improves TTI by 1-2s
- Enables progressive loading

**VirtualList:**

- Reduces DOM nodes by 98%+
- Maintains 60fps scrolling
- Handles 10,000+ items smoothly

**OptimizedImage:**

- Prevents layout shift (CLS < 0.1)
- Reduces bandwidth by 40-60%
- Improves LCP by 20-30%

## Resources

### Documentation

- [Component Documentation](./COMPONENT_DOCUMENTATION.md) - Central hub
- [Component Catalog](./COMPONENT_CATALOG.md) - Detailed prop tables
- [Usage Examples](./USAGE_EXAMPLES.md) - Real-world examples
- [Migration Guide](./MIGRATION_GUIDE.md) - Migration instructions
- [Design Tokens](./design-tokens.md) - Design system tokens
- [Animation System](./animation-system.md) - Animation utilities
- [Mobile Optimizations](./mobile-optimizations-summary.md) - Mobile patterns
- [Bundle Analysis](./bundle-analysis.md) - Performance monitoring

### Component READMEs

- [Standard Components](../../src/components/standard/README.md)
- [Layout Components](../../src/components/layouts/README.md)
- [Performance Components](../../src/components/performance/README.md)
- [Transition Components](../../src/components/transitions/README.md)

### Examples and Demos

- [Standard Components Demo](../../src/components/standard/demo.tsx)
- [Layout Components Demo](../../src/components/layouts/demo.tsx)
- [Performance Components Demo](../../src/components/performance/demo.tsx)

### Testing

- [Property Test Examples](../../src/__tests__/examples/property-test-example.test.ts)
- [Test Configuration](../../src/__tests__/config/pbt-config.ts)
- [Property Generators](../../src/__tests__/utils/property-generators.ts)

## Support

For questions or issues:

1. Check the component's README file
2. Review the Quick Start guide
3. Look at the demo file for examples
4. Check the migration guide for breaking changes
5. Review the Component Catalog for prop tables

## Contributing

When adding new components:

1. Follow existing patterns and conventions
2. Add comprehensive documentation
3. Include usage examples
4. Write tests (unit and property-based)
5. Update this documentation index
6. Add to the appropriate category

## Changelog

### Version 1.0.0 (Current)

**New Components:**

- StandardFormField
- StandardLoadingState
- StandardErrorDisplay
- StandardEmptyState
- FormActions
- PageHeader
- SectionContainer
- GridLayout
- ContentWrapper
- LazyComponent
- VirtualList
- OptimizedImage

**Breaking Changes:**

- Renamed LoadingSpinner to StandardLoadingState
- Renamed FormField to StandardFormField
- Renamed Container to ContentWrapper
- Renamed Section to SectionContainer
- Changed PageHeader prop `subtitle` to `description`
- Removed `variant="primary"` from buttons

See [Migration Guide](./MIGRATION_GUIDE.md) for details.

---

## Quick Reference

### Common Imports

```tsx
// Standard Components
import {
  StandardFormField,
  StandardLoadingState,
  StandardErrorDisplay,
  StandardEmptyState,
  SaveButton,
  CancelButton,
  DeleteButton,
  FormActions,
} from "@/components/standard";

// Layout Components
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
  GridLayout,
} from "@/components/layouts";

// Performance Components
import {
  LazyComponent,
  VirtualList,
  OptimizedImage,
  HeroImage,
  CardImage,
} from "@/components/performance";

// Transition Components
import { PageTransition, ContentTransition } from "@/components/transitions";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from "@/components/ui/animated-tabs";
```

### Common Patterns

**Page Layout:**

```tsx
<ContentWrapper maxWidth="default">
  <PageHeader title="Title" description="Description" />
  <SectionContainer title="Section" variant="elevated">
    {/* Content */}
  </SectionContainer>
</ContentWrapper>
```

**Form:**

```tsx
<form onSubmit={handleSubmit}>
  <StandardFormField label="Field" id="field" error={error} required>
    <Input id="field" />
  </StandardFormField>
  <FormActions
    onCancel={handleCancel}
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
  />
</form>
```

**Loading:**

```tsx
{
  isLoading ? (
    <StandardLoadingState variant="spinner" text="Loading..." />
  ) : (
    <div>{/* Content */}</div>
  );
}
```

**Error:**

```tsx
{
  error && (
    <StandardErrorDisplay
      title="Error"
      message={error.message}
      variant="error"
      action={{ label: "Retry", onClick: handleRetry }}
    />
  );
}
```

---

**Last Updated:** December 2024
