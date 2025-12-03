# Mobile Error Handling Integration Guide

This guide explains how to use the mobile error handling system in your components.

## Overview

The mobile error handling system provides:

- **Permission request flows** with clear explanations
- **Fallback options** for unavailable hardware
- **Retry logic** for network and AI service errors
- **User-friendly error messages** with actionable steps
- **Offline status indicators** and queue count display

## Components

### 1. Error Feedback Manager

Add to your root layout to handle all mobile errors globally:

```tsx
import { ErrorFeedbackManager } from "@/components/mobile/error-feedback";

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html>
      <body>
        {children}
        <ErrorFeedbackManager />
      </body>
    </html>
  );
}
```

### 2. Offline Status Indicator

Show connection status and queue count:

```tsx
import { OfflineStatus } from "@/components/mobile/offline-status";

export function MobileLayout() {
  return (
    <div>
      <OfflineStatus showQueueCount={true} />
      {/* Your content */}
    </div>
  );
}
```

### 3. Queue Status Display

Show detailed sync queue information:

```tsx
import { QueueStatus } from "@/components/mobile/offline-status";

export function SettingsPage() {
  return (
    <div>
      <h2>Offline Queue</h2>
      <QueueStatus />
    </div>
  );
}
```

### 4. Permission Dialog

Add to your root layout to handle permission requests:

```tsx
import { PermissionDialog } from "@/components/mobile/permission-dialog";

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html>
      <body>
        {children}
        <PermissionDialog />
      </body>
    </html>
  );
}
```

## Hooks

### useMobileError

Handle mobile-specific errors in your components:

```tsx
import { useMobileError } from "@/hooks/use-mobile-error";
import { MobileErrorType } from "@/lib/mobile/error-handler";

function MyComponent() {
  const { handleError, retryOperation, currentError, fallbackOptions } =
    useMobileError();

  const capturePhoto = async () => {
    try {
      const photo = await deviceAPI.capturePhoto();
      // Process photo...
    } catch (error) {
      handleError({
        type: MobileErrorType.CAMERA_FAILED,
        operation: "capture_photo",
        originalError: error as Error,
        showToast: true,
      });
    }
  };

  const uploadWithRetry = async () => {
    const result = await retryOperation(
      async () => {
        // Your upload logic
        return await uploadFile(file);
      },
      "upload_photo",
      3 // max retries
    );

    if (result.success) {
      console.log("Upload successful:", result.data);
    } else {
      console.error("Upload failed:", result.error);
    }
  };

  return (
    <div>
      <button onClick={capturePhoto}>Capture Photo</button>
      {fallbackOptions.length > 0 && (
        <div>
          <h3>Alternative Options:</h3>
          {fallbackOptions.map((option, index) => (
            <button key={index} onClick={option.action}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### useMobilePermission

Request and check permissions:

```tsx
import { useMobilePermission } from "@/hooks/use-mobile-error";

function CameraComponent() {
  const { permissions, requestPermission, hasPermission } =
    useMobilePermission();

  const handleCameraAccess = async () => {
    if (!hasPermission("camera")) {
      const result = await requestPermission({
        permissionType: "camera",
        explanation: "We need camera access to capture property photos",
        required: true,
      });

      if (!result.granted) {
        console.log("Camera permission denied");
        return;
      }
    }

    // Proceed with camera access
    const photo = await deviceAPI.capturePhoto();
  };

  return (
    <div>
      <p>Camera: {permissions.camera}</p>
      <button onClick={handleCameraAccess}>Use Camera</button>
    </div>
  );
}
```

### useNetworkStatus

Monitor network connectivity:

```tsx
import { useNetworkStatus } from "@/hooks/use-mobile-error";

function MyComponent() {
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      // Trigger sync
      offlineQueue.syncAll();
    }
  }, [isOnline]);

  return (
    <div>
      {!isOnline && <p>You're offline. Changes will sync when online.</p>}
      {isSlowConnection && (
        <p>Slow connection detected. Some features may be limited.</p>
      )}
    </div>
  );
}
```

## Error Types

Available mobile error types:

```typescript
enum MobileErrorType {
  PERMISSION_DENIED = "permission_denied",
  HARDWARE_UNAVAILABLE = "hardware_unavailable",
  CAMERA_FAILED = "camera_failed",
  MICROPHONE_FAILED = "microphone_failed",
  LOCATION_FAILED = "location_failed",
  STORAGE_QUOTA_EXCEEDED = "storage_quota_exceeded",
  NETWORK_OFFLINE = "network_offline",
  SYNC_FAILED = "sync_failed",
  AI_ANALYSIS_FAILED = "ai_analysis_failed",
  TRANSCRIPTION_FAILED = "transcription_failed",
  UPLOAD_FAILED = "upload_failed",
}
```

## Fallback Options

The system automatically provides fallback options based on error type:

### Camera Failures

- Upload from Gallery
- Enter Details Manually

### Microphone Failures

- Type Your Message

### Location Failures

- Enter Address Manually
- Continue Without Location

### Network Failures

- Save for Later (queues for sync)
- View Queued Items

## Best Practices

### 1. Always Handle Permissions

```tsx
// ✅ Good
const result = await requestPermission({
  permissionType: "camera",
  explanation: "We need camera access to capture property photos",
  required: true,
});

if (!result.granted) {
  // Handle denial
  return;
}

// ❌ Bad
await deviceAPI.capturePhoto(); // May fail without permission check
```

### 2. Provide Fallback Options

```tsx
// ✅ Good
try {
  const location = await deviceAPI.getCurrentLocation();
} catch (error) {
  handleError({
    type: MobileErrorType.LOCATION_FAILED,
    operation: "get_location",
    originalError: error as Error,
    fallbackAvailable: true, // Shows fallback options
  });
}

// ❌ Bad
try {
  const location = await deviceAPI.getCurrentLocation();
} catch (error) {
  console.error("Location failed"); // No user feedback
}
```

### 3. Use Retry Logic for Network Operations

```tsx
// ✅ Good
const result = await retryOperation(() => uploadFile(file), "upload_file", 3);

// ❌ Bad
try {
  await uploadFile(file);
} catch (error) {
  // No retry
}
```

### 4. Queue Operations When Offline

```tsx
// ✅ Good
if (!navigator.onLine) {
  await offlineQueue.enqueue("content-create", payload);
  toast({ title: "Saved for later", description: "Will sync when online" });
  return;
}

// ❌ Bad
await createContent(payload); // Will fail when offline
```

### 5. Show Clear Error Messages

```tsx
// ✅ Good
handleError({
  type: MobileErrorType.CAMERA_FAILED,
  operation: "capture_photo",
  originalError: error as Error,
  showToast: true, // Shows user-friendly message
});

// ❌ Bad
alert(error.message); // Technical error message
```

## Testing

### Test Permission Flows

```tsx
// Test permission denial
const result = await requestPermission({
  permissionType: "camera",
  explanation: "Test explanation",
  required: false,
});

expect(result.granted).toBe(false);
```

### Test Error Handling

```tsx
// Test error handling
const { handleError } = useMobileError();

const error = handleError({
  type: MobileErrorType.CAMERA_FAILED,
  operation: "test_operation",
  showToast: false,
});

expect(error.code).toBe("MOBILE_CAMERA_FAILED");
expect(error.userMessage).toBeTruthy();
```

### Test Offline Queue

```tsx
// Test offline queuing
await offlineQueue.enqueue("test-operation", { data: "test" });

const size = await offlineQueue.getQueueSize();
expect(size).toBe(1);

await offlineQueue.syncAll();

const newSize = await offlineQueue.getQueueSize();
expect(newSize).toBe(0);
```

## Troubleshooting

### Permission Dialog Not Showing

Make sure `PermissionDialog` is added to your root layout:

```tsx
<PermissionDialog />
```

### Errors Not Displaying

Make sure `ErrorFeedbackManager` is added to your root layout:

```tsx
<ErrorFeedbackManager />
```

### Offline Queue Not Syncing

Check that you're listening for online events:

```tsx
useEffect(() => {
  const handleOnline = () => {
    offlineQueue.syncAll();
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}, []);
```

### Fallback Options Not Showing

Make sure to set `fallbackAvailable: true` when handling errors:

```tsx
handleError({
  type: MobileErrorType.CAMERA_FAILED,
  operation: "capture_photo",
  originalError: error as Error,
  fallbackAvailable: true, // Important!
});
```
