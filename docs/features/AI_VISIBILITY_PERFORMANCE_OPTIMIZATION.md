# AI Visibility Performance Optimization

This document describes the performance optimizations implemented for the AI Search Monitoring feature.

## Overview

The AI Visibility feature has been optimized for performance through multiple strategies:

1. **Caching Layer** - 24-hour TTL cache for AI responses and visibility data
2. **Lazy Loading** - Deferred loading of mention details until expanded
3. **Pagination** - Efficient pagination for large mention lists
4. **Database Indexes** - GSI1 index for efficient date range queries
5. **Batch Processing** - Optimized parallel processing for multiple agents

## Caching Layer

### Implementation

The `AIVisibilityCacheService` provides an in-memory caching layer with 24-hour TTL for:

- Visibility scores
- AI mentions (with filtering)
- Monitoring configurations
- Competitor visibility data

### Usage

```typescript
import {
  getAIVisibilityCacheService,
  invalidateAIVisibilityCache,
} from "@/lib/ai-visibility-cache";

// Get cache instance
const cache = getAIVisibilityCacheService();

// Get cached visibility score
const score = await cache.getVisibilityScore(userId);

// Get cached mentions with filtering
const mentions = await cache.getMentions(userId, {
  limit: 20,
  platform: "chatgpt",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
});

// Force refresh from database
const freshScore = await cache.getVisibilityScore(userId, true);

// Invalidate cache after updates
invalidateAIVisibilityCache(userId);

// Invalidate specific cache type
invalidateAIVisibilityCache(userId, "visibility-score");
```

### Cache Keys

Cache keys are generated based on:

- Cache type (visibility-score, mentions, config, etc.)
- User ID
- Query parameters (for filtered queries)

Example keys:

- `visibility-score:user-123`
- `mentions-filtered:user-123:limit=20&platform=chatgpt`
- `config:user-123`

### Cache Invalidation

Cache is automatically invalidated when:

- New monitoring data is collected
- User updates monitoring configuration
- Manual refresh is triggered

### Cache Statistics

```typescript
const stats = cache.getStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Cache entries:`, stats.entries);
```

## Lazy Loading

### Mention Details

Mention details (full response, sentiment analysis, topics, expertise areas) are only rendered when the user expands a mention. This reduces initial render time and memory usage.

### Implementation

```typescript
<CollapsibleContent className="mt-4 space-y-4">
  {isExpanded && (
    <>
      {/* Full response and details only loaded when expanded */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-2">Full Response</h4>
        <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md max-h-96 overflow-y-auto">
          {highlightAgentName(mention.response, agentName)}
        </div>
      </div>
      {/* Additional details... */}
    </>
  )}
</CollapsibleContent>
```

### Benefits

- Faster initial page load
- Reduced memory usage
- Better performance with large mention lists
- Improved user experience (progressive disclosure)

## Pagination

### Client-Side Pagination

The `AIMentionsList` component implements efficient client-side pagination:

- 10 items per page (configurable)
- Pagination controls (Previous/Next)
- Page indicator
- Automatic reset when filters change

### Implementation

```typescript
const ITEMS_PER_PAGE = 10;

// Calculate pagination
const totalPages = Math.ceil(filteredMentions.length / ITEMS_PER_PAGE);
const paginatedMentions = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return filteredMentions.slice(start, end);
}, [filteredMentions, currentPage]);
```

### Server-Side Pagination

For very large datasets, the repository supports pagination with `lastEvaluatedKey`:

```typescript
const result = await repository.query(`USER#${userId}`, "AI_MENTION#", {
  limit: 20,
  exclusiveStartKey: lastEvaluatedKey,
  scanIndexForward: false,
});

// Get next page
const nextPageKey = result.lastEvaluatedKey;
```

## Database Indexes

### GSI1 Index

The DynamoDB table uses GSI1 for efficient date range queries:

```typescript
// Query mentions by date range using GSI1
const result = await repository.queryAIMentionsByDateRange(
  userId,
  startDate,
  endDate,
  {
    limit: 100,
    scanIndexForward: false, // Most recent first
  }
);
```

### Index Structure

- **GSI1PK**: `USER#${userId}`
- **GSI1SK**: `AI_MENTION_BY_DATE#${timestamp}`

This allows efficient queries for:

- All mentions for a user
- Mentions within a date range
- Most recent mentions first

### Query Performance

- Date range queries: O(log n) + O(k) where k is the number of results
- No table scans required
- Efficient filtering by date

## Batch Processing

### Parallel Processing

The `AIVisibilityBatchProcessor` optimizes processing for multiple agents:

```typescript
import { createBatchProcessor } from "@/lib/ai-visibility-batch-processor";

const processor = createBatchProcessor();

// Process multiple users in parallel
const result = await processor.processBatch(["user-1", "user-2", "user-3"], {
  maxConcurrency: 5,
  batchDelay: 1000,
  continueOnError: true,
  onProgress: (completed, total, userId) => {
    console.log(`Progress: ${completed}/${total} - ${userId}`);
  },
});

console.log(
  `Processed: ${result.successful} successful, ${result.failed} failed`
);
```

### Priority Processing

Process high-priority users first:

```typescript
const result = await processor.processBatchWithPriority(
  [
    { userId: "user-1", priority: "high" },
    { userId: "user-2", priority: "normal" },
    { userId: "user-3", priority: "low" },
  ],
  {
    maxConcurrency: 5,
  }
);
```

### Batch Size Estimation

```typescript
// Get recommended batch size based on system load
const batchSize = processor.getRecommendedBatchSize();

// Estimate processing time
const estimatedTime = processor.estimateBatchTime(
  userCount,
  avgTimePerUser,
  concurrency
);
```

### Error Handling

- `continueOnError: true` - Continue processing remaining users on error
- `continueOnError: false` - Stop on first error
- Individual results include success/failure status and error messages

## Performance Metrics

### Cache Hit Rates

Monitor cache performance:

```typescript
const stats = cache.getStats();
console.log(`Cache entries: ${stats.size}`);
stats.entries.forEach((entry) => {
  console.log(`Key: ${entry.key}, Age: ${entry.age}ms, TTL: ${entry.ttl}ms`);
});
```

### Batch Processing Metrics

```typescript
const result = await processor.processBatch(userIds);
console.log(`Total time: ${result.executionTime}ms`);
console.log(
  `Average time per user: ${result.executionTime / result.totalProcessed}ms`
);
console.log(
  `Success rate: ${(result.successful / result.totalProcessed) * 100}%`
);
```

## Best Practices

### Caching

1. **Use cache for read-heavy operations** - Visibility scores, mentions, configs
2. **Invalidate cache after writes** - Always invalidate after new data is added
3. **Force refresh when needed** - Use `forceRefresh: true` for critical operations
4. **Monitor cache size** - Check stats periodically to ensure cache isn't growing too large

### Lazy Loading

1. **Load details on demand** - Only render expanded content when needed
2. **Use max-height with overflow** - Prevent very long responses from breaking layout
3. **Implement virtual scrolling** - For lists with 100+ items

### Pagination

1. **Use appropriate page size** - 10-20 items for mentions, 50-100 for simple lists
2. **Reset page on filter change** - Avoid showing empty pages
3. **Show total count** - Help users understand dataset size
4. **Implement server-side pagination** - For datasets with 1000+ items

### Batch Processing

1. **Set appropriate concurrency** - 5-10 for API-heavy operations
2. **Add delays between batches** - Prevent overwhelming external APIs
3. **Handle errors gracefully** - Use `continueOnError: true` for non-critical operations
4. **Monitor progress** - Use progress callbacks for long-running batches
5. **Prioritize active users** - Process high-priority users first

## Monitoring

### Cache Performance

```typescript
// Log cache stats periodically
setInterval(() => {
  const stats = cache.getStats();
  console.log("[Cache] Size:", stats.size);
  console.log("[Cache] Entries:", stats.entries.length);
}, 60000); // Every minute
```

### Batch Processing Performance

```typescript
// Log batch processing metrics
const result = await processor.processBatch(userIds, {
  onProgress: (completed, total, userId) => {
    console.log(
      `[Batch] Progress: ${completed}/${total} (${Math.round(
        (completed / total) * 100
      )}%)`
    );
  },
});

console.log("[Batch] Total time:", result.executionTime);
console.log(
  "[Batch] Success rate:",
  (result.successful / result.totalProcessed) * 100
);
```

## Future Optimizations

### Potential Improvements

1. **Redis Cache** - Replace in-memory cache with Redis for distributed caching
2. **Virtual Scrolling** - Implement virtual scrolling for very large mention lists
3. **Incremental Loading** - Load mentions incrementally as user scrolls
4. **Query Optimization** - Add more GSI indexes for specific query patterns
5. **Compression** - Compress large responses before caching
6. **CDN Caching** - Cache static assets and reports on CDN
7. **Background Sync** - Sync cache in background for frequently accessed data

### Performance Targets

- Cache hit rate: > 80%
- Page load time: < 2 seconds
- Mention expansion: < 100ms
- Batch processing: < 30 seconds per user
- Database queries: < 500ms

## Troubleshooting

### Cache Issues

**Problem**: Cache not invalidating after updates
**Solution**: Ensure `invalidateAIVisibilityCache()` is called after data updates

**Problem**: Memory usage growing
**Solution**: Check cache stats and reduce TTL if needed

### Pagination Issues

**Problem**: Empty pages after filtering
**Solution**: Reset `currentPage` to 1 when filters change

**Problem**: Slow pagination
**Solution**: Reduce page size or implement virtual scrolling

### Batch Processing Issues

**Problem**: Batch processing timing out
**Solution**: Reduce concurrency or increase timeout

**Problem**: Too many API errors
**Solution**: Increase delay between batches

## Related Documentation

- [AI Monitoring Scheduled Execution](./AI_MONITORING_SCHEDULED_EXECUTION.md)
- [AI Cost Control](./AI_COST_CONTROL.md)
- [AI Monitoring Error Handling](./AI_MONITORING_ERROR_HANDLING.md)
