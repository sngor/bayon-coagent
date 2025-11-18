# Breadcrumbs Quick Reference

## Import

```typescript
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageLayout } from "@/components/layouts/page-layout";
```

## Basic Usage

```typescript
<Breadcrumbs
  items={[
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Current Page" },
  ]}
/>
```

## With PageLayout (Recommended)

```typescript
<PageLayout
  title="Page Title"
  description="Page description"
  breadcrumbs={[{ label: "Home", href: "/" }, { label: "Current Page" }]}
>
  {/* Your content */}
</PageLayout>
```

## Props

### Breadcrumbs Component

| Prop        | Type               | Required | Description               |
| ----------- | ------------------ | -------- | ------------------------- |
| `items`     | `BreadcrumbItem[]` | Yes      | Array of breadcrumb items |
| `className` | `string`           | No       | Additional CSS classes    |

### BreadcrumbItem Type

```typescript
interface BreadcrumbItem {
  label: string; // Display text
  href?: string; // Link URL (omit for current page)
}
```

## Common Patterns

### Dashboard Page

```typescript
breadcrumbs={[
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Marketing Plan" }
]}
```

### Detail Page

```typescript
breadcrumbs={[
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Research Agent", href: "/research-agent" },
  { label: `Report #${id}` }
]}
```

### Settings Page

```typescript
breadcrumbs={[
  { label: "Home", href: "/" },
  { label: "Settings", href: "/settings" },
  { label: "Profile" }
]}
```

## Accessibility Features

- ✅ Semantic HTML (`<nav>`, `<ol>`, `<li>`)
- ✅ ARIA landmark: `aria-label="Breadcrumb"`
- ✅ Current page: `aria-current="page"`
- ✅ Keyboard navigable
- ✅ Screen reader friendly

## Styling

The component uses theme colors and responds to light/dark mode:

- Links: `text-muted-foreground` → `text-foreground` on hover
- Current page: `text-foreground font-medium`
- Separators: ChevronRight icons in `text-muted-foreground`

## Tips

1. **Always include "Home"** as the first item
2. **Last item = current page** (no href)
3. **Keep it short** (max 5 levels)
4. **Use clear labels** that match page titles
5. **Use PageLayout** for automatic integration
