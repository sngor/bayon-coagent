# AWS SAM Deployment Guide

Complete guide for deploying Bayon CoAgent infrastructure using AWS SAM.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Cleanup](#cleanup)

## Prerequisites

### Install Required Tools

#### 1. AWS CLI

**macOS:**

```bash
brew install awscli
```

**Linux:**

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Verify:**

```bash
aws --version
```

#### 2. AWS SAM CLI

**macOS:**

```bash
brew install aws-sam-cli
```

**Linux:**

```bash
pip install aws-sam-cli
```

**Windows:**

```bash
choco install aws-sam-cli
```

**Verify:**

```bash
sam --version
```

### Configure AWS Credentials

```bash
aws configure
```

Enter:

- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

**Verify:**

```bash
aws sts get-caller-identity
```

## Initial Setup

### 1. Clone Repository

```bash
git clone <your-repo>
cd bayon-coagent
```

### 2. Validate Template

```bash
sam validate
```

Expected output:

```
template.yaml is a valid SAM Template
```

### 3. Review Configuration

Check `samconfig.toml` for environment settings.

## Development Deployment

### Step 1: Deploy Infrastructure

```bash
npm run sam:deploy:dev
```

Or manually:

```bash
./scripts/sam-deploy.sh development
```

With alarm email:

```bash
./scripts/sam-deploy.sh development your-email@example.com
```

### Step 2: Monitor Deployment

The deployment will:

1. Validate the template
2. Create a changeset
3. Show you what will be created
4. Ask for confirmation
5. Deploy all resources
6. Display outputs

This typically takes 5-10 minutes.

### Step 3: Save Outputs

Outputs are automatically saved to `sam-outputs.json`.

View outputs:

```bash
npm run sam:outputs
```

### Step 4: Update Environment Variables

```bash
npm run sam:update-env
```

This creates `.env.development` with all necessary values.

### Step 5: Configure Application

```bash
cp .env.development .env.local
```

Your `.env.local` should now contain:

```bash
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-development
S3_BUCKET_NAME=bayon-coagent-storage-development-123456789012
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1
NODE_ENV=development
USE_LOCAL_AWS=false
```

### Step 6: Test Application

```bash
npm run dev
```

Test:

1. User registration
2. User login
3. Database operations
4. File uploads
5. AI features

## Production Deployment

### Important Pre-Deployment Steps

#### 1. Update Production Settings

Edit `template.yaml` and update:

**OAuth Callback URLs:**

```yaml
CallbackURLs:
  - https://yourdomain.com/oauth/callback
LogoutURLs:
  - https://yourdomain.com
```

**CORS Origins:**

```yaml
AllowedOrigins:
  - https://yourdomain.com
```

#### 2. Set Alarm Email

Prepare your email address for CloudWatch alarms.

#### 3. Review Costs

Production includes:

- Point-in-time recovery for DynamoDB
- S3 versioning
- Enhanced monitoring

Estimated cost: $20-50/month

### Deploy to Production

```bash
npm run sam:deploy:prod
```

Or with alarm email:

```bash
./scripts/sam-deploy.sh production your-email@example.com
```

### Confirm Deployment

The script will:

1. Show all changes
2. Ask for confirmation
3. Deploy resources
4. Display outputs

**Important:** Review the changeset carefully before confirming!

### Update Production Environment

```bash
./scripts/update-env-from-sam.sh production
cp .env.production .env.production
```

### Verify Production Deployment

1. **Check CloudFormation Console**

   ```
   https://console.aws.amazon.com/cloudformation
   ```

2. **Test Authentication**

   - Register a test user
   - Verify email
   - Login

3. **Test Database**

   - Create data
   - Read data
   - Update data
   - Delete data

4. **Test Storage**

   - Upload file
   - Download file
   - Delete file

5. **Test AI Features**
   - Generate content
   - Verify responses

## Post-Deployment

### 1. Configure Cognito

#### Email Verification

For production, configure SES:

1. Go to SES Console
2. Verify your domain
3. Update Cognito to use SES:

```bash
aws cognito-idp update-user-pool \
  --user-pool-id <your-pool-id> \
  --email-configuration \
    SourceArn=arn:aws:ses:us-east-1:123456789012:identity/yourdomain.com \
    EmailSendingAccount=DEVELOPER
```

#### OAuth Providers

If using Google OAuth:

1. Go to Cognito Console
2. Select your User Pool
3. App integration → Domain name
4. Create a domain
5. Configure OAuth providers

### 2. Set Up Monitoring

#### Confirm SNS Subscription

If you provided an email:

1. Check your email
2. Click "Confirm subscription"
3. You'll receive alarm notifications

#### Access Dashboard

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BayonCoAgent-production
```

#### Test Alarms

Manually trigger a test alarm:

```bash
aws cloudwatch set-alarm-state \
  --alarm-name production-high-auth-failures \
  --state-value ALARM \
  --state-reason "Testing alarm"
```

### 3. Configure DNS (Production)

#### Set Up Custom Domain

1. **Register Domain** (if needed)

   - Route 53 or external registrar

2. **Create SSL Certificate**

   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --validation-method DNS
   ```

3. **Update Application**
   - Deploy to Amplify/Vercel/etc.
   - Configure custom domain
   - Update OAuth callbacks

### 4. Set Up Backups

#### DynamoDB

Point-in-time recovery is enabled in production.

Create on-demand backup:

```bash
aws dynamodb create-backup \
  --table-name BayonCoAgent-production \
  --backup-name manual-backup-$(date +%Y%m%d)
```

#### S3

Versioning is enabled in production.

Consider cross-region replication:

```bash
# Create replication bucket
aws s3 mb s3://bayon-coagent-backup-us-west-2 --region us-west-2

# Configure replication (via Console or CLI)
```

## Monitoring

### CloudWatch Dashboard

Your dashboard shows:

- Authentication activity
- DynamoDB operations
- S3 requests
- Bedrock invocations

### Key Metrics

1. **Authentication**

   - SignInSuccesses
   - SignInThrottles
   - UserRegistrations

2. **Database**

   - ConsumedReadCapacityUnits
   - ConsumedWriteCapacityUnits
   - UserErrors

3. **Storage**

   - AllRequests
   - 4xxErrors
   - 5xxErrors

4. **AI**
   - Invocations
   - ModelInvocationThrottles
   - InvocationLatency

### Alarms

Default alarms:

- High authentication failures (>10 in 10 min)
- DynamoDB throttling (>5 in 10 min)
- S3 errors (>5 in 10 min)

### Logs

View logs in CloudWatch:

```bash
aws logs tail /aws/lambda/your-function --follow
```

## Troubleshooting

### Deployment Failures

#### 1. Validation Error

```bash
sam validate --lint
```

Fix errors in `template.yaml` and redeploy.

#### 2. Resource Already Exists

If a resource name conflicts:

```bash
# Delete the existing resource
aws s3 rb s3://bucket-name --force

# Or update the template with a new name
```

#### 3. Insufficient Permissions

Ensure your IAM user has:

- CloudFormation full access
- IAM role creation
- Service-specific permissions

#### 4. Stack Rollback

If deployment fails and rolls back:

```bash
# View failure reason
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Fix the issue and redeploy
sam deploy --config-env development
```

### Application Issues

#### 1. Cannot Connect to Cognito

- Verify User Pool ID and Client ID
- Check region matches
- Verify IAM permissions

#### 2. DynamoDB Access Denied

- Check IAM role has DynamoDB permissions
- Verify table name is correct
- Check region matches

#### 3. S3 Upload Fails

- Verify CORS configuration
- Check bucket policy
- Verify IAM permissions

#### 4. Bedrock Not Available

- Verify Bedrock is enabled in your region
- Check model access permissions
- Verify model ID is correct

### Stack Stuck

If stack is stuck in UPDATE_ROLLBACK_FAILED:

```bash
aws cloudformation continue-update-rollback \
  --stack-name bayon-coagent-development
```

## Cleanup

### Development Environment

```bash
npm run sam:destroy:dev
```

Or:

```bash
./scripts/sam-destroy.sh development
```

This will:

1. Empty the S3 bucket
2. Delete all versions
3. Delete the CloudFormation stack
4. Remove all resources

### Production Environment

**⚠️ WARNING: This deletes all data!**

```bash
./scripts/sam-destroy.sh production
```

You must type `DELETE PRODUCTION` to confirm.

### Manual Cleanup

If automated cleanup fails:

```bash
# Empty S3 bucket
aws s3 rm s3://bucket-name --recursive

# Delete all versions
aws s3api list-object-versions \
  --bucket bucket-name \
  --output json \
  --query 'Versions[].{Key:Key,VersionId:VersionId}' | \
  jq -r '.[] | "--key \(.Key) --version-id \(.VersionId)"' | \
  xargs -I {} aws s3api delete-object --bucket bucket-name {}

# Delete stack
aws cloudformation delete-stack \
  --stack-name bayon-coagent-production
```

## Best Practices

### 1. Version Control

- Commit `template.yaml` and `samconfig.toml`
- Don't commit `.env` files
- Don't commit `sam-outputs.json`

### 2. Environment Separation

- Use separate AWS accounts for dev/prod
- Or use separate regions
- Never test in production

### 3. Security

- Rotate credentials regularly
- Use IAM roles instead of access keys
- Enable MFA for production
- Review IAM policies regularly

### 4. Cost Management

- Set up billing alarms
- Review costs monthly
- Use AWS Cost Explorer
- Tag all resources

### 5. Monitoring

- Check dashboard daily
- Review alarms weekly
- Analyze logs for errors
- Set up custom metrics

## Next Steps

After successful deployment:

1. ✅ Configure application with outputs
2. ✅ Test all features
3. ✅ Set up CI/CD pipeline
4. ✅ Configure monitoring
5. ✅ Document deployment process
6. ✅ Train team on AWS console
7. ✅ Set up backup procedures
8. ✅ Create runbooks for common issues

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)

## Support

For issues:

1. Check this guide
2. Review SAM CLI logs
3. Check CloudFormation events
4. Review CloudWatch logs
5. Consult AWS documentation
6. Contact AWS support
