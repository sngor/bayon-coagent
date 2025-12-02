# Offline Support for Open House Enhancement

This module provides comprehensive offline support for the open house feature, enabling agents to manage sessions and check in visitors even without internet connectivity.

## Features

- **Operation Queuing**: Automatically queue operations when offline
- **Connectivity Monitoring**: Real-time network status tracking
- **Automatic Sync**: Sync queued operations when connectivity is restored
- **Conflict Resolution**: Last-write-wins strategy for sync conflicts
- **React Hooks**: Easy integration with React components

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│                  (use offline hooks)                         │
├─────────────────────────────────────────────────────────────┤
│                   Offline Support Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Connectivity │  │ Sync Service │  │   Storage    │     │
│  │  Monitor     │  │              │  │  (IndexedDB) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    Server Actions                            │
│         (checkInVisitor, updateVisitor, etc.)               │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Setup

Initialize the offline support in your app:

```typescript
import {
  initializeOpenHouseStorage,
  initializeSyncService,
} from "@/lib/offline";

// In your app initialization (e.g., layout.tsx or _app.tsx)
useEffect(() => {
  initializeOpenHouseStorage();
  initializeSyncService();
}, []);
```

### Using the Offline Sync Hook

```typescript
import { useOfflineSync } from "@/lib/offline";

function OpenHouseSession() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    lastSyncTimestamp,
    sync,
    retryFailed,
  } = useOfflineSync();

  return (
    <div>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-banner">
          You are offline. Changes will sync when connection is restored.
          {pendingCount > 0 && ` (${pendingCount} pending operations)`}
        </div>
      )}

      {/* Sync status */}
      {isSyncing && <div>Syncing...</div>}

      {/* Failed operations */}
      {failedCount > 0 && (
        <button onClick={retryFailed}>
          Retry {failedCount} failed operations
        </button>
      )}

      {/* Manual sync button */}
      <button onClick={sync} disabled={!isOnline || isSyncing}>
        Sync Now
      </button>
    </div>
  );
}
```

### Queuing Operations

When performing operations, check connectivity and queue if offline:

```typescript
import { connectivityMonitor, queueOfflineOperation } from "@/lib/offline";
import { checkInVisitor } from "@/app/actions";

async function handleCheckIn(
  sessionId: string,
  visitorData: any,
  userId: string
) {
  if (connectivityMonitor.isOffline()) {
    // Queue for later sync
    const { operationId } = await queueOfflineOperation(
      "checkIn",
      "visitor",
      sessionId,
      visitorData,
      userId
    );

    return {
      success: true,
      offline: true,
      message: "Check-in queued for sync when online",
      operationId,
    };
  }

  // Execute immediately if online
  return await checkInVisitor(sessionId, visitorData);
}
```

### Connectivity Monitoring

```typescript
import { useConnectivity } from "@/lib/offline";

function ConnectivityIndicator() {
  const { status, isOnline, isOffline } = useConnectivity();

  return (
    <div className={`status-indicator ${status}`}>
      {isOnline && "🟢 Online"}
      {isOffline && "🔴 Offline"}
    </div>
  );
}
```

### Queue Status

```typescript
import { useQueueStatus } from "@/lib/offline";

function QueueStatusDisplay() {
  const { pending, failed, completed, total, refresh } = useQueueStatus();

  return (
    <div>
      <h3>Sync Queue Status</h3>
      <ul>
        <li>Pending: {pending}</li>
        <li>Failed: {failed}</li>
        <li>Completed: {completed}</li>
        <li>Total: {total}</li>
      </ul>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## Operation Types

The following operation types are supported:

- `checkIn`: Check in a visitor to a session
- `updateVisitor`: Update visitor information
- `deleteVisitor`: Delete a visitor from a session
- `updateSession`: Update session details
- `photoUpload`: Upload a photo to a session
- `addNote`: Add a note to a visitor record

## Storage Schema

### OpenHouseOperation

```typescript
interface OpenHouseOperation {
  id: string; // Unique operation ID
  type: OperationType; // Type of operation
  entity: "session" | "visitor" | "photo";
  sessionId: string; // Associated session
  visitorId?: string; // Associated visitor (if applicable)
  data: any; // Operation data
  timestamp: number; // When operation was created
  status: "pending" | "syncing" | "failed" | "completed";
  retryCount: number; // Number of retry attempts
  error?: string; // Error message (if failed)
  userId: string; // User who created the operation
}
```

## Sync Behavior

### Automatic Sync

- Sync automatically triggers when connectivity is restored
- Operations are processed in chronological order
- Failed operations are retried up to 3 times
- Completed operations are cleaned up after 24 hours

### Manual Sync

```typescript
const { sync } = useOfflineSync();

// Trigger manual sync
await sync();
```

### Session-Specific Sync

```typescript
const { syncSession } = useOfflineSync();

// Sync only operations for a specific session
await syncSession("session-123");
```

### Retry Failed Operations

```typescript
const { retryFailed } = useOfflineSync();

// Retry all failed operations
await retryFailed();
```

## Conflict Resolution

The offline support uses a **last-write-wins** strategy for conflict resolution:

1. Operations are processed in chronological order based on timestamp
2. If two operations conflict, the one with the later timestamp wins
3. Conflicts are logged for review but don't block sync

## Error Handling

### Network Errors

- Operations that fail due to network errors are automatically retried
- After 3 failed attempts, operations are marked as failed
- Failed operations can be manually retried

### Validation Errors

- Operations that fail validation are marked as failed immediately
- These require manual intervention to fix the data

### Storage Errors

- IndexedDB errors are logged and reported
- Graceful degradation if IndexedDB is not supported

## Performance Considerations

### Batch Processing

- Operations are synced in batches of 10 to avoid overwhelming the server
- Small delay (100ms) between operations

### Cleanup

- Completed operations are automatically cleaned up after 24 hours
- Failed operations are retained until manually resolved

### Storage Limits

- IndexedDB typically provides 50MB+ of storage
- Monitor storage usage with `getOpenHouseStorageStats()`

## Testing

### Manual Testing

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Perform operations (check-in, update, etc.)
4. Verify operations are queued
5. Set throttling back to "Online"
6. Verify operations sync automatically

### Programmatic Testing

```typescript
import {
  openHouseStore,
  connectivityMonitor,
  openHouseSyncService,
} from "@/lib/offline";

// Queue a test operation
await openHouseStore.queueOperation(
  "checkIn",
  "visitor",
  "test-session",
  { name: "Test Visitor" },
  "test-user"
);

// Check queue status
const status = await openHouseStore.getQueueStatus();
console.log("Pending operations:", status.pending);

// Manually trigger sync
await openHouseSyncService.syncPendingOperations();
```

## Browser Compatibility

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

IndexedDB is widely supported in modern browsers. For unsupported browsers, operations will execute immediately without queuing.

## Security Considerations

- No sensitive data (passwords, tokens) is stored in IndexedDB
- Operations are associated with user IDs for multi-user support
- Data is automatically cleaned up to prevent accumulation
- All operations require authentication when synced to server

## Troubleshooting

### Operations Not Syncing

1. Check connectivity: `connectivityMonitor.isOnline()`
2. Check queue status: `openHouseStore.getQueueStatus()`
3. Check for errors in failed operations
4. Try manual sync: `openHouseSyncService.syncPendingOperations()`

### Storage Quota Exceeded

1. Clean up old operations: `openHouseStore.cleanupCompletedOperations()`
2. Check storage stats: `getOpenHouseStorageStats()`
3. Consider reducing retention period

### Sync Conflicts

1. Review failed operations: `openHouseStore.getFailedOperations()`
2. Check error messages for details
3. Manually resolve conflicts if needed

## API Reference

See individual module files for detailed API documentation:

- `storage.ts` - IndexedDB storage operations
- `connectivity.ts` - Connectivity monitoring
- `sync-service.ts` - Sync service
- `use-offline-sync.ts` - React hooks
