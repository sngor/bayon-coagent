# Notification Actions Quick Reference

## Overview

The notification system provides two levels of implementation:

1. **Basic Actions** (`/src/app/notification-actions.ts`) - Simplified placeholder functions for basic notification operations
2. **Comprehensive Service** (`/src/services/notifications/notification-actions.ts`) - Full-featured notification system with advanced capabilities

## Basic Notification Actions

### Location

`/src/app/notification-actions.ts`

### Purpose

Provides simplified notification functions following established codebase patterns. These are placeholder implementations that can be used for basic notification needs or as a starting point for custom implementations.

### Available Functions

#### Core Functions

#### `createNotification(input: CreateNotificationInput)`

```typescript
const result = await createNotification({
  userId: "user-123",
  title: "Welcome!",
  message: "Welcome to the platform",
  type: "info",
  priority: "normal",
});
```

**Status**: ⚠️ Placeholder implementation - returns mock data

#### `updateNotificationPreferences(preferences: NotificationPreferences)`

```typescript
const result = await updateNotificationPreferences({
  userId: "user-123",
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
});
```

**Status**: ⚠️ Placeholder implementation - returns mock success

#### `getNotificationPreferences(userId: string)`

```typescript
const preferences = await getNotificationPreferences("user-123");
// Returns default preferences
```

**Status**: ⚠️ Placeholder implementation - returns default values

#### Additional Placeholder Functions

The following functions are available as placeholder implementations for script compatibility:

#### `getRateLimitStatusAction(userId: string)`

```typescript
const status = await getRateLimitStatusAction("user-123");
// Returns: {
//   success: true,
//   rateLimitStatus: {
//     remaining: 100,
//     resetTime: 1640995200000, // timestamp
//     limit: 100
//   }
// }
```

**Status**: ⚠️ Placeholder implementation - returns mock rate limit data

#### Other Placeholder Functions

- `markAsReadAction(notificationId: string)` - Mark notification as read
- `dismissNotificationAction(notificationId: string)` - Dismiss notification
- `sendTestNotificationAction(userId: string)` - Send test notification
- `bulkCreateNotificationsAction(notifications: CreateNotificationInput[])` - Bulk create notifications
- `getNotificationHistoryAction(userId: string)` - Get notification history
- `getNotificationMetricsAction(userId: string)` - Get notification metrics
- `retryFailedNotificationsAction(userId: string)` - Retry failed notifications

All additional functions return placeholder success responses and are marked as TODO for future implementation.

### Schemas

#### CreateNotificationInput

```typescript
{
  userId: string;
  title: string; // max 200 characters
  message: string; // max 1000 characters
  type: "info" | "success" | "warning" | "error";
  priority: "low" | "normal" | "high";
}
```

#### NotificationPreferences

```typescript
{
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}
```

## Comprehensive Notification Service

### Location

`/src/services/notifications/notification-actions.ts`

### Purpose

Full-featured notification system with server actions, user preferences, admin monitoring, and enterprise-grade features.

### Key Features

- ✅ Server Actions with form validation
- ✅ Multiple notification channels (in-app, email, push)
- ✅ User preference management
- ✅ Admin monitoring and metrics
- ✅ Bulk operations
- ✅ Rate limiting
- ✅ Audit trails
- ✅ Retry mechanisms
- ✅ Authentication and authorization

### Available Server Actions

#### Core Operations

- `createNotificationAction()` - Create and send notifications
- `markAsReadAction()` - Mark notifications as read
- `dismissNotificationAction()` - Dismiss notifications

#### User Preferences

- `updateNotificationPreferencesAction()` - Update user preferences
- `getUserPreferencesAction()` - Get user preferences
- `sendTestNotificationAction()` - Send test notifications

#### Admin Operations

- `bulkCreateNotificationsAction()` - Create multiple notifications
- `getNotificationMetricsAction()` - Get system metrics
- `retryFailedNotificationsAction()` - Retry failed deliveries
- `getNotificationAuditTrailAction()` - Get audit trails

#### History & Monitoring

- `getNotificationHistoryAction()` - Get user notification history
- `getRateLimitStatusAction()` - Check rate limits and usage status

## Usage Recommendations

### For Basic Needs

Use the basic actions in `/src/app/notification-actions.ts` if you need:

- Simple notification creation
- Basic preference management
- Placeholder functionality during development

### For Production Use

Use the comprehensive service in `/src/services/notifications/notification-actions.ts` for:

- Production applications
- Multi-channel notifications
- User preference management
- Admin monitoring
- Enterprise features

## Migration Path

If you're currently using the basic actions and need more features:

1. Import from the comprehensive service:

```typescript
import { createNotificationAction } from "@/services/notifications/notification-actions";
```

2. Update your forms to use server actions:

```typescript
<form action={createNotificationAction}>{/* form fields */}</form>
```

3. Handle the structured response:

```typescript
const result = await createNotificationAction(prevState, formData);
if (result.message === "success") {
  // Handle success
} else {
  // Handle errors
}
```

## Integration with UI Components

### Notification Center

```typescript
import { NotificationCenter } from "@/lib/notifications/components/notification-center";

<NotificationCenter />;
```

### Notification Settings

```typescript
import { NotificationSettings } from "@/lib/notifications/components/notification-settings";

<NotificationSettings />;
```

## Related Documentation

- [Notification Service Types](/src/lib/notifications/types.ts) - TypeScript definitions
- [Notification Repository](/src/lib/notifications/repository.ts) - Data layer
- [Notification Components](/src/lib/notifications/components/) - UI components
- [Server Action Utils](/src/lib/server-action-utils.ts) - Response formatting

## Development Notes

### Current Status

- ✅ Comprehensive service is fully implemented
- ⚠️ Basic actions are placeholder implementations
- ✅ UI components are available
- ✅ Server actions follow established patterns

### Next Steps

1. Implement the basic actions if needed for specific use cases
2. Consider deprecating basic actions in favor of comprehensive service
3. Update any existing code to use the comprehensive service
4. Add integration tests for notification flows

## Rate Limiting

The notification system includes rate limiting functionality to prevent abuse and ensure fair usage:

### Rate Limit Status

```typescript
const status = await getRateLimitStatusAction(userId);

// Response format:
{
  success: boolean,
  rateLimitStatus: {
    remaining: number,    // Notifications remaining in current window
    resetTime: number,    // Timestamp when limit resets
    limit: number         // Total limit per window
  }
}
```

### Current Implementation

- **Basic Actions**: Placeholder implementation returns mock data (100 notifications per hour)
- **Comprehensive Service**: Full rate limiting with configurable limits per user tier
- **Default Limits**: 100 notifications per hour for standard users
- **Reset Window**: 1 hour (3600 seconds)

### Usage Recommendations

- Check rate limit status before bulk operations
- Implement client-side rate limit awareness
- Handle rate limit exceeded errors gracefully
- Consider user tier when setting limits

## Error Handling

Both implementations follow the established error handling patterns:

```typescript
// Basic actions return simple objects
{ success: boolean, notificationId?: string }

// Comprehensive service returns structured responses
{
  message: string,
  data: any | null,
  errors: Record<string, string[]>
}
```

## Authentication

- Basic actions: No authentication (placeholder)
- Comprehensive service: Full authentication with `getCurrentUserServer()`
- Admin operations require admin role verification
