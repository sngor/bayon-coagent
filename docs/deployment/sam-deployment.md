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
# AWS SAM Infrastructure - Implementation Summary

## Overview

The Bayon CoAgent infrastructure has been implemented using AWS SAM (Serverless Application Model) instead of CDK. SAM provides a simpler, more maintainable approach for serverless applications.

## What Was Created

### 1. SAM Template (`template.yaml`)

A comprehensive CloudFormation template with SAM transforms that defines:

#### Cognito Stack

- User Pool with email authentication
- User Pool Client for web application
- Identity Pool for AWS credentials
- Custom attributes (agentId, businessName)
- MFA support (optional)
- Email verification
- OAuth configuration
- Authenticated user IAM role

#### DynamoDB Stack

- Single table design (PK/SK)
- Three Global Secondary Indexes:
  - GSI1: Alternate access patterns
  - EntityTypeIndex: Query by entity type
  - UserIndex: User-scoped queries
- DynamoDB Streams enabled
- Point-in-time recovery (production)
- TTL support
- Pay-per-request billing

#### S3 Stack

- Storage bucket with AES256 encryption
- CORS configuration for browser uploads
- Lifecycle policies:
  - Delete old versions after 90 days
  - Transition to IA after 90 days (production)
- Versioning (production only)
- Public access blocked
- Bucket policy for application access

#### IAM Stack

- Application role with permissions for:
  - Cognito user management
  - DynamoDB read/write
  - S3 read/write
  - CloudWatch Logs
  - Bedrock model invocation
- User-scoped policies for data isolation
- Least privilege access

#### Monitoring Stack

- CloudWatch Dashboard with metrics for:
  - Authentication activity
  - DynamoDB operations
  - S3 requests
  - Bedrock invocations
- CloudWatch Alarms for:
  - High authentication failures
  - DynamoDB throttling
  - S3 errors
- SNS topic for alarm notifications

### 2. SAM Configuration (`samconfig.toml`)

Environment-specific deployment configurations:

- Default settings
- Development environment
- Production environment
- Build and deployment parameters

### 3. Deployment Scripts

#### `scripts/sam-deploy.sh`

- Validates template
- Verifies AWS credentials
- Deploys infrastructure
- Saves outputs to JSON
- Provides next steps

#### `scripts/sam-destroy.sh`

- Empties S3 bucket
- Deletes all versions
- Destroys CloudFormation stack
- Production safety checks

#### `scripts/update-env-from-sam.sh`

- Retrieves stack outputs
- Generates .env file
- Displays configuration values

### 4. Documentation

- **SAM_README.md**: Quick start and overview
- **SAM_DEPLOYMENT_GUIDE.md**: Comprehensive deployment instructions
- **SAM_QUICK_REFERENCE.md**: Command reference and troubleshooting
- **SAM_IMPLEMENTATION_SUMMARY.md**: This document

## Key Features

### ✅ Simplified Infrastructure as Code

- YAML-based template (easier than CDK TypeScript)
- Built-in SAM transforms
- Less code to maintain
- Faster deployments

### ✅ Multi-Environment Support

- Separate development and production configurations
- Environment-specific parameters
- Conditional resources (e.g., alarms only with email)

### ✅ Complete Security

- Encryption at rest and in transit
- User-scoped access policies
- MFA support
- Least privilege IAM roles
- Public access blocked

### ✅ Comprehensive Monitoring

- CloudWatch Dashboard
- Proactive alarms
- SNS notifications
- Metrics for all services

### ✅ Cost Optimization

- Pay-per-request DynamoDB
- Lifecycle policies for S3
- Conditional resources based on environment
- No unnecessary resources in development

### ✅ Production Ready

- Point-in-time recovery for DynamoDB
- S3 versioning
- Enhanced monitoring
- Resource retention
- Comprehensive alarms

## Usage

### Quick Start

```bash
# 1. Validate template
sam validate

# 2. Deploy to development
npm run sam:deploy:dev

# 3. Update environment variables
npm run sam:update-env
cp .env.development .env.local

# 4. Test application
npm run dev
```

### Available Commands

```bash
# Validation
npm run sam:validate

# Deployment
npm run sam:deploy:dev
npm run sam:deploy:prod

# Management
npm run sam:outputs
npm run sam:update-env

# Cleanup
npm run sam:destroy:dev
npm run sam:destroy:prod
```

## Advantages Over CDK

### Why SAM Instead of CDK?

1. **Simpler Syntax**

   - YAML instead of TypeScript
   - Less boilerplate code
   - Easier to read and maintain

2. **Faster Deployments**

   - No TypeScript compilation
   - Direct CloudFormation deployment
   - Faster iteration

3. **Better for Serverless**

   - Built-in serverless patterns
   - Optimized for Lambda/API Gateway
   - Simpler local testing

4. **Less Maintenance**

   - No npm dependencies to update
   - No build step required
   - Fewer moving parts

5. **Team Friendly**
   - Easier for non-TypeScript developers
   - Standard CloudFormation syntax
   - Better AWS Console integration

### When to Use CDK

CDK is better for:

- Complex infrastructure logic
- Heavy code reuse
- Type safety requirements
- Large enterprise applications

For this project, SAM is the better choice because:

- Infrastructure is straightforward
- Serverless-first architecture
- Simpler to maintain
- Faster to deploy

## Infrastructure Comparison

### Resources Created (Same in Both)

| Resource                 | SAM | CDK |
| ------------------------ | --- | --- |
| Cognito User Pool        | ✅  | ✅  |
| Cognito User Pool Client | ✅  | ✅  |
| Cognito Identity Pool    | ✅  | ✅  |
| DynamoDB Table           | ✅  | ✅  |
| DynamoDB GSIs (3)        | ✅  | ✅  |
| S3 Bucket                | ✅  | ✅  |
| Lambda Functions (6+)    | ✅  | ✅  |
| EventBridge Rules        | ✅  | ✅  |
| SQS Queues & DLQs        | ✅  | ✅  |
| IAM Roles                | ✅  | ✅  |
| CloudWatch Dashboard     | ✅  | ✅  |
| CloudWatch Alarms        | ✅  | ✅  |
| SNS Topic                | ✅  | ✅  |

### Code Comparison

**SAM:**

- 1 YAML file (~800 lines)
- 3 bash scripts
- 4 documentation files
- No dependencies
- No build step

**CDK:**

- 5 TypeScript files (~1500 lines)
- 4 bash scripts
- 5 documentation files
- npm dependencies
- Build step required

## Integration with Application

The infrastructure integrates seamlessly with existing application code:

### Authentication

- `src/aws/auth/cognito-client.ts`
- `src/aws/auth/use-user.tsx`
- `src/aws/auth/auth-provider.tsx`

### Database

- `src/aws/dynamodb/client.ts`
- `src/aws/dynamodb/repository.ts`
- `src/aws/dynamodb/hooks/`

### Storage

- `src/aws/s3/client.ts`
- `src/hooks/use-s3-upload.ts`
- `src/components/s3-file-upload.tsx`

### Lambda Functions

The deployment includes several Lambda functions for background processing:

- **Trial Notifications**: `bayon-coagent-trial-notifications-{env}`
  - Daily automated trial expiry notifications (12 PM UTC)
  - Handles 3-day and 1-day trial warnings
  - Manages expired trial processing
- **Market Intelligence**: Background market analysis and alerts
- **Notification Processing**: Email and communication handling
- **Content Processing**: AI-powered content generation jobs

**Monitoring**: All functions include CloudWatch alarms and dead letter queues for reliability.

**Logs**: View function logs with:
```bash
aws logs tail /aws/lambda/bayon-coagent-trial-notifications-production --follow
```

### AI

- `src/aws/bedrock/client.ts`
- `src/aws/bedrock/flows/`

### Monitoring

- `src/aws/logging/`

## Requirements Satisfied

This implementation fully satisfies **Requirement 6.5**:

- ✅ Infrastructure as Code (using SAM instead of CDK)
- ✅ Cognito User Pool stack
- ✅ DynamoDB table stack with GSI
- ✅ S3 bucket stack with CORS and policies
- ✅ IAM roles and policies
- ✅ CloudWatch alarms and dashboards
- ✅ Deployment scripts

## Migration from CDK

If you previously had CDK infrastructure:

### What Changed

- Template format: TypeScript → YAML
- Deployment tool: CDK CLI → SAM CLI
- Configuration: cdk.json → samconfig.toml

### What Stayed the Same

- All AWS resources
- Resource names and IDs
- Stack outputs
- Application integration
- Environment variables

### Migration Steps

1. Remove `infrastructure/` directory (CDK)
2. Use `template.yaml` (SAM)
3. Update deployment scripts
4. No application code changes needed

## Cost Estimation

### Development Environment

- Cognito: Free tier
- DynamoDB: $1-5/month (pay-per-request)
- S3: $1-3/month
- CloudWatch: $0-2/month
- Bedrock: Variable (pay-per-use)
- **Total: ~$5-15/month**

### Production Environment

- Cognito: Free tier
- DynamoDB: $5-15/month (with PITR)
- S3: $3-10/month (with versioning)
- CloudWatch: $2-5/month
- Bedrock: Variable (pay-per-use)
- **Total: ~$20-50/month**

## Next Steps

1. ✅ SAM infrastructure is complete
2. ⏭️ Deploy to development: `npm run sam:deploy:dev`
3. ⏭️ Update .env: `npm run sam:update-env`
4. ⏭️ Test application: `npm run dev`
5. ⏭️ Configure monitoring
6. ⏭️ Deploy to production when ready

## Documentation

For detailed information:

- [SAM README](SAM_README.md) - Quick start guide
- [SAM Deployment Guide](SAM_DEPLOYMENT_GUIDE.md) - Step-by-step instructions
- [SAM Quick Reference](SAM_QUICK_REFERENCE.md) - Command reference

## Support

For issues:

1. Check documentation
2. Run `sam validate`
3. Review CloudFormation events
4. Check CloudWatch logs
5. Consult AWS SAM documentation

---

**Status**: ✅ Complete and ready for deployment
**Requirements**: ✅ All satisfied (Requirement 6.5)
**Documentation**: ✅ Comprehensive
**Testing**: ⏭️ Ready for deployment testing
**Recommended**: ✅ SAM is the better choice for this project
# SAM Quick Reference

## Essential Commands

### Validation

```bash
sam validate                    # Validate template
sam validate --lint            # Validate with linting
```

### Deployment

```bash
# Development
./scripts/sam-deploy.sh development

# Production
./scripts/sam-deploy.sh production your-email@example.com

# Manual deployment
sam deploy --config-env development
sam deploy --config-env production
```

### Stack Management

```bash
# List stacks
sam list stacks

# View outputs
sam list stack-outputs --stack-name bayon-coagent-development

# View resources
sam list resources --stack-name bayon-coagent-development

# Delete stack
./scripts/sam-destroy.sh development
```

### Environment Setup

```bash
# Update .env from stack outputs
./scripts/update-env-from-sam.sh development

# Copy to application
cp .env.development .env.local
```

## Stack Outputs

After deployment, get these values:

```bash
# All outputs
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs' \
  --output table

# Specific output
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text
```

## Environment Variables

Required in your `.env.local`:

```bash
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=<from outputs>
COGNITO_CLIENT_ID=<from outputs>
DYNAMODB_TABLE_NAME=<from outputs>
S3_BUCKET_NAME=<from outputs>
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Monitoring

### Dashboard

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BayonCoAgent-development
```

### Logs

```bash
# View CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --max-items 20

# View specific resource
aws cloudformation describe-stack-resource \
  --stack-name bayon-coagent-development \
  --logical-resource-id DynamoDBTable
```

## Troubleshooting

### Check Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].StackStatus'
```

### View Failed Events

```bash
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Delete Failed Stack

```bash
aws cloudformation delete-stack \
  --stack-name bayon-coagent-development
```

### Empty S3 Bucket

```bash
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs[?OutputKey==`StorageBucketName`].OutputValue' \
  --output text)

aws s3 rm s3://${BUCKET} --recursive
```

## Cost Estimation

### Development (~$5-15/month)

- Cognito: Free tier
- DynamoDB: $1-5 (pay-per-request)
- S3: $1-3
- CloudWatch: $0-2
- Bedrock: Variable (pay-per-use)

### Production (~$20-50/month)

- Cognito: Free tier
- DynamoDB: $5-15 (with PITR)
- S3: $3-10 (with versioning)
- CloudWatch: $2-5
- Bedrock: Variable (pay-per-use)

## Common Tasks

### Update Stack

```bash
# Make changes to template.yaml
sam validate
sam deploy --config-env development
```

### View Drift

```bash
aws cloudformation detect-stack-drift \
  --stack-name bayon-coagent-development

# Check drift status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <id-from-above>
```

### Export Template

```bash
aws cloudformation get-template \
  --stack-name bayon-coagent-development \
  --query 'TemplateBody' > deployed-template.yaml
```

## Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "sam:validate": "sam validate",
    "sam:deploy:dev": "./scripts/sam-deploy.sh development",
    "sam:deploy:prod": "./scripts/sam-deploy.sh production",
    "sam:destroy:dev": "./scripts/sam-destroy.sh development",
    "sam:destroy:prod": "./scripts/sam-destroy.sh production",
    "sam:outputs": "sam list stack-outputs --stack-name bayon-coagent-development"
  }
}
```

## AWS Console Links

### CloudFormation

```
https://console.aws.amazon.com/cloudformation/home?region=us-east-1
```

### Cognito

```
https://console.aws.amazon.com/cognito/home?region=us-east-1
```

### DynamoDB

```
https://console.aws.amazon.com/dynamodb/home?region=us-east-1
```

### S3

```
https://console.aws.amazon.com/s3/home?region=us-east-1
```

### CloudWatch

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1
```

## Tips

1. **Always validate before deploying**

   ```bash
   sam validate && sam deploy
   ```

2. **Use --guided for first deployment**

   ```bash
   sam deploy --guided
   ```

3. **Save outputs immediately**

   ```bash
   ./scripts/update-env-from-sam.sh development
   ```

4. **Check costs regularly**

   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=2024-01-01,End=2024-01-31 \
     --granularity MONTHLY \
     --metrics BlendedCost
   ```

5. **Tag resources for cost tracking**
   All resources are tagged with Environment and Application

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Update .env file
3. ✅ Test application
4. ✅ Set up monitoring
5. ✅ Configure alarms
6. ✅ Document deployment
# AWS SAM Infrastructure for Bayon CoAgent

This project uses AWS SAM (Serverless Application Model) to define and deploy the infrastructure.

## Overview

AWS SAM is a framework for building serverless applications on AWS. It provides:

- Simplified CloudFormation syntax
- Local testing capabilities
- Built-in best practices
- Easy deployment and management

## Prerequisites

### Required Tools

1. **AWS CLI**

   ```bash
   aws --version
   ```

   Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

2. **AWS SAM CLI**

   ```bash
   sam --version
   ```

   Install:

   ```bash
   # macOS
   brew install aws-sam-cli

   # Linux/Windows
   pip install aws-sam-cli
   ```

3. **Node.js 18+**
   ```bash
   node --version
   ```

### AWS Account Setup

1. Create an AWS account
2. Create an IAM user with appropriate permissions
3. Configure AWS CLI:
   ```bash
   aws configure
   ```

## Quick Start

### 1. Validate Template

```bash
sam validate
```

### 2. Deploy to Development

```bash
./scripts/sam-deploy.sh development
```

Or with alarm email:

```bash
./scripts/sam-deploy.sh development your-email@example.com
```

### 3. Update Environment Variables

```bash
./scripts/update-env-from-sam.sh development
cp .env.development .env.local
```

### 4. Verify Deployment

Check the AWS Console or use:

```bash
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs' \
  --output table
```

## Infrastructure Components

### Cognito (Authentication)

- User Pool with email sign-in
- User Pool Client for web app
- Identity Pool for AWS credentials
- MFA support (optional)

### DynamoDB (Database)

- Single table design with PK/SK
- Three Global Secondary Indexes
- Streams enabled for real-time updates
- Point-in-time recovery (production)

### S3 (Storage)

- Encrypted storage bucket
- CORS configured for browser uploads
- Lifecycle policies
- Versioning (production)

### IAM (Security)

- Application role with service permissions
- User-scoped policies for data isolation
- Least privilege access

### CloudWatch (Monitoring)

- Dashboard with key metrics
- Alarms for critical issues
- SNS notifications (optional)

## Deployment Commands

### Deploy to Development

```bash
sam deploy --config-env development
```

Or use the script:

```bash
./scripts/sam-deploy.sh development
```

### Deploy to Production

```bash
sam deploy --config-env production --parameter-overrides AlarmEmail=your-email@example.com
```

Or use the script:

```bash
./scripts/sam-deploy.sh production your-email@example.com
```

### View Stack Outputs

```bash
sam list stack-outputs --stack-name bayon-coagent-development
```

### Delete Stack

```bash
./scripts/sam-destroy.sh development
```

## Local Development

SAM supports local testing, but for this Next.js application, we recommend:

1. Use LocalStack for local AWS services
2. Use the existing local development setup
3. Deploy to a development AWS environment for integration testing

## Configuration

### Environment Parameters

The template accepts these parameters:

- `Environment`: development or production
- `AlarmEmail`: Email for CloudWatch alarms (optional)

### Customization

Edit `template.yaml` to customize:

- Resource names
- Capacity settings
- Security policies
- Monitoring thresholds

## Monitoring

### CloudWatch Dashboard

Access your dashboard:

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BayonCoAgent-{environment}
```

### Alarms

If you provided an email, you'll receive notifications for:

- High authentication failures
- DynamoDB throttling
- S3 errors

## Cost Optimization

### Development Environment

- Pay-per-request DynamoDB
- Standard S3 storage
- No versioning
- Estimated: $5-15/month

### Production Environment

- Pay-per-request DynamoDB with PITR
- S3 with versioning and lifecycle
- CloudWatch monitoring
- Estimated: $20-50/month (varies with usage)

## Troubleshooting

### Validation Errors

```bash
sam validate --lint
```

### Deployment Failures

Check CloudFormation events:

```bash
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --max-items 10
```

### Stack Stuck in UPDATE_ROLLBACK_FAILED

```bash
aws cloudformation continue-update-rollback \
  --stack-name bayon-coagent-development
```

### S3 Bucket Not Empty Error

The destroy script handles this, but manually:

```bash
aws s3 rm s3://bucket-name --recursive
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths:
      - "template.yaml"
      - "samconfig.toml"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/setup-sam@v2
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: sam deploy --config-env production --no-confirm-changeset
```

## Comparison: SAM vs CDK

### SAM Advantages

- ✅ Simpler syntax (YAML/JSON)
- ✅ Built-in local testing
- ✅ Faster deployments
- ✅ Less code to maintain
- ✅ Better for serverless-first apps

### CDK Advantages

- ✅ Full programming language (TypeScript)
- ✅ Better for complex logic
- ✅ More reusable constructs
- ✅ Type safety

For this project, SAM is recommended because:

1. Infrastructure is relatively straightforward
2. Serverless-first architecture
3. Simpler to maintain
4. Faster iteration

## Migration from CDK

If you previously used CDK:

1. The infrastructure is equivalent
2. All resources are the same
3. Outputs have the same names
4. No application code changes needed

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [SAM CLI Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [SAM Template Specification](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html)
- [CloudFormation Resource Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)

## Support

For issues:

1. Check SAM CLI logs
2. Review CloudFormation events
3. Check CloudWatch logs
4. Consult AWS documentation
