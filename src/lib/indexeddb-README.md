# IndexedDB Schema for Mobile Enhancements

This module provides a comprehensive IndexedDB schema and wrapper for the mobile enhancements feature, enabling offline-first functionality for the Bayon Coagent platform.

## Overview

The IndexedDB implementation consists of three main stores:

1. **syncQueue** - Stores operations that need to be synchronized with the server
2. **cachedContent** - Stores cached data for offline access (market stats, properties, etc.)
3. **drafts** - Stores locally created/edited content that may not be synced yet

## Files

- `indexeddb-schema.ts` - Database schema definition and initialization
- `indexeddb-wrapper.ts` - High-level wrapper classes for each store
- `use-mobile-storage.ts` - React hooks for easy component integration

## Database Schema

### Database Configuration

```typescript
const DB_NAME = "bayon-mobile";
const DB_VERSION = 1;
```

### Store Structures

#### Sync Queue Store (`syncQueue`)

Stores operations that need to be synchronized when connectivity is restored.

```typescript
interface SyncQueueItem {
  id: string; // Primary key
  type:
    | "photo"
    | "voice"
    | "content"
    | "checkin"
    | "edit"
    | "meeting-prep"
    | "market-stats";
  data: any; // Operation-specific data
  timestamp: number; // When the operation was queued
  retryCount: number; // Number of retry attempts
  status: "pending" | "syncing" | "failed" | "completed";
  error?: string; // Error message if failed
}
```

**Indexes:**

- `type` - For filtering by operation type
- `status` - For filtering by sync status
- `timestamp` - For chronological ordering
- `type_status` - Compound index for efficient filtering

#### Cached Content Store (`cachedContent`)

Stores cached data for offline access with expiration management.

```typescript
interface CachedContentItem {
  id: string; // Primary key
  type: "market-stats" | "property" | "content" | "meeting-materials";
  data: any; // The cached data
  cachedAt: number; // When the data was cached
  expiresAt: number; // When the data expires
  location?: string; // For location-based caching
}
```

**Indexes:**

- `type` - For filtering by content type
- `expiresAt` - For cleanup of expired content
- `location` - For location-based queries
- `type_location` - Compound index for location-specific content

#### Drafts Store (`drafts`)

Stores locally created or edited content that may not be synced.

```typescript
interface DraftItem {
  id: string; // Primary key
  type:
    | "blog"
    | "social"
    | "market-update"
    | "notes"
    | "listing-description"
    | "meeting-prep";
  content: any; // The draft content
  lastModified: number; // When the draft was last modified
  synced: boolean; // Whether the draft has been synced
  userId?: string; // For multi-user support
}
```

**Indexes:**

- `type` - For filtering by content type
- `synced` - For finding unsynced drafts
- `lastModified` - For chronological ordering
- `userId` - For user-specific queries
- `type_synced` - Compound index for efficient filtering

## Usage

### Basic Setup

```typescript
import { initializeMobileStorage } from "@/lib/indexeddb-wrapper";

// Initialize the database
await initializeMobileStorage();
```

### Using React Hooks

```typescript
import { useMobileStorage } from "@/hooks/use-mobile-storage";

function MyComponent() {
  const {
    isSupported,
    isInitialized,
    queueOperation,
    cacheContent,
    saveDraft,
    stats,
  } = useMobileStorage();

  // Queue an operation for sync
  const handleOfflineAction = async () => {
    await queueOperation("photo", {
      filename: "photo.jpg",
      blob: photoBlob,
      metadata: { width: 1920, height: 1080 },
    });
  };

  // Cache market data
  const handleCacheMarketData = async () => {
    await cacheContent("market-stats", marketData, 24, "san-francisco-ca");
  };

  // Save a draft
  const handleSaveDraft = async () => {
    await saveDraft("blog", {
      title: "My Blog Post",
      content: "Draft content...",
    });
  };
}
```

### Direct Store Access

```typescript
import {
  syncQueueStore,
  cachedContentStore,
  draftsStore,
} from "@/lib/indexeddb-wrapper";

// Queue a sync operation
const operationId = await syncQueueStore.queueOperation("photo", photoData);

// Get pending operations
const pendingOps = await syncQueueStore.getPendingOperations();

// Cache content with expiration
const contentId = await cachedContentStore.cacheContent(
  "market-stats",
  data,
  24
);

// Get cached content by location
const cachedData = await cachedContentStore.getCachedContentByLocation(
  "market-stats",
  "san-francisco-ca"
);

// Save a draft
const draftId = await draftsStore.saveDraft("blog", blogContent);

// Get unsynced drafts
const unsyncedDrafts = await draftsStore.getUnsyncedDrafts();
```

## Features

### Automatic Cleanup

The system automatically cleans up:

- Completed sync operations older than 24 hours
- Expired cached content
- Synced drafts older than 7 days

### Error Handling

- Graceful degradation when IndexedDB is not supported
- Proper error handling for quota exceeded scenarios
- Retry logic for failed operations

### Performance Optimization

- Efficient indexing for common query patterns
- Batch operations for better performance
- Lazy loading and cleanup of expired data

### Storage Management

- Storage quota monitoring
- Persistent storage request
- Automatic cleanup of old data

## Browser Compatibility

- Modern browsers with IndexedDB support (Chrome 24+, Firefox 16+, Safari 10+)
- Graceful fallback for unsupported browsers
- Progressive enhancement approach

## Testing

The schema includes comprehensive tests for:

- Utility functions (ID generation, expiration handling)
- Constants and configuration
- Error handling scenarios

Run tests with:

```bash
npm test -- src/lib/__tests__/indexeddb-schema.test.ts
```

## Integration with Mobile Features

This IndexedDB schema supports the following mobile features:

1. **Quick Capture** - Queue photo uploads and AI processing
2. **Voice Memos** - Store audio recordings and transcriptions
3. **Offline Content Creation** - Save drafts locally
4. **Market Stats Caching** - Cache market data for offline access
5. **Meeting Prep** - Store meeting materials and client data
6. **Open House Check-in** - Store visitor information offline
7. **Property Comparisons** - Cache property data for comparisons

## Security Considerations

- No sensitive data is stored in plain text
- User authentication tokens are not stored in IndexedDB
- Data is automatically cleaned up to prevent accumulation
- Proper error handling prevents data leaks

## Future Enhancements

- Encryption for sensitive cached data
- Compression for large data items
- Background sync with Service Worker integration
- Cross-tab synchronization
- Import/export functionality for data migration
