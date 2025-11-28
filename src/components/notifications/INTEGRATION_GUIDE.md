# Notification System Integration Guide

## Quick Start

### 1. Add NotificationProvider to Your App Layout

```tsx
// app/layout.tsx or app/(app)/layout.tsx
import { NotificationProvider } from "@/components/notifications";
import { getUser } from "@/aws/auth/cognito-client";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="en">
      <body>
        {user ? (
          <NotificationProvider userId={user.id}>
            {children}
          </NotificationProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
```

### 2. Add NotificationCenter to Your Header/Navigation

```tsx
// components/layouts/app-header.tsx or similar
import { NotificationCenter } from "@/components/notifications";
import { useUser } from "@/aws/auth/use-user";

export function AppHeader() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <header className="border-b">
      <nav className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          {/* Logo and navigation items */}
        </div>

        <div className="flex items-center gap-2">
          {/* Other header items */}
          <NotificationCenter userId={user.id} />
        </div>
      </nav>
    </header>
  );
}
```

### 3. Add Settings Page (Optional)

```tsx
// app/(app)/settings/notifications/page.tsx
import { NotificationSettings } from "@/components/notifications";
import { getUser } from "@/aws/auth/cognito-client";
import { redirect } from "next/navigation";

export default async function NotificationSettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage how and when you receive notifications
        </p>
      </div>

      <NotificationSettings userId={user.id} />
    </div>
  );
}
```

## Advanced Usage

### Using the Context API

If you wrapped your app with `NotificationProvider`, you can access notification state anywhere:

```tsx
import { useNotificationContext } from "@/components/notifications";

function MyCustomComponent() {
  const { notifications, unreadCount, markAsRead, dismiss, refresh } =
    useNotificationContext();

  return (
    <div>
      <h2>You have {unreadCount} unread notifications</h2>

      <button onClick={refresh}>Refresh</button>

      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <h3>{notification.title}</h3>
            <p>{notification.content}</p>
            <button onClick={() => markAsRead(notification.id)}>
              Mark as Read
            </button>
            <button onClick={() => dismiss(notification.id)}>Dismiss</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Using the Hook Directly

If you don't want to use the context provider, you can use the hook directly:

```tsx
import { useNotifications } from "@/lib/notifications/hooks";

function MyComponent({ userId }: { userId: string }) {
  const { notifications, unreadCount, isLoading, error, markAsRead } =
    useNotifications({
      userId,
      limit: 5,
      unreadOnly: true,
    });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {notifications.map((notification) => (
        <div key={notification.id}>{notification.title}</div>
      ))}
    </div>
  );
}
```

### Custom Notification Display

You can create your own notification display using the hook:

```tsx
import { useNotifications } from "@/lib/notifications/hooks";
import { NotificationPriority } from "@/lib/notifications/types";

function CustomNotificationList({ userId }: { userId: string }) {
  const { notifications, markAsRead } = useNotifications({ userId });

  // Filter critical notifications
  const criticalNotifications = notifications.filter(
    (n) => n.priority === NotificationPriority.CRITICAL
  );

  return (
    <div className="space-y-2">
      {criticalNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-red-50 border border-red-200 p-4 rounded"
          onClick={() => markAsRead(notification.id)}
        >
          <h3 className="font-bold text-red-900">{notification.title}</h3>
          <p className="text-red-700">{notification.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## Customization

### Styling the NotificationCenter

```tsx
<NotificationCenter
  userId={user.id}
  className="hover:bg-accent" // Custom button styles
/>
```

### Custom Click Handler

```tsx
<NotificationCenter
  userId={user.id}
  onNotificationClick={(notification) => {
    // Custom logic
    console.log("Clicked:", notification);

    // Track analytics
    trackEvent("notification_clicked", {
      type: notification.type,
      priority: notification.priority,
    });

    // Custom navigation
    if (notification.metadata?.customUrl) {
      router.push(notification.metadata.customUrl);
    }
  }}
/>
```

### Filtering Notifications

```tsx
const { notifications, filter } = useNotifications({ userId });

// Show only alerts
filter({ types: [NotificationType.ALERT] });

// Show only unread
filter({ unreadOnly: true });

// Show only specific statuses
filter({ status: [NotificationStatus.PENDING, NotificationStatus.SENT] });
```

## Real-time Updates

The notification system automatically connects to a Server-Sent Events (SSE) stream for real-time updates. You can see the connection status:

```tsx
const { isConnected } = useNotifications({ userId });

return (
  <div>
    {isConnected ? (
      <span className="text-green-500">● Connected</span>
    ) : (
      <span className="text-gray-500">○ Disconnected</span>
    )}
  </div>
);
```

## Testing

### Mock Notifications for Development

```tsx
// Create a test notification
const testNotification = {
  id: "test-1",
  userId: user.id,
  type: NotificationType.ALERT,
  priority: NotificationPriority.HIGH,
  title: "Test Notification",
  content: "This is a test notification",
  channels: [NotificationChannel.IN_APP],
  status: NotificationStatus.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Send via API
await fetch("/api/notifications", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testNotification),
});
```

## Troubleshooting

### Notifications Not Appearing

1. Check that the user is authenticated
2. Verify the NotificationProvider is wrapping your app
3. Check browser console for errors
4. Verify API endpoints are implemented
5. Check that notifications are being created in the database

### Real-time Updates Not Working

1. Check that SSE endpoint `/api/notifications/stream` is implemented
2. Verify browser supports EventSource API
3. Check network tab for SSE connection
4. Look for CORS issues
5. Verify the connection indicator shows green dot

### Preferences Not Saving

1. Check that PUT `/api/notifications/preferences` endpoint is implemented
2. Verify user has permission to update preferences
3. Check browser console for errors
4. Verify the request payload is correct

## Performance Tips

1. **Limit Notifications**: Use the `limit` option to cap the number of notifications in memory
2. **Pagination**: Implement "Load More" for notification history
3. **Debounce Actions**: Debounce mark as read actions if clicking rapidly
4. **Lazy Load**: Code-split notification components if not used on every page
5. **Cache Preferences**: Cache user preferences to reduce API calls

## Accessibility

The notification components are built with accessibility in mind:

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels and roles
- ✅ Screen reader announcements
- ✅ Focus management
- ✅ High contrast support
- ✅ Reduced motion support

## Next Steps

1. Implement the required API endpoints (Task 6)
2. Add notification triggers throughout your app
3. Customize notification templates
4. Set up email templates for digest emails
5. Configure push notification service worker
6. Add analytics tracking for notification interactions
