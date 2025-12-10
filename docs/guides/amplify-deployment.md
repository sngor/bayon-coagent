# AWS Amplify Deployment Guide for Bayon CoAgent

## Overview
We're deploying to AWS Amplify Hosting, which will integrate with your existing AWS infrastructure.

---

## Prerequisites (Already Complete ✅)
- [x] Amplify CLI installed
- [x] AWS credentials configured
- [x] Core infrastructure deployed
- [x] Next.js build successful

---

## Deployment Steps

### Step 1: Initialize Amplify (Interactive)

This will connect Amplify to your existing AWS resources.

**Run this command:**
```bash
amplify init
```

**Answer the prompts:**
```
? Enter a name for the project: bayoncoagent
? Initialize the project with the above configuration? No
? Enter a name for the environment: production
? Choose your default editor: Visual Studio Code
? Choose the type of app that you're building: javascript
? What javascript framework are you using: react
? Source Directory Path: src
? Distribution Directory Path: .next
? Build Command: npm run build
? Start Command: npm run start
? Do you want to use an AWS profile? Yes
? Please choose the profile you want to use: default
```

This will create:
- `amplify/` directory with configuration
- `.amplifyrc` file
- Update `.gitignore`

---

### Step 2: Add Hosting

After initialization, add hosting:

```bash
amplify add hosting
```

**Answer the prompts:**
```
? Select the plugin module to execute: Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)
? Choose a type: Manual deployment
```

---

### Step 3: Configure Environment Variables

Before publishing, we need to set environment variables in the Amplify app.

**Two options:**

#### Option A: Through Amplify Console (Recommended)

1. Go to: https://console.aws.amazon.com/amplify/
2. Find your app: `bayoncoagent`
3. Go to: App settings → Environment variables
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
BEDROCK_REGION=us-west-2
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
NODE_ENV=production
```

#### Option B: Through CLI

```bash
# Set environment variables
amplify env add production

# Then configure variables in amplify console
```

---

### Step 4: Deploy

```bash
amplify publish
```

This will:
1. Build your Next.js app
2. Upload to Amplify hosting
3. Deploy to CDN
4. Provide you with a URL

**Expected duration:** 5-10 minutes

---

### Step 5: Configure Custom Domain

After deployment, configure your custom domain:

```bash
amplify add hosting
```

Or in Amplify Console:
1. Go to: App settings → Domain management
2. Click "Add domain"
3. Enter: `bayoncoagent.app`
4. Amplify will automatically:
   - Create SSL certificate
   - Configure DNS (if using Route 53)
   - Set up redirects

**DNS Configuration (if needed):**
```
Type: A
Name: @
Value: (Amplify will provide)

Type: CNAME
Name: www
Value: (Amplify will provide)
```

---

### Step 6: Connect to Git (Optional but Recommended)

For continuous deployment:

```bash
amplify add hosting

# Choose: Continuous deployment (Git-based deployments)
# Connect to your Git repository
```

This enables:
- Automatic deployments on git push
- Preview deployments for PRs
- Rollback capabilities

---

## Post-Deployment Configuration

### 1. Update Cognito Callback URLs

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-west-2_ALOcJxQDd \
  --client-id 1vnmp9v58opg04o480fokp0sct \
  --callback-urls \
    "https://bayoncoagent.app/oauth/callback" \
    "https://main.XXXXX.amplifyapp.com/oauth/callback" \
    "http://localhost:3000/oauth/callback" \
  --logout-urls \
    "https://bayoncoagent.app" \
    "https://main.XXXXX.amplifyapp.com" \
    "http://localhost:3000"
```

### 2. Configure IAM Permissions

Amplify needs access to your AWS resources. Create an IAM role:

```bash
# The role is created automatically, but verify permissions
aws iam get-role --role-name amplifyconsole-backend-role
```

### 3. Update CORS on S3 Bucket

```bash
aws s3api put-bucket-cors \
  --bucket bayon-coagent-storage-production-v2-409136660268 \
  --cors-configuration file://cors-config.json
```

**cors-config.json:**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://bayoncoagent.app",
        "https://*.amplifyapp.com"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

## Monitoring & Management

### View Deployment Status
```bash
amplify status
```

### View Console
```bash
amplify console
```

### View Logs
In Amplify Console → Monitoring → Logs

### Redeploy
```bash
amplify publish
```

### Rollback
In Amplify Console → Deployments → Select previous version → Redeploy

---

## Amplify Console Features

Once deployed, you get:

1. **Automatic SSL/HTTPS** ✅
2. **Global CDN** ✅
3. **Custom domains** ✅
4. **CI/CD from Git** ✅
5. **Preview deployments** ✅
6. **Rollback capability** ✅
7. **Performance monitoring** ✅
8. **Access logs** ✅

---

## Troubleshooting

### Build Fails
Check build logs in Amplify Console:
- Go to App → Build settings
- Review build specification
- Check environment variables

### Environment Variables Not Applied
```bash
# In Amplify Console, ensure environment variables are set
# Then redeploy
amplify publish
```

### Custom Domain Not Working
- Verify Route 53 hosted zone
- Check SSL certificate status
- Wait for DNS propagation (5-60 minutes)

### Access Denied Errors
Check IAM role permissions:
```bash
aws iam list-attached-role-policies \
  --role-name amplifyconsole-backend-role
```

---

## Cost Estimation

### AWS Amplify Hosting
- Build minutes: $0.01/minute (~$0.50-2/month)
- Hosting: $0.15/GB transferred (~$5-15/month)
- Data storage: $0.023/GB (~$0.50-2/month)

### Total Monthly Cost
- Amplify: $6-20/month
- Existing AWS resources: $10-50/month
- **Total: $16-70/month**

---

## Next Steps After Deployment

1. ✅ Test deployment at provided URL
2. ✅ Configure custom domain
3. ✅ Set up OAuth providers
4. ✅ Configure Stripe webhooks
5. ✅ Enable monitoring
6. ✅ Set up Git-based deployments

---

## Quick Commands

```bash
# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish

# Open console
amplify console

# Check status
amplify status

# View environment
amplify env list
```

---

**Ready? Start with:** `amplify init`
