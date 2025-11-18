# Bayon CoAgent AWS Infrastructure

This directory contains the AWS CDK Infrastructure as Code (IaC) for the Bayon CoAgent application.

## Overview

The infrastructure is organized into the following stacks:

- **CognitoStack**: User authentication and identity management
- **DynamoDBStack**: NoSQL database with single-table design
- **S3Stack**: Object storage for files and assets
- **IAMStack**: IAM roles and policies for secure access
- **MonitoringStack**: CloudWatch dashboards and alarms

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`
- An AWS account with appropriate permissions

## Quick Start

### 1. Install Dependencies

```bash
cd infrastructure
npm install
```

### 2. Configure AWS Credentials

```bash
aws configure --profile bayon-coagent
```

Or set environment variables:

```bash
export AWS_PROFILE=bayon-coagent
export AWS_REGION=us-east-1
```

### 3. Bootstrap CDK (First Time Only)

```bash
npm run bootstrap
```

### 4. Deploy Infrastructure

For development:

```bash
npm run deploy:dev
```

For production:

```bash
npm run deploy:prod
```

Or use the deployment script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh development
```

### 5. Update Environment Variables

After deployment, update your application's `.env` file with the output values:

```bash
chmod +x scripts/update-env.sh
./scripts/update-env.sh development
```

## Stack Details

### Cognito Stack

Creates:

- User Pool for authentication
- User Pool Client for web application
- Identity Pool for AWS credentials
- IAM roles for authenticated users

**Outputs:**

- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito Client ID
- `IdentityPoolId`: Cognito Identity Pool ID
- `AuthenticatedRoleArn`: IAM role for authenticated users

### DynamoDB Stack

Creates:

- Single DynamoDB table with composite key (PK, SK)
- Global Secondary Indexes:
  - GSI1: For alternate access patterns
  - EntityTypeIndex: For querying by entity type
  - UserIndex: For user-scoped queries
- DynamoDB Streams enabled for real-time updates
- Point-in-time recovery (production only)

**Outputs:**

- `TableName`: DynamoDB table name
- `TableArn`: DynamoDB table ARN
- `TableStreamArn`: DynamoDB stream ARN

### S3 Stack

Creates:

- Storage bucket with encryption
- CORS configuration for browser uploads
- Lifecycle policies for cost optimization
- CloudFront distribution (production only)
- Versioning enabled (production only)

**Outputs:**

- `StorageBucketName`: S3 bucket name
- `StorageBucketArn`: S3 bucket ARN
- `DistributionDomainName`: CloudFront domain (production)
- `DistributionId`: CloudFront distribution ID (production)

### IAM Stack

Creates:

- Application role for Lambda/ECS/Amplify
- Bedrock access role for AI operations
- User-scoped policy for authenticated users
- Permissions for all AWS services

**Outputs:**

- `ApplicationRoleArn`: Application role ARN
- `BedrockAccessRoleArn`: Bedrock role ARN
- `UserScopedPolicyArn`: User policy ARN

### Monitoring Stack

Creates:

- CloudWatch Dashboard with metrics for:
  - Authentication activity
  - DynamoDB operations
  - S3 requests
  - Bedrock invocations
- CloudWatch Alarms for:
  - High authentication failures
  - DynamoDB throttling
  - S3 errors
  - Bedrock throttling and latency
- SNS topic for alarm notifications

**Outputs:**

- `DashboardURL`: CloudWatch dashboard URL
- `AlarmTopicArn`: SNS topic for alarms

## Available Scripts

```bash
# Build TypeScript
npm run build

# Watch for changes
npm run watch

# Synthesize CloudFormation templates
npm run synth

# Show differences
npm run diff

# Deploy all stacks
npm run deploy

# Deploy to specific environment
npm run deploy:dev
npm run deploy:prod

# Destroy all stacks
npm run destroy

# Bootstrap CDK
npm run bootstrap
```

## Environment Configuration

The infrastructure supports multiple environments through CDK context:

- `development`: Development environment with relaxed settings
- `production`: Production environment with enhanced security and durability

Specify environment during deployment:

```bash
cdk deploy --all --context environment=production
```

## Cost Optimization

### Development Environment

- DynamoDB: Pay-per-request billing
- S3: Standard storage with lifecycle policies
- No CloudFront distribution
- No point-in-time recovery
- Resources can be destroyed without retention

### Production Environment

- DynamoDB: Pay-per-request with point-in-time recovery
- S3: Versioning enabled with lifecycle transitions to IA
- CloudFront distribution for global delivery
- Resource retention policies enabled
- Enhanced monitoring and alarms

## Security Best Practices

1. **Least Privilege**: IAM roles follow least privilege principle
2. **Encryption**: All data encrypted at rest and in transit
3. **User Isolation**: User-scoped policies prevent cross-user access
4. **MFA**: Multi-factor authentication enabled for Cognito
5. **Monitoring**: CloudWatch alarms for security events

## Monitoring and Alarms

### Default Alarms

1. **Authentication Failures**: Triggers when > 10 failures in 10 minutes
2. **DynamoDB Throttling**: Triggers when requests are throttled
3. **S3 Errors**: Triggers when > 5 5xx errors in 10 minutes
4. **Bedrock Throttling**: Triggers when > 3 throttles in 10 minutes
5. **Bedrock Latency**: Triggers when latency > 30 seconds

### Email Notifications

To receive alarm notifications, update the `alarmEmail` parameter in `bin/app.ts`:

```typescript
const monitoringStack = new MonitoringStack(app, `${stackPrefix}-Monitoring`, {
  // ... other props
  alarmEmail: "your-email@example.com",
});
```

## Troubleshooting

### Bootstrap Errors

If you encounter bootstrap errors:

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION --profile your-profile
```

### Permission Errors

Ensure your AWS credentials have the following permissions:

- CloudFormation full access
- IAM role creation
- Service-specific permissions (Cognito, DynamoDB, S3, etc.)

### Stack Update Failures

If a stack update fails:

1. Check CloudFormation console for detailed error
2. Review the stack events
3. Fix the issue and redeploy
4. If needed, manually delete failed resources

### Destroying Stacks

To destroy all infrastructure:

```bash
./scripts/destroy.sh development
```

**Warning**: This will delete all data. Use with caution!

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths:
      - "infrastructure/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: |
          cd infrastructure
          npm install
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy
        run: |
          cd infrastructure
          npm run deploy:prod
```

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review CloudFormation stack events
3. Check CloudWatch logs
4. Contact the development team
