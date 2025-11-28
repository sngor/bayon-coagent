# Push Notifications Quick Start

## 1. Generate VAPID Keys (One-Time Setup)

```bash
tsx scripts/generate-vapid-keys.ts
```

Copy the output to your `.env.local`:

```env
VAPID_PUBLIC_KEY=BISyRycQRvdA8WzkF8YrdZMWmYcYYGgsbKOeLAzabPvDmhiQyruDvxPNG0Dt9GHi5flwZpZO1KtKeVT8uFWY6qA
VAPID_PRIVATE_KEY=nKzPQZe8xqxqQqxqQqxqQqxqQqxqQqxqQqxqQqxqQqw
VAPID_SUBJECT=mailto:support@bayoncoagent.com
```

## 2. Send a Push Notification

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
  title: "New Message",
  content: "You have a new message from John",
  channels: [NotificationChannel.PUSH],
  actionUrl: "/messages",
  actionText: "View",
});
```

## 3. Client-Side Setup (Coming Soon)

The client-side integration will be implemented in Task 4.x. It will include:

- Permission request UI
- Push subscription management
- Service worker for handling notifications

## Features

✅ **Automatic Routing**: Push notifications are automatically routed through the handler  
✅ **User Preferences**: Respects user notification preferences  
✅ **Priority Levels**: Supports low, medium, high, and critical priorities  
✅ **Action Buttons**: Includes clickable actions in notifications  
✅ **Error Handling**: Gracefully handles subscription expiration and failures  
✅ **Content Sanitization**: Prevents XSS attacks

## Testing

```bash
npm test -- src/lib/notifications/channels/__tests__/push-channel-handler.test.ts
```

## Documentation

- Full setup guide: `src/lib/notifications/channels/PUSH_SETUP.md`
- Implementation summary: `.kiro/specs/notification-system/TASK_3_6_IMPLEMENTATION_SUMMARY.md`
