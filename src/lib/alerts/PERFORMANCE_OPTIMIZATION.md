# Notification System Performance Optimization

This document describes the performance optimizations implemented in the notification system.

## Rate Limiting

### Implementation

- **User-level limits**: Per minute (10), per hour (100), per day (500)
- **System-wide limits**: Per minute (1000), per hour (10000)
- **Priority bypass**: Critical and high-priority notifications can bypass rate limits
- **Sliding window**: Uses time-based windows with automatic expiration

### Usage

```typescript
import { rateLimiter } from "@/lib/alerts/rate-limiter";

// Check rate limit before sending
const result = await rateLimiter.checkRateLimit(userId, "high");
if (!result.allowed) {
  console.log(`Rate limited: ${result.reason}`);
  console.log(`Retry after: ${result.retryAfter} seconds`);
}

// Record notification send
await rateLimiter.recordNotification(userId);

// Get current status
const status = await rateLimiter.getRateLimitStatus(userId);
```

### Monitoring

```typescript
import { createRateLimitMonitor } from "@/lib/alerts/rate-limit-monitor";

const monitor = createRateLimitMonitor(rateLimiter);

// Get metrics
const metrics = await monitor.getMetrics(userId, "user", startTime, endTime);

// Get aggregated stats
const stats = await monitor.getAggregatedStats(userId, "user", "hour", 24);

// Get recent alerts
const alerts = await monitor.getRecentAlerts(50);
```

## Caching

### Notification Preferences Cache

- **TTL**: 10 minutes
- **Max size**: 5000 entries
- **Strategy**: LRU (Least Recently Used) eviction
- **Hit rate tracking**: Enabled

```typescript
import { preferencesCache } from "@/lib/alerts/notification-cache";

// Get from cache (automatic in NotificationService)
const prefs = preferencesCache.getUserPreferences(userId);

// Invalidate cache after update
preferencesCache.invalidateUserPreferences(userId);

// Get cache statistics
const stats = preferencesCache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
```

### Template Cache

- **TTL**: 1 hour
- **Max size**: 100 entries
- **Strategy**: LRU eviction

```typescript
import { templateCache } from "@/lib/alerts/notification-cache";

// Cache templates
templateCache.setTemplate("alert-real-time", "html", htmlContent);
templateCache.setTemplate("alert-real-time", "text", textContent);

// Get from cache
const html = templateCache.getTemplate("alert-real-time", "html");
```

## Batch Processing

### Batch Load Preferences

Reduces database queries when processing multiple users:

```typescript
import { batchProcessor } from "@/lib/alerts/notification-batch-processor";

// Load preferences for multiple users in one batch
const userIds = ["user1", "user2", "user3"];
const preferencesMap = await batchProcessor.batchLoadPreferences(userIds);

// Access individual preferences
const user1Prefs = preferencesMap.get("user1");
```

### Batch Load Alerts

Efficiently loads multiple alerts:

```typescript
const alertIds = ["alert1", "alert2", "alert3"];
const alertsMap = await batchProcessor.batchLoadAlerts(alertIds, userId);
```

### Batch Create Events

Optimizes event logging:

```typescript
const events = [
  { userId: "user1", type: "email_sent", alertId: "alert1", messageId: "msg1" },
  { userId: "user2", type: "email_sent", alertId: "alert2", messageId: "msg2" },
];

const result = await batchProcessor.batchCreateEvents(events);
console.log(
  `Processed: ${result.totalProcessed}, Failed: ${result.failed.length}`
);
```

## DynamoDB Query Optimization

### Key Patterns

Optimized for common access patterns:

```
# User preferences (cached)
PK: USER#<userId>
SK: SETTINGS#NOTIFICATIONS

# Rate limit counters (with TTL)
PK: USER#<userId>
SK: RATE_LIMIT#MINUTE|HOUR|DAY

# System rate limits
PK: SYSTEM
SK: RATE_LIMIT#MINUTE|HOUR

# Rate limit metrics (with TTL)
PK: USER#<userId> or SYSTEM
SK: RATE_LIMIT_METRICS#<timestamp>#<window>

# Rate limit alerts (with TTL)
PK: SYSTEM
SK: RATE_LIMIT_ALERT#<timestamp>#<id>
```

### TTL Configuration

Automatic cleanup of old data:

- Rate limit counters: Expire after window ends
- Metrics: 7 days
- Alerts: 30 days

### Batch Operations

- Use `batchGet` for loading multiple items (up to 100 per batch)
- Use `batchWrite` for creating multiple items (up to 25 per batch)
- Automatic retry for unprocessed items

## Connection Pooling

The notification system uses optimized connection pooling for DynamoDB:

### Configuration

```typescript
import {
  createOptimizedDynamoDBClient,
  LOAD_SCENARIO_CONFIGS,
} from "@/lib/alerts/db-connection-pool";

// Use predefined configuration for your load scenario
const client = createOptimizedDynamoDBClient(
  {
    region: "us-east-1",
  },
  LOAD_SCENARIO_CONFIGS.moderateLoad.config
);
```

### Features

- **HTTP Keep-Alive**: Reuses connections for better performance
- **Connection Pooling**: Configurable max sockets (default: 50)
- **Timeout Management**: Socket and request timeouts
- **Automatic Retry**: Built-in retry logic with exponential backoff

### Load Scenarios

#### Low Load (< 10 req/sec)

```typescript
maxSockets: 25;
maxFreeSockets: 5;
timeout: 5000;
```

#### Moderate Load (10-50 req/sec)

```typescript
maxSockets: 50;
maxFreeSockets: 10;
timeout: 5000;
```

#### High Load (50-200 req/sec)

```typescript
maxSockets: 100;
maxFreeSockets: 20;
timeout: 3000;
```

#### Burst Load (> 200 req/sec)

```typescript
maxSockets: 200;
maxFreeSockets: 50;
timeout: 3000;
```

### Monitoring

```typescript
import {
  getConnectionPoolManager,
  checkConnectionPoolHealth,
} from "@/lib/alerts/db-connection-pool";

// Get pool statistics
const manager = getConnectionPoolManager();
const stats = manager.getStats();

// Health check
const health = checkConnectionPoolHealth();
if (!health.healthy) {
  console.warn("Connection pool issues:", health.warnings);
}
```

## Query Optimization

### Optimized Query Methods

The notification service provides optimized query methods:

```typescript
import { notificationService } from "@/lib/alerts/notification-service";

// Query notification events with filters
const events = await notificationService.queryNotificationEvents(userId, {
  limit: 50,
  startDate: "2024-01-01",
  endDate: "2024-01-31",
  eventType: "email_sent",
});

// Query notification jobs by status
const jobs = await notificationService.queryNotificationJobs(userId, {
  status: "pending",
  limit: 100,
});

// Count notifications efficiently
const count = await notificationService.countNotifications(userId, {
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});
```

### Index Recommendations

For optimal query performance, consider adding these indexes:

#### GSI1: Notifications by Type

```
PK: USER#<userId>#TYPE#<type>
SK: TIMESTAMP#<timestamp>
```

Use case: Query all notifications of a specific type for a user

#### GSI2: Notifications by Status

```
PK: USER#<userId>#STATUS#<status>
SK: TIMESTAMP#<timestamp>
```

Use case: Query unread/read notifications

#### LSI1: Notifications by Priority

```
PK: USER#<userId>
SK: PRIORITY#<priority>#TIMESTAMP#<timestamp>
```

Use case: Query high-priority notifications

### Query Patterns

```typescript
import { queryOptimizer } from "@/lib/alerts/db-optimization";

// Batch load preferences (uses cache)
const preferences = await queryOptimizer.batchLoadPreferencesOptimized([
  "user1",
  "user2",
  "user3",
]);

// Query recent notifications
const recent = await queryOptimizer.queryRecentNotifications(userId, 20);

// Count notifications
const count = await queryOptimizer.countNotifications(userId, {
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});
```

## Performance Monitoring

### Cache Statistics

```typescript
const stats = notificationService.getCacheStats();
console.log("Preferences cache:", stats.preferences);
console.log("Templates cache:", stats.templates);
```

### Rate Limit Statistics

```typescript
const stats = await notificationService.getRateLimitStats(
  userId,
  "user",
  "hour",
  24
);
console.log("Average utilization:", stats.avgUtilization);
console.log("Max utilization:", stats.maxUtilization);
console.log("Blocked count:", stats.blockedCount);
```

### Query Performance Metrics

```typescript
// Get performance metrics
const metrics = notificationService.getPerformanceMetrics();
console.log("Query performance:", metrics);

// Example output:
// {
//   batchLoadPreferences: { count: 100, avg: 45, min: 20, max: 150, p95: 120 },
//   queryNotificationEvents: { count: 50, avg: 30, min: 15, max: 80, p95: 65 },
//   countNotifications: { count: 20, avg: 25, min: 10, max: 50, p95: 45 }
// }

// Reset metrics
notificationService.resetPerformanceMetrics();
```

## Best Practices

### 1. Use Caching

- Preferences are automatically cached
- Cache is invalidated on updates
- Monitor hit rates to tune TTL

### 2. Batch Operations

- Use batch methods for multiple users
- Reduces database round trips
- Improves throughput

### 3. Rate Limiting

- Configure limits based on your needs
- Use priority bypass for critical notifications
- Monitor alerts for system overload

### 4. Query Optimization

- Use specific key patterns
- Leverage GSI for alternative access patterns
- Use TTL for automatic cleanup

### 5. Monitoring

- Track cache hit rates
- Monitor rate limit utilization
- Review performance metrics regularly

## Configuration

### Rate Limiter Config

```typescript
import { createRateLimiter } from "@/lib/alerts/rate-limiter";

const rateLimiter = createRateLimiter({
  userLimits: {
    perMinute: 20, // Increase for high-volume users
    perHour: 200,
    perDay: 1000,
  },
  systemLimits: {
    perMinute: 2000,
    perHour: 20000,
  },
  priorityBypass: {
    critical: true,
    high: true, // Allow high priority to bypass
  },
});
```

### Cache Config

```typescript
import { createNotificationCache } from "@/lib/alerts/notification-cache";

const cache = createNotificationCache({
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxSize: 10000,
  enableStats: true,
});
```

### Batch Processor Config

```typescript
import { createBatchProcessor } from "@/lib/alerts/notification-batch-processor";

const processor = createBatchProcessor({
  maxBatchSize: 50,
  maxEmailBatchSize: 100,
  batchDelay: 50, // Faster batching
  autoFlush: true,
});
```

## Database Indexing Strategy

### Primary Table Structure

```
PK: USER#<userId>
SK: NOTIFICATION#<timestamp>#<id>
```

### Recommended Indexes

1. **GSI1 - Type-based queries**

   - PK: `USER#<userId>#TYPE#<type>`
   - SK: `TIMESTAMP#<timestamp>`
   - Projection: ALL
   - Use: Query notifications by type

2. **GSI2 - Status-based queries**

   - PK: `USER#<userId>#STATUS#<status>`
   - SK: `TIMESTAMP#<timestamp>`
   - Projection: ALL
   - Use: Query unread/read notifications

3. **LSI1 - Priority-based queries**
   - PK: `USER#<userId>`
   - SK: `PRIORITY#<priority>#TIMESTAMP#<timestamp>`
   - Projection: ALL
   - Use: Query by priority level

### Query Optimization Tips

1. **Use specific key conditions**: Always query with partition key
2. **Leverage sort key prefixes**: Use `begins_with` for efficient filtering
3. **Minimize filter expressions**: Move filters to key conditions when possible
4. **Use projection expressions**: Only fetch required attributes
5. **Batch operations**: Use batchGet/batchWrite for multiple items
6. **Enable caching**: Cache frequently accessed data
7. **Monitor performance**: Track query latency and optimize slow queries

## Performance Metrics

Expected performance improvements:

- **Cache hit rate**: 80-95% for preferences
- **Query reduction**: 70-90% with caching and batching
- **Throughput**: 10x improvement for bulk operations
- **Latency**: 50-80% reduction for cached operations
- **Connection reuse**: 90%+ with keep-alive enabled
- **Query optimization**: 60-80% faster with proper indexing

## Troubleshooting

### High Cache Miss Rate

- Increase TTL if data doesn't change frequently
- Increase cache size if evictions are high
- Check if cache is being invalidated too often

### Rate Limit Alerts

- Review system-wide limits
- Check for unusual traffic patterns
- Consider increasing limits for legitimate use cases

### Slow Batch Operations

- Reduce batch size
- Check for network issues
- Monitor DynamoDB throttling
