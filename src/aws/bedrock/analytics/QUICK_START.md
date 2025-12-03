# Performance Tracker Quick Start

Get started with the Performance Tracker in 5 minutes.

## Installation

The Performance Tracker is already included in the AgentStrands enhancement system. No additional installation required.

## Basic Setup

### 1. Import the Tracker

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";
```

### 2. Create an Instance

```typescript
const tracker = createPerformanceTracker();
```

That's it! The tracker is ready to use with default configuration.

## Basic Usage

### Track Performance

```typescript
import { PerformanceMetrics } from "@/aws/bedrock/analytics";

// After executing a strand
const metrics: PerformanceMetrics = {
  executionTime: 2500, // milliseconds
  tokenUsage: 1500, // tokens
  cost: 0.045, // USD
  successRate: 1.0, // 0-1 (1.0 = 100%)
  userSatisfaction: 4.5, // 0-5
  qualityScore: 85, // 0-100
  timestamp: new Date().toISOString(),
};

await tracker.trackPerformance(
  "strand-id",
  "user-id",
  "task-id",
  "task-type",
  metrics
);
```

### Get Analytics

```typescript
const analytics = await tracker.getAnalytics({
  strandId: "strand-id",
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

console.log(`Total Tasks: ${analytics.totalTasks}`);
console.log(`Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`);
console.log(`Avg Quality: ${analytics.avgQualityScore.toFixed(0)}`);
```

### Detect Anomalies

```typescript
const anomalies = await tracker.detectAnomalies("strand-id", "7d");

if (anomalies.length > 0) {
  console.log(`⚠️ ${anomalies.length} anomalies detected`);
  anomalies.forEach((a) => {
    console.log(`  ${a.type}: ${a.description}`);
  });
}
```

### Generate Report

```typescript
const report = await tracker.generateReport("daily-summary", {
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

console.log(report.title);
console.log("Insights:", report.insights);
console.log("Recommendations:", report.recommendations);
```

## Common Patterns

### Pattern 1: Wrap Strand Execution

```typescript
async function executeWithTracking(strand, task) {
  const startTime = Date.now();

  try {
    const result = await strand.execute(task);

    await tracker.trackPerformance(strand.id, task.userId, task.id, task.type, {
      executionTime: Date.now() - startTime,
      tokenUsage: result.tokenUsage,
      cost: result.cost,
      successRate: 1.0,
      userSatisfaction: result.rating || 0,
      qualityScore: result.quality || 0,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    await tracker.trackPerformance(strand.id, task.userId, task.id, task.type, {
      executionTime: Date.now() - startTime,
      tokenUsage: 0,
      cost: 0,
      successRate: 0.0,
      userSatisfaction: 0,
      qualityScore: 0,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
```

### Pattern 2: Dashboard Data

```typescript
async function getDashboardData() {
  const analytics = await tracker.getAnalytics({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  return {
    totalTasks: analytics.totalTasks,
    successRate: `${(analytics.successRate * 100).toFixed(1)}%`,
    avgQuality: analytics.avgQualityScore.toFixed(0),
    totalCost: `$${analytics.totalCost.toFixed(2)}`,
  };
}
```

### Pattern 3: Health Check

```typescript
async function checkHealth(strandId: string) {
  const anomalies = await tracker.detectAnomalies(strandId, "1h");

  const critical = anomalies.filter((a) => a.severity === "critical");
  const high = anomalies.filter((a) => a.severity === "high");

  if (critical.length > 0) return "critical";
  if (high.length > 0) return "degraded";
  return "healthy";
}
```

## Configuration

### Custom Configuration

```typescript
const tracker = createPerformanceTracker({
  tableName: "my-table",
  enableAnomalyDetection: true,
  anomalyThresholds: {
    latencyMultiplier: 2.0,
    errorRateThreshold: 0.1,
    costMultiplier: 1.5,
    qualityDropThreshold: 20,
  },
  retentionDays: 90,
});
```

### Environment-Based Configuration

```typescript
const tracker = createPerformanceTracker({
  tableName: process.env.DYNAMODB_TABLE_NAME,
  enableAnomalyDetection: process.env.NODE_ENV === "production",
  retentionDays: process.env.NODE_ENV === "production" ? 90 : 30,
});
```

## Filters

### Filter by Strand

```typescript
const analytics = await tracker.getAnalytics({
  strandId: "strand-id",
});
```

### Filter by User

```typescript
const analytics = await tracker.getAnalytics({
  userId: "user-id",
});
```

### Filter by Task Type

```typescript
const analytics = await tracker.getAnalytics({
  taskType: "blog-post-generation",
});
```

### Filter by Date Range

```typescript
const analytics = await tracker.getAnalytics({
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-01-31T23:59:59Z",
});
```

### Filter by Quality

```typescript
const analytics = await tracker.getAnalytics({
  minQualityScore: 80, // Only high-quality tasks
});
```

### Combine Filters

```typescript
const analytics = await tracker.getAnalytics({
  strandId: "strand-id",
  taskType: "blog-post-generation",
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  minQualityScore: 70,
});
```

## Report Types

```typescript
// Daily summary
await tracker.generateReport("daily-summary", filters);

// Weekly summary
await tracker.generateReport("weekly-summary", filters);

// Monthly summary
await tracker.generateReport("monthly-summary", filters);

// Strand performance
await tracker.generateReport("strand-performance", filters);

// Cost analysis
await tracker.generateReport("cost-analysis", filters);

// Quality trends
await tracker.generateReport("quality-trends", filters);

// User satisfaction
await tracker.generateReport("user-satisfaction", filters);

// Bottleneck analysis
await tracker.generateReport("bottleneck-analysis", filters);
```

## Timeframes

Anomaly detection supports various timeframes:

```typescript
await tracker.detectAnomalies("strand-id", "1h"); // Last hour
await tracker.detectAnomalies("strand-id", "24h"); // Last 24 hours
await tracker.detectAnomalies("strand-id", "7d"); // Last 7 days
await tracker.detectAnomalies("strand-id", "30d"); // Last 30 days
```

## Error Handling

```typescript
try {
  await tracker.trackPerformance(/* ... */);
} catch (error) {
  console.error("Failed to track performance:", error);
  // Continue execution - tracking failures shouldn't break the app
}
```

## Best Practices

1. ✅ **Always track** - Track every strand execution
2. ✅ **Track failures** - Track failed executions with successRate: 0.0
3. ✅ **Use try-catch** - Don't let tracking errors break your app
4. ✅ **Filter wisely** - Use appropriate filters for efficient queries
5. ✅ **Monitor regularly** - Check for anomalies daily
6. ✅ **Act on alerts** - Respond to critical anomalies promptly

## Next Steps

- Read the [full documentation](./README.md)
- Check out [usage examples](./performance-tracker-example.ts)
- Learn about [integration patterns](./INTEGRATION_GUIDE.md)
- Implement Cost Monitor (Task 34)
- Build Analytics Dashboards (Task 36)

## Need Help?

- See [README.md](./README.md) for detailed documentation
- Check [performance-tracker-example.ts](./performance-tracker-example.ts) for more examples
- Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for integration patterns

## Summary

You now know how to:

- ✅ Create a performance tracker
- ✅ Track strand performance
- ✅ Get analytics
- ✅ Detect anomalies
- ✅ Generate reports
- ✅ Use filters
- ✅ Handle errors

Start tracking performance in your strands today! 🚀
