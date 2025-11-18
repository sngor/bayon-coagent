# Icon Animations Quick Reference

Quick reference guide for the most common icon animation patterns.

## Import

```tsx
import { iconAnimations } from "@/lib/icon-animations";
```

## Common Patterns

### 1. Basic Icon with Hover

```tsx
<motion.svg
  variants={iconAnimations.standard()}
  initial="initial"
  animate="animate"
  whileHover="hover"
  whileTap="tap"
>
  {/* SVG content */}
</motion.svg>
```

### 2. Navigation Icon

```tsx
<motion.div
  variants={iconAnimations.navigation()}
  initial="initial"
  animate="animate"
  whileHover="hover"
>
  <Icon className="w-5 h-5" />
</motion.div>
```

### 3. Success Message

```tsx
<motion.div
  variants={iconAnimations.success({ style: "energetic" })}
  initial="initial"
  animate="animate"
>
  <SuccessIcon />
</motion.div>
```

### 4. Loading Spinner

```tsx
<motion.svg
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
  />
</motion.svg>
```

### 5. AI Feature Icon

```tsx
<motion.svg variants={iconAnimations.sparkle()} animate="animate">
  <path d="..." fill="url(#gradient)" />
</motion.svg>
```

### 6. Empty State Illustration

```tsx
<motion.svg
  variants={iconAnimations.emptyState()}
  initial="initial"
  animate="animate"
>
  {/* Illustration */}
</motion.svg>
```

### 7. Path Drawing

```tsx
<motion.path
  d="M..."
  variants={iconAnimations.pathDraw({ speed: "slow" })}
  initial="initial"
  animate="animate"
/>
```

### 8. Staggered List

```tsx
{
  items.map((item, i) => (
    <motion.div
      key={item.id}
      variants={iconAnimations.slideIn("up", { delay: i * 0.1 })}
      initial="initial"
      animate="animate"
    >
      <Icon />
    </motion.div>
  ));
}
```

## Speed Options

| Speed     | Use Case            |
| --------- | ------------------- |
| `instant` | Immediate feedback  |
| `fast`    | Quick interactions  |
| `normal`  | Standard animations |
| `slow`    | Dramatic reveals    |

## Style Options

| Style       | Use Case              |
| ----------- | --------------------- |
| `subtle`    | Professional, minimal |
| `normal`    | Standard interactions |
| `energetic` | Exciting, prominent   |
| `playful`   | Fun, celebratory      |

## Configuration

```tsx
{
  speed: 'fast',        // Animation speed
  style: 'energetic',   // Animation intensity
  delay: 0.2,           // Delay before animation starts
  respectReducedMotion: true  // Respect user preference
}
```

## Accessibility

Always respect reduced motion for decorative animations:

```tsx
<motion.svg
  variants={iconAnimations.fadeIn({ respectReducedMotion: true })}
  initial="initial"
  animate="animate"
>
  {/* SVG content */}
</motion.svg>
```

## Performance Tips

1. Use `animated={false}` for static icons in large lists
2. Disable animations on mobile for battery savings
3. Use presets for consistency
4. Test with reduced motion enabled

## Demo

Visit `/icon-animations-demo` to see all animations in action with live controls.
