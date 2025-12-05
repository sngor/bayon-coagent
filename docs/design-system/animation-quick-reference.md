# Animation System Quick Reference

## Fade Animations

| Class                   | Duration | Use Case       |
| ----------------------- | -------- | -------------- |
| `animate-fade-in-fast`  | 150ms    | Quick reveals  |
| `animate-fade-in-base`  | 250ms    | Standard fades |
| `animate-fade-in-slow`  | 350ms    | Slow reveals   |
| `animate-fade-out-fast` | 150ms    | Quick exits    |
| `animate-fade-out-base` | 250ms    | Standard exits |

## Slide Animations

| Class                      | Direction    | Duration |
| -------------------------- | ------------ | -------- |
| `animate-slide-up-fast`    | Bottom → Top | 150ms    |
| `animate-slide-up-base`    | Bottom → Top | 250ms    |
| `animate-slide-up-slow`    | Bottom → Top | 350ms    |
| `animate-slide-down-fast`  | Top → Bottom | 150ms    |
| `animate-slide-down-base`  | Top → Bottom | 250ms    |
| `animate-slide-left-fast`  | Right → Left | 150ms    |
| `animate-slide-left-base`  | Right → Left | 250ms    |
| `animate-slide-right-fast` | Left → Right | 150ms    |
| `animate-slide-right-base` | Left → Right | 250ms    |

## Scale Animations

| Class                   | Duration | Use Case        |
| ----------------------- | -------- | --------------- |
| `animate-scale-in-fast` | 150ms    | Quick growth    |
| `animate-scale-in-base` | 250ms    | Standard growth |
| `animate-scale-in-slow` | 350ms    | Slow growth     |

## Bounce Animations

| Class                    | Duration | Easing  |
| ------------------------ | -------- | ------- |
| `animate-bounce-in-fast` | 400ms    | Bounce  |
| `animate-bounce-in-base` | 600ms    | Bounce  |
| `animate-bounce-in-slow` | 800ms    | Bounce  |
| `animate-elastic-fast`   | 600ms    | Elastic |
| `animate-elastic-base`   | 800ms    | Elastic |

## Rotate Animations

| Class                    | Duration | Use Case      |
| ------------------------ | -------- | ------------- |
| `animate-rotate-in-fast` | 150ms    | Quick spin    |
| `animate-rotate-in-base` | 250ms    | Standard spin |

## Duration Modifiers

| Class             | Duration | Use Case             |
| ----------------- | -------- | -------------------- |
| `duration-fast`   | 150ms    | Micro-interactions   |
| `duration-base`   | 250ms    | Standard transitions |
| `duration-slow`   | 350ms    | Complex animations   |
| `duration-smooth` | 400ms    | Polished animations  |

## Easing Modifiers

| Class          | Easing Function                        | Feel     |
| -------------- | -------------------------------------- | -------- |
| `ease-default` | cubic-bezier(0.4, 0, 0.2, 1)           | Standard |
| `ease-bounce`  | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Bouncy   |
| `ease-elastic` | cubic-bezier(0.68, -0.6, 0.32, 1.6)    | Elastic  |
| `ease-spring`  | cubic-bezier(0.34, 1.56, 0.64, 1)      | Spring   |

## Delay Modifiers

| Class        | Delay  | Use Case   |
| ------------ | ------ | ---------- |
| `delay-0`    | 0ms    | Immediate  |
| `delay-75`   | 75ms   | Very short |
| `delay-150`  | 150ms  | Short      |
| `delay-300`  | 300ms  | Medium     |
| `delay-500`  | 500ms  | Long       |
| `delay-700`  | 700ms  | Very long  |
| `delay-1000` | 1000ms | Extra long |

## Stagger Animations

| Class              | Effect                                                  |
| ------------------ | ------------------------------------------------------- |
| `stagger-children` | Animates children with 50ms increments (up to 10 items) |

## Hover Effects

| Class            | Effect                       |
| ---------------- | ---------------------------- |
| `hover-lift`     | Lifts 2px with shadow        |
| `hover-lift-lg`  | Lifts 4px with larger shadow |
| `hover-scale`    | Scales to 1.02               |
| `hover-scale-lg` | Scales to 1.05               |
| `hover-glow`     | Adds glow effect             |

## Focus Effects

| Class                 | Effect                  |
| --------------------- | ----------------------- |
| `focus-ring`          | Standard focus ring     |
| `focus-ring-animated` | Animated expanding ring |

## Active Effects

| Class             | Effect                  |
| ----------------- | ----------------------- |
| `active-press`    | Scales to 0.95 on click |
| `active-press-lg` | Scales to 0.90 on click |

## Loading Animations

| Class                | Effect        | Speed |
| -------------------- | ------------- | ----- |
| `animate-pulse-slow` | Pulse opacity | 2s    |
| `animate-pulse-base` | Pulse opacity | 1.5s  |
| `animate-pulse-fast` | Pulse opacity | 1s    |
| `animate-spin-slow`  | Rotate 360°   | 2s    |
| `animate-spin-base`  | Rotate 360°   | 1s    |
| `animate-spin-fast`  | Rotate 360°   | 0.5s  |

## Common Combinations

### Page Transition

```tsx
<div className="animate-fade-in-base">
```

### Modal Entrance

```tsx
<div className="animate-scale-in-base">
```

### Button

```tsx
<button className="hover-lift active-press focus-ring">
```

### Card

```tsx
<div className="hover-lift hover-glow">
```

### List Item

```tsx
<ul className="stagger-children">
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### Delayed Fade

```tsx
<div className="animate-fade-in-base delay-300">
```

### Bouncy Slide

```tsx
<div className="animate-slide-up-base ease-bounce">
```

## Reduced Motion

All animations automatically respect `prefers-reduced-motion: reduce`:

- Animations complete instantly
- Elements appear in final state
- Focus rings remain visible
- Loading animations simplify

## Performance Tips

✅ **Do:**

- Animate `opacity` and `transform`
- Use appropriate durations
- Limit simultaneous animations
- Test on mobile devices

❌ **Don't:**

- Animate `width`, `height`, `margin`, `padding`
- Add `will-change` manually (already included)
- Animate everything
- Ignore reduced motion preferences

## Design Tokens

Animation timing is controlled by CSS variables:

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
--transition-elastic: 600ms cubic-bezier(0.68, -0.6, 0.32, 1.6);
--transition-smooth: 400ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
```
