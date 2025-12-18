# 🚨 Missing Environment Variables - EXACT LIST

## **Current Status from Debug API:**
- ✅ Set: 4 variables (25%)
- ❌ Missing: 12 variables (75%)

---

## **CRITICAL - Set These in Amplify NOW:**

### **1. Cognito Authentication (REQUIRED)**
```
COGNITO_USER_POOL_ID=us-west-2_wqsUAbADO
COGNITO_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
```

### **2. AWS Credentials** 
✅ **DONE** - You've added these to Secrets Manager (perfect!)

### **3. Database (REQUIRED)**
```
DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
```

### **4. Email (REQUIRED for notifications)**
```
FROM_EMAIL=noreply@bayoncoagent.app
SES_REGION=us-west-2
```

### **5. Stripe Test Keys (REQUIRED for subscriptions)**
```
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY
```

---

## **NOT NEEDED (Remove from checklist):**

❌ `STRIPE_WEBHOOK_SECRET` - Not needed with EventBridge  
❌ `CRON_SECRET_TOKEN` - Not needed with Lambda + EventBridge  
❌ `AWS_SES_REGION` - Use `SES_REGION` instead (no AWS prefix for Amplify)  
❌ `VERCEL_ENV` - Not applicable (we're using Amplify)

---

## **HOW TO GET AWS CREDENTIALS:**

### **Option 1: Create IAM User (Recommended)**
1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Name: `bayon-coagent-amplify`
4. Attach policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess`
   - `AmazonSESFullAccess`
   - `AmazonBedrockFullAccess`
5. Create access key → Copy `Access Key ID` and `Secret Access Key`

### **Option 2: Use Existing Credentials**
```bash
# Check your current credentials
cat ~/.aws/credentials

# Look for:
# [default]
# aws_access_key_id = AKIA...
# aws_secret_access_key = ...
```

---

## **QUICK COPY-PASTE FOR AMPLIFY:**

```
COGNITO_USER_POOL_ID=us-west-2_wqsUAbADO
COGNITO_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
FROM_EMAIL=noreply@bayoncoagent.app
SES_REGION=us-west-2
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

---

## **AFTER SETTING THESE:**

1. **Redeploy** in Amplify Console
2. **Test** with: `./scripts/test-api-endpoints.sh`
3. **Expected**: All APIs return success, Lambda functions deployed

---

**This will fix the 500 errors and make everything work!** 🚀