# Layout Components Quick Start

Quick reference for using the layout component library.

## Installation

```tsx
import {
  PageHeader,
  SectionContainer,
  GridLayout,
  ContentWrapper,
} from "@/components/layouts";
```

## Quick Examples

### Basic Page

```tsx
<ContentWrapper>
  <PageHeader title="My Page" description="Page description" />
  <div className="space-y-6">{/* Your content */}</div>
</ContentWrapper>
```

### Page with Grid

```tsx
<ContentWrapper>
  <PageHeader title="Dashboard" />
  <GridLayout columns={3} gap="lg">
    <Card>Item 1</Card>
    <Card>Item 2</Card>
    <Card>Item 3</Card>
  </GridLayout>
</ContentWrapper>
```

### Page with Sections

```tsx
<ContentWrapper>
  <PageHeader title="Overview" />

  <SectionContainer title="Recent Activity" variant="elevated">
    {/* Content */}
  </SectionContainer>

  <SectionContainer title="Statistics" variant="bordered">
    {/* Content */}
  </SectionContainer>
</ContentWrapper>
```

### Hub Page

```tsx
<ContentWrapper maxWidth="wide">
  <PageHeader
    title="Content Studio"
    description="Create AI-powered content"
    icon={Wand2}
    actions={<Button>New Content</Button>}
    variant="hub"
    breadcrumbs={[{ label: "Home", href: "/" }, { label: "Studio" }]}
  />
  {/* Hub content */}
</ContentWrapper>
```

## Component Cheat Sheet

### PageHeader Variants

- `default` - Standard page (3xl title)
- `hub` - Large hub page (4xl title, border)
- `compact` - Small nested page (2xl title)

### SectionContainer Variants

- `default` - Basic card
- `elevated` - Card with shadow
- `bordered` - Card with border

### GridLayout Columns

- `1` - Single column
- `2` - 1 → 2 columns (mobile → sm+)
- `3` - 1 → 2 → 3 columns (mobile → sm+ → lg+)
- `4` - 1 → 2 → 3 → 4 columns (mobile → sm+ → lg+ → xl+)

### GridLayout Gaps

- `sm` - 1rem (gap-4)
- `md` - 1.5rem (gap-6)
- `lg` - 2rem (gap-8)

### ContentWrapper Max Widths

- `narrow` - 768px (reading content)
- `default` - 1280px (standard pages)
- `wide` - 1600px (dashboards)
- `full` - No limit

## Common Patterns

### Dashboard Layout

```tsx
<ContentWrapper maxWidth="wide">
  <PageHeader title="Dashboard" icon={BarChart} />
  <GridLayout columns={4} gap="md">
    {/* Metric cards */}
  </GridLayout>
  <SectionContainer title="Activity" variant="elevated">
    {/* Activity list */}
  </SectionContainer>
</ContentWrapper>
```

### Form Page

```tsx
<ContentWrapper maxWidth="narrow">
  <PageHeader title="Settings" variant="compact" />
  <SectionContainer variant="bordered">
    <form>{/* Form fields */}</form>
  </SectionContainer>
</ContentWrapper>
```

### List Page

```tsx
<ContentWrapper>
  <PageHeader title="Content Library" actions={<Button>Create New</Button>} />
  <SectionContainer
    title="All Content"
    headerAction={<Button variant="ghost">Filter</Button>}
    variant="elevated"
  >
    {/* List items */}
  </SectionContainer>
</ContentWrapper>
```

## Tips

1. **Always wrap pages with ContentWrapper** for consistent padding and max-width
2. **Use PageHeader at the top** of every page for consistency
3. **Choose the right variant** based on page hierarchy (hub > default > compact)
4. **Use GridLayout for card grids** instead of manual grid classes
5. **Use SectionContainer** to group related content with headers
6. **Match max-width to content type**: narrow for reading, default for most pages, wide for dashboards

## See Also

- [Full Documentation](./README.md)
- [Demo Component](./demo.tsx)
- [Design System Tokens](../../../docs/design-system/design-tokens.md)
