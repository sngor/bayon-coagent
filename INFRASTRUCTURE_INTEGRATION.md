# Infrastructure Integration Guide

This guide explains how to integrate the AWS CDK infrastructure with the Bayon CoAgent application.

## Overview

The infrastructure is defined in the `infrastructure/` directory using AWS CDK. It creates all necessary AWS resources for the application to run in production.

## Quick Start

### 1. Deploy Infrastructure

```bash
# Install infrastructure dependencies
npm run infra:install

# Deploy to development
npm run infra:deploy:dev
```

### 2. Update Application Configuration

After deployment, the infrastructure outputs will be saved to `infrastructure/outputs.json`. Update your application's `.env.local` file:

```bash
cd infrastructure
./scripts/update-env.sh development
cp .env.development ../.env.local
```

### 3. Verify Configuration

Your `.env.local` should now contain:

```bash
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-development
S3_BUCKET_NAME=bayon-coagent-storage-development-123456789012
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Infrastructure Components

### 1. Authentication (Cognito)

The application uses AWS Cognito for authentication. The infrastructure creates:

- User Pool for user management
- User Pool Client for web application
- Identity Pool for AWS credentials

**Application Integration:**

- Uses `src/aws/auth/cognito-client.ts`
- Authentication hooks in `src/aws/auth/use-user.tsx`
- Provider in `src/aws/auth/auth-provider.tsx`

### 2. Database (DynamoDB)

Single-table design with three GSIs for efficient queries.

**Application Integration:**

- Client in `src/aws/dynamodb/client.ts`
- Repository in `src/aws/dynamodb/repository.ts`
- React hooks in `src/aws/dynamodb/hooks/`

### 3. Storage (S3)

File storage with CORS configured for browser uploads.

**Application Integration:**

- Client in `src/aws/s3/client.ts`
- Upload hooks in `src/hooks/use-s3-upload.ts`
- Components in `src/components/s3-file-upload.tsx`

### 4. AI (Bedrock)

Access to AWS Bedrock for AI features.

**Application Integration:**

- Client in `src/aws/bedrock/client.ts`
- Flows in `src/aws/bedrock/flows/`

### 5. Monitoring (CloudWatch)

Dashboard and alarms for monitoring application health.

**Access:**

- Dashboard URL in infrastructure outputs
- Alarms send notifications to configured email

## Environment-Specific Configuration

### Development

- Uses LocalStack for local development
- Relaxed security settings
- Resources can be destroyed without retention
- No CloudFront distribution

### Production

- Uses real AWS services
- Enhanced security (MFA, encryption)
- Resource retention policies
- CloudFront distribution for global delivery
- Point-in-time recovery for DynamoDB

## Deployment Workflow

### Initial Deployment

1. **Deploy Infrastructure**

   ```bash
   npm run infra:deploy:dev
   ```

2. **Update Application Config**

   ```bash
   cd infrastructure
   ./scripts/update-env.sh development
   ```

3. **Test Application**
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Review Configuration**

   - Update domain names in `infrastructure/bin/app.ts`
   - Update OAuth callbacks
   - Set alarm email

2. **Deploy Infrastructure**

   ```bash
   npm run infra:deploy:prod
   ```

3. **Update Production Config**

   ```bash
   cd infrastructure
   ./scripts/update-env.sh production
   ```

4. **Deploy Application**
   - Deploy to AWS Amplify, Vercel, or your hosting platform
   - Ensure environment variables are set

## Monitoring and Maintenance

### CloudWatch Dashboard

Access your dashboard to monitor:

- Authentication activity
- Database operations
- Storage usage
- AI invocations

### Alarms

Configure email notifications:

1. Edit `infrastructure/bin/app.ts`
2. Set `alarmEmail` parameter
3. Redeploy infrastructure
4. Confirm SNS subscription email

### Cost Monitoring

Set up billing alarms:

1. Go to AWS Billing Console
2. Create billing alarm
3. Set threshold (e.g., $50/month)
4. Configure SNS notification

## Troubleshooting

### Infrastructure Issues

**Problem:** Deployment fails

```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name BayonCoAgent-development-Cognito
```

**Problem:** Resources already exist

```bash
# Destroy and redeploy
npm run infra:destroy:dev
npm run infra:deploy:dev
```

### Application Issues

**Problem:** Cannot connect to AWS services

- Verify environment variables are set
- Check AWS credentials
- Verify IAM permissions

**Problem:** Authentication fails

- Verify Cognito User Pool ID and Client ID
- Check Cognito configuration in AWS Console
- Verify OAuth callback URLs

## Security Best Practices

1. **Never commit credentials**

   - Use environment variables
   - Use AWS IAM roles in production

2. **Use least privilege**

   - IAM roles have minimal permissions
   - User-scoped policies prevent cross-user access

3. **Enable MFA**

   - Configure MFA for Cognito users
   - Enable MFA for AWS Console access

4. **Monitor access**

   - Review CloudWatch logs regularly
   - Set up alarms for suspicious activity

5. **Encrypt data**
   - All data encrypted at rest
   - Use HTTPS for data in transit

## Next Steps

1. ✅ Deploy infrastructure to development
2. ✅ Update application configuration
3. ✅ Test all features locally
4. ✅ Set up CI/CD pipeline
5. ✅ Deploy to production
6. ✅ Configure monitoring and alerts
7. ✅ Document deployment process

## Additional Resources

- [Infrastructure README](infrastructure/README.md)
- [Deployment Guide](infrastructure/DEPLOYMENT_GUIDE.md)
- [Quick Reference](infrastructure/QUICK_REFERENCE.md)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
