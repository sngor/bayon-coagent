# Modular SAM Deployment Guide

## Overview

We've broken down your massive 5000+ line template into modular components:

### Phase 1: Core Infrastructure (DEPLOY THIS FIRST)
**File**: `template-core.yaml` (~400 lines)

**Includes**:
- ✅ Cognito User Pool & Identity Pool
- ✅ DynamoDB Table (with 3 GSIs instead of 6)
- ✅ S3 Storage Bucket
- ✅ IAM Roles (Application & Authenticated)
- ✅ CloudWatch Log Groups
- ✅ SNS Alarm Topic

**Deploy time**: ~8-10 minutes

### Phase 2: API & Lambda Functions (Later)
- API Gateway configurations
- Lambda functions
- SQS queues
- EventBridge rules

### Phase 3: Integrations & Secrets (Later)
- OAuth secrets (Google, Facebook, etc.)
- Stripe integration
- MLS API configuration

---

## Quick Start: Deploy Core Infrastructure

### Step 1: Build Core Template

```bash
cd /Users/sengngor/Desktop/Apps/bayon-coagent

# Build using core template
sam build --template template-core.yaml
```

### Step 2: Deploy Core Infrastructure

```bash
# Deploy with explicit parameters
sam deploy \
  --template-file template-core.yaml \
  --stack-name bayon-coagent-core-production \
  --region us-west-2 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Environment=production \
    AlarmEmail=ops@bayoncoagent.app \
  --no-confirm-changeset \
  --resolve-s3
```

**Expected Duration**: 8-10 minutes

### Step 3: Verify Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-core-production \
  --query 'Stacks[0].StackStatus'

# Get outputs
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-core-production \
  --query 'Stacks[0].Outputs' \
  --output table
```

---

## What You'll Get

After deploying the core template:

### ✅ Ready to Use:
1. **User Authentication** - Cognito configured and ready
2. **Database** - DynamoDB table with primary and 3 GSI indexes
3. **File Storage** - S3 bucket with encryption and lifecycle
4. **Security** - IAM roles for application and users
5. **Monitoring** - CloudWatch logs and SNS alarms

### 📊 Outputs You'll Need:

Save these for your Next.js app:

```env
NEXT_PUBLIC_USER_POOL_ID=<UserPoolId>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<UserPoolClientId>
NEXT_PUBLIC_IDENTITY_POOL_ID=<IdentityPoolId>
NEXT_PUBLIC_REGION=us-west-2

DYNAMODB_TABLE_NAME=<DynamoDBTableName>
S3_BUCKET_NAME=<StorageBucketName>
```

---

## Next Steps

Once core infrastructure is deployed:

### Option 1: Use with Next.js Directly
- Configure environment variables
- Deploy Next.js app to Vercel/Amplify
- Use AWS SDK to interact with resources

### Option 2: Add API Gateway Layer
We can create a second template for API Gateway if needed:
- REST APIs
- WebSocket APIs
- API authorizers

### Option 3: Add Lambda Functions
Create separate template for specific Lambda functions:
- AI processing
- Background jobs
- Webhooks

---

## Advantages of Modular Approach

✅ **Faster Deployments** - Each stack deploys in 5-10 min vs 20-30 min  
✅ **Easier Updates** - Update only what changed  
✅ **Better Debugging** - Smaller templates = clearer errors  
✅ **Independent Testing** - Test components separately  
✅ **Cost Visibility** - See costs per component  

---

## Rollback

If anything goes wrong:

```bash
# Delete just the core stack
aws cloudformation delete-stack \
  --stack-name bayon-coagent-core-production

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name bayon-coagent-core-production
```

---

## Comparison

| Aspect | Monolithic (5000 lines) | Modular (400 lines) |
|--------|------------------------|---------------------|
| **Deploy Time** | 20-30 minutes | 8-10 minutes |
| **Error Clarity** | ❌ Vague | ✅ Specific |
| **Update Speed** | Slow | Fast |
| **Testing** | Difficult | Easy |
| **Debugging** | Hard | Simple |

---

## Ready to Deploy?

Run this command:

```bash
sam build --template template-core.yaml && \
sam deploy \
  --template-file template-core.yaml \
  --stack-name bayon-coagent-core-production \
  --region us-west-2 \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment=production AlarmEmail=ops@bayoncoagent.app \
  --no-confirm-changeset \
  --resolve-s3
```

This will give you a working foundation in about 10 minutes!
