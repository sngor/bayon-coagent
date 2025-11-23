# Border and Shadow Styling Rule

## Rule: Black Borders When No Shadow (Accessibility Option)

**If a border doesn't have a shadow, the border should have black color.**

This rule ensures visual consistency and proper contrast in the UI design system. It's now available as an accessibility preference that users can enable in Settings → Preferences → Accessibility.

## Implementation

### CSS Utilities

The following utility classes have been added to `src/app/globals.css`:

```css
/* Border utilities - black border when no shadow */
.border-when-no-shadow {
  @apply border-black dark:border-white;
}

/* Explicit black border utility */
.border-solid-black {
  @apply border border-black dark:border-white;
}

/* Apply to components that need borders without shadows */
.border-no-shadow {
  @apply border border-black dark:border-white;
}
```

### Container Variants

A new container variant has been added:

```css
/* Container without shadow - uses black border */
.container-no-shadow {
  @apply rounded-lg border-black dark:border-white bg-card text-card-foreground;
}
```

### Component Usage

#### Card Component

The Card component now supports a `bordered` variant:

```tsx
<Card variant="bordered">{/* Content with black border, no shadow */}</Card>
```

#### BorderedContainer Component

A dedicated component for borders without shadows:

```tsx
import { BorderedContainer } from "@/components/ui/bordered-container";

<BorderedContainer padding="md" borderStyle="thin">
  {/* Content with guaranteed black border */}
</BorderedContainer>;
```

## When to Use

### Use Black Borders (No Shadow) When:

- Creating simple dividers or separators
- Building form elements that need clear boundaries
- Designing minimal, flat UI components
- Creating table borders or grid layouts
- Building components where shadows would be visually distracting

### Use Borders with Shadows When:

- Creating elevated cards or containers
- Building interactive elements that need depth
- Designing modal dialogs or overlays
- Creating components that should appear "floating"

## Examples

### ✅ Correct Usage

```tsx
// Simple form with black borders
<div className="border-solid-black p-4 rounded-lg">
  <input className="border-solid-black rounded px-3 py-2" />
</div>

// Card with shadow (uses default border color)
<Card variant="elevated">
  Content with shadow and appropriate border
</Card>

// Bordered container without shadow
<BorderedContainer>
  Clean content with black border
</BorderedContainer>
```

### ❌ Avoid

```tsx
// Don't use gray borders without shadows
<div className="border border-gray-300 p-4">
  This lacks proper contrast
</div>

// Don't mix shadow classes with black border utilities
<div className="border-solid-black shadow-lg">
  Conflicting styling rules
</div>
```

## Dark Mode Behavior

The rule automatically adapts to dark mode:

- Light mode: `border-black`
- Dark mode: `border-white`

This ensures proper contrast in both themes.

## Migration Guide

If you have existing components with borders but no shadows:

1. Add the `border-solid-black` class
2. Or use the `BorderedContainer` component
3. Or update Card components to use `variant="bordered"`

```tsx
// Before
<div className="border border-gray-300 p-4">

// After
<div className="border-solid-black p-4">
// or
<BorderedContainer padding="md">
```
