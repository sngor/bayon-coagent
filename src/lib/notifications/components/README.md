# Notification Center Component

The Notification Center component provides a complete UI for displaying and managing notifications in your application.

## Features

- **Unread Count Badge**: Shows the number of unread notifications
- **Popover Display**: Clean popover interface with scrollable notification list
- **Real-time Updates**: Automatically updates when new notifications arrive
- **Interactive Actions**: Mark as read, dismiss, and navigate to related content
- **Visual Indicators**: Icons and colors based on notification type and priority
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Full keyboard navigation and screen reader support

## Requirements Validation

This component validates the following requirements:

- **2.1**: Display unread in-app notifications in a notification center
- **2.2**: Show visual indicator with count of unread notifications
- **2.4**: Show notifications in chronological order (most recent first)
- **2.5**: Remove notifications from active list when dismissed

## Usage

### Basic Usage

```tsx
import { NotificationCenter } from "@/lib/notifications/components";

function AppHeader({ userId }: { userId: string }) {
  return (
    <header>
      <NotificationCenter userId={userId} />
    </header>
  );
}
```

### With Custom Options

```tsx
<NotificationCenter
  userId={userId}
  maxVisible={50}
  showUnreadOnly={false}
  onNotificationClick={(notification) => {
    console.log("Clicked:", notification);
  }}
  className="custom-class"
/>
```

## Props

### NotificationCenterProps

| Prop                  | Type                                   | Default  | Description                                |
| --------------------- | -------------------------------------- | -------- | ------------------------------------------ |
| `userId`              | `string`                               | Required | User ID to fetch notifications for         |
| `maxVisible`          | `number`                               | `50`     | Maximum number of notifications to display |
| `showUnreadOnly`      | `boolean`                              | `false`  | Whether to show only unread notifications  |
| `onNotificationClick` | `(notification: Notification) => void` | -        | Callback when a notification is clicked    |
| `className`           | `string`                               | -        | Custom className for the trigger button    |

## Notification Item Features

Each notification item includes:

1. **Type Icon**: Visual indicator based on notification type
2. **Priority Color**: Color coding based on priority level
3. **Title and Content**: Clear display of notification information
4. **Timestamp**: Relative time display (e.g., "5m ago", "2h ago")
5. **Unread Indicator**: Blue dot for unread notifications
6. **Action Button**: Optional button to navigate to related content
7. **Dismiss Button**: Remove notification from the list

## Notification Types and Icons

- **Alert**: AlertCircle icon
- **System**: Info icon
- **Achievement**: Trophy icon
- **Announcement**: Megaphone icon
- **Task Completion**: CheckCircle icon
- **Feature Update**: Sparkles icon
- **Reminder**: AlertTriangle icon

## Priority Colors

- **Critical**: Red (destructive)
- **High**: Orange (warning)
- **Medium**: Blue (primary)
- **Low**: Gray (muted)

## Integration Examples

### In App Layout

```tsx
// src/app/(app)/layout.tsx
import { NotificationCenter } from "@/lib/notifications/components";
import { useUser } from "@/aws/auth/use-user";

export default function AppLayout({ children }) {
  const { user } = useUser();

  return (
    <div>
      <header className="flex items-center justify-between p-4">
        <h1>My App</h1>
        {user && <NotificationCenter userId={user.id} />}
      </header>
      <main>{children}</main>
    </div>
  );
}
```

### With Custom Navigation

```tsx
import { NotificationCenter } from "@/lib/notifications/components";
import { useRouter } from "next/navigation";

function Header({ userId }: { userId: string }) {
  const router = useRouter();

  return (
    <NotificationCenter
      userId={userId}
      onNotificationClick={(notification) => {
        // Custom routing based on notification type
        if (notification.type === "task_completion") {
          router.push("/tasks");
        } else if (notification.actionUrl) {
          router.push(notification.actionUrl);
        }
      }}
    />
  );
}
```

## Styling

The component uses Tailwind CSS and follows the application's design system. You can customize the appearance by:

1. **Trigger Button**: Pass a `className` prop to style the bell icon button
2. **Popover Width**: Modify the `w-[400px]` class in the component
3. **Max Height**: Adjust the `max-h-[600px]` class for the notification list

## Accessibility

The component includes:

- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Semantic HTML structure
- Color contrast compliance

## Performance

The component is optimized for performance:

- Uses `AnimatePresence` for smooth animations
- Implements virtual scrolling for large lists (via ScrollArea)
- Optimistic UI updates for instant feedback
- Efficient re-rendering with React.memo and useMemo

## Related Components

- `useNotifications` hook: Manages notification state and actions
- `NotificationSettings`: User preference management (see below)
- `NotificationProvider`: Global notification context

## Testing

See `notification-center.test.tsx` for component tests and usage examples.

---

# Notification Settings Component

The Notification Settings component provides a comprehensive form for managing user notification preferences across all channels (in-app, email, and push notifications).

## Features

- **Channel-Specific Controls**: Separate settings for in-app, email, and push notifications
- **Notification Type Selection**: Choose which types of notifications to receive per channel
- **Email Frequency Options**: Immediate, hourly, daily, or weekly digest
- **Quiet Hours**: Set times when you don't want to receive notifications
- **Timezone Support**: Configure quiet hours based on your timezone
- **Global Settings**: Do Not Disturb mode to pause all notifications
- **Auto-Save**: Preferences are saved to the server automatically
- **Loading States**: Clear feedback during load and save operations

## Requirements Validation

This component validates the following requirements:

- **3.1**: Display all available notification types and channels
- **3.2**: Save and apply preference changes to future notifications

## Usage

### Basic Usage

```tsx
import { NotificationSettings } from "@/lib/notifications/components";

function SettingsPage({ userId }: { userId: string }) {
  return (
    <div className="container mx-auto py-8">
      <h1>Notification Settings</h1>
      <NotificationSettings userId={userId} />
    </div>
  );
}
```

### With Update Callback

```tsx
<NotificationSettings
  userId={userId}
  onUpdate={(preferences) => {
    console.log("Preferences updated:", preferences);
    // Perform additional actions
  }}
/>
```

### With Custom Styling

```tsx
<NotificationSettings userId={userId} className="bg-accent/5 rounded-lg p-6" />
```

## Props

### NotificationSettingsProps

| Prop        | Type                                             | Default  | Description                           |
| ----------- | ------------------------------------------------ | -------- | ------------------------------------- |
| `userId`    | `string`                                         | Required | User ID to manage preferences for     |
| `onUpdate`  | `(preferences: NotificationPreferences) => void` | -        | Callback when preferences are updated |
| `className` | `string`                                         | -        | Custom className for the container    |

## Settings Sections

### 1. Global Settings

- **Do Not Disturb**: Temporarily pause all notifications across all channels

### 2. In-App Notifications

- **Enable/Disable**: Toggle in-app notifications on or off
- **Notification Types**: Select which types to show in the notification center
  - System Notifications
  - Alerts
  - Reminders
  - Achievements
  - Announcements
  - Task Completions
  - Feature Updates

### 3. Email Notifications

- **Enable/Disable**: Toggle email notifications on or off
- **Email Address**: Optional custom email address (defaults to account email)
- **Notification Types**: Select which types to receive via email
- **Frequency Options**:
  - **Immediate**: Receive emails as notifications arrive
  - **Hourly Digest**: Receive a summary every hour
  - **Daily Digest**: Receive a summary once per day
  - **Weekly Digest**: Receive a summary once per week
- **Delivery Time**: Set preferred time for digest emails (for daily/weekly)
- **Quiet Hours** (for immediate frequency):
  - Enable/disable quiet hours
  - Set start and end times
  - Configure timezone

### 4. Push Notifications

- **Enable/Disable**: Toggle browser push notifications on or off
- **Notification Types**: Select which types to receive as push notifications

## Email Frequency Options

```typescript
enum EmailFrequency {
  IMMEDIATE = "immediate", // Real-time emails
  HOURLY = "hourly", // Hourly digest
  DAILY = "daily", // Daily digest
  WEEKLY = "weekly", // Weekly digest
}
```

## Notification Types

All notification types with descriptions:

- **System**: Important system updates and maintenance notices
- **Alert**: Critical alerts requiring immediate attention
- **Reminder**: Task reminders and scheduled notifications
- **Achievement**: Milestone celebrations and accomplishments
- **Announcement**: Product updates and new feature announcements
- **Task Completion**: Notifications when tasks are completed
- **Feature Update**: Updates about new features and improvements

## Timezone Support

Supported timezones for quiet hours:

- Eastern Time (ET)
- Central Time (CT)
- Mountain Time (MT)
- Pacific Time (PT)
- Arizona Time (MST)
- Alaska Time (AKST)
- Hawaii Time (HST)

## Integration Examples

### In Settings Page

```tsx
// src/app/(app)/settings/notifications/page.tsx
import { NotificationSettings } from "@/lib/notifications/components";
import { useUser } from "@/aws/auth/use-user";

export default function NotificationSettingsPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage how and when you receive notifications
          </p>
        </div>

        <NotificationSettings userId={user.id} />
      </div>
    </div>
  );
}
```

### With Analytics Tracking

```tsx
import { NotificationSettings } from "@/lib/notifications/components";
import { trackEvent } from "@/lib/analytics";

function SettingsPage({ userId }: { userId: string }) {
  const handleUpdate = (preferences: NotificationPreferences) => {
    // Track preference changes
    trackEvent("notification_preferences_updated", {
      userId,
      emailEnabled: preferences.channels.email.enabled,
      pushEnabled: preferences.channels.push.enabled,
      emailFrequency: preferences.channels.email.frequency,
    });
  };

  return <NotificationSettings userId={userId} onUpdate={handleUpdate} />;
}
```

## API Integration

The component expects the following API endpoints:

### GET `/api/notifications/preferences`

Fetch user preferences:

```typescript
// Request
GET /api/notifications/preferences?userId=user-123

// Response
{
  "preferences": {
    "userId": "user-123",
    "channels": { ... },
    "globalSettings": { ... },
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST `/api/notifications/preferences`

Save user preferences:

```typescript
// Request
POST /api/notifications/preferences
{
  "userId": "user-123",
  "preferences": { ... }
}

// Response
{
  "preferences": { ... }
}
```

## Styling

The component uses:

- **Card Components**: For section organization
- **Form Controls**: Switches, checkboxes, inputs, and selects
- **Icons**: Lucide icons for visual clarity
- **Responsive Layout**: Works on all screen sizes
- **Consistent Spacing**: Follows design system spacing

## Accessibility

The component includes:

- Proper label associations
- Keyboard navigation support
- Focus management
- Screen reader friendly descriptions
- Semantic HTML structure

## Performance

Optimizations include:

- Debounced state updates
- Optimistic UI updates
- Efficient re-rendering
- Lazy loading of preferences

## Error Handling

The component handles:

- Failed preference loads with retry option
- Failed saves with error messages
- Network errors with user feedback
- Invalid data with validation

## Examples

See `notification-settings-example.tsx` for complete integration examples including:

- Basic usage
- With update callback
- In settings page
- With custom styling
