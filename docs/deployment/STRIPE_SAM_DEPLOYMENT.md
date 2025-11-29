# Stripe Lambda Deployment with SAM

Since you're using SAM (not CDK), here's how to add the Stripe Lambda handler to your existing SAM template.

## Quick Deploy

### Step 1: Add Stripe Lambda to SAM Template

Add the content from `stripe-lambda-addition.yaml` to your `template.yaml` file after the `SyncSocialAnalyticsFunction` (around line 3030).

Or run this command to append it automatically:

```bash
# Backup your template first
cp template.yaml template.yaml.backup

# Add Stripe Lambda configuration
cat stripe-lambda-addition.yaml >> template.yaml
```

### Step 2: Update Stripe Secret

Set your actual Stripe secret key:

```bash
aws secretsmanager update-secret \
  --secret-id bayon-stripe-secret-development \
  --region us-west-2 \
  --secret-string '{"secret_key":"sk_test_YOUR_ACTUAL_KEY"}'
```

### Step 3: Deploy with SAM

```bash
npm run sam:deploy:dev
```

Or manually:

```bash
sam build
sam deploy \
  --stack-name bayon-coagent-development \
  --region us-west-2 \
  --parameter-overrides Environment=development \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --no-confirm-changeset
```

### Step 4: Test

```bash
# Trigger test event
stripe trigger customer.subscription.created

# Watch logs
aws logs tail /aws/lambda/bayon-coagent-stripe-subscription-handler-development \
  --region us-west-2 \
  --follow
```

## What Gets Deployed

1. **Lambda Function**: `bayon-coagent-stripe-subscription-handler-development`

   - Triggered by EventBridge when Stripe events occur
   - Updates DynamoDB with subscription status
   - Handles all 5 subscription events

2. **EventBridge Rule**: Automatically created by SAM

   - Connects to your existing Stripe event bus
   - Filters for subscription events only
   - Includes retry policy (3 attempts)

3. **Dead Letter Queue**: `bayon-stripe-events-dlq-development`

   - Captures failed events for debugging
   - 14-day retention

4. **CloudWatch Alarm**: Alerts when events fail

5. **Secrets Manager**: Stores Stripe secret key securely

## Event Bus Configuration

The Lambda is configured to use your existing Stripe event bus:

```yaml
EventBusName: aws.partner/stripe.com/ed_test_61ThQU3sr9KLkWPGq16ThPlt3iSQLw25fKzPmC3uK2lk
```

If your event bus name is different, update it in the template.

## Environment Variables

The Lambda automatically gets:

- `DYNAMODB_TABLE_NAME`: From SAM template
- `STRIPE_SECRET_KEY`: From Secrets Manager
- `NODE_ENV`: development or production

## Monitoring

### CloudWatch Logs

```bash
aws logs tail /aws/lambda/bayon-coagent-stripe-subscription-handler-development \
  --region us-west-2 \
  --follow
```

### Lambda Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=bayon-coagent-stripe-subscription-handler-development \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2
```

### Dead Letter Queue

```bash
# Get DLQ URL
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --region us-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`StripeEventDLQUrl`].OutputValue' \
  --output text

# Check for failed messages
aws sqs receive-message \
  --queue-url <DLQ_URL> \
  --region us-west-2
```

## Troubleshooting

### Lambda Not Receiving Events

1. **Check EventBridge rule exists:**

```bash
aws events list-rules \
  --region us-west-2 \
  --query "Rules[?contains(Name, 'Stripe')]"
```

2. **Verify rule is enabled:**

```bash
aws events describe-rule \
  --name <rule-name> \
  --region us-west-2
```

3. **Check Lambda permissions:**

```bash
aws lambda get-policy \
  --function-name bayon-coagent-stripe-subscription-handler-development \
  --region us-west-2
```

### Events Failing

1. **Check CloudWatch Logs for errors**
2. **Verify Stripe secret key is correct**
3. **Ensure DynamoDB table name matches**
4. **Check Lambda has DynamoDB permissions**

### Update Stripe Secret

```bash
aws secretsmanager update-secret \
  --secret-id bayon-stripe-secret-development \
  --region us-west-2 \
  --secret-string '{"secret_key":"sk_test_NEW_KEY"}'
```

## Production Deployment

```bash
# Update production secret
aws secretsmanager update-secret \
  --secret-id bayon-stripe-secret-production \
  --region us-west-2 \
  --secret-string '{"secret_key":"sk_live_YOUR_LIVE_KEY"}'

# Deploy to production
npm run sam:deploy:prod
```

## Manual Addition to template.yaml

If you prefer to manually add the Stripe Lambda, copy the content from `stripe-lambda-addition.yaml` and paste it into your `template.yaml` file in these locations:

1. **Lambda Function**: Add after line 3030 (after SyncSocialAnalyticsFunction)
2. **DLQ and Alarm**: Add in the Resources section
3. **Outputs**: Add at the end of the Outputs section

Then run `sam build && sam deploy`.

## Verify Deployment

```bash
# Check Lambda exists
aws lambda get-function \
  --function-name bayon-coagent-stripe-subscription-handler-development \
  --region us-west-2

# Check EventBridge rule
aws events list-targets-by-rule \
  --rule <rule-name> \
  --region us-west-2

# Test with Stripe CLI
stripe trigger customer.subscription.created

# Watch logs
aws logs tail /aws/lambda/bayon-coagent-stripe-subscription-handler-development \
  --region us-west-2 \
  --follow
```

---

**Ready to deploy? Follow the steps above!** 🚀
