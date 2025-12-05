# Animation System

## Overview

The animation system provides a comprehensive set of utilities for creating smooth, performant animations throughout the application. All animations respect user preferences for reduced motion and are optimized for performance with GPU acceleration.

## Design Principles

1. **Accessibility First**: All animations respect `prefers-reduced-motion` media query
2. **Performance**: GPU-accelerated with `will-change` and `backface-visibility`
3. **Consistency**: Standardized durations and easing functions
4. **Purpose**: Every animation serves a functional purpose

## Animation Categories

### 1. Fade Animations

Fade animations change opacity over time.

```tsx
// Fast fade in (150ms)
<div className="animate-fade-in-fast">Content</div>

// Base fade in (250ms)
<div className="animate-fade-in-base">Content</div>

// Slow fade in (350ms)
<div className="animate-fade-in-slow">Content</div>

// Fade out
<div className="animate-fade-out-fast">Content</div>
<div className="animate-fade-out-base">Content</div>
```

**Use cases:**

- Modal/dialog appearances
- Tooltip displays
- Content loading states
- Overlay transitions

### 2. Slide Animations

Slide animations move elements while fading in.

```tsx
// Slide up (from bottom)
<div className="animate-slide-up-fast">Content</div>
<div className="animate-slide-up-base">Content</div>
<div className="animate-slide-up-slow">Content</div>

// Slide down (from top)
<div className="animate-slide-down-fast">Content</div>
<div className="animate-slide-down-base">Content</div>

// Slide from left
<div className="animate-slide-left-fast">Content</div>
<div className="animate-slide-left-base">Content</div>

// Slide from right
<div className="animate-slide-right-fast">Content</div>
<div className="animate-slide-right-base">Content</div>
```

**Use cases:**

- Page transitions
- Drawer/sidebar animations
- Notification entries
- List item additions

### 3. Scale Animations

Scale animations grow elements from a smaller size.

```tsx
// Scale in
<div className="animate-scale-in-fast">Content</div>
<div className="animate-scale-in-base">Content</div>
<div className="animate-scale-in-slow">Content</div>
```

**Use cases:**

- Button feedback
- Card appearances
- Modal entrances
- Dropdown menus

### 4. Bounce Animations

Bounce animations add playful, elastic movement.

```tsx
// Bounce in
<div className="animate-bounce-in-fast">Content</div>
<div className="animate-bounce-in-base">Content</div>
<div className="animate-bounce-in-slow">Content</div>

// Elastic bounce
<div className="animate-elastic-fast">Content</div>
<div className="animate-elastic-base">Content</div>
```

**Use cases:**

- Success confirmations
- Achievement notifications
- Playful interactions
- Attention-grabbing elements

### 5. Rotate Animations

Rotate animations spin elements while fading in.

```tsx
// Rotate in
<div className="animate-rotate-in-fast">Content</div>
<div className="animate-rotate-in-base">Content</div>
```

**Use cases:**

- Loading indicators
- Icon transitions
- Decorative elements

## Duration Utilities

Control animation and transition durations:

```tsx
// Fast (150ms)
<div className="duration-fast">Content</div>

// Base (250ms)
<div className="duration-base">Content</div>

// Slow (350ms)
<div className="duration-slow">Content</div>

// Smooth (400ms)
<div className="duration-smooth">Content</div>
```

## Easing Utilities

Control animation timing functions:

```tsx
// Default easing
<div className="ease-default">Content</div>

// Bounce easing
<div className="ease-bounce">Content</div>

// Elastic easing
<div className="ease-elastic">Content</div>

// Spring easing
<div className="ease-spring">Content</div>
```

## Delay Utilities

Add delays before animations start:

```tsx
<div className="animate-fade-in delay-0">Immediate</div>
<div className="animate-fade-in delay-75">75ms delay</div>
<div className="animate-fade-in delay-150">150ms delay</div>
<div className="animate-fade-in delay-300">300ms delay</div>
<div className="animate-fade-in delay-500">500ms delay</div>
<div className="animate-fade-in delay-700">700ms delay</div>
<div className="animate-fade-in delay-1000">1000ms delay</div>
```

## Stagger Animations

Animate list items with sequential delays:

```tsx
<ul className="stagger-children">
  <li>Item 1 (50ms delay)</li>
  <li>Item 2 (100ms delay)</li>
  <li>Item 3 (150ms delay)</li>
  <li>Item 4 (200ms delay)</li>
  {/* Up to 10 items with automatic stagger */}
</ul>
```

**Use cases:**

- List reveals
- Menu animations
- Card grid appearances
- Sequential content loading

## Hover Animations

Interactive hover effects:

```tsx
// Lift effect
<button className="hover-lift">Hover me</button>
<button className="hover-lift-lg">Hover me (larger lift)</button>

// Scale effect
<div className="hover-scale">Hover me</div>
<div className="hover-scale-lg">Hover me (larger scale)</div>

// Glow effect
<div className="hover-glow">Hover me</div>
```

**Use cases:**

- Buttons
- Cards
- Interactive elements
- Call-to-action components

## Focus Animations

Keyboard focus indicators:

```tsx
// Standard focus ring
<button className="focus-ring">Focus me</button>

// Animated focus ring
<button className="focus-ring-animated">Focus me</button>
```

**Use cases:**

- Form inputs
- Buttons
- Interactive elements
- Accessibility compliance

## Active State Animations

Press/click feedback:

```tsx
// Standard press
<button className="active-press">Click me</button>

// Large press
<button className="active-press-lg">Click me</button>
```

**Use cases:**

- Buttons
- Clickable cards
- Interactive icons
- Touch targets

## Loading Animations

Indicate loading states:

```tsx
// Pulse animations
<div className="animate-pulse-slow">Loading...</div>
<div className="animate-pulse-base">Loading...</div>
<div className="animate-pulse-fast">Loading...</div>

// Spin animations
<div className="animate-spin-slow">⟳</div>
<div className="animate-spin-base">⟳</div>
<div className="animate-spin-fast">⟳</div>
```

**Use cases:**

- Loading indicators
- Skeleton screens
- Progress feedback
- Async operations

## Combining Utilities

Combine utilities for complex animations:

```tsx
// Fade in with delay and custom duration
<div className="animate-fade-in duration-slow delay-300">
  Content
</div>

// Slide up with bounce easing
<div className="animate-slide-up-base ease-bounce">
  Content
</div>

// Scale in with delay
<div className="animate-scale-in-fast delay-150">
  Content
</div>
```

## Reduced Motion Support

All animations automatically respect user preferences:

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

## Performance Best Practices

### 1. Use GPU-Accelerated Properties

Animate these properties for best performance:

- `opacity`
- `transform` (translate, scale, rotate)

Avoid animating:

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`

### 2. Limit `will-change`

The animation utilities already include `will-change` where appropriate. Don't add it manually unless necessary.

### 3. Use Appropriate Durations

- **Fast (150ms)**: Micro-interactions, hover effects
- **Base (250ms)**: Standard transitions, most animations
- **Slow (350ms)**: Complex animations, page transitions
- **Smooth (400ms)**: Smooth, polished animations

### 4. Avoid Animation Overload

- Don't animate everything
- Use animations purposefully
- Limit simultaneous animations
- Consider mobile performance

## Common Patterns

### Page Transitions

```tsx
export default function Page() {
  return (
    <div className="animate-fade-in-base">
      <h1>Page Title</h1>
      <p>Content</p>
    </div>
  );
}
```

### Modal Entrance

```tsx
<Dialog>
  <DialogContent className="animate-scale-in-base">
    <DialogTitle>Modal Title</DialogTitle>
    <DialogDescription>Modal content</DialogDescription>
  </DialogContent>
</Dialog>
```

### List Reveal

```tsx
<ul className="stagger-children">
  {items.map((item) => (
    <li key={item.id} className="container-base">
      {item.name}
    </li>
  ))}
</ul>
```

### Button with Feedback

```tsx
<Button className="hover-lift active-press focus-ring">Click me</Button>
```

### Loading State

```tsx
{
  isLoading ? (
    <div className="animate-pulse-base">
      <Skeleton className="h-20 w-full" />
    </div>
  ) : (
    <div className="animate-fade-in-fast">{content}</div>
  );
}
```

## Accessibility Considerations

1. **Always respect reduced motion**: The system handles this automatically
2. **Maintain focus indicators**: Focus rings remain visible even with reduced motion
3. **Don't rely solely on animation**: Provide alternative feedback
4. **Test with keyboard navigation**: Ensure animations don't interfere
5. **Consider cognitive load**: Too many animations can be overwhelming

## Browser Support

All animations use standard CSS features supported in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

Fallbacks are automatic for older browsers (animations simply don't run).

## Related Documentation

- [Design Tokens](./design-tokens.md) - Animation timing variables
- [Mobile Optimizations](./mobile-optimizations-quick-reference.md) - Mobile-specific considerations
- [Component Library](../../src/components/standard/README.md) - Using animations in components
