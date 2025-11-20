# Micro-Animations Guide

This guide covers all the micro-animations available in the Bayon Coagent app, designed to create delightful user experiences with smooth, performant animations.

## Overview

The animation system is built on:

- **Framer Motion** for React component animations
- **Tailwind CSS** for utility-based animations
- **Custom CSS** for specialized effects
- **GPU acceleration** for optimal performance

## Animation Library

### Core Animation Utilities (`src/lib/animations.ts`)

Centralized animation variants and transitions for consistent animations throughout the app.

#### Easings

```typescript
import { easings } from "@/lib/animations";

// Available easings
easings.smooth; // [0.4, 0, 0.2, 1]
easings.bounce; // [0.68, -0.55, 0.265, 1.55]
easings.spring; // [0.175, 0.885, 0.32, 1.275]
easings.snappy; // [0.25, 0.46, 0.45, 0.94]
```

#### Transitions

```typescript
import { transitions } from "@/lib/animations";

transitions.fast; // 150ms smooth
transitions.base; // 250ms smooth
transitions.slow; // 350ms smooth
transitions.spring; // Spring physics
transitions.springBouncy; // Bouncy spring
```

#### Fade Variants

```typescript
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
} from "@/lib/animations";

<motion.div variants={fadeInUp} initial="hidden" animate="visible">
  Content
</motion.div>;
```

#### Scale Variants

```typescript
import { scaleIn, scaleBounce, scaleInCenter } from "@/lib/animations";
```

#### Slide Variants

```typescript
import {
  slideInUp,
  slideInDown,
  slideInLeft,
  slideInRight,
} from "@/lib/animations";
```

#### Stagger Variants

```typescript
import { staggerContainer, staggerItem } from "@/lib/animations";

<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>;
```

## Components

### AnimatedCard

Enhanced card with hover effects and entrance animations.

```tsx
import {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardContent,
} from "@/components/ui/animated-card";

<AnimatedCard variant="lift" hoverEffect>
  <AnimatedCardHeader>
    <AnimatedCardTitle>Card Title</AnimatedCardTitle>
  </AnimatedCardHeader>
  <AnimatedCardContent>Card content here</AnimatedCardContent>
</AnimatedCard>;
```

**Variants:**

- `default` - Standard hover with lift
- `lift` - Pronounced lift effect
- `glow` - Glow on hover
- `scale` - Scale on hover
- `none` - No hover effect

### AnimatedList

Staggered list animations for smooth item reveals.

```tsx
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";

<AnimatedList staggerDelay={0.1}>
  {items.map((item) => (
    <AnimatedListItem key={item.id}>{item.content}</AnimatedListItem>
  ))}
</AnimatedList>;
```

### AnimatedIcon

Icon animations for visual feedback.

```tsx
import { AnimatedIcon, SpinningIcon, PulsingIcon, BouncingIcon } from '@/components/ui/animated-icon';

// Preset components
<SpinningIcon><Loader2 /></SpinningIcon>
<PulsingIcon><Heart /></PulsingIcon>
<BouncingIcon><Star /></BouncingIcon>

// Custom animation
<AnimatedIcon animation="bounce" trigger="hover">
  <Sparkles />
</AnimatedIcon>
```

**Animations:**

- `bounce` - Bounce effect
- `pulse` - Pulsing scale
- `spin` - Continuous rotation
- `shake` - Shake animation
- `none` - No animation

**Triggers:**

- `hover` - Animate on hover
- `always` - Always animating
- `manual` - Control via state

### AnimatedBadge

Badges with entrance animations and hover effects.

```tsx
import { AnimatedBadge } from "@/components/ui/animated-badge";

<AnimatedBadge variant="success" pulse>
  New
</AnimatedBadge>;
```

### AnimatedInput

Input fields with focus animations and validation feedback.

```tsx
import { AnimatedInput } from "@/components/ui/animated-input";

<AnimatedInput
  placeholder="Email"
  success={isValid}
  successMessage="Email is valid"
  error={hasError}
  errorMessage="Invalid email"
/>;
```

### AnimatedProgress

Progress indicators with smooth animations.

```tsx
import { AnimatedProgress, CircularProgress, StepProgress } from '@/components/ui/animated-progress';

// Linear progress
<AnimatedProgress value={75} variant="gradient" showLabel />

// Circular progress
<CircularProgress value={60} size={120} variant="success" />

// Step progress
<StepProgress steps={['Step 1', 'Step 2', 'Step 3']} currentStep={1} />
```

### SuccessFeedback

Success animations with checkmark and ping effects.

```tsx
import { SuccessFeedback, InlineSuccess, AnimatedCheckmark } from '@/components/ui/success-feedback';

// Full-screen success
<SuccessFeedback
  show={showSuccess}
  message="Saved successfully!"
  onComplete={() => setShowSuccess(false)}
/>

// Inline success
<InlineSuccess show={true} message="Done!" />

// Animated checkmark
<AnimatedCheckmark size={64} />
```

### Skeleton Loaders

Animated loading skeletons.

```tsx
import { Skeleton, SkeletonCard, SkeletonList, SkeletonText } from '@/components/ui/skeleton-loader';

<Skeleton variant="shimmer" className="h-4 w-full" />
<SkeletonCard />
<SkeletonList items={5} />
<SkeletonText lines={3} />
```

**Variants:**

- `default` - Static skeleton
- `shimmer` - Shimmer animation
- `pulse` - Pulse animation

### AnimatedTooltip

Tooltips with smooth entrance/exit animations.

```tsx
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

<AnimatedTooltip content="Helpful tip" side="top">
  <Button>Hover me</Button>
</AnimatedTooltip>;
```

### AnimatedNotification

Toast-style notifications with slide animations.

```tsx
import {
  NotificationContainer,
  useNotifications,
} from "@/components/ui/animated-notification";

function MyComponent() {
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  return (
    <>
      <Button
        onClick={() =>
          addNotification({
            title: "Success!",
            description: "Action completed",
            variant: "success",
            duration: 5000,
          })
        }
      >
        Show Notification
      </Button>

      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        position="top-right"
      />
    </>
  );
}
```

### FloatingActionButton

Expandable FAB with action menu.

```tsx
import { FloatingActionButton } from "@/components/ui/floating-action-button";

<FloatingActionButton
  position="bottom-right"
  actions={[
    { icon: <Plus />, label: "Create", onClick: handleCreate },
    { icon: <Send />, label: "Send", onClick: handleSend, variant: "success" },
  ]}
/>;
```

## Button Animations

The Button component includes built-in micro-animations:

```tsx
import { Button } from '@/components/ui/button';

// Ripple effect on click (automatic)
<Button>Click me</Button>

// Special variants with animations
<Button variant="ai">AI Button</Button>
<Button variant="shimmer">Shimmer</Button>
<Button variant="glow">Glow Effect</Button>
<Button variant="premium">Premium</Button>
```

## CSS Animation Classes

### Utility Classes

```css
/* Fade animations */
.animate-fade-in
.animate-fade-in-up
.animate-fade-out

/* Scale animations */
.animate-scale-in
.animate-bounce-in

/* Slide animations */
.animate-slide-in-right
.animate-slide-in-left
.animate-slide-down

/* Feedback animations */
.animate-success-ping
.animate-shake
.animate-pulse-success

/* Loading animations */
.animate-glow
.animate-shimmer

/* Delays for staggered animations */
.animate-delay-100
.animate-delay-200
.animate-delay-300;
```

### Card Effects

```css
.card-hover-lift      /* Lift on hover */
/* Lift on hover */
.card-hover-glow      /* Glow on hover */
.card-hover-scale     /* Scale on hover */
.card-hover-border; /* Border color change */
```

### Button Effects

```css
.button-interactive   /* Interactive button base */
/* Interactive button base */
.button-ripple       /* Ripple effect */
.button-glow; /* Glow on hover */
```

### Gradient Effects

```css
.ai-gradient         /* AI gradient background */
/* AI gradient background */
.shimmer-gradient    /* Shimmer gradient */
.gradient-border; /* Gradient border */
```

### Glass Effects

```css
.glass-effect        /* Glassmorphism */
/* Glassmorphism */
.glass-effect-sm     /* Small blur */
.glass-effect-md     /* Medium blur */
.glass-effect-lg; /* Large blur */
```

## Performance Best Practices

### 1. GPU Acceleration

All animations use GPU-accelerated properties:

- `transform` (translate, scale, rotate)
- `opacity`
- Avoid animating `width`, `height`, `top`, `left`

### 2. Will-Change Optimization

Strategic use of `will-change` on hover:

```css
.card-interactive:hover {
  will-change: transform, box-shadow;
}
```

### 3. Reduced Motion

Respects user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4. Animation Cleanup

Framer Motion automatically cleans up animations, but for manual animations:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // Animation complete
  }, duration);
  return () => clearTimeout(timer);
}, []);
```

## Common Patterns

### Page Transitions

```tsx
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

export default function Page() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Page content */}
    </motion.div>
  );
}
```

### Form Validation Feedback

```tsx
<AnimatedInput
  error={!!errors.email}
  errorMessage={errors.email?.message}
  success={isValid && !errors.email}
/>
```

### Loading States

```tsx
{
  isLoading ? (
    <SkeletonCard />
  ) : (
    <AnimatedCard animateOnMount>{/* Content */}</AnimatedCard>
  );
}
```

### Success Actions

```tsx
const [showSuccess, setShowSuccess] = useState(false);

const handleSubmit = async () => {
  await saveData();
  setShowSuccess(true);
};

return (
  <>
    <Button onClick={handleSubmit}>Save</Button>
    <SuccessFeedback
      show={showSuccess}
      message="Saved!"
      onComplete={() => setShowSuccess(false)}
    />
  </>
);
```

## Demo Page

Visit `/animations-demo` to see all animations in action and interact with live examples.

## Customization

### Creating Custom Variants

```typescript
import { Variants } from "framer-motion";

const customVariant: Variants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
```

### Extending Components

```tsx
import { AnimatedCard } from "@/components/ui/animated-card";

const CustomCard = ({ children }) => (
  <AnimatedCard
    variant="lift"
    className="custom-class"
    whileHover={{ scale: 1.05, rotate: 2 }}
  >
    {children}
  </AnimatedCard>
);
```

## Troubleshooting

### Animation Not Working

1. Check if component is client-side (`'use client'`)
2. Verify Framer Motion is installed
3. Check for conflicting CSS
4. Ensure parent has proper layout

### Performance Issues

1. Reduce number of simultaneous animations
2. Use `will-change` sparingly
3. Prefer `transform` and `opacity`
4. Check for layout thrashing

### Reduced Motion

Test with reduced motion enabled:

```bash
# macOS System Preferences
System Preferences > Accessibility > Display > Reduce motion
```

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Best Practices](https://web.dev/animations/)
- [CSS Triggers](https://csstriggers.com/)
