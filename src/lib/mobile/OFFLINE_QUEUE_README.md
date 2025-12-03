# Offline Queue and Sync Service

Comprehensive offline support for mobile-specific operations with automatic sync when connectivity returns.

## Features

- ✅ **Persistent Queue**: Uses IndexedDB for reliable offline storage
- ✅ **Automatic Sync**: Syncs queued operations when connection is restored
- ✅ **Conflict Resolution**: Last-write-wins strategy with user notification
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Progress Tracking**: Real-time sync progress updates
- ✅ **Status Indicators**: Visual feedback for offline/sync status
- ✅ **Notifications**: Push notifications for sync completion

## Requirements Coverage

- **2.4**: Queue actions for execution when connectivity returns ✅
- **2.5**: Notify agent of successful completion ✅
- **6.1**: Detect offline state and display indicator ✅
- **6.2**: Store actions in offline queue ✅
- **6.3**: Automatically sync queued actions ✅
- **6.4**: Apply last-write-wins resolution with notification ✅

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Offline    │  │     Sync     │  │  Offline     │     │
│  │  Indicator   │  │    Status    │  │  Provider    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                      React Hooks                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │useOfflineQueue│  │useConnectivity│                       │
│  └──────────────┘  └──────────────┘                        │
├─────────────────────────────────────────────────────────────┤
│                    Core Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Offline    │  │ Connectivity │  │    Queue     │     │
│  │    Queue     │  │   Monitor    │  │   Helpers    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                      Storage Layer                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │              IndexedDB Manager                    │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### 1. Setup Provider

Wrap your app with the `OfflineProvider`:

```tsx
import { OfflineProvider } from "@/components/mobile/offline-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OfflineProvider enableAutoSync={true} enableNotifications={true}>
          {children}
        </OfflineProvider>
      </body>
    </html>
  );
}
```

### 2. Use Hooks

#### Monitor Connectivity

```tsx
import { useConnectivity } from "@/hooks/use-connectivity";

function MyComponent() {
  const { isOnline, isOffline, isSlow, status } = useConnectivity();

  return (
    <div>
      Status: {status}
      {isOffline && <p>You're offline</p>}
    </div>
  );
}
```

#### Access Queue

```tsx
import { useOfflineQueue } from "@/hooks/use-offline-queue";

function MyComponent() {
  const { queueSize, enqueue, syncAll } = useOfflineQueue();

  const handleSave = async () => {
    await enqueue("capture-text", {
      content: "Hello world",
      timestamp: Date.now(),
    });
  };

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <p>Queue size: {queueSize}</p>
    </div>
  );
}
```

### 3. Automatic Queuing

Use `executeOrQueue` for automatic online/offline handling:

```tsx
import { executeOrQueue, isQueuedResult } from "@/lib/mobile/queue-helpers";

async function saveData(data: any) {
  const result = await executeOrQueue("content-create", data, async () => {
    // This executes if online
    const response = await fetch("/api/content", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  });

  if (isQueuedResult(result)) {
    console.log("Queued for later sync:", result);
  } else {
    console.log("Saved successfully:", result);
  }
}
```

### 4. Display Status

#### Offline Indicator

```tsx
import { OfflineIndicator } from "@/components/mobile/offline-indicator";

function Header() {
  return (
    <header>
      <OfflineIndicator showQueueCount={true} />
    </header>
  );
}
```

#### Sync Status

```tsx
import { SyncStatus } from "@/components/mobile/sync-status";

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <SyncStatus />
    </div>
  );
}
```

## Operation Types

The queue supports the following operation types:

- `capture-photo`: Photo capture operations
- `capture-voice`: Voice recording operations
- `capture-text`: Text capture operations
- `quick-action`: Quick action executions
- `voice-note`: Voice note operations
- `property-share`: Property sharing operations
- `check-in`: Location check-in operations
- `content-create`: Content creation operations
- `content-update`: Content update operations
- `content-delete`: Content deletion operations

## Conflict Resolution

When sync conflicts occur (e.g., same content updated offline and online), the system uses a **last-write-wins** strategy:

1. Local version (most recent) is applied
2. Server version is overwritten
3. User is notified of the conflict resolution

```tsx
// Listen for conflict events
useEffect(() => {
  const handleConflict = (event: CustomEvent) => {
    const { localVersion, serverVersion, resolved } = event.detail;
    console.log("Conflict resolved:", resolved);
  };

  window.addEventListener("sync-conflict", handleConflict);
  return () => window.removeEventListener("sync-conflict", handleConflict);
}, []);
```

## Retry Logic

Failed operations are automatically retried:

- Default: 3 retry attempts
- Exponential backoff between retries
- Manual retry available for failed operations

```tsx
const { retryFailed } = useOfflineQueue();

// Retry all failed operations
await retryFailed();
```

## Notifications

The system sends notifications for:

- Connection status changes (online/offline)
- Sync start
- Sync completion (with success/failure counts)
- Conflict resolution

Notifications require permission:

```tsx
// Request permission (handled automatically by OfflineProvider)
if ("Notification" in window) {
  await Notification.requestPermission();
}
```

## Storage Management

### Clear Operations

```tsx
const { clearCompleted, clearAll } = useOfflineQueue();

// Clear completed operations
await clearCompleted();

// Clear all operations (use with caution)
await clearAll();
```

### Monitor Storage

```tsx
const { operations, syncProgress } = useOfflineQueue();

console.log("Total operations:", operations.length);
console.log("Sync progress:", syncProgress);
```

## Testing

### Simulate Offline

```tsx
// In browser console
window.dispatchEvent(new Event("offline"));

// Or use Chrome DevTools:
// 1. Open DevTools
// 2. Go to Network tab
// 3. Select "Offline" from throttling dropdown
```

### Test Sync

```tsx
const { syncAll } = useOfflineQueue();

// Manually trigger sync
await syncAll();
```

## Performance

- **IndexedDB**: Fast, persistent storage
- **Lazy Loading**: Queue initialized on demand
- **Efficient Sync**: Batched operations
- **Memory Management**: Automatic cleanup of completed operations

## Browser Support

- Chrome/Edge: Full support
- Safari: Full support (iOS 14+)
- Firefox: Full support
- Opera: Full support

## Limitations

- Maximum queue size: Limited by IndexedDB quota (~50MB typical)
- Retry limit: 3 attempts per operation
- Sync timeout: 30 seconds per operation
- Notification support: Requires user permission

## Troubleshooting

### Queue not syncing

1. Check connectivity: `connectivityMonitor.isOnline()`
2. Check queue size: `offlineQueue.getQueueSize()`
3. Check for errors in console
4. Try manual sync: `offlineQueue.syncAll()`

### Operations failing

1. Check operation payload format
2. Verify API endpoints are accessible
3. Check retry count: `operation.retryCount`
4. Review error message: `operation.error`

### Storage quota exceeded

1. Clear completed operations: `clearCompleted()`
2. Reduce payload sizes
3. Implement custom cleanup logic

## API Reference

See individual files for detailed API documentation:

- `offline-queue.ts`: Core queue service
- `connectivity-monitor.ts`: Connection monitoring
- `queue-helpers.ts`: Helper utilities
- `use-offline-queue.ts`: React hook
- `use-connectivity.ts`: React hook
