# 🚀 Amplify Environment Variables Setup

## **COPY-PASTE READY** - Environment Variables for AWS Amplify

### **Step 1: Core AWS Configuration**
```
AWS_REGION=us-west-2
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
```

### **Step 2: Cognito Authentication**
```
COGNITO_USER_POOL_ID=us-west-2_wqsUAbADO
COGNITO_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
NEXT_PUBLIC_USER_POOL_ID=us-west-2_wqsUAbADO
NEXT_PUBLIC_USER_POOL_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
NEXT_PUBLIC_AWS_REGION=us-west-2
```

### **Step 3: Database & Storage**
```
DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
S3_BUCKET_NAME=bayon-coagent-storage-production-v2-409136660268
```

### **Step 4: AI & Bedrock**
```
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-west-2
```

### **Step 5: Email Configuration**
```
SES_REGION=us-west-2
FROM_EMAIL=noreply@bayoncoagent.app
```

### **Step 6: Stripe Test Keys** 
**⚠️ REPLACE WITH YOUR ACTUAL TEST KEYS:**
```
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_PUBLISHABLE_KEY  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_PUBLISHABLE_KEY
```

---

## 📋 **HOW TO SET THESE IN AMPLIFY**

### **Method 1: AWS Console (Recommended)**
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your `bayon-coagent` app
3. Click **"Environment variables"** in left sidebar
4. Click **"Manage variables"**
5. Copy-paste each variable above (one by one)
6. Click **"Save"**
7. Go to **"Hosting"** → **"Build settings"** → **"Redeploy this version"**

### **Method 2: Amplify CLI (Alternative)**
```bash
# Set critical variables first
amplify env add production
amplify env checkout production

# Add variables via CLI (optional)
amplify configure project
```

---

## 🧪 **TEST AFTER DEPLOYMENT**

### **Quick Test Script**
```bash
# Test subscription API (should return JSON, not error)
curl "https://bayoncoagent.app/api/subscription/status?userId=test"

# Expected success response:
# {"success":true,"subscription":{"isActive":false,"plan":"free",...}}
```

### **Full Test Suite**
```bash
# Run comprehensive test
./scripts/test-api-endpoints.sh
```

---

## 🎯 **PRIORITY ORDER**

**Set these FIRST (fixes 500 errors):**
1. `DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production`
2. `AWS_REGION=us-west-2`
3. `COGNITO_USER_POOL_ID=us-west-2_wqsUAbADO`
4. `COGNITO_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce`

**Then add these (enables full functionality):**
5. Stripe test keys
6. Email configuration
7. Public-facing variables

---

## 🔍 **TROUBLESHOOTING**

### **If APIs still return 500 errors:**
1. Check Amplify build logs for deployment errors
2. Verify all variables are saved (no typos)
3. Ensure redeploy completed successfully
4. Test with: `curl "https://bayoncoagent.app/api/debug/env"`

### **If Stripe integration fails:**
1. Verify test keys start with `sk_test_` and `pk_test_`
2. Check Stripe dashboard for webhook configuration
3. Test with small subscription amount

### **If authentication fails:**
1. Verify Cognito User Pool ID matches exactly
2. Check that public variables are set correctly
3. Clear browser cache and try again

---

## ✅ **SUCCESS INDICATORS**

**You'll know it's working when:**
- ✅ API endpoints return JSON (not HTML error pages)
- ✅ Users can sign up and get 7-day trials automatically
- ✅ Feature gates show usage limits and upgrade prompts
- ✅ Admin panel accessible with super admin account
- ✅ Stripe test payments process successfully

---

## 🚀 **NEXT STEPS AFTER SUCCESS**

1. **Test User Journey**: Sign up → Trial → Feature usage → Upgrade flow
2. **Configure Stripe Webhook**: Point to `/api/stripe/eventbridge`
3. **Set up Cron Job**: For trial notifications (optional with Lambda)
4. **Switch to Live Keys**: When ready for production payments

---

**Total setup time: ~10 minutes**  
**Result: Fully functional SaaS platform with freemium model** 🎉