# Fallback Manager Implementation

## Overview

The FallbackManager is a sophisticated system for handling strand failures with automatic retry logic, intelligent fallback strategy selection, and comprehensive tracking. It ensures system resilience by providing multiple recovery paths when primary strands fail.

**Requirement:** 10.2 - Automatic fallback execution when primary strands fail

## Features

### 1. Automatic Fallback Execution

When a strand fails, the FallbackManager automatically:

- Selects appropriate fallback strategies based on error type
- Executes strategies in order of historical effectiveness
- Applies exponential backoff between retry attempts
- Tracks all attempts and outcomes

### 2. Intelligent Strategy Selection

The system analyzes failures and selects strategies based on:

- **Error Type**: Transient errors trigger retries, permanent errors trigger alternatives
- **Task Complexity**: Complex tasks can be simplified for retry
- **Historical Performance**: Strategies are ranked by past success rates
- **Resource Availability**: Alternative strands and human review availability

### 3. Automatic Retry Logic

Built-in retry mechanism with:

- **Exponential Backoff**: Configurable initial delay, max delay, and multiplier
- **Max Attempts**: Configurable limit to prevent infinite loops
- **Smart Delays**: Longer delays for repeated failures
- **Transient Error Detection**: Automatic identification of temporary issues

### 4. Comprehensive Tracking

All fallback executions are tracked with:

- **Attempt History**: Detailed log of each attempt
- **Performance Metrics**: Success rates, execution times, costs
- **Strategy Effectiveness**: Which strategies work best
- **Failure Analysis**: Common failure reasons and patterns

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FallbackManager                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Strategy Selection Engine                   │    │
│  │  - Error type analysis                              │    │
│  │  - Historical performance ranking                   │    │
│  │  - Resource availability check                      │    │
│  │  - Strategy prioritization                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Execution Engine                            │    │
│  │  - Retry with backoff                               │    │
│  │  - Alternative strand execution                     │    │
│  │  - Task simplification                              │    │
│  │  - Human review routing                             │    │
│  │  - Model fallback                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Tracking & Analytics                        │    │
│  │  - Attempt logging                                  │    │
│  │  - Performance metrics                              │    │
│  │  - Strategy effectiveness                           │    │
│  │  - Failure pattern analysis                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Fallback Execution

```typescript
import { getFallbackManager } from "./fallback-manager";

const fallbackManager = getFallbackManager();

// When a strand fails
const result = await fallbackManager.executeFallback(
  failedStrand,
  task,
  context,
  error
);

if (result.success) {
  console.log("Fallback succeeded:", result.result);
} else {
  console.log("All fallback strategies failed:", result.error);
}
```

### Custom Configuration

```typescript
import { FallbackManager } from "./fallback-manager";

const fallbackManager = new FallbackManager({
  maxAttempts: 5,
  enableBackoff: true,
  initialBackoffMs: 2000,
  maxBackoffMs: 30000,
  backoffMultiplier: 3,
  enableTracking: true,
  trackingRetentionDays: 60,
  enableStrategyLearning: true,
});
```

### Register Custom Strategy

```typescript
const customStrategy = {
  id: "premium_fallback",
  name: "Premium model fallback",
  alternativeStrand: premiumStrand,
  retryWithBackoff: {
    initialDelayMs: 500,
    maxDelayMs: 5000,
    multiplier: 2,
  },
};

fallbackManager.registerStrategy(customStrategy);
```

### Get Statistics

```typescript
const stats = await fallbackManager.getStatistics(startDate, endDate);

console.log(`Success rate: ${stats.successRate * 100}%`);
console.log(`Avg attempts: ${stats.avgAttemptsPerFallback}`);
console.log(`Most effective strategies:`, stats.effectiveStrategies);
```

## Fallback Strategies

### 1. Retry with Backoff

Retries the same strand with exponential backoff delays.

**Best for:**

- Transient errors (timeouts, network issues)
- Rate limiting
- Temporary service unavailability

**Configuration:**

```typescript
{
    retryWithBackoff: {
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        multiplier: 2,
    }
}
```

### 2. Alternative Strand

Routes to a different strand of the same type.

**Best for:**

- Strand-specific failures
- Load balancing
- Performance issues

**Configuration:**

```typescript
{
  alternativeStrand: backupStrand;
}
```

### 3. Task Simplification

Simplifies the task and retries.

**Best for:**

- Complex tasks causing failures
- Resource constraints
- Input validation errors

**Configuration:**

```typescript
{
    modifiedTask: {
        input: simplifiedInput
    },
    simplifyModel: true
}
```

### 4. Human Review

Routes to human review queue.

**Best for:**

- Low confidence results
- Compliance-sensitive tasks
- Critical failures

**Configuration:**

```typescript
{
  routeToHuman: true;
}
```

### 5. Model Fallback

Uses a simpler/cheaper model.

**Best for:**

- Cost optimization
- Performance requirements
- Acceptable quality trade-offs

**Configuration:**

```typescript
{
  simplifyModel: true;
}
```

## Strategy Selection Logic

The FallbackManager selects strategies based on:

1. **Error Analysis**

   - Transient errors → Retry with backoff
   - Permanent errors → Alternative strand or simplification
   - Resource errors → Model fallback

2. **Historical Performance**

   - Strategies ranked by success rate
   - Recent performance weighted higher
   - Failed strategies deprioritized

3. **Resource Availability**

   - Check alternative strand availability
   - Verify human review capacity
   - Assess model options

4. **Task Characteristics**
   - Complex tasks → Simplification available
   - Simple tasks → Direct retry
   - Critical tasks → Human review preferred

## Tracking and Analytics

### Tracking Records

Each fallback execution creates a tracking record:

```typescript
{
    id: 'fallback_123',
    taskId: 'task_456',
    userId: 'user_789',
    failedStrand: { ... },
    result: {
        success: true,
        strategy: { ... },
        attempts: 2,
        totalTime: 3500,
        history: [ ... ]
    },
    context: { ... },
    createdAt: '2024-01-15T10:30:00Z'
}
```

### Statistics

Comprehensive statistics available:

```typescript
{
    totalAttempts: 150,
    successfulFallbacks: 135,
    failedFallbacks: 15,
    successRate: 0.90,
    avgAttemptsPerFallback: 1.8,
    avgFallbackTime: 2500,
    commonFailureReasons: [
        { reason: 'Timeout error', count: 8 },
        { reason: 'Rate limit exceeded', count: 5 }
    ],
    effectiveStrategies: [
        { strategyId: 'retry_with_backoff', successRate: 0.95 },
        { strategyId: 'alternative_strand', successRate: 0.88 }
    ]
}
```

### Filtering Records

Query tracking records with filters:

```typescript
// By user
const userRecords = fallbackManager.getTrackingRecords({
  userId: "user_123",
});

// By success
const failedRecords = fallbackManager.getTrackingRecords({
  success: false,
});

// By date range
const recentRecords = fallbackManager.getTrackingRecords({
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});
```

## Configuration Options

### FallbackManagerConfig

```typescript
{
    // Maximum fallback attempts
    maxAttempts: 3,

    // Enable exponential backoff
    enableBackoff: true,

    // Initial backoff delay in ms
    initialBackoffMs: 1000,

    // Maximum backoff delay in ms
    maxBackoffMs: 10000,

    // Backoff multiplier
    backoffMultiplier: 2,

    // Enable fallback tracking
    enableTracking: true,

    // Tracking retention days
    trackingRetentionDays: 30,

    // Enable strategy learning
    enableStrategyLearning: true
}
```

## Integration with AdaptiveRouter

The FallbackManager integrates seamlessly with the AdaptiveRouter:

```typescript
import { getAdaptiveRouter } from "./adaptive-router";
import { getFallbackManager } from "./fallback-manager";

const router = getAdaptiveRouter();
const fallbackManager = getFallbackManager();

// Route task
const decision = await router.routeTask(task, strands, context);

if (decision.action === "fallback") {
  // Execute fallback
  const fallbackResult = await fallbackManager.executeFallback(
    decision.selectedStrand,
    task,
    context,
    new Error("Primary execution failed")
  );

  // Handle result
  if (fallbackResult.success) {
    return fallbackResult.result;
  } else {
    // Escalate or abort
    throw fallbackResult.error;
  }
}
```

## Best Practices

### 1. Configure Appropriate Limits

```typescript
// For critical tasks
const criticalConfig = {
  maxAttempts: 5,
  maxBackoffMs: 30000,
  enableStrategyLearning: true,
};

// For routine tasks
const routineConfig = {
  maxAttempts: 3,
  maxBackoffMs: 10000,
  enableStrategyLearning: true,
};
```

### 2. Monitor Fallback Rates

```typescript
// Check fallback statistics regularly
const stats = await fallbackManager.getStatistics(startOfWeek, endOfWeek);

if (stats.successRate < 0.8) {
  console.warn("High fallback failure rate detected");
  // Investigate and adjust strategies
}
```

### 3. Register Domain-Specific Strategies

```typescript
// For real estate content generation
fallbackManager.registerStrategy({
  id: "real_estate_fallback",
  name: "Real estate specialized fallback",
  alternativeStrand: realEstateSpecialistStrand,
  retryWithBackoff: {
    initialDelayMs: 500,
    maxDelayMs: 5000,
    multiplier: 2,
  },
});
```

### 4. Use Strategy Learning

Enable strategy learning to automatically improve over time:

```typescript
const fallbackManager = getFallbackManager({
  enableStrategyLearning: true,
});

// System will automatically rank strategies by success rate
```

### 5. Clean Up Old Records

Tracking records are automatically cleaned up based on retention policy:

```typescript
const fallbackManager = getFallbackManager({
  trackingRetentionDays: 30, // Keep records for 30 days
});
```

## Error Handling

### Transient Errors

Automatically detected and retried:

- Timeout errors
- Network connection failures
- Rate limiting
- Temporary service unavailability

### Permanent Errors

Trigger alternative strategies:

- Invalid input
- Model unavailable
- Resource exhausted
- Configuration errors

### Fallback Exhaustion

When all strategies fail:

```typescript
const result = await fallbackManager.executeFallback(...);

if (!result.success) {
    // All strategies failed
    console.error('Fallback exhausted:', result.error);
    console.log('Attempts made:', result.attempts);
    console.log('History:', result.history);

    // Escalate to human or abort
    if (context.humanReviewAvailable) {
        await routeToHumanReview(task);
    } else {
        throw result.error;
    }
}
```

## Performance Considerations

### Backoff Delays

Exponential backoff prevents overwhelming failed services:

```
Attempt 1: 0ms delay
Attempt 2: 1000ms delay
Attempt 3: 2000ms delay
Attempt 4: 4000ms delay
Attempt 5: 8000ms delay (capped at maxBackoffMs)
```

### Strategy Caching

Strategies are cached in memory for fast access:

- No database lookups during execution
- Instant strategy retrieval
- Minimal overhead

### Tracking Overhead

Tracking is asynchronous and non-blocking:

- Records stored in memory
- Periodic batch writes to database
- Automatic cleanup of old records

## Testing

### Unit Tests

Test individual components:

```typescript
describe('FallbackManager', () => {
    it('should execute retry strategy', async () => {
        const manager = new FallbackManager();
        const result = await manager.executeFallback(...);
        expect(result.success).toBe(true);
    });
});
```

### Integration Tests

Test with real strands:

```typescript
it("should fallback to alternative strand", async () => {
  const manager = getFallbackManager();
  const result = await manager.executeFallback(
    failedStrand,
    task,
    context,
    error
  );
  expect(result.strategy.alternativeStrand).toBeDefined();
});
```

## Monitoring

### Key Metrics

Monitor these metrics in production:

1. **Fallback Rate**: Percentage of tasks requiring fallback
2. **Success Rate**: Percentage of successful fallbacks
3. **Average Attempts**: Average number of attempts per fallback
4. **Average Time**: Average time spent in fallback
5. **Strategy Effectiveness**: Success rate by strategy

### Alerts

Set up alerts for:

- High fallback rate (> 10%)
- Low success rate (< 80%)
- High average attempts (> 3)
- Specific error patterns

## Future Enhancements

1. **Machine Learning**: Predict optimal strategies based on task characteristics
2. **Dynamic Thresholds**: Adjust retry limits based on system load
3. **Cost Optimization**: Factor in cost when selecting strategies
4. **Parallel Fallbacks**: Try multiple strategies simultaneously
5. **Circuit Breaker**: Temporarily disable failing strategies

## Related Documentation

- [Adaptive Router](./README.md) - Main routing system
- [Routing Types](./types.ts) - Type definitions
- [Examples](./fallback-manager-example.ts) - Usage examples

## Support

For issues or questions:

1. Check the examples in `fallback-manager-example.ts`
2. Review the test cases
3. Consult the main routing documentation
