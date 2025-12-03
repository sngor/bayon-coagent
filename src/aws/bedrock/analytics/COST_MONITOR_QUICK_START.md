# Cost Monitor Quick Start Guide

Get started with cost monitoring in 5 minutes.

## Installation

The Cost Monitor is already included in the analytics module. No additional installation required.

## Quick Setup

### 1. Create Cost Monitor Instance

```typescript
import { createCostMonitor } from "@/aws/bedrock/analytics/cost-monitor";

const costMonitor = createCostMonitor({
  tableName: "bayon-coagent-dev",
  enableAlerts: true,
  alertThresholds: {
    perStrand: 50,
    perUser: 100,
    totalDaily: 500,
  },
});
```

### 2. Track Your First Cost

```typescript
import { CostOperation } from "@/aws/bedrock/analytics/types";

// Calculate cost
const cost = costMonitor.calculateOperationCost(
  "anthropic.claude-3-5-sonnet-20241022-v2:0",
  1500, // input tokens
  3000 // output tokens
);

// Track operation
const operation: CostOperation = {
  id: "op-123",
  strandId: "strand-content-generator",
  userId: "user-456",
  taskType: "blog-post-generation",
  model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  inputTokens: 1500,
  outputTokens: 3000,
  cost,
  timestamp: new Date().toISOString(),
  metadata: {},
};

await costMonitor.trackCost(operation);
```

### 3. Set Up Alerts

```typescript
costMonitor.setAlert(100, "user", (alert) => {
  console.log(`⚠️ Alert: ${alert.message}`);
  console.log(`Current: $${alert.currentCost.toFixed(2)}`);

  // Send notification (email, Slack, etc.)
  notifyAdmin(alert);
});
```

### 4. Get Cost Breakdown

```typescript
// Get costs by strand for last 7 days
const costs = await costMonitor.calculateCosts("strand", "7d");

console.log(`Total: $${costs.total.toFixed(2)}`);
costs.topDrivers.forEach((driver) => {
  console.log(`${driver.name}: $${driver.cost.toFixed(2)}`);
});
```

### 5. Get Optimization Suggestions

```typescript
const optimizations = await costMonitor.suggestOptimizations();

console.log(`Found ${optimizations.length} ways to save money:`);
optimizations.forEach((opt) => {
  console.log(`- ${opt.title}: Save $${opt.potentialSavings.toFixed(2)}`);
});
```

## Common Use Cases

### Track AI Operation Cost

```typescript
async function generateContent(prompt: string, userId: string) {
  const startTime = Date.now();

  // Call AI model
  const response = await invokeModel(prompt);

  // Calculate and track cost
  const cost = costMonitor.calculateOperationCost(
    response.model,
    response.inputTokens,
    response.outputTokens
  );

  await costMonitor.trackCost({
    id: `op-${Date.now()}`,
    strandId: "content-generator",
    userId,
    taskType: "content-generation",
    model: response.model,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    cost,
    timestamp: new Date().toISOString(),
    metadata: {
      executionTime: Date.now() - startTime,
    },
  });

  return response.content;
}
```

### Monitor User Costs

```typescript
async function getUserCostSummary(userId: string) {
  const summary = await costMonitor.getCostSummary("user", userId, "30d");

  return {
    totalSpent: summary.total,
    operations: summary.operations,
    averageCost: summary.avgCost,
    trend: summary.trend,
    status: summary.total > 100 ? "over-budget" : "within-budget",
  };
}
```

### Daily Cost Report

```typescript
async function generateDailyCostReport() {
  const costs = await costMonitor.calculateCosts("user", "1d");
  const optimizations = await costMonitor.suggestOptimizations();

  return {
    date: new Date().toISOString().split("T")[0],
    totalCost: costs.total,
    topUsers: costs.topDrivers.slice(0, 5),
    optimizationOpportunities: optimizations.length,
    potentialSavings: optimizations.reduce(
      (sum, opt) => sum + opt.potentialSavings,
      0
    ),
  };
}
```

## Model Cost Comparison

Quick reference for choosing the right model:

| Task Type              | Recommended Model | Cost per 1K tokens  |
| ---------------------- | ----------------- | ------------------- |
| Simple text generation | Claude Haiku      | $0.00025 - $0.00125 |
| Blog posts, articles   | Claude Sonnet     | $0.003 - $0.015     |
| Complex analysis       | Claude Sonnet     | $0.003 - $0.015     |
| Critical content       | Claude Opus       | $0.015 - $0.075     |

**Example Savings:**

- Switching from Sonnet to Haiku for simple tasks: **~90% cost reduction**
- Using Haiku for 1000 simple operations: **Save ~$40**

## Timeframe Formats

Use these formats for time-based queries:

- `1h` - Last 1 hour
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days
- `1w` - Last 1 week
- `1m` - Last 1 month
- `1y` - Last 1 year

## Alert Thresholds

Recommended thresholds by user tier:

### Free Tier

```typescript
{
  perUser: 10,      // $10/day
  totalDaily: 100,  // $100/day total
}
```

### Pro Tier

```typescript
{
  perUser: 50,      // $50/day
  totalDaily: 500,  // $500/day total
}
```

### Enterprise Tier

```typescript
{
  perUser: 200,     // $200/day
  totalDaily: 2000, // $2000/day total
}
```

## Quick Wins

### 1. Use Haiku for Simple Tasks

```typescript
// Before: Using Sonnet for everything
const cost = costMonitor.calculateOperationCost(
  "anthropic.claude-3-5-sonnet-20241022-v2:0",
  500,
  800
); // ~$0.016

// After: Using Haiku for simple tasks
const cost = costMonitor.calculateOperationCost(
  "anthropic.claude-3-haiku-20240307-v1:0",
  500,
  800
); // ~$0.001

// Savings: 93%
```

### 2. Implement Caching

```typescript
const cache = new Map<string, string>();

async function generateWithCache(prompt: string) {
  // Check cache first
  if (cache.has(prompt)) {
    return cache.get(prompt); // $0 cost
  }

  // Generate and cache
  const result = await generate(prompt);
  cache.set(prompt, result);
  return result;
}
```

### 3. Control Output Length

```typescript
// Before: Unlimited output
const response = await invokeModel(prompt);

// After: Limit output tokens
const response = await invokeModel(prompt, {
  max_tokens: 1000, // Limit output
});

// Savings: ~50% on output costs
```

## Troubleshooting

### "No cost data found"

- Ensure you're calling `trackCost()` after operations
- Check DynamoDB table exists
- Verify IAM permissions

### "Alerts not triggering"

- Confirm `enableAlerts: true`
- Check threshold values
- Verify callback is registered

### "High costs"

- Run `suggestOptimizations()`
- Review model selection
- Check token usage patterns

## Next Steps

1. ✅ Set up cost tracking
2. ✅ Configure alerts
3. 📊 Review daily costs
4. 💡 Implement optimizations
5. 📈 Monitor trends

## Resources

- [Full Implementation Guide](./COST_MONITOR_IMPLEMENTATION.md)
- [Usage Examples](./cost-monitor-example.ts)
- [Analytics Types](./types.ts)
- [Integration Guide](./INTEGRATION_GUIDE.md)

## Support

For questions or issues:

1. Check the [Implementation Guide](./COST_MONITOR_IMPLEMENTATION.md)
2. Review [examples](./cost-monitor-example.ts)
3. Check error logs in CloudWatch
