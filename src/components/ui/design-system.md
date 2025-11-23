# Bayon Coagent Design System

## Overview

This design system provides a consistent, reusable set of components and patterns for the Bayon Coagent application. It follows the hub-based architecture and ensures consistency across all pages.

## Core Principles

1. **Consistency**: All pages should use the same component patterns
2. **Accessibility**: Components follow WCAG guidelines
3. **Performance**: Optimized for mobile and desktop
4. **Scalability**: Easy to extend and maintain

## Layout Components

### PageHeader

Used for main page titles and descriptions.

```tsx
<PageHeader
  title="Dashboard"
  description="Overview of your real estate business"
  icon={HouseIcon}
  actions={<Button>Action</Button>}
  variant="hub" // 'default' | 'hub' | 'compact'
/>
```

### ContentSection

Organizes content into logical sections with optional headers.

```tsx
<ContentSection
  title="Section Title"
  description="Section description"
  icon={Icon}
  actions={<Button>Action</Button>}
  variant="card" // 'default' | 'card' | 'bordered' | 'minimal'
>
  <p>Content goes here</p>
</ContentSection>
```

### DataGrid

Responsive grid layout for organizing content.

```tsx
<DataGrid columns={3} gap="default">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</DataGrid>
```

### ActionBar

Consistent action button layouts.

```tsx
<ActionBar alignment="right" spacing="default">
  <Button variant="outline">Cancel</Button>
  <Button variant="ai">Generate</Button>
</ActionBar>
```

## Form Components

### FormSection

Groups related form fields with consistent styling.

```tsx
<FormSection title="Basic Information" icon={User}>
  <StandardFormField label="Name" id="name">
    <Input />
  </StandardFormField>
</FormSection>
```

### FormLayout

Complete form wrapper with header and actions.

```tsx
<FormLayout
  title="Profile Settings"
  description="Update your profile information"
  actions={<Button>Save</Button>}
>
  <FormSection>...</FormSection>
</FormLayout>
```

## State Components

### LoadingSection

Consistent loading states.

```tsx
<LoadingSection
  title="Loading data..."
  description="Please wait while we fetch your information"
  variant="card"
/>
```

### EmptySection

Empty states with call-to-action.

```tsx
<EmptySection
  title="No data found"
  description="Get started by creating your first item"
  icon={PlusIcon}
  action={{
    label: "Create Item",
    onClick: () => {},
    variant: "ai",
  }}
/>
```

### StatCard

Metric display with trends.

```tsx
<StatCard
  title="Total Reviews"
  value={42}
  icon={Star}
  trend={{
    value: 12.5,
    direction: "up",
    label: "vs last month",
  }}
  format="number"
/>
```

## Usage Patterns

### Hub Pages

All hub pages should follow this structure:

```tsx
export default function HubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hub Name"
        description="Hub description"
        icon={HubIcon}
        variant="hub"
      />

      <DataGrid columns={3}>
        <ContentSection title="Section 1">{/* Content */}</ContentSection>
        <ContentSection title="Section 2">{/* Content */}</ContentSection>
      </DataGrid>
    </div>
  );
}
```

### Form Pages

Form pages should use the FormLayout component:

```tsx
export default function FormPage() {
  return (
    <PageLayout
      header={{
        title: "Form Title",
        description: "Form description",
        icon: FormIcon,
      }}
    >
      <FormLayout title="Form Section" actions={<Button>Save</Button>}>
        <FormSection title="Basic Info" icon={User}>
          {/* Form fields */}
        </FormSection>
      </FormLayout>
    </PageLayout>
  );
}
```

### Dashboard/Overview Pages

Dashboard pages should use DataGrid for metrics:

```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Business overview"
        icon={DashboardIcon}
      />

      <DataGrid columns={3}>
        <StatCard title="Metric 1" value={100} />
        <StatCard title="Metric 2" value={200} />
        <StatCard title="Metric 3" value={300} />
      </DataGrid>

      <DataGrid columns={2}>
        <ContentSection title="Recent Activity">
          {/* Activity list */}
        </ContentSection>
        <ContentSection title="Quick Actions">
          {/* Action buttons */}
        </ContentSection>
      </DataGrid>
    </div>
  );
}
```

## Responsive Design

All components are mobile-first and responsive:

- **Mobile**: Single column layouts, touch-optimized buttons
- **Tablet**: 2-3 column grids, optimized for portrait/landscape
- **Desktop**: Full grid layouts, hover states

## Animation Guidelines

- Use consistent transition durations (200ms for micro-interactions, 300ms for page transitions)
- Prefer opacity and transform animations over layout changes
- Use `animate-fade-in-up` for page content
- Use staggered delays for lists (`animate-delay-100`, `animate-delay-200`, etc.)

## Color Usage

- **Primary**: Main brand color for CTAs and important elements
- **Success**: Positive actions and confirmations
- **Warning**: Caution states and important notices
- **Destructive**: Error states and dangerous actions
- **Muted**: Secondary text and subtle elements

## Typography Scale

- **Display**: Hero sections and major headings (`text-display-large`)
- **Headings**: Section titles (`text-heading-1`, `text-heading-2`)
- **Body**: Regular content (`text-base`)
- **Captions**: Small text and metadata (`text-sm`, `text-xs`)

## Spacing System

- **Compact**: `space-y-4` for dense layouts
- **Default**: `space-y-6` for standard spacing
- **Spacious**: `space-y-8` for generous layouts

Use the DataGrid component's `gap` prop for consistent grid spacing.
