# Component Reference

Quick reference for all standard components with API documentation and usage examples.

## Page Layout

### StandardPageLayout

Consistent page wrapper with title, description, and actions.

```tsx
import { StandardPageLayout } from "@/components/standard";

<StandardPageLayout
  title="Page Title"
  description="Optional description"
  actions={<Button>Action</Button>}
>
  {children}
</StandardPageLayout>;
```

**Props:**

- `title` (string, required) - Page title
- `description` (string, optional) - Page description
- `actions` (ReactNode, optional) - Action buttons
- `children` (ReactNode, required) - Page content

## Cards

### StandardCard

Flexible card component with multiple variants.

```tsx
import { StandardCard } from "@/components/standard";

<StandardCard
  title="Card Title"
  description="Optional description"
  actions={<Button size="sm">Action</Button>}
  variant="default" // default | interactive | elevated | flat
>
  {children}
</StandardCard>;
```

**Props:**

- `title` (string, optional) - Card title
- `description` (string, optional) - Card description
- `actions` (ReactNode, optional) - Action buttons
- `variant` (string, optional) - Visual variant
- `children` (ReactNode, required) - Card content

**Variants:**

- `default` - Standard card with border
- `interactive` - Hover effects for clickable cards
- `elevated` - Shadow for emphasis
- `flat` - No border or shadow

## Forms

### StandardFormField

Form field wrapper with label, error, and hint.

```tsx
import { StandardFormField } from "@/components/standard";

<StandardFormField
  label="Field Label"
  id="fieldId"
  required
  error={errors?.fieldId}
  hint="Optional hint"
>
  <Input id="fieldId" />
</StandardFormField>;
```

**Props:**

- `label` (string, required) - Field label
- `id` (string, required) - Field ID (matches input)
- `required` (boolean, optional) - Shows required indicator
- `error` (string, optional) - Error message
- `hint` (string, optional) - Help text
- `children` (ReactNode, required) - Input element

### StandardFormActions

Consistent form action buttons.

```tsx
import { StandardFormActions } from "@/components/standard";

<StandardFormActions
  primaryAction={{
    label: "Save",
    type: "submit",
    loading: isPending,
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: handleCancel,
  }}
/>;
```

**Props:**

- `primaryAction` (object, required)
  - `label` (string) - Button text
  - `type` (string) - Button type
  - `loading` (boolean) - Loading state
  - `onClick` (function) - Click handler
- `secondaryAction` (object, optional)
  - `label` (string) - Button text
  - `onClick` (function) - Click handler

## Loading States

### StandardLoadingSpinner

Loading indicator with multiple variants.

```tsx
import { StandardLoadingSpinner } from '@/components/standard';

// Default
<StandardLoadingSpinner size="md" message="Loading..." />

// AI variant
<StandardLoadingSpinner variant="ai" message="Generating..." />

// Overlay
<StandardLoadingSpinner variant="overlay" />
```

**Props:**

- `size` (string, optional) - Spinner size: `sm` | `md` | `lg`
- `message` (string, optional) - Loading message
- `variant` (string, optional) - Visual variant: `default` | `ai` | `overlay`

### StandardSkeleton

Skeleton loading placeholders.

```tsx
import { StandardSkeleton } from '@/components/standard';

<StandardSkeleton variant="card" count={3} />
<StandardSkeleton variant="list" count={5} />
<StandardSkeleton variant="form" count={4} />
<StandardSkeleton variant="metric" count={3} />
```

**Props:**

- `variant` (string, required) - Skeleton type: `card` | `list` | `form` | `metric`
- `count` (number, optional) - Number of skeletons (default: 1)

## Empty States

### StandardEmptyState

Empty state with icon, message, and action.

```tsx
import { StandardEmptyState } from "@/components/standard";

<StandardEmptyState
  icon={<Inbox className="h-12 w-12" />}
  title="No items yet"
  description="Get started by creating your first item."
  action={{
    label: "Create Item",
    onClick: handleCreate,
  }}
/>;
```

**Props:**

- `icon` (ReactNode, required) - Icon element
- `title` (string, required) - Empty state title
- `description` (string, optional) - Description text
- `action` (object, optional)
  - `label` (string) - Button text
  - `onClick` (function) - Click handler

## Error Display

### StandardErrorDisplay

Error message display with action.

```tsx
import { StandardErrorDisplay } from "@/components/standard";

<StandardErrorDisplay
  message="Error message"
  variant="error" // error | warning | info
  action={{
    label: "Retry",
    onClick: handleRetry,
  }}
/>;
```

**Props:**

- `message` (string, required) - Error message
- `variant` (string, optional) - Visual variant: `error` | `warning` | `info`
- `action` (object, optional)
  - `label` (string) - Button text
  - `onClick` (function) - Click handler

## Buttons

### Button

Primary interactive element.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="default">
  Click me
</Button>;
```

**Variants:**

- `default` - Primary button
- `ai` - AI action button (gradient)
- `outline` - Secondary button
- `ghost` - Tertiary button
- `destructive` - Delete/remove action

**Sizes:**

- `sm` - Small (h-9, px-3)
- `default` - Default (h-10, px-4)
- `lg` - Large (h-11, px-8)

## Common Patterns

### List with Search

```tsx
<StandardPageLayout title="Items">
  <SearchInput value={query} onChange={setQuery} />

  {filteredItems.length === 0 ? (
    <StandardEmptyState
      icon={<Inbox />}
      title="No items found"
      description="Try adjusting your search."
    />
  ) : (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {filteredItems.map((item) => (
        <StandardCard key={item.id} {...item} />
      ))}
    </div>
  )}
</StandardPageLayout>
```

### Form with Sections

```tsx
<StandardPageLayout title="Settings">
  <form action={handleSubmit}>
    <StandardCard title="Section 1">
      <div className="space-y-4">
        <StandardFormField label="Field 1" id="field1">
          <Input id="field1" name="field1" />
        </StandardFormField>
        <StandardFormField label="Field 2" id="field2">
          <Textarea id="field2" name="field2" />
        </StandardFormField>
      </div>
    </StandardCard>

    <StandardFormActions
      primaryAction={{ label: "Save", type: "submit", loading: isPending }}
      secondaryAction={{ label: "Cancel", onClick: handleCancel }}
    />
  </form>
</StandardPageLayout>
```

### Dashboard with Metrics

```tsx
<StandardPageLayout title="Dashboard">
  {/* Metrics */}
  <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
    <MetricCard title="Total" value="1,234" trend="+12%" />
    <MetricCard title="Active" value="567" trend="+5%" />
    <MetricCard title="Pending" value="89" trend="-3%" />
  </div>

  {/* Content Grid */}
  <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2">
      <StandardCard title="Main Content">{/* Main content */}</StandardCard>
    </div>
    <div className="lg:col-span-1">
      <StandardCard title="Sidebar">{/* Sidebar content */}</StandardCard>
    </div>
  </div>
</StandardPageLayout>
```

## Migration Guide

When updating a page to use standard components:

1. Replace page header with `StandardPageLayout`
2. Replace cards with `StandardCard`
3. Replace form fields with `StandardFormField`
4. Replace form buttons with `StandardFormActions`
5. Replace loading states with `StandardLoadingSpinner` or `StandardSkeleton`
6. Replace empty states with `StandardEmptyState`
7. Replace error displays with `StandardErrorDisplay`
8. Verify spacing matches design system scale
9. Test responsive behavior
10. Verify accessibility

## See Also

- [Quick Reference](./quick-reference.md) - Common patterns and snippets
- [Design System](./design-system/design-system.md) - Complete design system
- [Best Practices](./best-practices.md) - Development guidelines
