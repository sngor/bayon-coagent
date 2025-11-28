# Notification System Integration Guide

## Quick Start

The notification center component is ready to integrate into your application. Follow these steps to add it to your app layout.

## Step 1: Add to App Layout

The most common integration is to add the notification center to your application header.

### Option A: Add to Main App Layout

```tsx
// src/app/(app)/layout.tsx
import { NotificationCenter } from "@/lib/notifications/components";
import { useUser } from "@/aws/auth/use-user";

export default function AppLayout({ children }) {
  const { user } = useUser();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Bayon Coagent</h1>
            {/* Navigation items */}
          </div>

          <div className="flex items-center gap-2">
            {/* Other header items (search, profile, etc.) */}

            {/* Notification Center */}
            {user && <NotificationCenter userId={user.id} maxVisible={50} />}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
```

### Option B: Add to Existing Header Component

If you have an existing header component, add it there:

```tsx
// src/components/app-header.tsx
import { NotificationCenter } from "@/lib/notifications/components";

export function AppHeader({ userId }: { userId: string }) {
  return (
    <header className="flex items-center justify-between p-4">
      <div>Logo and Navigation</div>

      <div className="flex items-center gap-2">
        {/* Other header items */}
        <NotificationCenter userId={userId} />
      </div>
    </header>
  );
}
```

## Step 2: Customize Behavior (Optional)

### Custom Navigation Handler

```tsx
import { NotificationCenter } from "@/lib/notifications/components";
import { useRouter } from "next/navigation";

function Header({ userId }: { userId: string }) {
  const router = useRouter();

  const handleNotificationClick = (notification) => {
    // Custom routing based on notification type
    switch (notification.type) {
      case "task_completion":
        router.push("/tasks");
        break;
      case "achievement":
        router.push("/achievements");
        break;
      case "alert":
        router.push("/alerts");
        break;
      default:
        if (notification.actionUrl) {
          router.push(notification.actionUrl);
        }
    }
  };

  return (
    <NotificationCenter
      userId={userId}
      onNotificationClick={handleNotificationClick}
    />
  );
}
```

### Show Only Unread

```tsx
<NotificationCenter userId={userId} showUnreadOnly={true} maxVisible={25} />
```

### Custom Styling

```tsx
<NotificationCenter userId={userId} className="text-primary hover:bg-accent" />
```

## Step 3: Test the Integration

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Navigate to your app**

   - You should see a bell icon in the header
   - If there are unread notifications, a red badge will appear

3. **Test interactions**
   - Click the bell icon to open the notification center
   - Click a notification to mark it as read
   - Click the dismiss button to remove a notification
   - Click "Mark all read" to mark all as read

## API Requirements

The notification center requires the following API endpoints to be implemented:

### 1. Get Notifications

```
GET /api/notifications?userId={userId}&types={types}&status={status}&limit={limit}&unreadOnly={unreadOnly}
```

### 2. Mark as Read

```
POST /api/notifications/{notificationId}/read
```

### 3. Mark All as Read

```
POST /api/notifications/read-all
Body: { userId: string }
```

### 4. Dismiss Notification

```
POST /api/notifications/{notificationId}/dismiss
```

## Real-time Updates

The notification center automatically connects to real-time updates via the `useNotificationStream` hook. Ensure your WebSocket or Server-Sent Events implementation is configured.

## Styling Customization

The component uses Tailwind CSS and follows your design system. You can customize:

### Popover Width

Edit `notification-center.tsx`:

```tsx
<PopoverContent className="w-[400px] p-0"> // Change width here
```

### Max Height

Edit `notification-center.tsx`:

```tsx
<div className="flex flex-col h-full max-h-[600px]"> // Change max height here
```

### Badge Colors

The badge uses the `destructive` variant by default. You can change it:

```tsx
<Badge variant="default"> // or "secondary", "outline"
```

## Accessibility

The component is fully accessible:

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support with ARIA labels
- ✅ Focus management
- ✅ Semantic HTML

## Performance

The component is optimized for performance:

- Virtual scrolling for large lists
- Optimistic UI updates
- Efficient re-rendering
- Smooth animations

## Troubleshooting

### Notifications not appearing

1. Check that the API endpoints are implemented
2. Verify the userId is correct
3. Check browser console for errors
4. Ensure notifications exist in the database

### Badge not showing

1. Verify there are unread notifications
2. Check the notification status (should not be "read" or "dismissed")
3. Inspect the unreadCount value in the hook

### Real-time updates not working

1. Check WebSocket/SSE connection
2. Verify the `useNotificationStream` hook is configured
3. Check browser console for connection errors

### Styling issues

1. Ensure Tailwind CSS is properly configured
2. Check that all UI components are installed
3. Verify the design system tokens are defined

## Next Steps

After integrating the notification center:

1. **Implement API endpoints** (Task 6.1)
2. **Add notification settings** (Task 4.5)
3. **Set up background processing** (Task 7)
4. **Configure email notifications** (Task 3.4)
5. **Add push notifications** (Task 3.6)

## Support

For issues or questions:

- Check the component README: `src/lib/notifications/components/README.md`
- Review the examples: `src/lib/notifications/components/notification-center-example.tsx`
- Check the tests: `src/lib/notifications/components/__tests__/notification-center.test.tsx`
