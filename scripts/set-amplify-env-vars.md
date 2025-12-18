# Set Amplify Environment Variables

## Required Environment Variables for Production

Copy and paste these into your AWS Amplify Console → Environment Variables:

### Core AWS Configuration
```
AWS_REGION=us-west-2
NODE_ENV=production
```

### Cognito Configuration
```
COGNITO_USER_POOL_ID=us-west-2_wqsUAbADO
COGNITO_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
NEXT_PUBLIC_AWS_REGION=us-west-2
NEXT_PUBLIC_USER_POOL_ID=us-west-2_wqsUAbADO
NEXT_PUBLIC_USER_POOL_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce
```

### Database & Storage
```
DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
S3_BUCKET_NAME=bayon-coagent-storage-production-v2-409136660268
```

### AI & Bedrock
```
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-west-2
```

### Application URL
```
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
```

### Email Configuration (SES)
```
SES_REGION=us-west-2
FROM_EMAIL=noreply@bayoncoagent.app
```

### Stripe Configuration (TEST KEYS)
```
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_TEST_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_TEST_PUBLISHABLE_KEY
```

## Steps to Set Environment Variables

1. **Go to AWS Amplify Console**
   - Navigate to your app: `bayon-coagent`
   - Click on "Environment variables" in the left sidebar

2. **Add Each Variable**
   - Click "Manage variables"
   - Add each key-value pair from above
   - Make sure to use your actual Stripe keys

3. **Redeploy**
   - After setting all variables, trigger a new deployment
   - Go to "Hosting" → "Build settings" → "Redeploy this version"

## Test After Setting Variables

```bash
# Test subscription API
curl "https://bayoncoagent.app/api/subscription/status?userId=test"

# Should return JSON like:
# {"success":true,"subscription":{"isActive":false,"plan":"free",...}}
```

## Critical Variables to Set First

1. `DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production`
2. `AWS_REGION=us-west-2`
3. `COGNITO_USER_POOL_ID=us-west-2_wqsUAbADO`
4. `COGNITO_CLIENT_ID=33grpfrfup7q9jkmumv77ffdce`

These four variables will fix the 500 errors in the API endpoints.