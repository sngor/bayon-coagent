# Standard Components Quick Guide

## Overview

This guide provides quick reference for using standard components in the Bayon Coagent application. Always use these components instead of creating custom implementations.

## Import Statement

```tsx
import {
  StandardFormField,
  StandardLoadingState,
  StandardErrorDisplay,
  StandardEmptyState,
  StandardFormActions,
  StandardCard,
  StandardPageLayout,
  StandardLoadingSpinner,
} from "@/components/standard";
```

## Component Reference

### 1. StandardFormField

Use for all form inputs to ensure consistent styling and accessibility.

**Basic Usage:**

```tsx
<StandardFormField label="Email Address" id="email" required>
  <Input id="email" type="email" />
</StandardFormField>
```

**With Error:**

```tsx
<StandardFormField
  label="Email Address"
  id="email"
  error={errors.email}
  required
>
  <Input id="email" type="email" />
</StandardFormField>
```

**With Help Text:**

```tsx
<StandardFormField
  label="Password"
  id="password"
  helpText="Must be at least 8 characters"
  required
>
  <Input id="password" type="password" />
</StandardFormField>
```

**Props:**

- `label` (required): Field label text
- `id` (required): Field ID for label association
- `error?`: Error message to display
- `helpText?`: Helper text below the field
- `required?`: Shows required indicator
- `className?`: Additional CSS classes

### 2. StandardLoadingState

Use for all loading indicators to provide consistent feedback.

**Basic Usage:**

```tsx
{
  isLoading && (
    <StandardLoadingState variant="spinner" size="md" text="Loading..." />
  );
}
```

**Variants:**

- `spinner`: Animated spinner (default)
- `skeleton`: Skeleton loader
- `pulse`: Pulsing animation
- `shimmer`: Shimmer effect

**Sizes:**

- `sm`: Small (16px)
- `md`: Medium (24px)
- `lg`: Large (32px)

**Full Screen:**

```tsx
<StandardLoadingState
  variant="spinner"
  size="lg"
  text="Processing..."
  fullScreen
/>
```

**Props:**

- `variant?`: Loading animation type
- `size?`: Size of the loader
- `text?`: Loading message
- `fullScreen?`: Cover entire screen
- `className?`: Additional CSS classes

### 3. StandardErrorDisplay

Use for all error messages to provide consistent error handling.

**Basic Usage:**

```tsx
{
  error && (
    <StandardErrorDisplay title="Error" message={error} variant="error" />
  );
}
```

**With Action:**

```tsx
<StandardErrorDisplay
  title="Failed to Load"
  message="Unable to fetch data. Please try again."
  variant="error"
  action={{
    label: "Retry",
    onClick: handleRetry,
  }}
/>
```

**Variants:**

- `error`: Red error styling
- `warning`: Yellow warning styling
- `info`: Blue info styling

**Props:**

- `title` (required): Error title
- `message` (required): Error message
- `variant?`: Error severity level
- `action?`: Optional action button
  - `label`: Button text
  - `onClick`: Button click handler
- `className?`: Additional CSS classes

### 4. StandardEmptyState

Use when there's no data to display.

**Basic Usage:**

```tsx
{
  items.length === 0 && (
    <StandardEmptyState
      icon={FileText}
      title="No Items"
      description="Get started by creating your first item"
    />
  );
}
```

**With Action:**

```tsx
<StandardEmptyState
  icon={FileText}
  title="No Content Yet"
  description="Create your first piece of content to get started"
  action={{
    label: "Create Content",
    onClick: handleCreate,
    variant: "default",
  }}
/>
```

**Props:**

- `icon` (required): Lucide icon component
- `title` (required): Empty state title
- `description` (required): Empty state description
- `action?`: Optional action button
  - `label`: Button text
  - `onClick`: Button click handler
  - `variant?`: Button variant
- `className?`: Additional CSS classes

### 5. StandardFormActions

Use for form submission buttons with consistent styling.

**Basic Usage:**

```tsx
<StandardFormActions
  primaryAction={{
    label: "Save",
    type: "submit",
    variant: "default",
  }}
/>
```

**With Secondary Action:**

```tsx
<StandardFormActions
  primaryAction={{
    label: "Save",
    type: "submit",
    variant: "default",
    loading: isPending,
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: handleCancel,
    variant: "outline",
  }}
/>
```

**With Loading State:**

```tsx
<StandardFormActions
  primaryAction={{
    label: "Generate",
    type: "submit",
    variant: "ai",
    loading: isGenerating,
    disabled: !isValid,
  }}
/>
```

**Props:**

- `primaryAction` (required):
  - `label`: Button text
  - `type?`: Button type (submit/button)
  - `variant?`: Button variant
  - `loading?`: Show loading state
  - `disabled?`: Disable button
  - `onClick?`: Click handler
- `secondaryAction?`: Optional secondary button (same props as primary)
- `alignment?`: Button alignment (left/center/right)
- `className?`: Additional CSS classes

### 6. StandardLoadingSpinner

Use for inline loading indicators.

**Basic Usage:**

```tsx
{
  isPending && <StandardLoadingSpinner size="sm" />;
}
```

**In Button:**

```tsx
<Button disabled={isPending}>
  {isPending && <StandardLoadingSpinner size="sm" className="mr-2" />}
  Save
</Button>
```

**Props:**

- `size?`: Spinner size (sm/md/lg)
- `className?`: Additional CSS classes

## Common Patterns

### Form with Loading and Error States

```tsx
function MyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await submitForm(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StandardFormField label="Email" id="email" error={error} required>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </StandardFormField>

      <StandardFormField label="Password" id="password" required>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
      </StandardFormField>

      {error && (
        <StandardErrorDisplay
          title="Submission Failed"
          message={error}
          variant="error"
        />
      )}

      <StandardFormActions
        primaryAction={{
          label: "Submit",
          type: "submit",
          loading: isLoading,
          disabled: !formData.email || !formData.password,
        }}
      />
    </form>
  );
}
```

### List with Loading and Empty States

```tsx
function MyList() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchItems();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <StandardLoadingState
        variant="spinner"
        size="lg"
        text="Loading items..."
      />
    );
  }

  if (error) {
    return (
      <StandardErrorDisplay
        title="Failed to Load"
        message={error}
        variant="error"
        action={{ label: "Retry", onClick: loadItems }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <StandardEmptyState
        icon={FileText}
        title="No Items"
        description="Get started by creating your first item"
        action={{ label: "Create Item", onClick: handleCreate }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## Best Practices

### 1. Always Use Standard Components

❌ **Don't:**

```tsx
<div className="space-y-2">
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
</div>
```

✅ **Do:**

```tsx
<StandardFormField label="Email" id="email">
  <Input id="email" type="email" />
</StandardFormField>
```

### 2. Provide Meaningful Error Messages

❌ **Don't:**

```tsx
<StandardErrorDisplay
  title="Error"
  message="Something went wrong"
  variant="error"
/>
```

✅ **Do:**

```tsx
<StandardErrorDisplay
  title="Failed to Save"
  message="Unable to save your changes. Please check your connection and try again."
  variant="error"
  action={{ label: "Retry", onClick: handleRetry }}
/>
```

### 3. Use Appropriate Loading States

❌ **Don't:**

```tsx
{
  isLoading && <div>Loading...</div>;
}
```

✅ **Do:**

```tsx
{
  isLoading && (
    <StandardLoadingState
      variant="spinner"
      size="md"
      text="Loading your data..."
    />
  );
}
```

### 4. Provide Empty State Actions

❌ **Don't:**

```tsx
{
  items.length === 0 && <div>No items</div>;
}
```

✅ **Do:**

```tsx
{
  items.length === 0 && (
    <StandardEmptyState
      icon={FileText}
      title="No Items Yet"
      description="Create your first item to get started"
      action={{ label: "Create Item", onClick: handleCreate }}
    />
  );
}
```

## Accessibility Checklist

When using standard components, ensure:

- ✅ All form fields have labels
- ✅ Required fields are marked with `required` prop
- ✅ Error messages are associated with fields
- ✅ Loading states announce to screen readers
- ✅ Action buttons have descriptive labels
- ✅ Empty states provide clear next steps
- ✅ Keyboard navigation works correctly
- ✅ Focus management is proper

## Examples in Codebase

### Excellent Examples

1. **Competitors Page** (`/brand/competitors`):

   - Comprehensive use of all standard components
   - Proper error handling
   - Good loading states
   - Clear empty states

2. **Post Cards Page** (`/studio/post-cards`):

   - Well-structured forms with StandardFormField
   - Proper error display with retry action
   - Good loading feedback
   - Clear empty state with examples

3. **Profile Page** (`/brand/profile`):
   - Good use of StandardFormActions
   - Proper form field wrapping
   - Clear loading indicators

## Troubleshooting

### Issue: Form field label not associated

**Problem:**

```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" />
```

**Solution:**

```tsx
<StandardFormField label="Email" id="email">
  <Input id="email" />
</StandardFormField>
```

### Issue: Loading state not visible

**Problem:**

```tsx
{
  isLoading && <Loader2 className="animate-spin" />;
}
```

**Solution:**

```tsx
{
  isLoading && (
    <StandardLoadingState variant="spinner" size="md" text="Loading..." />
  );
}
```

### Issue: Error message not styled

**Problem:**

```tsx
{
  error && <div className="text-red-500">{error}</div>;
}
```

**Solution:**

```tsx
{
  error && (
    <StandardErrorDisplay title="Error" message={error} variant="error" />
  );
}
```

## Additional Resources

- [Component Library Documentation](./README.md)
- [Migration Guide](./COMPONENT_MIGRATION_SUMMARY.md)
- [Task 10 Completion Summary](./TASK_10_COMPLETION_SUMMARY.md)
- [Design System Architecture](./ARCHITECTURE.md)

---

**Last Updated**: December 4, 2025
