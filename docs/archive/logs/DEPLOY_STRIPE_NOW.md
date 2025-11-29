# Deploy Stripe Lambda Handler - Ready to Go!

Your Stripe EventBridge is already connected in **us-west-2**!

**Event Bus**: `aws.partner/stripe.com/ed_test_61ThQU3sr9KLkWPGq16ThPlt3iSQLw25fKzPmC3uK2lk`

## Deploy Now (2 commands)

### 1. Deploy the Lambda Handler

```bash
cd infrastructure
npm run cdk deploy BayonCoAgent-development-Stripe -- --context environment=development
```

This creates:

- Lambda function: `bayon-stripe-subscription-handler-development`
- EventBridge rule to route Stripe events to Lambda
- Dead Letter Queue for failed events
- CloudWatch Logs and Alarms

### 2. Set Stripe Secret Key

```bash
aws lambda update-function-configuration \
  --function-name bayon-stripe-subscription-handler-development \
  --region us-west-2 \
  --environment "Variables={DYNAMODB_TABLE_NAME=BayonCoAgent-development,STRIPE_SECRET_KEY=sk_test_...,NODE_ENV=development}"
```

Replace `sk_test_...` with your actual Stripe secret key.

## Test It

```bash
# Trigger a test subscription event
stripe trigger customer.subscription.created

# Watch the Lambda logs
aws logs tail /aws/lambda/bayon-stripe-subscription-handler-development --region us-west-2 --follow
```

## What Happens

1. User signs up and selects a plan on your website
2. Stripe creates a subscription
3. Stripe sends event to EventBridge (us-west-2)
4. EventBridge routes event to Lambda
5. Lambda updates DynamoDB with subscription info
6. User profile now has:
   - `subscriptionId`
   - `subscriptionStatus` (active/past_due/canceled)
   - `subscriptionPriceId`
   - `subscriptionCurrentPeriodEnd`

## Verify Deployment

```bash
# Check Lambda exists
aws lambda get-function --function-name bayon-stripe-subscription-handler-development --region us-west-2

# Check EventBridge rule
aws events list-rules --region us-west-2 --query "Rules[?contains(Name, 'stripe')]"

# Check recent logs
aws logs tail /aws/lambda/bayon-stripe-subscription-handler-development --region us-west-2
```

## Monitor

**CloudWatch Dashboard**:
https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:

**Lambda Metrics**:
https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/bayon-stripe-subscription-handler-development

**EventBridge Rules**:
https://us-west-2.console.aws.amazon.com/events/home?region=us-west-2#/rules

## Troubleshooting

**If deployment fails:**

```bash
# Check CDK bootstrap
npm run cdk bootstrap aws://ACCOUNT-ID/us-west-2

# Try again
npm run cdk deploy BayonCoAgent-development-Stripe -- --context environment=development
```

**If events aren't reaching Lambda:**

1. Check EventBridge rule is enabled
2. Verify Lambda has EventBridge invoke permissions
3. Check CloudWatch Logs for errors

**If DynamoDB isn't updating:**

1. Verify Lambda has DynamoDB UpdateItem permission
2. Check userId is in subscription metadata
3. Review Lambda logs for errors

## Production Deployment

Once tested in development:

```bash
# Deploy to production
npm run cdk deploy BayonCoAgent-production-Stripe -- --context environment=production

# Set production Stripe key
aws lambda update-function-configuration \
  --function-name bayon-stripe-subscription-handler-production \
  --region us-west-2 \
  --environment "Variables={DYNAMODB_TABLE_NAME=BayonCoAgent-production,STRIPE_SECRET_KEY=sk_live_...,NODE_ENV=production}"
```

---

**Ready to deploy? Run the commands above!** 🚀
