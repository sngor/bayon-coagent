# Mobile Service Layer

This directory contains the mobile service layer infrastructure for the Bayon Coagent platform, providing Progressive Web App (PWA) capabilities, offline support, and device API access.

## Overview

The mobile service layer enables real estate agents to use the platform effectively while on-the-go, with features like:

- **PWA Support**: Install the app on mobile devices for native-like experience (currently disabled by default)
- **Offline Queue**: Continue working offline with automatic sync when connection returns
- **Device APIs**: Access camera, microphone, and location services
- **Push Notifications**: Receive real-time notifications for leads and updates

> **Note**: PWA features including service worker registration and background sync are currently disabled by default to prevent 404 errors. See [Configuration](#configuration) section for enabling instructions.

## Services

### Device API Service (`device-apis.ts`)

Provides unified access to device capabilities:

```typescript
import { deviceAPI } from "@/lib/mobile/device-apis";

// Camera
const photo = await deviceAPI.capturePhoto({ facingMode: "environment" });

// Microphone
const recorder = await deviceAPI.startVoiceRecording();

// Location
const position = await deviceAPI.getCurrentLocation();

// Permissions
const hasCamera = await deviceAPI.requestCameraPermission();
```

**Features:**

- Camera photo capture and video recording
- Voice recording with MediaRecorder API
- Geolocation with high accuracy
- Permission management
- Capability detection

### PWA Manager (`pwa-manager.ts`)

Manages Progressive Web App functionality:

> **Important**: PWA functionality is currently disabled by default. Service worker registration and background sync are disabled to prevent 404 errors when the service worker file is not present.

```typescript
import { pwaManager } from "@/lib/mobile/pwa-manager";

// Install prompt (requires PWA to be enabled)
await pwaManager.showInstallPrompt();

// Check install state
const { canInstall, isInstalled } = pwaManager.getInstallState();

// Push notifications (requires service worker)
const subscription = await pwaManager.subscribeToPushNotifications(vapidKey);

// Show notification
await pwaManager.showNotification("New Lead", {
  body: "You have a new lead from John Doe",
  data: { leadId: "123" },
});
```

**Features:**

- Install prompt handling (disabled by default)
- Service worker registration and updates (disabled by default)
- Push notification setup (requires service worker)
- App lifecycle events

### Offline Queue Service (`offline-queue.ts`)

Manages offline operations and syncing:

```typescript
import { offlineQueue } from "@/lib/mobile/offline-queue";

// Add operation to queue
await offlineQueue.addOperation("content", "create", {
  title: "New Blog Post",
  content: "...",
});

// Sync queue
await offlineQueue.syncQueue();

// Get queue status
const pendingCount = offlineQueue.getPendingCount();
const progress = offlineQueue.getSyncProgress();
```

**Features:**

- Queue operations when offline
- Automatic sync on reconnection
- Retry logic with exponential backoff
- Conflict resolution (last-write-wins)
- Sync progress tracking

## React Hooks

### `usePWA()`

React hook for PWA functionality:

```typescript
import { usePWA } from "@/hooks/use-pwa";

function MyComponent() {
  const {
    installState,
    showInstallPrompt,
    isUpdateAvailable,
    updateServiceWorker,
    requestNotificationPermission,
  } = usePWA();

  return (
    <div>
      {installState.canInstall && (
        <button onClick={showInstallPrompt}>Install App</button>
      )}
      {isUpdateAvailable && (
        <button onClick={updateServiceWorker}>Update App</button>
      )}
    </div>
  );
}
```

### `useOfflineQueue()`

React hook for offline queue:

```typescript
import { useOfflineQueue } from "@/hooks/use-offline-queue";

function MyComponent() {
  const {
    isOnline,
    queue,
    pendingCount,
    syncProgress,
    isSyncing,
    addOperation,
    syncQueue,
  } = useOfflineQueue();

  return (
    <div>
      <div>Status: {isOnline ? "Online" : "Offline"}</div>
      <div>Pending: {pendingCount}</div>
      {isSyncing && <div>Syncing...</div>}
    </div>
  );
}
```

### `useDeviceAPI()`

React hook for device APIs:

```typescript
import { useDeviceAPI } from "@/hooks/use-device-api";

function MyComponent() {
  const {
    capabilities,
    capturePhoto,
    getCurrentLocation,
    requestCameraPermission,
  } = useDeviceAPI();

  const handleCapture = async () => {
    if (!capabilities.hasCamera) {
      alert("Camera not available");
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      alert("Camera permission denied");
      return;
    }

    const photo = await capturePhoto();
    // Process photo...
  };

  return (
    <button onClick={handleCapture} disabled={!capabilities.hasCamera}>
      Capture Photo
    </button>
  );
}
```

## Components

### `<PWAInstallPrompt />`

Shows a prompt to install the PWA:

```typescript
import { PWAInstallPrompt } from "@/components/mobile/pwa-install-prompt";

// Add to layout
<PWAInstallPrompt />;
```

**Features:**

- Auto-shows after 3 seconds if installable
- Dismissible with localStorage persistence
- Mobile-optimized design

### `<OfflineIndicator />`

Shows online/offline status and sync progress:

```typescript
import { OfflineIndicator } from "@/components/mobile/offline-indicator";

// Add to layout
<OfflineIndicator />;
```

**Features:**

- Shows offline status
- Displays pending operation count
- Shows sync progress
- Auto-hides when online with no pending operations

## Service Worker

> **Current Status**: Service worker functionality is disabled by default to prevent 404 errors.

The custom service worker (`/public/sw-custom.js`) would provide:

- **Intelligent Caching**: Different strategies for different resource types
- **Offline Support**: Serves cached content when offline
- **Background Sync**: Syncs queued operations in the background
- **Push Notifications**: Handles push notification events

### Cache Strategies

When enabled, the service worker uses these strategies:

- **API Routes**: Network first, fallback to cache
- **Static Assets**: Cache first, fallback to network
- **HTML Pages**: Network first, fallback to cache
- **Images**: Stale while revalidate

### Enabling Service Worker

To enable service worker functionality:

1. Set `NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true` in your environment variables
2. Ensure `/sw.js` or `/sw-custom.js` exists in the `public` directory
3. Deploy over HTTPS (required for service workers in production)

See [Configuration](#configuration) section for detailed setup instructions.

## PWA Manifest

The PWA manifest (`/public/manifest.json`) defines:

- App name and description
- Icons and theme colors
- Display mode (standalone)
- App shortcuts
- Share target configuration

## Configuration

### Enabling PWA Features

PWA features including service worker registration and background sync are disabled by default. To enable them:

#### 1. Environment Configuration

Add to your environment file (`.env.local` for development, `.env.production` for production):

```bash
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true
```

#### 2. Service Worker File

Create a service worker file in your `public` directory:

- `/public/sw.js` - Standard service worker
- `/public/sw-custom.js` - Custom service worker with enhanced features

Example basic service worker (`/public/sw.js`):

```javascript
// Basic service worker for PWA functionality
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Handle fetch events for caching
});

self.addEventListener('push', (event) => {
  // Handle push notifications
  const data = event.data ? event.data.json() : {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body || 'You have a new notification',
      icon: '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      data: data.data || {}
    })
  );
});
```

#### 3. HTTPS Requirement

Service workers require HTTPS in production environments. Development on `localhost` works without HTTPS.

#### 4. PWA Manifest

Ensure your PWA manifest is properly configured at `/public/manifest.json`:

```json
{
  "name": "Bayon CoAgent",
  "short_name": "CoAgent",
  "description": "AI-powered success platform for real estate agents",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    }
  ]
}
```

### Troubleshooting

**Service Worker Not Registering:**
- Check that `NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true` is set
- Verify service worker file exists in `/public/` directory
- Ensure you're using HTTPS in production
- Check browser console for registration errors

**PWA Install Prompt Not Showing:**
- Verify service worker is registered successfully
- Check PWA manifest is valid and accessible
- Ensure site meets PWA installability criteria
- Test in Chrome/Edge (best PWA support)

**Background Sync Not Working:**
- Confirm service worker is active
- Check that background sync is supported in the browser
- Verify network connectivity for sync operations

## Events

The mobile services dispatch custom events that you can listen to:

```typescript
// PWA events
window.addEventListener("pwa:install-available", () => {
  console.log("App can be installed");
});

window.addEventListener("pwa:app-installed", () => {
  console.log("App installed");
});

window.addEventListener("pwa:update-available", () => {
  console.log("Update available");
});

// Offline queue events
window.addEventListener("offline-queue:online", () => {
  console.log("Device is online");
});

window.addEventListener("offline-queue:offline", () => {
  console.log("Device is offline");
});

window.addEventListener("offline-queue:sync-started", () => {
  console.log("Sync started");
});

window.addEventListener("offline-queue:sync-completed", (e) => {
  console.log("Sync completed", e.detail.results);
});
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **6.1**: Offline state detection and indicator
- **6.2**: Offline operation queuing
- **6.3**: Automatic sync on reconnection
- **6.4**: Conflict resolution with user notification
- **6.5**: Access to recently viewed content from cache
- **7.3**: Progressive image loading and compression
- **10.1**: Push notification infrastructure

## Browser Support

- **Chrome/Edge**: Full support
- **Safari (iOS)**: Full support (iOS 11.3+)
- **Firefox**: Full support
- **Samsung Internet**: Full support

## Testing

To test PWA functionality:

1. **Install Prompt**: Open in Chrome/Edge, wait 3 seconds
2. **Offline Mode**: Open DevTools → Network → Offline
3. **Push Notifications**: Use browser DevTools → Application → Service Workers
4. **Cache**: DevTools → Application → Cache Storage

## Best Practices

1. **Always check capabilities** before using device APIs
2. **Request permissions** with clear explanations
3. **Handle errors gracefully** with user-friendly messages
4. **Provide fallbacks** for unavailable features
5. **Test offline functionality** thoroughly
6. **Monitor queue size** to prevent storage issues
7. **Clean up old operations** regularly

## Future Enhancements

- IndexedDB for larger offline storage
- Background fetch for large file uploads
- Periodic background sync
- Web Share Target API integration
- Badging API for notification counts
