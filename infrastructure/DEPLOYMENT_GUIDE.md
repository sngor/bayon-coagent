# Bayon CoAgent Infrastructure Deployment Guide

This guide walks you through deploying the Bayon CoAgent infrastructure to AWS using CDK.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

1. **Node.js and npm**

   ```bash
   node --version  # Should be 18.x or higher
   npm --version
   ```

2. **AWS CLI**

   ```bash
   aws --version
   ```

   Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

3. **AWS CDK CLI**
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

### AWS Account Setup

1. **Create an AWS Account** (if you don't have one)

   - Go to https://aws.amazon.com/
   - Sign up for a new account

2. **Create an IAM User** with the following permissions:

   - CloudFormation full access
   - IAM role creation
   - Cognito full access
   - DynamoDB full access
   - S3 full access
   - CloudWatch full access
   - SNS full access

3. **Configure AWS CLI**

   ```bash
   aws configure --profile bayon-coagent
   ```

   Enter:

   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `us-east-1`
   - Default output format: `json`

## Initial Setup

### 1. Navigate to Infrastructure Directory

```bash
cd infrastructure
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and update values:

```bash
AWS_PROFILE=bayon-coagent
AWS_REGION=us-east-1
ENVIRONMENT=development
ALARM_EMAIL=your-email@example.com  # Optional
```

### 4. Bootstrap CDK (First Time Only)

This creates the necessary S3 bucket and IAM roles for CDK:

```bash
export AWS_PROFILE=bayon-coagent
npm run bootstrap
```

Or manually:

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1 --profile bayon-coagent
```

## Development Deployment

### Step 1: Build the Project

```bash
npm run build
```

### Step 2: Review Changes

See what will be deployed:

```bash
npm run synth
npm run diff
```

### Step 3: Deploy

Using npm script:

```bash
npm run deploy:dev
```

Or using the deployment script:

```bash
./scripts/deploy.sh development
```

Or manually:

```bash
cdk deploy --all --context environment=development --profile bayon-coagent
```

### Step 4: Save Outputs

The deployment will create an `outputs.json` file with all the resource IDs and ARNs.

### Step 5: Update Application Configuration

Run the update script:

```bash
./scripts/update-env.sh development
```

This creates a `.env.development` file with all the necessary values.

Copy to your application:

```bash
cp .env.development ../.env.local
```

## Production Deployment

### Important Considerations

Before deploying to production:

1. **Review Security Settings**

   - Ensure MFA is enabled
   - Review IAM policies
   - Check CORS configurations
   - Verify encryption settings

2. **Backup Strategy**

   - Point-in-time recovery is enabled for DynamoDB
   - S3 versioning is enabled
   - Consider additional backup solutions

3. **Cost Estimation**
   - Review the AWS Pricing Calculator
   - Set up billing alarms
   - Monitor costs regularly

### Deployment Steps

1. **Update Configuration**

   Edit `bin/app.ts` to update production settings:

   - Domain names
   - OAuth callback URLs
   - Alarm email addresses

2. **Deploy to Production**

   ```bash
   npm run deploy:prod
   ```

   Or:

   ```bash
   ./scripts/deploy.sh production
   ```

3. **Verify Deployment**

   Check CloudFormation console:

   ```
   https://console.aws.amazon.com/cloudformation
   ```

4. **Update Production Environment**

   ```bash
   ./scripts/update-env.sh production
   cp .env.production ../.env.production
   ```

5. **Test Production Deployment**

   - Test authentication flow
   - Test database operations
   - Test file uploads
   - Test AI features
   - Verify monitoring dashboards

## Post-Deployment Configuration

### 1. Configure Cognito

1. **Set up Email Verification**

   - Go to Cognito console
   - Configure SES for production email sending
   - Verify email domain

2. **Configure OAuth Providers** (if needed)
   - Add Google OAuth credentials
   - Configure callback URLs

### 2. Configure CloudWatch Alarms

1. **Subscribe to SNS Topic**

   - Check your email for SNS subscription confirmation
   - Click the confirmation link

2. **Test Alarms**
   - Manually trigger a test alarm
   - Verify you receive notifications

### 3. Set Up Application

1. **Update Application Code**

   Update `src/aws/config.ts` to use production values:

   ```typescript
   export function getAWSConfig(): AWSConfig {
     return {
       region: process.env.AWS_REGION || "us-east-1",
       cognito: {
         userPoolId: process.env.COGNITO_USER_POOL_ID!,
         clientId: process.env.COGNITO_CLIENT_ID!,
       },
       // ... other config
     };
   }
   ```

2. **Deploy Application**

   Deploy your Next.js application to:

   - AWS Amplify Hosting
   - Vercel
   - AWS Lambda (using SST or similar)
   - ECS/Fargate

### 4. Configure DNS (Production Only)

1. **Set up Custom Domain**

   - Register domain or use existing
   - Create Route 53 hosted zone
   - Update CloudFront distribution with custom domain
   - Add SSL certificate via ACM

2. **Update OAuth Callbacks**
   - Update Cognito callback URLs
   - Update Google OAuth settings

## Monitoring and Maintenance

### CloudWatch Dashboard

Access your dashboard:

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BayonCoAgent-{environment}
```

### Key Metrics to Monitor

1. **Authentication**

   - Sign-in success/failure rates
   - User registration trends

2. **Database**

   - Read/write capacity consumption
   - Throttling events
   - Latency

3. **Storage**

   - Request rates
   - Error rates
   - Storage usage

4. **AI (Bedrock)**
   - Invocation counts
   - Throttling
   - Latency
   - Costs

### Regular Maintenance Tasks

1. **Weekly**

   - Review CloudWatch dashboards
   - Check alarm history
   - Review costs

2. **Monthly**

   - Review and optimize DynamoDB indexes
   - Clean up unused S3 objects
   - Review IAM permissions
   - Update dependencies

3. **Quarterly**
   - Review and update security policies
   - Conduct cost optimization review
   - Update disaster recovery procedures

## Troubleshooting

### Common Issues

#### 1. Bootstrap Failure

**Error**: "Unable to resolve AWS account to use"

**Solution**:

```bash
export AWS_PROFILE=bayon-coagent
export AWS_REGION=us-east-1
cdk bootstrap
```

#### 2. Deployment Timeout

**Error**: Stack deployment times out

**Solution**:

- Check CloudFormation console for specific error
- Increase timeout in CDK configuration
- Check service quotas

#### 3. Permission Denied

**Error**: "User is not authorized to perform..."

**Solution**:

- Verify IAM user has necessary permissions
- Check AWS credentials are correct
- Ensure MFA token is valid (if required)

#### 4. Resource Already Exists

**Error**: "Resource already exists"

**Solution**:

- Check if resources were created manually
- Import existing resources into CDK
- Or delete existing resources and redeploy

#### 5. Stack Rollback

**Error**: Stack creation rolled back

**Solution**:

1. Check CloudFormation events for root cause
2. Fix the issue in code
3. Delete the failed stack
4. Redeploy

### Getting Help

1. **Check CloudFormation Events**

   ```bash
   aws cloudformation describe-stack-events \
     --stack-name BayonCoAgent-development-Cognito \
     --profile bayon-coagent
   ```

2. **Check CloudWatch Logs**

   - Go to CloudWatch Logs console
   - Look for error messages

3. **CDK Debug Mode**
   ```bash
   cdk deploy --all --debug
   ```

## Cleanup

### Development Environment

To destroy all development resources:

```bash
./scripts/destroy.sh development
```

### Production Environment

**WARNING**: This will delete all data!

```bash
./scripts/destroy.sh production
```

You'll need to type `DELETE PRODUCTION` to confirm.

## Next Steps

After successful deployment:

1. ✅ Configure your application with the output values
2. ✅ Test all features in development
3. ✅ Set up CI/CD pipeline
4. ✅ Configure monitoring and alerting
5. ✅ Document your deployment process
6. ✅ Train your team on AWS console access
7. ✅ Set up backup and disaster recovery procedures

## Additional Resources

- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [AWS Cost Optimization](https://aws.amazon.com/pricing/cost-optimization/)

## Support

For issues or questions:

- Check this guide first
- Review AWS documentation
- Check CloudFormation events
- Contact your AWS support team
