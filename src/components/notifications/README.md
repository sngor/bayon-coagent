# Notification Components

React components for the notification system. Provides UI for displaying notifications, managing preferences, and real-time updates.

## Components

### NotificationCenter

Dropdown component with bell icon that displays notifications.

**Features:**

- Unread count badge
- Real-time connection indicator
- Chronological notification list (most recent first)
- Mark as read / dismiss actions
- Priority indicators
- Relative timestamps
- Click to navigate to action URL

**Usage:**

```tsx
import { NotificationCenter } from "@/components/notifications";

<NotificationCenter
  userId={user.id}
  maxVisible={10}
  onNotificationClick={(notification) => {
    // Handle notification click
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }}
/>;
```

**Props:**

- `userId` (required): User ID to fetch notifications for
- `maxVisible`: Maximum number of notifications to display (default: 10)
- `showUnreadOnly`: Whether to show only unread notifications (default: false)
- `onNotificationClick`: Callback when a notification is clicked
- `className`: Custom className for the trigger button

### NotificationSettings

Comprehensive settings form for managing notification preferences.

**Features:**

- Global settings (Do Not Disturb, daily limits)
- Channel-specific settings (in-app, email, push)
- Notification type toggles per channel
- Email frequency and digest settings
- Quiet hours configuration
- Auto-save with toast feedback

**Usage:**

```tsx
import { NotificationSettings } from "@/components/notifications";

<NotificationSettings
  userId={user.id}
  onSave={(preferences) => {
    console.log("Preferences saved:", preferences);
  }}
/>;
```

**Props:**

- `userId` (required): User ID to manage preferences for
- `onSave`: Callback when preferences are saved
- `className`: Custom className

### NotificationProvider

React context provider for global notification state.

**Features:**

- Provides notification state to all child components
- Real-time updates via SSE
- Centralized notification management
- Automatic connection handling

**Usage:**

```tsx
import {
  NotificationProvider,
  useNotificationContext,
} from "@/components/notifications";

// In your app layout
<NotificationProvider userId={user.id}>
  <YourApp />
</NotificationProvider>;

// In any child component
function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotificationContext();

  return (
    <div>
      <Badge>{unreadCount}</Badge>
      {notifications.map((notification) => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          {notification.title}
        </div>
      ))}
    </div>
  );
}
```

**Props:**

- `userId` (required): User ID to fetch notifications for
- `children` (required): Child components
- `enableRealtime`: Whether to enable real-time updates (default: true)
- `maxNotifications`: Maximum number of notifications to keep in memory (default: 50)

## Hooks

### useNotifications

Main hook for managing notifications in React components.

**Features:**

- Fetches notifications from server
- Real-time updates via SSE
- Mark as read / dismiss actions
- Filtering and sorting
- Unread count calculation
- Optimistic UI updates

**Usage:**

```tsx
import { useNotifications } from "@/lib/notifications/hooks";

const {
  notifications,
  unreadCount,
  isLoading,
  error,
  isConnected,
  markAsRead,
  markAllAsRead,
  dismiss,
  refresh,
  filter,
  clearFilters,
} = useNotifications({ userId: "user-123" });
```

**Options:**

- `userId` (required): User ID to fetch notifications for
- `autoFetch`: Whether to automatically fetch on mount (default: true)
- `enableRealtime`: Whether to connect to real-time stream (default: true)
- `types`: Filter by notification types
- `status`: Filter by notification status
- `limit`: Maximum number of notifications to display
- `unreadOnly`: Whether to show only unread notifications (default: false)

### useNotificationStream

Low-level hook for connecting to the real-time notification stream.

**Features:**

- Server-Sent Events (SSE) connection
- Automatic reconnection with exponential backoff
- Connection state management
- Error handling

**Usage:**

```tsx
import { useNotificationStream } from "@/lib/notifications/hooks";

const { isConnected, error, reconnect, disconnect } = useNotificationStream({
  onNotification: (notification) => {
    console.log("New notification:", notification);
  },
  onConnected: () => {
    console.log("Connected to stream");
  },
  onError: (error) => {
    console.error("Stream error:", error);
  },
});
```

## Integration Example

Here's a complete example of integrating the notification system into your app:

```tsx
// app/layout.tsx
import { NotificationProvider } from "@/components/notifications";

export default function RootLayout({ children }) {
  const user = await getUser();

  return (
    <html>
      <body>
        <NotificationProvider userId={user.id}>{children}</NotificationProvider>
      </body>
    </html>
  );
}

// components/app-header.tsx
import { NotificationCenter } from "@/components/notifications";

export function AppHeader() {
  const user = useUser();

  return (
    <header>
      <nav>
        {/* Other nav items */}
        <NotificationCenter userId={user.id} />
      </nav>
    </header>
  );
}

// app/settings/notifications/page.tsx
import { NotificationSettings } from "@/components/notifications";

export default function NotificationSettingsPage() {
  const user = await getUser();

  return (
    <div>
      <h1>Notification Settings</h1>
      <NotificationSettings userId={user.id} />
    </div>
  );
}
```

## API Endpoints Required

The components expect the following API endpoints to be implemented:

- `GET /api/notifications?userId={userId}&types={types}&status={status}&limit={limit}&unreadOnly={boolean}` - Fetch notifications
- `GET /api/notifications/stream` - SSE stream for real-time updates
- `POST /api/notifications/{id}/read` - Mark notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read
- `POST /api/notifications/{id}/dismiss` - Dismiss notification
- `GET /api/notifications/preferences?userId={userId}` - Get user preferences
- `PUT /api/notifications/preferences` - Update user preferences

## Styling

All components use shadcn/ui components and Tailwind CSS for styling. They follow the application's design system and are fully responsive.

## Accessibility

- Keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- Focus management
- High contrast support

## Requirements Validated

- **2.1**: Display unread in-app notifications in notification center
- **2.2**: Show visual indicator with unread count
- **2.3**: Mark notifications as read and navigate to relevant content
- **2.4**: Show notifications in chronological order (most recent first)
- **2.5**: Dismiss notifications from active list
- **3.1**: Display all available notification types and channels
- **3.2**: Save and apply notification preference changes
