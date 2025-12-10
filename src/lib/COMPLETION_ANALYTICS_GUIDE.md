# Workflow Completion Time Analytics Guide

## Overview

The Workflow Completion Time Analytics utility provides average completion time calculations for workflow presets. This helps users understand how long workflows typically take and plan their time accordingly.

**Requirements**: 8.5

## Features

- **Average Completion Time**: Calculate mean completion time across all users
- **Performance Caching**: In-memory cache with 1-hour TTL
- **Automatic Updates**: Cache updates automatically when workflows complete
- **Cache Management**: Clear and inspect cache for monitoring

## Usage

### Getting Average Completion Time

```typescript
import { getAverageCompletionTime } from "@/lib/workflow-completion-analytics";

// Get cached average (if available)
const avgTime = await getAverageCompletionTime("launch-your-brand");
console.log(`Average time: ${avgTime} minutes`);

// Force refresh from database
const freshAvgTime = await getAverageCompletionTime("launch-your-brand", true);
```

### Automatic Cache Updates

The cache is automatically updated when workflows are completed through the `WorkflowInstanceService`:

```typescript
import { getWorkflowInstanceService } from "@/lib/workflow-instance-service";

const service = getWorkflowInstanceService();

// This automatically updates the completion time cache
await service.completeWorkflow(userId, instanceId);
```

### Manual Cache Updates

If you need to manually update the cache:

```typescript
import { updateCompletionTimeCache } from "@/lib/workflow-completion-analytics";

// Update cache with a new completion time
await updateCompletionTimeCache("launch-your-brand", 42);
```

### Cache Management

```typescript
import {
  clearCompletionTimeCache,
  getCompletionTimeCacheStats,
} from "@/lib/workflow-completion-analytics";

// Clear cache for a specific preset
clearCompletionTimeCache("launch-your-brand");

// Clear entire cache
clearCompletionTimeCache();

// Get cache statistics
const stats = getCompletionTimeCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log("Cached entries:", stats.entries);
```

## Implementation Details

### Caching Strategy

- **TTL**: 1 hour (3600000 ms)
- **Storage**: In-memory Map
- **Update**: Incremental average calculation
- **Expiration**: Automatic on read

### Average Calculation

The average is calculated using the formula:

```
New Average = (Old Average × Old Count + New Value) / (Old Count + 1)
```

This allows for efficient incremental updates without recalculating from all instances.

### Data Source

**Current Implementation**: The utility uses an in-memory cache that is updated incrementally as workflows complete. The initial cache population happens when workflows are completed.

**Production Considerations**: For a production system with many users, you should implement one of these approaches:

1. **Analytics Table**: Create a separate DynamoDB table with `presetId` as partition key to store aggregated statistics
2. **DynamoDB Streams**: Use streams to automatically aggregate completion times into a summary table
3. **Scheduled Job**: Run a periodic job to pre-calculate and cache average times
4. **GSI**: Add a Global Secondary Index with `presetId` as partition key and `status` as sort key

## Integration Points

### Workflow Instance Service

The `WorkflowInstanceService.completeWorkflow()` method automatically calls `updateCompletionTimeCache()` to keep the cache up-to-date.

### Dashboard Widget

Display average completion times in workflow preset cards:

```typescript
import { getAverageCompletionTime } from "@/lib/workflow-completion-analytics";

const avgTime = await getAverageCompletionTime(preset.id);
const displayTime = avgTime || preset.estimatedMinutes;
```

### Workflow Detail Modal

Show both estimated and average completion times:

```typescript
const avgTime = await getAverageCompletionTime(preset.id);

<div>
  <p>Estimated: {preset.estimatedMinutes} minutes</p>
  {avgTime && <p>Average: {avgTime} minutes (based on user data)</p>}
</div>;
```

## Example: Complete Integration

```typescript
// In a server action or API route
import { getWorkflowInstanceService } from "@/lib/workflow-instance-service";
import { getAverageCompletionTime } from "@/lib/workflow-completion-analytics";
import { getWorkflowPresets } from "@/lib/workflow-presets";

export async function getWorkflowPresetsWithAnalytics() {
  const presets = getWorkflowPresets();

  // Enrich presets with average completion times
  const presetsWithAnalytics = await Promise.all(
    presets.map(async (preset) => {
      const avgTime = await getAverageCompletionTime(preset.id);
      return {
        ...preset,
        averageCompletionMinutes: avgTime,
      };
    })
  );

  return presetsWithAnalytics;
}

export async function completeWorkflowAction(
  userId: string,
  instanceId: string
) {
  const service = getWorkflowInstanceService();

  // This automatically updates the completion time cache
  await service.completeWorkflow(userId, instanceId);

  return { success: true };
}
```

## Testing

### Unit Tests

Test the analytics utility functions:

```typescript
import {
  getAverageCompletionTime,
  updateCompletionTimeCache,
  clearCompletionTimeCache,
  getCompletionTimeCacheStats,
} from "@/lib/workflow-completion-analytics";

describe("Workflow Completion Analytics", () => {
  beforeEach(() => {
    clearCompletionTimeCache();
  });

  it("should return null for uncached preset", async () => {
    const avg = await getAverageCompletionTime("test-preset");
    expect(avg).toBeNull();
  });

  it("should cache completion time", async () => {
    await updateCompletionTimeCache("test-preset", 30);
    const avg = await getAverageCompletionTime("test-preset");
    expect(avg).toBe(30);
  });

  it("should calculate incremental average", async () => {
    await updateCompletionTimeCache("test-preset", 30);
    await updateCompletionTimeCache("test-preset", 40);
    const avg = await getAverageCompletionTime("test-preset");
    expect(avg).toBe(35); // (30 + 40) / 2
  });

  it("should provide cache statistics", async () => {
    await updateCompletionTimeCache("preset-1", 30);
    await updateCompletionTimeCache("preset-2", 40);

    const stats = getCompletionTimeCacheStats();
    expect(stats.size).toBe(2);
    expect(stats.entries).toHaveLength(2);
  });
});
```

### Integration Tests

Test the integration with workflow completion:

```typescript
import { getWorkflowInstanceService } from "@/lib/workflow-instance-service";
import { getAverageCompletionTime } from "@/lib/workflow-completion-analytics";

describe("Workflow Completion Integration", () => {
  it("should update cache when workflow completes", async () => {
    const service = getWorkflowInstanceService();

    // Create and complete a workflow
    const instance = await service.createInstance(userId, preset);
    await service.completeWorkflow(userId, instance.id, 45);

    // Check that cache was updated
    const avg = await getAverageCompletionTime(preset.id);
    expect(avg).toBe(45);
  });
});
```

## Performance Considerations

### Cache Hit Rate

Monitor cache hit rate to ensure effective caching:

```typescript
const stats = getCompletionTimeCacheStats();
console.log(`Cached presets: ${stats.size}`);
```

### Memory Usage

The cache stores minimal data per preset:

- Average time (number)
- Sample size (number)
- Timestamps (strings)

Estimated memory per entry: ~200 bytes
For 100 presets: ~20 KB

### Cache Invalidation

Cache entries automatically expire after 1 hour. To manually invalidate:

```typescript
// Clear specific preset
clearCompletionTimeCache("launch-your-brand");

// Clear all (e.g., after bulk data import)
clearCompletionTimeCache();
```

## Future Enhancements

1. **Persistent Cache**: Store cache in Redis or DynamoDB for multi-instance deployments
2. **Percentile Metrics**: Track P50, P90, P95 completion times
3. **Trend Analysis**: Track how average times change over time
4. **User Segmentation**: Calculate averages by user type or experience level
5. **Outlier Detection**: Identify and exclude outlier completion times
6. **Real-time Updates**: Use WebSockets to push updated averages to clients

## Troubleshooting

### Cache Not Updating

**Problem**: Average time not updating after workflow completion

**Solution**: Ensure `completeWorkflow()` is called through `WorkflowInstanceService`, not directly on the repository.

### Stale Cache Data

**Problem**: Cache showing old data

**Solution**: Cache expires after 1 hour. Force refresh with:

```typescript
const freshAvg = await getAverageCompletionTime(presetId, true);
```

### Missing Average Times

**Problem**: `getAverageCompletionTime()` returns null

**Solution**: This is expected when:

- No workflows have been completed for this preset
- Cache has expired and no database query is implemented
- All completed workflows have `actualMinutes` = 0 or undefined

## Related Files

- `src/lib/workflow-completion-analytics.ts` - Main utility implementation
- `src/lib/workflow-instance-service.ts` - Service that updates cache
- `src/types/workflows.ts` - Type definitions
- `src/aws/dynamodb/workflow-repository.ts` - Database operations

## API Reference

### `getAverageCompletionTime(presetId, forceRefresh?)`

Gets the average completion time for a workflow preset.

**Parameters**:

- `presetId` (string): Workflow preset ID
- `forceRefresh` (boolean, optional): Bypass cache and recalculate

**Returns**: `Promise<number | null>` - Average time in minutes, or null if no data

### `updateCompletionTimeCache(presetId, actualMinutes)`

Updates the cache with a new completion time.

**Parameters**:

- `presetId` (string): Workflow preset ID
- `actualMinutes` (number): Completion time in minutes

**Returns**: `Promise<void>`

### `clearCompletionTimeCache(presetId?)`

Clears the cache for a specific preset or all presets.

**Parameters**:

- `presetId` (string, optional): Preset ID to clear, or undefined to clear all

**Returns**: `void`

### `getCompletionTimeCacheStats()`

Gets cache statistics for monitoring.

**Returns**: Object with `size` and `entries` array

## Conclusion

The Workflow Completion Time Analytics utility provides a simple, performant way to track and display average completion times. The in-memory cache with automatic updates ensures good performance while keeping the implementation straightforward.

For production deployments with many users, consider implementing one of the suggested database-backed approaches for more robust analytics.
