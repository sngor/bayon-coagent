# Deployment Guide

## Overview

This guide covers deploying Bayon CoAgent to AWS using AWS SAM (Serverless Application Model) for infrastructure and AWS Amplify for the frontend application.

## Prerequisites

### Required Tools

```bash
# AWS CLI
aws --version  # Should be v2.x

# AWS SAM CLI
sam --version  # Should be v1.x

# Node.js and npm
node --version  # Should be v18+
npm --version

# Docker (for local testing)
docker --version
```

### AWS Account Setup

1. **AWS Account** with appropriate permissions
2. **IAM User** with deployment permissions
3. **AWS CLI** configured with credentials
4. **Domain** (optional, for custom domain)

### Required AWS Permissions

Your deployment user needs these permissions:
- CloudFormation (full access)
- Lambda (full access)
- DynamoDB (full access)
- S3 (full access)
- Cognito (full access)
- EventBridge (full access)
- CloudWatch (full access)
- IAM (limited - for role creation)

## Environment Setup

### 1. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### 2. Set Up Environment Variables

Create environment-specific configuration files:

```bash
# Development environment
cp .env.example .env.development

# Production environment
cp .env.example .env.production
```

### 3. Configure SAM

```bash
# Initialize SAM configuration
sam init

# Or use existing samconfig.toml
```

## Infrastructure Deployment

### 1. Validate Templates

```bash
# Validate SAM template
npm run sam:validate

# Check for template issues
sam validate --template template.yaml
```

### 2. Deploy Infrastructure

#### Development Environment

```bash
# Deploy to development
npm run sam:deploy:dev

# Or manually
sam deploy \
  --config-env development \
  --parameter-overrides \
    Environment=development \
    DomainName=dev.bayoncoagent.com
```

#### Production Environment

```bash
# Deploy to production
npm run sam:deploy:prod

# Or manually
sam deploy \
  --config-env production \
  --parameter-overrides \
    Environment=production \
    DomainName=bayoncoagent.com
```

### 3. Verify Deployment

```bash
# Get stack outputs
npm run sam:outputs

# Test API endpoints
npm run test:api

# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name bayon-coagent-prod
```

## Application Deployment

### 1. Build Application

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Verify build
npm run start
```

### 2. Deploy to Amplify

#### Automatic Deployment (Recommended)

```bash
# Deploy via script
npm run deploy:amplify

# Or use Amplify CLI
amplify publish
```

#### Manual Deployment

1. **Create Amplify App** in AWS Console
2. **Connect Repository** (GitHub/GitLab)
3. **Configure Build Settings**:

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

4. **Set Environment Variables** in Amplify Console
5. **Deploy Application**

### 3. Configure Environment Variables

Set these in Amplify Console:

```bash
# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://bayoncoagent.com

# AWS Configuration (from SAM outputs)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-prod
S3_BUCKET_NAME=bayon-coagent-prod-bucket

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# External APIs
TAVILY_API_KEY=your-tavily-api-key
NEWS_API_KEY=your-news-api-key
BRIDGE_API_KEY=your-bridge-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://bayoncoagent.com/api/oauth/google/callback

# Stripe (if using)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Secrets Management

### 1. AWS Secrets Manager

Store sensitive configuration in AWS Secrets Manager:

```bash
# Create secrets
aws secretsmanager create-secret \
  --name "bayon-coagent/prod/api-keys" \
  --description "API keys for production" \
  --secret-string '{
    "TAVILY_API_KEY": "your-key",
    "NEWS_API_KEY": "your-key",
    "GOOGLE_CLIENT_SECRET": "your-secret"
  }'

# Update secrets
aws secretsmanager update-secret \
  --secret-id "bayon-coagent/prod/api-keys" \
  --secret-string '{
    "TAVILY_API_KEY": "updated-key"
  }'
```

### 2. Environment-Specific Secrets

```bash
# Development secrets
aws secretsmanager create-secret \
  --name "bayon-coagent/dev/api-keys" \
  --secret-string '{"TAVILY_API_KEY": "dev-key"}'

# Production secrets
aws secretsmanager create-secret \
  --name "bayon-coagent/prod/api-keys" \
  --secret-string '{"TAVILY_API_KEY": "prod-key"}'
```

## Domain Configuration

### 1. Custom Domain Setup

```bash
# Create certificate (if not exists)
aws acm request-certificate \
  --domain-name bayoncoagent.com \
  --subject-alternative-names "*.bayoncoagent.com" \
  --validation-method DNS

# Configure domain in Amplify
aws amplify create-domain-association \
  --app-id your-app-id \
  --domain-name bayoncoagent.com \
  --sub-domain-settings prefix=www,branchName=main
```

### 2. DNS Configuration

Update your DNS provider with:
- **A Record**: Point to Amplify app
- **CNAME**: For www subdomain
- **Certificate Validation**: DNS validation records

## Monitoring Setup

### 1. CloudWatch Alarms

```bash
# Create alarms for key metrics
aws cloudwatch put-metric-alarm \
  --alarm-name "BayonCoAgent-HighErrorRate" \
  --alarm-description "High error rate in Lambda functions" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### 2. Log Groups

```bash
# Set log retention
aws logs put-retention-policy \
  --log-group-name /aws/lambda/bayon-coagent-content-generator \
  --retention-in-days 30
```

### 3. X-Ray Tracing

Enable X-Ray tracing in SAM template:

```yaml
Globals:
  Function:
    Tracing: Active
    Environment:
      Variables:
        _X_AMZN_TRACE_ID: !Ref AWS::NoValue
```

## Deployment Verification

### 1. Health Checks

```bash
# Test API endpoints
curl https://bayoncoagent.com/api/health

# Test authentication
curl -X POST https://bayoncoagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Test AI generation
curl -X POST https://bayoncoagent.com/api/content/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "blog", "topic": "Real Estate Market"}'
```

### 2. Performance Testing

```bash
# Run Lighthouse CI
npm run lighthouse:ci

# Load testing (optional)
artillery run load-test.yml
```

### 3. Security Scanning

```bash
# Dependency audit
npm audit

# Security scanning
npm run security:scan
```

## Rollback Procedures

### 1. Application Rollback

```bash
# Rollback Amplify deployment
aws amplify start-job \
  --app-id your-app-id \
  --branch-name main \
  --job-type RELEASE \
  --job-id previous-job-id
```

### 2. Infrastructure Rollback

```bash
# Rollback SAM deployment
sam deploy \
  --config-env production \
  --parameter-overrides \
    Environment=production \
    Version=previous-version

# Or use CloudFormation
aws cloudformation cancel-update-stack \
  --stack-name bayon-coagent-prod
```

### 3. Database Rollback

```bash
# Restore DynamoDB from backup
aws dynamodb restore-table-from-backup \
  --target-table-name BayonCoAgent-prod \
  --backup-arn arn:aws:dynamodb:region:account:table/BayonCoAgent-prod/backup/backup-id
```

## Troubleshooting

### Common Issues

#### 1. SAM Deployment Failures

```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-prod

# Check SAM logs
sam logs -n ContentGeneratorFunction --stack-name bayon-coagent-prod

# Validate template
sam validate --template template.yaml
```

#### 2. Amplify Build Failures

```bash
# Check build logs in Amplify Console
# Common issues:
# - Missing environment variables
# - Build timeout
# - Memory issues
# - Dependency conflicts

# Fix build settings
amplify configure project
```

#### 3. Permission Issues

```bash
# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::account:user/deployment-user \
  --action-names dynamodb:PutItem \
  --resource-arns arn:aws:dynamodb:region:account:table/BayonCoAgent-prod

# Update IAM policies if needed
```

#### 4. Environment Variable Issues

```bash
# Verify environment variables
aws amplify get-app --app-id your-app-id
aws lambda get-function-configuration --function-name function-name

# Update if needed
aws amplify update-app --app-id your-app-id --environment-variables key=value
```

### Performance Issues

#### 1. Cold Start Optimization

```yaml
# Increase memory for faster cold starts
ContentGeneratorFunction:
  Type: AWS::Serverless::Function
  Properties:
    MemorySize: 1024
    ProvisionedConcurrencyConfig:
      ProvisionedConcurrencyLevel: 2
```

#### 2. Database Performance

```bash
# Monitor DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=BayonCoAgent-prod \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## Maintenance

### 1. Regular Updates

```bash
# Update dependencies
npm update

# Update SAM CLI
pip install --upgrade aws-sam-cli

# Update AWS CLI
pip install --upgrade awscli
```

### 2. Backup Strategy

```bash
# Enable DynamoDB point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name BayonCoAgent-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Create manual backup
aws dynamodb create-backup \
  --table-name BayonCoAgent-prod \
  --backup-name BayonCoAgent-prod-$(date +%Y%m%d)
```

### 3. Cost Optimization

```bash
# Monitor costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Set up billing alerts
aws budgets create-budget \
  --account-id your-account-id \
  --budget file://budget.json
```

## Security Checklist

### Pre-Deployment

- [ ] All secrets stored in AWS Secrets Manager
- [ ] Environment variables configured correctly
- [ ] IAM permissions follow least privilege
- [ ] SSL/TLS certificates configured
- [ ] Security headers implemented
- [ ] Input validation in place
- [ ] Rate limiting configured

### Post-Deployment

- [ ] Security scanning completed
- [ ] Penetration testing performed
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested
- [ ] Incident response plan updated
- [ ] Documentation updated
- [ ] Team training completed

## Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration, e2e)
- [ ] Performance testing completed
- [ ] Security scanning passed
- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] Backup strategy in place
- [ ] Rollback plan prepared

### Deployment

- [ ] Infrastructure deployed successfully
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Performance metrics baseline established

### Post-Deployment

- [ ] Smoke tests completed
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] User acceptance testing
- [ ] Documentation updated
- [ ] Team notified
- [ ] Incident response ready

This deployment guide provides comprehensive instructions for deploying Bayon CoAgent to production. Follow the checklist and procedures to ensure a successful, secure, and reliable deployment.