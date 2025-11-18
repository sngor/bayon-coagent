# Deployment Guide - Bayon CoAgent AWS Migration

This guide covers deployment options for the Bayon CoAgent application after migrating to AWS services.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [AWS Amplify Hosting (Recommended)](#aws-amplify-hosting-recommended)
3. [Alternative: Vercel with AWS Backend](#alternative-vercel-with-aws-backend)
4. [Alternative: AWS Lambda + CloudFront](#alternative-aws-lambda--cloudfront)
5. [Alternative: AWS ECS Fargate](#alternative-aws-ecs-fargate)
6. [Environment Variables](#environment-variables)
7. [Custom Domain Setup](#custom-domain-setup)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Troubleshooting](#troubleshooting)

---

## Deployment Options

### Comparison Matrix

| Feature                | Amplify Hosting | Vercel     | Lambda@Edge | ECS Fargate |
| ---------------------- | --------------- | ---------- | ----------- | ----------- |
| **Ease of Setup**      | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐      | ⭐⭐        |
| **AWS Integration**    | ⭐⭐⭐⭐⭐      | ⭐⭐⭐     | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐  |
| **Cost (Low Traffic)** | ⭐⭐⭐⭐        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐      | ⭐⭐        |
| **Scalability**        | ⭐⭐⭐⭐        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐    |
| **Control**            | ⭐⭐⭐          | ⭐⭐⭐     | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐  |
| **CI/CD**              | ⭐⭐⭐⭐⭐      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐      | ⭐⭐⭐      |

**Recommendation**: Start with **AWS Amplify Hosting** for simplicity and native AWS integration. Consider alternatives if you need more control or have specific requirements.

---

## AWS Amplify Hosting (Recommended)

AWS Amplify Hosting provides the easiest deployment path with native AWS service integration.

### Prerequisites

1. AWS account with appropriate permissions
2. Infrastructure deployed (see `infrastructure/DEPLOYMENT_GUIDE.md`)
3. GitHub/GitLab/Bitbucket repository
4. AWS CLI installed and configured

### Step 1: Install Amplify CLI (Optional)

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Step 2: Create Amplify App via Console

1. **Navigate to AWS Amplify Console**

   - Go to https://console.aws.amazon.com/amplify/
   - Click "New app" → "Host web app"

2. **Connect Repository**

   - Select your Git provider (GitHub, GitLab, Bitbucket)
   - Authorize AWS Amplify to access your repository
   - Select the repository and branch (e.g., `main` or `production`)

3. **Configure Build Settings**

   - Amplify will auto-detect Next.js
   - Use the provided `amplify.yml` file (already in the repository)
   - Review and confirm build settings

4. **Configure Environment Variables**

   Add the following environment variables in Amplify Console:

   ```
   NODE_ENV=production
   AWS_REGION=us-east-1

   # Cognito (from infrastructure outputs)
   COGNITO_USER_POOL_ID=<from-cdk-output>
   COGNITO_CLIENT_ID=<from-cdk-output>

   # DynamoDB (from infrastructure outputs)
   DYNAMODB_TABLE_NAME=<from-cdk-output>

   # S3 (from infrastructure outputs)
   S3_BUCKET_NAME=<from-cdk-output>

   # Bedrock
   BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
   BEDROCK_REGION=us-east-1

   # Google OAuth
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   GOOGLE_REDIRECT_URI=https://<your-amplify-domain>/api/oauth/google/callback

   # External APIs
   BRIDGE_API_KEY=<your-bridge-api-key>
   NEWS_API_KEY=<your-news-api-key>
   ```

5. **Configure IAM Service Role**

   Amplify needs permissions to access AWS services:

   ```bash
   # Create a service role for Amplify
   aws iam create-role \
     --role-name AmplifyBayonCoAgentRole \
     --assume-role-policy-document '{
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": {"Service": "amplify.amazonaws.com"},
         "Action": "sts:AssumeRole"
       }]
     }'

   # Attach the application role policy (created by CDK)
   aws iam attach-role-policy \
     --role-name AmplifyBayonCoAgentRole \
     --policy-arn arn:aws:iam::<account-id>:policy/BayonCoAgent-ApplicationPolicy-<env>
   ```

   Then in Amplify Console:

   - Go to App settings → General
   - Edit "Service role"
   - Select `AmplifyBayonCoAgentRole`

6. **Deploy**
   - Click "Save and deploy"
   - Amplify will build and deploy your application
   - Monitor the build logs for any issues

### Step 3: Configure Custom Domain (Optional)

1. **Add Custom Domain**

   - In Amplify Console, go to "Domain management"
   - Click "Add domain"
   - Enter your domain name (e.g., `coagent.yourdomain.com`)

2. **DNS Configuration**

   - If using Route 53: Amplify will auto-configure
   - If using external DNS: Add the provided CNAME records

3. **SSL Certificate**
   - Amplify automatically provisions and manages SSL certificates
   - Certificate validation may take 15-30 minutes

### Step 4: Configure CloudFront Distribution

Amplify automatically creates a CloudFront distribution. To customize:

1. Go to CloudFront Console
2. Find the distribution created by Amplify
3. Edit settings as needed:
   - Cache behaviors
   - Custom error responses
   - Geographic restrictions

### Step 5: Test Deployment

```bash
# Test the deployment
curl https://<your-amplify-domain>

# Test authentication
curl https://<your-amplify-domain>/api/health

# Test with custom domain (if configured)
curl https://coagent.yourdomain.com
```

### Step 6: Set Up Continuous Deployment

Amplify automatically deploys on every push to the connected branch:

1. **Configure Branch Settings**

   - Go to App settings → Build settings
   - Configure branch-specific settings if needed
   - Enable/disable auto-build per branch

2. **Configure Build Notifications**

   - Go to Notifications
   - Add email or SNS topic for build notifications

3. **Configure Preview Deployments**
   - Enable pull request previews for testing
   - Each PR gets a unique preview URL

### Amplify CLI Deployment (Alternative)

If you prefer CLI-based deployment:

```bash
# Initialize Amplify in your project
amplify init

# Add hosting
amplify add hosting

# Select "Hosting with Amplify Console"
# Choose "Manual deployment"

# Deploy
amplify publish
```

### Monitoring Amplify Deployment

1. **Build Logs**

   - View in Amplify Console under each deployment
   - Check for build errors or warnings

2. **Access Logs**

   - Amplify automatically logs to CloudWatch
   - Go to CloudWatch → Log groups → `/aws/amplify/<app-id>`

3. **Metrics**
   - View in Amplify Console under "Monitoring"
   - Requests, data transfer, errors

---

## Alternative: Vercel with AWS Backend

If you prefer Vercel's deployment experience but want to use AWS backend services:

### Setup

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables**

   Create `vercel.json`:

   ```json
   {
     "env": {
       "NODE_ENV": "production",
       "AWS_REGION": "@aws-region",
       "COGNITO_USER_POOL_ID": "@cognito-user-pool-id",
       "COGNITO_CLIENT_ID": "@cognito-client-id",
       "DYNAMODB_TABLE_NAME": "@dynamodb-table-name",
       "S3_BUCKET_NAME": "@s3-bucket-name",
       "BEDROCK_MODEL_ID": "@bedrock-model-id",
       "BEDROCK_REGION": "@bedrock-region"
     }
   }
   ```

3. **Add Secrets**

   ```bash
   vercel secrets add aws-region us-east-1
   vercel secrets add cognito-user-pool-id <value>
   vercel secrets add cognito-client-id <value>
   # ... add all other secrets
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Considerations

- Vercel Edge Functions have limitations with AWS SDK
- May need to use Vercel Serverless Functions for AWS operations
- Additional cost for Vercel hosting
- Excellent developer experience and performance

---

## Alternative: AWS Lambda + CloudFront

For maximum control and AWS-native deployment:

### Architecture

```
CloudFront → Lambda@Edge → Next.js SSR
           → S3 → Static Assets
```

### Setup

This requires more manual configuration. See AWS documentation for:

- [Next.js on AWS Lambda](https://aws.amazon.com/blogs/compute/building-server-side-rendering-for-react-in-aws-lambda/)
- [Lambda@Edge with CloudFront](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html)

### Tools

- **Serverless Framework**: Simplifies Lambda deployment
- **SST (Serverless Stack)**: Purpose-built for Next.js on AWS
- **AWS SAM**: AWS-native serverless framework

### Example with SST

```bash
# Install SST
npm install -g sst

# Initialize SST
sst init

# Deploy
sst deploy --stage production
```

---

## Alternative: AWS ECS Fargate

For containerized deployment with full control:

### Prerequisites

1. Docker installed
2. ECR repository created
3. ECS cluster created

### Setup

1. **Create Dockerfile**

   ```dockerfile
   FROM node:20-alpine AS base

   # Install dependencies
   FROM base AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci

   # Build application
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Production image
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV=production

   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static

   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Build and Push to ECR**

   ```bash
   # Authenticate Docker to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   # Build image
   docker build -t bayon-coagent .

   # Tag image
   docker tag bayon-coagent:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/bayon-coagent:latest

   # Push to ECR
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bayon-coagent:latest
   ```

3. **Create ECS Task Definition**

   ```json
   {
     "family": "bayon-coagent",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "containerDefinitions": [
       {
         "name": "app",
         "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/bayon-coagent:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           { "name": "NODE_ENV", "value": "production" },
           { "name": "AWS_REGION", "value": "us-east-1" }
         ],
         "secrets": [
           {
             "name": "COGNITO_USER_POOL_ID",
             "valueFrom": "arn:aws:secretsmanager:..."
           }
         ]
       }
     ]
   }
   ```

4. **Create ECS Service**
   ```bash
   aws ecs create-service \
     --cluster bayon-coagent-cluster \
     --service-name bayon-coagent-service \
     --task-definition bayon-coagent \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

---

## Environment Variables

### Required Variables

All deployment options require these environment variables:

```bash
# Application
NODE_ENV=production

# AWS Configuration
AWS_REGION=us-east-1

# Cognito Authentication
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# DynamoDB Database
DYNAMODB_TABLE_NAME=BayonCoAgent-prod

# S3 Storage
S3_BUCKET_NAME=bayon-coagent-storage-prod

# Bedrock AI
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback

# External APIs
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
```

### Getting Infrastructure Values

After deploying infrastructure with CDK:

```bash
# Get all outputs
cd infrastructure
./scripts/update-env.sh production

# This creates .env.production with all values
cat .env.production
```

### Secrets Management

**For Amplify**: Use Amplify Console environment variables

**For Lambda/ECS**: Use AWS Secrets Manager or Systems Manager Parameter Store

```bash
# Store secret in Secrets Manager
aws secretsmanager create-secret \
  --name /bayon-coagent/prod/google-client-secret \
  --secret-string "your-secret-value"

# Store parameter in Parameter Store
aws ssm put-parameter \
  --name /bayon-coagent/prod/cognito-user-pool-id \
  --value "us-east-1_XXXXXXXXX" \
  --type String
```

---

## Custom Domain Setup

### Using Route 53

1. **Create Hosted Zone** (if not exists)

   ```bash
   aws route53 create-hosted-zone \
     --name yourdomain.com \
     --caller-reference $(date +%s)
   ```

2. **For Amplify**

   - Amplify Console handles DNS automatically
   - Just add domain in Amplify Console

3. **For CloudFront**
   ```bash
   # Create A record pointing to CloudFront
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z1234567890ABC \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "coagent.yourdomain.com",
           "Type": "A",
           "AliasTarget": {
             "HostedZoneId": "Z2FDTNDATAQYW2",
             "DNSName": "d1234567890.cloudfront.net",
             "EvaluateTargetHealth": false
           }
         }
       }]
     }'
   ```

### Using External DNS Provider

1. Get the CNAME or A record from your deployment
2. Add DNS record in your provider:
   - **Type**: CNAME or A
   - **Name**: coagent (or subdomain)
   - **Value**: Amplify/CloudFront domain
   - **TTL**: 300

---

## SSL/TLS Configuration

### Amplify

- SSL certificates are automatically provisioned and managed
- Uses AWS Certificate Manager (ACM)
- Automatic renewal

### CloudFront

1. **Request Certificate in ACM**

   ```bash
   aws acm request-certificate \
     --domain-name coagent.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Validate Certificate**

   - Add DNS validation records
   - Wait for validation (5-30 minutes)

3. **Attach to CloudFront**
   - Update CloudFront distribution
   - Select the ACM certificate
   - Configure SSL/TLS settings

---

## Monitoring and Logging

### CloudWatch Integration

All deployment options integrate with CloudWatch:

1. **Application Logs**

   - Amplify: `/aws/amplify/<app-id>`
   - Lambda: `/aws/lambda/<function-name>`
   - ECS: `/ecs/<cluster>/<service>`

2. **Access Logs**

   - CloudFront access logs to S3
   - ALB access logs (if using ECS)

3. **Metrics**
   - Request count
   - Error rates
   - Latency (p50, p95, p99)
   - Data transfer

### Custom Metrics

The application uses CloudWatch for custom metrics:

```typescript
// Already implemented in src/aws/logging/
import { logger } from "@/aws/logging";

logger.info("User action", { userId, action });
logger.error("Operation failed", { error, context });
```

### Alarms

Set up alarms for critical metrics:

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name bayon-coagent-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name Errors \
  --namespace AWS/Amplify \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## Troubleshooting

### Build Failures

**Issue**: Build fails in Amplify

**Solutions**:

1. Check build logs in Amplify Console
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check Node.js version compatibility

### Environment Variable Issues

**Issue**: Application can't connect to AWS services

**Solutions**:

1. Verify all required environment variables are set
2. Check IAM permissions for the service role
3. Verify infrastructure is deployed: `./infrastructure/scripts/verify-infrastructure.sh production`
4. Check CloudWatch logs for specific errors

### SSL Certificate Issues

**Issue**: SSL certificate not validating

**Solutions**:

1. Verify DNS records are correct
2. Wait 15-30 minutes for propagation
3. Check ACM console for validation status
4. Ensure domain ownership is verified

### Performance Issues

**Issue**: Slow page loads

**Solutions**:

1. Enable CloudFront caching
2. Optimize Next.js build (static generation)
3. Check DynamoDB query performance
4. Review Bedrock API latency
5. Enable compression in CloudFront

### Authentication Issues

**Issue**: Users can't log in

**Solutions**:

1. Verify Cognito User Pool is accessible
2. Check CORS configuration
3. Verify redirect URIs match
4. Check CloudWatch logs for auth errors
5. Test Cognito directly with AWS CLI

---

## Deployment Checklist

Before deploying to production:

- [ ] Infrastructure deployed and verified
- [ ] All environment variables configured
- [ ] IAM roles and policies configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate provisioned and validated
- [ ] CloudWatch alarms configured
- [ ] Backup and disaster recovery plan in place
- [ ] Monitoring dashboard created
- [ ] Load testing completed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## Next Steps

1. Choose your deployment option
2. Follow the setup guide for your chosen option
3. Configure environment variables
4. Deploy and test
5. Set up monitoring and alerts
6. Configure custom domain (optional)
7. Perform load testing
8. Go live!

---

## Support

For deployment issues:

1. Check CloudWatch logs
2. Review AWS service health dashboard
3. Consult AWS documentation
4. Contact AWS support (if needed)

For application issues:

1. Check application logs
2. Review error tracking
3. Test locally with production configuration
4. Review recent code changes

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
