# Mobile Performance Optimizations

This document describes the performance optimization features implemented for mobile agent workflows.

## Overview

The mobile performance optimization system provides:

1. **Progressive Image Loading** - Lazy loading with placeholders and error handling
2. **Navigation Prefetching** - Context-aware route prefetching
3. **Cancellable Operations** - Long-running operations with visual feedback
4. **Image Compression** - WebP conversion and size optimization
5. **Code Splitting** - Dynamic imports for mobile-specific routes

## Features

### 1. Progressive Image Loading (Requirement 7.3)

Progressive image loading reduces initial page load time and data usage by:

- Loading images only when they enter the viewport (lazy loading)
- Showing placeholders while images load
- Providing loading indicators
- Handling errors gracefully

#### Usage

```tsx
import { ProgressiveImage } from "@/components/mobile/progressive-image";

<ProgressiveImage
  src="https://example.com/image.jpg"
  alt="Property photo"
  placeholder="/placeholder.jpg"
  lazy={true}
  className="aspect-video rounded-lg"
/>;
```

#### Hook Usage

```tsx
import { useProgressiveImage, useLazyImage } from "@/lib/mobile/performance";

// Basic progressive loading
const imageState = useProgressiveImage({
  src: imageUrl,
  alt: "Property",
  placeholder: placeholderUrl,
});

// Lazy loading with Intersection Observer
const { elementRef, imageState, shouldLoad } = useLazyImage({
  src: imageUrl,
  alt: "Property",
  threshold: 0.1,
});
```

### 2. Navigation Prefetching (Requirement 7.4)

Navigation prefetching improves perceived performance by preloading likely next pages based on:

- Current route context
- User role
- Recent navigation history
- Time of day

#### Usage

```tsx
import { NavigationPrefetchProvider } from "@/components/mobile/navigation-prefetch-provider";

<NavigationPrefetchProvider userRole="agent">
  {children}
</NavigationPrefetchProvider>;
```

#### Prefetch Strategy

The system automatically prefetches routes based on context:

- **Studio Hub** → Library, Brand Profile
- **Brand Hub** → Studio Write, Research Agent
- **Research Hub** → Library Reports, Market Insights
- **Market Hub** → Tools Calculator, Research Agent
- **Tools Hub** → Market Insights, Library Content
- **Library Hub** → Studio Write, Studio Describe

#### Manual Prefetching

```tsx
import { getPrefetchRoutes } from "@/lib/mobile/performance";

const context = {
  currentRoute: "/studio/write",
  userRole: "agent",
  recentRoutes: ["/library/content", "/brand/profile"],
  timeOfDay: "morning",
};

const { routes, priority } = getPrefetchRoutes(context);
// routes: ['/library/content', '/brand/profile', '/dashboard', '/assistant']
// priority: 'high'
```

### 3. Cancellable Operations (Requirement 7.5)

Cancellable operations allow users to stop long-running tasks with visual feedback:

- Progress indicators
- One-tap cancellation
- AbortController integration
- Graceful error handling

#### Usage

```tsx
import { useCancellableOperation } from "@/lib/mobile/performance";
import { CancellableOperation } from "@/components/mobile/cancellable-operation";

function MyComponent() {
  const { execute, cancel, isRunning, progress } =
    useCancellableOperation<string>();

  const handleOperation = async () => {
    try {
      const result = await execute(async (signal, updateProgress) => {
        // Your long-running operation
        for (let i = 0; i <= 100; i += 10) {
          if (signal.aborted) throw new Error("Cancelled");
          updateProgress(i);
          await doWork();
        }
        return "Success!";
      });
    } catch (error) {
      if (error instanceof OperationCancelledError) {
        console.log("User cancelled operation");
      }
    }
  };

  return (
    <>
      <Button onClick={handleOperation} disabled={isRunning}>
        Start Operation
      </Button>

      <CancellableOperation
        isRunning={isRunning}
        progress={progress}
        onCancel={cancel}
        title="Processing..."
      />
    </>
  );
}
```

#### Creating Cancellable Operations

```tsx
import { createCancellableOperation } from "@/lib/mobile/performance";

const operation = createCancellableOperation(async (signal) => {
  const response = await fetch("/api/data", { signal });
  return response.json();
});

// Cancel the operation
operation.cancel();

// Check if cancelled
if (operation.isCancelled()) {
  console.log("Operation was cancelled");
}
```

### 4. Image Compression (Requirement 7.3)

Image compression reduces file sizes and improves upload/download speeds:

- WebP format support (30-50% smaller than JPEG)
- Automatic format detection
- Quality control
- Dimension optimization

#### Usage

```tsx
import { ImageCompressor } from "@/components/mobile/image-compressor";

<ImageCompressor
  onCompress={(result) => {
    console.log("Compressed:", result.compressedSize);
    console.log("Ratio:", result.compressionRatio);
  }}
/>;
```

#### Programmatic Compression

```tsx
import { compressImage, getOptimalImageFormat } from '@/lib/mobile/performance';

const file = /* File from input */;

const result = await compressImage(file, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  outputFormat: getOptimalImageFormat(), // 'webp' or 'jpeg'
});

console.log('Original:', result.originalSize);
console.log('Compressed:', result.compressedSize);
console.log('Ratio:', result.compressionRatio);
console.log('Dimensions:', result.width, 'x', result.height);
```

#### WebP Support Detection

```tsx
import {
  isWebPSupported,
  getOptimalImageFormat,
} from "@/lib/mobile/performance";

if (isWebPSupported()) {
  console.log("Browser supports WebP");
}

const format = getOptimalImageFormat(); // 'webp' or 'jpeg'
```

### 5. Code Splitting

Code splitting reduces initial bundle size by loading mobile-specific code on demand:

- Dynamic imports for components
- Route-based splitting
- Preload utilities
- Performance tracking

#### Component Splitting

```tsx
import { MobileComponents } from '@/lib/mobile/code-splitting';

// Components are loaded on demand
<MobileComponents.QuickCapture />
<MobileComponents.ImageCompressor />
<MobileComponents.ProgressiveImage src="..." alt="..." />
```

#### Preloading Components

```tsx
import {
  preloadMobileComponent,
  preloadMobileComponents,
} from "@/lib/mobile/code-splitting";

// Preload single component
preloadMobileComponent("QuickCapture");

// Preload multiple components
preloadMobileComponents([
  "QuickCapture",
  "ImageCompressor",
  "VoiceNoteRecorder",
]);
```

#### Route Splitting

```tsx
import { preloadMobileRoute } from "@/lib/mobile/code-splitting";

// Preload a mobile route
await preloadMobileRoute("/mobile/capture");
```

#### Custom Dynamic Components

```tsx
import { createMobileDynamic } from "@/lib/mobile/code-splitting";

const MyComponent = createMobileDynamic(() => import("./my-component"), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});
```

## Performance Metrics

### Core Web Vitals

The system collects Core Web Vitals metrics:

```tsx
import { collectPerformanceMetrics } from "@/lib/mobile/performance";

const metrics = collectPerformanceMetrics();
console.log("First Contentful Paint:", metrics.fcp);
console.log("Time to First Byte:", metrics.ttfb);
```

### Component Load Tracking

```tsx
import { trackComponentLoad } from "@/lib/mobile/code-splitting";

const component = await trackComponentLoad(
  "QuickCapture",
  () => import("@/components/mobile/quick-capture")
);
```

## Best Practices

### 1. Image Optimization

- Always use `ProgressiveImage` for property photos
- Enable lazy loading for images below the fold
- Compress images before upload
- Use WebP format when supported

### 2. Navigation

- Wrap mobile routes in `NavigationPrefetchProvider`
- Prefetch likely next pages based on user flow
- Use high priority for critical paths

### 3. Long Operations

- Always provide cancellation for operations > 3 seconds
- Show progress indicators for operations > 1 second
- Use AbortController for network requests
- Handle cancellation gracefully

### 4. Code Splitting

- Use dynamic imports for mobile-specific features
- Preload components on user interaction
- Split routes by feature area
- Monitor bundle sizes

### 5. Performance Monitoring

- Track Core Web Vitals
- Monitor component load times
- Log performance metrics
- Set performance budgets

## Performance Targets

Based on Requirement 7.1:

- **First Contentful Paint**: < 1.5s on 4G
- **Time to Interactive**: < 3s on 4G
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### Feature Detection

All features include fallbacks:

- WebP → JPEG fallback
- Intersection Observer → Immediate loading
- AbortController → Manual cancellation
- requestIdleCallback → setTimeout fallback

## Testing

See test files for examples:

- `src/__tests__/performance-optimizations.test.ts`
- Property-based tests for each optimization

## Related Files

- `src/lib/mobile/performance.ts` - Core utilities
- `src/lib/mobile/code-splitting.ts` - Code splitting utilities
- `src/components/mobile/progressive-image.tsx` - Progressive image component
- `src/components/mobile/cancellable-operation.tsx` - Cancellable operation UI
- `src/components/mobile/image-compressor.tsx` - Image compression UI
- `src/components/mobile/navigation-prefetch-provider.tsx` - Prefetch provider
