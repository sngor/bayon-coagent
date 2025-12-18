# Onboarding Performance Optimization Guide

This guide demonstrates how to implement performance optimizations in onboarding components using debouncing, optimistic updates, image optimization, and analytics batching.

## Overview

The onboarding system includes several performance optimization patterns that improve user experience by reducing perceived loading times and providing immediate feedback.

## Performance Patterns

### 1. Optimistic Updates

Provide immediate feedback while operations complete in the background.

**Use Case**: Step navigation, form submissions, list operations

**Implementation**: See `OptimisticListExample` in `/examples/performance-example.tsx`

```typescript
import { useOptimisticSteps } from '@/lib/performance/optimistic-updates';

const { currentStep, nextStep, previousStep } = useOptimisticSteps(6, 1);

// Navigate with optimistic update
await nextStep(async () => {
  // Actual navigation
  return await navigateToNextStep();
});
```

**Benefits**:
- Immediate visual feedback
- Reduced perceived latency
- Better user experience during slow network conditions

### 2. Debounced Operations

Reduce API calls and improve performance for frequent operations.

**Use Cases**: 
- Search input (300ms delay)
- Auto-save functionality (500-1000ms delay)
- Form validation

**Implementation**: See `DebouncedFormExample` in `/examples/performance-example.tsx`

```typescript
import { useDebouncedCallback, useDebouncedValue } from '@/lib/performance/debounce';

// Debounced search
const debouncedSearch = useDebouncedValue(searchTerm, 300);

// Debounced auto-save
const debouncedSave = useDebouncedCallback(
  async (data: ProfileData) => {
    await saveProfile(data);
  },
  500
);
```

**Benefits**:
- Reduced server load
- Improved performance
- Better user experience with real-time feedback

### 3. Analytics Batching

Automatically batch analytics events to reduce network requests.

**Use Case**: Step completion tracking, user interaction events

**Implementation**: See `ProfileSetupExample` in `/examples/performance-example.tsx`

```typescript
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';

// Events are automatically batched
await onboardingAnalytics.trackStepCompleted(userId, flowType, 'profile-setup');
await onboardingAnalytics.trackStepSkipped(userId, flowType, 'profile-setup');
```

**Benefits**:
- Reduced network requests
- Better performance
- Improved analytics reliability

### 4. Image Optimization

Optimize images for faster loading and better performance.

**Use Case**: Hero images, illustrations, user avatars

**Implementation**: See `ProfileSetupExample` in `/examples/performance-example.tsx`

```typescript
import Image from 'next/image';

<Image
  src="/images/onboarding/profile-setup.png"
  alt="Profile setup illustration"
  width={800}
  height={600}
  priority
  quality={85}
  className="rounded-lg"
/>
```

**Benefits**:
- Faster image loading
- Automatic format optimization (WebP, AVIF)
- Responsive image sizing

### 5. Lazy Loading

Load components only when needed to reduce initial bundle size.

**Use Case**: Heavy components, modals, dialogs

**Implementation**: See `LazySkipConfirmationDialog` in `/examples/performance-example.tsx`

```typescript
import { LazySkipConfirmationDialog } from '@/components/onboarding/lazy-components';

// Component is loaded only when showSkipDialog is true
{showSkipDialog && (
  <LazySkipConfirmationDialog
    open={showSkipDialog}
    onOpenChange={setShowSkipDialog}
    onConfirm={handleSkip}
  />
)}
```

**Benefits**:
- Reduced initial bundle size
- Faster page load times
- Better performance on slower devices

## Complete Example

The `ProfileSetupExample` demonstrates all optimization patterns working together:

```typescript
export function ProfileSetupExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const userId = 'example-user-id';
  const flowType = 'user';

  // 1. Optimistic Updates - Step navigation
  const { currentStep, nextStep, previousStep } = useOptimisticSteps(6, 1);

  // 2. Debouncing - Search input
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  // 3. Analytics Batching - Automatic event batching
  const handleStepComplete = useCallback(async () => {
    await onboardingAnalytics.trackStepCompleted(userId, flowType, 'profile-setup');
    await nextStep(async () => await navigateToNextStep());
  }, [userId, flowType, nextStep]);

  return (
    <OnboardingContainer
      currentStep={currentStep}
      totalSteps={6}
      stepId="profile-setup"
      title="Set Up Your Profile"
      description="Tell us about yourself so we can personalize your experience"
      onNext={handleStepComplete}
      onSkip={() => setShowSkipDialog(true)}
    >
      {/* 4. Image Optimization */}
      <Image
        src="/images/onboarding/profile-setup.png"
        alt="Profile setup illustration"
        width={800}
        height={600}
        priority
        quality={85}
      />

      {/* Debounced Search */}
      <Input
        type="text"
        placeholder="Search brokerages..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <p>Searching for: {debouncedSearch}</p>

      {/* 5. Lazy Loading */}
      {showSkipDialog && (
        <LazySkipConfirmationDialog
          open={showSkipDialog}
          onOpenChange={setShowSkipDialog}
          onConfirm={handleSkip}
        />
      )}
    </OnboardingContainer>
  );
}
```

## Performance Metrics

### Target Performance Goals

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Time to Interactive (TTI)**: < 3.5s

### Optimization Impact

| Pattern | Improvement | Use Case |
|---------|-------------|----------|
| Optimistic Updates | 50-80% perceived performance | Navigation, forms |
| Debouncing | 60-90% fewer API calls | Search, auto-save |
| Analytics Batching | 70-85% fewer requests | Event tracking |
| Image Optimization | 40-60% faster loading | Images, media |
| Lazy Loading | 20-40% smaller bundles | Heavy components |

## Best Practices

### 1. Optimistic Updates

- Always provide rollback functionality
- Show loading states for ongoing operations
- Handle errors gracefully with user feedback
- Use for operations that are likely to succeed

### 2. Debouncing

- Use 300ms for search inputs
- Use 500-1000ms for auto-save operations
- Validate data before debounced operations
- Provide immediate visual feedback

### 3. Analytics Batching

- Batch events automatically in the background
- Include error handling for failed requests
- Use meaningful event names and properties
- Respect user privacy preferences

### 4. Image Optimization

- Use Next.js Image component for automatic optimization
- Set appropriate priority for above-the-fold images
- Use quality={85} for good balance of size/quality
- Provide proper alt text for accessibility

### 5. Lazy Loading

- Lazy load components that aren't immediately visible
- Use React.lazy() with Suspense for code splitting
- Provide loading states for lazy-loaded content
- Test on slower devices and networks

## Testing Performance

### Development Testing

```bash
# Run performance tests
npm run test:performance

# Analyze bundle size
npm run analyze

# Check Core Web Vitals
npm run lighthouse
```

### Production Monitoring

- Monitor Core Web Vitals in production
- Track performance metrics over time
- Set up alerts for performance regressions
- Use Real User Monitoring (RUM) data

## Common Pitfalls

### 1. Over-Optimization

- Don't optimize prematurely
- Measure before and after optimization
- Focus on user-perceived performance
- Balance complexity vs. benefit

### 2. Debouncing Issues

- Don't debounce critical operations
- Handle component unmounting properly
- Clear timeouts on cleanup
- Test edge cases (rapid input changes)

### 3. Optimistic Update Problems

- Always implement rollback logic
- Handle network failures gracefully
- Provide clear error messages
- Test offline scenarios

## Related Documentation

- [Responsive Design Guide](./RESPONSIVE_DESIGN.md) - Mobile performance optimizations
- [Examples](./examples/performance-example.tsx) - Complete code examples
- [Quick Reference](./QUICK_REFERENCE.md) - Basic usage patterns

## Requirements Satisfied

- ✅ **7.1**: Mobile-first responsive design with performance optimizations
- ✅ **8.5**: Performance optimization patterns for better user experience
