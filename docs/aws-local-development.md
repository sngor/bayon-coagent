# AWS Local Development Quick Start

This guide provides a quick reference for working with AWS services locally using LocalStack.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed
- AWS CLI (optional, for manual testing)

## Quick Start

### 1. Verify Setup

```bash
npm run verify:setup
```

This will check that all required components are installed and configured.

### 2. Start LocalStack

```bash
npm run localstack:start
```

This starts LocalStack in a Docker container, providing local emulation of:

- AWS Cognito (authentication)
- Amazon DynamoDB (database)
- Amazon S3 (file storage)

### 3. Initialize AWS Resources

```bash
npm run localstack:init
```

This creates the necessary AWS resources locally:

- DynamoDB table: `BayonCoAgent-local`
- S3 bucket: `bayon-coagent-local`
- Cognito User Pool and Client

**Important**: Save the Cognito User Pool ID and Client ID from the output and update your `.env.local` file.

### 4. Start the Application

```bash
npm run dev
```

The application will automatically connect to LocalStack services when `USE_LOCAL_AWS=true` in `.env.local`.

## Useful Commands

### View LocalStack Logs

```bash
npm run localstack:logs
```

### Stop LocalStack

```bash
npm run localstack:stop
```

### Reset LocalStack (Delete All Data)

```bash
npm run localstack:stop
rm -rf localstack-data
npm run localstack:start
npm run localstack:init
```

## Environment Configuration

The application uses `.env.local` for local development. Key variables:

```bash
# Enable local AWS services
USE_LOCAL_AWS=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Service Configuration
COGNITO_USER_POOL_ID=<from init script>
COGNITO_CLIENT_ID=<from init script>
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local
```

## How It Works

The `src/aws/config.ts` module automatically detects the environment:

```typescript
import { getConfig } from "@/aws/config";

const config = getConfig();
console.log(config.environment); // 'local' when USE_LOCAL_AWS=true
console.log(config.dynamodb.endpoint); // 'http://localhost:4566'
```

When `USE_LOCAL_AWS=true`:

- All AWS SDK clients connect to `http://localhost:4566`
- Test credentials are used
- Data is stored locally in the `localstack-data` directory

When `USE_LOCAL_AWS=false` or in production:

- AWS SDK clients connect to real AWS services
- Production credentials are used
- Data is stored in AWS cloud

## Background Services

### Lambda Functions

The application includes several Lambda functions for background processing:

- **Trial Notifications**: Daily automated trial expiry notifications
- **Market Intelligence**: Scheduled market analysis and alerts
- **Content Processing**: Background AI content generation
- **Subscription Management**: Stripe event processing

**Local Development**: Lambda functions run in AWS (not LocalStack) even during local development, as they require:
- AWS Bedrock for AI processing
- AWS SES for email delivery
- Complex scheduling via EventBridge

**Testing**: Use the test scripts to verify Lambda function behavior:

```bash
# Test trial notifications
npm run test:trial-notifications

# Test market intelligence alerts
npm run test:market-alerts
```

## Troubleshooting

### LocalStack won't start

1. Check if Docker is running: `docker ps`
2. Check if port 4566 is available: `lsof -i :4566`
3. View Docker logs: `docker logs bayon-localstack`

### Can't connect to LocalStack

1. Verify LocalStack is running: `docker ps | grep localstack`
2. Check the health endpoint: `curl http://localhost:4566/_localstack/health`
3. Ensure `USE_LOCAL_AWS=true` in `.env.local`

### "Cannot read properties of undefined (reading 'accessKeyId')" Error

This error occurs when AWS service clients try to access credentials that are `undefined`. This is expected behavior in production environments where AWS SDK should use the default credential chain (IAM roles, CLI credentials, etc.).

**Root Cause**: The `getAWSCredentials()` function returns `undefined` when:
- Not in local environment (`USE_LOCAL_AWS !== 'true'`)
- No explicit AWS credentials are set in environment variables
- AWS SDK should use default credential chain

**Solution**: Always check if credentials exist before accessing properties:

```typescript
// ❌ Wrong - causes error when credentials is undefined
if (credentials.accessKeyId && credentials.secretAccessKey) {
    clientConfig.credentials = credentials;
}

// ✅ Correct - safe null checking
if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
    clientConfig.credentials = credentials;
}
```

**Fixed Files**: This pattern has been corrected in all AWS service clients throughout the codebase. See `CREDENTIALS_ERROR_FIX.md` for complete details.

### Resources not found

Run the initialization script again:

```bash
npm run localstack:init
```

### Data persistence issues

LocalStack data is stored in `localstack-data/`. To reset:

```bash
npm run localstack:stop
rm -rf localstack-data
npm run localstack:start
npm run localstack:init
```

## Testing AWS Services Manually

You can use the AWS CLI to interact with LocalStack directly:

### List DynamoDB Tables

```bash
aws dynamodb list-tables \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

### List S3 Buckets

```bash
aws s3 ls --endpoint-url http://localhost:4566
```

### List Cognito User Pools

```bash
aws cognito-idp list-user-pools \
  --max-results 10 \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

## Advanced LocalStack Usage

### Accessing LocalStack Services Directly

You can interact with LocalStack services using the AWS CLI:

#### DynamoDB Operations

```bash
# Create a test item
aws dynamodb put-item \
  --table-name BayonCoAgent-local \
  --item '{"PK":{"S":"USER#test123"},"SK":{"S":"PROFILE"},"Data":{"M":{"name":{"S":"Test User"}}}}' \
  --endpoint-url http://localhost:4566

# Query items
aws dynamodb query \
  --table-name BayonCoAgent-local \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"USER#test123"}}' \
  --endpoint-url http://localhost:4566

# Scan table
aws dynamodb scan \
  --table-name BayonCoAgent-local \
  --endpoint-url http://localhost:4566
```

#### S3 Operations

```bash
# Upload a file
aws s3 cp test.txt s3://bayon-coagent-local/test.txt \
  --endpoint-url http://localhost:4566

# List files
aws s3 ls s3://bayon-coagent-local/ \
  --endpoint-url http://localhost:4566

# Download a file
aws s3 cp s3://bayon-coagent-local/test.txt downloaded.txt \
  --endpoint-url http://localhost:4566
```

#### Cognito Operations

```bash
# Create a test user
aws cognito-idp admin-create-user \
  --user-pool-id <your-pool-id> \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com \
  --endpoint-url http://localhost:4566

# List users
aws cognito-idp list-users \
  --user-pool-id <your-pool-id> \
  --endpoint-url http://localhost:4566
```

### LocalStack Web UI

LocalStack Pro includes a web UI for easier management:

```bash
# Access at: http://localhost:4566/_localstack/health
curl http://localhost:4566/_localstack/health
```

### Debugging LocalStack

#### View Service Status

```bash
curl http://localhost:4566/_localstack/health | jq
```

#### View LocalStack Logs

```bash
# Follow logs in real-time
docker logs -f bayon-localstack

# View last 100 lines
docker logs --tail 100 bayon-localstack

# Search logs for errors
docker logs bayon-localstack 2>&1 | grep ERROR
```

#### Restart Specific Service

```bash
# Restart LocalStack container
docker restart bayon-localstack
```

### Data Persistence

LocalStack data is persisted in the `localstack-data` directory:

```
localstack-data/
├── dynamodb/
│   └── BayonCoAgent-local/
├── s3/
│   └── bayon-coagent-local/
└── cognito/
```

To backup your local data:

```bash
# Create backup
tar -czf localstack-backup.tar.gz localstack-data/

# Restore backup
tar -xzf localstack-backup.tar.gz
```

## Development Workflow

### Typical Development Session

1. **Start LocalStack**

   ```bash
   npm run localstack:start
   ```

2. **Verify Services**

   ```bash
   npm run verify:setup
   ```

3. **Start Application**

   ```bash
   npm run dev
   ```

4. **Make Changes**

   - Edit code
   - Test features
   - Check logs

5. **Stop Services**
   ```bash
   npm run localstack:stop
   ```

### Testing Different Scenarios

#### Test with Empty Database

```bash
# Reset LocalStack
npm run localstack:stop
rm -rf localstack-data
npm run localstack:start
npm run localstack:init
```

#### Test with Sample Data

```bash
# Create sample data script
node scripts/create-sample-data.js
```

#### Test Error Handling

```bash
# Stop DynamoDB to simulate errors
docker exec bayon-localstack pkill dynamodb

# Restart to recover
docker restart bayon-localstack
```

## Environment Switching

### Switch to Production AWS

Update `.env.local`:

```bash
# Disable LocalStack
USE_LOCAL_AWS=false

# Use production AWS
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=<production-pool-id>
COGNITO_CLIENT_ID=<production-client-id>
DYNAMODB_TABLE_NAME=BayonCoAgent-prod
S3_BUCKET_NAME=bayon-coagent-storage-prod
```

### Switch Back to LocalStack

```bash
# Enable LocalStack
USE_LOCAL_AWS=true

# Use local resources
COGNITO_USER_POOL_ID=<local-pool-id>
COGNITO_CLIENT_ID=<local-client-id>
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local
```

## Performance Considerations

### LocalStack Limitations

- **Slower than AWS**: LocalStack emulation is slower than real AWS services
- **Memory Usage**: Can consume significant memory with large datasets
- **Feature Parity**: Some AWS features may not be fully supported

### Optimization Tips

1. **Use Docker Resources Wisely**

   ```bash
   # Allocate more memory to Docker
   # Docker Desktop → Settings → Resources → Memory: 4GB+
   ```

2. **Limit Data Size**

   - Keep test datasets small
   - Clean up old data regularly

3. **Use Caching**
   - Implement application-level caching
   - Reduce redundant AWS calls

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Test with LocalStack

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      localstack:
        image: localstack/localstack
        ports:
          - 4566:4566
        env:
          SERVICES: dynamodb,s3,cognito-idp

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Initialize LocalStack
        run: npm run localstack:init

      - name: Run tests
        run: npm test
        env:
          USE_LOCAL_AWS: true
```

## Next Steps

- See [AWS_SETUP.md](../AWS_SETUP.md) for production deployment
- See [ARCHITECTURE.md](../ARCHITECTURE.md) for system architecture
- See [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) for data migration
- See task list in `.kiro/specs/aws-migration/tasks.md` for implementation progress

## Additional Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [LocalStack GitHub](https://github.com/localstack/localstack)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)

## Common LocalStack Commands Reference

```bash
# Start LocalStack
npm run localstack:start
docker-compose up -d

# Stop LocalStack
npm run localstack:stop
docker-compose down

# View logs
npm run localstack:logs
docker-compose logs -f localstack

# Initialize resources
npm run localstack:init

# Verify setup
npm run verify:setup

# Reset everything
npm run localstack:stop
rm -rf localstack-data
npm run localstack:start
npm run localstack:init

# Check health
curl http://localhost:4566/_localstack/health

# List running containers
docker ps

# Execute command in container
docker exec -it bayon-localstack bash
```
