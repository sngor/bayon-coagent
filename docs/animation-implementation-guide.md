# Animation Implementation Guide

This guide shows how to implement the micro-animations in your existing components.

## Quick Start

### 1. Import Animation Utilities

```tsx
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
```

### 2. Replace Components with Animated Versions

#### Cards

```tsx
// Before
import { Card } from "@/components/ui/card";
<Card>Content</Card>;

// After
import { AnimatedCard } from "@/components/ui/animated-card";
<AnimatedCard variant="lift">Content</AnimatedCard>;
```

#### Lists

```tsx
// Before
<div>
  {items.map((item) => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>;

// After
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
<AnimatedList>
  {items.map((item) => (
    <AnimatedListItem key={item.id}>{item.name}</AnimatedListItem>
  ))}
</AnimatedList>;
```

#### Progress Bars

```tsx
// Before
import { Progress } from "@/components/ui/progress";
<Progress value={75} />;

// After
import { AnimatedProgress } from "@/components/ui/animated-progress";
<AnimatedProgress value={75} variant="gradient" showLabel />;
```

#### Inputs

```tsx
// Before
<Input placeholder="Email" />;

// After
import { AnimatedInput } from "@/components/ui/animated-input";
<AnimatedInput
  placeholder="Email"
  success={isValid}
  error={hasError}
  errorMessage="Invalid email"
/>;
```

### 3. Add Page Transitions

Wrap page content with motion.div:

```tsx
"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

export default function MyPage() {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* Page content */}
    </motion.div>
  );
}
```

### 4. Add Hover Effects to Existing Components

```tsx
// Add to any div/button
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

## Component-Specific Implementations

### Dashboard Cards

```tsx
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedIcon, PulsingIcon } from "@/components/ui/animated-icon";

<AnimatedCard variant="lift" className="card-hover-glow">
  <CardHeader>
    <div className="flex items-center gap-2">
      <PulsingIcon>
        <Sparkles className="w-5 h-5 text-primary" />
      </PulsingIcon>
      <CardTitle>AI Insights</CardTitle>
    </div>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</AnimatedCard>;
```

### Form Submissions

```tsx
import { SuccessFeedback } from "@/components/ui/success-feedback";

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
      message="Saved successfully!"
      duration={2000}
      onComplete={() => setShowSuccess(false)}
    />
  </>
);
```

### Loading States

```tsx
import { SkeletonCard, SkeletonList } from "@/components/ui/skeleton-loader";

{
  isLoading ? (
    <SkeletonCard />
  ) : (
    <AnimatedCard animateOnMount>{data}</AnimatedCard>
  );
}
```

### Notifications

```tsx
import {
  useNotifications,
  NotificationContainer,
} from "@/components/ui/animated-notification";

function MyComponent() {
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  const handleAction = () => {
    addNotification({
      title: "Success!",
      description: "Action completed",
      variant: "success",
      duration: 5000,
    });
  };

  return (
    <>
      <Button onClick={handleAction}>Do Something</Button>
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        position="top-right"
      />
    </>
  );
}
```

### Staggered Animations

```tsx
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      variants={staggerItem}
      className="p-4 border rounded-lg"
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>;
```

## Priority Implementation List

### High Priority (Immediate Impact)

1. **Dashboard Page** - Add AnimatedCard to metric cards
2. **Profile Page** - Add AnimatedProgress to completion banner
3. **Form Submissions** - Add SuccessFeedback to all forms
4. **Loading States** - Replace with SkeletonLoader components
5. **Buttons** - Already have ripple effects, add hover animations

### Medium Priority

6. **Hub Pages** - Add page transitions with fadeIn
7. **Lists** - Convert to AnimatedList for staggered reveals
8. **Inputs** - Add AnimatedInput for validation feedback
9. **Notifications** - Replace toast with AnimatedNotification
10. **Cards** - Convert to AnimatedCard throughout

### Low Priority (Polish)

11. **Icons** - Add AnimatedIcon for loading/success states
12. **Badges** - Convert to AnimatedBadge
13. **Tooltips** - Use AnimatedTooltip
14. **FAB** - Add FloatingActionButton where appropriate

## Example: Enhancing Dashboard Page

```tsx
"use client";

import { motion } from "framer-motion";
import {
  AnimatedCard,
  AnimatedCardHeader,
  AnimatedCardTitle,
  AnimatedCardContent,
} from "@/components/ui/animated-card";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { PulsingIcon } from "@/components/ui/animated-icon";
import { fadeIn, staggerContainer } from "@/lib/animations";

export default function DashboardPage() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Profile Completion */}
      <AnimatedCard variant="lift">
        <AnimatedCardHeader>
          <AnimatedCardTitle>Profile Completion</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <AnimatedProgress value={75} variant="gradient" showLabel />
        </AnimatedCardContent>
      </AnimatedCard>

      {/* Metrics Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <AnimatedCard variant="lift">
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <PulsingIcon>
                <TrendingUp className="w-8 h-8 text-success" />
              </PulsingIcon>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Content Pieces</p>
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        {/* More metric cards... */}
      </motion.div>

      {/* Recent Activity */}
      <AnimatedCard>
        <AnimatedCardHeader>
          <AnimatedCardTitle>Recent Activity</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <AnimatedList staggerDelay={0.05}>
            {activities.map((activity) => (
              <AnimatedListItem key={activity.id}>
                <div className="p-3 border rounded-lg hover:bg-accent transition-colors">
                  {activity.title}
                </div>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </AnimatedCardContent>
      </AnimatedCard>
    </motion.div>
  );
}
```

## CSS Classes for Quick Wins

Add these classes to existing elements without changing components:

```tsx
// Hover lift effect
<div className="card-hover-lift">...</div>

// Hover glow
<div className="card-hover-glow">...</div>

// Fade in on mount
<div className="animate-fade-in-up">...</div>

// Button with glow
<Button className="button-glow">...</Button>

// Gradient border
<div className="gradient-border gradient-border-animated">...</div>
```

## Testing Animations

1. Visit `/animations-demo` to see all animations
2. Test with reduced motion: System Preferences > Accessibility > Display > Reduce motion
3. Check performance with Chrome DevTools > Performance tab
4. Verify on mobile devices for touch interactions

## Common Patterns

### Success Flow

```tsx
const [showSuccess, setShowSuccess] = useState(false);

<Button onClick={async () => {
  await action();
  setShowSuccess(true);
}}>
  Submit
</Button>

<SuccessFeedback
  show={showSuccess}
  message="Success!"
  onComplete={() => setShowSuccess(false)}
/>
```

### Loading to Content

```tsx
{
  isLoading ? (
    <SkeletonCard />
  ) : (
    <AnimatedCard animateOnMount>{content}</AnimatedCard>
  );
}
```

### Form Validation

```tsx
<AnimatedInput
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={!!errors.email}
  errorMessage={errors.email}
  success={isValid}
/>
```

## Performance Tips

1. Use `AnimatePresence` for exit animations
2. Limit simultaneous animations to <10
3. Use CSS animations for simple effects
4. Prefer `transform` and `opacity` over other properties
5. Add `will-change` only on hover/interaction

## Next Steps

1. Start with high-priority items
2. Test each implementation
3. Gather user feedback
4. Iterate and refine
5. Document any custom animations you create

For complete API documentation, see `docs/micro-animations.md`.
