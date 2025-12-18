# Trial Notifications Quick Reference

## Overview

Automated system for managing 7-day professional trial notifications and subscription lifecycle.

## Lambda Function

**Function**: `bayon-coagent-trial-notifications-{environment}`
**Schedule**: Daily at 12:00 PM UTC
**Runtime**: Node.js 22.x (ARM64)
**Timeout**: 5 minutes
**Memory**: 512 MB

## Process Flow

```
Daily Trigger (12 PM UTC)
    ↓
Scan DynamoDB for Active Trials
    ↓
Calculate Days Remaining
    ↓
Send Notifications (3-day & 1-day warnings)
    ↓
Handle Expired Trials
    ↓
Return Processing Summary
```

## Email Notifications

### 3-Day Warning
- **Subject**: "Your Bayon CoAgent trial expires in 3 days"
- **Content**: Feature benefits, upgrade encouragement
- **CTA**: "Continue with Professional Plan"

### 1-Day Warning
- **Subject**: "Your Bayon CoAgent trial expires in 1 day"
- **Content**: Urgent messaging, last chance
- **CTA**: "Continue with Professional Plan"

## Environment Variables

```bash
DYNAMODB_TABLE_NAME=BayonCoAgent-{environment}
SES_REGION=us-west-2
FROM_EMAIL=noreply@bayoncoagent.app
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
```

## Monitoring

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/bayon-coagent-trial-notifications-production --follow
```

### Key Metrics
- Notification success/failure rates
- Email delivery statistics
- Trial conversion rates
- Processing duration

## Testing

### Local Testing
```bash
# Test function locally (requires AWS credentials)
cd src/lambda
npm install
npx tsc
node dist/trial-notifications.js
```

### Production Testing
```bash
# Invoke function manually
aws lambda invoke \
  --function-name bayon-coagent-trial-notifications-production \
  --payload '{"source":"manual-test"}' \
  response.json

# Check response
cat response.json
```

## Troubleshooting

### Common Issues

**No notifications sent**:
- Check SES sending limits: `aws ses get-send-quota`
- Verify FROM_EMAIL is verified in SES
- Review Lambda logs for errors

**Incorrect trial calculations**:
- Validate DynamoDB subscription data format
- Check timezone handling (function uses UTC)
- Verify trial start date format

**High bounce rates**:
- Monitor SES reputation: `aws ses get-reputation`
- Check email template formatting
- Validate recipient email addresses

### Debug Commands

```bash
# Check function configuration
aws lambda get-function-configuration \
  --function-name bayon-coagent-trial-notifications-production

# View recent invocations
aws lambda get-function \
  --function-name bayon-coagent-trial-notifications-production

# Check SES statistics
aws ses get-send-statistics

# Query trial subscriptions
aws dynamodb scan \
  --table-name BayonCoAgent-production \
  --filter-expression "begins_with(SK, :sk)" \
  --expression-attribute-values '{":sk":{"S":"SUBSCRIPTION"}}'
```

## Manual Operations

### Extend Trial
```bash
# Update trial end date in DynamoDB
aws dynamodb update-item \
  --table-name BayonCoAgent-production \
  --key '{"PK":{"S":"USER#userId"},"SK":{"S":"SUBSCRIPTION"}}' \
  --update-expression "SET #data.#trialEndsAt = :newDate" \
  --expression-attribute-names '{"#data":"Data","#trialEndsAt":"trialEndsAt"}' \
  --expression-attribute-values '{":newDate":{"S":"2024-01-15T00:00:00.000Z"}}'
```

### Force Notification
```bash
# Manually invoke function
aws lambda invoke \
  --function-name bayon-coagent-trial-notifications-production \
  --payload '{"source":"manual","detail":{"action":"force-check"}}' \
  response.json
```

## Related Documentation

- [Subscription System](../features/subscription-system.md)
- [Lambda Functions](../lambda/README.md)
- [Email Service](../features/email-service.md)
- [Deployment Guide](../deployment/deployment.md)