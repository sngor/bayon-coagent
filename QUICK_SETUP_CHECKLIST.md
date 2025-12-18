# ✅ Quick Setup Checklist

## **10-Minute Production Deployment**

### **□ Step 1: Set Environment Variables in Amplify (5 min)**

Go to: [AWS Amplify Console](https://console.aws.amazon.com/amplify/) → bayon-coagent → Environment variables

**Critical Variables (copy-paste these):**
```
DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
AWS_REGION=us-west-2
COGNITO_USER_POOL_ID=us-west-2_wqsUAbADO
COGNITO_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
NEXT_PUBLIC_USER_POOL_ID=us-west-2_wqsUAbADO
NEXT_PUBLIC_USER_POOL_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
NEXT_PUBLIC_AWS_REGION=us-west-2
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
NODE_ENV=production
SES_REGION=us-west-2
FROM_EMAIL=noreply@bayoncoagent.app
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-west-2
S3_BUCKET_NAME=bayon-coagent-storage-production-v2-409136660268
```

**Stripe Test Keys (replace with your actual keys):**
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

---

### **□ Step 2: Redeploy Application (3 min)**

1. Go to: Amplify Console → Hosting → Build settings
2. Click: **"Redeploy this version"**
3. Wait for build to complete (~2-3 minutes)

---

### **□ Step 3: Test APIs (2 min)**

```bash
# Test subscription API
curl "https://bayoncoagent.app/api/subscription/status?userId=test"

# Should return: {"success":true,"subscription":{...}}
```

---

## **🎯 What You Get**

✅ **Freemium Model**: 7-day trials → Free tier → Paid plans  
✅ **Feature Gates**: Usage limits with upgrade prompts  
✅ **Stripe Integration**: Test payment processing  
✅ **Role Management**: Admin & super admin access  
✅ **Email Notifications**: Trial expiry warnings  
✅ **Usage Tracking**: Monthly limits per feature  

---

## **🔧 Optional: Configure Stripe Webhook**

**For EventBridge (recommended):**
1. Go to: [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click: "Add endpoint"
3. URL: `https://bayoncoagent.app/api/stripe/eventbridge`
4. Events: Select all `customer.subscription.*` and `invoice.payment.*`
5. Copy webhook secret (not needed for EventBridge, but good to have)

---

## **📊 Test User Journey**

1. **Sign Up**: Go to https://bayoncoagent.app/login
2. **Verify Email**: Check email for verification code
3. **Access Dashboard**: Should see 7-day trial badge
4. **Use Features**: Try Studio → Write (should work)
5. **Check Usage**: Go to Settings → Subscription (see limits)
6. **Test Upgrade**: Click upgrade button (Stripe test mode)

---

## **🚨 Troubleshooting**

**If API returns 500 error:**
- Check: Environment variables are saved in Amplify
- Verify: Redeploy completed successfully
- Test: `curl "https://bayoncoagent.app/api/debug/env"`

**If authentication fails:**
- Clear browser cache
- Verify Cognito User Pool ID is correct
- Check public variables are set

**If Stripe fails:**
- Verify test keys start with `sk_test_` and `pk_test_`
- Check Stripe dashboard for errors
- Test with $1 subscription

---

## **📝 Notes**

- **Test Mode**: Using Stripe test keys (safe for testing)
- **Live Mode**: Switch to `sk_live_` keys when ready
- **Lambda Function**: Already deployed for trial notifications
- **EventBridge**: Configured for Stripe events

---

**Status**: Ready for production testing! 🚀  
**Next**: Set environment variables and redeploy