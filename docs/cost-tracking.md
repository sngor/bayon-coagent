# Cost Tracking Documentation

## Overview

The cost tracking system provides comprehensive monitoring and analysis of AWS Bedrock AI model usage costs. It tracks token usage, calculates costs per feature, and generates detailed reports for optimization analysis.

## Architecture

### Components

1. **Cost Tracker** (`src/aws/bedrock/cost-tracker.ts`)

   - Core cost calculation logic
   - Feature cost aggregation
   - Dashboard metrics generation
   - Cost comparison reports

2. **Cost Storage** (`src/aws/bedrock/cost-storage.ts`)

   - Stores execution logs in DynamoDB
   - Queries logs by date range
   - Manages log retention

3. **Execution Logger** (`src/aws/bedrock/execution-logger.ts`)

   - Automatically logs all AI flow executions
   - Captures token usage, model ID, execution time
   - Integrates with cost storage

4. **Server Actions** (`src/app/cost-tracking-actions.ts`)

   - Exposes cost tracking to the frontend
   - Provides dashboard metrics
   - Generates comparison reports

5. **CLI Tools** (`scripts/generate-cost-*.ts`)
   - Command-line report generation
   - Cost analysis utilities

## Model Pricing

Current pricing (per 1M tokens):

| Model                | Input Cost | Output Cost |
| -------------------- | ---------- | ----------- |
| Claude 3 Haiku       | $0.25      | $1.25       |
| Claude 3 Sonnet      | $3.00      | $15.00      |
| Claude 3.5 Sonnet v1 | $3.00      | $15.00      |
| Claude 3.5 Sonnet v2 | $3.00      | $15.00      |
| Claude 3 Opus        | $15.00     | $75.00      |

## Usage

### Automatic Tracking

All AI flow executions are automatically tracked when using the `definePrompt` function with execution metadata:

```typescript
import { definePrompt } from "@/aws/bedrock/flow-base";

const myFlow = definePrompt({
  name: "myFeature",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  prompt: "...",
  options: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.3,
    maxTokens: 2048,
  },
});

// Execute with user context for cost tracking
const result = await myFlow(input, { userId: user.userId });
```

### Server Actions

#### Get Dashboard Metrics

```typescript
import { getCostDashboardMetrics } from "@/app/cost-tracking-actions";

const { success, data, error } = await getCostDashboardMetrics(30); // Last 30 days

if (success && data) {
  console.log("Total cost:", data.currentPeriod.totalCost);
  console.log("Total invocations:", data.currentPeriod.totalInvocations);
  console.log("Monthly projection:", data.projections.monthlyProjection);
}
```

#### Get Feature Cost Summary

```typescript
import { getFeatureCostSummary } from "@/app/cost-tracking-actions";

const { success, data, error } = await getFeatureCostSummary(30);

if (success && data) {
  for (const [flowName, summary] of Object.entries(data)) {
    console.log(`${flowName}: $${summary.totalCost.toFixed(4)}`);
  }
}
```

#### Generate Cost Comparison

```typescript
import { getCostComparison } from "@/app/cost-tracking-actions";

// Compare last 30 days vs previous 60 days
const { success, data, error } = await getCostComparison(60, 30);

if (success && data) {
  console.log("Savings:", data.savings.absoluteSavings);
  console.log("Percentage:", data.savings.percentageSavings);
}
```

### CLI Tools

#### Generate Cost Report

```bash
# Generate report for a user
tsx scripts/generate-cost-report.ts <userId> [days]

# Example: Last 30 days
tsx scripts/generate-cost-report.ts user123 30
```

Output includes:

- Total cost and invocations
- Cost by category and model
- Top costly features
- Daily cost trends
- Detailed feature breakdown

#### Generate Cost Comparison

```bash
# Compare two periods
tsx scripts/generate-cost-comparison.ts <userId> [beforeDays] [afterDays]

# Example: Compare last 30 days vs previous 60 days
tsx scripts/generate-cost-comparison.ts user123 60 30
```

Output includes:

- Before/after comparison
- Absolute and percentage savings
- Savings by feature
- Monthly projections

## Data Storage

### DynamoDB Schema

Execution logs are stored with the following key pattern:

```
PK: USER#<userId>
SK: EXECUTION_LOG#<timestamp>#<flowName>
```

Attributes:

- `timestamp`: ISO 8601 timestamp
- `flowName`: Name of the AI flow
- `modelId`: Bedrock model identifier
- `executionTimeMs`: Execution duration
- `tokenUsage`: { input: number, output: number }
- `success`: boolean
- `error`: Optional error details
- `metadata`: Feature category, temperature, etc.

### Data Retention

Logs can be automatically cleaned up using the retention utility:

```typescript
import { deleteOldExecutionLogs } from "@/aws/bedrock/cost-storage";

// Delete logs older than 90 days
const beforeDate = new Date();
beforeDate.setDate(beforeDate.getDate() - 90);

const deletedCount = await deleteOldExecutionLogs(userId, beforeDate);
console.log(`Deleted ${deletedCount} old logs`);
```

## Cost Optimization Workflow

### 1. Baseline Measurement

Before optimization:

```bash
# Generate baseline report
tsx scripts/generate-cost-report.ts user123 30 > baseline-report.txt
```

### 2. Implement Optimizations

- Switch simple features to Haiku
- Optimize token limits
- Adjust temperature settings
- Implement caching where appropriate

### 3. Measure Impact

After optimization:

```bash
# Generate comparison report
tsx scripts/generate-cost-comparison.ts user123 60 30 > comparison-report.txt
```

### 4. Monitor Ongoing

Set up regular monitoring:

```typescript
// In your monitoring dashboard
const metrics = await getCostDashboardMetrics(30);

// Alert if costs exceed threshold
if (metrics.data.projections.monthlyProjection > BUDGET_THRESHOLD) {
  sendAlert("Cost projection exceeds budget");
}
```

## Dashboard Integration

### Example Dashboard Component

```typescript
"use client";

import { useEffect, useState } from "react";
import { getCostDashboardMetrics } from "@/app/cost-tracking-actions";
import type { CostDashboardMetrics } from "@/aws/bedrock/cost-tracker";

export function CostDashboard() {
  const [metrics, setMetrics] = useState<CostDashboardMetrics | null>(null);

  useEffect(() => {
    getCostDashboardMetrics(30).then(({ data }) => {
      if (data) setMetrics(data);
    });
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div>
      <h2>Cost Overview</h2>
      <div>
        <p>Total Cost: ${metrics.currentPeriod.totalCost.toFixed(4)}</p>
        <p>Invocations: {metrics.currentPeriod.totalInvocations}</p>
        <p>
          Monthly Projection: $
          {metrics.projections.monthlyProjection.toFixed(2)}
        </p>
      </div>

      <h3>Cost by Category</h3>
      <ul>
        {Object.entries(metrics.currentPeriod.costByCategory).map(
          ([category, cost]) => (
            <li key={category}>
              {category}: ${cost.toFixed(4)}
            </li>
          )
        )}
      </ul>

      <h3>Top Costly Features</h3>
      <ul>
        {metrics.currentPeriod.topCostlyFeatures.map((feature) => (
          <li key={feature.flowName}>
            {feature.flowName}: ${feature.totalCost.toFixed(4)} (
            {feature.invocationCount} calls)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

### 1. Always Include User Context

```typescript
// ✅ Good - enables cost tracking
await myFlow(input, { userId: user.userId });

// ❌ Bad - no cost tracking
await myFlow(input);
```

### 2. Regular Monitoring

- Review cost reports weekly
- Set up alerts for budget thresholds
- Monitor cost trends over time

### 3. Feature-Level Analysis

- Identify high-cost features
- Optimize expensive operations
- Consider caching for repeated queries

### 4. Model Selection

- Use Haiku for simple tasks
- Reserve Sonnet/Opus for complex tasks
- Test different models for cost/quality balance

### 5. Token Optimization

- Set appropriate maxTokens limits
- Truncate long inputs when possible
- Use concise prompts

## Troubleshooting

### No Cost Data

If cost tracking isn't working:

1. Verify user context is passed:

   ```typescript
   await myFlow(input, { userId: user.userId });
   ```

2. Check execution logger is enabled:

   ```typescript
   // In flow-base.ts, ensure executionMetadata is created
   const executionMetadata: ExecutionMetadata = {
     userId: runtimeOptions?.userId,
     featureCategory: categorizeFlow(config.name),
     temperature: effectiveTemperature,
     maxTokens: effectiveMaxTokens,
   };
   ```

3. Verify DynamoDB permissions for log storage

### Inaccurate Costs

If costs seem incorrect:

1. Verify model pricing is up to date in `MODEL_PRICING`
2. Check token usage is being captured correctly
3. Ensure all flows are using the execution logger

### Performance Issues

If cost tracking impacts performance:

1. Cost storage is async and shouldn't block
2. Consider batching log writes
3. Implement log aggregation for high-volume features

## Future Enhancements

### Planned Features

1. **Real-time Cost Alerts**

   - CloudWatch alarms for budget thresholds
   - Email/SMS notifications

2. **Cost Allocation Tags**

   - Tag costs by team, project, or customer
   - Multi-tenant cost tracking

3. **Predictive Analytics**

   - ML-based cost forecasting
   - Anomaly detection

4. **Cost Optimization Recommendations**

   - Automated suggestions for model selection
   - Token limit optimization

5. **Budget Management**
   - Set per-user or per-feature budgets
   - Automatic throttling when limits reached

## API Reference

See inline documentation in:

- `src/aws/bedrock/cost-tracker.ts`
- `src/aws/bedrock/cost-storage.ts`
- `src/app/cost-tracking-actions.ts`
