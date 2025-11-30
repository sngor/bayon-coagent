# Next Steps: Deploy Your Application

**Status**: ✅ Infrastructure deployed | ✅ Build successful | 🚀 Ready to deploy

---

## Current Status

### ✅ Completed
- [x] AWS Core Infrastructure deployed (Cognito, DynamoDB, S3, IAM)
- [x] Environment variables configured
- [x] Next.js production build successful
- [x] TypeScript errors resolved

### 🎯 Next Steps

Choose your deployment platform:

---

## Option 1: Deploy to Vercel (Recommended for Next.js) ⭐

### Why Vercel?
- ✅ Optimized for Next.js
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Automatic deployments from Git

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
cd /Users/sengngor/Desktop/Apps/bayon-coagent

# Deploy to production
vercel --prod
```

### Step 4: Configure Environment Variables

After deployment, add environment variables in Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

```
NEXT_PUBLIC_USER_POOL_ID=us-west-2_ALOcJxQDd
NEXT_PUBLIC_USER_POOL_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
NEXT_PUBLIC_IDENTITY_POOL_ID=us-west-2:dedcf50e-9038-43bd-b11a-6e3651dc9c8d
NEXT_PUBLIC_REGION=us-west-2
DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
S3_BUCKET_NAME=bayon-coagent-storage-production-v2-409136660268
AWS_REGION=us-west-2
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### Step 5: Configure Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add domain: `bayoncoagent.app`
3. Add DNS records in Route 53:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

**Deployment Time**: 5-10 minutes

---

## Option 2: Deploy to AWS Amplify

### Why Amplify?
- ✅ Native AWS integration
- ✅ Easy connection to your AWS resources
- ✅ Automatic HTTPS
- ✅ CI/CD from Git

### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

### Step 2: Initialize Amplify

```bash
cd /Users/sengngor/Desktop/Apps/bayon-coagent

# Initialize Amplify
amplify init

# Answer prompts:
# Project name: bayon-coagent
# Environment: production  
# Default editor: Visual Studio Code
# App type: javascript
# Framework: react
# Source directory: src
# Distribution directory: .next
# Build command: npm run build
# Start command: npm run start
```

### Step 3: Add Hosting

```bash
amplify add hosting

# Choose:
# - Hosting with Amplify Console (Managed hosting with custom domains, CDN, etc)
# - Manual deployment
```

### Step 4: Deploy

```bash
amplify publish
```

### Step 5: Configure Custom Domain

```bash
# In Amplify Console:
# 1. Go to App Settings → Domain management
# 2. Add domain: bayoncoagent.app
# 3. AWS will automatically configure DNS
```

**Deployment Time**: 10-15 minutes

---

## Option 3: Self-Host on AWS (CloudFront + S3)

### Why Self-Host?
- ✅ Full control
- ✅ Lower cost for high traffic
- ✅ Custom configuration

### Step 1: Build Static Export

```bash
# Update next.config.ts to enable static export
# Then build
npm run build
```

### Step 2: Upload to S3

```bash
# Sync build to S3
aws s3 sync .next/standalone s3://bayon-coagent-static/

# Or create a new bucket
aws s3 mb s3://bayoncoagent-app
aws s3 sync .next/standalone s3://bayoncoagent-app/ --acl public-read
```

### Step 3: Create CloudFront Distribution

```bash
# Use the cloudfront-deployment.yaml template in your repo
aws cloudformation deploy \
  --template-file infrastructure/cloudfront-deployment.yaml \
  --stack-name bayon-coagent-cdn \
  --parameter-overrides DomainName=bayoncoagent.app
```

**Deployment Time**: 20-30 minutes

---

## Post-Deployment Tasks

### 1. Configure OAuth Providers

Update redirect URIs in each OAuth provider:

**Google Console**:
- Authorized redirect URIs: `https://bayoncoagent.app/api/oauth/google/callback`

**Facebook Developers**:
- Valid OAuth Redirect URIs: `https://bayoncoagent.app/api/oauth/facebook/callback`

**LinkedIn**:
- Redirect URLs: `https://bayoncoagent.app/api/oauth/linkedin/callback`

**Twitter**:
- Callback URLs: `https://bayoncoagent.app/api/oauth/twitter/callback`

### 2. Update Cognito Callback URLs

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-west-2_ALOcJxQDd \
  --client-id 1vnmp9v58opg04o480fokp0sct \
  --callback-urls "https://bayoncoagent.app/oauth/callback" "http://localhost:3000/oauth/callback" \
  --logout-urls "https://bayoncoagent.app" "http://localhost:3000"
```

### 3. Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://bayoncoagent.app/api/webhooks/stripe`
3. Select events: `customer.subscription.*`, `invoice.*`, `payment_intent.*`
4. Copy webhook secret and update environment variables

### 4. Test Your Deployment

```bash
# Test homepage
curl https://bayoncoagent.app

# Test API health
curl https://bayoncoagent.app/api/health

# Test authentication flow
# Visit https://bayoncoagent.app and try signing up
```

### 5. Set Up Monitoring

**CloudWatch Dashboard**:
- Monitor Lambda executions
- Track DynamoDB usage
- Watch S3 storage

**Application Monitoring**:
- Set up error tracking (Sentry)
- Set up analytics (PostHog/Google Analytics)
- Set up uptime monitoring (UptimeRobot)

---

## Quick Commands Reference

### Vercel Deployment
```bash
vercel --prod
```

### AWS Amplify Deployment
```bash
amplify publish
```

### Redeploy After Changes
```bash
# Build locally
npm run build

# Push to Git (if using CI/CD)
git add .
git commit -m "Deploy to production"
git push

# Or deploy directly
vercel --prod  # for Vercel
amplify publish  # for Amplify
```

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working
```bash
# Ensure .env.production.local is not in .gitignore
# Or set them in your deployment platform dashboard
```

### Cognito Authentication Fails
```bash
# Verify callback URLs match deployment URL
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-west-2_ALOcJxQDd \
  --client-id 1vnmp9v58opg04o480fokp0sct
```

### DynamoDB Access Denied
```bash
# Verify IAM role permissions
aws iam get-role-policy \
  --role-name bayon-coagent-app-v2-production \
  --policy-name DynamoDBAccess
```

---

## Recommended: Start with Vercel

For fastest deployment:

```bash
# 1. Deploy to Vercel
vercel --prod

# 2. Configure domain
# (Follow Vercel dashboard instructions)

# 3. Test
curl https://bayoncoagent-app.vercel.app

# 4. Point custom domain
# Add DNS records in Route 53

# Total time: ~15 minutes
```

---

## Cost Estimation

### Vercel
- Hobby: Free (limited)
- Pro: $20/month (unlimited)
- + AWS costs: ~$10-50/month

### AWS Amplify
- Build: $0.01/minute
- Hosting: $0.15/GB
- + AWS costs: ~$10-50/month

### Self-hosted (CloudFront + S3)
- CloudFront: $0.085/GB
- S3: $0.023/GB
- + AWS costs: ~$10-50/month

---

**Ready to deploy? Choose your platform and run the commands above!** 🚀
