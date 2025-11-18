# AWS Setup Guide

This guide explains how to set up and use AWS services for the Bayon CoAgent application in both local development and production environments.

## Local Development Setup

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- AWS CLI (optional, for testing)

### Starting LocalStack

LocalStack provides local emulation of AWS services for development and testing.

1. Start LocalStack services:

```bash
docker-compose up -d
```

2. Verify LocalStack is running:

```bash
docker ps
```

You should see the `bayon-localstack` container running on port 4566.

3. Check LocalStack logs:

```bash
docker-compose logs -f localstack
```

### Environment Configuration

The application uses `.env.local` for local development configuration. Key variables:

- `USE_LOCAL_AWS=true` - Enables local AWS service endpoints
- `AWS_REGION=us-east-1` - AWS region for services
- `AWS_ACCESS_KEY_ID=test` - Test credentials for LocalStack
- `AWS_SECRET_ACCESS_KEY=test` - Test credentials for LocalStack

### Initializing Local AWS Resources

After starting LocalStack, you'll need to create the necessary AWS resources locally:

#### Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name BayonCoAgent-local \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566
```

#### Create S3 Bucket

```bash
aws s3 mb s3://bayon-coagent-local \
  --endpoint-url http://localhost:4566
```

#### Create Cognito User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name bayon-local-pool \
  --endpoint-url http://localhost:4566
```

Note: Save the UserPoolId from the response and update `.env.local`

#### Create Cognito User Pool Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-name bayon-local-client \
  --endpoint-url http://localhost:4566
```

Note: Save the ClientId from the response and update `.env.local`

### Running the Application Locally

```bash
npm run dev
```

The application will connect to LocalStack services automatically when `USE_LOCAL_AWS=true`.

### Stopping LocalStack

```bash
docker-compose down
```

To remove all data:

```bash
docker-compose down -v
rm -rf localstack-data
```

## Production Setup

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with production credentials
- Infrastructure as Code tool (AWS CDK recommended)

### AWS Services Required

1. **AWS Cognito** - User authentication
2. **Amazon DynamoDB** - Database
3. **Amazon S3** - File storage
4. **AWS Bedrock** - AI/ML services
5. **AWS CloudWatch** - Logging and monitoring
6. **AWS Amplify/Lambda** - Application hosting

### Deployment Steps

1. Configure production environment variables in `.env.production`
2. Deploy infrastructure using AWS CDK (see task 18 in implementation plan)
3. Update environment variables with actual resource IDs
4. Deploy application to AWS Amplify or Lambda

### Environment Variables

Production environment variables should be stored securely:

- Use AWS Systems Manager Parameter Store for configuration
- Use AWS Secrets Manager for sensitive data (API keys, credentials)
- Never commit production credentials to version control

## Configuration Module

The `src/aws/config.ts` module automatically detects the environment and configures AWS service endpoints:

```typescript
import { getConfig } from "@/aws/config";

const config = getConfig();
console.log(config.environment); // 'local', 'development', or 'production'
console.log(config.dynamodb.endpoint); // 'http://localhost:4566' in local mode
```

## Troubleshooting

### LocalStack Connection Issues

If you can't connect to LocalStack:

1. Verify Docker is running: `docker ps`
2. Check LocalStack logs: `docker-compose logs localstack`
3. Ensure port 4566 is not in use: `lsof -i :4566`
4. Restart LocalStack: `docker-compose restart localstack`

### AWS SDK Errors

Common errors and solutions:

- **"Missing credentials"**: Ensure AWS credentials are set in environment variables
- **"Endpoint not found"**: Check that `USE_LOCAL_AWS` is set correctly
- **"Access Denied"**: Verify IAM permissions in production or LocalStack is running locally

### DynamoDB Issues

- **"Table not found"**: Create the table using the AWS CLI commands above
- **"Throughput exceeded"**: In production, check DynamoDB capacity settings

## AWS Service Details

### AWS Cognito

**Purpose**: User authentication and authorization

**Features Used**:

- User pools for user management
- JWT tokens for session management
- Email/password authentication
- Token refresh mechanism

**Local**: Emulated via LocalStack
**Production**: Real AWS Cognito User Pool

### Amazon DynamoDB

**Purpose**: NoSQL database for all application data

**Table Design**:

- Single table: `BayonCoAgent` (with environment suffix)
- Partition Key (PK): String - Primary identifier
- Sort Key (SK): String - Secondary identifier for hierarchical data
- GSI1: Global Secondary Index for alternate access patterns

**Features Used**:

- Single-table design pattern
- Composite keys (PK/SK)
- Query and Scan operations
- Batch operations for efficiency
- On-demand billing mode

**Local**: DynamoDB Local via LocalStack
**Production**: Amazon DynamoDB with on-demand capacity

### Amazon S3

**Purpose**: Object storage for user files and assets

**Bucket Structure**:

```
bayon-coagent-storage-{environment}/
├── users/
│   └── {userId}/
│       ├── profile.jpg
│       └── documents/
└── public/
    └── assets/
```

**Features Used**:

- Presigned URLs for secure uploads/downloads
- CORS configuration for browser access
- Lifecycle policies for cost optimization
- Server-side encryption (SSE-S3)

**Local**: S3 Local via LocalStack
**Production**: Amazon S3 bucket

### AWS Bedrock

**Purpose**: Managed AI service for content generation

**Model Used**: `anthropic.claude-3-5-sonnet-20241022-v2:0`

**Features Used**:

- Converse API for structured outputs
- Streaming responses for long content
- Zod schema validation
- Retry logic with exponential backoff

**Local**: Connects to real AWS Bedrock (requires AWS credentials)
**Production**: AWS Bedrock in configured region

### AWS CloudWatch

**Purpose**: Logging, monitoring, and alerting

**Features Used**:

- CloudWatch Logs for application logs
- CloudWatch Metrics for performance tracking
- CloudWatch Alarms for error alerting
- Custom dashboards for monitoring

**Local**: Console logging only
**Production**: Full CloudWatch integration

## Security Best Practices

### IAM Policies

Use least privilege principle for all IAM roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/BayonCoAgent-*"
    }
  ]
}
```

### Cognito Security

- Enable MFA for admin users
- Use secure password policies (min 8 chars, mixed case, numbers)
- Implement account lockout after failed attempts
- Use httpOnly cookies for token storage

### S3 Security

- Block public access by default
- Use presigned URLs with short expiration (15 minutes)
- Enable versioning for critical files
- Use bucket policies to restrict access

### DynamoDB Security

- Enable encryption at rest (default)
- Use VPC endpoints for private access
- Implement row-level security with IAM
- Enable point-in-time recovery

## Cost Optimization

### DynamoDB

- **On-Demand Mode**: Pay per request (good for variable workloads)
- **Provisioned Mode**: Reserved capacity (good for predictable workloads)
- **TTL**: Automatically delete expired items
- **Monitoring**: Track read/write capacity usage

**Estimated Cost**: $5-20/month for small to medium usage

### S3

- **Storage Class**: Use S3 Standard for active files
- **Lifecycle Policies**: Move old files to S3 Glacier
- **Intelligent-Tiering**: Automatic cost optimization
- **Monitoring**: Track storage usage and requests

**Estimated Cost**: $1-10/month for typical usage

### Bedrock

- **Pay per Token**: Charged based on input/output tokens
- **Caching**: Implement response caching to reduce API calls
- **Model Selection**: Use appropriate model for task complexity
- **Monitoring**: Track token usage and costs

**Estimated Cost**: $10-100/month depending on usage

### Cognito

- **Free Tier**: 50,000 MAUs (Monthly Active Users) free
- **Beyond Free Tier**: $0.0055 per MAU

**Estimated Cost**: Free for most small applications

### Total Estimated Monthly Cost

- **Development**: $0-5 (mostly free tier)
- **Small Production**: $20-50
- **Medium Production**: $50-200
- **Large Production**: $200+

## Monitoring and Observability

### CloudWatch Dashboards

Create custom dashboards to monitor:

- **Authentication Metrics**: Sign-in success/failure rates
- **Database Performance**: Query latency, throttled requests
- **AI Usage**: Bedrock invocations, token usage
- **Storage**: S3 upload/download rates
- **Errors**: Error rates by service

### CloudWatch Alarms

Set up alarms for:

- High error rates (> 5%)
- Slow response times (> 1 second p95)
- DynamoDB throttling
- Bedrock quota limits
- S3 upload failures

### Logging Strategy

**Local Development**:

```typescript
console.log("User authenticated:", userId);
```

**Production**:

```typescript
logger.info("User authenticated", {
  userId,
  timestamp: new Date().toISOString(),
  correlationId: req.headers["x-correlation-id"],
});
```

### Distributed Tracing

Use correlation IDs to trace requests across services:

```typescript
const correlationId = generateId();
await dynamodb.put({ ...item, correlationId });
await bedrock.invoke({ ...input, correlationId });
logger.info("Request completed", { correlationId });
```

## Performance Optimization

### DynamoDB

- Use single-table design to minimize queries
- Implement caching layer (Redis or in-memory)
- Use batch operations for multiple items
- Optimize GSI usage for common queries

### S3

- Use CloudFront CDN for static assets
- Implement multipart upload for large files
- Use S3 Transfer Acceleration for global users
- Set appropriate cache headers

### Bedrock

- Implement response caching for identical prompts
- Use streaming for long responses
- Consider batch processing for bulk operations
- Monitor token usage and optimize prompts

### Application

- Use React Server Components
- Implement code splitting
- Optimize bundle size
- Use static generation where possible

## Additional Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [Cognito Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/security-best-practices.html)
