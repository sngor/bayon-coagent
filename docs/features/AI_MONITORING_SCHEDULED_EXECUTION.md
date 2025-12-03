# AI Monitoring Scheduled Execution

## Overview

The AI Monitoring feature includes automated scheduled execution via AWS EventBridge and Lambda. This document describes the scheduled monitoring infrastructure and how it processes AI visibility monitoring for all users.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  EventBridge Rule                            │
│  Schedule: Weekly (Mondays at 3 AM UTC)                     │
│  cron(0 3 ? * MON *)                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           Scheduled AI Monitoring Lambda                     │
│  - Timeout: 15 minutes                                      │
│  - Memory: 2048 MB                                          │
│  - Handler: scheduled-ai-monitoring.handler                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              AI Monitoring Scheduler Service                 │
│  - Query AI platforms (ChatGPT, Perplexity, etc.)          │
│  - Detect agent mentions                                    │
│  - Analyze sentiment and context                            │
│  - Calculate visibility scores                              │
│  - Generate alerts                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DynamoDB Storage                          │
│  - AI mentions                                              │
│  - Visibility scores                                        │
│  - Monitoring configs                                       │
│  - Alert history                                            │
└─────────────────────────────────────────────────────────────┘
```

## Lambda Function

### Function Details

- **Name**: `bayon-coagent-scheduled-ai-monitoring-{environment}`
- **Runtime**: Node.js 22.x
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 2048 MB
- **Handler**: `scheduled-ai-monitoring.handler`
- **Schedule**: Weekly on Mondays at 3 AM UTC

### Environment Variables

```yaml
LOG_LEVEL: INFO
CLOUDWATCH_NAMESPACE: BayonCoAgent/AIMonitoring
DYNAMODB_TABLE_NAME: BayonCoAgent-{environment}
S3_BUCKET_NAME: bayon-coagent-storage-{environment}
LAMBDA_VERSION: "1.0.0"
OPENAI_API_KEY: (from Secrets Manager)
PERPLEXITY_API_KEY: (from Secrets Manager)
ANTHROPIC_API_KEY: (from Secrets Manager)
GOOGLE_AI_API_KEY: (from Secrets Manager)
```

### IAM Permissions

The Lambda function uses the `ContentWorkflowLambdaRole` which includes:

- **DynamoDB**: Read/write access to monitoring configs, mentions, and scores
- **Bedrock**: Invoke AI models for sentiment analysis and topic extraction
- **CloudWatch**: Write logs and metrics
- **Secrets Manager**: Read API keys for AI platforms
- **SQS**: Send messages to Dead Letter Queue on failure

## EventBridge Rule

### Schedule Expression

```
cron(0 3 ? * MON *)
```

This runs every Monday at 3 AM UTC.

### Event Payload

```json
{
  "source": "aws.events",
  "detail-type": "Scheduled Event",
  "detail": {
    "maxUsers": 50,
    "batchSize": 10
  }
}
```

### Retry Policy

- **Maximum Retry Attempts**: 2
- **Dead Letter Queue**: `bayon-coagent-scheduled-ai-monitoring-dlq-{environment}`

## Processing Flow

### 1. User Discovery

The Lambda function queries DynamoDB for all users with AI monitoring enabled:

```typescript
// Query for users with enabled monitoring configs
const users = await getUsersWithMonitoringEnabled();
```

### 2. Schedule Check

For each user, the function checks if monitoring is due based on their configured frequency:

```typescript
const config = await repository.getAIMonitoringConfig(userId);
const shouldRun = await shouldRunMonitoring(config);
```

### 3. Monitoring Execution

If monitoring is due, the function executes the monitoring workflow:

```typescript
const result = await scheduler.executeMonitoring(userId);
// Returns: { queriesExecuted, mentionsFound, errors }
```

### 4. Alert Generation

After successful monitoring, the function checks for alerts:

```typescript
const alerts = await alertService.checkForAlerts(userId);
// Generates alerts for significant score changes or negative mentions
```

### 5. Error Handling

Errors are logged and tracked but don't stop processing of other users:

```typescript
try {
  await processUser(user);
} catch (error) {
  result.errors.push({ userId, error, timestamp });
  // Continue with next user
}
```

## Monitoring and Alerts

### CloudWatch Alarms

Three alarms monitor the Lambda function:

1. **Error Alarm**: Triggers when the function has errors

   - Threshold: 1 error in 5 minutes
   - Action: Send notification to alarm topic

2. **Duration Alarm**: Triggers when execution time is too long

   - Threshold: 12 minutes average
   - Action: Send notification to alarm topic

3. **Throttle Alarm**: Triggers when the function is throttled
   - Threshold: 1 throttle in 5 minutes
   - Action: Send notification to alarm topic

### CloudWatch Metrics

The function publishes custom metrics to the `BayonCoAgent/AIMonitoring` namespace:

- `UsersProcessed`: Number of users successfully processed
- `QueriesExecuted`: Total AI platform queries executed
- `MentionsFound`: Total agent mentions detected
- `AlertsGenerated`: Total alerts generated
- `ProcessingErrors`: Number of errors encountered

### CloudWatch Dashboard

The function metrics are included in the main CloudWatch dashboard:

- Invocations, Errors, Duration, Throttles
- Dead Letter Queue message count

## Dead Letter Queue

### Queue Details

- **Name**: `bayon-coagent-scheduled-ai-monitoring-dlq-{environment}`
- **Message Retention**: 14 days
- **Visibility Timeout**: 60 seconds

### DLQ Processing

Failed events are sent to the DLQ for manual review and reprocessing. The DLQ is monitored via CloudWatch alarms.

## Rate Limiting and Cost Control

### Query Limits

Each user has a configurable query limit per period (default: 100 queries per week).

### Rate Limit Enforcement

The monitoring scheduler checks rate limits before executing queries:

```typescript
const rateLimitCheck = await scheduler.checkRateLimits(userId);
if (!rateLimitCheck.canExecute) {
  // Skip user or reschedule
}
```

### Cost Tracking

The function tracks API usage and costs:

- Query count per user
- Estimated cost per execution
- Total cost per monitoring period

## Batch Processing

### User Batching

To avoid timeouts, the function processes users in batches:

```typescript
const maxUsers = event.detail?.maxUsers || 50;
const batchSize = event.detail?.batchSize || 10;
```

### Timeout Handling

The function monitors remaining execution time and stops processing before timeout:

```typescript
const remainingTime = context.getRemainingTimeInMillis();
if (remainingTime < 60000) {
  // Stop processing, leave 60 seconds buffer
  break;
}
```

## Deployment

### SAM Template

The Lambda function is defined in `template.yaml`:

```yaml
ScheduledAIMonitoringFunction:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: !Sub bayon-coagent-scheduled-ai-monitoring-${Environment}
    CodeUri: src/lambda/
    Handler: scheduled-ai-monitoring.handler
    Runtime: nodejs22.x
    Timeout: 900
    MemorySize: 2048
    Role: !GetAtt ContentWorkflowLambdaRole.Arn
    Events:
      WeeklySchedule:
        Type: Schedule
        Properties:
          Schedule: cron(0 3 ? * MON *)
```

### Deployment Commands

```bash
# Deploy to development
npm run sam:deploy:dev

# Deploy to production
npm run sam:deploy:prod
```

## Testing

### Unit Tests

Unit tests are located in `src/lambda/__tests__/scheduled-ai-monitoring.test.ts`:

```bash
npm test src/lambda/__tests__/scheduled-ai-monitoring.test.ts
```

### Manual Invocation

You can manually invoke the Lambda function for testing:

```bash
aws lambda invoke \
  --function-name bayon-coagent-scheduled-ai-monitoring-development \
  --payload '{"source":"manual","detail":{"maxUsers":5}}' \
  response.json
```

### Dry Run

The function supports a dry run mode for testing without executing queries:

```json
{
  "source": "manual",
  "detail": {
    "dryRun": true,
    "maxUsers": 10
  }
}
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**

   - Reduce `maxUsers` in event payload
   - Increase Lambda timeout (max 15 minutes)
   - Optimize query execution

2. **Rate Limit Exceeded**

   - Check user query limits in monitoring configs
   - Adjust rate limit period
   - Reduce query frequency

3. **API Key Errors**

   - Verify API keys in Secrets Manager
   - Check IAM permissions for Secrets Manager access
   - Ensure keys are valid and not expired

4. **DLQ Messages**
   - Check CloudWatch Logs for error details
   - Review DLQ messages in SQS console
   - Manually reprocess failed events

### CloudWatch Logs

View logs in CloudWatch Logs:

```
/aws/lambda/bayon-coagent-scheduled-ai-monitoring-{environment}
```

Filter patterns:

- `{ $.level = "ERROR" }` - All errors
- `{ $.userId = "user-123" }` - Specific user
- `{ $.queriesExecuted > 0 }` - Successful executions

## Future Enhancements

1. **Dynamic Scheduling**: Adjust frequency based on user activity
2. **Priority Queue**: Process high-priority users first
3. **Parallel Processing**: Use Step Functions for parallel execution
4. **Smart Batching**: Optimize batch sizes based on historical data
5. **Cost Optimization**: Cache results, deduplicate queries
6. **Multi-Region**: Deploy to multiple regions for global coverage

## References

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [EventBridge Scheduled Rules](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)
- [AI Monitoring Design Document](../../.kiro/specs/ai-search-monitoring/design.md)
- [AI Monitoring Requirements](../../.kiro/specs/ai-search-monitoring/requirements.md)
