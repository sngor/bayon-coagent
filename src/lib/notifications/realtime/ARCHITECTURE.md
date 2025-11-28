# Real-Time Notification Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Component (e.g., NotificationCenter)              │  │
│  │                                                           │  │
│  │  const { isConnected } = useNotificationStream({         │  │
│  │    onNotification: (notif) => {                          │  │
│  │      // Handle notification                              │  │
│  │    }                                                      │  │
│  │  });                                                      │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       │ uses                                     │
│                       ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  useNotificationStream Hook                              │  │
│  │  - Manages EventSource connection                        │  │
│  │  - Handles reconnection logic                            │  │
│  │  - Parses SSE events                                     │  │
│  │  - Provides connection state                             │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       │ EventSource                              │
│                       │ GET /api/notifications/stream            │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ HTTP/SSE
                        │
┌───────────────────────┼──────────────────────────────────────────┐
│                       ↓                                           │
│                    SERVER SIDE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Route: /api/notifications/stream                    │  │
│  │  - Authenticates user                                     │  │
│  │  - Creates ReadableStream                                 │  │
│  │  - Registers client with broadcaster                      │  │
│  │  - Returns SSE response                                   │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│                       │ registers                                │
│                       ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NotificationBroadcaster (Singleton)                     │  │
│  │  - Maintains Map<userId, SSEClient[]>                    │  │
│  │  - Broadcasts notifications to connected clients         │  │
│  │  - Sends keep-alive pings                                │  │
│  │  - Manages connection lifecycle                          │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       ↑                                          │
│                       │ broadcasts                               │
│                       │                                          │
│  ┌────────────────────┴─────────────────────────────────────┐  │
│  │  InAppChannelHandler                                     │  │
│  │  - Stores notification in DB                             │  │
│  │  - Calls broadcaster.broadcastToUser()                   │  │
│  │  - Formats content for display                           │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       ↑                                          │
│                       │ uses                                     │
│                       │                                          │
│  ┌────────────────────┴─────────────────────────────────────┐  │
│  │  NotificationService                                     │  │
│  │  - Creates notifications                                  │  │
│  │  - Routes to appropriate channel handlers                │  │
│  │  - Manages delivery tracking                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Notification Creation & Delivery

```
User Action / System Event
         │
         ↓
NotificationService.createNotification()
         │
         ↓
NotificationService.sendNotification()
         │
         ↓
ChannelRegistry.routeNotification()
         │
         ↓
InAppChannelHandler.deliver()
         │
         ├─→ Store in DynamoDB
         │
         └─→ NotificationBroadcaster.broadcastToUser()
                    │
                    ↓
            Find connected clients for user
                    │
                    ↓
            Send SSE event to each client
                    │
                    ↓
            Client receives event
                    │
                    ↓
            useNotificationStream hook
                    │
                    ↓
            onNotification callback
                    │
                    ↓
            Update UI / Show toast / Play sound
```

### 2. Client Connection Flow

```
Component mounts
         │
         ↓
useNotificationStream hook initializes
         │
         ↓
Create EventSource("/api/notifications/stream")
         │
         ↓
API Route authenticates user
         │
         ↓
Create ReadableStream
         │
         ↓
Register with NotificationBroadcaster
         │
         ↓
Send "connected" event to client
         │
         ↓
Client receives "connected" event
         │
         ↓
onConnected callback fires
         │
         ↓
Connection established ✓
         │
         ↓
Receive notifications in real-time
         │
         ↓
Component unmounts
         │
         ↓
EventSource closes
         │
         ↓
Cleanup function called
         │
         ↓
Unregister from NotificationBroadcaster
```

## SSE Message Format

### Connected Event

```
id: 1
event: connected
data: {"message":"Connected to notification stream","timestamp":"2024-01-01T00:00:00.000Z"}

```

### Notification Event

```
id: 2
event: notification
data: {"id":"notif_123","userId":"user_456","type":"alert","priority":"high","title":"New Message","content":"You have a new message","channels":["in_app"],"status":"sent","createdAt":"2024-01-01T00:00:00.000Z","updatedAt":"2024-01-01T00:00:00.000Z","timestamp":"2024-01-01T00:00:00.000Z"}

```

### Ping Event (Keep-Alive)

```
id: 3
event: ping
data: {"message":"ping","timestamp":"2024-01-01T00:00:30.000Z"}

```

## Connection Management

### Client Registration

```typescript
// In API Route
const stream = new ReadableStream({
  start(controller) {
    const broadcaster = getNotificationBroadcaster();
    const cleanup = broadcaster.registerClient(userId, controller);

    request.signal.addEventListener("abort", cleanup);
  },
});
```

### Broadcasting

```typescript
// In InAppChannelHandler
const broadcaster = getNotificationBroadcaster();
await broadcaster.broadcastToUser(userId, notification);
```

### Client Tracking

```typescript
// Internal structure
Map<userId, SSEClient[]>
  └─ "user_123" → [
       { userId, controller, lastEventId },
       { userId, controller, lastEventId }  // Multiple devices
     ]
  └─ "user_456" → [
       { userId, controller, lastEventId }
     ]
```

## Error Handling

### Server-Side

```typescript
try {
  controller.enqueue(data);
} catch (error) {
  // Log error but don't fail
  // Client will be cleaned up on next ping
  console.error("Failed to send to client:", error);
}
```

### Client-Side

```typescript
eventSource.addEventListener("error", (event) => {
  // Close connection
  eventSource.close();

  // Attempt reconnection if enabled
  if (autoReconnect && attempts < maxAttempts) {
    setTimeout(() => connect(), reconnectDelay);
  }
});
```

## Scalability Considerations

### Current Implementation (Single Server)

- In-memory client map
- Direct broadcasting to connected clients
- Works well for small to medium deployments

### Future Enhancements (Multi-Server)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Server 1   │     │  Server 2   │     │  Server 3   │
│             │     │             │     │             │
│ Broadcaster │     │ Broadcaster │     │ Broadcaster │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ↓
                   ┌───────────────┐
                   │  Redis Pub/Sub │
                   │  or AWS SNS/SQS│
                   └───────────────┘
```

For horizontal scaling:

1. Use Redis Pub/Sub for message distribution
2. Each server subscribes to notification channel
3. When notification is created, publish to Redis
4. All servers receive message and broadcast to their connected clients
5. Implement sticky sessions or connection routing

## Performance Metrics

### Memory Usage

- Per client: ~100 bytes (controller reference + metadata)
- 1000 clients: ~100 KB
- 10,000 clients: ~1 MB

### Network Usage

- Connected event: ~150 bytes
- Notification event: ~500-1000 bytes (depends on content)
- Ping event: ~80 bytes
- Ping frequency: Every 30 seconds

### Latency

- Notification to broadcast: < 10ms
- Broadcast to client receive: < 50ms
- Total end-to-end: < 100ms

## Monitoring & Observability

### Key Metrics to Track

1. **Connection Metrics**

   - Total active connections
   - Connections per user
   - Connection duration
   - Connection failures

2. **Broadcast Metrics**

   - Notifications broadcasted
   - Broadcast latency
   - Failed broadcasts
   - Retry attempts

3. **Client Metrics**
   - Reconnection rate
   - Average connection lifetime
   - Error rate

### Logging

```typescript
// Connection events
console.log(`[Broadcaster] Client connected for user ${userId}`);
console.log(`[Broadcaster] Client disconnected for user ${userId}`);

// Broadcast events
console.log(
  `[Broadcaster] Broadcasting notification ${notificationId} to ${clientCount} clients`
);

// Errors
console.error(`[Broadcaster] Failed to send to client:`, error);
```

### Event Emission

```typescript
broadcaster.on("notification-broadcast", ({ userId, notification }) => {
  // Track metrics
  // Log to analytics
  // Monitor performance
});
```

## Testing Strategy

### Unit Tests

- Client registration/unregistration
- Broadcasting to single/multiple users
- Connection tracking
- Event emission
- Shutdown behavior

### Integration Tests

- End-to-end notification flow
- Multiple concurrent connections
- Reconnection scenarios
- Error handling

### Load Tests

- 1000+ concurrent connections
- High-frequency broadcasts
- Memory usage under load
- Connection stability

## Security Considerations

1. **Authentication**

   - All connections require valid Cognito session
   - User ID extracted from authenticated session
   - No cross-user notification access

2. **Authorization**

   - Users only receive their own notifications
   - No ability to subscribe to other users' streams

3. **Rate Limiting**

   - Consider connection limits per user
   - Prevent connection flooding
   - Monitor for abuse

4. **Data Validation**
   - Sanitize notification content
   - Validate event data
   - Prevent XSS attacks

## Troubleshooting

### Connection Not Establishing

1. Check authentication
2. Verify API route is accessible
3. Check browser console for errors
4. Verify CORS headers

### Notifications Not Received

1. Verify broadcaster is being called
2. Check user ID matches
3. Ensure client is connected
4. Check server logs

### High Memory Usage

1. Monitor connection count
2. Check for connection leaks
3. Verify cleanup functions are called
4. Review ping interval

### Connection Drops

1. Check network stability
2. Verify keep-alive pings
3. Review reconnection logic
4. Check server logs for errors
