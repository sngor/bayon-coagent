# Micro-Interactions Guide

## Overview

Micro-interactions are small, subtle animations that provide feedback and enhance the user experience. They make interfaces feel responsive, polished, and alive.

## Design Principles

1. **Purposeful**: Every micro-interaction serves a functional purpose
2. **Subtle**: Animations should enhance, not distract
3. **Fast**: Quick feedback (150-300ms) feels responsive
4. **Accessible**: Respects reduced motion preferences

## Button Micro-Interactions

### Built-in Interactions

All buttons automatically include:

- **Hover**: Subtle lift with shadow increase
- **Active**: Scale down on press (0.95)
- **Focus**: Animated ring expansion
- **Ripple**: Material Design-style ripple effect

```tsx
import { Button } from "@/components/ui/button";

// All interactions are automatic
<Button>Click me</Button>;
```

### Hover Effects

```tsx
// Default hover (lift + shadow)
<Button>Hover me</Button>

// AI gradient hover
<Button variant="ai">AI Button</Button>

// Glow effect hover
<Button variant="glow">Glow Button</Button>

// Premium gradient hover
<Button variant="premium">Premium Button</Button>
```

### Active States

All buttons scale down slightly when pressed:

```tsx
// Automatic press feedback
<Button onClick={handleClick}>Press me</Button>
```

### Focus States

Keyboard focus shows an animated ring:

```tsx
// Automatic focus ring
<Button>Tab to focus</Button>
```

### Loading States

Buttons show a spinner when loading:

```tsx
<Button loading>Loading...</Button>
```

### Ripple Effect

Buttons show a ripple animation on click:

```tsx
// Automatic ripple on click
<Button>Click for ripple</Button>
```

## Card Micro-Interactions

### Interactive Cards

Cards can be made interactive with hover effects:

```tsx
import { Card } from "@/components/ui/card";

// Lift effect (default for interactive)
<Card interactive>
  <CardHeader>
    <CardTitle>Interactive Card</CardTitle>
  </CardHeader>
  <CardContent>
    Hover to see lift effect
  </CardContent>
</Card>

// Glow effect
<Card interactive hoverEffect="glow">
  <CardContent>
    Hover to see glow
  </CardContent>
</Card>

// Scale effect
<Card interactive hoverEffect="scale">
  <CardContent>
    Hover to see scale
  </CardContent>
</Card>

// No effect
<Card interactive hoverEffect="none">
  <CardContent>
    Interactive but no hover effect
  </CardContent>
</Card>
```

### Card Variants

Different card variants have different visual styles:

```tsx
// Elevated card (subtle shadow)
<Card variant="elevated">
  <CardContent>Elevated</CardContent>
</Card>

// Floating card (larger shadow)
<Card variant="floating">
  <CardContent>Floating</CardContent>
</Card>

// Glass card (glassmorphism)
<Card variant="glass">
  <CardContent>Glass effect</CardContent>
</Card>

// Premium card (gradient + shadow)
<Card variant="premium">
  <CardContent>Premium</CardContent>
</Card>
```

## Input Micro-Interactions

### Focus States

Inputs show focus rings and subtle animations:

```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="Focus me" className="focus-ring-animated" />;
```

### Error States

Inputs can show error states with shake animation:

```tsx
<Input
  placeholder="Invalid input"
  className="border-destructive animate-shake"
/>
```

## Custom Micro-Interactions

### Hover Lift

Add lift effect to any element:

```tsx
<div className="hover-lift">
  Hover to lift
</div>

<div className="hover-lift-lg">
  Hover to lift more
</div>
```

### Hover Scale

Add scale effect to any element:

```tsx
<div className="hover-scale">
  Hover to scale
</div>

<div className="hover-scale-lg">
  Hover to scale more
</div>
```

### Hover Glow

Add glow effect to any element:

```tsx
<div className="hover-glow">Hover to glow</div>
```

### Active Press

Add press effect to any element:

```tsx
<div className="active-press">
  Click to press
</div>

<div className="active-press-lg">
  Click to press more
</div>
```

### Focus Ring

Add focus ring to any focusable element:

```tsx
<button className="focus-ring">
  Tab to focus
</button>

<button className="focus-ring-animated">
  Tab to focus (animated)
</button>
```

## Success Feedback

### Success Ping

Show success feedback with expanding ring:

```tsx
<div className="animate-success-ping">Success!</div>
```

### Success Pulse

Pulse animation for success states:

```tsx
<div className="animate-pulse-success">Success!</div>
```

## Loading States

### Pulse

Subtle pulse for loading:

```tsx
<div className="animate-pulse-slow">
  Loading...
</div>

<div className="animate-pulse-base">
  Loading...
</div>

<div className="animate-pulse-fast">
  Loading...
</div>
```

### Spin

Spinning animation for loaders:

```tsx
<div className="animate-spin-slow">
  ⟳
</div>

<div className="animate-spin-base">
  ⟳
</div>

<div className="animate-spin-fast">
  ⟳
</div>
```

### Shimmer

Shimmer effect for skeleton loaders:

```tsx
<div className="loading-shimmer h-20 w-full rounded" />
```

## Combining Interactions

Combine multiple interactions for rich feedback:

```tsx
// Button with all interactions
<Button className="hover-lift active-press focus-ring-animated">
  Rich interactions
</Button>

// Card with multiple effects
<Card
  interactive
  hoverEffect="lift"
  className="hover-glow"
>
  <CardContent>
    Multiple effects
  </CardContent>
</Card>

// Custom element with interactions
<div className="hover-lift hover-glow active-press focus-ring">
  Custom interactions
</div>
```

## Timing Guidelines

### Duration

- **Fast (150ms)**: Micro-interactions, hover effects
- **Base (250ms)**: Standard transitions, most animations
- **Slow (350ms)**: Complex animations, page transitions

### Easing

- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)` - Standard easing
- **Bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - Playful bounce
- **Elastic**: `cubic-bezier(0.68, -0.6, 0.32, 1.6)` - Elastic spring
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Natural spring

## Best Practices

### Do's

✅ Use micro-interactions for feedback
✅ Keep animations subtle and fast
✅ Provide multiple feedback mechanisms
✅ Test with keyboard navigation
✅ Respect reduced motion preferences

### Don'ts

❌ Don't animate everything
❌ Don't use slow animations for interactions
❌ Don't rely solely on animation for feedback
❌ Don't ignore accessibility
❌ Don't use animations without purpose

## Common Patterns

### Button Click Feedback

```tsx
<Button onClick={handleClick} className="hover-lift active-press">
  Click me
</Button>
```

### Card Selection

```tsx
<Card
  interactive
  hoverEffect="lift"
  onClick={handleSelect}
  className={cn("cursor-pointer", isSelected && "ring-2 ring-primary")}
>
  <CardContent>Selectable card</CardContent>
</Card>
```

### Form Submission

```tsx
<Button
  type="submit"
  loading={isSubmitting}
  className="hover-lift active-press"
>
  {isSubmitting ? "Submitting..." : "Submit"}
</Button>
```

### Success Confirmation

```tsx
{
  showSuccess && (
    <div className="animate-success-ping bg-success text-success-foreground p-4 rounded">
      <CheckIcon className="mr-2" />
      Success!
    </div>
  );
}
```

### Loading Skeleton

```tsx
<div className="space-y-4">
  <div className="loading-shimmer h-20 w-full rounded" />
  <div className="loading-shimmer h-20 w-full rounded" />
  <div className="loading-shimmer h-20 w-full rounded" />
</div>
```

## Accessibility

All micro-interactions respect `prefers-reduced-motion`:

```tsx
// Animations are automatic but respect user preferences
<Button>Click me</Button>; // Works for everyone

// Manual control if needed
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={prefersReducedMotion ? "" : "hover-lift"}>Content</div>
  );
}
```

## Performance

All micro-interactions are GPU-accelerated:

- Use `transform` and `opacity` for animations
- Include `will-change` hints where appropriate
- Use `backface-visibility: hidden` for smoother animations
- Automatic cleanup of animation states

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Related Documentation

- [Animation System](./animation-system.md) - Complete animation documentation
- [Reduced Motion Support](./reduced-motion-support.md) - Accessibility guidelines
- [Button Component](../../src/components/ui/button.tsx) - Button implementation
- [Card Component](../../src/components/ui/card.tsx) - Card implementation
