# Header Styling Standards

This document outlines the standardized header and text styling patterns used throughout Bayon Coagent to ensure visual consistency and proper hierarchy.

## Header Components

### 1. PageHeader Component
Use for main page titles and descriptions.

```tsx
import { PageHeader } from '@/components/ui';

// Default variant (recommended for most pages)
<PageHeader
    title="Market Insights"
    description="Track market trends and life event predictions to identify opportunities"
    icon={TrendingUp}
    actions={<Button>Export</Button>}
/>

// Large variant (for landing pages or important sections)
<PageHeader
    title="Dashboard"
    description="Central command center with key metrics and quick access"
    variant="large"
/>

// Compact variant (for modals or constrained spaces)
<PageHeader
    title="Quick Settings"
    variant="compact"
/>
```

### 2. CardHeaderStandard Component
Use for card headers to maintain consistency.

```tsx
import { CardHeaderStandard } from '@/components/ui';

<Card>
    <CardHeaderStandard
        title="Performance Overview"
        description="Track your progress and key metrics"
        icon={Activity}
        actions={<Button variant="outline">View Details</Button>}
    />
    <CardContent>
        {/* Card content */}
    </CardContent>
</Card>
```

### 3. SectionHeader Component
Use for section headers within pages (already exists).

```tsx
import { SectionHeader } from '@/components/ui';

<SectionHeader
    title="Recent Activity"
    description="Your latest actions and updates"
    icon={Clock}
/>
```

## Typography Hierarchy

### Page Titles
- **Main Page Title**: `text-2xl md:text-3xl font-bold tracking-tight` (PageHeader default)
- **Large Page Title**: `text-3xl md:text-4xl font-bold tracking-tight` (PageHeader large)
- **Compact Page Title**: `text-xl font-semibold` (PageHeader compact)

### Card Titles
- **Default Card Title**: `text-xl font-semibold` (CardHeaderStandard default)
- **Large Card Title**: `text-2xl font-bold` (CardHeaderStandard large)
- **Compact Card Title**: `text-lg font-medium` (CardHeaderStandard compact)

### Section Titles
- **Default Section**: `text-lg md:text-xl font-semibold` (SectionHeader default)
- **Compact Section**: `text-base font-medium` (SectionHeader compact)
- **Minimal Section**: `text-sm font-medium uppercase tracking-wide` (SectionHeader minimal)

### Content Text
- **Description Text**: `text-base text-muted-foreground`
- **Small Description**: `text-sm text-muted-foreground`
- **Body Text**: `text-sm md:text-base`
- **Caption Text**: `text-xs text-muted-foreground`

### Metric/Stat Text
- **Large Metrics**: `text-3xl font-bold`
- **Medium Metrics**: `text-2xl font-bold`
- **Small Metrics**: `text-xl font-semibold`

## Usage Guidelines

### When to Use Each Component

1. **PageHeader**: 
   - Main page titles (Dashboard, Market Insights, Studio Write, etc.)
   - Top-level navigation pages
   - Hub overview pages

2. **CardHeaderStandard**:
   - Card containers with titles
   - Feature sections within pages
   - Modal headers

3. **SectionHeader**:
   - Sub-sections within pages
   - Content groupings
   - Form sections

### Font Classes to Use

#### Recommended Font Classes
- `font-headline` - For all titles and headers
- `font-bold` - For primary emphasis
- `font-semibold` - For secondary emphasis
- `font-medium` - For subtle emphasis
- `tracking-tight` - For large titles
- `text-foreground` - For primary text
- `text-muted-foreground` - For secondary text

#### Avoid These Inconsistent Patterns
❌ `text-3xl font-bold` without `font-headline`
❌ `text-2xl font-semibold` for page titles
❌ Mixed font weights in similar contexts
❌ Inconsistent spacing between title and description

## Migration Guide

### Before (Inconsistent)
```tsx
// ❌ Inconsistent patterns
<h1 className="text-3xl font-bold">Market Insights</h1>
<h2 className="text-2xl font-semibold">Performance</h2>
<CardTitle className="text-lg">Quick Actions</CardTitle>
```

### After (Standardized)
```tsx
// ✅ Consistent patterns
<PageHeader
    title="Market Insights"
    description="Track market trends and opportunities"
/>

<CardHeaderStandard
    title="Performance Overview"
    description="Track your progress and key metrics"
/>

<SectionHeader
    title="Quick Actions"
    variant="compact"
/>
```

## Implementation Checklist

- [ ] Replace all page-level `<h1>` tags with `PageHeader` component
- [ ] Replace inconsistent card headers with `CardHeaderStandard`
- [ ] Ensure all titles use `font-headline` class
- [ ] Standardize description text to `text-muted-foreground`
- [ ] Use consistent spacing patterns
- [ ] Add icons where appropriate for better visual hierarchy
- [ ] Test responsive behavior on mobile devices

## Examples by Hub

### Dashboard
```tsx
<PageHeader
    title="Dashboard"
    description="Central command center with key metrics and quick access"
    variant="large"
/>
```

### Market Intelligence
```tsx
<PageHeader
    title="Market Insights"
    description="Track market trends and life event predictions to identify opportunities"
    icon={TrendingUp}
    actions={<Button variant="outline">Export</Button>}
/>
```

### Studio
```tsx
<PageHeader
    title="Studio Write"
    description="Create high-quality content with AI assistance"
    icon={PenTool}
/>
```

### Tools
```tsx
<PageHeader
    title="Mortgage Calculator"
    description="Calculate payments and rates for your clients"
    icon={Calculator}
/>
```

This standardization ensures:
- Visual consistency across all pages
- Proper typography hierarchy
- Better accessibility
- Easier maintenance
- Professional appearance