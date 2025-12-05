# Migration Guide

This guide helps you migrate from old component patterns to the new standardized design system components.

## Table of Contents

- [Overview](#overview)
- [Breaking Changes](#breaking-changes)
- [Component Migrations](#component-migrations)
- [Pattern Migrations](#pattern-migrations)
- [Step-by-Step Migration](#step-by-step-migration)
- [Common Issues](#common-issues)

---

## Overview

The new design system introduces standardized components that replace various custom implementations throughout the codebase. This migration guide will help you:

1. Identify components that need migration
2. Understand the new component APIs
3. Replace old patterns with new ones
4. Avoid common pitfalls

### Benefits of Migration

- **Consistency**: Uniform look and feel across the application
- **Accessibility**: Built-in ARIA attributes and keyboard support
- **Performance**: Optimized components with lazy loading and virtualization
- **Maintainability**: Centralized components reduce code duplication
- **Developer Experience**: Better TypeScript support and documentation

### Migration Priority

**High Priority** (Do First):

1. Form components (buttons, inputs, form fields)
2. Loading states
3. Error displays
4. Page layouts

**Medium Priority** (Do Next):

1. Image components
2. List components
3. Empty states

**Low Priority** (Do Last):

1. Animations and transitions
2. Advanced performance optimizations

---

## Breaking Changes

### Version 1.0.0

#### Component Renames

| Old Name          | New Name               | Notes                          |
| ----------------- | ---------------------- | ------------------------------ |
| `LoadingSpinner`  | `StandardLoadingState` | Now supports multiple variants |
| `FormField`       | `StandardFormField`    | Added accessibility features   |
| `ErrorMessage`    | `StandardErrorDisplay` | Added variants and actions     |
| `EmptyMessage`    | `StandardEmptyState`   | Added icon and action support  |
| `Container`       | `ContentWrapper`       | Renamed for clarity            |
| `Section`         | `SectionContainer`     | Added variants                 |
| `LazyLoad`        | `LazyComponent`        | Improved API                   |
| `VirtualizedList` | `VirtualList`          | Simplified API                 |
| `ImageOptimizer`  | `OptimizedImage`       | Better Next.js integration     |

#### Prop Changes

**PageHeader:**

- `subtitle` → `description`
- Added `variant` prop
- Added `breadcrumbs` prop

**Button:**

- Removed `variant="primary"` (use `variant="default"`)
- Added `variant="ai"` and `variant="shimmer"`
- Minimum height increased to 44px for accessibility

**Card:**

- Removed `variant="shadow"` (use `variant="elevated"`)
- Added `variant="glass"` and `variant="premium"`

#### Removed Components

- `Container` - Use `ContentWrapper` instead
- `LoadingDots` - Use `StandardLoadingState` with `variant="pulse"`
- `ErrorBoundary` - Use `LazyComponent` with built-in error handling
- `ImageWithFallback` - Use `OptimizedImage` with `fallback` prop

---

## Component Migrations

### Buttons

#### Before: Custom Button with Loading

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

#### After: Standard Button

```tsx
<SaveButton onClick={handleSave} loading={isSaving} />
```

**Migration Steps:**

1. Import `SaveButton` from `@/components/standard`
2. Replace custom button with `SaveButton`
3. Use `loading` prop instead of `disabled` and conditional rendering
4. Remove icon imports (built-in)

---

### Form Fields

#### Before: Custom Form Field

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email {required && <span className="text-red-500">*</span>}
  </label>
  <Input id="email" type="email" />
  {error && <p className="text-sm text-red-500">{error}</p>}
  {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
</div>
```

#### After: StandardFormField

```tsx
<StandardFormField
  label="Email"
  id="email"
  error={error}
  helpText={helpText}
  required={required}
>
  <Input id="email" type="email" />
</StandardFormField>
```

**Migration Steps:**

1. Import `StandardFormField` from `@/components/standard`
2. Wrap input with `StandardFormField`
3. Move label, error, and help text to props
4. Remove custom styling classes

---

### Form Actions

#### Before: Manual Button Layout

```tsx
<div className="flex gap-3 justify-end mt-6">
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
  <Button onClick={handleSubmit} disabled={isSubmitting}>
    {isSubmitting ? "Submitting..." : "Submit"}
  </Button>
</div>
```

#### After: FormActions

```tsx
<FormActions
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  submitText="Submit"
/>
```

**Migration Steps:**

1. Import `FormActions` from `@/components/standard`
2. Replace button group with `FormActions`
3. Pass handlers as props
4. Remove manual spacing and alignment classes

---

### Loading States

#### Before: Custom Loading Spinner

```tsx
{
  isLoading && (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">Loading...</span>
    </div>
  );
}
```

#### After: StandardLoadingState

```tsx
{
  isLoading && (
    <StandardLoadingState variant="spinner" size="lg" text="Loading..." />
  );
}
```

**Migration Steps:**

1. Import `StandardLoadingState` from `@/components/standard`
2. Replace custom loading UI with `StandardLoadingState`
3. Choose appropriate variant (spinner, skeleton, pulse, shimmer)
4. Remove custom styling

---

### Error Displays

#### Before: Custom Error Message

```tsx
{
  error && (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
        <div>
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="text-sm text-red-700">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### After: StandardErrorDisplay

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

**Migration Steps:**

1. Import `StandardErrorDisplay` from `@/components/standard`
2. Replace custom error UI with `StandardErrorDisplay`
3. Pass title, message, and action as props
4. Remove custom styling and icons

---

### Page Layouts

#### Before: Custom Page Layout

```tsx
<div className="container mx-auto px-4 py-8 max-w-7xl">
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">My Page</h1>
        <p className="text-muted-foreground mt-1">Page description</p>
      </div>
      <Button>Action</Button>
    </div>
  </div>

  <div className="bg-card rounded-lg p-6 shadow-md">
    <h2 className="text-xl font-semibold mb-4">Section Title</h2>
    {/* Content */}
  </div>
</div>
```

#### After: Layout Components

```tsx
<ContentWrapper maxWidth="default">
  <div className="space-y-8">
    <PageHeader
      title="My Page"
      description="Page description"
      actions={<Button>Action</Button>}
    />

    <SectionContainer title="Section Title" variant="elevated">
      {/* Content */}
    </SectionContainer>
  </div>
</ContentWrapper>
```

**Migration Steps:**

1. Import layout components from `@/components/layouts`
2. Replace container div with `ContentWrapper`
3. Replace header markup with `PageHeader`
4. Replace section divs with `SectionContainer`
5. Remove custom spacing and styling classes

---

### Images

#### Before: Direct Next.js Image

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

#### After: OptimizedImage

```tsx
<OptimizedImage
  src="/image.jpg"
  alt="Image"
  width={800}
  height={600}
  aspectRatio="4/3"
/>
```

**Migration Steps:**

1. Import `OptimizedImage` from `@/components/performance`
2. Replace `Image` with `OptimizedImage`
3. Add `aspectRatio` prop to prevent layout shift
4. Remove `loading` prop (handled automatically)
5. Use preset components (`HeroImage`, `CardImage`, etc.) where appropriate

---

### Lists

#### Before: Manual List Rendering

```tsx
<div className="space-y-2">
  {items.map((item) => (
    <div key={item.id} className="p-4 border-b">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  ))}
</div>
```

#### After: VirtualList (for large lists)

```tsx
<VirtualList
  items={items}
  itemHeight={80}
  renderItem={(item) => (
    <div className="p-4 border-b">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  )}
  height={600}
  getItemKey={(item) => item.id}
/>
```

**Migration Steps:**

1. Import `VirtualList` from `@/components/performance`
2. Replace map with `VirtualList` (for lists with 100+ items)
3. Provide `itemHeight` and `renderItem` props
4. Add `getItemKey` for stable keys
5. Keep manual rendering for small lists (<100 items)

---

## Pattern Migrations

### Loading Pattern

#### Before: Manual Loading State

```tsx
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  fetchData().then((result) => {
    setData(result);
    setIsLoading(false);
  });
}, []);

if (isLoading) {
  return <div>Loading...</div>;
}

return <div>{/* Content */}</div>;
```

#### After: Inline Loading State

```tsx
const [isLoading, setIsLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  fetchData().then((result) => {
    setData(result);
    setIsLoading(false);
  });
}, []);

return (
  <SectionContainer title="Section">
    {isLoading ? (
      <StandardLoadingState variant="skeleton" />
    ) : (
      <div>{/* Content */}</div>
    )}
  </SectionContainer>
);
```

---

### Error Pattern

#### Before: Manual Error Handling

```tsx
const [error, setError] = useState(null);

try {
  await fetchData();
} catch (err) {
  setError(err);
}

if (error) {
  return <div className="text-red-500">{error.message}</div>;
}
```

#### After: StandardErrorDisplay

```tsx
const [error, setError] = useState(null);

const loadData = async () => {
  try {
    await fetchData();
  } catch (err) {
    setError(err);
  }
};

if (error) {
  return (
    <StandardErrorDisplay
      title="Failed to Load"
      message={error.message}
      variant="error"
      action={{ label: "Retry", onClick: loadData }}
    />
  );
}
```

---

### Empty State Pattern

#### Before: Manual Empty State

```tsx
{
  items.length === 0 && (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No items found</p>
      <Button onClick={handleCreate} className="mt-4">
        Create Item
      </Button>
    </div>
  );
}
```

#### After: StandardEmptyState

```tsx
{
  items.length === 0 && (
    <StandardEmptyState
      icon={FileText}
      title="No Items"
      description="No items found"
      action={{ label: "Create Item", onClick: handleCreate }}
    />
  );
}
```

---

## Step-by-Step Migration

### Step 1: Audit Your Codebase

Identify components that need migration:

```bash
# Find custom button implementations
grep -r "disabled={isLoading}" src/

# Find custom form fields
grep -r "className.*space-y-2" src/

# Find custom loading states
grep -r "animate-spin" src/

# Find custom error displays
grep -r "bg-red-50" src/
```

### Step 2: Start with High-Priority Components

Begin with the most commonly used components:

1. **Buttons**: Replace all custom loading buttons with `SaveButton`, `DeleteButton`, etc.
2. **Form Fields**: Replace all custom form fields with `StandardFormField`
3. **Form Actions**: Replace all button groups with `FormActions`
4. **Loading States**: Replace all custom spinners with `StandardLoadingState`

### Step 3: Migrate Page Layouts

Replace custom page layouts with layout components:

1. Wrap pages with `ContentWrapper`
2. Replace headers with `PageHeader`
3. Replace sections with `SectionContainer`
4. Use `GridLayout` for grid layouts

### Step 4: Optimize Performance

Add performance optimizations:

1. Use `LazyComponent` for heavy components
2. Use `VirtualList` for large lists
3. Use `OptimizedImage` for all images

### Step 5: Test and Validate

After migration:

1. Test all forms and buttons
2. Verify loading states work correctly
3. Check error handling
4. Test responsive behavior
5. Verify accessibility (keyboard navigation, screen readers)

---

## Common Issues

### Issue: Button Not Showing Loading State

**Problem:**

```tsx
<SaveButton onClick={handleSave} disabled={isSaving} />
```

**Solution:**
Use `loading` prop instead of `disabled`:

```tsx
<SaveButton onClick={handleSave} loading={isSaving} />
```

---

### Issue: Form Field Not Showing Error

**Problem:**

```tsx
<StandardFormField label="Email" id="email">
  <Input id="email" />
</StandardFormField>
```

**Solution:**
Pass `error` prop:

```tsx
<StandardFormField label="Email" id="email" error={errors.email}>
  <Input id="email" />
</StandardFormField>
```

---

### Issue: Layout Shift with Images

**Problem:**

```tsx
<OptimizedImage src="/image.jpg" alt="Image" width={800} height={600} />
```

**Solution:**
Add `aspectRatio` prop:

```tsx
<OptimizedImage
  src="/image.jpg"
  alt="Image"
  width={800}
  height={600}
  aspectRatio="4/3"
/>
```

---

### Issue: VirtualList Not Rendering

**Problem:**

```tsx
<VirtualList items={items} renderItem={(item) => <div>{item.title}</div>} />
```

**Solution:**
Add required `itemHeight` prop:

```tsx
<VirtualList
  items={items}
  itemHeight={80}
  renderItem={(item) => <div>{item.title}</div>}
/>
```

---

### Issue: PageHeader Not Showing Actions

**Problem:**

```tsx
<PageHeader title="My Page" actions="<Button>Action</Button>" />
```

**Solution:**
Pass JSX element, not string:

```tsx
<PageHeader title="My Page" actions={<Button>Action</Button>} />
```

---

## Migration Checklist

Use this checklist to track your migration progress:

### Components

- [ ] Replace custom buttons with standard buttons
- [ ] Replace custom form fields with `StandardFormField`
- [ ] Replace button groups with `FormActions`
- [ ] Replace loading spinners with `StandardLoadingState`
- [ ] Replace error messages with `StandardErrorDisplay`
- [ ] Replace empty states with `StandardEmptyState`

### Layouts

- [ ] Wrap pages with `ContentWrapper`
- [ ] Replace headers with `PageHeader`
- [ ] Replace sections with `SectionContainer`
- [ ] Use `GridLayout` for grids

### Performance

- [ ] Use `LazyComponent` for heavy components
- [ ] Use `VirtualList` for large lists (100+ items)
- [ ] Use `OptimizedImage` for all images
- [ ] Add `aspectRatio` to prevent layout shift

### Testing

- [ ] Test all forms and buttons
- [ ] Verify loading states
- [ ] Check error handling
- [ ] Test responsive behavior
- [ ] Verify accessibility

---

## Getting Help

If you encounter issues during migration:

1. Check the [Component Documentation](./COMPONENT_DOCUMENTATION.md)
2. Review [Usage Examples](./USAGE_EXAMPLES.md)
3. Look at [Component Catalog](./COMPONENT_CATALOG.md) for prop tables
4. Check component README files in `src/components/`

---

## Related Documentation

- [Component Documentation](./COMPONENT_DOCUMENTATION.md)
- [Component Catalog](./COMPONENT_CATALOG.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
- [Design Tokens](./design-tokens.md)
