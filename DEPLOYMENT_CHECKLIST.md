# Pre-Deployment Checklist - bayoncoagent.app

**Domain**: bayoncoagent.app  
**Route 53 Zone**: Z05491755Y25UG9M0126  
**Deployment Date**: Ready to deploy  

---

## ✅ COMPLETED

- [x] **Domain configured**: bayoncoagent.app in Route 53
- [x] **Template updated**: All 8 domain references updated
- [x] **SAM config created**: samconfig.toml with production settings

---

## 📋 PRE-DEPLOYMENT TASKS (Do Before `sam deploy`)

### 1. SSL Certificate Setup (Required) ⚠️

Your application needs an SSL certificate for HTTPS.

**Option A: Create ACM Certificate (Recommended)**
```bash
# Request certificate in us-east-1 for CloudFront compatibility
aws acm request-certificate \
  --domain-name bayoncoagent.app \
  --subject-alternative-names "*.bayoncoagent.app" \
  --validation-method DNS \
  --region us-east-1

# This will output a CertificateArn - save it!
```

**Then validate via DNS**:
1. ACM will provide CNAME records
2. Add them to Route 53 hosted zone Z05491755Y25UG9M0126
3. Wait for validation (5-30 minutes)

**Option B: Use Existing Certificate**
```bash
# List existing certificates
aws acm list-certificates --region us-east-1
```

- [ ] SSL certificate requested
- [ ] DNS validation records added to Route 53
- [ ] Certificate status: ISSUED

### 2. Email Configuration ⚠️

Update the alarm email in `samconfig.toml` if different from ops@bayoncoagent.app:

```toml
parameter_overrides = [
  "Environment=production",
  "AlarmEmail=YOUR_EMAIL@bayoncoagent.app"  # ← Update this
]
```

- [ ] Alarm email configured
- [ ] Email verified (you'll get a confirmation email after deployment)

### 3. OAuth Provider Setup 🔐

For each OAuth provider, you need to:

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://bayoncoagent.app/api/oauth/google/callback`
4. Save Client ID and Client Secret

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app and add Facebook Login
3. Add redirect URI: `https://bayoncoagent.app/api/oauth/facebook/callback`
4. Save App ID and App Secret

#### Instagram OAuth
1. Use Facebook app credentials
2. Enable Instagram Basic Display
3. Add redirect URI: `https://bayoncoagent.app/api/oauth/instagram/callback`

#### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create app
3. Add redirect URI: `https://bayoncoagent.app/api/oauth/linkedin/callback`
4. Save Client ID and Client Secret

#### Twitter OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create app and enable OAuth 2.0
3. Add callback URI: `https://bayoncoagent.app/api/oauth/twitter/callback`
4. Save API Key and API Secret

**Checklist**:
- [ ] Google OAuth credentials obtained
- [ ] Facebook OAuth credentials obtained
- [ ] Instagram OAuth configured
- [ ] LinkedIn OAuth credentials obtained
- [ ] Twitter OAuth credentials obtained

### 4. Stripe Setup 💳

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys (test or live)
3. Configure webhook endpoint (after deployment): `https://bayoncoagent.app/api/webhooks/stripe`

- [ ] Stripe account created
- [ ] API keys obtained (test mode ready)
- [ ] Will configure webhook after deployment

### 5. MLS API Credentials 🏠

If you have MLS API access:
- [ ] MLS API key obtained
- [ ] API endpoint documented

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Build Application

```bash
cd /Users/sengngor/Desktop/Apps/bayon-coagent

# Build SAM application
sam build

# Expected output: "Build Succeeded"
```

### Step 2: Deploy to AWS

```bash
# Deploy using saved configuration
sam deploy --config-env default

# Or deploy with guided setup (if you want to review)
sam deploy --guided
```

**Expected duration**: 10-15 minutes

### Step 3: Note Your Outputs

After deployment, save these values:

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --query 'Stacks[0].Outputs' \
  --output table > deployment-outputs.txt
```

**Critical outputs**:
- UserPoolId
- UserPoolClientId
- IdentityPoolId
- DynamoDBTableName
- StorageBucketName
- MainApiEndpoint

---

## 📝 POST-DEPLOYMENT TASKS (Do After `sam deploy`)

### 1. Populate Secrets ⚠️ CRITICAL

```bash
# Google OAuth
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-google-oauth-production \
  --secret-string '{
    "clientId": "YOUR_GOOGLE_CLIENT_ID",
    "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET",
    "redirectUri": "https://bayoncoagent.app/api/oauth/google/callback"
  }'

# Facebook OAuth
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-facebook-oauth-production \
  --secret-string '{
    "appId": "YOUR_FACEBOOK_APP_ID",
    "appSecret": "YOUR_FACEBOOK_APP_SECRET",
    "redirectUri": "https://bayoncoagent.app/api/oauth/facebook/callback"
  }'

# Instagram OAuth
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-instagram-oauth-production \
  --secret-string '{
    "appId": "YOUR_INSTAGRAM_APP_ID",
    "appSecret": "YOUR_INSTAGRAM_APP_SECRET",
    "redirectUri": "https://bayoncoagent.app/api/oauth/instagram/callback"
  }'

# LinkedIn OAuth
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-linkedin-oauth-production \
  --secret-string '{
    "clientId": "YOUR_LINKEDIN_CLIENT_ID",
    "clientSecret": "YOUR_LINKEDIN_CLIENT_SECRET",
    "redirectUri": "https://bayoncoagent.app/api/oauth/linkedin/callback"
  }'

# Twitter OAuth
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-twitter-oauth-production \
  --secret-string '{
    "apiKey": "YOUR_TWITTER_API_KEY",
    "apiSecret": "YOUR_TWITTER_API_SECRET",
    "redirectUri": "https://bayoncoagent.app/api/oauth/twitter/callback"
  }'

# Stripe
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-stripe-production \
  --secret-string '{
    "publishableKey": "pk_test_XXXXX",
    "secretKey": "sk_test_XXXXX",
    "webhookSecret": "whsec_XXXXX"
  }'

# MLS API (if applicable)
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-mls-api-production \
  --secret-string '{
    "apiKey": "YOUR_MLS_API_KEY",
    "apiEndpoint": "https://api.mlsgateway.com"
  }'
```

- [ ] All secrets populated in AWS Secrets Manager

### 2. Configure DNS Records

Add these records to Route 53 (Zone: Z05491755Y25UG9M0126):

**For CloudFront (if using)**:
```
Type: A (Alias)
Name: bayoncoagent.app
Target: CloudFront distribution (from deployment output)
```

**For API Gateway directly**:
```
Type: A (Alias)
Name: api.bayoncoagent.app
Target: API Gateway custom domain
```

**For Email**:
```
Type: MX
Name: bayoncoagent.app
Value: 10 mx.zoho.com (or your email provider)
```

- [ ] DNS records configured
- [ ] DNS propagation verified (can take 5-60 minutes)

### 3. Verify Email Subscription

Check your email (ops@bayoncoagent.app or configured email):
- [ ] SNS subscription email received
- [ ] Subscription confirmed (click link in email)

### 4. Test Deployment

```bash
# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --query 'Stacks[0].Outputs[?OutputKey==`MainApiEndpoint`].OutputValue' \
  --output text)

# Test health endpoint
curl "${API_ENDPOINT}/health"
# Expected: {"status":"healthy"}
```

- [ ] Health endpoint returns 200
- [ ] API Gateway accessible

### 5. Configure Next.js Environment

Create `.env.production.local` with outputs:

```env
# Get these from deployment outputs
NEXT_PUBLIC_USER_POOL_ID=us-west-2_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_IDENTITY_POOL_ID=us-west-2:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
NEXT_PUBLIC_REGION=us-west-2
NEXT_PUBLIC_API_ENDPOINT=https://XXXXXXXXXX.execute-api.us-west-2.amazonaws.com/v1

# Server-side only
DYNAMODB_TABLE_NAME=BayonCoAgent-production
S3_BUCKET_NAME=bayon-coagent-storage-production-XXXXXXXXXXXX
```

- [ ] Environment variables configured
- [ ] Next.js build successful

### 6. Deploy Frontend

Choose your deployment platform:

**Option A: Vercel (Recommended for Next.js)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: AWS Amplify**
```bash
amplify init
amplify add hosting
amplify publish
```

**Option C: CloudFront + S3**
- Build static export: `npm run build`
- Upload to S3
- Configure CloudFront distribution

- [ ] Frontend deployed
- [ ] Custom domain configured on hosting platform

### 7. Test OAuth Flows

Visit https://bayoncoagent.app and test:
- [ ] Google Sign-In works
- [ ] Facebook Login works
- [ ] Other OAuth providers work

### 8. Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://bayoncoagent.app/api/webhooks/stripe`
3. Select events: `customer.subscription.*`, `invoice.*`, `payment_intent.*`
4. Copy webhook secret
5. Update Stripe secret in Secrets Manager

- [ ] Stripe webhook configured
- [ ] Test webhook working

---

## 🎯 VERIFICATION CHECKLIST

After everything is deployed:

- [ ] Application accessible at https://bayoncoagent.app
- [ ] SSL certificate valid (green padlock)
- [ ] User registration works
- [ ] User login works
- [ ] OAuth providers work
- [ ] Dashboard loads
- [ ] DynamoDB data persists
- [ ] S3 file uploads work
- [ ] CloudWatch alarms configured
- [ ] Email alerts received (test)

---

## 📊 MONITORING SETUP

### Create CloudWatch Dashboard

```bash
# Dashboard configuration available after deployment
# Access at: https://console.aws.amazon.com/cloudwatch/

# Recommended widgets:
# - Lambda invocations
# - API Gateway requests
# - DynamoDB throttles
# - S3 bucket size
# - Cognito user count
```

- [ ] CloudWatch Dashboard created
- [ ] Alarms reviewed and thresholds adjusted
- [ ] X-Ray enabled and traces visible

---

## 🔒 SECURITY HARDENING (Optional but Recommended)

- [ ] Enable MFA on Cognito (currently OFF)
- [ ] Set up WAF rules
- [ ] Enable GuardDuty
- [ ] Configure AWS Config rules
- [ ] Set up AWS Budgets alerts
- [ ] Review IAM policies for least privilege

---

## 📞 ROLLBACK PLAN

If something goes wrong:

```bash
# Option 1: Rollback to previous stack version
aws cloudformation  update-stack-set \
  --stack-name bayon-coagent-production \
  --use-previous-template

# Option 2: Delete and redeploy
aws cloudformation delete-stack \
  --stack-name bayon-coagent-production
```

---

## 📈 ESTIMATED TIMELINE

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-deployment setup | 2-3 hours | ⏳ In Progress |
| SAM deployment | 15 minutes | ⏳ Pending |
| Post-deployment config | 1-2 hours | ⏳ Pending |
| Testing & verification | 1-2 hours | ⏳ Pending |
| **Total** | **4-7 hours** | |

---

## ✅ READY TO DEPLOY?

**Prerequisites Complete**:
- ✅ Domain: bayoncoagent.app configured in Route 53
- ✅ Template: Updated with correct domain
- ✅ Config: samconfig.toml ready

**Critical Remaining**:
- ⚠️ SSL Certificate setup (required)
- ⚠️ OAuth credentials (can configure after)
- ⚠️ Alarm email verified

**You can deploy now if**:
- You have an SSL certificate in ACM (us-east-1)
- You're ready to configure OAuth providers after deployment
- You have email access for alarm confirmations

---

## 🚀 DEPLOY COMMAND

When ready, run:

```bash
cd /Users/sengngor/Desktop/Apps/bayon-coagent
sam build && sam deploy
```

Good luck! 🎉
