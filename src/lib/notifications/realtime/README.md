# Real-Time Notification Broadcasting

This module provides real-time notification delivery using Server-Sent Events (SSE).

## Architecture

The real-time notification system consists of three main components:

1. **NotificationBroadcaster** - Server-side broadcaster that manages SSE connections
2. **SSE API Route** (`/api/notifications/stream`) - Endpoint for clients to connect
3. **useNotificationStream Hook** - React hook for consuming real-time notifications

## How It Works

```
┌─────────────────┐
│  Client (React) │
│                 │
│  useNotification│
│  Stream Hook    │
└────────┬────────┘
         │ EventSource
         │ Connection
         ↓
┌─────────────────┐
│  SSE API Route  │
│  /api/          │
│  notifications/ │
│  stream         │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Notification   │
│  Broadcaster    │
│  (Singleton)    │
└────────┬────────┘
         ↑
         │ broadcast()
         │
┌────────┴────────┐
│  In-App Channel │
│  Handler        │
└─────────────────┘
```

## Server-Side Usage

### Broadcasting Notifications

The `InAppChannelHandler` automatically broadcasts notifications when they are delivered:

```typescript
import { getInAppChannelHandler } from "@/lib/notifications/channels/in-app-channel-handler";

const handler = getInAppChannelHandler();
await handler.deliver(notification, recipient);
// Notification is automatically broadcasted to connected clients
```

### Direct Broadcasting

You can also broadcast notifications directly:

```typescript
import { getNotificationBroadcaster } from "@/lib/notifications/realtime/notification-broadcaster";

const broadcaster = getNotificationBroadcaster();

// Broadcast to a single user
await broadcaster.broadcastToUser(userId, notification);

// Broadcast to multiple users
await broadcaster.broadcastToUsers([userId1, userId2], notification);

// Get connection stats
const totalClients = broadcaster.getTotalClientCount();
const userClients = broadcaster.getUserClientCount(userId);
const connectedUsers = broadcaster.getConnectedUserIds();
```

## Client-Side Usage

### Basic Usage

```typescript
import { useNotificationStream } from "@/lib/notifications/hooks/use-notification-stream";

function NotificationComponent() {
  const { isConnected, error } = useNotificationStream({
    onNotification: (notification) => {
      console.log("New notification:", notification);
      // Update UI, show toast, play sound, etc.
    },
    onConnected: () => {
      console.log("Connected to notification stream");
    },
    onDisconnected: () => {
      console.log("Disconnected from notification stream");
    },
    onError: (error) => {
      console.error("Stream error:", error);
    },
  });

  return (
    <div>
      {isConnected ? <span>🟢 Connected</span> : <span>🔴 Disconnected</span>}
      {error && <span>Error: {error.message}</span>}
    </div>
  );
}
```

### Advanced Usage with State Management

```typescript
import { useNotificationStream } from "@/lib/notifications/hooks/use-notification-stream";
import { useState } from "react";
import { Notification } from "@/lib/notifications/types";

function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { isConnected, reconnect } = useNotificationStream({
    onNotification: (notification) => {
      // Add new notification to the list
      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.content,
      });

      // Play notification sound
      playNotificationSound();
    },
    autoReconnect: true,
    maxReconnectAttempts: 5,
  });

  return (
    <div>
      <div className="header">
        <h2>Notifications</h2>
        {!isConnected && <button onClick={reconnect}>Reconnect</button>}
      </div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}
```

### Integration with Notification Context

```typescript
import { useNotificationStream } from "@/lib/notifications/hooks/use-notification-stream";
import { useNotificationContext } from "@/lib/notifications/context";

function NotificationProvider({ children }) {
  const { addNotification, incrementUnreadCount } = useNotificationContext();

  useNotificationStream({
    onNotification: (notification) => {
      // Add to context state
      addNotification(notification);
      incrementUnreadCount();
    },
  });

  return <>{children}</>;
}
```

## Hook Options

### `useNotificationStream(options)`

| Option                 | Type                                   | Default | Description                              |
| ---------------------- | -------------------------------------- | ------- | ---------------------------------------- |
| `onNotification`       | `(notification: Notification) => void` | -       | Callback when a notification is received |
| `onConnected`          | `() => void`                           | -       | Callback when connection is established  |
| `onDisconnected`       | `() => void`                           | -       | Callback when connection is lost         |
| `onError`              | `(error: Error) => void`               | -       | Callback when an error occurs            |
| `autoReconnect`        | `boolean`                              | `true`  | Whether to automatically reconnect       |
| `reconnectDelay`       | `number`                               | `3000`  | Delay between reconnection attempts (ms) |
| `maxReconnectAttempts` | `number`                               | `5`     | Maximum reconnection attempts            |

### Return Value

| Property            | Type            | Description                      |
| ------------------- | --------------- | -------------------------------- |
| `isConnected`       | `boolean`       | Whether the stream is connected  |
| `isConnecting`      | `boolean`       | Whether the stream is connecting |
| `error`             | `Error \| null` | Current error, if any            |
| `reconnectAttempts` | `number`        | Number of reconnection attempts  |
| `reconnect`         | `() => void`    | Manually reconnect               |
| `disconnect`        | `() => void`    | Manually disconnect              |

## SSE Event Types

The stream sends three types of events:

### 1. Connected Event

Sent when the connection is first established.

```json
{
  "type": "connected",
  "data": {
    "message": "Connected to notification stream"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Notification Event

Sent when a new notification is available.

```json
{
  "type": "notification",
  "data": {
    "id": "notif_123",
    "userId": "user_456",
    "type": "alert",
    "priority": "high",
    "title": "New Message",
    "content": "You have a new message",
    "channels": ["in_app"],
    "status": "sent",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Ping Event

Sent every 30 seconds to keep the connection alive.

```json
{
  "type": "ping",
  "data": {
    "message": "ping"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Connection Management

### Keep-Alive

The broadcaster sends ping events every 30 seconds to keep connections alive and detect dead connections.

### Automatic Reconnection

The `useNotificationStream` hook automatically reconnects when the connection is lost, with exponential backoff and a maximum retry limit.

### Connection Cleanup

Connections are automatically cleaned up when:

- The client disconnects
- The component unmounts
- The connection times out
- An error occurs

## Performance Considerations

### Memory Usage

The broadcaster maintains an in-memory map of all connected clients. For large-scale deployments, consider:

- Using Redis Pub/Sub for distributed broadcasting
- Implementing connection limits per user
- Adding connection timeouts

### Scalability

For horizontal scaling across multiple servers:

1. Use Redis Pub/Sub or AWS SNS/SQS for message distribution
2. Implement sticky sessions or connection routing
3. Consider using a dedicated WebSocket/SSE service

### Network Efficiency

- Events are sent as JSON over SSE
- Ping events are minimal (< 100 bytes)
- Notifications are only sent to connected clients
- No polling required

## Testing

### Testing the Broadcaster

```typescript
import {
  getNotificationBroadcaster,
  resetNotificationBroadcaster,
} from "@/lib/notifications/realtime/notification-broadcaster";

describe("NotificationBroadcaster", () => {
  afterEach(() => {
    resetNotificationBroadcaster();
  });

  it("should broadcast to connected clients", async () => {
    const broadcaster = getNotificationBroadcaster();

    // Mock controller
    const mockController = {
      enqueue: jest.fn(),
      close: jest.fn(),
    };

    // Register client
    const cleanup = broadcaster.registerClient(
      "user123",
      mockController as any
    );

    // Broadcast notification
    await broadcaster.broadcastToUser("user123", mockNotification);

    // Verify enqueue was called
    expect(mockController.enqueue).toHaveBeenCalled();

    cleanup();
  });
});
```

### Testing the Hook

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useNotificationStream } from "@/lib/notifications/hooks/use-notification-stream";

describe("useNotificationStream", () => {
  it("should connect to the stream", async () => {
    const onConnected = jest.fn();

    const { result } = renderHook(() => useNotificationStream({ onConnected }));

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(onConnected).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Connection Not Establishing

1. Check that the user is authenticated
2. Verify the API route is accessible
3. Check browser console for errors
4. Ensure CORS headers are correct

### Notifications Not Received

1. Verify the broadcaster is being called
2. Check that the user ID matches
3. Ensure the client is connected
4. Check server logs for errors

### Memory Leaks

1. Ensure components properly unmount
2. Verify cleanup functions are called
3. Check for lingering event listeners
4. Monitor connection count

### High CPU Usage

1. Check ping interval (default: 30s)
2. Verify connection cleanup
3. Monitor number of active connections
4. Consider connection limits

## Future Enhancements

- [ ] Redis Pub/Sub for distributed broadcasting
- [ ] WebSocket support as alternative to SSE
- [ ] Connection pooling and rate limiting
- [ ] Notification batching for high-volume scenarios
- [ ] Offline queue for missed notifications
- [ ] Push notification fallback
- [ ] Analytics and monitoring dashboard
