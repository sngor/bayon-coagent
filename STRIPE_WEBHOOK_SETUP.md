# 🔧 Stripe Webhook Configuration Guide

## 📋 **Required: Configure Stripe Webhook**

Your subscription system is deployed but needs Stripe webhook configuration to be fully functional.

### **Step 1: Configure Stripe Webhook**

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Enter endpoint URL**: `https://bayoncoagent.app/api/stripe/eventbridge`
4. **Select events to send**:
   ```
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ customer.subscription.trial_will_end
   ```
5. **Click "Add endpoint"**
6. **Copy the webhook signing secret** (starts with `whsec_`)

### **Step 2: Update Environment Variables**

Add these to your Amplify environment variables:

```bash
# Stripe Configuration (REQUIRED)
STRIPE_SECRET_KEY=sk_live_... # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_live_... # Your Stripe publishable key  
STRIPE_WEBHOOK_SECRET=whsec_... # From webhook setup above

# Email Configuration (REQUIRED)
FROM_EMAIL=noreply@bayoncoagent.app
AWS_SES_REGION=us-west-2

# Cron Job Security (REQUIRED)
CRON_SECRET_TOKEN=your-secure-random-token-here

# Application URLs (REQUIRED)
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
```

### **Step 3: Test the Integration**

Once configured, test with:
```bash
curl "https://bayoncoagent.app/api/subscription/status?userId=test-user"
```

Should return:
```json
{
  "success": true,
  "subscription": {
    "isActive": false,
    "plan": "free",
    "status": null,
    "trialEndsAt": null,
    "isInTrial": false,
    "trialDaysRemaining": 0
  }
}
```

## 🎯 **Priority Actions**

1. **Configure Stripe webhook** (5 minutes)
2. **Set environment variables** in Amplify (2 minutes)  
3. **Test subscription endpoints** (1 minute)
4. **Set up cron job** for trial notifications (5 minutes)

## 📞 **Need Help?**

If you encounter issues:
1. Check Amplify build logs for errors
2. Verify environment variables are set correctly
3. Test Stripe webhook with Stripe CLI: `stripe listen --forward-to https://bayoncoagent.app/api/stripe/eventbridge`