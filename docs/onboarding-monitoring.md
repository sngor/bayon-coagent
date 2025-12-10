# Onboarding Monitoring Guide

This guide explains how to set up and use CloudWatch monitoring for the user onboarding system.

## Overview

The onboarding monitoring system provides comprehensive tracking and visualization of:

- **Start Rate**: Number of users who begin onboarding
- **Completion Rate**: Percentage of users who complete the full flow
- **Abandonment Rate**: Percentage of users who abandon onboarding
- **Step-by-Step Metrics**: Completion and skip rates for each step
- **Error Tracking**: Onboarding errors and issues
- **Funnel Visualization**: User flow through onboarding steps
- **CloudWatch Alarms**: Automated alerts for critical metrics

## Setup

### 1. Initialize Monitoring Infrastructure

Run the setup script to create the CloudWatch dashboard and alarms:

```bash
npm run setup:onboarding-monitoring
```

This will:

- Create a CloudWatch dashboard named "OnboardingMetrics"
- Set up alarms for low completion rates, high error rates, and high abandonment rates
- Display the current alarm statuses

### 2. Configure Alarm Thresholds (Optional)

The default alarm thresholds are:

- **Completion Rate**: Alert if below 70%
- **Error Rate**: Alert if above 5%
- **Abandonment Rate**: Alert if above 30%

To customize these thresholds, edit `src/services/onboarding/onboarding-monitoring-service.ts`:

```typescript
// Alarm thresholds
private readonly COMPLETION_RATE_THRESHOLD = 70; // Alert if below 70%
private readonly ERROR_RATE_THRESHOLD = 5; // Alert if above 5%
private readonly ABANDONMENT_RATE_THRESHOLD = 30; // Alert if above 30%
```

Then re-run the setup script.

### 3. Configure SNS Notifications (Optional)

To receive email or SMS notifications when alarms trigger:

1. Create an SNS topic in AWS Console
2. Subscribe to the topic with your email/phone
3. Update the alarm configuration to include the SNS topic ARN

## Viewing Metrics

### CloudWatch Dashboard

Access the dashboard at:

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=OnboardingMetrics
```

The dashboard includes:

- Onboarding overview (started, completed, abandoned)
- Completion rate by flow type (user, admin, both)
- Step completion vs skip rates
- Average completion time
- Error rates

### Admin Dashboard UI

View metrics in the application by navigating to the admin dashboard and selecting "Onboarding Metrics".

The UI provides:

- Real-time metric cards
- Funnel visualization
- Alarm status indicators
- Trend analysis
- Dropoff point identification

### API Access

Fetch metrics programmatically:

```typescript
// Get metrics for user flow
const response = await fetch(
  "/api/onboarding/metrics?flowType=user&includeFunnel=true&includeAlarms=true"
);
const data = await response.json();

// Get metrics for custom time range
const response = await fetch(
  "/api/onboarding/metrics?startDate=2024-01-01&endDate=2024-01-31"
);
const data = await response.json();
```

## Metrics Reference

### Core Metrics

| Metric           | Description                   | Unit         | Good Value  |
| ---------------- | ----------------------------- | ------------ | ----------- |
| Start Rate       | Users who begin onboarding    | Count        | Increasing  |
| Completion Rate  | % of users who complete       | Percent      | > 70%       |
| Abandonment Rate | % of users who abandon        | Percent      | < 30%       |
| Average Time     | Time to complete onboarding   | Milliseconds | < 5 minutes |
| Error Rate       | % of onboarding errors        | Percent      | < 5%        |
| Resume Rate      | % who resume after abandoning | Percent      | > 20%       |

### Step Metrics

For each onboarding step:

- **Completion Count**: Number of users who completed the step
- **Skip Count**: Number of users who skipped the step
- **Average Duration**: Time spent on the step
- **Completion Rate**: % of users who completed vs entered

### Funnel Metrics

- **Overall Conversion**: % of users who complete from start to finish
- **Dropoff Points**: Steps with highest abandonment rates
- **Step-by-Step Conversion**: Conversion rate between consecutive steps

## Alarms

### Low Completion Rate Alarm

**Name**: `OnboardingLowCompletionRate`

**Trigger**: Completion rate falls below threshold for 2 consecutive hours

**Action**: Investigate user experience issues, technical problems, or confusing steps

### High Error Rate Alarm

**Name**: `OnboardingHighErrorRate`

**Trigger**: Error rate exceeds threshold for 1 hour

**Action**: Check logs for error patterns, investigate technical issues

### High Abandonment Rate Alarm

**Name**: `OnboardingHighAbandonmentRate`

**Trigger**: Abandonment rate exceeds threshold for 2 consecutive hours

**Action**: Review step complexity, consider simplifying flow, analyze dropoff points

## Troubleshooting

### No Metrics Appearing

1. Verify CloudWatch permissions in IAM
2. Check that analytics tracking is enabled in the application
3. Ensure users are actually going through onboarding
4. Wait 5-10 minutes for metrics to propagate

### Alarms Not Triggering

1. Verify alarm configuration in CloudWatch console
2. Check that sufficient data points exist (alarms need data to evaluate)
3. Ensure alarm actions are configured (SNS topics)
4. Review alarm history for evaluation details

### Dashboard Not Loading

1. Verify dashboard exists in CloudWatch
2. Check AWS region matches your deployment
3. Re-run setup script to recreate dashboard
4. Check browser console for errors

## Best Practices

### Monitoring Frequency

- **Real-time**: Check dashboard during major releases or changes
- **Daily**: Review key metrics and alarm statuses
- **Weekly**: Analyze trends and identify improvement opportunities
- **Monthly**: Deep dive into funnel data and user behavior

### Optimization Strategies

1. **Identify Dropoff Points**: Focus on steps with highest abandonment
2. **Reduce Friction**: Simplify steps with low completion rates
3. **Improve Clarity**: Add guidance for steps with high skip rates
4. **Fix Errors**: Prioritize fixing steps with high error rates
5. **Test Changes**: A/B test improvements and measure impact

### Data Retention

CloudWatch metrics are retained for:

- **1 minute data points**: 15 days
- **5 minute data points**: 63 days
- **1 hour data points**: 455 days

For longer retention, export metrics to S3 or use CloudWatch Logs Insights.

## Integration with Other Systems

### Slack Notifications

Configure SNS to send alarm notifications to Slack:

1. Create a Slack webhook
2. Create an SNS topic
3. Subscribe the webhook to the topic
4. Update alarms to publish to the topic

### DataDog/New Relic

Export CloudWatch metrics to third-party monitoring:

1. Set up CloudWatch metric stream
2. Configure destination (Kinesis Firehose)
3. Connect to DataDog/New Relic
4. Create custom dashboards

### Custom Analytics

Query metrics programmatically for custom analysis:

```typescript
import { onboardingMonitoring } from "@/services/onboarding/onboarding-monitoring-service";

// Get metrics for analysis
const metrics = await onboardingMonitoring.getOnboardingMetrics("user", {
  start: new Date("2024-01-01"),
  end: new Date("2024-01-31"),
});

// Get funnel data
const funnel = await onboardingMonitoring.getFunnelData("user", {
  start: new Date("2024-01-01"),
  end: new Date("2024-01-31"),
});

// Analyze dropoff points
const criticalDropoffs = funnel.dropoffPoints
  .filter((point) => point.dropoffRate > 20)
  .sort((a, b) => b.dropoffRate - a.dropoffRate);
```

## Support

For issues or questions:

1. Check CloudWatch Logs for detailed error messages
2. Review alarm history for trigger patterns
3. Consult AWS CloudWatch documentation
4. Contact the development team

## Related Documentation

- [Onboarding Design Document](.kiro/specs/user-onboarding/design.md)
- [Onboarding Requirements](.kiro/specs/user-onboarding/requirements.md)
- [CloudWatch Logging Service](../src/services/monitoring/cloudwatch-logging-service.ts)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
