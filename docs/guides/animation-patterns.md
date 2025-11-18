# Animation Patterns & Timing Guide

> Complete reference for animation patterns, timing, and best practices in Co-agent Marketer

**Version:** 1.0  
**Last Updated:** November 2024

---

## Table of Contents

1. [Animation Principles](#animation-principles)
2. [Timing & Easing](#timing--easing)
3. [Common Patterns](#common-patterns)
4. [Component Animations](#component-animations)
5. [Page Transitions](#page-transitions)
6. [Performance Guidelines](#performance-guidelines)
7. [Accessibility](#accessibility)

---

## Animation Principles

### The 12 Principles (Applied to UI)

1. **Squash and Stretch**: Scale elements slightly on interaction
2. **Anticipation**: Subtle wind-up before main action
3. **Staging**: Direct attention with motion
4. **Straight Ahead & Pose to Pose**: Keyframe animations
5. **Follow Through**: Elements settle after main motion
6. **Slow In/Slow Out**: Ease in and out of movements
7. **Arcs**: Natural curved motion paths
8. **Secondary Action**: Supporting animations
9. **Timing**: Duration affects weight and mood
10. **Exaggeration**: Emphasize important actions
11. **Solid Drawing**: Maintain visual quality
12. **Appeal**: Make animations delightful

### UI Animation Goals

1. **Provide Feedback**: Confirm user actions
2. **Show Relationships**: Connect cause and effect
3. **Guide Attention**: Direct user focus
4. **Add Personality**: Create memorable experiences
5. **Reduce Cognitive Load**: Make changes clear

---

## Timing & Easing

### Duration Guidelines

```typescript
const durations = {
  instant: 0, // No animation
  fast: 150, // Micro-interactions (hover, focus)
  base: 250, // Standard transitions (fade, slide)
  slow: 350, // Complex animations (modals, drawers)
  slower: 500, // Page transitions
  slowest: 1000, // Special effects (celebrations)
};
```

### Easing Functions

```css
/* Standard easing curves */
:root {
  /* Linear - constant speed (rarely used) */
  --ease-linear: linear;

  /* Ease - default, good for most cases */
  --ease: ease;

  /* Ease-in - starts slow, accelerates */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);

  /* Ease-out - starts fast, decelerates (most common) */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);

  /* Ease-in-out - slow start and end */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Custom curves */
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-swift: cubic-bezier(0.55, 0, 0.1, 1);
}
```

### When to Use Each Easing

| Easing      | Use Case               | Example            |
| ----------- | ---------------------- | ------------------ |
| Linear      | Progress bars, loading | `width: 0 → 100%`  |
| Ease-out    | Entrances, appearing   | Modals, tooltips   |
| Ease-in     | Exits, disappearing    | Closing modals     |
| Ease-in-out | Movements, transforms  | Position changes   |
| Bounce      | Playful interactions   | Success animations |
| Swift       | Quick responses        | Button presses     |

### Timing Combinations

```typescript
// Fast + ease-out = snappy feedback
const buttonHover = {
  duration: 150,
  easing: "cubic-bezier(0, 0, 0.2, 1)",
};

// Base + ease-in-out = smooth transition
const modalOpen = {
  duration: 250,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// Slow + bounce = playful entrance
const celebration = {
  duration: 500,
  easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};
```

---

## Common Patterns

### 1. Fade In/Out

**Use for:** Content appearing/disappearing, overlays

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 250ms ease-out;
}

/* Fade Out */
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.fade-out {
  animation: fadeOut 200ms ease-in;
}
```

**React/Framer Motion:**

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.25 }}
>
  Content
</motion.div>
```

### 2. Slide In/Out

**Use for:** Drawers, sidebars, notifications

```css
/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 300ms cubic-bezier(0, 0, 0.2, 1);
}

/* Slide Down */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide Right */
@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**React/Framer Motion:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
>
  Content
</motion.div>
```

### 3. Scale In/Out

**Use for:** Modals, popovers, emphasis

```css
/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn 200ms cubic-bezier(0, 0, 0.2, 1);
}

/* Scale with bounce */
@keyframes scaleBounce {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
```

**React/Framer Motion:**

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

### 4. Stagger Children

**Use for:** Lists, grids, sequential reveals

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }}
>
  {items.map((item, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

### 5. Hover Effects

**Use for:** Interactive elements, cards, buttons

```css
/* Lift on hover */
.hover-lift {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Glow on hover */
.hover-glow {
  transition: box-shadow 300ms ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px hsl(var(--primary) / 0.4);
}

/* Scale on hover */
.hover-scale {
  transition: transform 200ms ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}
```

### 6. Loading Animations

**Use for:** Spinners, progress indicators, skeletons

```css
/* Spin */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Pulse */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Shimmer */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

### 7. Attention Seekers

**Use for:** Notifications, errors, important updates

```css
/* Shake */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 500ms ease-in-out;
}

/* Bounce */
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}

/* Wiggle */
@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

.animate-wiggle {
  animation: wiggle 500ms ease-in-out;
}
```

---

## Component Animations

### Button Animations

```tsx
// Standard button with press effect
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
  className="px-6 py-3 bg-primary text-white rounded-lg"
>
  Click me
</motion.button>

// Premium button with glow
<motion.button
  whileHover={{
    scale: 1.05,
    boxShadow: '0 0 20px hsl(var(--primary) / 0.4)',
  }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
  className="px-8 py-4 bg-gradient-to-r from-primary to-accent rounded-xl"
>
  Get Started
</motion.button>
```

### Card Animations

```tsx
// Interactive card
<motion.div
  whileHover={{
    scale: 1.02,
    y: -4,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
  }}
  transition={{ duration: 0.2 }}
  className="p-6 bg-card rounded-xl border cursor-pointer"
>
  Card content
</motion.div>

// Card entrance
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 0.1 }}
  className="p-6 bg-card rounded-xl"
>
  Card content
</motion.div>
```

### Modal Animations

```tsx
// Modal with backdrop
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 flex items-center justify-center p-4"
      >
        <div className="bg-card rounded-2xl p-6 max-w-lg w-full">
          Modal content
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Toast Notifications

```tsx
// Toast entrance from top
<motion.div
  initial={{ opacity: 0, y: -50 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -50 }}
  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
  className="fixed top-4 right-4 bg-card rounded-lg shadow-xl p-4"
>
  Toast message
</motion.div>

// Toast with slide from right
<motion.div
  initial={{ opacity: 0, x: 100 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 100 }}
  transition={{ duration: 0.3 }}
  className="fixed top-4 right-4 bg-card rounded-lg shadow-xl p-4"
>
  Toast message
</motion.div>
```

### Dropdown Menus

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full mt-2 bg-card rounded-lg shadow-xl p-2"
    >
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="px-4 py-2 hover:bg-accent rounded-md cursor-pointer"
        >
          {item}
        </motion.div>
      ))}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Page Transitions

### Fade Transition

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  <PageContent />
</motion.div>
```

### Slide Transition

```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 20 }}
  transition={{ duration: 0.3 }}
>
  <PageContent />
</motion.div>
```

### Orchestrated Page Entrance

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }}
>
  {/* Header */}
  <motion.div
    variants={{
      hidden: { opacity: 0, y: -20 },
      visible: { opacity: 1, y: 0 },
    }}
  >
    <PageHeader />
  </motion.div>

  {/* Content cards */}
  {cards.map((card, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <Card>{card}</Card>
    </motion.div>
  ))}
</motion.div>
```

---

## Performance Guidelines

### 1. Use GPU-Accelerated Properties

✅ **Fast (GPU):**

- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (with caution)

❌ **Slow (CPU):**

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`

### 2. Optimize with will-change

```css
/* Add will-change before animation */
.element-about-to-animate {
  will-change: transform, opacity;
}

/* Remove after animation */
.element-done-animating {
  will-change: auto;
}
```

### 3. Reduce Animation Complexity

```tsx
// ✅ Good: Simple, performant
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// ❌ Bad: Too complex
<motion.div
  animate={{
    opacity: 1,
    y: 0,
    rotate: 360,
    scale: [0.8, 1.2, 1],
    borderRadius: ['0%', '50%', '25%'],
  }}
  transition={{ duration: 2 }}
>
  Content
</motion.div>
```

### 4. Limit Concurrent Animations

```tsx
// ✅ Good: Stagger animations
<motion.div variants={{ visible: { staggerChildren: 0.1 } }}>
  {items.map((item) => (
    <AnimatedItem key={item.id} />
  ))}
</motion.div>;

// ❌ Bad: All at once
{
  items.map((item) => (
    <motion.div animate={{ opacity: 1 }} key={item.id}>
      {item}
    </motion.div>
  ));
}
```

### 5. Use CSS for Simple Animations

```css
/* ✅ Good: CSS for simple hover */
.button {
  transition: transform 200ms ease;
}

.button:hover {
  transform: scale(1.05);
}
```

```tsx
// ❌ Overkill: Framer Motion for simple hover
<motion.button whileHover={{ scale: 1.05 }}>Click me</motion.button>
```

---

## Accessibility

### Respect Reduced Motion

```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// React hook for reduced motion
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

// Usage
function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      Content
    </motion.div>
  );
}
```

### Focus Management

```tsx
// Ensure focus is managed during animations
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  onAnimationComplete={() => {
    // Focus first interactive element
    firstButtonRef.current?.focus();
  }}
>
  <button ref={firstButtonRef}>First Action</button>
</motion.div>
```

### Avoid Motion Sickness

❌ **Avoid:**

- Rapid spinning
- Excessive parallax
- Continuous rotation
- Jarring movements
- Flashing effects

✅ **Safe:**

- Gentle fades
- Smooth slides
- Subtle scales
- Natural easing

---

## Testing Animations

### Visual Testing

```typescript
// Test animation presence
test("button animates on hover", async () => {
  const { getByRole } = render(<AnimatedButton />);
  const button = getByRole("button");

  // Trigger hover
  fireEvent.mouseEnter(button);

  // Check for animation class or style
  expect(button).toHaveStyle({ transform: "scale(1.05)" });
});
```

### Performance Testing

```typescript
// Monitor frame rate during animation
function measureAnimationPerformance() {
  let frames = 0;
  let lastTime = performance.now();

  function countFrame() {
    frames++;
    const currentTime = performance.now();

    if (currentTime >= lastTime + 1000) {
      console.log(`FPS: ${frames}`);
      frames = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(countFrame);
  }

  requestAnimationFrame(countFrame);
}
```

---

## Quick Reference

### Animation Checklist

- [ ] Duration appropriate for action (150-500ms)
- [ ] Easing feels natural (ease-out for entrances)
- [ ] Uses GPU-accelerated properties
- [ ] Respects reduced motion preference
- [ ] Maintains 60fps
- [ ] Provides clear feedback
- [ ] Doesn't distract from content
- [ ] Tested on mobile devices

### Common Durations

| Action | Duration | Easing      |
| ------ | -------- | ----------- |
| Hover  | 150ms    | ease-out    |
| Click  | 100ms    | ease-in-out |
| Fade   | 250ms    | ease-out    |
| Slide  | 300ms    | ease-out    |
| Modal  | 250ms    | ease-in-out |
| Toast  | 300ms    | ease-out    |
| Page   | 350ms    | ease-in-out |

---

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Animation Performance Guide](./ANIMATION_PERFORMANCE_GUIDE.md)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [CSS Animations MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

---

**Maintained by:** Design System Team  
**Version:** 1.0  
**Last Updated:** November 2024
