# Stripe + EventBridge Integration Setup

This guide explains how to set up Stripe events with AWS EventBridge instead of webhooks for better AWS-native integration.

## Architecture

```
Stripe Events
    ↓
EventBridge (Stripe Partner Event Source)
    ↓
EventBridge Rule (filter subscription events)
    ↓
Lambda Function (stripe-subscription-handler)
    ↓
DynamoDB (update user profiles)
    ↓
Dead Letter Queue (failed events)
```

## Why EventBridge Over Webhooks?

| Feature                | Webhook            | EventBridge          |
| ---------------------- | ------------------ | -------------------- |
| **Scalability**        | Limited by Next.js | Automatic            |
| **Retry Logic**        | Manual             | Built-in (3 retries) |
| **Monitoring**         | Custom             | CloudWatch native    |
| **Decoupling**         | Tight              | Loose                |
| **Multiple Consumers** | No                 | Yes                  |
| **Dead Letter Queue**  | Manual             | Built-in             |
| **AWS Native**         | No                 | Yes                  |

## Setup Steps

### 1. Deploy Infrastructure

```bash
# Deploy the EventBridge stack
cd infrastructure
npm run cdk deploy StripeEventBridgeStack -- --context environment=development
```

This creates:

- EventBridge Event Bus
- Lambda function for processing events
- EventBridge Rule with event filtering
- Dead Letter Queue for failed events
- CloudWatch Logs and Alarms

### 2. Connect Stripe to EventBridge

1. **Go to Stripe Dashboard**: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

2. **Click "Add destination" → "Amazon EventBridge"**

3. **Select your AWS region** (e.g., us-east-1)

4. **Copy the Partner Event Source name** from Stripe

5. **Go to AWS EventBridge Console**: [https://console.aws.amazon.com/events](https://console.aws.amazon.com/events)

6. **Navigate to "Partner event sources"**

7. **Find the Stripe event source** and click "Associate with event bus"

8. **Select your event bus**: `bayon-stripe-events-development`

9. **Click "Associate"**

10. **Back in Stripe Dashboard**, verify the connection status shows "Active"

### 3. Configure Event Filtering

The EventBridge Rule automatically filters for these events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

No additional configuration needed!

### 4. Update Environment Variables

The Lambda function needs:

```bash
# In AWS Systems Manager Parameter Store or Secrets Manager
STRIPE_SECRET_KEY=sk_live_...
DYNAMODB_TABLE_NAME=BayonCoAgent-development
```

### 5. Remove Webhook API Route (Optional)

Since EventBridge handles events, you can remove:

- `src/app/api/stripe/webhook/route.ts`

Or keep it as a backup for local development.

## Testing

### Test with Stripe CLI

```bash
# Forward events to EventBridge (requires AWS credentials)
stripe trigger customer.subscription.created
```

### Monitor Events

**CloudWatch Logs:**

```bash
aws logs tail /aws/lambda/bayon-stripe-subscription-handler-development --follow
```

**EventBridge Metrics:**

- Go to CloudWatch → Metrics → EventBridge
- View: Invocations, FailedInvocations, ThrottledRules

**Dead Letter Queue:**

```bash
aws sqs receive-message --queue-url <DLQ_URL>
```

## Local Development

For local testing, you can still use the webhook approach:

1. Keep `src/app/api/stripe/webhook/route.ts` for local dev
2. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Production uses EventBridge automatically

## Monitoring & Alerts

**CloudWatch Alarms:**

- DLQ messages > 0 (failed events)
- Lambda errors > threshold
- Lambda duration > timeout

**Metrics to Watch:**

- Lambda invocations
- Lambda errors
- EventBridge rule invocations
- DLQ message count

## Troubleshooting

**Events not reaching Lambda:**

1. Check EventBridge Partner Event Source is "Active"
2. Verify Event Bus association
3. Check EventBridge Rule is enabled
4. Review Lambda permissions

**Lambda errors:**

1. Check CloudWatch Logs
2. Verify DynamoDB permissions
3. Ensure STRIPE_SECRET_KEY is set
4. Check Lambda timeout (30s default)

**Failed events in DLQ:**

1. Check DLQ messages
2. Review error details
3. Fix issue and replay events
4. Use SQS redrive policy

## Cost Comparison

**Webhook Approach:**

- Next.js always running: ~$50-100/month
- API Gateway (if used): $3.50 per million requests

**EventBridge Approach:**

- EventBridge: $1 per million events
- Lambda: $0.20 per million requests (with free tier)
- Total: ~$1-5/month for typical usage

**Savings: ~90% reduction in costs**

## Migration from Webhook

1. Deploy EventBridge stack
2. Connect Stripe to EventBridge
3. Test with a few events
4. Monitor for 24 hours
5. Remove webhook endpoint from Stripe
6. (Optional) Remove webhook API route

## Production Checklist

- [ ] Deploy EventBridge stack to production
- [ ] Connect Stripe production account to EventBridge
- [ ] Associate Partner Event Source with production event bus
- [ ] Update Lambda environment variables with production values
- [ ] Test with production Stripe account
- [ ] Set up CloudWatch alarms
- [ ] Monitor DLQ for failed events
- [ ] Remove old webhook endpoint
- [ ] Update documentation

## Benefits Realized

✅ **Decoupled architecture** - Lambda runs independently
✅ **Automatic retries** - 3 retries with exponential backoff
✅ **Dead letter queue** - Failed events captured for replay
✅ **Better monitoring** - CloudWatch metrics and alarms
✅ **Cost savings** - Pay only for events processed
✅ **Scalability** - Handles high volume automatically
✅ **AWS-native** - Consistent with your existing architecture

## Next Steps

1. Deploy the EventBridge stack
2. Connect Stripe to EventBridge
3. Test with a subscription creation
4. Monitor CloudWatch Logs
5. Set up alarms for production

---

**Note**: This approach is recommended for production. For local development, you can continue using the webhook API route with Stripe CLI.
