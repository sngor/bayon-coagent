# Mobile Analytics and Monitoring

Comprehensive analytics and monitoring system for mobile-specific features in the Bayon Coagent platform.

## Features

- ✅ Feature usage tracking
- ✅ Mobile-specific error tracking
- ✅ Core Web Vitals monitoring (FCP, LCP, FID, CLS, TTFB, INP)
- ✅ Offline queue size monitoring
- ✅ Share and content engagement metrics
- ✅ Device information collection
- ✅ Automatic metric buffering and batching
- ✅ React hooks for easy integration

## Quick Start

### Basic Usage

```typescript
import { getMobileAnalytics } from "@/lib/mobile/analytics";

const analytics = getMobileAnalytics();

// Track feature usage
analytics.trackFeatureUsage("quick-capture", "photo-captured", {
  quality: "high",
  size: 1024000,
});

// Track errors
try {
  await capturePhoto();
} catch (error) {
  analytics.trackError("quick-capture", error, {
    permission: "camera",
  });
}

// Track engagement
analytics.trackShareEngagement("qr", true, "property-123");
```

### React Hooks

```typescript
import { useMobileAnalytics } from "@/lib/mobile/use-mobile-analytics";

function QuickCaptureComponent() {
  const { trackAction, trackError, trackOperation } =
    useMobileAnalytics("quick-capture");

  const handleCapture = async () => {
    const operation = trackOperation("photo-capture");

    try {
      const photo = await capturePhoto();
      operation.success({ size: photo.size });
    } catch (error) {
      operation.error(error);
    }
  };

  return <button onClick={handleCapture}>Capture</button>;
}
```

### Specialized Hooks

```typescript
import {
  useQuickCaptureAnalytics,
  useQuickActionsAnalytics,
  useShareAnalytics,
  useVoiceNotesAnalytics,
  useLocationAnalytics,
} from "@/lib/mobile/use-mobile-analytics";

// Quick Capture
function CaptureComponent() {
  const { trackCaptureStart } = useQuickCaptureAnalytics();

  const handleCapture = async () => {
    const capture = trackCaptureStart("photo");
    try {
      await capturePhoto();
      capture.success({ quality: "high" });
    } catch (error) {
      capture.error(error);
    }
  };
}

// Quick Actions
function ActionsComponent() {
  const { trackActionStart } = useQuickActionsAnalytics();

  const handleAction = async (actionType: string) => {
    const action = trackActionStart(actionType);
    try {
      await executeAction(actionType);
      action.success();
    } catch (error) {
      action.error(error);
    }
  };
}

// Share
function ShareComponent() {
  const { trackShareStart } = useShareAnalytics();

  const handleShare = async (method: ShareMethod) => {
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

## Tracked Metrics

### Feature Usage

Tracks when and how mobile features are used:

```typescript
analytics.trackFeatureUsage("quick-capture", "photo-captured", {
  captureType: "photo",
  quality: "high",
  size: 1024000,
});
```

**Features tracked:**

- `quick-capture` - Photo, voice, and text capture
- `quick-actions` - Quick action executions
- `quick-share` - Property sharing
- `voice-notes` - Voice note creation
- `location-services` - Location-based features
- `offline-queue` - Offline operation queuing
- `mobile-content` - Mobile content creation
- `lead-response` - Lead notification responses
- `market-data` - Mobile market data views

### Error Tracking

Tracks mobile-specific errors with device context:

```typescript
analytics.trackError('quick-capture', error, {
  permission: 'camera',
  deviceInfo: {...},
});
```

**Error types tracked:**

- Permission errors (camera, microphone, location)
- Offline errors
- AI service errors
- Network errors
- Storage errors

### Performance Metrics

Automatically tracks Core Web Vitals:

- **FCP** (First Contentful Paint) - Target: <1.8s
- **LCP** (Largest Contentful Paint) - Target: <2.5s
- **FID** (First Input Delay) - Target: <100ms
- **CLS** (Cumulative Layout Shift) - Target: <0.1
- **TTFB** (Time to First Byte) - Target: <800ms
- **INP** (Interaction to Next Paint) - Target: <200ms

Each metric is automatically rated as:

- ✅ **good** - Meets target
- ⚠️ **needs-improvement** - Below target but acceptable
- ❌ **poor** - Significantly below target

### Offline Queue Monitoring

Automatically monitors offline queue size every minute:

```typescript
// Automatic monitoring
analytics.checkOfflineQueueSize();

// Manual tracking
analytics.trackOfflineQueueSize(25, 120000); // 25 items, oldest is 2 minutes old
```

**Alerts when:**

- Queue size exceeds 100 items
- Items are older than 5 minutes

### Engagement Metrics

Tracks user engagement with mobile features:

```typescript
// Share engagement
analytics.trackShareEngagement("qr", true, "property-123", {
  scans: 5,
  clicks: 3,
});

// Content creation
analytics.trackContentCreation("photo", true, 5000, {
  generatedWords: 250,
});

// Capture engagement
analytics.trackCaptureEngagement("voice", true, 30000);

// Action engagement
analytics.trackActionEngagement("create-content", true, 2000);
```

## Performance Tracking

### Automatic Page Performance

```typescript
import { usePerformanceTracking } from "@/lib/mobile/use-mobile-analytics";

function MyPage() {
  usePerformanceTracking("quick-capture-page");

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
  operationType: "photo-analysis",
  itemCount: 5,
});
```

### Component Render Tracking

```typescript
import { useRenderTracking } from "@/lib/mobile/use-mobile-analytics";

function ExpensiveComponent() {
  useRenderTracking("ExpensiveComponent");

  // Automatically alerts if component re-renders more than 10 times
  return <div>...</div>;
}
```

## Device Information

Automatically collected with each metric:

```typescript
{
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  connectionType?: string; // '4g', '3g', etc.
  isOnline: boolean;
  isMobile: boolean;
  isStandalone: boolean; // PWA mode
}
```

## Buffering and Batching

Metrics are automatically buffered and sent in batches to reduce network overhead:

- **Buffer size:** 50 metrics
- **Flush interval:** 30 seconds
- **Auto-flush:** When buffer is full

```typescript
// Manual flush
const analytics = getMobileAnalytics();
analytics.flush();

// Stop and flush on cleanup
analytics.stop();
```

## Integration Examples

### Quick Capture Integration

```typescript
import { useMobileAnalytics } from "@/lib/mobile/use-mobile-analytics";

function QuickCapture() {
  const { trackAction, trackError, trackOperation } =
    useMobileAnalytics("quick-capture");

  const handlePhotoCapture = async () => {
    const operation = trackOperation("photo-capture");

    try {
      const photo = await deviceAPI.capturePhoto();
      const analysis = await analyzePhoto(photo);

      operation.success({
        photoSize: photo.size,
        analysisTime: analysis.duration,
        featuresDetected: analysis.features.length,
      });
    } catch (error) {
      operation.error(error, {
        step: "photo-capture",
      });
    }
  };

  return <button onClick={handlePhotoCapture}>Capture Photo</button>;
}
```

### Quick Share Integration

```typescript
import { useShareAnalytics } from "@/lib/mobile/use-mobile-analytics";

function QuickShare({ propertyId }: { propertyId: string }) {
  const { trackShareStart } = useShareAnalytics();

  const handleShare = async (method: ShareMethod) => {
    const share = trackShareStart(method, propertyId);

    try {
      const result = await shareProperty({ propertyId, method });

      share.success({
        shareId: result.shareId,
        trackingUrl: result.trackingUrl,
      });
    } catch (error) {
      share.error(error);
    }
  };

  return (
    <div>
      <button onClick={() => handleShare("qr")}>QR Code</button>
      <button onClick={() => handleShare("sms")}>SMS</button>
      <button onClick={() => handleShare("email")}>Email</button>
    </div>
  );
}
```

### Offline Queue Integration

```typescript
import { getMobileAnalytics } from "@/lib/mobile/analytics";

// In your offline queue service
class OfflineQueue {
  async add(operation: Operation) {
    await this.store.add(operation);

    // Track queue size after adding
    const queueSize = await this.store.count();
    getMobileAnalytics().trackOfflineQueueSize(queueSize);
  }

  async sync() {
    const analytics = getMobileAnalytics();
    const operation = analytics.trackOperation("offline-sync");

    try {
      const items = await this.store.getAll();
      await this.syncItems(items);

      operation.success({
        itemsSynced: items.length,
      });

      // Track queue size after sync
      analytics.trackOfflineQueueSize(0);
    } catch (error) {
      operation.error(error);
    }
  }
}
```

### Error Boundary Integration

```typescript
import { Component, ReactNode } from "react";
import { trackMobileError } from "@/lib/mobile/analytics";

class MobileErrorBoundary extends Component<
  { feature: MobileFeature; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    trackMobileError(this.props.feature, error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

## CloudWatch Integration

All metrics are automatically logged to CloudWatch Logs with structured JSON format:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Mobile feature used: quick-capture - photo-captured",
  "context": {
    "feature": "quick-capture",
    "action": "photo-captured",
    "captureType": "photo",
    "quality": "high",
    "size": 1024000,
    "correlationId": "1234567890-abc123",
    "traceId": "1-5f8a1234-abcd1234efgh5678",
    "userId": "user-123"
  },
  "environment": "production"
}
```

## Querying Metrics

### CloudWatch Insights Queries

```sql
-- Feature usage by type
fields @timestamp, context.feature, context.action
| filter message like /Mobile feature used/
| stats count() by context.feature, context.action
| sort count desc

-- Error rate by feature
fields @timestamp, context.feature, error.message
| filter level = "ERROR" and context.feature like /quick-/
| stats count() by context.feature, error.name
| sort count desc

-- Performance metrics
fields @timestamp, context.metric, context.value, context.rating
| filter message like /Performance metric/
| stats avg(context.value) as avg_value by context.metric, context.rating

-- Offline queue size over time
fields @timestamp, context.queueSize
| filter message like /Offline queue size/
| sort @timestamp desc

-- Engagement metrics
fields @timestamp, context.type, context.method, context.success
| filter message like /engagement/
| stats count() by context.type, context.success
```

## Best Practices

1. **Track operations, not just events**

   ```typescript
   // Good
   const operation = trackOperation("photo-capture");
   try {
     await capture();
     operation.success();
   } catch (error) {
     operation.error(error);
   }

   // Avoid
   trackAction("photo-capture-start");
   await capture();
   trackAction("photo-capture-end");
   ```

2. **Include relevant context**

   ```typescript
   // Good
   trackAction("share", {
     method: "qr",
     propertyId: "prop-123",
     propertyType: "residential",
   });

   // Avoid
   trackAction("share");
   ```

3. **Use specialized hooks**

   ```typescript
   // Good
   const { trackCaptureStart } = useQuickCaptureAnalytics();

   // Avoid
   const { trackAction } = useMobileAnalytics("quick-capture");
   ```

4. **Track both success and failure**

   ```typescript
   // Always track the outcome
   try {
     await operation();
     trackSuccess();
   } catch (error) {
     trackError(error);
   }
   ```

5. **Don't over-track**

   ```typescript
   // Good - track meaningful actions
   trackAction("photo-captured");

   // Avoid - don't track every render or minor state change
   trackAction("button-hovered");
   ```

## Testing

```typescript
import {
  resetMobileAnalytics,
  getMobileAnalytics,
} from "@/lib/mobile/analytics";

describe("Mobile Analytics", () => {
  beforeEach(() => {
    resetMobileAnalytics();
  });

  it("tracks feature usage", () => {
    const analytics = getMobileAnalytics();
    analytics.trackFeatureUsage("quick-capture", "photo-captured");

    // Verify tracking
  });
});
```

## Troubleshooting

### Metrics not appearing in CloudWatch

1. Check that the application is running in production mode
2. Verify CloudWatch Logs permissions
3. Check the flush interval (default 30s)
4. Manually flush: `getMobileAnalytics().flush()`

### Performance Observer not working

1. Check browser compatibility (modern browsers only)
2. Verify HTTPS (required for some APIs)
3. Check console for errors

### Offline queue monitoring not working

1. Verify IndexedDB is available
2. Check database name matches: `bayon-offline`
3. Verify object store name: `offline-queue`

## Future Enhancements

- [ ] Server-side analytics endpoint for batch uploads
- [ ] Real-time dashboard for monitoring
- [ ] Anomaly detection and alerting
- [ ] A/B testing integration
- [ ] User session replay
- [ ] Heatmap generation
- [ ] Funnel analysis
