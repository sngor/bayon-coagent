# Design System Quick Start

Get up and running with the Bayon Coagent design system in minutes.

## 5-Minute Quick Start

### 1. Import Components

```tsx
import {
  StandardFormField,
  SaveButton,
  FormActions,
} from "@/components/standard";
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
} from "@/components/layouts";
import { Input } from "@/components/ui/input";
```

### 2. Create a Page

```tsx
export default function MyPage() {
  return (
    <ContentWrapper maxWidth="default">
      <PageHeader title="My Page" description="Page description" />
      <SectionContainer title="Content" variant="elevated">
        {/* Your content here */}
      </SectionContainer>
    </ContentWrapper>
  );
}
```

### 3. Create a Form

```tsx
"use client";

import { useState } from "react";

export default function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <StandardFormField label="Name" id="name" required>
        <Input id="name" />
      </StandardFormField>

      <FormActions
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
```

### 4. Add Loading States

```tsx
import { StandardLoadingState } from "@/components/standard";

{
  isLoading ? (
    <StandardLoadingState variant="spinner" text="Loading..." />
  ) : (
    <div>{/* Content */}</div>
  );
}
```

### 5. Handle Errors

```tsx
import { StandardErrorDisplay } from "@/components/standard";

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

## Common Use Cases

### Standard Page Layout

```tsx
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
  GridLayout,
} from "@/components/layouts";
import { Card } from "@/components/ui/card";

export default function StandardPage() {
  return (
    <ContentWrapper maxWidth="default">
      <div className="space-y-8">
        <PageHeader
          title="My Page"
          description="Page description"
          actions={<Button>Action</Button>}
        />

        <SectionContainer title="Section" variant="elevated">
          <GridLayout columns={3} gap="lg">
            <Card>Card 1</Card>
            <Card>Card 2</Card>
            <Card>Card 3</Card>
          </GridLayout>
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

### Form with Validation

```tsx
"use client";

import { useState } from "react";
import { StandardFormField, FormActions } from "@/components/standard";
import { Input } from "@/components/ui/input";

export default function FormWithValidation() {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Submit logic
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StandardFormField
        label="Email"
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
      />
    </form>
  );
}
```

### Data List with Loading

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  StandardLoadingState,
  StandardEmptyState,
} from "@/components/standard";
import { SectionContainer } from "@/components/layouts";
import { FileText } from "lucide-react";

export default function DataList() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchData().then((data) => {
      setItems(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <SectionContainer title="Items" variant="elevated">
      {isLoading ? (
        <StandardLoadingState variant="skeleton" />
      ) : items.length === 0 ? (
        <StandardEmptyState
          icon={FileText}
          title="No Items"
          description="No items to display"
          action={{ label: "Create Item", onClick: handleCreate }}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id}>{item.title}</div>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
```

### Performance-Optimized Page

```tsx
import { LazyComponent, OptimizedImage } from "@/components/performance";
import { StandardLoadingState } from "@/components/standard";

export default function OptimizedPage() {
  return (
    <div>
      {/* Optimized hero image */}
      <OptimizedImage
        src="/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority
      />

      {/* Lazy-loaded heavy component */}
      <LazyComponent
        loader={() => import("./HeavyChart")}
        fallback={<StandardLoadingState variant="skeleton" />}
        props={{ data: chartData }}
      />
    </div>
  );
}
```

## Component Cheat Sheet

### Standard Components

| Component              | Use Case                | Example                                                                   |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------- |
| `StandardFormField`    | Form inputs with labels | `<StandardFormField label="Name" id="name"><Input /></StandardFormField>` |
| `StandardLoadingState` | Loading indicators      | `<StandardLoadingState variant="spinner" />`                              |
| `StandardErrorDisplay` | Error messages          | `<StandardErrorDisplay title="Error" message="..." />`                    |
| `StandardEmptyState`   | Empty states            | `<StandardEmptyState icon={Icon} title="No items" />`                     |
| `SaveButton`           | Save actions            | `<SaveButton onClick={save} loading={isSaving} />`                        |
| `FormActions`          | Form button groups      | `<FormActions onCancel={...} onSubmit={...} />`                           |

### Layout Components

| Component          | Use Case         | Example                                                    |
| ------------------ | ---------------- | ---------------------------------------------------------- |
| `ContentWrapper`   | Page container   | `<ContentWrapper maxWidth="default">...</ContentWrapper>`  |
| `PageHeader`       | Page headers     | `<PageHeader title="Title" description="..." />`           |
| `SectionContainer` | Content sections | `<SectionContainer title="Section">...</SectionContainer>` |
| `GridLayout`       | Grid layouts     | `<GridLayout columns={3} gap="lg">...</GridLayout>`        |

### Performance Components

| Component        | Use Case     | Example                                                 |
| ---------------- | ------------ | ------------------------------------------------------- |
| `LazyComponent`  | Lazy loading | `<LazyComponent loader={() => import("...")} />`        |
| `VirtualList`    | Large lists  | `<VirtualList items={...} renderItem={...} />`          |
| `OptimizedImage` | Images       | `<OptimizedImage src="..." width={800} height={600} />` |

## Variants Reference

### StandardLoadingState Variants

- `spinner` - Rotating spinner (default)
- `skeleton` - Skeleton placeholder
- `pulse` - Pulsing animation
- `shimmer` - Shimmer effect

### StandardErrorDisplay Variants

- `error` - Red color scheme (default)
- `warning` - Yellow color scheme
- `info` - Blue color scheme

### SectionContainer Variants

- `default` - Basic card background
- `elevated` - Card with shadow
- `bordered` - Card with border

### PageHeader Variants

- `default` - Standard header (text-3xl)
- `hub` - Large header (text-4xl, border)
- `compact` - Small header (text-2xl)

## Size Reference

### Button Sizes

- `sm` - Small (40px min-height)
- `default` - Standard (44px min-height)
- `lg` - Large (48px min-height)
- `xl` - Extra large (52px min-height)
- `icon` - Icon-only (44x44px)

### StandardLoadingState Sizes

- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

### GridLayout Gaps

- `sm` - 1rem (gap-4)
- `md` - 1.5rem (gap-6, default)
- `lg` - 2rem (gap-8)

## Next Steps

### Learn More

1. **[Component Documentation](./COMPONENT_DOCUMENTATION.md)** - Comprehensive component guide
2. **[Component Catalog](./COMPONENT_CATALOG.md)** - Detailed prop tables
3. **[Usage Examples](./USAGE_EXAMPLES.md)** - Real-world examples
4. **[Migration Guide](./MIGRATION_GUIDE.md)** - Migrate existing code

### Explore Components

- [Standard Components README](../../src/components/standard/README.md)
- [Layout Components README](../../src/components/layouts/README.md)
- [Performance Components README](../../src/components/performance/README.md)

### View Demos

- [Standard Components Demo](../../src/components/standard/demo.tsx)
- [Layout Components Demo](../../src/components/layouts/demo.tsx)
- [Performance Components Demo](../../src/components/performance/demo.tsx)

## Tips

### 1. Start with Layout

Always start with layout components:

```tsx
<ContentWrapper>
  <PageHeader />
  <SectionContainer>{/* Your content */}</SectionContainer>
</ContentWrapper>
```

### 2. Use Standard Components

Replace custom implementations with standard components:

```tsx
// Instead of custom buttons
<SaveButton loading={isSaving} />

// Instead of custom form fields
<StandardFormField label="Name" id="name">
  <Input id="name" />
</StandardFormField>
```

### 3. Handle States

Always handle loading, error, and empty states:

```tsx
{
  isLoading ? (
    <StandardLoadingState />
  ) : error ? (
    <StandardErrorDisplay />
  ) : items.length === 0 ? (
    <StandardEmptyState />
  ) : (
    <div>{/* Content */}</div>
  );
}
```

### 4. Optimize Performance

Use performance components for heavy content:

```tsx
// Lazy load heavy components
<LazyComponent loader={() => import("./Heavy")} />

// Virtualize large lists
<VirtualList items={largeArray} />

// Optimize images
<OptimizedImage src="..." />
```

### 5. Use Design Tokens

Reference design tokens for consistency:

```tsx
<div className="bg-card text-foreground border-border">
```

## Common Patterns

### Loading Pattern

```tsx
const [isLoading, setIsLoading] = useState(true);

{
  isLoading ? <StandardLoadingState /> : <Content />;
}
```

### Error Pattern

```tsx
const [error, setError] = useState(null);

{
  error && <StandardErrorDisplay title="Error" message={error.message} />;
}
```

### Empty Pattern

```tsx
{
  items.length === 0 && (
    <StandardEmptyState
      icon={FileText}
      title="No Items"
      description="No items to display"
    />
  );
}
```

### Form Pattern

```tsx
<form onSubmit={handleSubmit}>
  <StandardFormField label="Field" id="field">
    <Input id="field" />
  </StandardFormField>
  <FormActions onCancel={...} onSubmit={...} isSubmitting={...} />
</form>
```

## Troubleshooting

### Button not showing loading state?

Use `loading` prop instead of `disabled`:

```tsx
<SaveButton loading={isSaving} /> // ✅
<SaveButton disabled={isSaving} /> // ❌
```

### Form field not showing error?

Pass `error` prop:

```tsx
<StandardFormField error={errors.field} /> // ✅
```

### Image causing layout shift?

Add `aspectRatio` prop:

```tsx
<OptimizedImage aspectRatio="16/9" /> // ✅
```

### VirtualList not rendering?

Add `itemHeight` prop:

```tsx
<VirtualList itemHeight={80} /> // ✅
```

## Resources

- [Full Documentation](./README.md)
- [Component Catalog](./COMPONENT_CATALOG.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
