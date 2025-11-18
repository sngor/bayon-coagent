# PageLayout Component - Usage Guide

## Quick Start

The PageLayout component provides a consistent structure for all pages in the application.

## Basic Usage

```tsx
import { PageLayout } from "@/components/layouts/page-layout";

export default function MyPage() {
  return (
    <PageLayout
      title="My Page Title"
      description="A brief description of this page"
    >
      {/* Your page content goes here */}
      <div>Page content</div>
    </PageLayout>
  );
}
```

## With Breadcrumbs

```tsx
import { PageLayout } from "@/components/layouts/page-layout";

export default function MyPage() {
  return (
    <PageLayout
      title="Marketing Plan"
      description="Create and manage your marketing strategy"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Marketing", href: "/marketing" },
        { label: "Marketing Plan" }, // Current page (no href)
      ]}
    >
      {/* Your page content */}
    </PageLayout>
  );
}
```

## With Action Buttons

```tsx
import { PageLayout } from "@/components/layouts/page-layout";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  return (
    <PageLayout
      title="Content Engine"
      description="Generate AI-powered content"
      action={
        <Button variant="default" size="lg">
          Create New Content
        </Button>
      }
    >
      {/* Your page content */}
    </PageLayout>
  );
}
```

## Full Example

```tsx
import { PageLayout } from "@/components/layouts/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketingPlanPage() {
  return (
    <PageLayout
      title="Marketing Plan"
      description="Your comprehensive marketing strategy"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Marketing Plan" },
      ]}
      action={
        <div className="flex gap-2">
          <Button variant="outline">Save Draft</Button>
          <Button variant="default">Generate Plan</Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your marketing action items will appear here.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your marketing timeline will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
```

## Props Reference

### PageLayout

| Prop          | Type               | Required | Description                               |
| ------------- | ------------------ | -------- | ----------------------------------------- |
| `title`       | `string`           | Yes      | The main page heading                     |
| `description` | `string`           | No       | Optional description text below the title |
| `action`      | `React.ReactNode`  | No       | Optional action buttons or controls       |
| `breadcrumbs` | `BreadcrumbItem[]` | No       | Optional breadcrumb navigation            |
| `children`    | `React.ReactNode`  | Yes      | The main page content                     |
| `className`   | `string`           | No       | Optional additional CSS classes           |

### BreadcrumbItem

| Property | Type     | Required | Description                               |
| -------- | -------- | -------- | ----------------------------------------- |
| `label`  | `string` | Yes      | The text to display for this breadcrumb   |
| `href`   | `string` | No       | Optional link URL (omit for current page) |

## Features

### Animation

The component automatically animates in with a fade-in-up effect when mounted. This animation:

- Takes 400ms to complete
- Uses a smooth easing function
- Respects user's reduced motion preferences

### Responsive Design

The layout adapts to different screen sizes:

- **Mobile**: Stacks header elements vertically
- **Desktop**: Places action buttons to the right of the title

### Accessibility

- Uses semantic HTML (`<h1>` for title, `<nav>` for breadcrumbs)
- Breadcrumbs include proper ARIA labels
- Current page in breadcrumbs marked with `aria-current="page"`
- Focus indicators on all interactive elements

## Integration with Existing Pages

To integrate PageLayout into an existing page:

1. Import the component:

```tsx
import { PageLayout } from "@/components/layouts/page-layout";
```

2. Wrap your page content:

```tsx
export default function MyPage() {
  return <PageLayout title="My Page">{/* Existing page content */}</PageLayout>;
}
```

3. Optionally add breadcrumbs, description, and actions as needed.

## Styling

The component uses Tailwind CSS classes and respects the application's design system:

- Colors: Uses semantic color tokens (`text-foreground`, `text-muted-foreground`)
- Typography: Uses `font-headline` for titles
- Spacing: Consistent with design system spacing scale
- Animations: Uses predefined animation utilities from `globals.css`

## Notes

- The last breadcrumb item should not have an `href` as it represents the current page
- Action buttons should use the Button component for consistency
- The component automatically handles spacing and layout
- All animations respect the user's motion preferences
