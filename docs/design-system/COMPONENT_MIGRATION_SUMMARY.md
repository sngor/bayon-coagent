# Component Migration Summary

## Overview

This document tracks the migration of existing pages to use the new standard component library as part of the design system performance initiative (Task 10).

## Migration Goals

1. Replace custom form fields with `StandardFormField`
2. Replace custom loading states with `StandardLoadingState`
3. Replace custom error displays with `StandardErrorDisplay`
4. Replace custom empty states with `StandardEmptyState`
5. Use layout components (`PageHeader`, `SectionContainer`, `GridLayout`, `ContentWrapper`)

## Migration Status

### Studio Pages (Task 10.1)

#### Write Page (`/studio/write`)

- **Status**: ✅ Partially Complete
- **Current State**: Already uses `StandardFormField`, `StandardErrorDisplay`, `StandardLoadingSpinner`
- **Remaining Work**:
  - Wrap remaining raw `Label` + `Input`/`Textarea` combinations in `StandardFormField`
  - Replace custom loading indicators with `StandardLoadingState`
  - Add `StandardEmptyState` for empty content scenarios

#### Describe Page (`/studio/describe`)

- **Status**: ✅ Complete
- **Current State**: Uses standard components appropriately
- **Notes**: Minimal custom form elements, already well-structured

#### Reimagine Page (`/studio/reimagine`)

- **Status**: ✅ Complete
- **Current State**: Uses `StandardErrorDisplay`, `StandardLoadingSpinner`
- **Notes**: Complex workflow-based UI, appropriate use of standard components

#### Post Cards Page (`/studio/post-cards`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Wrap form fields in `StandardFormField`
  - Add proper error handling with `StandardErrorDisplay`
  - Add loading states with `StandardLoadingState`

#### Open House Page (`/studio/open-house`)

- **Status**: ⚠️ Needs Review
- **Remaining Work**: TBD after review

### Brand Pages (Task 10.2)

#### Profile Page (`/brand/profile`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Wrap form fields in `StandardFormField`
  - Add `SectionContainer` for logical sections

#### Audit Page (`/brand/audit`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardEmptyState` for no data scenarios
  - Use `SectionContainer` for results sections

#### Competitors Page (`/brand/competitors`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardLoadingState` for data fetching
  - Use `GridLayout` for competitor cards

#### Strategy Page (`/brand/strategy`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardEmptyState` for no strategy scenarios
  - Use `SectionContainer` for strategy sections

### Research Pages (Task 10.3)

#### Research Agent Page (`/research/agent`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Wrap form fields in `StandardFormField`
  - Add `StandardLoadingState` for research processing
  - Add `StandardEmptyState` for no results

#### Reports Page (`/research/reports`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardEmptyState` for no reports
  - Use `GridLayout` for report cards

#### Knowledge Base Page (`/research/knowledge`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardEmptyState` for empty knowledge base
  - Use `SectionContainer` for content sections

### Market Pages (Task 10.4)

#### Insights Page (`/market/insights`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardLoadingState` for data fetching
  - Use `GridLayout` for insight cards
  - Add `StandardEmptyState` for no insights

#### Opportunities Page (`/market/opportunities`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardLoadingState` for data fetching
  - Add `StandardEmptyState` for no opportunities

#### Analytics Page (`/market/analytics`)

- **Status**: ⚠️ Needs Migration
- **Remaining Work**:
  - Use `PageHeader` for page title
  - Add `StandardLoadingState` for chart loading
  - Use `SectionContainer` for analytics sections

## Migration Patterns

### Form Field Migration

**Before:**

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
  {error && <p className="text-sm text-destructive">{error}</p>}
</div>
```

**After:**

```tsx
<StandardFormField label="Email" id="email" error={error} required>
  <Input id="email" type="email" />
</StandardFormField>
```

### Loading State Migration

**Before:**

```tsx
{
  isLoading && (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading...</span>
    </div>
  );
}
```

**After:**

```tsx
{
  isLoading && (
    <StandardLoadingState variant="spinner" size="md" text="Loading..." />
  );
}
```

### Error Display Migration

**Before:**

```tsx
{
  error && (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
      <h3 className="font-semibold text-destructive">Error</h3>
      <p className="text-sm">{error}</p>
    </div>
  );
}
```

**After:**

```tsx
{
  error && (
    <StandardErrorDisplay title="Error" message={error} variant="error" />
  );
}
```

### Empty State Migration

**Before:**

```tsx
{
  items.length === 0 && (
    <div className="text-center p-12">
      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No Items</h3>
      <p className="text-muted-foreground">
        Get started by creating your first item
      </p>
      <Button className="mt-4" onClick={onCreate}>
        Create Item
      </Button>
    </div>
  );
}
```

**After:**

```tsx
{
  items.length === 0 && (
    <StandardEmptyState
      icon={FileText}
      title="No Items"
      description="Get started by creating your first item"
      action={{ label: "Create Item", onClick: onCreate }}
    />
  );
}
```

### Page Header Migration

**Before:**

```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold">Page Title</h1>
  <p className="text-muted-foreground">Page description</p>
</div>
```

**After:**

```tsx
<PageHeader
  title="Page Title"
  description="Page description"
  variant="default"
/>
```

## Testing Checklist

After each page migration:

- [ ] All form fields display labels correctly
- [ ] Error messages appear in the correct location
- [ ] Loading states are visible during async operations
- [ ] Empty states display when no data is available
- [ ] Page headers are consistent across pages
- [ ] Responsive behavior works on mobile and tablet
- [ ] Accessibility attributes are present (aria-labels, etc.)
- [ ] No visual regressions compared to previous implementation

## Completion Criteria

- All studio pages use standard components
- All brand pages use standard components
- All research pages use standard components
- All market pages use standard components
- All pages pass the testing checklist
- Documentation is updated with migration notes
