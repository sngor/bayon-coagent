# Cost Monitor Implementation

## Overview

The Cost Monitor is a comprehensive system for tracking AI operation costs, monitoring token usage, calculating costs by various dimensions, providing cost alerts, and suggesting optimizations. It implements **Requirement 9.2** from the AgentStrands enhancement specification.

## Features

### 1. Cost Tracking

- Track costs for every AI operation
- Record token usage (input and output)
- Associate costs with strands, users, and task types
- Store historical cost data in DynamoDB

### 2. Cost Calculation by Dimension

- Calculate costs by strand
- Calculate costs by user
- Calculate costs by task type
- Identify top cost drivers
- Generate cost breakdowns with percentages

### 3. Cost Alerting

- Set custom thresholds per dimension
- Real-time alert triggering
- Multiple alert callbacks
- Alert severity levels
- Historical alert tracking

### 4. Optimization Suggestions

- Identify high token usage patterns
- Detect expensive models on simple tasks
- Find caching opportunities
- Suggest output length controls
- Recommend batch processing

### 5. Cost Analytics

- Cost summaries by dimension
- Trend analysis (increasing/decreasing/stable)
- Average cost per operation
- Time-based cost tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cost Monitor                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Cost Tracking                            │  │
│  │  - Track operation costs                              │  │
│  │  - Calculate costs from token usage                   │  │
│  │  - Store in DynamoDB                                  │  │
│  │  - Update cost cache                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Cost Calculation                         │  │
│  │  - Calculate by strand                                │  │
│  │  - Calculate by user                                  │  │
│  │  - Calculate by task type                             │  │
│  │  - Identify top drivers                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Alert System                             │  │
│  │  - Monitor thresholds                                 │  │
│  │  - Trigger alerts                                     │  │
│  │  - Execute callbacks                                  │  │
│  │  - Store alert history                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Optimization Engine                      │  │
│  │  - Analyze usage patterns                             │  │
│  │  - Identify inefficiencies                            │  │
│  │  - Generate suggestions                               │  │
│  │  - Calculate potential savings                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   DynamoDB    │
                    │  Cost Records │
                    │     Alerts    │
                    └───────────────┘
```

## Data Model

### Cost Record Entity

```typescript
{
  PK: "USER#{userId}",
  SK: "COST#{timestamp}#{strandId}",
  entityType: "CostRecord",
  userId: string,
  strandId: string,
  operation: {
    id: string,
    strandId: string,
    userId: string,
    taskType: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    cost: number,
    timestamp: string,
    metadata: Record<string, any>
  },
  createdAt: string,
  ttl: number
}
```

### Cost Alert Entity

```typescript
{
  PK: "ALERT#{dimension}#{dimensionValue}",
  SK: "ALERT#{timestamp}",
  entityType: "CostAlert",
  alert: {
    id: string,
    type: "threshold-exceeded" | "unusual-spike" | "budget-warning",
    severity: "low" | "medium" | "high",
    message: string,
    currentCost: number,
    threshold: number,
    dimension: string,
    dimensionValue: string,
    triggeredAt: string
  },
  createdAt: string
}
```

## Usage

### Basic Cost Tracking

```typescript
import { createCostMonitor } from "./cost-monitor";

const costMonitor = createCostMonitor({
  tableName: "bayon-coagent-dev",
  enableAlerts: true,
});

// Track a cost operation
const operation: CostOperation = {
  id: "op-123",
  strandId: "strand-content-generator",
  userId: "user-456",
  taskType: "blog-post-generation",
  model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  inputTokens: 1500,
  outputTokens: 3000,
  cost: costMonitor.calculateOperationCost(
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    1500,
    3000
  ),
  timestamp: new Date().toISOString(),
  metadata: {},
};

await costMonitor.trackCost(operation);
```

### Calculate Costs by Dimension

```typescript
// Get costs by strand for last 7 days
const strandCosts = await costMonitor.calculateCosts("strand", "7d");

console.log(`Total: $${strandCosts.total.toFixed(2)}`);
console.log("Top Drivers:");
strandCosts.topDrivers.forEach((driver) => {
  console.log(
    `  ${driver.name}: $${driver.cost.toFixed(2)} (${driver.percentage.toFixed(
      1
    )}%)`
  );
});

// Get costs by user
const userCosts = await costMonitor.calculateCosts("user", "30d");

// Get costs by task type
const taskCosts = await costMonitor.calculateCosts("task-type", "7d");
```

### Set Up Cost Alerts

```typescript
// Configure alert thresholds
const costMonitor = createCostMonitor({
  enableAlerts: true,
  alertThresholds: {
    perStrand: 50, // $50 per strand per day
    perUser: 100, // $100 per user per day
    perTaskType: 75, // $75 per task type per day
    totalDaily: 500, // $500 total per day
  },
});

// Set up alert callback
costMonitor.setAlert(50, "strand", (alert) => {
  console.log(`Alert: ${alert.message}`);
  console.log(`Current: $${alert.currentCost}, Threshold: $${alert.threshold}`);

  // Send notification
  sendEmailAlert(alert);
  postToSlack(alert);
});
```

### Get Optimization Suggestions

```typescript
const optimizations = await costMonitor.suggestOptimizations();

optimizations.forEach((opt) => {
  console.log(`${opt.title}`);
  console.log(`  Potential Savings: $${opt.potentialSavings.toFixed(2)}`);
  console.log(`  Priority: ${opt.priority}`);
  console.log(`  Actions:`);
  opt.actions.forEach((action) => console.log(`    - ${action}`));
});
```

### Get Cost Summary

```typescript
const summary = await costMonitor.getCostSummary(
  "strand",
  "strand-content-generator",
  "30d"
);

console.log(`Total: $${summary.total.toFixed(2)}`);
console.log(`Operations: ${summary.operations}`);
console.log(`Average: $${summary.avgCost.toFixed(4)}`);
console.log(`Trend: ${summary.trend}`);
```

## Model Pricing

The Cost Monitor includes default pricing for Claude models:

| Model                | Input (per 1M tokens) | Output (per 1M tokens) |
| -------------------- | --------------------- | ---------------------- |
| Claude 3.5 Sonnet v2 | $3.00                 | $15.00                 |
| Claude 3.5 Sonnet    | $3.00                 | $15.00                 |
| Claude 3 Haiku       | $0.25                 | $1.25                  |
| Claude 3 Opus        | $15.00                | $75.00                 |

### Cost Calculation Example

For an operation with 2,000 input tokens and 4,000 output tokens using Claude 3.5 Sonnet:

```
Input cost:  (2,000 / 1,000) × $3.00  = $0.006
Output cost: (4,000 / 1,000) × $15.00 = $0.060
Total cost:  $0.066
```

## Optimization Strategies

### 1. Reduce Token Usage

- **Detection**: Operations using >10K tokens
- **Savings**: ~30%
- **Actions**:
  - Optimize prompt templates
  - Implement context window management
  - Use summarization for long inputs
  - Cache frequently used responses

### 2. Optimize Model Selection

- **Detection**: Simple tasks using expensive models
- **Savings**: ~50%
- **Actions**:
  - Use Claude Haiku for simple tasks
  - Implement model routing based on complexity
  - Create task complexity classifier

### 3. Implement Caching

- **Detection**: High-frequency operations with similar inputs
- **Savings**: ~60%
- **Actions**:
  - Implement response caching
  - Add cache invalidation strategy
  - Monitor cache hit rates

### 4. Control Output Length

- **Detection**: Outputs >2x input size
- **Savings**: ~25%
- **Actions**:
  - Add max_tokens parameter
  - Implement output length guidelines
  - Use structured outputs

### 5. Batch Processing

- **Detection**: Many similar operations in short time
- **Savings**: ~15%
- **Actions**:
  - Implement batch processing queue
  - Group similar operations
  - Optimize batch sizes

## Alert Types

### Threshold Exceeded

Triggered when costs exceed configured thresholds:

- Per strand daily limit
- Per user daily limit
- Per task type daily limit
- Total daily limit

### Unusual Spike

Triggered when costs increase significantly compared to baseline:

- Sudden 2x increase in hourly costs
- Unexpected high-cost operations
- Abnormal token usage patterns

### Budget Warning

Triggered when approaching budget limits:

- 80% of daily budget consumed
- 90% of monthly budget consumed
- Projected to exceed budget

## Performance Considerations

### Caching

- Daily costs cached in memory
- Cache cleared at day boundary
- Reduces database queries for alert checks

### Batch Operations

- Cost records written individually
- Alerts batched when multiple triggered
- Historical queries use pagination

### Data Retention

- Default: 90 days
- Configurable via `retentionDays`
- Automatic cleanup via DynamoDB TTL

## Integration with Other Systems

### Performance Tracker

```typescript
// Track both performance and cost
await performanceTracker.trackPerformance(strandId, userId, taskId, taskType, {
  executionTime: 2500,
  tokenUsage: inputTokens + outputTokens,
  cost: operation.cost,
  successRate: 1.0,
  userSatisfaction: 4.5,
  qualityScore: 85,
  timestamp: new Date().toISOString(),
});

await costMonitor.trackCost(operation);
```

### ROI Tracker

```typescript
// Calculate ROI including costs
const roi = await roiTracker.calculateROI(contentId, {
  creationCost: operation.cost,
  distributionCost: 0,
  revenue: 150,
});
```

## Best Practices

### 1. Always Calculate Costs

```typescript
// Calculate cost before tracking
const cost = costMonitor.calculateOperationCost(
  model,
  inputTokens,
  outputTokens
);

const operation: CostOperation = {
  // ... other fields
  cost,
};

await costMonitor.trackCost(operation);
```

### 2. Set Appropriate Thresholds

```typescript
// Set thresholds based on your budget
const costMonitor = createCostMonitor({
  alertThresholds: {
    perStrand: 25, // Adjust based on strand usage
    perUser: 50, // Adjust based on user tier
    perTaskType: 40, // Adjust based on task complexity
    totalDaily: 200, // Adjust based on total budget
  },
});
```

### 3. Monitor Regularly

```typescript
// Daily cost review
const dailyCosts = await costMonitor.calculateCosts("user", "1d");

// Weekly optimization check
const optimizations = await costMonitor.suggestOptimizations();

// Monthly trend analysis
const monthlySummary = await costMonitor.getCostSummary("user", userId, "30d");
```

### 4. Act on Optimizations

```typescript
const optimizations = await costMonitor.suggestOptimizations();

// Prioritize by savings and effort
const highPriority = optimizations.filter(
  (opt) => opt.priority === "high" && opt.effort !== "high"
);

// Implement top suggestions
for (const opt of highPriority) {
  console.log(`Implementing: ${opt.title}`);
  // Execute optimization actions
}
```

## Troubleshooting

### High Costs

1. Check cost breakdown by dimension
2. Review optimization suggestions
3. Analyze token usage patterns
4. Verify model selection

### Missing Cost Data

1. Verify DynamoDB table exists
2. Check IAM permissions
3. Confirm cost tracking calls
4. Review error logs

### Alerts Not Triggering

1. Verify `enableAlerts: true`
2. Check threshold configuration
3. Confirm callback registration
4. Review cost cache updates

## Next Steps

1. **Implement Cost Tracking**: Add cost tracking to all AI operations
2. **Set Up Alerts**: Configure thresholds and alert handlers
3. **Monitor Costs**: Review daily/weekly cost reports
4. **Optimize**: Implement suggested optimizations
5. **Iterate**: Continuously refine based on data

## Related Documentation

- [Performance Tracker](./TASK_33_COMPLETION.md)
- [ROI Tracker](./ROI_TRACKER_IMPLEMENTATION.md)
- [Analytics Types](./types.ts)
- [Integration Guide](./INTEGRATION_GUIDE.md)
