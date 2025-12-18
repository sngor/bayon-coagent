# Production Deployment Checklist

## 🚀 **Subscription System - Production Deployment**

This checklist ensures a smooth deployment of the subscription system to production.

## ✅ **Pre-Deployment Verification**

### **1. Code Quality & Testing**
- [x] All TypeScript compilation errors resolved
- [x] Production build successful (`npm run build`)
- [x] API endpoints tested and functional
- [x] Feature gates implemented and tested
- [x] Email templates validated
- [x] No duplicate Stripe implementations
- [x] Error handling implemented
- [x] Security measures in place

### **2. Environment Configuration**
- [ ] **Production environment variables set:**
  ```bash
  # Stripe Configuration
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  
  # Email Configuration
  FROM_EMAIL=noreply@bayoncoagent.app
  AWS_SES_REGION=us-west-2
  
  # Cron Job Security
  CRON_SECRET_TOKEN=your-secure-random-token
  
  # Application URLs
  NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
  ```

### **3. AWS Services Setup**
- [ ] **AWS SES (Simple Email Service)**
  - [ ] Domain verified: `bayoncoagent.app`
  - [ ] Email address verified: `noreply@bayoncoagent.app`
  - [ ] Moved out of sandbox mode
  - [ ] Sending limits increased
  - [ ] Bounce/complaint handling configured

- [ ] **AWS EventBridge**
  - [ ] Rule created: `stripe-subscription-events`
  - [ ] Target configured: API endpoint
  - [ ] Permissions set for HTTPS calls
  - [ ] Scheduled rule for cron jobs

- [ ] **AWS DynamoDB**
  - [ ] Table exists and accessible
  - [ ] IAM permissions configured
  - [ ] Backup enabled
  - [ ] Monitoring enabled

- [ ] **AWS CloudWatch**
  - [ ] Log groups created
  - [ ] Alarms configured
  - [ ] Dashboards set up
  - [ ] Error notifications enabled

## 🔧 **Deployment Steps**

### **Step 1: AWS Services Configuration**
```bash
# Run the AWS configuration script
./scripts/configure-aws-services.sh

# Verify services are configured
aws ses get-identity-verification-attributes --identities bayoncoagent.app
aws events list-rules --name-prefix stripe-subscription
aws logs describe-log-groups --log-group-name-prefix subscription
```

### **Step 2: Stripe Configuration**
1. **Configure Stripe Webhook:**
   - URL: `https://bayoncoagent.app/api/stripe/eventbridge`
   - Events: `customer.subscription.*`, `invoice.payment.*`
   - Secret: Save to `STRIPE_WEBHOOK_SECRET`

2. **Test Stripe Integration:**
   ```bash
   # Use Stripe CLI to test events
   stripe listen --forward-to https://bayoncoagent.app/api/stripe/eventbridge
   stripe trigger customer.subscription.created
   ```

### **Step 3: Deploy Application**
```bash
# Build and deploy
npm run build
npm run deploy  # or your deployment command

# Verify deployment
curl https://bayoncoagent.app/api/subscription/status?userId=test
```

### **Step 4: Configure Cron Jobs**
Choose one option:

**Option A: AWS EventBridge Scheduled Rules**
```bash
aws events put-rule \
  --name daily-trial-notifications \
  --schedule-expression "cron(0 12 * * ? *)"

aws events put-targets \
  --rule daily-trial-notifications \
  --targets "Id=1,Arn=https://bayoncoagent.app/api/cron/trial-notifications"
```

**Option B: External Cron Service**
- Configure cron-job.org or similar
- URL: `https://bayoncoagent.app/api/cron/trial-notifications`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET_TOKEN`
- Schedule: Daily at 12:00 PM UTC

**Option C: Vercel Cron Jobs**
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

## 🧪 **Post-Deployment Testing**

### **1. API Endpoint Testing**
```bash
# Test all endpoints
./scripts/test-subscription-apis.sh https://bayoncoagent.app

# Manual tests
curl "https://bayoncoagent.app/api/subscription/status?userId=test-user"
curl "https://bayoncoagent.app/api/admin/subscription-analytics"
```

### **2. Email Testing**
```bash
# Test email service (requires real AWS SES)
node scripts/test-email-service.js your-email@example.com
```

### **3. End-to-End User Flow Testing**
1. **New User Signup:**
   - [ ] User creates account
   - [ ] Trial automatically activated
   - [ ] Professional features accessible
   - [ ] Usage tracking works

2. **Trial Management:**
   - [ ] Trial countdown displays correctly
   - [ ] Feature gates enforce limits
   - [ ] Usage badges show real data
   - [ ] Upgrade prompts appear

3. **Email Notifications:**
   - [ ] 3-day warning email sent
   - [ ] 1-day warning email sent
   - [ ] Trial expired email sent
   - [ ] Subscription confirmation sent

4. **Subscription Management:**
   - [ ] Upgrade to paid plan works
   - [ ] Plan changes work
   - [ ] Cancellation works
   - [ ] EventBridge processes events

## 📊 **Monitoring & Analytics**

### **1. Key Metrics to Track**
- **API Performance:**
  - Response times
  - Error rates
  - Request volume
  - Success rates

- **Email Delivery:**
  - Delivery rates
  - Bounce rates
  - Complaint rates
  - Open rates

- **Business Metrics:**
  - Trial signup rate
  - Trial conversion rate
  - Churn rate
  - Monthly recurring revenue

### **2. Alerts to Configure**
```bash
# API Error Alert
aws cloudwatch put-metric-alarm \
  --alarm-name "subscription-api-errors" \
  --metric-name "5XXError" \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold"

# Email Bounce Alert
aws cloudwatch put-metric-alarm \
  --alarm-name "email-bounce-rate" \
  --metric-name "Bounce" \
  --namespace "AWS/SES" \
  --threshold 5 \
  --comparison-operator "GreaterThanThreshold"
```

### **3. Dashboard Setup**
- **CloudWatch Dashboard** for AWS metrics
- **Stripe Dashboard** for payment metrics
- **Admin Analytics** for business metrics
- **Error Tracking** (Sentry, LogRocket, etc.)

## 🔒 **Security Checklist**

### **1. API Security**
- [x] Input validation on all endpoints
- [x] Rate limiting implemented
- [x] CORS configured properly
- [x] Authentication where required
- [x] Error messages sanitized

### **2. Data Security**
- [x] Sensitive data encrypted
- [x] PII handling compliant
- [x] Database access restricted
- [x] Backup encryption enabled
- [x] Audit logging enabled

### **3. Infrastructure Security**
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] WAF rules applied
- [ ] VPC security groups configured
- [ ] IAM permissions minimal

## 🚨 **Rollback Plan**

### **If Issues Occur:**
1. **Immediate Actions:**
   - [ ] Disable cron jobs
   - [ ] Revert to previous deployment
   - [ ] Check error logs
   - [ ] Notify stakeholders

2. **Investigation:**
   - [ ] Check CloudWatch logs
   - [ ] Review Stripe events
   - [ ] Verify AWS service status
   - [ ] Test API endpoints

3. **Recovery:**
   - [ ] Fix identified issues
   - [ ] Test in staging
   - [ ] Redeploy with fixes
   - [ ] Re-enable services

## 📞 **Support Contacts**

### **Emergency Contacts:**
- **AWS Support:** [Your AWS Support Plan]
- **Stripe Support:** [Your Stripe Account]
- **Development Team:** [Team Contact Info]
- **DevOps Team:** [DevOps Contact Info]

### **Service Status Pages:**
- **AWS Status:** https://status.aws.amazon.com/
- **Stripe Status:** https://status.stripe.com/
- **Vercel Status:** https://www.vercel-status.com/

## ✅ **Final Verification**

### **Before Going Live:**
- [ ] All checklist items completed
- [ ] End-to-end testing passed
- [ ] Monitoring configured
- [ ] Alerts working
- [ ] Team trained
- [ ] Documentation updated
- [ ] Rollback plan tested

### **Go-Live Approval:**
- [ ] Technical Lead Approval: ________________
- [ ] Product Manager Approval: ________________
- [ ] DevOps Approval: ________________
- [ ] Security Review: ________________

## 🎉 **Post-Launch**

### **First 24 Hours:**
- [ ] Monitor all metrics closely
- [ ] Check error rates
- [ ] Verify email delivery
- [ ] Test user flows
- [ ] Collect feedback

### **First Week:**
- [ ] Analyze conversion rates
- [ ] Review user feedback
- [ ] Optimize based on data
- [ ] Plan improvements
- [ ] Document lessons learned

---

**Deployment Date:** ________________  
**Deployed By:** ________________  
**Version:** ________________  
**Notes:** ________________