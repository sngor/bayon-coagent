# Notification System Developer Guide

This guide provides comprehensive documentation for developers working with the notification system, including integration hooks and testing utilities.

## Table of Contents

1. [Integration Hooks](#integration-hooks)
2. [Developer Tools](#developer-tools)
3. [Testing Utilities](#testing-utilities)
4. [Examples](#examples)

## Integration Hooks

Integration hooks allow you to automatically trigger notifications based on common application events.

### Quick Start

```typescript
import {
  getNotificationHookManager,
  HookEventType,
  registerUserSignupHook,
  triggerUserSignupEvent,
} from "@/lib/notifications";

// Register a hook for user signup
registerUserSignupHook("user-id");

// Trigger the event
await triggerUserSignupEvent("user-id", {
  userName: "John Doe",
  email: "john@example.com",
});
```

### Available Hook Event Types

```typescript
enum HookEventType {
  // User actions
  USER_SIGNUP = "user_signup",
  USER_LOGIN = "user_login",
  USER_PROFILE_UPDATED = "user_profile_updated",
  USER_SUBSCRIPTION_CHANGED = "user_subscription_changed",

  // Content events
  CONTENT_CREATED = "content_created",
  CONTENT_PUBLISHED = "content_published",
  CONTENT_SHARED = "content_shared",

  // System events
  SYSTEM_MAINTENANCE = "system_maintenance",
  SYSTEM_UPDATE = "system_update",
  SYSTEM_ERROR = "system_error",

  // AI events
  AI_TASK_COMPLETED = "ai_task_completed",
  AI_TASK_FAILED = "ai_task_failed",

  // Market events
  MARKET_ALERT = "market_alert",
  PRICE_CHANGE = "price_change",
  NEW_LISTING = "new_listing",

  // Collaboration events
  COMMENT_ADDED = "comment_added",
  MENTION_RECEIVED = "mention_received",
  SHARE_RECEIVED = "share_received",
}
```

### Creating Custom Hooks

```typescript
import {
  getNotificationHookManager,
  HookEventType,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from "@/lib/notifications";

const manager = getNotificationHookManager();

// Register a custom hook
manager.registerHook({
  id: "custom-content-published",
  eventType: HookEventType.CONTENT_PUBLISHED,
  enabled: true,
  notificationType: NotificationType.ANNOUNCEMENT,
  priority: NotificationPriority.MEDIUM,
  channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  titleTemplate: "{{contentType}} Published!",
  contentTemplate:
    "Your {{contentType}} '{{contentTitle}}' has been published successfully.",
  actionUrlTemplate: "/library/content/{{contentId}}",
  actionText: "View Content",
});

// Trigger the hook
await manager.triggerEvent({
  eventType: HookEventType.CONTENT_PUBLISHED,
  userId: "user-123",
  data: {
    contentType: "Blog Post",
    contentTitle: "My First Post",
    contentId: "post-456",
  },
});
```

### Template Variables

Hooks support template variables using `{{variableName}}` syntax:

- **titleTemplate**: The notification title
- **contentTemplate**: The notification body
- **actionUrlTemplate**: The action URL (optional)

Variables are replaced with values from the event data.

### Managing Hooks

```typescript
const manager = getNotificationHookManager();

// Get a specific hook
const hook = manager.getHook("hook-id");

// Get all hooks
const allHooks = manager.getAllHooks();

// Get hooks for a specific event
const signupHooks = manager.getHooksForEvent(HookEventType.USER_SIGNUP);

// Enable/disable a hook
manager.setHookEnabled("hook-id", false);

// Unregister a hook
manager.unregisterHook("hook-id");
```

### Built-in Convenience Functions

```typescript
// User signup notification
await triggerUserSignupEvent("user-id", {
  userName: "John Doe",
});

// AI task completion notification
await triggerAITaskCompletionEvent(
  "user-id",
  "Blog Post Generation",
  "/results/123"
);

// Market alert notification
await triggerMarketAlertEvent(
  "user-id",
  "Price Drop",
  "Property at 123 Main St dropped by 10%",
  "/market/property/123"
);
```

## Developer Tools

### Notification Preview

Generate previews of how notifications will appear in different channels:

```typescript
import {
  getNotificationPreviewGenerator,
  Notification,
} from "@/lib/notifications";

const generator = getNotificationPreviewGenerator();

const notification: Notification = {
  // ... notification data
};

const preview = generator.generatePreview(notification);

// Access channel-specific previews
preview.channels.forEach((channel) => {
  console.log(`${channel.channel}:`);
  console.log(channel.preview);
  if (channel.html) {
    console.log("HTML:", channel.html);
  }
});
```

### Development Logger

Track notification operations in development mode:

```typescript
import { getNotificationDevLogger } from "@/lib/notifications";

const logger = getNotificationDevLogger();

// Log notification creation
logger.logCreation(notification);

// Log delivery
logger.logDelivery(notification, deliveryResult);

// Log preference changes
logger.logPreferenceChange("user-id", changes);

// Log errors
logger.logError(error, { context: "additional info" });

// Get all logs
const logs = logger.getLogs();

// Export logs as JSON
const json = logger.exportLogs();

// Clear logs
logger.clearLogs();
```

### Test Notification Generator

Generate test notifications for development and testing:

```typescript
import { getTestNotificationGenerator } from "@/lib/notifications";

const generator = getTestNotificationGenerator();

// Generate a random test notification
const notification = generator.generateTestNotification("user-id");

// Generate with overrides
const customNotification = generator.generateTestNotification("user-id", {
  type: NotificationType.ALERT,
  priority: NotificationPriority.CRITICAL,
  title: "Custom Title",
});

// Generate multiple notifications
const notifications = generator.generateTestNotifications("user-id", 10);

// Generate one of each type
const allTypes = generator.generateAllTypes("user-id");
```

## Testing Utilities

### Mock Channel Handler

Use mock channel handlers for testing without actual delivery:

```typescript
import { MockChannelHandler, NotificationChannel } from "@/lib/notifications";

// Create a mock handler
const mockHandler = new MockChannelHandler(NotificationChannel.IN_APP);

// Configure behavior
mockHandler.setShouldFail(false);
mockHandler.setDeliveryDelay(100); // milliseconds

// Deliver a notification
const result = await mockHandler.deliver(notification, recipient);

// Check delivered notifications
const delivered = mockHandler.getDeliveredNotifications();
expect(delivered).toHaveLength(1);

// Clear history
mockHandler.clearHistory();
```

### Mock Handler Options

```typescript
const mockHandler = new MockChannelHandler(NotificationChannel.EMAIL, {
  shouldFail: true,
  failureReason: "Test failure",
  deliveryDelay: 500,
});
```

### Testing Hooks

```typescript
import {
  NotificationHookManager,
  resetNotificationHookManager,
} from "@/lib/notifications";

describe("My Hook Tests", () => {
  let hookManager: NotificationHookManager;
  let mockService: MockNotificationService;

  beforeEach(() => {
    resetNotificationHookManager();
    mockService = new MockNotificationService();
    hookManager = new NotificationHookManager(mockService);
  });

  it("should trigger notification on event", async () => {
    hookManager.registerHook({
      id: "test-hook",
      eventType: HookEventType.USER_SIGNUP,
      // ... hook config
    });

    const results = await hookManager.triggerEvent({
      eventType: HookEventType.USER_SIGNUP,
      userId: "test-user",
      data: {},
    });

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
  });
});
```

## Examples

### Example 1: Content Creation Notification

```typescript
import {
  getNotificationHookManager,
  HookEventType,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from "@/lib/notifications";

// Register hook
const manager = getNotificationHookManager();
manager.registerHook({
  id: "content-created",
  eventType: HookEventType.CONTENT_CREATED,
  enabled: true,
  notificationType: NotificationType.TASK_COMPLETION,
  priority: NotificationPriority.MEDIUM,
  channels: [NotificationChannel.IN_APP],
  titleTemplate: "Content Created",
  contentTemplate: "Your {{contentType}} has been created successfully.",
  actionUrlTemplate: "/library/content/{{contentId}}",
  actionText: "View Content",
});

// Trigger from your content creation code
async function createContent(
  userId: string,
  contentType: string,
  contentId: string
) {
  // ... create content logic

  // Trigger notification
  await manager.triggerEvent({
    eventType: HookEventType.CONTENT_CREATED,
    userId,
    data: { contentType, contentId },
  });
}
```

### Example 2: AI Task Completion with Preview

```typescript
import {
  getNotificationService,
  getNotificationPreviewGenerator,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from "@/lib/notifications";

async function notifyAITaskComplete(
  userId: string,
  taskName: string,
  resultUrl: string
) {
  const service = getNotificationService();
  const previewGenerator = getNotificationPreviewGenerator();

  // Create notification
  const notification = await service.createNotification({
    userId,
    type: NotificationType.TASK_COMPLETION,
    priority: NotificationPriority.MEDIUM,
    title: `${taskName} completed`,
    content: `Your ${taskName} has finished processing.`,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    actionUrl: resultUrl,
    actionText: "View Result",
  });

  // Preview in development
  if (process.env.NODE_ENV === "development") {
    const preview = previewGenerator.generatePreview(notification);
    console.log("Notification Preview:", preview);
  }

  // Send notification
  await service.sendNotification(notification.id);
}
```

### Example 3: Testing with Mock Handlers

```typescript
import {
  MockChannelHandler,
  NotificationChannel,
  NotificationService,
} from "@/lib/notifications";

describe("Notification Integration", () => {
  it("should send notifications through all channels", async () => {
    // Create mock handlers
    const inAppHandler = new MockChannelHandler(NotificationChannel.IN_APP);
    const emailHandler = new MockChannelHandler(NotificationChannel.EMAIL);

    // Create service with mock handlers
    const service = new NotificationService(
      /* repository */,
      /* preferenceManager */,
      /* channelRegistry with mock handlers */
    );

    // Create and send notification
    const notification = await service.createNotification({
      userId: "test-user",
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.MEDIUM,
      title: "Test",
      content: "Test content",
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });

    await service.sendNotification(notification.id);

    // Verify deliveries
    expect(inAppHandler.getDeliveredNotifications()).toHaveLength(1);
    expect(emailHandler.getDeliveredNotifications()).toHaveLength(1);
  });
});
```

### Example 4: Development Logging

```typescript
import {
  getNotificationService,
  getNotificationDevLogger,
} from "@/lib/notifications";

const service = getNotificationService();
const logger = getNotificationDevLogger();

// Enable logging in development
logger.setEnabled(process.env.NODE_ENV === "development");

async function sendNotificationWithLogging(request: CreateNotificationRequest) {
  try {
    // Create notification
    const notification = await service.createNotification(request);
    logger.logCreation(notification);

    // Send notification
    const result = await service.sendNotification(notification.id);
    logger.logDelivery(notification, result);

    return notification;
  } catch (error) {
    logger.logError(error as Error, { request });
    throw error;
  }
}

// Export logs for debugging
if (process.env.NODE_ENV === "development") {
  console.log("Notification Logs:", logger.exportLogs());
}
```

## Best Practices

1. **Use Hooks for Common Events**: Register hooks for frequently occurring events to automate notifications
2. **Test with Mock Handlers**: Use mock handlers in tests to avoid actual delivery
3. **Preview in Development**: Use the preview generator to verify notification formatting
4. **Log in Development**: Enable dev logging to track notification operations
5. **Template Variables**: Use descriptive variable names in templates for clarity
6. **Error Handling**: Always handle errors when triggering hooks or sending notifications
7. **Cleanup**: Reset singletons in test teardown to avoid state leakage

## API Reference

### Integration Hooks

- `getNotificationHookManager()`: Get singleton hook manager
- `resetNotificationHookManager()`: Reset singleton (for testing)
- `registerUserSignupHook(userId)`: Register user signup hook
- `registerAITaskCompletionHook()`: Register AI task completion hook
- `registerMarketAlertHook()`: Register market alert hook
- `triggerUserSignupEvent(userId, data)`: Trigger user signup event
- `triggerAITaskCompletionEvent(userId, taskName, resultUrl)`: Trigger AI task completion
- `triggerMarketAlertEvent(userId, alertType, message, url)`: Trigger market alert

### Developer Tools

- `getNotificationPreviewGenerator()`: Get preview generator
- `getNotificationDevLogger()`: Get dev logger
- `getTestNotificationGenerator()`: Get test generator
- `MockChannelHandler`: Mock channel handler for testing

## Support

For questions or issues, please refer to:

- Main notification system documentation: `INTEGRATION_GUIDE.md`
- Component documentation: `components/README.md`
- API documentation: See inline code comments
