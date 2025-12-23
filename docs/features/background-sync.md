# Background Sync System

The background sync system provides offline-first capabilities for mobile users, allowing operations to be queued and synchronized when connectivity is restored.

## Architecture

The system consists of several modular components:

### Core Components

- **BackgroundSyncManager**: Main orchestrator that coordinates all sync operations
- **ServiceWorkerManager**: Handles service worker registration and communication
- **SyncManager**: Manages sync operation queuing and registration
- **BackgroundSyncEventManager**: Event system for sync status updates

### React Integration

- **useBackgroundSync**: React hook providing sync capabilities to components

## Configuration

Background sync is disabled by default to prevent service worker 404 errors. Enable it by setting:

```bash
ENABLE_BACKGROUND_SYNC=true
```

## Usage

### Basic Setup

```typescript
import { backgroundSyncManager } from '@/lib/background-sync-manager';

// Check if background sync is supported
if (backgroundSyncManager.isBackgroundSyncSupported()) {
  // Queue an operation
  await backgroundSyncManager.queueOperationForBackgroundSync({
    type: 'content-save',
    data: { id: '123', content: 'Updated content' }
  });
}
```

### React Hook

```typescript
import { useBackgroundSync } from '@/hooks/use-background-sync';

function MyComponent() {
  const { isSupported, isAvailable, queueOperation, events } = useBackgroundSync();

  const handleSave = async (data) => {
    if (isAvailable) {
      await queueOperation(data, true); // High priority
    }
  };

  return (
    <div>
      <p>Sync Status: {isAvailable ? 'Available' : 'Unavailable'}</p>
      <button onClick={() => handleSave(data)}>Save</button>
    </div>
  );
}
```

## Event System

The system emits events for sync progress tracking:

```typescript
backgroundSyncManager.onBackgroundSyncEvent((event) => {
  switch (event.type) {
    case 'sync-started':
      console.log('Sync started');
      break;
    case 'sync-progress':
      console.log(`Progress: ${event.progress}%`);
      break;
    case 'sync-completed':
      console.log('Sync completed');
      break;
    case 'sync-failed':
      console.error('Sync failed:', event.error);
      break;
  }
});
```

## Service Worker Integration

The system requires a service worker at `/public/sw.js` to handle background sync events. The service worker should:

1. Listen for 'sync' events
2. Process queued operations
3. Send progress updates to the main thread
4. Handle retry logic for failed operations

## Browser Support

Background sync requires:
- Service Worker support
- Background Sync API support
- Modern browsers (Chrome 49+, Firefox 44+, Safari 11.1+)

## Development

For local development, the system is disabled by default. To test:

1. Set `ENABLE_BACKGROUND_SYNC=true` in your environment
2. Ensure service worker is available at `/sw.js`
3. Test offline scenarios using browser dev tools

## Production Considerations

- Service worker must be properly deployed and accessible
- Monitor sync success rates and failure patterns
- Implement proper error handling and user feedback
- Consider data size limits for queued operations