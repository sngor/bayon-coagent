# Layout Component Library

A collection of reusable layout components for consistent page structures across the application.

## Components

### PageHeader

Standardized page header with title, description, icon, and actions.

**Props:**

- `title` (string, required): Page title
- `description` (string, optional): Page description
- `icon` (LucideIcon, optional): Icon to display
- `actions` (ReactNode, optional): Action buttons or elements
- `variant` ('default' | 'hub' | 'compact', optional): Visual variant
- `breadcrumbs` (Array<{label: string, href?: string}>, optional): Breadcrumb navigation
- `className` (string, optional): Additional CSS classes

**Variants:**

- `default`: Standard page header (text-3xl title)
- `hub`: Larger header for hub pages (text-4xl title, bottom border)
- `compact`: Smaller header for nested pages (text-2xl title)

**Example:**

```tsx
import { PageHeader } from "@/components/layouts";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

<PageHeader
  title="Content Studio"
  description="Create AI-powered content"
  icon={Wand2}
  actions={<Button>New Content</Button>}
  variant="hub"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Studio", href: "/studio" },
    { label: "Write" },
  ]}
/>;
```

### SectionContainer

Consistent section wrapper with optional header and footer.

**Props:**

- `title` (string, optional): Section title
- `description` (string, optional): Section description
- `headerAction` (ReactNode, optional): Action element in header
- `footer` (ReactNode, optional): Footer content
- `variant` ('default' | 'elevated' | 'bordered', optional): Visual variant
- `children` (ReactNode, required): Section content
- `className` (string, optional): Additional CSS classes

**Variants:**

- `default`: Basic card background
- `elevated`: Card with shadow for elevation
- `bordered`: Card with border

**Example:**

```tsx
import { SectionContainer } from "@/components/layouts";
import { Button } from "@/components/ui/button";

<SectionContainer
  title="Recent Activity"
  description="Your latest actions"
  headerAction={<Button variant="ghost">View All</Button>}
  variant="elevated"
  footer={
    <p className="text-sm text-muted-foreground">Last updated 5 minutes ago</p>
  }
>
  {/* Content */}
</SectionContainer>;
```

### GridLayout

Responsive grid layout with consistent spacing.

**Props:**

- `columns` (1 | 2 | 3 | 4, optional): Number of columns (default: 3)
- `gap` ('sm' | 'md' | 'lg', optional): Gap size (default: 'md')
- `children` (ReactNode, required): Grid items
- `className` (string, optional): Additional CSS classes

**Responsive Behavior:**

- 1 column: Always 1 column
- 2 columns: 1 on mobile, 2 on sm+
- 3 columns: 1 on mobile, 2 on sm+, 3 on lg+
- 4 columns: 1 on mobile, 2 on sm+, 3 on lg+, 4 on xl+

**Gap Sizes:**

- `sm`: 1rem (gap-4)
- `md`: 1.5rem (gap-6)
- `lg`: 2rem (gap-8)

**Example:**

```tsx
import { GridLayout } from "@/components/layouts";
import { Card } from "@/components/ui/card";

<GridLayout columns={3} gap="lg">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</GridLayout>;
```

### ContentWrapper

Consistent content container with max-width and padding.

**Props:**

- `children` (ReactNode, required): Content to wrap
- `maxWidth` ('default' | 'wide' | 'narrow' | 'full', optional): Maximum width (default: 'default')
- `fullWidth` (boolean, optional): Remove horizontal padding (default: false)
- `className` (string, optional): Additional CSS classes

**Max Width Options:**

- `narrow`: max-w-3xl (768px) - ideal for reading content
- `default`: max-w-7xl (1280px) - standard page width
- `wide`: max-w-[1600px] - for dashboards and data-heavy pages
- `full`: no max-width constraint

**Example:**

```tsx
import { ContentWrapper } from "@/components/layouts";

<ContentWrapper maxWidth="default">{/* Page content */}</ContentWrapper>;
```

## Usage Patterns

### Standard Page Layout

```tsx
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
  GridLayout,
} from "@/components/layouts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function MyPage() {
  return (
    <ContentWrapper maxWidth="default">
      <div className="space-y-8">
        <PageHeader
          title="My Page"
          description="Page description"
          icon={Home}
          actions={<Button>Action</Button>}
          variant="default"
        />

        <SectionContainer
          title="Section 1"
          description="Section description"
          variant="elevated"
        >
          <GridLayout columns={3} gap="lg">
            <Card>Item 1</Card>
            <Card>Item 2</Card>
            <Card>Item 3</Card>
          </GridLayout>
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

### Hub Page Layout

```tsx
import {
  ContentWrapper,
  PageHeader,
  SectionContainer,
} from "@/components/layouts";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HubPage() {
  return (
    <ContentWrapper maxWidth="wide">
      <div className="space-y-8">
        <PageHeader
          title="Content Studio"
          description="Create AI-powered content for your real estate business"
          icon={Wand2}
          actions={
            <div className="flex gap-2">
              <Button variant="outline">Templates</Button>
              <Button>New Content</Button>
            </div>
          }
          variant="hub"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Studio" }]}
        />

        {/* Hub content */}
      </div>
    </ContentWrapper>
  );
}
```

### Dashboard Layout

```tsx
import {
  ContentWrapper,
  PageHeader,
  GridLayout,
  SectionContainer,
} from "@/components/layouts";
import { BarChart } from "lucide-react";

export default function Dashboard() {
  return (
    <ContentWrapper maxWidth="wide">
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          description="Overview of your activity"
          icon={BarChart}
          variant="default"
        />

        <GridLayout columns={4} gap="md">
          <SectionContainer variant="bordered">
            {/* Metric card */}
          </SectionContainer>
          <SectionContainer variant="bordered">
            {/* Metric card */}
          </SectionContainer>
          <SectionContainer variant="bordered">
            {/* Metric card */}
          </SectionContainer>
          <SectionContainer variant="bordered">
            {/* Metric card */}
          </SectionContainer>
        </GridLayout>

        <SectionContainer
          title="Recent Activity"
          headerAction={<Button variant="ghost">View All</Button>}
          variant="elevated"
        >
          {/* Activity list */}
        </SectionContainer>
      </div>
    </ContentWrapper>
  );
}
```

## Design Tokens

All components use design tokens from the centralized design system:

- **Colors**: `bg-card`, `text-muted-foreground`, `border-border`, `bg-primary/10`, `text-primary`
- **Spacing**: `space-y-*`, `gap-*`, `p-*`, `px-*`, `py-*`
- **Typography**: `text-*`, `font-*`, `tracking-*`
- **Borders**: `border`, `border-b`, `border-t`, `rounded-lg`
- **Shadows**: `shadow-md`

## Accessibility

All layout components follow accessibility best practices:

- Semantic HTML structure
- Proper heading hierarchy
- ARIA attributes where needed
- Keyboard navigation support
- Focus management

## Requirements

These components satisfy the following requirements:

- **Requirement 8.1**: Reusable layout components for consistent page structures
- **Requirement 8.2**: PageHeader component with standard variants
- **Requirement 8.3**: Form and section components with consistent styling

## Demo

See `demo.tsx` for a comprehensive demonstration of all layout components and their variants.
