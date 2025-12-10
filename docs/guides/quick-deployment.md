# Quick Start Deployment Guide

## 🚀 Deploy to AWS in 5 Steps

### Prerequisites
- AWS CLI installed and configured
- AWS SAM CLI installed
- Valid AWS account with appropriate permissions
- Your production domain name

---

## Step 1: Update Configuration (15 minutes)

### A. Replace Domain Placeholders

Find and replace all instances of `yourdomain.com` in `template.yaml`:

```bash
# Quick find
grep -n "yourdomain.com" template.yaml

# Replace with your domain (macOS/Linux)
sed -i 's/yourdomain\.com/app.yourcompany.com/g' template.yaml

# Or manually update lines: 142, 147, 375, 1692, 1720, 1748, 1776, 1805
```

### B. Set Your Alarm Email

Open `template.yaml` and update line 15:

```yaml
Parameters:
  AlarmEmail:
    Type: String
    Default: "ops@yourcompany.com"  # ← Update this
```

---

## Step 2: Build Your Application (2 minutes)

```bash
cd /Users/sengngor/Desktop/Apps/bayon-coagent

# Build SAM application
sam build

# Validate template (optional but recommended)
sam validate
```

---

## Step 3: Deploy to AWS (10 minutes)

### First-Time Deployment (Guided)

```bash
sam deploy --guided
```

**Answer the prompts**:
```
Setting default arguments for 'sam deploy'
=========================================
Stack Name [sam-app]: bayon-coagent-production
AWS Region [us-east-1]: us-west-2
Parameter Environment [development]: production
Parameter AlarmEmail [ops@yourcompany.com]: YOUR_EMAIL_HERE
#Shows you resources changes to be deployed and require a 'Y' to initiate deploy
Confirm changes before deploy [y/N]: y
#SAM needs permission to be able to create roles to connect to the resources in your template
Allow SAM CLI IAM role creation [Y/n]: Y
#Preserves the state of previously provisioned resources when an operation fails
Disable rollback [y/N]: N
Save arguments to configuration file [Y/n]: Y
SAM configuration file [samconfig.toml]: (press Enter)
SAM configuration environment [default]: production

Looking for resources needed for deployment:
...
```

**Deployment will take 10-15 minutes** ⏱️

### Subsequent Deployments (Simple)

After first deployment, just run:

```bash
sam deploy
```

---

## Step 4: Configure Secrets (15 minutes)

After deployment succeeds, populate your OAuth secrets:

```bash
# Get your secret ARNs from CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --query 'Stacks[0].Outputs[?OutputKey==`GoogleOAuthSecretArn`].OutputValue' \
  --output text

# Update Google OAuth Secret
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent-google-oauth-production \
  --secret-string '{
    "clientId": "YOUR_GOOGLE_CLIENT_ID",
    "clientSecret": "YOUR_GOOGLE_CLIENT_SECRET",
    "redirectUri": "https://app.yourcompany.com/api/oauth/google/callback"
  }'

# Repeat for other providers:
# - FacebookOAuthSecret
# - InstagramOAuthSecret  
# - LinkedInOAuthSecret
# - TwitterOAuthSecret
# - MLSAPISecret
# - StripeSecret
```

---

## Step 5: Verify Deployment (5 minutes)

### A. Check Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --query 'Stacks[0].StackStatus'
```

Expected output: `"CREATE_COMPLETE"` or `"UPDATE_COMPLETE"`

### B. Get Your Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Important outputs**:
- `UserPoolId` - Cognito User Pool ID
- `UserPoolClientId` - Cognito Client ID
- `IdentityPoolId` - Cognito Identity Pool ID
- `DynamoDBTableName` - DynamoDB Table Name
- `StorageBucketName` - S3 Bucket Name
- `MainApiEndpoint` - Main API Gateway URL

### C. Test Health Endpoint

```bash
# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --query 'Stacks[0].Outputs[?OutputKey==`MainApiEndpoint`].OutputValue' \
  --output text)

# Test health check
curl "${API_ENDPOINT}/health"
```

Expected response: `{"status": "healthy"}`

---

## 🎉 Success!

Your infrastructure is now deployed! 

### Next Steps:

1. **Configure Next.js Environment Variables**
   
   Create `.env.production.local`:
   ```env
   NEXT_PUBLIC_USER_POOL_ID=us-west-2_XXXXXXXXX
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_IDENTITY_POOL_ID=us-west-2:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   NEXT_PUBLIC_REGION=us-west-2
   NEXT_PUBLIC_API_ENDPOINT=https://XXXXXXXXXX.execute-api.us-west-2.amazonaws.com/v1
   
   # Get these from CloudFormation outputs
   DYNAMODB_TABLE_NAME=BayonCoAgent-production
   S3_BUCKET_NAME=bayon-coagent-storage-production-XXXXXXXXXXXX
   ```

2. **Set up Custom Domain** (Optional)
   - Create ACM certificate for your domain
   - Configure CloudFront distribution
   - Update Route53 DNS records

3. **Deploy Your Next.js Application**
   ```bash
   # Build for production
   npm run build
   
   # Deploy to your hosting (Vercel, Amplify, etc.)
   # Or use AWS Amplify:
   amplify init
   amplify add hosting
   amplify publish
   ```

4. **Test OAuth Flows**
   - Google Sign-In
   - Facebook Login
   - Other social providers

5. **Monitor Your Resources**
   - CloudWatch Dashboard
   - CloudWatch Alarms (check your email)
   - X-Ray traces

---

## 🔥 Common Issues & Solutions

### Issue: "Email not verified for SNS"

**Solution**: Check your email and confirm the SNS subscription for alarms

### Issue: "Access Denied" errors

**Solution**: Verify IAM roles and policies are created correctly
```bash
aws iam get-role --role-name bayon-coagent-app-production
```

### Issue: OAuth callbacks failing

**Solution**: Verify callback URLs in OAuth provider settings match your template

### Issue: DynamoDB throttling

**Solution**: DynamoDB is on-demand, but check for hot partitions in CloudWatch

---

## 🗑️ Cleanup / Rollback

If you need to delete everything:

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name bayon-coagent-production

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name bayon-coagent-production

# Manually delete S3 bucket (if needed)
BUCKET_NAME=$(aws ssm get-parameter --name /bayon-coagent/production/bucket-name --query 'Parameter.Value' --output text)
aws s3 rb s3://${BUCKET_NAME} --force
```

⚠️ **Warning**: This will delete:
- All DynamoDB data
- All S3 files
- All Cognito users
- All CloudWatch logs (after retention period)

---

## 📊 Cost Estimation

**First Month** (testing/low traffic):
- **Free Tier**: ~$0-20/month
- **After Free Tier**: ~$50-150/month

**Production** (100K active users):
- ~$700-1,300/month

See `PRODUCTION_READINESS_REVIEW.md` for detailed cost breakdown.

---

## 📞 Need Help?

- Check CloudFormation events for deployment errors
- Review CloudWatch Logs for runtime errors
- Check X-Ray traces for performance issues
- Review `PRODUCTION_READINESS_REVIEW.md` for detailed analysis

**Deployment Time**: ~45 minutes total (mostly waiting for AWS) ⏱️
