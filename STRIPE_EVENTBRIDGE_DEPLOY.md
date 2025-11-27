# Deploy Stripe Lambda Handler (EventBridge Already Connected)

Since you already have EventBridge connected to Stripe, you just need to deploy the Lambda handler and create the EventBridge rule.

## Quick Deploy

### Option 1: Deploy Full Stack (Recommended)

This creates everything including a new event bus:

```bash
cd infrastructure
npm run cdk deploy BayonCoAgent-development-Stripe -- --context environment=development
```

### Option 2: Deploy Just the Lambda (If you want to use your existing event bus)

If you prefer to use your existing Stripe event bus, follow these steps:

#### Step 1: Find Your Existing Event Bus Name

```bash
aws events list-event-buses --query "EventBuses[?contains(Name, 'stripe') || contains(Name, 'Stripe')].Name" --output table
```

Or check in AWS Console: EventBridge → Event buses

#### Step 2: Update the Stack to Use Your Event Bus

Edit `infrastructure/lib/stripe-eventbridge-stack.ts` line 33-35:

```typescript
// Replace this:
this.stripeEventBus = new events.EventBus(this, "StripeEventBus", {
  eventBusName: `bayon-stripe-events-${environment}`,
});

// With this (use your actual event bus name):
this.stripeEventBus = events.EventBus.fromEventBusName(
  this,
  "StripeEventBus",
  "aws.partner/stripe.com/acct_xxxxx/stripe-events" // Your actual event bus name
);
```

#### Step 3: Deploy

```bash
cd infrastructure
npm run cdk deploy BayonCoAgent-development-Stripe -- --context environment=development
```

## What Gets Deployed

1. **Lambda Function**: `bayon-stripe-subscription-handler-development`

   - Processes Stripe subscription events
   - Updates DynamoDB user profiles
   - Handles payment success/failure

2. **EventBridge Rule**: Routes these events to Lambda:

   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

3. **Dead Letter Queue**: Captures failed events for replay

4. **CloudWatch Logs**: `/aws/lambda/bayon-stripe-subscription-handler-development`

5. **CloudWatch Alarm**: Alerts when events fail

## Environment Variables Needed

The Lambda needs these environment variables (set automatically by CDK):

```bash
DYNAMODB_TABLE_NAME=BayonCoAgent-development
STRIPE_SECRET_KEY=sk_test_...  # Set this in AWS Systems Manager Parameter Store
NODE_ENV=development
```

### Set Stripe Secret Key

```bash
# Store in AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name "/bayon/development/stripe/secret-key" \
  --value "sk_test_..." \
  --type "SecureString" \
  --overwrite

# Update Lambda to use it
aws lambda update-function-configuration \
  --function-name bayon-stripe-subscription-handler-development \
  --environment "Variables={DYNAMODB_TABLE_NAME=BayonCoAgent-development,STRIPE_SECRET_KEY=sk_test_...,NODE_ENV=development}"
```

Or set it directly in the Lambda console: Lambda → Configuration → Environment variables

## Test the Integration

### 1. Trigger a Test Event from Stripe

```bash
stripe trigger customer.subscription.created
```

### 2. Check Lambda Logs

```bash
aws logs tail /aws/lambda/bayon-stripe-subscription-handler-development --follow
```

### 3. Verify DynamoDB Update

```bash
aws dynamodb get-item \
  --table-name BayonCoAgent-development \
  --key '{"PK":{"S":"USER#<userId>"},"SK":{"S":"PROFILE"}}'
```

You should see subscription fields populated.

## Verify EventBridge Connection

Check that Stripe events are flowing to your event bus:

```bash
# List event buses
aws events list-event-buses

# Check rules on your event bus
aws events list-rules --event-bus-name <your-stripe-event-bus-name>

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Events \
  --metric-name Invocations \
  --dimensions Name=RuleName,Value=bayon-stripe-subscription-events-development \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## Monitoring

### CloudWatch Logs

```bash
aws logs tail /aws/lambda/bayon-stripe-subscription-handler-development --follow
```

### Lambda Metrics

- Go to: CloudWatch → Metrics → Lambda
- View: Invocations, Errors, Duration

### Dead Letter Queue

```bash
# Get DLQ URL from stack outputs
aws cloudformation describe-stacks \
  --stack-name BayonCoAgent-development-Stripe \
  --query 'Stacks[0].Outputs[?OutputKey==`DLQUrl`].OutputValue' \
  --output text

# Check for failed messages
aws sqs receive-message --queue-url <DLQ_URL>
```

## Troubleshooting

### Lambda Not Receiving Events

1. **Check EventBridge Rule is enabled:**

```bash
aws events describe-rule --name bayon-stripe-subscription-events-development
```

2. **Verify rule targets:**

```bash
aws events list-targets-by-rule --rule bayon-stripe-subscription-events-development
```

3. **Check Lambda permissions:**

```bash
aws lambda get-policy --function-name bayon-stripe-subscription-handler-development
```

### Events Failing

1. **Check CloudWatch Logs for errors**
2. **Verify DynamoDB permissions**
3. **Ensure STRIPE_SECRET_KEY is set**
4. **Check Lambda timeout (default 30s)**

### DynamoDB Not Updating

1. **Verify userId is in subscription metadata**
2. **Check DynamoDB table name is correct**
3. **Ensure Lambda has UpdateItem permission**

## Remove Old Webhook (Optional)

Since EventBridge handles events now, you can:

1. **Remove webhook from Stripe Dashboard:**

   - Go to: Webhooks → Select webhook → Delete

2. **Remove webhook API route (optional):**
   - Keep `src/app/api/stripe/webhook/route.ts` for local dev
   - Or delete it if you don't need it

## Production Deployment

```bash
# Deploy to production
cd infrastructure
npm run cdk deploy BayonCoAgent-production-Stripe -- --context environment=production

# Set production Stripe key
aws lambda update-function-configuration \
  --function-name bayon-stripe-subscription-handler-production \
  --environment "Variables={DYNAMODB_TABLE_NAME=BayonCoAgent-production,STRIPE_SECRET_KEY=sk_live_...,NODE_ENV=production}"
```

## Stack Outputs

After deployment, you'll see:

```
Outputs:
BayonCoAgent-development-Stripe.EventBusName = bayon-stripe-events-development
BayonCoAgent-development-Stripe.EventBusArn = arn:aws:events:...
BayonCoAgent-development-Stripe.HandlerFunctionName = bayon-stripe-subscription-handler-development
BayonCoAgent-development-Stripe.DLQUrl = https://sqs.us-east-1.amazonaws.com/.../bayon-stripe-events-dlq-development
```

## Next Steps

1. Deploy the stack
2. Set STRIPE_SECRET_KEY environment variable
3. Test with `stripe trigger customer.subscription.created`
4. Monitor CloudWatch Logs
5. Verify DynamoDB updates
6. Set up CloudWatch alarms for production

---

**Note**: The webhook API route at `src/app/api/stripe/webhook/route.ts` can remain for local development with Stripe CLI, but production will use EventBridge exclusively.
