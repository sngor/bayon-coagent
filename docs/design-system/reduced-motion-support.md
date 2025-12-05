# Reduced Motion Support

## Overview

The design system fully supports the `prefers-reduced-motion` media query, ensuring that users who prefer reduced motion have a comfortable experience. All animations automatically respect this preference.

## Why Reduced Motion Matters

Some users experience discomfort, nausea, or vestibular disorders when viewing animations. The `prefers-reduced-motion` media query allows users to indicate their preference at the operating system level, and our design system respects this choice.

### Who Benefits

- Users with vestibular disorders
- Users with motion sensitivity
- Users with cognitive disabilities
- Users who find animations distracting
- Users on low-performance devices

## Automatic Support

All animation utilities automatically respect reduced motion preferences:

```tsx
// This will animate normally for most users
// But will show instantly for users with reduced motion preferences
<div className="animate-fade-in-up">Content</div>
```

When `prefers-reduced-motion: reduce` is detected:

- All animations complete instantly (0.01ms)
- Elements appear in their final state
- Focus rings remain visible for accessibility
- Loading animations simplify to opacity changes

## CSS Implementation

The reduced motion support is implemented in `src/styles/animations.css`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Reset animated elements to their final state */
  .animate-fade-in,
  .animate-slide-up,
  .animate-scale-in {
    animation: none !important;
    opacity: 1;
    transform: none;
  }

  /* Keep focus rings for accessibility */
  .focus-ring:focus-visible {
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5);
  }
}
```

## React Hooks

### useReducedMotion

Detect if the user prefers reduced motion:

```tsx
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={prefersReducedMotion ? "" : "animate-fade-in"}>Content</div>
  );
}
```

### useAnimationClass

Get the appropriate animation class:

```tsx
import { useAnimationClass } from "@/hooks/use-reduced-motion";

function MyComponent() {
  const animationClass = useAnimationClass("animate-fade-in", "opacity-100");

  return <div className={animationClass}>Content</div>;
}
```

### useAnimationDuration

Get the appropriate animation duration:

```tsx
import { useAnimationDuration } from "@/hooks/use-reduced-motion";
import { motion } from "framer-motion";

function MyComponent() {
  const duration = useAnimationDuration(300, 0);

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{ duration: duration / 1000 }}
    >
      Content
    </motion.div>
  );
}
```

## JavaScript Utilities

For non-React contexts, use the utility functions:

```typescript
import {
  prefersReducedMotion,
  onReducedMotionChange,
  getAnimationDuration,
  getAnimationClass,
} from "@/lib/reduced-motion";

// Check preference
if (prefersReducedMotion()) {
  // Skip animation
}

// Listen for changes
const cleanup = onReducedMotionChange((prefersReduced) => {
  console.log("Reduced motion preference:", prefersReduced);
});

// Get duration
const duration = getAnimationDuration(300, 0);

// Get class
const className = getAnimationClass("animate-fade-in", "");
```

## Framer Motion Integration

When using Framer Motion, respect reduced motion:

```tsx
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motion } from "framer-motion";

function MyComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        ease: "easeOut",
      }}
    >
      Content
    </motion.div>
  );
}
```

Or use Framer Motion's built-in support:

```tsx
import { motion, useReducedMotion } from "framer-motion";

function MyComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
      }}
    >
      Content
    </motion.div>
  );
}
```

## What Gets Disabled

When reduced motion is preferred:

### ✅ Disabled

- Fade animations
- Slide animations
- Scale animations
- Bounce animations
- Rotate animations
- Hover lift effects
- Active press effects
- Loading pulse animations
- Spin animations
- Stagger animations

### ✅ Preserved

- Focus rings (for accessibility)
- Color transitions (minimal motion)
- Opacity changes (simplified)
- Instant state changes

## Testing Reduced Motion

### In Browser DevTools

**Chrome/Edge:**

1. Open DevTools (F12)
2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "Emulate CSS prefers-reduced-motion: reduce"

**Firefox:**

1. Open DevTools (F12)
2. Go to Settings (gear icon)
3. Under "Advanced settings", check "Enable accessibility features"
4. In the Accessibility panel, select "Reduce motion"

**Safari:**

1. Open Web Inspector
2. Go to Elements tab
3. Click the "Styles" sidebar
4. At the bottom, click "+" to add a media query
5. Add `@media (prefers-reduced-motion: reduce)`

### In Operating System

**macOS:**

1. System Preferences → Accessibility
2. Display → Reduce motion

**Windows:**

1. Settings → Ease of Access
2. Display → Show animations in Windows

**iOS:**

1. Settings → Accessibility
2. Motion → Reduce Motion

**Android:**

1. Settings → Accessibility
2. Remove animations

## Best Practices

### 1. Always Use Animation Utilities

Use the provided animation utilities instead of custom animations:

```tsx
// ✅ Good - respects reduced motion
<div className="animate-fade-in">Content</div>

// ❌ Bad - doesn't respect reduced motion
<div style={{ animation: 'fadeIn 0.3s' }}>Content</div>
```

### 2. Provide Alternative Feedback

Don't rely solely on animation for feedback:

```tsx
// ✅ Good - provides multiple feedback mechanisms
<button
  className="hover-lift active-press"
  aria-label="Save changes"
>
  <CheckIcon className="mr-2" />
  Save
</button>

// ❌ Bad - relies only on animation
<button className="hover-lift active-press">
  <span className="sr-only">Save</span>
</button>
```

### 3. Test Both Modes

Always test your UI with reduced motion enabled:

```tsx
// Test checklist:
// □ All content is visible
// □ All interactions work
// □ Focus indicators are visible
// □ No layout shifts
// □ Loading states are clear
```

### 4. Consider Performance

Reduced motion can improve performance on low-end devices:

```tsx
// Animations are automatically disabled on mobile
// when reduced motion is preferred
```

### 5. Document Animation Purpose

Explain why animations are used:

```tsx
// ✅ Good - clear purpose
// Fade in to indicate new content loaded
<div className="animate-fade-in">
  {newContent}
</div>

// ❌ Bad - animation for decoration only
<div className="animate-bounce-in">
  Static content
</div>
```

## Accessibility Compliance

Our reduced motion support helps meet:

- **WCAG 2.1 Success Criterion 2.3.3** (Level AAA): Animation from Interactions
- **WCAG 2.2 Success Criterion 2.3.3** (Level AAA): Animation from Interactions

## Common Patterns

### Loading State

```tsx
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function LoadingState() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={prefersReducedMotion ? "opacity-70" : "animate-pulse-base"}>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
```

### Page Transition

```tsx
function Page() {
  return (
    <div className="animate-fade-in-base">
      <h1>Page Title</h1>
      <p>Content</p>
    </div>
  );
}
```

### Modal

```tsx
import { useAnimationClass } from "@/hooks/use-reduced-motion";

function Modal() {
  const animationClass = useAnimationClass("animate-scale-in-base", "");

  return (
    <Dialog>
      <DialogContent className={animationClass}>
        <DialogTitle>Modal Title</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}
```

## Related Documentation

- [Animation System](./animation-system.md) - Complete animation documentation
- [Animation Quick Reference](./animation-quick-reference.md) - Quick lookup guide
- [Accessibility Guidelines](../SECURITY.md) - General accessibility practices
