# Icon Size Standardization Guide

## Overview

All icons in the application now follow a standardized sizing system for visual consistency and clear hierarchy. This guide documents the system and provides usage examples.

---

## Size Scale

Each size is **4px (1 Tailwind unit)** larger than the previous, creating a clear visual hierarchy:

| Size    | Class       | Pixels | Usage                                  |
| ------- | ----------- | ------ | -------------------------------------- |
| **xs**  | `w-3 h-3`   | 12px   | Badges, inline text, status indicators |
| **sm**  | `w-4 h-4`   | 16px   | Buttons, form fields, dropdowns        |
| **md**  | `w-5 h-5`   | 20px   | Navigation, cards, list items          |
| **lg**  | `w-6 h-6`   | 24px   | Section headers, tabs, stats           |
| **xl**  | `w-8 h-8`   | 32px   | Page headers, hub headers              |
| **2xl** | `w-12 h-12` | 48px   | Hero sections, empty states            |

---

## Import and Usage

```typescript
import { ICON_SIZES } from "@/lib/constants/icon-sizes";
import { Star } from "lucide-react";

// Use the constant
<Star className={ICON_SIZES.md} />;

// Or use the helper function
import { getIconSize } from "@/lib/constants/icon-sizes";
<Star className={getIconSize("md")} />;
```

---

## Component-Specific Guidelines

### Navigation (Sidebar)

**Size:** `md` (20px)

```tsx
<SidebarMenuButton>
  <Icon className={ICON_SIZES.md} />
  Dashboard
</SidebarMenuButton>
```

### Buttons

**Size:** `sm` (16px)

```tsx
<Button>
  <Icon className={ICON_SIZES.sm} />
  Click me
</Button>
```

Note: The Button component enforces `[&>svg]:size-4` automatically.

### Hub Tabs

**Size:** `sm` (16px)

```tsx
<HubTabs tabs={[{ id: "profile", label: "Profile", icon: User }]} />
```

Icons are automatically sized to `sm` internally.

### Page Headers

**Size:** `xl` (32px) for hub variant, `lg` (24px) for default

```tsx
<PageHeader
  title="Brand Identity"
  icon={Target}
  variant="hub" // Uses xl (32px)
/>

<PageHeader
  title="Settings"
  icon={Settings}
  variant="default" // Uses lg (24px)
/>
```

### Section Headers

**Size:** `lg` (24px)

```tsx
<div className="flex items-center gap-2">
  <Icon className={ICON_SIZES.lg} />
  <h2>Section Title</h2>
</div>
```

### Cards

**Size:** `md` (20px) for card icons, `lg` (24px) for featured cards

```tsx
<Card>
  <CardHeader>
    <Icon className={ICON_SIZES.md} />
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
</Card>
```

### Stat Cards

**Size:** `lg` (24px)

```tsx
<StatCard icon={TrendingUp} title="Revenue" value="$12,345" />
```

Icons are automatically sized to `lg` internally.

### Badges

**Size:** `xs` (12px)

```tsx
<Badge>
  <Icon className={ICON_SIZES.xs} />
  New
</Badge>
```

### Empty States

**Size:** `2xl` (48px)

```tsx
<EmptyState
  icon={<Icon className={ICON_SIZES["2xl"]} />}
  title="No content yet"
  description="Get started by creating your first item"
/>
```

### Alerts & Toasts

**Size:** `sm` (16px)

```tsx
<Alert>
  <Icon className={ICON_SIZES.sm} />
  <AlertTitle>Heads up!</AlertTitle>
</Alert>
```

---

## Before & After Examples

### Navigation (Before)

```tsx
// Inconsistent sizes
<Icon className="w-5 h-5" /> // Some places
<Icon className="w-4 h-4" /> // Other places
<Icon className="h-5 w-5" /> // Different order
```

### Navigation (After)

```tsx
// Consistent size
<Icon className={ICON_SIZES.md} /> // Always 20px
```

### Buttons (Before)

```tsx
// Mixed sizes
<Button><Icon className="w-4 h-4" />Action</Button>
<Button><Icon className="w-5 h-5" />Action</Button>
<Button><Icon className="h-4 w-4" />Action</Button>
```

### Buttons (After)

```tsx
// Consistent size
<Button>
  <Icon className={ICON_SIZES.sm} />
  Action
</Button>
```

---

## Migration Checklist

When updating existing components:

- [ ] Replace hardcoded `w-X h-X` classes with `ICON_SIZES` constants
- [ ] Verify the size matches the component's hierarchy level
- [ ] Check mobile responsiveness (icons should be touch-friendly)
- [ ] Test with different icon types (outlined vs filled)
- [ ] Update component documentation if needed

---

## Common Patterns

### Icon with Text (Inline)

```tsx
<div className="flex items-center gap-2">
  <Icon className={ICON_SIZES.sm} />
  <span>Label</span>
</div>
```

### Icon Button

```tsx
<Button size="icon">
  <Icon className={ICON_SIZES.sm} />
</Button>
```

### Icon in Header

```tsx
<div className="flex items-center gap-3">
  <Icon className={ICON_SIZES.xl} />
  <h1>Page Title</h1>
</div>
```

### Icon with Background

```tsx
<div className="p-2 bg-primary/10 rounded-lg">
  <Icon className={ICON_SIZES.lg} />
</div>
```

---

## Accessibility Notes

- **Touch Targets:** Icons in interactive elements (buttons, links) should be at least 44x44px for mobile
- **Color Contrast:** Ensure icon color meets WCAG AA standards (4.5:1 for normal text)
- **Aria Labels:** Add `aria-hidden="true"` to decorative icons, `aria-label` to functional icons
- **Focus States:** Icons in focusable elements inherit focus styles from parent

---

## Components Updated

The following components have been updated to use standardized icon sizes:

- ✅ `PageHeader` (consolidated with HubHeader)
- ✅ `DynamicNavigation` (sidebar navigation)
- ✅ `HubTabs` (tab navigation)
- ✅ `Button` (documented in comments)
- ✅ App Layout (sticky header)

### Components Still Using Old Sizes

Run this search to find remaining instances:

```bash
# Find hardcoded icon sizes
grep -r "w-[0-9] h-[0-9]" src/components --include="*.tsx"
grep -r "h-[0-9] w-[0-9]" src/components --include="*.tsx"
```

---

## Design Tokens

The icon sizes align with our design system:

```typescript
// Spacing scale (Tailwind)
0.75rem = 12px = xs
1rem    = 16px = sm
1.25rem = 20px = md
1.5rem  = 24px = lg
2rem    = 32px = xl
3rem    = 48px = 2xl

// Each step is +4px (0.25rem)
```

---

## FAQ

**Q: Can I use custom sizes for special cases?**
A: Try to use the standard sizes first. If you absolutely need a custom size, document why in a comment.

**Q: What about responsive icon sizes?**
A: Use Tailwind responsive prefixes:

```tsx
<Icon className={cn(ICON_SIZES.md, "md:w-6 md:h-6")} />
```

**Q: Should I use the constant or the class directly?**
A: Always use the constant (`ICON_SIZES.md`) for consistency and easier refactoring.

**Q: What about SVG icons from other libraries?**
A: Apply the same size classes. The system works with any icon library.

**Q: How do I handle icon color?**
A: Icon color is separate from size. Use Tailwind color classes:

```tsx
<Icon className={cn(ICON_SIZES.md, "text-primary")} />
```

---

## Related Files

- `src/lib/constants/icon-sizes.ts` - Size constants and helper functions
- `src/components/ui/page-header.tsx` - Consolidated header component
- `src/components/dynamic-navigation.tsx` - Navigation with standardized icons
- `src/components/hub/hub-tabs.tsx` - Tab navigation with standardized icons

---

## Next Steps

1. **Audit remaining components** - Find and update hardcoded icon sizes
2. **Update documentation** - Add icon size guidelines to component docs
3. **Create Storybook stories** - Show icon sizes in component library
4. **Add ESLint rule** - Warn about hardcoded icon sizes (optional)

---

## Benefits

✅ **Visual Consistency** - All icons follow the same scale
✅ **Clear Hierarchy** - Size indicates importance
✅ **Easier Maintenance** - Change sizes in one place
✅ **Better DX** - Autocomplete for size options
✅ **Accessibility** - Consistent touch targets
✅ **Performance** - No layout shifts from inconsistent sizes
