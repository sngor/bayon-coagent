# AWS Performance Optimization

This module provides comprehensive performance optimization utilities for AWS services, including connection pooling, query optimization, caching strategies, and performance monitoring.

## Features

### 1. Connection Pooling

Optimizes AWS SDK client connections for better performance and resource utilization.

**Benefits:**

- Reduces connection overhead by reusing TCP connections
- Improves throughput with keep-alive connections
- Configurable socket limits and timeouts
- Automatic connection management

**Usage:**

```typescript
import { getConnectionPoolManager } from "@/aws/performance";

// Get the global connection pool manager
const poolManager = getConnectionPoolManager({
  maxSockets: 50,
  maxFreeSockets: 10,
  keepAlive: true,
  keepAliveTimeout: 60000,
});

// Get connection statistics
const stats = poolManager.getStats();
console.log("Active connections:", stats.httpsSockets);
```

**Configuration:**

```typescript
interface ConnectionPoolConfig {
  maxSockets?: number; // Default: 50
  maxFreeSockets?: number; // Default: 10
  timeout?: number; // Default: 30000ms
  keepAliveTimeout?: number; // Default: 60000ms
  keepAlive?: boolean; // Default: true
}
```

### 2. Query Optimization

Provides utilities for optimizing DynamoDB queries.

**Features:**

- Parallel query execution
- Query result caching
- Batch operation optimization
- Projection expression optimization
- Efficient pagination

**Usage:**

```typescript
import { QueryOptimizer, QueryBuilder } from "@/aws/performance";
import { DynamoDBRepository } from "@/aws/dynamodb/repository";

const repository = new DynamoDBRepository();
const optimizer = new QueryOptimizer(repository, 60000); // 60s cache TTL

// Parallel queries
const results = await optimizer.parallelQuery([
  { pk: "USER#123", skPrefix: "CONTENT#" },
  { pk: "USER#123", skPrefix: "REPORT#" },
]);

// Cached query
const cachedResult = await optimizer.cachedQuery("USER#123", "CONTENT#");

// Optimized batch get
const items = await optimizer.optimizedBatchGet([
  { PK: "USER#123", SK: "PROFILE" },
  { PK: "USER#123", SK: "CONTENT#1" },
]);

// Query builder
const options = new QueryBuilder()
  .limit(50)
  .scanForward(false)
  .select(["title", "createdAt"])
  .filter("status = :status", { ":status": "published" })
  .build();

const result = await repository.query("USER#123", "CONTENT#", options);
```

**Pagination:**

```typescript
// Efficient pagination through all results
for await (const batch of optimizer.paginateQuery("USER#123", "CONTENT#")) {
  console.log("Processing batch:", batch.length);
  // Process batch
}
```

### 3. Cache Management

Enhanced caching with LRU eviction, TTL expiration, and memory limits.

**Features:**

- LRU (Least Recently Used) eviction
- TTL (Time To Live) expiration
- Memory-based size limits
- Automatic cleanup
- Cache statistics and monitoring
- Multi-level caching support

**Usage:**

```typescript
import { CacheManager, getCache } from "@/aws/performance";

// Create a cache instance
const cache = new CacheManager({
  maxEntries: 1000,
  ttl: 300000, // 5 minutes
  maxSize: 50 * 1024 * 1024, // 50MB
  enableLRU: true,
  enableAutoCleanup: true,
});

// Set and get values
cache.set("key1", { data: "value" });
const value = cache.get("key1");

// Check existence
if (cache.has("key1")) {
  console.log("Cache hit!");
}

// Get statistics
const stats = cache.getStats();
console.log("Hit rate:", stats.hitRate);
console.log("Cache size:", stats.size);

// Named cache instances
const userCache = getCache("users", { ttl: 600000 });
userCache.set("user:123", userData);
```

**Multi-Level Caching:**

```typescript
import { MultiLevelCache } from "@/aws/performance";

// L1: Fast in-memory cache
// L2: Larger persistent cache
const cache = new MultiLevelCache(
  { maxEntries: 100, ttl: 60000 }, // L1 config
  { maxEntries: 1000, ttl: 300000 } // L2 config
);

await cache.set("key", value);
const result = await cache.get("key"); // Checks L1, then L2
```

### 4. Performance Monitoring

Tools for monitoring and profiling application performance.

**Features:**

- Operation timing and profiling
- Hot path identification
- Bottleneck detection
- Request lifecycle tracking
- Memory usage monitoring
- Performance metrics export

**Usage:**

```typescript
import {
  getPerformanceMonitor,
  RequestProfiler,
  MemoryMonitor,
} from "@/aws/performance";

// Global performance monitor
const monitor = getPerformanceMonitor();

// Measure async operations
const result = await monitor.measure("fetchUserData", async () => {
  return await fetchData();
});

// Measure sync operations
const computed = monitor.measureSync("computeValue", () => {
  return expensiveComputation();
});

// Manual timing
monitor.start("operation-1");
// ... do work ...
monitor.end("operation-1", "databaseQuery", { table: "users" });

// Get performance profiles
const profile = monitor.getProfile("fetchUserData");
console.log("Average duration:", profile.averageDuration);
console.log("P95:", profile.p95);
console.log("P99:", profile.p99);

// Identify hot paths
const hotPaths = monitor.getHotPaths(10);
console.log("Top 10 operations by total time:", hotPaths);

// Identify bottlenecks
const bottlenecks = monitor.getBottlenecks(10);
console.log("Top 10 operations by P99:", bottlenecks);
```

**Request Profiling:**

```typescript
import { RequestProfiler } from "@/aws/performance";

const profiler = new RequestProfiler("req-123");

profiler.startPhase("authentication");
// ... auth logic ...
profiler.endPhase("authentication");

profiler.startPhase("database");
// ... db queries ...
profiler.endPhase("database", { queries: 5 });

profiler.startPhase("rendering");
// ... render response ...
profiler.endPhase("rendering");

const profile = profiler.getProfile();
console.log("Request profile:", profile);
```

**Memory Monitoring:**

```typescript
import { MemoryMonitor } from "@/aws/performance";

const memMonitor = new MemoryMonitor();

// Take snapshots periodically
setInterval(() => {
  memMonitor.snapshot();
}, 10000);

// Get memory statistics
const stats = memMonitor.getStats();
console.log("Current heap used:", stats.current.heapUsed);
console.log("Average heap used:", stats.average.heapUsed);
console.log("Peak heap used:", stats.peak.heapUsed);
```

**Decorator for Methods:**

```typescript
import { measurePerformance } from "@/aws/performance";

class UserService {
  @measurePerformance("UserService.getUser")
  async getUser(userId: string) {
    // Method implementation
  }
}
```

## Integration with Existing Code

### DynamoDB Client

The DynamoDB client automatically uses connection pooling:

```typescript
import { getDynamoDBClient } from "@/aws/dynamodb/client";

// Client is automatically configured with connection pooling
const client = getDynamoDBClient();
```

### S3 Client

The S3 client automatically uses connection pooling:

```typescript
import { getS3Client } from "@/aws/s3/client";

// Client is automatically configured with connection pooling
const client = getS3Client();
```

### Bedrock Client

The Bedrock client already includes caching support:

```typescript
import { getBedrockClient } from "@/aws/bedrock/client";

const client = getBedrockClient();

// Caching is enabled by default
const result = await client.invoke(prompt, schema, {
  useCache: true, // Default
});

// Disable caching for specific requests
const freshResult = await client.invoke(prompt, schema, {
  useCache: false,
});
```

## Best Practices

### 1. Connection Pooling

- Use the default configuration for most cases
- Increase `maxSockets` for high-throughput applications
- Monitor connection statistics to tune settings
- Reuse client instances across requests

### 2. Query Optimization

- Use projection expressions to reduce data transfer
- Batch operations when possible
- Enable query caching for frequently accessed data
- Use parallel queries for independent operations
- Implement pagination for large result sets

### 3. Caching

- Set appropriate TTL based on data freshness requirements
- Monitor cache hit rates and adjust configuration
- Use multi-level caching for different access patterns
- Clear expired cache entries regularly
- Consider cache warming for critical data

### 4. Performance Monitoring

- Monitor hot paths to identify optimization opportunities
- Track P95 and P99 latencies for SLA compliance
- Profile requests to understand bottlenecks
- Export metrics for long-term analysis
- Set up alerts for performance degradation

## Performance Metrics

### Connection Pool Statistics

```typescript
const poolManager = getConnectionPoolManager();
const stats = poolManager.getStats();

// Monitor these metrics:
// - httpsSockets: Active HTTPS connections
// - httpsFreeSockets: Available HTTPS connections
// - httpsRequests: Pending HTTPS requests
```

### Cache Statistics

```typescript
const cache = getCache("myCache");
const stats = cache.getStats();

// Monitor these metrics:
// - hitRate: Cache hit rate (0-1)
// - entries: Number of cached entries
// - size: Total cache size in bytes
// - evictions: Number of evicted entries
// - expirations: Number of expired entries
```

### Performance Profiles

```typescript
const monitor = getPerformanceMonitor();
const profile = monitor.getProfile("operationName");

// Monitor these metrics:
// - averageDuration: Average execution time
// - p50: Median execution time
// - p95: 95th percentile execution time
// - p99: 99th percentile execution time
// - count: Number of executions
```

## Troubleshooting

### High Connection Count

If you see high connection counts:

1. Check for connection leaks
2. Reduce `maxSockets` configuration
3. Ensure clients are being reused
4. Monitor `httpsRequests` for queued requests

### Low Cache Hit Rate

If cache hit rate is low:

1. Increase cache size (`maxEntries` or `maxSize`)
2. Increase TTL if data freshness allows
3. Implement cache warming for critical data
4. Review cache key generation logic

### High P99 Latency

If P99 latency is high:

1. Identify bottlenecks using `getBottlenecks()`
2. Check for slow database queries
3. Review batch operation sizes
4. Consider implementing timeouts
5. Profile requests to find slow phases

### Memory Issues

If experiencing memory issues:

1. Reduce cache sizes
2. Enable automatic cleanup
3. Monitor memory usage with `MemoryMonitor`
4. Check for memory leaks in long-running operations
5. Implement proper resource cleanup

## Examples

See the following files for complete examples:

- `src/aws/dynamodb/client.ts` - Connection pooling integration
- `src/aws/s3/client.ts` - Connection pooling integration
- `src/aws/bedrock/client.ts` - Caching integration
- `src/services/analytics/news-service.ts` - Custom caching implementation

## API Reference

For detailed API documentation, see the TypeScript definitions in each module file.
