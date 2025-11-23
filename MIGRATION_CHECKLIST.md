# UI Component Migration Checklist

## ✅ Completed

- [x] Created all reusable UI components
- [x] Updated Dashboard page
- [x] Updated Brand Profile page
- [x] Updated Hub Layout component
- [x] Fixed all TypeScript errors
- [x] Created comprehensive documentation

## 🔄 Next Steps - Pages to Update

### High Priority (Main Hub Pages)

- [ ] **Studio Write** (`src/app/(app)/studio/write/page.tsx`)

  - Replace custom headers with `PageHeader`
  - Use `ContentSection` for form organization
  - Apply `DataGrid` for responsive layouts
  - Standardize action buttons with `ActionBar`

- [ ] **Studio Describe** (`src/app/(app)/studio/describe/page.tsx`)

  - Similar patterns to Studio Write
  - Use `FormSection` for listing inputs

- [ ] **Studio Reimagine** (`src/app/(app)/studio/reimagine/page.tsx`)

  - Use `EmptySection` for upload states
  - Apply `LoadingSection` for processing states

- [ ] **Research Agent** (`src/app/(app)/research/agent/page.tsx`)

  - Use `PageHeader` with research icon
  - Apply `ContentSection` for chat interface
  - Use `EmptySection` for no conversations state

- [ ] **Market Insights** (`src/app/(app)/market/insights/page.tsx`)
  - Replace custom metrics with `StatCard`
  - Use `DataGrid` for chart layouts
  - Apply `LoadingSection` for data fetching

### Medium Priority (Secondary Pages)

- [ ] **Brand Audit** (`src/app/(app)/brand/audit/page.tsx`)
- [ ] **Brand Competitors** (`src/app/(app)/brand/competitors/page.tsx`)
- [ ] **Brand Strategy** (`src/app/(app)/brand/strategy/page.tsx`)
- [ ] **Tools Calculator** (`src/app/(app)/tools/calculator/page.tsx`)
- [ ] **Tools ROI** (`src/app/(app)/tools/roi/page.tsx`)
- [ ] **Library Content** (`src/app/(app)/library/content/page.tsx`)

### Low Priority (Utility Pages)

- [ ] **Settings** (`src/app/(app)/settings/page.tsx`)
- [ ] **Support** (`src/app/(app)/support/page.tsx`)
- [ ] **Training** (`src/app/(app)/training/page.tsx`)

## Migration Pattern for Each Page

### 1. Update Imports

```tsx
// Add these imports
import {
  PageHeader,
  ContentSection,
  DataGrid,
  StatCard,
  ActionBar,
  LoadingSection,
  EmptySection,
} from "@/components/ui";
```

### 2. Replace Page Headers

```tsx
// Before
<div className="space-y-2">
  <h1 className="text-3xl font-bold">Page Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// After
<PageHeader
  title="Page Title"
  description="Description"
  icon={IconComponent}
  actions={<Button>Action</Button>}
/>
```

### 3. Organize Content with Sections

```tsx
// Before
<div className="space-y-6">
  <h2>Section Title</h2>
  <div>Content</div>
</div>

// After
<ContentSection
  title="Section Title"
  description="Optional description"
  icon={SectionIcon}
>
  <div>Content</div>
</ContentSection>
```

### 4. Use DataGrid for Layouts

```tsx
// Before
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// After
<DataGrid columns={3}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</DataGrid>
```

### 5. Standardize Action Buttons

```tsx
// Before
<div className="flex justify-end gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</div>

// After
<ActionBar>
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</ActionBar>
```

### 6. Replace Custom Metrics

```tsx
// Before
<Card>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-sm text-muted-foreground">{label}</p>
  </CardContent>
</Card>

// After
<StatCard
  title={label}
  value={value}
  icon={MetricIcon}
  trend={{
    value: 12.5,
    direction: 'up',
    label: 'vs last month'
  }}
/>
```

## Testing Checklist for Each Updated Page

- [ ] **Desktop**: Layout looks correct on 1920px+ screens
- [ ] **Tablet**: Responsive behavior works on 768px-1024px
- [ ] **Mobile**: Touch-friendly on 375px-768px screens
- [ ] **Dark Mode**: All components render correctly
- [ ] **Accessibility**: Keyboard navigation and screen readers work
- [ ] **Loading States**: Proper loading indicators show
- [ ] **Empty States**: Helpful empty states with actions
- [ ] **Error States**: Error handling displays correctly

## Quality Assurance

### Before Migration

1. Take screenshots of current page
2. Note any custom styling or unique layouts
3. Identify all interactive elements

### During Migration

1. Test each component as you add it
2. Verify responsive behavior
3. Check accessibility with keyboard navigation

### After Migration

1. Compare with original screenshots
2. Test all user flows
3. Verify performance hasn't degraded
4. Get stakeholder approval

## Benefits Tracking

As you migrate each page, you should see:

- **Reduced Code**: Less custom CSS and duplicate components
- **Faster Development**: New features use existing components
- **Better UX**: Consistent interactions across pages
- **Easier Maintenance**: Centralized component updates
- **Improved Accessibility**: Built-in ARIA labels and keyboard support

## Need Help?

- Reference the **Design System Guide** (`src/components/ui/design-system.md`)
- Check the **Component Showcase** (`src/components/examples/design-system-showcase.tsx`)
- Look at completed examples (Dashboard, Brand Profile)
- All components have TypeScript interfaces for guidance
