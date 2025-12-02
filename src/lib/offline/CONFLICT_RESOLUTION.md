# Conflict Resolution System

## Overview

The conflict resolution system handles data conflicts that occur when offline operations are synced with the server. It implements a **last-write-wins** strategy and provides comprehensive logging for agent review.

## How It Works

### Conflict Detection

When syncing offline operations, the system:

1. **Fetches Current Server Data**: Before applying an update operation, fetch the current state from the server
2. **Compares Timestamps**: Compare the server's `updatedAt` timestamp with the operation's timestamp
3. **Detects Conflicts**: If `serverTimestamp > operationTimestamp`, a conflict exists

### Last-Write-Wins Resolution

When a conflict is detected:

1. **Local Data Wins**: The offline operation (most recent write) is applied
2. **Server Data Overwritten**: The server's version is replaced
3. **Conflict Logged**: Both versions are saved for review
4. **Operation Marked**: The operation is flagged as conflict-resolved

### Why Last-Write-Wins?

- **Simple and Predictable**: Easy to understand and implement
- **Preserves User Intent**: The agent's most recent action is respected
- **No User Intervention**: Sync happens automatically without blocking
- **Transparent**: All conflicts are logged for review

## Conflict Log Structure

Each conflict log contains:

```typescript
{
    id: string;                    // Unique conflict ID
    operationId: string;           // Related operation ID
    sessionId: string;             // Session being modified
    visitorId?: string;            // Visitor being modified (if applicable)
    type: string;                  // Operation type (updateVisitor, updateSession)
    localData: any;                // Data from offline operation (APPLIED)
    serverData: any;               // Data from server (OVERWRITTEN)
    resolution: 'last-write-wins'; // Resolution strategy used
    resolvedData: any;             // Final data applied (same as localData)
    timestamp: number;             // When conflict occurred
    userId: string;                // User who made the change
}
```

## Usage

### Display Sync Status

```typescript
import { SyncStatusDisplay } from "@/components/open-house/sync-status-display";

export default function SessionPage() {
  return (
    <div>
      <SyncStatusDisplay />
    </div>
  );
}
```

### View Conflict Logs

```typescript
import { ConflictLogViewer } from "@/components/open-house/conflict-log-viewer";

export default function SyncSettingsPage() {
  return (
    <div>
      <ConflictLogViewer />
    </div>
  );
}
```

### Programmatic Access

```typescript
import { useOfflineSync } from "@/lib/offline/use-offline-sync";

function MyComponent() {
  const { conflictCount, getConflicts } = useOfflineSync();

  const handleViewConflicts = async () => {
    const conflicts = await getConflicts();

    conflicts.forEach((conflict) => {
      console.log("Conflict detected:");
      console.log("Local data:", conflict.localData);
      console.log("Server data:", conflict.serverData);
      console.log("Resolution:", conflict.resolution);
    });
  };

  return (
    <div>
      <p>Conflicts: {conflictCount}</p>
      <button onClick={handleViewConflicts}>View Details</button>
    </div>
  );
}
```

## Conflict Scenarios

### Scenario 1: Visitor Interest Level Update

**Timeline:**

1. Agent A goes offline
2. Agent A updates visitor's interest level to "high"
3. Meanwhile, Agent B (online) updates same visitor's notes
4. Agent A comes back online
5. Sync detects conflict (server data is newer)
6. Last-write-wins: Agent A's interest level update is applied
7. Agent B's notes are overwritten

**Result:**

- Local data (interest level: high) wins
- Server data (notes update) is lost
- Conflict logged for review

### Scenario 2: Session Notes Update

**Timeline:**

1. Session notes updated offline: "Great turnout!"
2. Session notes updated online: "Need follow-up"
3. Offline device syncs
4. Conflict detected
5. Offline notes applied: "Great turnout!"

**Result:**

- Offline update wins
- Online update overwritten
- Both versions logged

### Scenario 3: Multiple Conflicts

**Timeline:**

1. Multiple visitors updated offline
2. Same visitors updated online
3. Sync processes all operations
4. Multiple conflicts detected
5. All resolved with last-write-wins
6. All conflicts logged

**Result:**

- All offline updates applied
- All online updates overwritten
- Complete audit trail maintained

## Conflict Prevention

### Best Practices

1. **Sync Frequently**: Encourage agents to sync when online
2. **Single Device**: Use one device per session when possible
3. **Clear Communication**: Coordinate with team members
4. **Review Conflicts**: Check conflict log regularly

### When Conflicts Don't Occur

- **Create Operations**: New entities never conflict
- **Delete Operations**: Deletions don't check for conflicts
- **No Server Data**: If entity doesn't exist on server
- **Same Timestamp**: If timestamps match exactly

## Conflict Log Management

### Automatic Cleanup

Conflicts are automatically cleaned up after **7 days** (168 hours) to prevent storage bloat.

### Manual Cleanup

```typescript
import { conflictLogStore } from "@/lib/offline/storage";

// Clean up conflicts older than 24 hours
await conflictLogStore.cleanupOldConflicts(24);

// Clear all conflicts
await conflictLogStore.clearAll();
```

### Query Conflicts

```typescript
import { conflictLogStore } from "@/lib/offline/storage";

// Get all conflicts
const allConflicts = await conflictLogStore.getAllConflicts();

// Get conflicts for a session
const sessionConflicts = await conflictLogStore.getConflictsBySession(
  sessionId
);

// Get conflicts for an operation
const opConflicts = await conflictLogStore.getConflictsByOperation(operationId);

// Get conflict count
const count = await conflictLogStore.getConflictCount();
```

## UI Components

### SyncStatusDisplay

Full-featured card showing:

- Online/offline status
- Pending operations count
- Failed operations count
- Conflicts resolved count
- Last sync timestamp
- Manual sync button

### SyncStatusIndicator

Compact indicator for headers:

- Icon with badge
- Popover with details
- Quick sync action

### ConflictLogViewer

Detailed conflict viewer:

- List of all conflicts
- Expandable details
- Local vs server data comparison
- Resolution strategy display

## Monitoring and Debugging

### Check Sync Status

```typescript
const {
  pendingCount, // Operations waiting to sync
  failedCount, // Operations that failed
  conflictCount, // Conflicts resolved
  lastSyncTimestamp, // Last successful sync
} = useOfflineSync();
```

### Debug Conflicts

```typescript
// Get detailed conflict information
const conflicts = await getConflicts();

conflicts.forEach((conflict) => {
  console.group(`Conflict ${conflict.id}`);
  console.log("Type:", conflict.type);
  console.log("Session:", conflict.sessionId);
  console.log("Timestamp:", new Date(conflict.timestamp));
  console.log("Local Data:", conflict.localData);
  console.log("Server Data:", conflict.serverData);
  console.log("Resolution:", conflict.resolution);
  console.groupEnd();
});
```

### Monitor Sync Events

```typescript
import { openHouseSyncService } from "@/lib/offline/sync-service";

// Listen for sync completion
const unsubscribe = openHouseSyncService.addSyncListener((results) => {
  const conflicts = results.filter((r) => r.conflictDetected);

  if (conflicts.length > 0) {
    console.log(`${conflicts.length} conflicts resolved`);
  }
});

// Clean up listener
unsubscribe();
```

## Future Enhancements

### Planned Features

1. **Manual Resolution**: Allow agents to choose which data to keep
2. **Field-Level Merging**: Merge non-conflicting fields automatically
3. **Conflict Prevention**: Lock entities during offline editing
4. **Conflict Notifications**: Push notifications for conflicts
5. **Conflict Analytics**: Track patterns and frequency
6. **Three-Way Merge**: Compare original, local, and server versions

### Alternative Strategies

While last-write-wins is implemented, future versions could support:

- **Server Wins**: Always keep server data
- **Manual Resolution**: Prompt user to choose
- **Field-Level**: Merge non-conflicting fields
- **Timestamp-Based**: Use most recent timestamp regardless of source
- **Custom Rules**: Business logic-based resolution

## Troubleshooting

### Conflicts Not Being Detected

**Check:**

- Is conflict detection enabled?
- Are timestamps being set correctly?
- Is server data fetch working?

**Debug:**

```typescript
// Enable verbose logging
localStorage.setItem("DEBUG_SYNC", "true");
```

### Conflicts Not Being Logged

**Check:**

- Is IndexedDB available?
- Is conflict log store initialized?
- Are there storage quota issues?

**Debug:**

```typescript
// Check conflict log store
const count = await conflictLogStore.getConflictCount();
console.log("Conflict count:", count);
```

### High Conflict Rate

**Possible Causes:**

- Multiple devices editing same data
- Poor network connectivity causing delays
- Infrequent syncing

**Solutions:**

- Coordinate device usage
- Sync more frequently
- Use single device per session

## Performance Considerations

- **Minimal Overhead**: Conflict detection only for update operations
- **Efficient Storage**: Conflicts auto-cleanup after 7 days
- **Batch Processing**: Multiple conflicts handled in single sync
- **Indexed Queries**: Fast conflict lookups by session/operation

## Security Considerations

- **User Isolation**: Conflicts filtered by userId
- **Local Storage**: Conflict logs stored locally only
- **No Sensitive Data**: Avoid logging sensitive information
- **Automatic Cleanup**: Old conflicts removed automatically

## API Reference

See the following files for detailed API documentation:

- `src/lib/offline/storage.ts` - Conflict log storage
- `src/lib/offline/sync-service.ts` - Conflict detection and resolution
- `src/lib/offline/use-offline-sync.ts` - React hooks
- `src/components/open-house/sync-status-display.tsx` - Status display component
- `src/components/open-house/conflict-log-viewer.tsx` - Conflict viewer component
- `src/components/open-house/sync-status-indicator.tsx` - Compact indicator component

## Related Documentation

- [Offline Support README](./README.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Task 35 Implementation Summary](../../.kiro/specs/open-house-enhancement/TASK_35_IMPLEMENTATION_SUMMARY.md)
- [Task 36 Implementation Summary](../../.kiro/specs/open-house-enhancement/TASK_36_IMPLEMENTATION_SUMMARY.md)
