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
