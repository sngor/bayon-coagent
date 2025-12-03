# Analytics & Monitoring System

Performance tracking, cost monitoring, ROI tracking, and analytics for the AgentStrands enhancement system.

## Overview

The Analytics & Monitoring system provides comprehensive tracking of strand performance, cost monitoring with optimization suggestions, ROI tracking for business outcomes, automatic anomaly detection, and detailed reporting capabilities. It implements Requirements 9.1, 9.2, 9.3, and 9.4 from the AgentStrands enhancement specification.

## Features

### Performance Tracking

- Track execution time, token usage, cost, success rate, quality scores, and user satisfaction
- Store metrics in DynamoDB with automatic TTL-based cleanup
- Real-time metrics caching for fast access
- Time series data for trend analysis

### Cost Monitoring

- Track AI operation costs with detailed token usage
- Calculate costs by strand, user, and task type
- Real-time cost alerting with configurable thresholds
- Optimization suggestions to reduce costs by 30-60%
- Model pricing for all Claude variants
- Trend analysis (increasing/decreasing/stable)

### ROI Tracking

- Track business outcomes (leads, sales, engagement)
- Calculate return on investment for content
- Monitor content performance metrics
- Correlate performance with strand metrics
- Generate comprehensive ROI reports

### Anomaly Detection

- Automatic detection of performance anomalies
- Configurable thresholds for latency, error rate, cost, and quality
- Severity classification (low, medium, high, critical)
- Actionable suggestions for remediation

### Analytics & Reporting

- Aggregate metrics by strand, user, and task type
- Generate various report types (daily, weekly, monthly, cost analysis, etc.)
- Key insights and recommendations
- Time series visualization data

## Components

### PerformanceTracker

Main class for tracking and analyzing performance metrics.

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";

const tracker = createPerformanceTracker({
  tableName: "bayon-coagent-dev",
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

### CostMonitor

Main class for tracking and optimizing AI operation costs.

```typescript
import { createCostMonitor } from "@/aws/bedrock/analytics";

const costMonitor = createCostMonitor({
  tableName: "bayon-coagent-dev",
  enableAlerts: true,
  alertThresholds: {
    perStrand: 50, // $50 per strand per day
    perUser: 100, // $100 per user per day
    perTaskType: 75, // $75 per task type per day
    totalDaily: 500, // $500 total per day
  },
  retentionDays: 90,
});
```

### ROITracker

Main class for tracking business outcomes and calculating ROI.

```typescript
import { createROITracker } from "@/aws/bedrock/analytics";

const roiTracker = createROITracker({
  tableName: "bayon-coagent-dev",
  retentionDays: 365,
  defaultCostMultiplier: 1.0,
});
```

## Usage

### 1. Track Performance Metrics

```typescript
import { PerformanceMetrics } from "@/aws/bedrock/analytics";

const metrics: PerformanceMetrics = {
  executionTime: 2500, // milliseconds
  tokenUsage: 1500,
  cost: 0.045, // USD
  successRate: 1.0, // 0-1
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

### 2. Get Analytics

```typescript
import { AnalyticsFilters } from "@/aws/bedrock/analytics";

const filters: AnalyticsFilters = {
  strandId: "strand-content-generator-123",
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
};

const analytics = await tracker.getAnalytics(filters);

console.log(`Total Tasks: ${analytics.totalTasks}`);
console.log(`Success Rate: ${(analytics.successRate * 100).toFixed(1)}%`);
console.log(`Avg Quality: ${analytics.avgQualityScore.toFixed(0)}`);
```

### 3. Detect Anomalies

```typescript
const anomalies = await tracker.detectAnomalies(
  "strand-id",
  "7d" // timeframe: 7 days
);

for (const anomaly of anomalies) {
  console.log(`[${anomaly.severity}] ${anomaly.type}: ${anomaly.description}`);
  console.log(`Suggested actions:`, anomaly.suggestedActions);
}
```

### 4. Generate Reports

```typescript
const report = await tracker.generateReport("daily-summary", filters);

console.log(report.title);
console.log("Insights:", report.insights);
console.log("Recommendations:", report.recommendations);
console.log("Anomalies:", report.anomalies.length);
```

### 5. Get Performance Snapshot

```typescript
const snapshot = await tracker.getSnapshot("strand-id");

if (snapshot) {
  console.log(`Last execution: ${snapshot.metrics.executionTime}ms`);
  console.log(`Quality: ${snapshot.metrics.qualityScore}`);
}
```

## Report Types

- `daily-summary`: Daily performance overview
- `weekly-summary`: Weekly performance overview
- `monthly-summary`: Monthly performance overview
- `strand-performance`: Detailed strand analysis
- `cost-analysis`: Cost breakdown and optimization
- `quality-trends`: Quality score trends
- `user-satisfaction`: User satisfaction analysis
- `bottleneck-analysis`: Performance bottleneck identification

## Anomaly Types

### Latency Anomalies

Detected when execution time exceeds baseline by configured multiplier.

**Suggested Actions:**

- Check for resource contention
- Review recent code changes
- Verify external service availability

### Error Rate Anomalies

Detected when success rate drops below threshold.

**Suggested Actions:**

- Review error logs
- Check input validation
- Verify model availability

### Cost Anomalies

Detected when cost exceeds baseline by configured multiplier.

**Suggested Actions:**

- Review token usage
- Check for inefficient prompts
- Consider model optimization

### Quality Anomalies

Detected when quality score drops significantly.

**Suggested Actions:**

- Review recent prompt changes
- Check training data quality
- Verify model configuration

## Data Storage

### DynamoDB Schema

#### Performance Metrics

```
PK: STRAND#{strandId}
SK: PERF#{timestamp}
entityType: PerformanceMetrics
```

#### Anomalies

```
PK: STRAND#{strandId}
SK: ANOMALY#{timestamp}
entityType: Anomaly
```

### TTL Configuration

Metrics are automatically deleted after the configured retention period (default: 90 days) using DynamoDB TTL.

## Configuration

### Default Configuration

```typescript
{
  tableName: 'bayon-coagent-dev',
  enableAnomalyDetection: true,
  anomalyThresholds: {
    latencyMultiplier: 2.0,      // 2x baseline latency
    errorRateThreshold: 0.1,     // 10% error rate
    costMultiplier: 1.5,         // 1.5x baseline cost
    qualityDropThreshold: 20,    // 20 point quality drop
  },
  retentionDays: 90,
}
```

### Custom Configuration

```typescript
const tracker = createPerformanceTracker({
  tableName: "custom-table",
  enableAnomalyDetection: true,
  anomalyThresholds: {
    latencyMultiplier: 1.5, // More sensitive
    errorRateThreshold: 0.05, // 5% threshold
    costMultiplier: 2.0, // Less sensitive
    qualityDropThreshold: 15, // 15 point drop
  },
  retentionDays: 30, // Shorter retention
});
```

## Integration with AgentStrands

### Track Strand Execution

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";

const tracker = createPerformanceTracker();

// Before execution
const startTime = Date.now();
const startTokens = getTokenCount();

// Execute strand
const result = await strand.execute(task);

// After execution
const executionTime = Date.now() - startTime;
const tokenUsage = getTokenCount() - startTokens;

// Track metrics
await tracker.trackPerformance(strand.id, task.userId, task.id, task.type, {
  executionTime,
  tokenUsage,
  cost: calculateCost(tokenUsage),
  successRate: result.success ? 1.0 : 0.0,
  userSatisfaction: result.userRating || 0,
  qualityScore: result.qualityScore || 0,
  timestamp: new Date().toISOString(),
});
```

### Monitor Dashboard

```typescript
// Get real-time analytics for dashboard
const analytics = await tracker.getAnalytics({
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

// Display metrics
displayMetrics({
  totalTasks: analytics.totalTasks,
  successRate: analytics.successRate,
  avgQuality: analytics.avgQualityScore,
  totalCost: analytics.totalCost,
});

// Check for anomalies
const anomalies = await tracker.detectAnomalies("strand-id", "1d");
if (anomalies.length > 0) {
  displayAlerts(anomalies);
}
```

## Performance Considerations

### Caching

- Recent metrics cached in memory (last 100 per strand)
- Baseline metrics cached to reduce queries
- Cache invalidation on new data

### Batch Operations

- Anomalies written in batches (max 25 per batch)
- Efficient DynamoDB queries with proper key design

### Query Optimization

- Use strand-specific queries when possible
- Leverage DynamoDB's query capabilities
- Consider adding GSI for user-based queries

## Best Practices

1. **Track All Executions**: Track metrics for every strand execution to build accurate baselines
2. **Set Appropriate Thresholds**: Adjust anomaly thresholds based on your use case
3. **Monitor Regularly**: Generate daily reports to stay informed
4. **Act on Anomalies**: Address detected anomalies promptly
5. **Review Trends**: Use time series data to identify long-term trends
6. **Optimize Costs**: Use cost analysis reports to identify optimization opportunities

## Examples

See `performance-tracker-example.ts` for comprehensive usage examples including:

- Basic tracking
- Analytics queries
- Anomaly detection
- Report generation
- Time series monitoring
- Custom configurations

## Testing

The performance tracker includes comprehensive test coverage:

- Unit tests for all methods
- Integration tests with DynamoDB
- Property-based tests for correctness properties

Run tests:

```bash
npm test src/aws/bedrock/analytics
```

## Troubleshooting

### No Anomalies Detected

- Ensure at least 10 data points exist for baseline calculation
- Check anomaly threshold configuration
- Verify anomaly detection is enabled

### Missing Analytics Data

- Verify DynamoDB table name is correct
- Check AWS credentials and permissions
- Ensure metrics are being tracked

### High Memory Usage

- Reduce cache size in configuration
- Decrease retention period
- Clear cache periodically

## Future Enhancements

- Real-time alerting via SNS/EventBridge
- Machine learning-based anomaly detection
- Predictive analytics
- Cost optimization recommendations
- Integration with CloudWatch dashboards
- Custom metric definitions

## Related Components

- **Cost Monitor**: Detailed cost tracking and optimization
- **ROI Calculator**: Business outcome tracking
- **Analytics Dashboards**: Visual representation of metrics

## Requirements Validation

This implementation validates:

- **Property 41**: Metrics tracking completeness (Requirements 9.1)
- **Property 43**: Bottleneck detection (Requirements 9.3)

All performance metrics (success rate, execution time, user satisfaction) are recorded for every strand execution, and bottlenecks are automatically identified through anomaly detection.

## Cost Monitor

### Overview

The Cost Monitor tracks AI operation costs, monitors token usage, calculates costs by various dimensions, provides real-time alerts, and suggests optimizations. It implements Requirement 9.2 from the AgentStrands enhancement specification.

### Features

- **Cost Tracking**: Track costs for every AI operation with detailed token usage
- **Cost Calculation**: Calculate costs by strand, user, and task type
- **Cost Alerting**: Real-time alerts when thresholds are exceeded
- **Optimization Suggestions**: Identify opportunities to reduce costs by 30-60%
- **Cost Analytics**: Trend analysis and cost summaries
- **Model Pricing**: Built-in pricing for all Claude models

### Usage

#### 1. Track Operation Costs

```typescript
import { createCostMonitor } from "@/aws/bedrock/analytics";
import { CostOperation } from "@/aws/bedrock/analytics/types";

const costMonitor = createCostMonitor();

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

#### 2. Calculate Costs by Dimension

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

#### 3. Set Up Cost Alerts

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
costMonitor.setAlert(100, "user", (alert) => {
  console.log(`Alert: ${alert.message}`);
  console.log(`Current: $${alert.currentCost}, Threshold: $${alert.threshold}`);

  // Send notification
  sendEmailAlert(alert);
  postToSlack(alert);
});
```

#### 4. Get Optimization Suggestions

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

#### 5. Get Cost Summary

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

### Model Pricing

| Model                | Input (per 1M tokens) | Output (per 1M tokens) |
| -------------------- | --------------------- | ---------------------- |
| Claude 3.5 Sonnet v2 | $3.00                 | $15.00                 |
| Claude 3.5 Sonnet    | $3.00                 | $15.00                 |
| Claude 3 Haiku       | $0.25                 | $1.25                  |
| Claude 3 Opus        | $15.00                | $75.00                 |

### Optimization Strategies

1. **Reduce Token Usage** (~30% savings)

   - Optimize prompt templates
   - Implement context window management
   - Use summarization for long inputs

2. **Optimize Model Selection** (~50% savings)

   - Use Claude Haiku for simple tasks
   - Implement model routing based on complexity

3. **Implement Caching** (~60% savings)

   - Cache frequently used responses
   - Add cache invalidation strategy

4. **Control Output Length** (~25% savings)

   - Add max_tokens parameter
   - Use structured outputs

5. **Batch Processing** (~15% savings)
   - Group similar operations
   - Optimize batch sizes

### DynamoDB Schema

#### Cost Records

```
PK: USER#{userId}
SK: COST#{timestamp}#{strandId}
entityType: CostRecord
```

#### Cost Alerts

```
PK: ALERT#{dimension}#{dimensionValue}
SK: ALERT#{timestamp}
entityType: CostAlert
```

### Documentation

- [Cost Monitor Implementation Guide](./COST_MONITOR_IMPLEMENTATION.md)
- [Cost Monitor Quick Start](./COST_MONITOR_QUICK_START.md)
- [Cost Monitor Examples](./cost-monitor-example.ts)
- [Task 34 Completion Summary](./TASK_34_COMPLETION.md)

### Requirements Validation

This implementation validates:

- **Property 42**: Cost calculation accuracy (Requirements 9.2)

For any AI operation, token usage and costs are accurately calculated and attributed to the correct strand, user, and task type.

---

## ROI Tracker

### Overview

The ROI Tracker tracks business outcomes and calculates return on investment for strand-generated content. It implements Requirement 9.4 from the AgentStrands enhancement specification.

### Features

- **Business Outcome Tracking**: Track leads, sales, engagement, and other business outcomes
- **Content Performance Metrics**: Monitor views, clicks, conversions, and revenue
- **ROI Calculation**: Automatic ROI calculation with payback period
- **Performance Correlation**: Correlate content performance with strand metrics
- **Comprehensive Reporting**: Generate detailed ROI reports with insights

### Usage

#### 1. Track Business Outcomes

```typescript
import { createROITracker } from "@/aws/bedrock/analytics";

const roiTracker = createROITracker();

// Track a lead
await roiTracker.trackOutcome({
  id: `outcome-${Date.now()}`,
  contentId: "blog-post-123",
  strandId: "content-generator",
  userId: "user-456",
  type: "lead-generated",
  value: 0,
  description: "Contact form submission",
  occurredAt: new Date().toISOString(),
  metadata: {
    contentType: "blog-post",
    creationCost: 5.5,
    distributionCost: 0,
  },
});

// Track a sale
await roiTracker.trackOutcome({
  id: `outcome-${Date.now()}`,
  contentId: "listing-description-789",
  strandId: "listing-strand",
  userId: "user-456",
  type: "sale-closed",
  value: 15000, // Commission earned
  description: "Property sold",
  occurredAt: new Date().toISOString(),
  metadata: {
    contentType: "listing-description",
    propertyValue: 500000,
    commissionRate: 0.03,
    creationCost: 3.25,
    distributionCost: 200,
  },
});
```

#### 2. Calculate ROI

```typescript
const roi = await roiTracker.calculateROI("blog-post-123", "user-456");

if (roi) {
  console.log(`Investment: $${roi.investment.toFixed(2)}`);
  console.log(`Return: $${roi.return.toFixed(2)}`);
  console.log(`Profit: $${roi.profit.toFixed(2)}`);
  console.log(`ROI: ${roi.roiPercentage.toFixed(1)}%`);
  console.log(`Payback Period: ${roi.paybackPeriod} days`);
}
```

#### 3. Get Content Performance

```typescript
const performance = await roiTracker.getContentPerformance(
  "blog-post-123",
  "user-456"
);

if (performance) {
  console.log(`Views: ${performance.views}`);
  console.log(`Clicks: ${performance.clicks}`);
  console.log(`Leads: ${performance.leads}`);
  console.log(`Conversions: ${performance.conversions}`);
  console.log(`Revenue: $${performance.revenue.toFixed(2)}`);
  console.log(`ROI: ${performance.roi.toFixed(1)}%`);
}
```

#### 4. Generate ROI Reports

```typescript
const report = await roiTracker.generateReport({
  userId: "user-456",
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

console.log(`Overall ROI: ${report.overallROI.toFixed(1)}%`);
console.log(`Total Investment: $${report.totalInvestment.toFixed(2)}`);
console.log(`Total Return: $${report.totalReturn.toFixed(2)}`);
console.log("\nTop Performers:");
report.topPerformers.slice(0, 5).forEach((content, index) => {
  console.log(`  ${index + 1}. ${content.contentType} - ${content.roi}% ROI`);
});
console.log("\nInsights:");
report.insights.forEach((insight) => console.log(`  - ${insight}`));
console.log("\nRecommendations:");
report.recommendations.forEach((rec) => console.log(`  - ${rec}`));
```

#### 5. Correlate Performance

```typescript
const correlation = await roiTracker.correlatePerformance(
  "user-456",
  "content-generator-strand",
  "30d"
);

console.log(`Correlation: ${(correlation.correlation * 100).toFixed(1)}%`);
console.log("Insights:");
correlation.insights.forEach((insight) => console.log(`  - ${insight}`));
```

### Outcome Types

- `lead-generated`: Contact form submissions, inquiries
- `property-viewed`: Listing page views, virtual tour views
- `contact-made`: Phone calls, emails, messages
- `appointment-scheduled`: Property showings, consultations
- `listing-signed`: New listing agreements
- `sale-closed`: Completed property transactions
- `referral-received`: Referrals from clients
- `engagement`: Social media interactions, content shares
- `brand-awareness`: Impressions, reach metrics

### DynamoDB Schema

#### Business Outcomes

```
PK: CONTENT#{contentId}
SK: OUTCOME#{timestamp}#{outcomeId}
entityType: BusinessOutcome
```

#### Content Performance

```
PK: USER#{userId}
SK: CONTENT_PERF#{contentId}
entityType: ContentPerformance
```

### Configuration

```typescript
const roiTracker = createROITracker({
  tableName: "bayon-coagent-dev",
  retentionDays: 365, // Keep ROI data for 1 year
  defaultCostMultiplier: 1.0,
});
```

### Integration Example

```typescript
// Track content creation
await roiTracker.trackOutcome({
  type: "engagement",
  value: 0,
  metadata: {
    creationCost: metrics.cost,
    distributionCost: 0,
  },
  // ... other fields
});

// Track user interactions
await roiTracker.trackOutcome({
  type: "property-viewed",
  value: 0,
  // ...
});

// Track conversions
await roiTracker.trackOutcome({
  type: "sale-closed",
  value: commissionAmount,
  // ...
});

// Generate weekly ROI report
const report = await roiTracker.generateReport({
  userId,
  startDate: sevenDaysAgo,
  endDate: now,
});
```

### Best Practices

1. **Track All Outcomes**: Track every business outcome to accurately measure ROI
2. **Include Costs**: Always include creation and distribution costs in metadata
3. **Attribute Revenue**: Link sales back to the content that generated them
4. **Regular Reporting**: Generate reports weekly to spot trends
5. **Act on Insights**: Use recommendations to optimize content strategy
6. **Correlate Performance**: Use correlation analysis to identify high-ROI strands

### Documentation

- [ROI Tracker Implementation Guide](./ROI_TRACKER_IMPLEMENTATION.md)
- [ROI Tracker Quick Start](./ROI_TRACKER_QUICK_START.md)
- [ROI Tracker Examples](./roi-tracker-example.ts)
- [Task 35 Completion Summary](./TASK_35_COMPLETION.md)

### Requirements Validation

This implementation validates:

- **Property 44**: ROI tracking (Requirements 9.4)

For any published strand-generated content, business outcomes are tracked and ROI is calculated, providing comprehensive insights into content performance and business impact.
