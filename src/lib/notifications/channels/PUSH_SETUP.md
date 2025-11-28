# Push Notification Setup Guide

This guide explains how to set up browser push notifications for the Bayon Coagent notification system.

## Overview

The push notification handler uses the Web Push API to deliver notifications to users' browsers. It requires VAPID (Voluntary Application Server Identification) keys for authentication.

## Prerequisites

- Node.js environment with `web-push` package installed
- HTTPS-enabled application (required for Web Push API)
- User permission to send push notifications

## Setup Steps

### 1. Generate VAPID Keys

Run the VAPID key generation script:

```bash
tsx scripts/generate-vapid-keys.ts
```

This will output three environment variables that you need to add to your `.env.local` and `.env.production` files.

### 2. Configure Environment Variables

Add the following to your environment files:

```env
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:support@bayoncoagent.com
```

**Important Security Notes:**

- Keep the private key secret and never commit it to version control
- The public key will be used in client-side code
- Update `VAPID_SUBJECT` with your actual support email
- Use the same keys across all environments for consistency

### 3. Client-Side Integration

To enable push notifications on the client side, you'll need to:

1. Request permission from the user
2. Subscribe to push notifications
3. Send the subscription to your server
4. Store the subscription in user preferences

Example client-side code:

```typescript
// Request permission
const permission = await Notification.requestPermission();

if (permission === "granted") {
  // Get the public VAPID key from your API
  const response = await fetch("/api/notifications/vapid-public-key");
  const { publicKey } = await response.json();

  // Subscribe to push notifications
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // Send subscription to server
  await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### 4. Service Worker

Create a service worker to handle push notifications:

```javascript
// public/sw.js
self.addEventListener("push", function (event) {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: data.data,
    actions: data.actions,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    const actionUrl = event.notification.data?.actionUrl;
    if (actionUrl) {
      event.waitUntil(clients.openWindow(actionUrl));
    }
  }
});
```

## Usage

Once configured, the push notification handler will automatically be used when:

1. A notification is created with `NotificationChannel.PUSH` in its channels array
2. The user has push notifications enabled in their preferences
3. The user has granted push notification permission
4. A valid push subscription exists for the user

Example:

```typescript
import { getNotificationService } from "@/lib/notifications/service";
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
} from "@/lib/notifications/types";

const service = getNotificationService();

await service.createNotification({
  userId: "user-123",
  type: NotificationType.ALERT,
  priority: NotificationPriority.HIGH,
  title: "Important Update",
  content: "You have a new message",
  channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
  actionUrl: "/messages",
  actionText: "View Message",
});
```

## Testing

To test push notifications:

1. Ensure VAPID keys are configured in your environment
2. Run the test suite:

```bash
npm test -- src/lib/notifications/channels/__tests__/push-channel-handler.test.ts
```

3. Test in a browser:
   - Open your application in a browser
   - Grant push notification permission
   - Subscribe to push notifications
   - Send a test notification

## Troubleshooting

### "VAPID keys not configured" Warning

This means the `VAPID_PUBLIC_KEY` or `VAPID_PRIVATE_KEY` environment variables are not set. Run the key generation script and add the keys to your environment.

### "Push subscription expired or invalid" Error

The user's push subscription has expired or been revoked. The user needs to re-subscribe to push notifications.

### "Push service rate limit exceeded" Error

The push service (FCM, APNs, etc.) has rate-limited your requests. Implement exponential backoff and retry logic.

### Notifications Not Appearing

1. Check that the user has granted push notification permission
2. Verify the service worker is registered and active
3. Check browser console for errors
4. Ensure your application is served over HTTPS
5. Verify the push subscription is valid and stored correctly

## Browser Support

Push notifications are supported in:

- Chrome 42+
- Firefox 44+
- Safari 16+ (macOS 13+, iOS 16.4+)
- Edge 17+
- Opera 29+

## Security Considerations

1. **VAPID Keys**: Keep private keys secure and never expose them in client-side code
2. **User Permission**: Always request permission before subscribing to push notifications
3. **Content Validation**: Sanitize notification content to prevent XSS attacks
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Subscription Management**: Regularly validate and clean up expired subscriptions

## Additional Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push Library](https://github.com/web-push-libs/web-push)
