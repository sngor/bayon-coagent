# Icon Animation Library

A comprehensive, type-safe animation library for icons with built-in accessibility support and customizable presets.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Animation Types](#animation-types)
- [Configuration](#configuration)
- [Presets](#presets)
- [Accessibility](#accessibility)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Overview

The Icon Animation Library provides a complete set of reusable animation variants for icons using Framer Motion. It includes entrance animations, interaction effects, path drawing, and composite animations with full control over speed, style, and accessibility.

## Features

- ✅ **Type-Safe**: Full TypeScript support with type definitions
- ✅ **Accessible**: Automatic reduced motion support
- ✅ **Customizable**: Control speed, style, and timing
- ✅ **Reusable**: Pre-built variants for common patterns
- ✅ **Performant**: GPU-accelerated animations
- ✅ **Consistent**: Unified animation language across your app
- ✅ **Flexible**: Compose animations for complex effects

## Installation

The library is already included in the project. Import it in your components:

```tsx
import { iconAnimations } from "@/lib/icon-animations";
```

## Quick Start

### Basic Usage

```tsx
import { motion } from "framer-motion";
import { iconAnimations } from "@/lib/icon-animations";

function MyIcon() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      variants={iconAnimations.standard()}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="w-6 h-6"
    >
      <path d="..." />
    </motion.svg>
  );
}
```

### With Configuration

```tsx
<motion.svg
  variants={iconAnimations.fadeIn({
    speed: "fast",
    style: "energetic",
    delay: 0.2,
  })}
  initial="initial"
  animate="animate"
>
  <path d="..." />
</motion.svg>
```

## Animation Types

### Entrance Animations

Animations for when icons first appear on screen.

#### Fade In

Smooth opacity transition from 0 to 1.

```tsx
iconAnimations.fadeIn({ speed: "normal" });
```

**Use cases**: Subtle entrances, loading content, tooltips

#### Scale In

Pop effect that scales from 0 to 1.

```tsx
iconAnimations.scaleIn({ style: "energetic" });
```

**Use cases**: Success messages, notifications, feature highlights

#### Slide In

Slide from a direction with fade.

```tsx
iconAnimations.slideIn("up", { speed: "fast" });
```

**Directions**: `'up'`, `'down'`, `'left'`, `'right'`

**Use cases**: Navigation items, list items, cards

#### Bounce In

Playful bounce effect with overshoot.

```tsx
iconAnimations.bounceIn({ style: "playful" });
```

**Use cases**: Celebrations, achievements, fun interactions

### Interaction Animations

Animations triggered by user interaction.

#### Hover

Scale up on hover, scale down on tap.

```tsx
iconAnimations.hover({ style: "normal" });
```

**Use cases**: Buttons, links, interactive cards

#### Pulse

Continuous pulsing animation.

```tsx
iconAnimations.pulse({ speed: "slow", style: "subtle" });
```

**Use cases**: Notifications, live indicators, attention grabbers

#### Rotate

Continuous rotation animation.

```tsx
iconAnimations.rotate({ speed: "normal" });
```

**Use cases**: Loading spinners, refresh icons, processing indicators

#### Wiggle

Shake animation for attention.

```tsx
iconAnimations.wiggle({ speed: "fast" });
```

**Use cases**: Errors, warnings, call-to-action emphasis

### Path Drawing Animations

Animations for SVG path elements.

#### Path Draw

Animate SVG path from 0 to full length.

```tsx
<motion.path
  d="M..."
  variants={iconAnimations.pathDraw({ speed: "slow" })}
  initial="initial"
  animate="animate"
/>
```

**Use cases**: Logo reveals, icon entrances, signature effects

#### Staggered Path

Multiple paths drawing in sequence.

```tsx
const pathVariants = iconAnimations.staggeredPath(3, { speed: "normal" });

<>
  <motion.path d="..." variants={pathVariants[0]} />
  <motion.path d="..." variants={pathVariants[1]} />
  <motion.path d="..." variants={pathVariants[2]} />
</>;
```

**Use cases**: Complex icons, multi-part illustrations

### Composite Animations

Pre-built combinations for specific use cases.

#### Success

Celebration animation for success states.

```tsx
iconAnimations.success({ style: "energetic" });
```

**Use cases**: Form submissions, task completions, achievements

#### Spinner

Loading spinner animation.

```tsx
iconAnimations.spinner({ speed: "fast" });
```

**Use cases**: Loading states, processing indicators

#### Sparkle

AI/magic effect with rotation and pulse.

```tsx
iconAnimations.sparkle({ speed: "normal" });
```

**Use cases**: AI features, premium features, special effects

## Configuration

All animation functions accept an optional configuration object:

```typescript
interface IconAnimationConfig {
  speed?: "slow" | "normal" | "fast" | "instant";
  style?: "subtle" | "normal" | "energetic" | "playful";
  respectReducedMotion?: boolean;
  delay?: number;
}
```

### Speed Options

| Speed     | Duration | Stiffness | Damping | Use Case                    |
| --------- | -------- | --------- | ------- | --------------------------- |
| `instant` | 0ms      | 500       | 30      | Immediate feedback          |
| `fast`    | 200ms    | 400       | 25      | Quick interactions          |
| `normal`  | 400ms    | 300       | 20      | Standard animations         |
| `slow`    | 800ms    | 200       | 15      | Dramatic entrances, reveals |

### Style Options

| Style       | Scale | Intensity | Use Case                  |
| ----------- | ----- | --------- | ------------------------- |
| `subtle`    | 1.05  | 0.5       | Professional, understated |
| `normal`    | 1.1   | 1.0       | Standard interactions     |
| `energetic` | 1.2   | 1.5       | Exciting, attention-grab  |
| `playful`   | 1.3   | 2.0       | Fun, celebratory          |

### Examples

```tsx
// Fast, subtle animation
iconAnimations.fadeIn({ speed: "fast", style: "subtle" });

// Slow, energetic animation
iconAnimations.bounceIn({ speed: "slow", style: "energetic" });

// With delay
iconAnimations.scaleIn({ delay: 0.5 });

// Disable reduced motion support
iconAnimations.hover({ respectReducedMotion: false });
```

## Presets

Pre-configured animation combinations for common use cases.

### Standard

Default icon animation with entrance and hover.

```tsx
iconAnimations.standard();
// Equivalent to:
// - Scale in entrance (0.8 to 1.0)
// - Hover scale (1.1)
// - Tap scale (0.95)
```

**Use cases**: General purpose icons, feature icons

### Navigation

Subtle animation for navigation items.

```tsx
iconAnimations.navigation();
// Fast speed, subtle style
```

**Use cases**: Sidebar icons, menu items, breadcrumbs

### Feature

Energetic animation for feature highlights.

```tsx
iconAnimations.feature();
// Normal speed, energetic style
```

**Use cases**: Feature cards, hero sections, CTAs

### Empty State

Gentle animation for empty state illustrations.

```tsx
iconAnimations.emptyState();
// Slow speed, subtle style
```

**Use cases**: Empty state illustrations, placeholders

## Accessibility

### Reduced Motion Support

The library automatically respects the user's `prefers-reduced-motion` setting.

```tsx
// Automatically disabled for users with reduced motion preference
<motion.svg variants={iconAnimations.bounceIn({ respectReducedMotion: true })}>
  {/* ... */}
</motion.svg>
```

### Manual Check

```tsx
import { prefersReducedMotion } from "@/lib/icon-animations";

const shouldAnimate = !prefersReducedMotion();

<motion.svg
  variants={iconAnimations.standard()}
  animate={shouldAnimate ? "animate" : "initial"}
>
  {/* ... */}
</motion.svg>;
```

### Best Practices

1. **Always enable reduced motion support** for entrance animations
2. **Disable for critical UI feedback** (e.g., loading spinners)
3. **Provide static fallbacks** for essential information
4. **Test with reduced motion enabled** in your browser

```tsx
// Good: Respects reduced motion
<motion.svg variants={iconAnimations.fadeIn({ respectReducedMotion: true })}>

// Acceptable: Critical feedback
<motion.svg variants={iconAnimations.spinner({ respectReducedMotion: false })}>
```

## Examples

### Navigation Icon

```tsx
import { motion } from "framer-motion";
import { iconAnimations } from "@/lib/icon-animations";

function NavIcon({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <motion.div
      variants={iconAnimations.navigation()}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      className="flex items-center gap-2"
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </motion.div>
  );
}
```

### Success Message

```tsx
import { motion } from "framer-motion";
import { iconAnimations } from "@/lib/icon-animations";

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3">
      <motion.svg
        viewBox="0 0 24 24"
        className="w-12 h-12 text-success"
        variants={iconAnimations.success({ style: "energetic" })}
        initial="initial"
        animate="animate"
      >
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        <motion.path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          variants={iconAnimations.pathDraw({ delay: 0.3 })}
        />
      </motion.svg>
      <p>{message}</p>
    </div>
  );
}
```

### Loading Spinner

```tsx
import { motion } from "framer-motion";
import { iconAnimations } from "@/lib/icon-animations";

function LoadingSpinner() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-8 h-8"
      variants={iconAnimations.spinner({ speed: "fast" })}
      animate="animate"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeDasharray="60"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}
```

### AI Feature Icon

```tsx
import { motion } from "framer-motion";
import { iconAnimations } from "@/lib/icon-animations";

function AIFeatureIcon() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="w-8 h-8"
      variants={iconAnimations.sparkle({ speed: "normal" })}
      animate="animate"
    >
      <defs>
        <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(260 60% 55%)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z"
        fill="url(#ai-gradient)"
      />
    </motion.svg>
  );
}
```

### Staggered List Icons

```tsx
import { motion } from "framer-motion";
import { iconAnimations } from "@/lib/icon-animations";

function IconList({ items }: { items: any[] }) {
  return (
    <div>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          variants={iconAnimations.slideIn("up", {
            delay: index * 0.1,
            speed: "fast",
          })}
          initial="initial"
          animate="animate"
          className="flex items-center gap-2"
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
```

### Empty State Illustration

```tsx
import { motion } from "framer-motion";
import { iconAnimations } from "@/lib/icon-animations";

function EmptyState() {
  return (
    <div className="text-center py-12">
      <motion.svg
        viewBox="0 0 120 120"
        className="w-32 h-32 mx-auto mb-4"
        variants={iconAnimations.emptyState()}
        initial="initial"
        animate="animate"
      >
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          fill="hsl(var(--primary) / 0.1)"
          variants={iconAnimations.scaleIn({ delay: 0 })}
        />
        <motion.g variants={iconAnimations.fadeIn({ delay: 0.2 })}>
          {/* Illustration content */}
        </motion.g>
      </motion.svg>
      <h3 className="text-lg font-semibold">No Data Yet</h3>
      <p className="text-muted-foreground">
        Get started by adding your first item
      </p>
    </div>
  );
}
```

## API Reference

### Animation Functions

All animation functions follow this pattern:

```typescript
function animationName(config?: IconAnimationConfig): Variants;
```

#### Entrance Animations

- `fadeIn(config?)` - Fade in animation
- `scaleIn(config?)` - Scale in animation
- `slideIn(direction, config?)` - Slide in from direction
- `bounceIn(config?)` - Bounce in animation

#### Interaction Animations

- `hover(config?)` - Hover and tap effects
- `pulse(config?)` - Continuous pulse
- `rotate(config?)` - Continuous rotation
- `wiggle(config?)` - Shake animation

#### Path Animations

- `pathDraw(config?)` - SVG path drawing
- `staggeredPath(count, config?)` - Multiple paths in sequence

#### Composite Animations

- `success(config?)` - Success celebration
- `spinner(config?)` - Loading spinner
- `sparkle(config?)` - AI/magic effect

#### Presets

- `standard(config?)` - Standard icon animation
- `navigation(config?)` - Navigation icon animation
- `feature(config?)` - Feature icon animation
- `emptyState(config?)` - Empty state animation

### Utility Functions

#### `prefersReducedMotion(): boolean`

Check if user prefers reduced motion.

```tsx
const shouldAnimate = !prefersReducedMotion();
```

#### `getTransition(speed, type): Transition`

Get transition configuration for a speed.

```tsx
const transition = getTransition("fast", "spring");
```

#### `withReducedMotion(variants, respect): Variants`

Apply reduced motion fallback to variants.

```tsx
const accessibleVariants = withReducedMotion(myVariants, true);
```

## Best Practices

### Performance

1. **Use static icons in lists** with many items (>20)
2. **Disable animations on mobile** for battery savings
3. **Prefer CSS transforms** (scale, rotate) over position changes
4. **Use `will-change` sparingly** and only during animation

```tsx
// Good: Static icons in large lists
{
  items.map((item) => <Icon animated={false} />);
}

// Good: Conditional animation
<Icon animated={items.length < 20} />;
```

### Accessibility

1. **Always respect reduced motion** for decorative animations
2. **Keep critical feedback animated** (loading, errors)
3. **Provide text alternatives** for icon-only buttons
4. **Test with reduced motion enabled**

```tsx
// Good: Respects user preference
<motion.svg variants={iconAnimations.fadeIn({ respectReducedMotion: true })}>

// Good: Critical feedback
<motion.svg variants={iconAnimations.spinner({ respectReducedMotion: false })}>
```

### Consistency

1. **Use presets** for common patterns
2. **Stick to one style** per context (subtle for nav, energetic for features)
3. **Match animation speed** to user expectations
4. **Maintain timing consistency** across similar interactions

```tsx
// Good: Consistent navigation
<NavIcon variants={iconAnimations.navigation()} />

// Good: Consistent features
<FeatureIcon variants={iconAnimations.feature()} />
```

### User Experience

1. **Don't overuse animations** - less is more
2. **Match animation to context** - playful for fun, subtle for professional
3. **Provide immediate feedback** - use fast animations for interactions
4. **Respect user attention** - use energetic animations sparingly

```tsx
// Good: Subtle for frequent interactions
<Button icon={<Icon variants={iconAnimations.hover({ style: 'subtle' })} />} />

// Good: Energetic for important actions
<CTAButton icon={<Icon variants={iconAnimations.feature()} />} />
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 (requires polyfills)

## Related

- [Real Estate Icons](./real-estate-icons-README.md) - Custom icon components
- [Framer Motion Docs](https://www.framer.com/motion/) - Animation library
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) - Browser API

## Contributing

When adding new animations:

1. Follow the existing naming convention
2. Include TypeScript types
3. Add reduced motion support
4. Document with examples
5. Test across browsers
6. Update this README

## License

Part of the Co-agent Marketer project.
