# Mobile Analytics - Quick Start Guide

Get started with mobile analytics in 5 minutes.

## Installation

No installation needed - the analytics system is already integrated into the mobile features.

## Basic Usage

### 1. Import the Analytics

```typescript
import { getMobileAnalytics } from "@/lib/mobile/analytics";
```

### 2. Track Feature Usage

```typescript
const analytics = getMobileAnalytics();

// Track a simple action
analytics.trackFeatureUsage("quick-capture", "photo-captured");

// Track with metadata
analytics.trackFeatureUsage("quick-capture", "photo-captured", {
  quality: "high",
  size: 1024000,
  location: "property-showing",
});
```

### 3. Track Errors

```typescript
try {
  await capturePhoto();
} catch (error) {
  analytics.trackError("quick-capture", error, {
    permission: "camera",
    step: "capture",
  });
}
```

## React Components

### Use the Hook

```typescript
import { useMobileAnalytics } from "@/lib/mobile/use-mobile-analytics";

function MyComponent() {
  const { trackAction, trackError, trackOperation } =
    useMobileAnalytics("quick-capture");

  const handleAction = async () => {
    const operation = trackOperation("photo-capture");

    try {
      await capturePhoto();
      operation.success({ quality: "high" });
    } catch (error) {
      operation.error(error);
    }
  };

  return <button onClick={handleAction}>Capture</button>;
}
```

## Specialized Tracking

### Quick Capture

```typescript
import { useQuickCaptureAnalytics } from "@/lib/mobile/use-mobile-analytics";

function CaptureComponent() {
  const { trackCaptureStart } = useQuickCaptureAnalytics();

  const handleCapture = async () => {
    const capture = trackCaptureStart("photo");
    try {
      await capturePhoto();
      capture.success();
    } catch (error) {
      capture.error(error);
    }
  };
}
```

### Quick Share

```typescript
import { useShareAnalytics } from "@/lib/mobile/use-mobile-analytics";

function ShareComponent() {
  const { trackShareStart } = useShareAnalytics();

  const handleShare = async (method: "qr" | "sms" | "email") => {
    const share = trackShareStart(method, propertyId);
    try {
      await shareProperty(method);
      share.success();
    } catch (error) {
      share.error(error);
    }
  };
}
```

### Voice Notes

```typescript
import { useVoiceNotesAnalytics } from "@/lib/mobile/use-mobile-analytics";

function VoiceComponent() {
  const { trackVoiceNoteStart } = useVoiceNotesAnalytics();

  const handleRecord = async () => {
    const recording = trackVoiceNoteStart();
    try {
      await recordAudio();
      recording.success(true, propertyId);
    } catch (error) {
      recording.error(error);
    }
  };
}
```

## Performance Tracking

### Automatic Page Tracking

```typescript
import { usePerformanceTracking } from "@/lib/mobile/use-mobile-analytics";

function MyPage() {
  // Automatically tracks page load performance
  usePerformanceTracking("my-page");

  return <div>...</div>;
}
```

### Custom Timing

```typescript
const analytics = getMobileAnalytics();
const startTime = Date.now();

await performOperation();

const duration = Date.now() - startTime;
analytics.trackCustomTiming("operation-name", duration, {
  itemCount: 10,
});
```

## What Gets Tracked Automatically

✅ **Core Web Vitals** - FCP, LCP, FID, CLS, TTFB, INP  
✅ **Offline Queue Size** - Checked every minute  
✅ **Device Information** - Screen size, connection type, PWA mode  
✅ **Performance Ratings** - Automatic good/needs-improvement/poor ratings

## Viewing Metrics

### CloudWatch Logs

All metrics are automatically sent to CloudWatch Logs in production.

### CloudWatch Insights Query

```sql
-- Feature usage
fields @timestamp, context.feature, context.action
| filter message like /Mobile feature used/
| stats count() by context.feature

-- Errors
fields @timestamp, context.feature, error.message
| filter level = "ERROR"
| stats count() by context.feature
```

## Best Practices

### ✅ DO

- Track operations with start/success/error pattern
- Include relevant metadata
- Use specialized hooks for specific features
- Track both success and failure cases

### ❌ DON'T

- Track every render or minor state change
- Include sensitive user data
- Block the UI waiting for analytics
- Track the same event multiple times

## Common Patterns

### Pattern 1: Timed Operation

```typescript
const operation = trackOperation("operation-name");
try {
  await doSomething();
  operation.success({ result: "data" });
} catch (error) {
  operation.error(error);
}
```

### Pattern 2: Feature Mount/Unmount

```typescript
// Automatically tracked when using the hook
const { trackAction } = useMobileAnalytics("feature-name");
// Tracks mount on component mount, unmount on unmount
```

### Pattern 3: Engagement Tracking

```typescript
analytics.trackShareEngagement("qr", true, propertyId, {
  scans: 5,
  clicks: 3,
});
```

## Troubleshooting

### Metrics not appearing?

1. Check you're in production mode
2. Wait 30 seconds for auto-flush
3. Manually flush: `getMobileAnalytics().flush()`

### Performance Observer not working?

1. Check browser compatibility
2. Verify HTTPS connection
3. Check console for errors

## Next Steps

- Read the [full documentation](./ANALYTICS_README.md)
- See [integration examples](./analytics-integration-examples.ts)
- Check [implementation summary](./TASK_20_IMPLEMENTATION_SUMMARY.md)

## Support

For questions or issues, check the comprehensive documentation in `ANALYTICS_README.md`.
