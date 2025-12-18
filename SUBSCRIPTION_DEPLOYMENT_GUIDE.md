# Subscription System Deployment Guide

## 🚀 **Next Steps Implementation Guide**

This guide covers the immediate next steps to complete the subscription system deployment and testing.

## 📋 **Pre-Deployment Checklist**

### **1. Environment Variables**
Ensure these environment variables are set in production:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # For EventBridge verification

# Email Configuration
FROM_EMAIL=noreply@bayoncoagent.app
AWS_SES_REGION=us-west-2

# Cron Job Security
CRON_SECRET_TOKEN=your-secure-random-token

# Application URLs
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
```

### **2. AWS Services Configuration**

#### **AWS SES (Simple Email Service)**
```bash
# Verify your domain in AWS SES
aws ses verify-domain-identity --domain bayoncoagent.app

# Create sending authorization policy
aws ses put-identity-policy --identity bayoncoagent.app --policy-name SendingPolicy --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::YOUR-ACCOUNT:root"},
      "Action": "ses:SendEmail",
      "Resource": "*"
    }
  ]
}'
```

#### **AWS EventBridge Configuration**
```bash
# Create EventBridge rule for Stripe events
aws events put-rule \
  --name stripe-subscription-events \
  --event-pattern '{
    "source": ["stripe"],
    "detail-type": ["Stripe Event"],
    "detail": {
      "type": [
        "customer.subscription.created",
        "customer.subscription.updated", 
        "customer.subscription.deleted",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
        "customer.subscription.trial_will_end"
      ]
    }
  }'

# Add target (your API endpoint)
aws events put-targets \
  --rule stripe-subscription-events \
  --targets "Id"="1","Arn"="https://bayoncoagent.app/api/stripe/eventbridge"
```

## 🧪 **Testing Phase**

### **Step 1: API Endpoint Testing**

#### **Test Subscription Status API**
```bash
# Test with a real user ID
curl -X GET "https://bayoncoagent.app/api/subscription/status?userId=USER_ID" \
  -H "Content-Type: application/json"

# Expected response:
{
  "success": true,
  "subscription": {
    "isActive": true,
    "plan": "professional",
    "status": "trialing",
    "trialEndsAt": "2024-01-15T00:00:00.000Z",
    "isInTrial": true,
    "trialDaysRemaining": 5,
    "currentPeriodEnd": "2024-01-15T00:00:00.000Z",
    "cancelAtPeriodEnd": false
  }
}
```

#### **Test Usage Tracking API**
```bash
# Get current usage
curl -X GET "https://bayoncoagent.app/api/subscription/usage?userId=USER_ID"

# Increment usage
curl -X POST "https://bayoncoagent.app/api/subscription/usage" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "feature": "aiContentGeneration"
  }'
```

#### **Test Development Endpoints**
```bash
# Test subscription service (development only)
curl -X GET "https://bayoncoagent.app/api/test-subscription?userId=USER_ID&action=status"

# Test feature usage
curl -X GET "https://bayoncoagent.app/api/test-subscription?userId=USER_ID&action=can-use&feature=aiContentGeneration"

# Test usage increment
curl -X GET "https://bayoncoagent.app/api/test-subscription?userId=USER_ID&action=increment&feature=aiContentGeneration"
```

### **Step 2: Email Notification Testing**

#### **Test Trial Notifications Manually**
```bash
# Trigger trial notification check (requires CRON_SECRET_TOKEN)
curl -X POST "https://bayoncoagent.app/api/cron/trial-notifications" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN" \
  -H "Content-Type: application/json"
```

#### **Test Individual Email Functions**
Create a test script to verify email functionality:

```typescript
// test-emails.ts
import { emailService } from '@/lib/email-service';

async function testEmails() {
  // Test trial expiry warning
  await emailService.sendTrialExpiryWarning('test@example.com', {
    userName: 'Test User',
    daysRemaining: 3,
    trialEndDate: '2024-01-15',
    upgradeUrl: 'https://bayoncoagent.app/settings?upgrade=true'
  });

  // Test trial expired notification
  await emailService.sendTrialExpiredNotification('test@example.com', {
    userName: 'Test User',
    upgradeUrl: 'https://bayoncoagent.app/settings?upgrade=true',
    freeTierLimits: { aiContent: 10, images: 5, research: 3, marketing: 1 }
  });

  console.log('Test emails sent successfully');
}

testEmails().catch(console.error);
```

### **Step 3: Stripe Integration Testing**

#### **Test Subscription Creation**
1. **Create test subscription in Stripe Dashboard**
2. **Verify EventBridge receives events**
3. **Check database updates**
4. **Verify email notifications**

#### **Test EventBridge Flow**
```bash
# Simulate Stripe event via EventBridge
aws events put-events --entries '[
  {
    "Source": "stripe",
    "DetailType": "Stripe Event",
    "Detail": "{\"type\":\"customer.subscription.created\",\"data\":{\"object\":{\"id\":\"sub_test123\",\"customer\":\"cus_test123\",\"status\":\"active\",\"metadata\":{\"userId\":\"test-user-id\"},\"items\":{\"data\":[{\"price\":{\"id\":\"price_test123\"}}]},\"current_period_start\":1640995200,\"current_period_end\":1643673600,\"cancel_at_period_end\":false,\"trial_end\":null}}}"
  }
]'
```

## 📅 **Cron Job Setup**

### **Option 1: AWS EventBridge Scheduled Rules**
```bash
# Create scheduled rule for daily trial notifications
aws events put-rule \
  --name daily-trial-notifications \
  --schedule-expression "cron(0 12 * * ? *)" \
  --description "Daily trial expiry notifications at 12 PM UTC"

# Add target
aws events put-targets \
  --rule daily-trial-notifications \
  --targets "Id"="1","Arn"="https://bayoncoagent.app/api/cron/trial-notifications","HttpParameters"="{\"HeaderParameters\":{\"Authorization\":\"Bearer YOUR_CRON_SECRET_TOKEN\"}}"
```

### **Option 2: External Cron Service (e.g., cron-job.org)**
```bash
# URL to call daily
POST https://bayoncoagent.app/api/cron/trial-notifications
Headers: Authorization: Bearer YOUR_CRON_SECRET_TOKEN
```

### **Option 3: Vercel Cron Jobs**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/trial-notifications",
      "schedule": "0 12 * * *"
    }
  ]
}
```

## 🔧 **AWS EventBridge Configuration**

### **Step 1: Configure Stripe to Send Events to EventBridge**

1. **In Stripe Dashboard:**
   - Go to Developers → Webhooks
   - Create new endpoint: `https://bayoncoagent.app/api/stripe/eventbridge`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`

2. **Alternative: Use Stripe CLI for testing:**
```bash
# Forward Stripe events to local development
stripe listen --forward-to localhost:3000/api/stripe/eventbridge

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.trial_will_end
```

### **Step 2: Verify EventBridge Integration**

Monitor EventBridge events:
```bash
# Check CloudWatch logs for EventBridge
aws logs describe-log-groups --log-group-name-prefix "/aws/events/"

# Monitor API Gateway logs (if using API Gateway)
aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway/"
```

## 📊 **Monitoring & Analytics Setup**

### **Step 1: CloudWatch Dashboards**

Create monitoring dashboard for subscription metrics:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", "ApiName", "subscription-api"],
          ["AWS/ApiGateway", "Latency", "ApiName", "subscription-api"],
          ["AWS/ApiGateway", "4XXError", "ApiName", "subscription-api"],
          ["AWS/ApiGateway", "5XXError", "ApiName", "subscription-api"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-west-2",
        "title": "Subscription API Metrics"
      }
    }
  ]
}
```

### **Step 2: Set Up Alerts**

```bash
# Create CloudWatch alarm for API errors
aws cloudwatch put-metric-alarm \
  --alarm-name "subscription-api-errors" \
  --alarm-description "Alert when subscription API has errors" \
  --metric-name "5XXError" \
  --namespace "AWS/ApiGateway" \
  --statistic "Sum" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2
```

## 🎯 **End-to-End Testing Scenarios**

### **Scenario 1: New User Trial Flow**
1. **User signs up** → Verify trial created in database
2. **User uses features** → Verify usage tracking works
3. **3 days before expiry** → Verify warning email sent
4. **1 day before expiry** → Verify final warning email sent
5. **Trial expires** → Verify expired email sent and status updated

### **Scenario 2: Trial to Paid Conversion**
1. **User in trial** → Clicks upgrade link
2. **Completes payment** → Verify Stripe subscription created
3. **EventBridge processes** → Verify database updated
4. **Confirmation email** → Verify subscription confirmation sent
5. **Feature access** → Verify unlimited access granted

### **Scenario 3: Subscription Management**
1. **User cancels subscription** → Verify cancel API works
2. **EventBridge processes** → Verify database updated
3. **Cancellation email** → Verify confirmation sent
4. **Access continues** → Verify access until period end
5. **Period ends** → Verify downgrade to free tier

## 🚨 **Error Handling & Recovery**

### **Common Issues & Solutions**

#### **EventBridge Events Not Processing**
```bash
# Check EventBridge rule status
aws events describe-rule --name stripe-subscription-events

# Check target configuration
aws events list-targets-by-rule --rule stripe-subscription-events

# Test rule with sample event
aws events put-events --entries file://test-event.json
```

#### **Email Delivery Issues**
```bash
# Check SES sending statistics
aws ses get-send-statistics

# Verify domain/email verification
aws ses list-verified-email-addresses
aws ses list-verified-domains

# Check bounce/complaint rates
aws ses get-reputation --identity bayoncoagent.app
```

#### **Database Connection Issues**
```bash
# Test DynamoDB connection
aws dynamodb describe-table --table-name YourTableName

# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:role/YourRole \
  --action-names dynamodb:GetItem dynamodb:PutItem \
  --resource-arns arn:aws:dynamodb:us-west-2:ACCOUNT:table/YourTable
```

## 📈 **Performance Optimization**

### **Database Optimization**
- **Add GSI for subscription queries** by status and trial end date
- **Implement pagination** for large user bases
- **Use batch operations** for bulk updates

### **API Optimization**
- **Add caching** for subscription status (Redis/ElastiCache)
- **Implement rate limiting** to prevent abuse
- **Use connection pooling** for database connections

### **Email Optimization**
- **Batch email sending** for large user bases
- **Implement email templates** in SES
- **Add unsubscribe handling**

## ✅ **Production Readiness Checklist**

- [ ] **Environment variables configured**
- [ ] **AWS SES domain verified**
- [ ] **EventBridge rules created**
- [ ] **Stripe webhook configured**
- [ ] **Cron job scheduled**
- [ ] **CloudWatch monitoring set up**
- [ ] **Error alerting configured**
- [ ] **End-to-end testing completed**
- [ ] **Performance testing done**
- [ ] **Security review completed**
- [ ] **Documentation updated**
- [ ] **Team training completed**

## 🎉 **Go-Live Steps**

1. **Deploy to production** with all environment variables
2. **Verify all API endpoints** are responding correctly
3. **Test with real Stripe test mode** subscriptions
4. **Monitor logs and metrics** for first 24 hours
5. **Gradually enable features** for existing users
6. **Monitor conversion rates** and user feedback
7. **Iterate based on analytics** and user behavior

## 📞 **Support & Troubleshooting**

### **Key Metrics to Monitor**
- **API response times** and error rates
- **Email delivery rates** and bounce rates
- **Trial conversion rates** and churn rates
- **Feature usage patterns** and limit hits
- **Database performance** and connection counts

### **Emergency Procedures**
- **Disable cron jobs** if email issues occur
- **Rollback deployment** if critical errors found
- **Manual subscription management** via admin tools
- **Direct database access** for urgent fixes

This deployment guide provides a comprehensive roadmap for taking the subscription system from development to production. Follow each step carefully and test thoroughly before going live.