# AI Cost Control and Monitoring

## Overview

The AI Cost Control system provides comprehensive tracking, budgeting, and cost management for AI visibility monitoring. It helps prevent unexpected API costs while ensuring users can effectively monitor their AI presence.

## Features

### 1. API Usage Tracking

Automatically tracks all API calls made to AI platforms:

- **Per-Platform Tracking**: Separate tracking for ChatGPT, Perplexity, Claude, and Gemini
- **Cost Estimation**: Real-time cost calculation based on platform-specific pricing
- **Historical Data**: Complete usage history with timestamps and costs
- **Period-Based Tracking**: Monthly tracking periods with automatic reset

### 2. Budget Management

User-configurable budget limits with automatic enforcement:

- **Monthly Budget Limits**: Default $50/month, user-configurable
- **Real-Time Tracking**: Current spend tracked with each API call
- **Remaining Budget**: Always know how much budget is left
- **Period Management**: Automatic monthly reset of budgets

### 3. Cost Estimation

Pre-execution cost estimation to prevent budget overruns:

- **Before Execution**: Estimate cost before running monitoring jobs
- **Platform Breakdown**: See cost per platform
- **Budget Validation**: Automatic check if execution is within budget
- **Query Count Estimation**: Based on configured templates and platforms

### 4. Alert System

Multi-threshold alert system for budget management:

- **Configurable Thresholds**: Default at 50%, 75%, and 90% of budget
- **One-Time Alerts**: Each threshold triggers only once per period
- **User Notifications**: Alerts sent when thresholds are crossed
- **Alert History**: Track which alerts have been sent

### 5. Automatic Frequency Reduction

Intelligent frequency adjustment when approaching budget limits:

- **Automatic Reduction**: Reduces monitoring frequency at 90% budget usage
- **Gradual Reduction**: Daily → Weekly → Monthly
- **User Control**: Can be disabled via `autoReduceFrequency` setting
- **User Notification**: Users are notified when frequency is reduced

### 6. Cost Spike Detection

Admin alerts for unusual cost increases:

- **Spike Threshold**: 50% increase over previous period triggers alert
- **Admin Notifications**: Alerts sent to administrators
- **Spike History**: All cost spikes tracked in DynamoDB
- **Acknowledgment**: Admins can acknowledge and resolve alerts

## Data Models

### APIUsageRecord

```typescript
interface APIUsageRecord {
  id: string;
  userId: string;
  platform: "chatgpt" | "perplexity" | "claude" | "gemini";
  queryCount: number;
  estimatedCost: number; // in USD
  timestamp: string;
  periodStart: string;
  periodEnd: string;
  createdAt: number;
  updatedAt: number;
}
```

**DynamoDB Keys:**

- PK: `USER#{userId}`
- SK: `API_USAGE#{timestamp}#{id}`

### UserBudget

```typescript
interface UserBudget {
  id: string;
  userId: string;
  monthlyLimit: number; // in USD
  currentSpend: number; // in USD
  periodStart: string;
  periodEnd: string;
  alertThresholds: number[]; // e.g., [0.5, 0.75, 0.9]
  alertsSent: number[]; // Track which thresholds have triggered
  autoReduceFrequency: boolean;
  createdAt: number;
  updatedAt: number;
}
```

**DynamoDB Keys:**

- PK: `USER#{userId}`
- SK: `USER_BUDGET`

### CostSpikeAlert

```typescript
interface CostSpikeAlert {
  id: string;
  userId: string;
  currentSpend: number;
  previousPeriodSpend: number;
  percentageIncrease: number;
  timestamp: string;
  acknowledged: boolean;
  createdAt: number;
}
```

**DynamoDB Keys:**

- PK: `USER#{userId}`
- SK: `COST_SPIKE_ALERT#{timestamp}#{id}`

## Platform Costs

Current cost estimates per query:

| Platform   | Cost per Query |
| ---------- | -------------- |
| ChatGPT    | $0.002         |
| Perplexity | $0.001         |
| Claude     | $0.003         |
| Gemini     | $0.0005        |

**Note:** These are estimates. Actual costs may vary based on response length and model used.

## Server Actions

### getUserBudgetInfo

Get current budget and usage information for a user.

```typescript
const result = await getUserBudgetInfo(userId);
// Returns: budget info, usage stats, recent usage records
```

### updateUserBudgetConfig

Update user budget configuration.

```typescript
const result = await updateUserBudgetConfig(userId, {
  monthlyLimit: 100,
  alertThresholds: [0.6, 0.8, 0.95],
  autoReduceFrequency: true,
});
```

### estimateMonitoringCost

Estimate cost before executing monitoring.

```typescript
const result = await estimateMonitoringCost(userId);
// Returns: total cost, platform breakdown, budget validation
```

### getCostSpikeAlerts

Get cost spike alerts (admin function).

```typescript
const result = await getCostSpikeAlerts({
  limit: 10,
  unacknowledgedOnly: true,
});
```

## Integration with Monitoring Scheduler

The cost control system is integrated into the monitoring scheduler:

1. **Pre-Execution Check**: Cost is estimated before monitoring runs
2. **Budget Validation**: Execution blocked if cost exceeds remaining budget
3. **Usage Tracking**: Each query is tracked with platform and cost
4. **Automatic Reduction**: Frequency reduced if approaching budget limit
5. **Spike Detection**: Cost spikes detected after each execution

## Usage Examples

### Track API Usage

```typescript
import { createAICostControlService } from "@/lib/ai-cost-control";

const costControl = createAICostControlService();

// Track usage after making API calls
await costControl.trackAPIUsage(userId, "chatgpt", 10);
```

### Check Budget Status

```typescript
const budget = await costControl.getUserBudget(userId);
const percentageUsed = (budget.currentSpend / budget.monthlyLimit) * 100;

if (percentageUsed > 75) {
  console.log("Approaching budget limit!");
}
```

### Estimate Cost Before Execution

```typescript
const estimate = await costControl.estimateCost(
  userId,
  ["chatgpt", "perplexity"],
  5 // queries per platform
);

if (!estimate.withinBudget) {
  console.log(`Cost ($${estimate.totalCost}) exceeds budget`);
}
```

### Configure Budget

```typescript
await costControl.updateUserBudget(userId, {
  monthlyLimit: 100,
  alertThresholds: [0.5, 0.75, 0.9],
  autoReduceFrequency: true,
});
```

## Alert Workflow

### Budget Threshold Alerts

1. User makes API calls that increase spend
2. System checks if any alert thresholds were crossed
3. If threshold crossed and not already sent:
   - Alert notification sent to user
   - Threshold marked as sent in `alertsSent` array
4. At month end, `alertsSent` array is reset

### Cost Spike Alerts

1. After each monitoring execution, system compares current spend to previous period
2. If increase is ≥50%:
   - Cost spike alert created in DynamoDB
   - Admin notification sent
   - Alert includes current/previous spend and percentage increase
3. Admin can acknowledge alert to mark as resolved

### Frequency Reduction Alerts

1. When spend reaches 90% of budget and `autoReduceFrequency` is enabled:
   - Monitoring frequency is reduced (daily → weekly → monthly)
   - User notification sent explaining the change
   - User can manually restore frequency or increase budget

## Best Practices

### For Users

1. **Set Realistic Budgets**: Consider your monitoring needs and set appropriate limits
2. **Monitor Usage**: Regularly check budget status in the dashboard
3. **Configure Alerts**: Set alert thresholds that give you time to react
4. **Enable Auto-Reduce**: Keep `autoReduceFrequency` enabled to prevent overages

### For Administrators

1. **Monitor Cost Spikes**: Review cost spike alerts regularly
2. **Adjust Platform Costs**: Update cost estimates as platform pricing changes
3. **Set Default Limits**: Configure appropriate default budget limits
4. **Review Usage Patterns**: Identify users with unusual usage patterns

## Configuration

### Default Settings

```typescript
const DEFAULT_MONTHLY_BUDGET = 50; // $50 per month
const DEFAULT_ALERT_THRESHOLDS = [0.5, 0.75, 0.9]; // 50%, 75%, 90%
const COST_SPIKE_THRESHOLD = 0.5; // 50% increase
```

### Environment Variables

No environment variables required. All configuration is stored in DynamoDB per user.

## Testing

The cost control system includes comprehensive unit tests:

```bash
npm test -- src/lib/__tests__/ai-cost-control.test.ts
```

Tests cover:

- Type definitions
- Cost calculations
- Budget calculations
- Cost spike detection
- Alert threshold logic
- Frequency reduction logic

## Future Enhancements

1. **Custom Platform Costs**: Allow admins to configure per-platform costs
2. **Usage Analytics**: Detailed analytics dashboard for cost trends
3. **Budget Forecasting**: Predict end-of-month costs based on current usage
4. **Multi-Period Budgets**: Support weekly or quarterly budget periods
5. **Cost Optimization**: Suggest ways to reduce costs (e.g., reduce query frequency)
6. **Shared Budgets**: Team or organization-level budget pools
7. **Cost Allocation**: Track costs by feature or department
8. **Real-Time Pricing**: Integrate with platform APIs for real-time cost data

## Troubleshooting

### Budget Not Resetting

If budget doesn't reset at month end:

1. Check `periodEnd` date in UserBudget record
2. System automatically resets on next `getUserBudget()` call
3. Verify system date/time is correct

### Alerts Not Triggering

If alerts aren't being sent:

1. Check `alertThresholds` configuration
2. Verify `alertsSent` array doesn't already include threshold
3. Check notification system integration
4. Review logs for alert sending errors

### Cost Estimates Inaccurate

If cost estimates don't match actual costs:

1. Update platform cost constants in `ai-cost-control.ts`
2. Consider response length variations
3. Account for different model tiers
4. Review actual API billing statements

### Frequency Not Reducing

If frequency doesn't reduce automatically:

1. Check `autoReduceFrequency` setting (must be `true`)
2. Verify spend is ≥90% of budget
3. Check current frequency (won't reduce if already monthly)
4. Review logs for reduction attempts

## Related Documentation

- [AI Search Monitoring](./AI_MONITORING_SCHEDULED_EXECUTION.md)
- [AI Visibility Dashboard](../../src/components/ai-visibility-dashboard.tsx)
- [DynamoDB Repository](../../src/aws/dynamodb/repository.ts)
