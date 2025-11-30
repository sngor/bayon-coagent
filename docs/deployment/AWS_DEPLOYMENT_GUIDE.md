# AWS Production Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Infrastructure Deployment (SAM)](#infrastructure-deployment-sam)
- [Frontend Deployment (Amplify)](#frontend-deployment-amplify)
- [Environment Configuration](#environment-configuration)
- [Secrets Management](#secrets-management)
- [Domain and SSL Setup](#domain-and-ssl-setup)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring Setup](#monitoring-setup)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools

1. **Node.js 18.x or higher**
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **AWS CLI v2**
   ```bash
   aws --version
   # Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
   ```

3. **AWS SAM CLI**
   ```bash
   sam --version
   # Install: brew install aws-sam-cli
   # Or: pip install aws-sam-cli
   ```

4. **Git**
   ```bash
   git --version
   ```

### AWS Account Requirements

1. **AWS Account** with production workload capabilities
2. **IAM User** with the following permissions:
   - CloudFormation (full access)
   - IAM (role creation and policy management)
   - Cognito (full access)
   - DynamoDB (full access)
   - S3 (full access)
   - CloudWatch (full access)
   - SNS (full access)
   - Secrets Manager (full access)
   - Bedrock (invoke model access)
   - Amplify (full access)

3. **Service Quotas** verified:
   - DynamoDB tables (sufficient for your needs)
   - S3 buckets (minimum 1)
   - Cognito user pools (minimum 1)
   - Lambda functions (if using Lambda)

### Production Domain Requirements

- Registered domain name (e.g., `bayoncoagent.com`)
- Access to DNS configuration (Route 53 recommended)
- SSL/TLS certificate (can be created via AWS ACM)

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] AWS CLI configured with production credentials
- [ ] Production domain name registered and accessible
- [ ] All required environment variables documented
- [ ] Secrets prepared for AWS Secrets Manager
- [ ] Cost budget and billing alarms configured
- [ ] Backup and disaster recovery plan reviewed
- [ ] Security policies reviewed and approved
- [ ] Team access and permissions configured

## Infrastructure Deployment (SAM)

### Step 1: Configure AWS Credentials

```bash
# Configure AWS CLI for production
aws configure --profile bayon-production

# Set as default profile for this session
export AWS_PROFILE=bayon-production
export AWS_REGION=us-west-2  # or your preferred region
```

### Step 2: Update Production Configuration

Edit `template.yaml` and update production placeholders:

```yaml
# Find and replace:
# yourdomain.com → your-actual-domain.com
```

Update `samconfig.toml` if changing regions or stack names:

```toml
[production.deploy.parameters]
stack_name = "bayon-coagent-prod"
parameter_overrides = "Environment=production AlarmEmail=alerts@yourdomain.com"
region = "us-west-2"  # your production region
```

### Step 3: Validate SAM Template

```bash
npm run sam:validate
```

Expected output: "template.yaml is a valid SAM Template"

### Step 4: Review Infrastructure Changes

```bash
# See what will be deployed
sam build
sam deploy --guided --config-env production --no-execute-changeset
```

Review the changeset in CloudFormation console before proceeding.

### Step 5: Deploy Infrastructure

```bash
# Deploy using the deployment script
npm run sam:deploy:prod

# Or manually
sam deploy --config-env production --parameter-overrides Environment=production
```

**Deployment time**: 15-25 minutes (first deployment)

### Step 6: Save Infrastructure Outputs

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-prod \
  --query 'Stacks[0].Outputs' \
  --output table

# Save to file
npm run sam:outputs > infrastructure-outputs.json
```

Key outputs you'll need:
- `CognitoUserPoolId`
- `CognitoClientId`
- `DynamoDBTableName`
- `S3BucketName`
- `IdentityPoolId`

## Frontend Deployment (Amplify)

### Step 1: Prepare Repository

Ensure your code is pushed to the Git repository:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Run Amplify Deployment Script

```bash
# This script will guide you through Amplify setup
npm run deploy:amplify
```

When prompted:
1. Select environment: `production`
2. Enter AWS region: `us-west-2` (or your region)
3. Enter repository URL: Your Git repository URL
4. Enter branch name: `main` (or your production branch)

### Step 3: Configure Environment Variables in Amplify Console

Navigate to AWS Amplify Console:
```
https://console.aws.amazon.com/amplify/home?region=us-west-2
```

Go to: App Settings → Environment variables

Add the following (using values from infrastructure outputs):
```
NODE_ENV=production
AWS_REGION=us-west-2
COGNITO_USER_POOL_ID=us-west-2_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
DYNAMODB_TABLE_NAME=BayonCoAgent-production
S3_BUCKET_NAME=bayon-coagent-storage-production-XXXXXXXXXXXX
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-west-2
```

### Step 4: Add Secrets

For sensitive values, add them as environment variables in Amplify Console:
- `GOOGLE_CLIENT_ID` (from Secrets Manager or directly)
- `GOOGLE_CLIENT_SECRET` (from Secrets Manager or directly)
- Other API keys and credentials

### Step 5: Trigger Build

```bash
# Start the first deployment
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE
```

Or use the Amplify Console to trigger a manual deployment.

**Build time**: 5-15 minutes

### Step 6: Monitor Deployment

Monitor in Amplify Console:
```
https://console.aws.amazon.com/amplify/home#/YOUR_APP_ID/main/JOB_ID
```

## Environment Configuration

### Create Production Environment File

Create `.env.production.local` (not committed to Git):

```bash
# Copy from infrastructure outputs
NODE_ENV=production
AWS_REGION=us-west-2
COGNITO_USER_POOL_ID=us-west-2_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
DYNAMODB_TABLE_NAME=BayonCoAgent-production
S3_BUCKET_NAME=bayon-coagent-storage-production-XXXXXXXXXXXX
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-west-2

# OAuth Configuration
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/oauth/google/callback

# Social Media
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# API Keys
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
TAVILY_API_KEY=your-tavily-api-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXX
```

## Secrets Management

### Create Secrets in AWS Secrets Manager

```bash
# Run the setup script
./scripts/setup-secrets-manager.sh production
```

Or manually create secrets:

```bash
# Google OAuth
aws secretsmanager create-secret \
  --name bayon-coagent/production/google-oauth \
  --description "Google OAuth credentials" \
  --secret-string '{
    "client_id": "your-client-id",
    "client_secret": "your-client-secret"
  }'

# Stripe
aws secretsmanager create-secret \
  --name bayon-coagent/production/stripe \
  --description "Stripe API credentials" \
  --secret-string '{
    "publishable_key": "pk_live_XXXX",
    "secret_key": "sk_live_XXXX",
    "webhook_secret": "whsec_XXXX"
  }'
```

### Update Application to Use Secrets Manager

Secrets are automatically retrieved by the application at runtime using the AWS SDK. Ensure your Lambda execution role (or EC2/ECS task role) has permissions to read from Secrets Manager.

## Domain and SSL Setup

### Step 1: Create SSL Certificate (ACM)

```bash
# Request certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names "*.your-domain.com" \
  --validation-method DNS \
  --region us-east-1
```

### Step 2: Validate Domain Ownership

Add the DNS validation records provided by ACM to your DNS provider.

### Step 3: Configure Custom Domain in Amplify

In Amplify Console:
1. Go to App Settings → Domain management
2. Click "Add domain"
3. Enter your domain: `your-domain.com`
4. Add subdomains as needed: `www`, `app`, etc.
5. AWS will automatically configure Route 53 records

### Step 4: Update OAuth Callback URLs

Update callback URLs in:
- Google Cloud Console
- Cognito User Pool settings
- Any other OAuth providers

## Post-Deployment Verification

### Run Smoke Tests

```bash
# Test authentication
./scripts/smoke-tests/test-auth.sh https://your-domain.com

# Test database
./scripts/smoke-tests/test-database.sh

# Test S3 storage
./scripts/smoke-tests/test-storage.sh

# Test AI integration
./scripts/smoke-tests/test-ai.sh
```

### Manual Verification Checklist

- [ ] Application loads at production URL
- [ ] SSL certificate is valid (green lock icon)
- [ ] User can sign up with email
- [ ] User can log in
- [ ] User can upload files
- [ ] AI features work (test a content generation)
- [ ] OAuth login works (Google)
- [ ] Password reset works
- [ ] Dashboard loads with data
- [ ] Forms submit successfully

## Monitoring Setup

### CloudWatch Dashboard

Access your production dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=BayonCoAgent-production
```

### Configure Alarms

Alarms are automatically created by the SAM template. Subscribe to SNS notifications:

1. Check your email for SNS subscription confirmation
2. Click the confirmation link
3. Test alarms:
   ```bash
   aws sns publish \
     --topic-arn arn:aws:sns:us-west-2:ACCOUNT_ID:bayon-coagent-production-alarms \
     --message "Test alarm notification"
   ```

### Key Metrics to Monitor

- **Application Health**: Response times, error rates
- **Authentication**: Sign-ins, sign-ups, failures
- **DynamoDB**: Read/write capacity, throttling
- **S3**: Request rates, error rates
- **Bedrock AI**: Invocation counts, latency, costs

## Troubleshooting

### Build Failures

**Problem**: Next.js build fails in Amplify

**Solutions**:
1. Check build logs in Amplify Console
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check for TypeScript errors: `npm run typecheck`

### Authentication Issues

**Problem**: Users cannot sign in

**Solutions**:
1. Verify Cognito User Pool is active
2. Check callback URLs match production domain
3. Verify environment variables are correct
4. Check CloudWatch Logs for Cognito errors

### Database Connection Issues

**Problem**: Cannot read/write to DynamoDB

**Solutions**:
1. Verify IAM role has DynamoDB permissions
2. Check table name matches environment variable
3. Verify region is correct
4. Check CloudWatch Logs for DynamoDB errors

### High Costs

**Problem**: AWS costs are higher than expected

**Solutions**:
1. Check CloudWatch metrics for usage spikes
2. Review Bedrock AI invocation counts
3. Check S3 storage usage and lifecycle policies
4. Set up AWS Cost Anomaly Detection
5. Review DynamoDB read/write patterns

## Rollback Procedures

### Application Rollback (Amplify)

```bash
# List recent deployments
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main

# Redeploy a previous version
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --commit-id PREVIOUS_COMMIT_ID
```

### Infrastructure Rollback (CloudFormation)

```bash
# Find the previous successful stack version
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-prod

# Perform rollback
aws cloudformation cancel-update-stack --stack-name bayon-coagent-prod
```

Or update to a previous template version:
```bash
sam deploy --config-env production --template previous-template.yaml
```

### Emergency Procedures

**Complete Service Disruption**:
1. Check AWS Service Health Dashboard
2. Review CloudWatch alarms
3. Check CloudFormation stack status
4. Contact AWS Support if needed

**Data Breach or Security Incident**:
1. Immediately rotate all credentials
2. Review CloudTrail logs
3. Disable affected user accounts
4. Contact security team
5. Follow incident response procedures

## Next Steps

After successful deployment:

1. ✅ Configure monitoring dashboards
2. ✅ Set up automated backups
3. ✅ Document runbooks for common operations
4. ✅ Train team on production access
5. ✅ Schedule regular security reviews
6. ✅ Set up automated deployment pipeline
7. ✅ Implement feature flags for gradual rollouts

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Secrets Management Guide](./SECRETS_MANAGEMENT.md)
- [Monitoring Guide](./MONITORING_GUIDE.md)
