# Onboarding Performance Optimizations

This document describes the performance optimizations implemented for the user onboarding flow.

## Overview

The onboarding system implements several performance optimizations to ensure a fast, smooth experience across all devices:

1. **Code Splitting** - Lazy loading of heavy components
2. **Image Optimization** - Next.js Image with proper sizing
3. **Debouncing** - Delayed execution for form inputs
4. **Optimistic Updates** - Immediate UI feedback
5. **Analytics Batching** - Reduced network requests

## Code Splitting

### Lazy-Loaded Components

Heavy components are lazy-loaded using Next.js dynamic imports to reduce initial bundle size:

```typescript
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';

// Component is only loaded when needed
{showDialog && <LazySkipConfirmationDialog ... />}
```

### Available Lazy Components

- `LazySkipConfirmationDialog` - Skip confirmation dialog
- `LazyProfileForm` - Profile setup form
- `LazyFeatureTour` - Feature tour component
- `LazyHubSelection` - Hub selection cards
- `LazyCompletionCelebration` - Completion animation
- `LazyResumeBanner` - Resume onboarding banner
- `LazyAdminWelcome` - Admin welcome screen
- `LazyAdminUserManagement` - Admin user management
- `LazyAdminAnalytics` - Admin analytics overview
- `LazyAdminConfiguration` - Admin configuration

### Benefits

- **Reduced Initial Load**: Main bundle is smaller
- **Faster Time to Interactive**: Critical content loads first
- **Better Performance**: Only load what's needed

## Image Optimization

### Next.js Image Component

All images use the Next.js Image component with optimization:

```typescript
import Image from "next/image";
import { getOptimizedImageProps } from "@/lib/performance";

const imageProps = getOptimizedImageProps(
  "/images/welcome.png",
  "Welcome illustration",
  "hero",
  true // priority for above-the-fold
);

<Image {...imageProps} />;
```

### Image Size Presets

```typescript
ONBOARDING_IMAGE_SIZES = {
  icon: { width: 48, height: 48 },
  card: { width: 400, height: 300 },
  hero: { width: 800, height: 600 },
  illustration: { width: 600, height: 400 },
};
```

### Features

- **Automatic Format Selection**: WebP/AVIF when supported
- **Lazy Loading**: Images load as they enter viewport
- **Blur Placeholders**: Smooth loading experience
- **Responsive Sizing**: Optimized for device size

## Debouncing

### Form Input Debouncing

Form inputs are debounced to reduce unnecessary processing:

```typescript
import { useDebouncedCallback } from "@/lib/performance";

const debouncedSave = useDebouncedCallback(
  (value: string) => {
    // Save to server
    saveProfile(value);
  },
  500 // 500ms delay
);

<input onChange={(e) => debouncedSave(e.target.value)} />;
```

### Debounced Value Hook

```typescript
import { useDebouncedValue } from "@/lib/performance";

const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebouncedValue(searchTerm, 300);

// Use debouncedSearch for API calls
useEffect(() => {
  searchAPI(debouncedSearch);
}, [debouncedSearch]);
```

### Benefits

- **Reduced API Calls**: Only call after user stops typing
- **Better Performance**: Less processing during input
- **Improved UX**: Smoother interaction

## Optimistic Updates

### Immediate UI Feedback

Optimistic updates provide immediate feedback while operations complete:

```typescript
import { useOptimisticUpdate } from "@/lib/performance";

const { data, isOptimistic, optimisticUpdate } =
  useOptimisticUpdate(initialState);

const handleComplete = async () => {
  await optimisticUpdate(
    { ...data, completed: true }, // Optimistic state
    async () => {
      // Actual update
      return await completeStep(stepId);
    }
  );
};
```

### Step Navigation

```typescript
import { useOptimisticSteps } from "@/lib/performance";

const { currentStep, nextStep } = useOptimisticSteps(6, 0);

const handleNext = async () => {
  await nextStep(async () => {
    // Actual navigation
    return await saveAndNavigate();
  });
};
```

### Benefits

- **Perceived Performance**: UI updates immediately
- **Better UX**: No waiting for server response
- **Automatic Rollback**: Reverts on error

## Analytics Batching

### Event Batching

Analytics events are batched to reduce network requests:

```typescript
// Events are automatically batched
await onboardingAnalytics.trackStepCompleted(userId, flowType, stepId);
await onboardingAnalytics.trackStepSkipped(userId, flowType, stepId);

// Events are sent in batches every 30 seconds or when batch size (10) is reached
```

### Configuration

```typescript
const batcher = getAnalyticsBatcher(
  async (events) => {
    // Flush events to CloudWatch
    await flushEvents(events);
  },
  {
    maxBatchSize: 10, // Send after 10 events
    flushInterval: 30000, // Send every 30 seconds
    maxRetries: 3, // Retry failed batches
  }
);
```

### Features

- **Automatic Batching**: Events queued automatically
- **Offline Support**: Events queued when offline
- **Retry Logic**: Failed batches are retried
- **Manual Flush**: Force immediate send for critical events

### Benefits

- **Reduced Network Requests**: Fewer API calls
- **Better Performance**: Less network overhead
- **Offline Resilience**: Events saved until online

## Performance Metrics

### Expected Improvements

- **Initial Load Time**: 30-40% reduction with code splitting
- **Time to Interactive**: 20-30% improvement
- **Bundle Size**: 25-35% smaller initial bundle
- **Network Requests**: 60-70% fewer analytics requests
- **Perceived Performance**: Immediate UI feedback with optimistic updates

### Monitoring

Performance is monitored through:

- **Lighthouse Scores**: Automated performance testing
- **CloudWatch Metrics**: Load times and error rates
- **User Analytics**: Real-world performance data

## Best Practices

### When to Use Lazy Loading

✅ **Use for:**

- Heavy components (animations, forms)
- Conditionally rendered components
- Admin-only components
- Below-the-fold content

❌ **Don't use for:**

- Critical above-the-fold content
- Small, lightweight components
- Components needed immediately

### When to Use Debouncing

✅ **Use for:**

- Search inputs
- Form auto-save
- API calls triggered by input
- Expensive calculations

❌ **Don't use for:**

- Form submission buttons
- Critical user actions
- Navigation

### When to Use Optimistic Updates

✅ **Use for:**

- Step navigation
- Form submissions
- List operations (add/remove)
- Toggle states

❌ **Don't use for:**

- Critical operations (payments)
- Operations that frequently fail
- Complex state changes

## Implementation Checklist

- [x] Code splitting for onboarding routes
- [x] Lazy loading for heavy components
- [x] Image optimization with Next.js Image
- [x] Debouncing for form inputs
- [x] Optimistic UI updates
- [x] Analytics event batching
- [x] Performance monitoring
- [x] Documentation

## Related Files

- `/src/lib/performance/` - Performance utilities
- `/src/components/onboarding/lazy-components.tsx` - Lazy-loaded components
- `/src/services/onboarding/onboarding-analytics.ts` - Analytics with batching
- `/src/app/(onboarding)/layout.tsx` - Onboarding layout with code splitting

## Requirements

This implementation satisfies:

- **Requirement 7.1**: Responsive layouts and performance optimization
- **Requirement 8.5**: Analytics event batching for efficiency
