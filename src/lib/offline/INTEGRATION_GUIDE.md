# Offline Support Integration Guide

This guide walks you through integrating offline support into the open house feature.

## Step 1: Initialize Offline Support

Add initialization to your app layout or root component:

```typescript
// src/app/(app)/layout.tsx or similar
"use client";

import { useEffect } from "react";
import {
  initializeOpenHouseStorage,
  initializeSyncService,
} from "@/lib/offline";

export function AppLayout({ children }) {
  useEffect(() => {
    // Initialize offline support
    initializeOpenHouseStorage().catch((error) => {
      console.error("Failed to initialize offline storage:", error);
    });

    initializeSyncService();
  }, []);

  return <>{children}</>;
}
```

## Step 2: Add Offline Status Indicator

Add the status indicator to your layout:

```typescript
// src/app/(app)/open-house/layout.tsx
import { OfflineStatusIndicator } from "@/lib/offline/examples/offline-status-indicator";

export default function OpenHouseLayout({ children }) {
  return (
    <div>
      {children}
      <OfflineStatusIndicator />
    </div>
  );
}
```

## Step 3: Update Check-In Form

Modify your check-in form to support offline operations:

```typescript
// src/components/open-house/check-in-form.tsx
'use client';

import { useState } from 'react';
import { useConnectivity } from '@/lib/offline';
import { queueOfflineOperation } from '@/lib/offline';
import { checkInVisitor } from '@/app/actions';

export function CheckInForm({ sessionId, userId }) {
  const { isOffline } = useConnectivity();
  const [formData, setFormData] = useState({...});

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isOffline) {
        // Queue for offline sync
        await queueOfflineOperation(
          'checkIn',
          'visitor',
          sessionId,
          formData,
          userId
        );

        toast.success('Check-in queued for sync when online');
      } else {
        // Execute immediately
        await checkInVisitor(sessionId, formData);
        toast.success('Visitor checked in successfully');
      }

      // Reset form
      setFormData({...});
    } catch (error) {
      toast.error('Failed to check in visitor');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isOffline && (
        <div className="offline-banner">
          You are offline. Check-ins will sync when connection is restored.
        </div>
      )}

      {/* Form fields */}

      <button type="submit">
        {isOffline ? 'Queue Check-In' : 'Check In Visitor'}
      </button>
    </form>
  );
}
```

## Step 4: Update Visitor Management

Add offline support to visitor updates:

```typescript
// src/components/open-house/visitor-card.tsx
'use client';

import { useConnectivity } from '@/lib/offline';
import { queueOfflineOperation } from '@/lib/offline';
import { updateVisitor } from '@/app/actions';

export function VisitorCard({ visitor, sessionId, userId }) {
  const { isOffline } = useConnectivity();

  const handleUpdate = async (updates) => {
    try {
      if (isOffline) {
        await queueOfflineOperation(
          'updateVisitor',
          'visitor',
          sessionId,
          updates,
          userId,
          visitor.id
        );
        toast.success('Update queued for sync');
      } else {
        await updateVisitor(sessionId, visitor.id, updates);
        toast.success('Visitor updated');
      }
    } catch (error) {
      toast.error('Failed to update visitor');
    }
  };

  return (
    <div>
      {/* Visitor details */}
      <button onClick={() => handleUpdate({...})}>
        Update
      </button>
    </div>
  );
}
```

## Step 5: Add Photo Upload Support

Integrate offline support for photo uploads:

```typescript
// src/components/open-house/photo-upload.tsx
"use client";

import { useConnectivity } from "@/lib/offline";
import { queueOfflineOperation } from "@/lib/offline";
import { uploadSessionPhoto } from "@/app/actions";

export function PhotoUpload({ sessionId, userId }) {
  const { isOffline } = useConnectivity();

  const handleUpload = async (file) => {
    try {
      // Convert file to base64 for offline storage
      const base64 = await fileToBase64(file);

      if (isOffline) {
        await queueOfflineOperation(
          "photoUpload",
          "photo",
          sessionId,
          { file: base64, filename: file.name },
          userId
        );
        toast.success("Photo queued for upload");
      } else {
        await uploadSessionPhoto(sessionId, file);
        toast.success("Photo uploaded");
      }
    } catch (error) {
      toast.error("Failed to upload photo");
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {isOffline && <span>Offline - photos will upload when online</span>}
    </div>
  );
}
```

## Step 6: Add Session Management

Update session management with offline support:

```typescript
// src/components/open-house/session-form.tsx
'use client';

import { useConnectivity } from '@/lib/offline';
import { queueOfflineOperation } from '@/lib/offline';
import { updateOpenHouseSession } from '@/app/actions';

export function SessionForm({ session, userId }) {
  const { isOffline } = useConnectivity();

  const handleUpdate = async (updates) => {
    try {
      if (isOffline) {
        await queueOfflineOperation(
          'updateSession',
          'session',
          session.id,
          updates,
          userId
        );
        toast.success('Update queued for sync');
      } else {
        await updateOpenHouseSession(session.id, updates);
        toast.success('Session updated');
      }
    } catch (error) {
      toast.error('Failed to update session');
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleUpdate({...}); }}>
      {/* Form fields */}
    </form>
  );
}
```

## Step 7: Display Sync Status

Add sync status to your session detail page:

```typescript
// src/app/(app)/open-house/sessions/[sessionId]/page.tsx
"use client";

import { useOfflineSync } from "@/lib/offline";

export default function SessionDetailPage({ params }) {
  const { isOnline, isSyncing, pendingCount, syncSession } = useOfflineSync();

  return (
    <div>
      {/* Session details */}

      {/* Sync status */}
      <div className="sync-status">
        <span>{isOnline ? "🟢 Online" : "🔴 Offline"}</span>
        {isSyncing && <span>Syncing...</span>}
        {pendingCount > 0 && (
          <button onClick={() => syncSession(params.sessionId)}>
            Sync {pendingCount} pending operations
          </button>
        )}
      </div>
    </div>
  );
}
```

## Step 8: Handle Sync Results

Listen for sync completion and update UI:

```typescript
// src/components/open-house/sync-listener.tsx
"use client";

import { useEffect } from "react";
import { useOfflineSync } from "@/lib/offline";
import { useToast } from "@/hooks/use-toast";

export function SyncListener() {
  const { lastSyncResults } = useOfflineSync();
  const { toast } = useToast();

  useEffect(() => {
    if (lastSyncResults.length > 0) {
      const successful = lastSyncResults.filter((r) => r.success).length;
      const failed = lastSyncResults.filter((r) => !r.success).length;

      if (successful > 0) {
        toast({
          title: "Sync Complete",
          description: `${successful} operations synced successfully`,
        });
      }

      if (failed > 0) {
        toast({
          title: "Sync Failed",
          description: `${failed} operations failed to sync`,
          variant: "destructive",
        });
      }
    }
  }, [lastSyncResults, toast]);

  return null;
}
```

## Step 9: Add Connectivity Indicator

Add a simple connectivity indicator to your navigation:

```typescript
// src/components/navigation/connectivity-badge.tsx
"use client";

import { useConnectivity } from "@/lib/offline";

export function ConnectivityBadge() {
  const { status, isOnline } = useConnectivity();

  return (
    <div className={`connectivity-badge ${status}`}>
      <div className={`indicator ${isOnline ? "online" : "offline"}`} />
      <span>{isOnline ? "Online" : "Offline"}</span>
    </div>
  );
}
```

## Step 10: Test Offline Functionality

### Manual Testing

1. Open your app in Chrome DevTools
2. Go to Network tab
3. Set throttling to "Offline"
4. Perform operations (check-in, update, etc.)
5. Verify operations are queued
6. Set throttling back to "Online"
7. Verify automatic sync

### Programmatic Testing

```typescript
// Test offline queuing
import { openHouseStore, connectivityMonitor } from "@/lib/offline";

// Check connectivity
console.log("Online:", connectivityMonitor.isOnline());

// Queue an operation
await openHouseStore.queueOperation(
  "checkIn",
  "visitor",
  "test-session",
  { name: "Test Visitor", email: "test@example.com" },
  "test-user"
);

// Check queue status
const status = await openHouseStore.getQueueStatus();
console.log("Pending operations:", status.pending);
```

## Common Patterns

### Pattern 1: Optimistic UI Updates

```typescript
const handleCheckIn = async (data) => {
  // Optimistically update UI
  setVisitors(prev => [...prev, { ...data, id: 'temp-id' }]);

  try {
    if (isOffline) {
      await queueOfflineOperation(...);
    } else {
      const result = await checkInVisitor(...);
      // Update with real ID
      setVisitors(prev => prev.map(v =>
        v.id === 'temp-id' ? { ...v, id: result.id } : v
      ));
    }
  } catch (error) {
    // Revert optimistic update
    setVisitors(prev => prev.filter(v => v.id !== 'temp-id'));
    toast.error('Failed to check in visitor');
  }
};
```

### Pattern 2: Conditional Features

```typescript
const { isOnline } = useConnectivity();

return (
  <div>
    {/* Disable features that require online connectivity */}
    <button disabled={!isOnline}>Generate Follow-Up (Requires Online)</button>

    {/* Enable offline-capable features */}
    <button>Check In Visitor (Works Offline)</button>
  </div>
);
```

### Pattern 3: Sync Progress

```typescript
const { isSyncing, pendingCount } = useOfflineSync();

return (
  <div>
    {isSyncing && (
      <div className="sync-progress">
        <Spinner />
        <span>Syncing {pendingCount} operations...</span>
      </div>
    )}
  </div>
);
```

## Troubleshooting

### Operations Not Syncing

1. Check connectivity: `connectivityMonitor.isOnline()`
2. Check queue: `openHouseStore.getQueueStatus()`
3. Check for errors in failed operations
4. Try manual sync: `openHouseSyncService.syncPendingOperations()`

### Storage Quota Exceeded

1. Clean up old operations: `openHouseStore.cleanupCompletedOperations()`
2. Check storage stats: `getOpenHouseStorageStats()`
3. Reduce retention period

### Sync Conflicts

1. Review failed operations: `openHouseStore.getFailedOperations()`
2. Check error messages
3. Manually resolve conflicts if needed

## Best Practices

1. **Always check connectivity** before performing operations
2. **Provide user feedback** for offline operations
3. **Handle errors gracefully** with user-friendly messages
4. **Test offline scenarios** thoroughly
5. **Monitor storage usage** to prevent quota issues
6. **Clean up old operations** regularly
7. **Use optimistic UI updates** for better UX
8. **Disable online-only features** when offline

## Next Steps

- Implement server actions for sync operations
- Add comprehensive error handling
- Create unit tests for offline functionality
- Add integration tests for sync scenarios
- Update user documentation
- Monitor offline usage in production
