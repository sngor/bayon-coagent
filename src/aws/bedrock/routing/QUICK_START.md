# Adaptive Routing - Quick Start Guide

Get started with the adaptive routing system in 5 minutes.

## Installation

The adaptive routing system is already included in the AgentStrands enhancement. No additional installation required.

## Basic Usage

### 1. Import the Router

```typescript
import { getAdaptiveRouter } from "@/aws/bedrock/routing";
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { createWorkerTask } from "@/aws/bedrock/worker-protocol";
```

### 2. Create a Task

```typescript
const task = createWorkerTask({
  type: "content-generator",
  description: "Generate a blog post about real estate trends",
  input: {
    topic: "Real estate market trends 2024",
    tone: "professional",
    length: "medium",
  },
});
```

### 3. Define Routing Context

```typescript
const context = {
  userId: "user_123",
  priority: "normal", // 'low' | 'normal' | 'high' | 'urgent'
  confidenceThreshold: 0.7, // Minimum confidence for auto-execution
  humanReviewAvailable: true,
};
```

### 4. Route the Task

```typescript
const router = getAdaptiveRouter();
const agentCore = getAgentCore();

// Get available strands
const strands = agentCore.getStrandsByType(task.type);

// Route the task
const decision = await router.routeTask(task, strands, context);

console.log(`Action: ${decision.action}`);
console.log(`Confidence: ${decision.confidence.toFixed(2)}`);
console.log(`Selected: ${decision.selectedStrand.id}`);
```

### 5. Handle the Decision

```typescript
if (decision.action === "execute") {
  // Execute the task normally
  const result = await executeTask(task, decision.selectedStrand);

  // Check confidence after execution
  const action = await router.handleLowConfidence(task, result, context);

  if (action === "human-review") {
    // Route to human review
    await routeToHumanReview(task, result);
  }
} else if (decision.action === "human-review") {
  // Route directly to human review
  await routeToHumanReview(task, decision);
} else if (decision.action === "retry") {
  // Retry with updated context
  const retryContext = { ...context, retryCount: 1 };
  const newDecision = await router.routeTask(task, strands, retryContext);
}
```

## Common Scenarios

### Scenario 1: High-Priority Urgent Task

```typescript
const urgentTask = createWorkerTask({
  type: "data-analyst",
  description: "Analyze urgent market data",
  input: { urgency: "high" },
});

const urgentContext = {
  userId: "user_123",
  priority: "urgent", // Prioritizes speed
  confidenceThreshold: 0.6, // Lower threshold for urgent tasks
  humanReviewAvailable: false,
};

const decision = await router.routeTask(urgentTask, strands, urgentContext);
// Will select fastest available strand
```

### Scenario 2: Quality-Critical Task

```typescript
const qualityTask = createWorkerTask({
  type: "content-generator",
  description: "Generate client-facing content",
  input: { importance: "high" },
});

const qualityContext = {
  userId: "user_123",
  priority: "high", // Prioritizes quality
  confidenceThreshold: 0.8, // Higher threshold for quality
  humanReviewAvailable: true,
};

const decision = await router.routeTask(qualityTask, strands, qualityContext);
// Will select highest quality strand
```

### Scenario 3: With Load Balancing

```typescript
// Update load metrics for strands
router.updateLoadMetrics(strandId, {
  strandId,
  currentLoad: 0.6,
  avgResponseTime: 3000,
  successRate: 0.95,
  queueDepth: 5,
});

// Router will automatically consider load
const decision = await router.routeTask(task, strands, context);
// Will prefer less loaded strands
```

### Scenario 4: With Fallback

```typescript
// If primary strand fails
const fallback = await router.executeFallback(failedStrand, task, context);

if (fallback) {
  // Apply fallback strategy
  if (fallback.retryWithBackoff) {
    await delay(fallback.retryWithBackoff.initialDelayMs);
    // Retry task
  }
}
```

## Configuration

### Custom Confidence Thresholds

```typescript
const router = getAdaptiveRouter({
  confidenceThresholds: {
    autoExecute: 0.8, // Higher threshold
    humanReview: 0.6,
    retry: 0.4,
    abort: 0.2,
  },
});
```

### Disable Features

```typescript
const router = getAdaptiveRouter({
  enableLoadBalancing: false,
  enableDecisionLogging: false,
  enableFallbacks: false,
});
```

### Adjust Limits

```typescript
const router = getAdaptiveRouter({
  maxFallbackAttempts: 5,
  logRetentionDays: 60,
  maxQueueSize: 2000,
});
```

## Monitoring

### Get Analytics

```typescript
const startDate = new Date("2024-01-01").toISOString();
const endDate = new Date().toISOString();

const analytics = await router.getAnalytics(startDate, endDate);

console.log(`Total Decisions: ${analytics.totalDecisions}`);
console.log(`Avg Confidence: ${analytics.avgConfidence.toFixed(2)}`);
console.log(
  `Human Review Rate: ${(analytics.humanReviewRate * 100).toFixed(1)}%`
);
```

### Check Load Metrics

```typescript
const metrics = router.getLoadMetrics(strandId);

if (metrics) {
  console.log(`Load: ${(metrics.currentLoad * 100).toFixed(0)}%`);
  console.log(`Response Time: ${metrics.avgResponseTime}ms`);
  console.log(`Success Rate: ${(metrics.successRate * 100).toFixed(0)}%`);
}
```

## Best Practices

1. **Set Appropriate Thresholds**: Adjust based on your quality requirements
2. **Update Load Metrics**: Keep metrics current for accurate routing
3. **Handle All Actions**: Implement handlers for all routing actions
4. **Monitor Analytics**: Review regularly to optimize performance
5. **Use Priority Levels**: Set correct priority for time-sensitive tasks

## Troubleshooting

### Problem: All tasks going to human review

**Solution**: Lower the `humanReview` threshold or improve strand quality

### Problem: Poor routing decisions

**Solution**: Update load metrics and check strand performance

### Problem: High fallback rate

**Solution**: Review fallback strategies and improve strand reliability

## Next Steps

- Read the [full documentation](./README.md)
- Check out [integration examples](./INTEGRATION_GUIDE.md)
- Review [usage examples](./adaptive-router-example.ts)
- Explore [advanced features](./README.md#advanced-features)

## Support

For issues or questions:

1. Check the [README](./README.md)
2. Review [examples](./adaptive-router-example.ts)
3. See [integration guide](./INTEGRATION_GUIDE.md)
