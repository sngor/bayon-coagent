# AWS Monitoring and Observability Guide

## Overview

This guide covers monitoring, logging, and observability for the Bayon CoAgent production environment using AWS CloudWatch, X-Ray, and other AWS services.

## Table of Contents

- [CloudWatch Dashboards](#cloudwatch-dashboards)
- [CloudWatch Alarms](#cloudwatch-alarms)
- [Log Management](#log-management)
- [X-Ray Tracing](#x-ray-tracing)
- [Performance Monitoring](#performance-monitoring)
- [Cost Monitoring](#cost-monitoring)
- [Incident Response](#incident-response)

## CloudWatch Dashboards

### Production Dashboard

Access the production dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=BayonCoAgent-production
```

### Key Metrics Displayed

#### Application Health
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: 4xx and 5xx errors per minute
- **Request Count**: Requests per minute
- **Availability**: Uptime percentage

#### Authentication (Cognito)
- **Sign-ins**: Successful and failed sign-ins
- **Sign-ups**: New user registrations
- **Token Refreshes**: JWT token refresh rate
- **MFA Events**: MFA authentication attempts

#### Database (DynamoDB)
- **Read Capacity**: Consumed read capacity units
- **Write Capacity**: Consumed write capacity units
- **Throttled Requests**: Throttling events
- **Latency**: GetItem, PutItem, Query latencies
- **User Errors**: Conditional check failures

#### Storage (S3)
- **Requests**: GET, PUT, DELETE requests per minute
- **Data Transfer**: Bytes downloaded/uploaded
- **Error Rate**: 4xx and 5xx errors
- **Latency**: Request latency percentiles

#### AI (Bedrock)
- **Invocations**: Model invocation count
- **Latency**: Time to first token, total latency
- **Throttling**: Throttled requests
- **Costs**: Estimated cost per invocation

### Creating Custom Dashboards

```bash
# Create a custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name BayonCoAgent-Custom \
  --dashboard-body file://dashboard-config.json
```

Example dashboard configuration:
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
          [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-west-2",
        "title": "DynamoDB Capacity"
      }
    }
  ]
}
```

## CloudWatch Alarms

### Pre-configured Alarms

The SAM template creates these alarms automatically:

#### High Error Rate
- **Metric**: 5xx errors
- **Threshold**: > 10 errors in 5 minutes
- **Action**: SNS notification

#### High Latency
- **Metric**: P95 response time
- **Threshold**: > 5 seconds
- **Action**: SNS notification

#### Database Throttling
- **Metric**: DynamoDB throttled requests
- **Threshold**: > 5 throttles in 5 minutes
- **Action**: SNS notification

#### Bedrock Throttling
- **Metric**: Bedrock throttled requests
- **Threshold**: > 3 throttles in 5 minutes
- **Action**: SNS notification

### Creating Custom Alarms

```bash
# Create a custom alarm for high costs
aws cloudwatch put-metric-alarm \
  --alarm-name BayonCoAgent-HighCosts \
  --alarm-description "Alert when daily costs exceed $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-west-2:ACCOUNT_ID:bayon-coagent-production-alarms
```

### SNS Notifications

#### Subscribe to Alarms

```bash
# Subscribe via email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-west-2:ACCOUNT_ID:bayon-coagent-production-alarms \
  --protocol email \
  --notification-endpoint your-email@example.com

# Subscribe via SMS
aws sns subscribe \
  --topic-arn arn:aws:sns:us-west-2:ACCOUNT_ID:bayon-coagent-production-alarms \
  --protocol sms \
  --notification-endpoint +1234567890
```

#### Test Notifications

```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-west-2:ACCOUNT_ID:bayon-coagent-production-alarms \
  --message "Test alarm notification" \
  --subject "Test Alert"
```

## Log Management

### Log Groups

#### Application Logs
- **Amplify**: `/aws/amplify/APP_ID`
- **Lambda**: `/aws/lambda/FUNCTION_NAME`
- **API Gateway**: `/aws/apigateway/bayon-coagent-production`

### Viewing Logs

#### CloudWatch Logs Insights

Access Logs Insights:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:logs-insights
```

#### Common Queries

**Find Errors**:
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

**Track User Authentication**:
```
fields @timestamp, @message
| filter @message like /authentication/
| stats count() by bin(5m)
```

**API Response Times**:
```
fields @timestamp, @message
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), min(@duration)
```

**Error Rate by Hour**:
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(1h)
```

### Log Retention

Configure retention policies:

```bash
# Set retention to 30 days for production
aws logs put-retention-policy \
  --log-group-name /aws/amplify/APP_ID \
  --retention-in-days 30

# Set retention to 7 days for development
aws logs put-retention-policy \
  --log-group-name /aws/amplify/DEV_APP_ID \
  --retention-in-days 7
```

### Log Exports

Export logs to S3 for long-term storage:

```bash
aws logs create-export-task \
  --log-group-name /aws/amplify/APP_ID \
  --from-time $(date -d '7 days ago' +%s)000 \
  --to-time $(date +%s)000 \
  --destination bayon-coagent-logs-archive \
  --destination-prefix production/amplify/
```

## X-Ray Tracing

### Viewing Traces

Access X-Ray console:
```
https://console.aws.amazon.com/xray/home?region=us-west-2
```

### Service Map

The service map shows:
- All services and their connections
- Request rates between services
- Error rates
- Latency distributions

### Trace Analysis

#### Find Slow Traces

```bash
# Get trace IDs for slow requests
aws xray get-trace-summaries \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --filter-expression 'duration >= 5'
```

#### Analyze a Specific Trace

```bash
aws xray batch-get-traces \
  --trace-ids TRACE_ID
```

### X-Ray Annotations

Add custom annotations in your code:

```typescript
import * as AWSXRay from 'aws-xray-sdk-core';

// Add annotation
const segment = AWSXRay.getSegment();
segment.addAnnotation('userId', user.id);
segment.addAnnotation('operationType', 'contentGeneration');

// Add metadata
segment.addMetadata('requestParams', params);
```

Query by annotations:
```
annotation.userId = "user-123" AND annotation.operationType = "contentGeneration"
```

## Performance Monitoring

### Application Performance Metrics

#### Key Performance Indicators (KPIs)

1. **Page Load Time**: Target < 3 seconds
2. **Time to Interactive (TTI)**: Target < 5 seconds
3. **First Contentful Paint (FCP)**: Target < 1.5 seconds
4. **API Response Time**: Target < 500ms (P95)

#### Real User Monitoring (RUM)

Set up CloudWatch RUM:

```bash
aws rum create-app-monitor \
  --name bayon-coagent-production \
  --domain your-domain.com \
  --app-monitor-configuration '{
    "AllowCookies": true,
    "EnableXRay": true,
    "SessionSampleRate": 1.0,
    "Telemetries": ["errors", "performance", "http"]
  }'
```

### Database Performance

#### DynamoDB Metrics

Monitor these metrics:
- **ConsumedReadCapacityUnits**: Should be < provisioned capacity
- **ConsumedWriteCapacityUnits**: Should be < provisioned capacity
- **SystemErrors**: Should be near 0
- **UserErrors**: Monitor for conditional check failures

#### Query Performance

```bash
# Enable DynamoDB Contributor Insights
aws dynamodb update-continuous-backups \
  --table-name BayonCoAgent-production \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### API Performance

Track API endpoint performance:

```typescript
// Add custom metrics
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({ region: 'us-west-2' });

await cloudwatch.putMetricData({
  Namespace: 'BayonCoAgent/API',
  MetricData: [{
    MetricName: 'EndpointLatency',
    Value: latency,
    Unit: 'Milliseconds',
    Dimensions: [
      { Name: 'Endpoint', Value: '/api/content/generate' },
      { Name: 'Environment', Value: 'production' }
    ]
  }]
});
```

## Cost Monitoring

### AWS Cost Explorer

Access Cost Explorer:
```
https://console.aws.amazon.com/cost-management/home#/cost-explorer
```

### Cost Allocation Tags

Tag all resources:

```bash
# Tag DynamoDB table
aws dynamodb tag-resource \
  --resource-arn arn:aws:dynamodb:us-west-2:ACCOUNT_ID:table/BayonCoAgent-production \
  --tags Key=Environment,Value=production Key=Application,Value=BayonCoAgent Key=CostCenter,Value=Engineering

# Tag S3 bucket
aws s3api put-bucket-tagging \
  --bucket bayon-coagent-storage-production-ACCOUNT_ID \
  --tagging 'TagSet=[{Key=Environment,Value=production},{Key=Application,Value=BayonCoAgent}]'
```

### Budget Alerts

Create a monthly budget:

```bash
aws budgets create-budget \
  --account-id ACCOUNT_ID \
  --budget '{
    "BudgetName": "BayonCoAgent-Monthly",
    "BudgetLimit": {
      "Amount": "500",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "billing@example.com"
    }]
  }'
```

### Cost Optimization

#### Identify High-Cost Services

```bash
# Get cost breakdown by service
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '1 month ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

#### Bedrock AI Cost Tracking

Monitor AI usage costs:

```typescript
// Track token usage
const response = await bedrock.invokeModel({
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  body: JSON.stringify(params)
});

// Log usage for cost tracking
await cloudwatch.putMetricData({
  Namespace: 'BayonCoAgent/AI',
  MetricData: [{
    MetricName: 'TokensUsed',
    Value: response.usage.totalTokens,
    Unit: 'Count',
    Dimensions: [
      { Name: 'ModelId', Value: 'claude-3-5-sonnet' },
      { Name: 'FeatureType', Value: 'contentGeneration' }
    ]
  }]
});
```

## Incident Response

### Incident Detection

Alarms trigger SNS notifications. When an alarm fires:

1. **Acknowledge**: Respond to the alert
2. **Assess**: Check CloudWatch dashboards
3. **Investigate**: Review logs and traces
4. **Mitigate**: Take corrective action
5. **Document**: Record the incident

### Common Incidents

#### High Error Rate

1. Check CloudWatch Logs for error details
2. Review X-Ray traces for failed requests
3. Check recent deployments
4. Consider rollback if deployment-related

#### High Latency

1. Check database throttling metrics
2. Review X-Ray service map for bottlenecks
3. Check Bedrock AI latency
4. Review recent code changes

#### Service Unavailability

1. Check AWS Service Health Dashboard
2. Verify CloudFormation stack status
3. Check Amplify deployment status
4. Review ALB/API Gateway health

### Runbook Example

**Incident**: DynamoDB Throttling

```markdown
## DynamoDB Throttling Runbook

### Symptoms
- Alarm: "DynamoDB-Throttling"
- Impact: Slow response times, errors

### Investigation
1. Check DynamoDB metrics in CloudWatch
2. Identify throttled operations (Read/Write)
3. Review access patterns in X-Ray

### Resolution
Option 1: Temporary increase
- Increase provisioned capacity (if not using PAY_PER_REQUEST)

Option 2: Optimize queries
- Review and optimize query patterns
- Add GSI if needed
- Implement caching

Option 3: Switch to On-Demand
- Convert to PAY_PER_REQUEST billing
```

## Best Practices

### Dashboard Organization

- Create role-specific dashboards (ops, dev, business)
- Use consistent widget sizes and layouts
- Include trend lines and anomaly detection
- Set appropriate time ranges

### Alarm Strategy

- Use composite alarms for complex conditions
- Set appropriate thresholds based on baseline
- Avoid alarm fatigue with proper tuning
- Use alarm actions for auto-remediation

### Log Management

- Use structured logging (JSON format)
- Include correlation IDs for request tracing
- Set appropriate retention periods
- Export logs for compliance

### Cost Management

- Tag all resources consistently
- Review costs weekly
- Set up budget alerts
- Optimize resource usage regularly

## Additional Resources

- [CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
