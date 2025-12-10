# Onboarding Performance - Quick Reference

## Quick Start

### Import Performance Utilities

```typescript
import {
  // Debouncing
  useDebouncedCallback,
  useDebouncedValue,

  // Optimistic Updates
  useOptimisticUpdate,
  useOptimisticSteps,

  // Image Optimization
  getOptimizedImageProps,
} from "@/lib/performance";

// Lazy Components
import {
  LazySkipConfirmationDialog,
  LazyProfileForm,
  LazyFeatureTour,
} from "@/components/onboarding/lazy-components";
```

## Common Patterns

### 1. Lazy Load a Component

```typescript
// Only load when needed
{
  showDialog && (
    <LazySkipConfirmationDialog open={showDialog} onOpenChange={closeDialog} />
  );
}
```

### 2. Debounce Form Input

```typescript
const debouncedSave = useDebouncedCallback(
  (value: string) => saveProfile(value),
  500 // 500ms delay
);

<input onChange={(e) => debouncedSave(e.target.value)} />;
```

### 3. Optimistic Step Navigation

```typescript
const { currentStep, nextStep } = useOptimisticSteps(6, 0);

const handleNext = async () => {
  await nextStep(async () => {
    return await saveAndNavigate();
  });
};
```

### 4. Optimize Images

```typescript
import Image from "next/image";

const imageProps = getOptimizedImageProps(
  "/images/hero.png",
  "Hero image",
  "hero",
  true // priority
);

<Image {...imageProps} />;
```

### 5. Batch Analytics Events

```typescript
// Events are automatically batched
await onboardingAnalytics.trackStepCompleted(userId, flowType, stepId);

// Force immediate flush for critical events
await onboardingAnalytics.flush();
```

## When to Use What

### Code Splitting

✅ Use for:

- Heavy components (animations, forms)
- Conditionally rendered components
- Below-the-fold content

❌ Avoid for:

- Critical above-the-fold content
- Small components

### Debouncing

✅ Use for:

- Search inputs
- Form auto-save
- API calls from input

❌ Avoid for:

- Submit buttons
- Navigation
- Critical actions

### Optimistic Updates

✅ Use for:

- Step navigation
- Form submissions
- Toggle states

❌ Avoid for:

- Critical operations (payments)
- Operations that frequently fail

## Performance Checklist

- [ ] Use lazy loading for heavy components
- [ ] Debounce form inputs that trigger API calls
- [ ] Add optimistic updates for better UX
- [ ] Optimize images with Next.js Image
- [ ] Let analytics batch automatically
- [ ] Test on slow connections
- [ ] Monitor bundle size

## Troubleshooting

### Component Not Loading

```typescript
// Check if component is conditionally rendered
{
  condition && <LazyComponent />;
}

// Ensure dynamic import path is correct
const LazyComponent = dynamic(() => import("./component"));
```

### Debounce Not Working

```typescript
// Ensure callback is memoized
const callback = useCallback(
  (value) => {
    save(value);
  },
  [dependencies]
);

const debounced = useDebouncedCallback(callback, 500);
```

### Optimistic Update Failing

```typescript
// Check error handling
try {
  await optimisticUpdate(newState, async () => {
    return await actualUpdate();
  });
} catch (error) {
  // State automatically rolled back
  console.error("Update failed:", error);
}
```

## Performance Metrics

Expected improvements:

- **Load Time**: 30-40% faster
- **Bundle Size**: 25-35% smaller
- **Network Requests**: 60-70% fewer
- **Time to Interactive**: 20-30% faster

## Related Documentation

- [Full Performance Guide](../onboarding-performance.md)
- [Component Documentation](../components/onboarding.md)
- [Analytics Documentation](../onboarding-monitoring.md)
