# Fallback Manager Quick Start

## 5-Minute Setup

### 1. Import and Initialize

```typescript
import { getFallbackManager } from "@/aws/bedrock/routing/fallback-manager";

// Get singleton instance with default config
const fallbackManager = getFallbackManager();
```

### 2. Execute Fallback

```typescript
// When a strand fails
try {
  const result = await executeStrand(strand, task);
} catch (error) {
  // Execute fallback
  const fallbackResult = await fallbackManager.executeFallback(
    strand,
    task,
    context,
    error
  );

  if (fallbackResult.success) {
    // Use fallback result
    return fallbackResult.result;
  } else {
    // All fallbacks failed
    throw fallbackResult.error;
  }
}
```

### 3. Check Statistics

```typescript
const stats = await fallbackManager.getStatistics("2024-01-01", "2024-01-31");

console.log(`Success rate: ${stats.successRate * 100}%`);
```

## Common Use Cases

### Retry on Timeout

```typescript
const result = await fallbackManager.executeFallback(
  failedStrand,
  task,
  context,
  new Error("Timeout: Request exceeded 30 seconds")
);
// Automatically retries with exponential backoff
```

### Alternative Strand

```typescript
// Register alternative strand
fallbackManager.registerStrategy({
  id: "backup_strand",
  name: "Backup content generator",
  alternativeStrand: backupStrand,
});

// Will automatically use backup if primary fails
```

### Human Review

```typescript
const context = {
  userId: "user_123",
  priority: "high",
  humanReviewAvailable: true, // Enable human review
};

const result = await fallbackManager.executeFallback(
  failedStrand,
  task,
  context,
  error
);
// Routes to human review if other strategies fail
```

## Configuration

### Custom Settings

```typescript
import { FallbackManager } from "@/aws/bedrock/routing/fallback-manager";

const fallbackManager = new FallbackManager({
  maxAttempts: 5, // Try up to 5 times
  initialBackoffMs: 2000, // Start with 2s delay
  maxBackoffMs: 30000, // Max 30s delay
  backoffMultiplier: 3, // 3x increase each time
  enableTracking: true, // Track all fallbacks
  enableStrategyLearning: true, // Learn from outcomes
});
```

### Disable Backoff

```typescript
const fallbackManager = new FallbackManager({
  enableBackoff: false, // No delays between retries
  maxAttempts: 3,
});
```

## Monitoring

### Get Recent Failures

```typescript
const failedRecords = fallbackManager.getTrackingRecords({
  success: false,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
});

console.log(`Failed fallbacks in last 24h: ${failedRecords.length}`);
```

### Check Strategy Performance

```typescript
const stats = await fallbackManager.getStatistics(startDate, endDate);

stats.effectiveStrategies.forEach(({ strategyId, successRate }) => {
  console.log(`${strategyId}: ${(successRate * 100).toFixed(1)}% success`);
});
```

## Best Practices

1. **Always handle fallback failures**

   ```typescript
   if (!fallbackResult.success) {
     // Escalate or abort
     await notifyAdmin(fallbackResult.error);
   }
   ```

2. **Monitor fallback rates**

   ```typescript
   if (stats.successRate < 0.8) {
     console.warn("High fallback failure rate!");
   }
   ```

3. **Use appropriate retry limits**

   ```typescript
   // Critical tasks: more attempts
   const criticalManager = new FallbackManager({ maxAttempts: 5 });

   // Routine tasks: fewer attempts
   const routineManager = new FallbackManager({ maxAttempts: 2 });
   ```

4. **Enable tracking in production**
   ```typescript
   const fallbackManager = getFallbackManager({
     enableTracking: true,
     trackingRetentionDays: 30,
   });
   ```

## Next Steps

- Read the [full implementation guide](./FALLBACK_MANAGER_IMPLEMENTATION.md)
- Check out [usage examples](./fallback-manager-example.ts)
- Review [routing types](./types.ts)
- Explore [adaptive router integration](./README.md)
