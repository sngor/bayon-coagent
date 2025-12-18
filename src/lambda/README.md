# Lambda Functions

This directory contains the Lambda functions that implement automated background processing for various features including market intelligence alerts, trial notifications, and subscription management.

## Functions

### 1. Trial Notifications (`trial-notifications.ts`)

- **Schedule**: Daily at 12:00 PM UTC
- **Purpose**: Sends automated trial expiry notifications and handles expired trials
- **Timeout**: 5 minutes
- **Memory**: 512 MB

**Process Flow**:

1. Scans DynamoDB for users with active trials
2. Identifies trials expiring in 3 days or 1 day
3. Sends HTML email notifications via AWS SES
4. Handles expired trials by updating subscription status
5. Returns processing summary with notification counts

**Email Templates**:
- 3-day warning with upgrade call-to-action
- 1-day final warning with urgency messaging
- Professional HTML design with responsive layout
- Includes upgrade URL and support contact information

### 2. Life Event Processor (`life-event-processor.ts`)

- **Schedule**: Daily at 6:00 AM UTC
- **Purpose**: Analyzes public records data to identify life events and generate high-intent lead alerts
- **Timeout**: 15 minutes
- **Memory**: 2048 MB

**Process Flow**:

1. Queries all users with life event alerts enabled
2. For each user, fetches their target areas and alert settings
3. Calls the Life Event Analyzer to process events in target areas
4. Generates alerts for prospects with lead scores > 70
5. Saves alerts to DynamoDB

### 2. Competitor Monitor Processor (`competitor-monitor-processor.ts`)

- **Schedule**: Every 4 hours
- **Purpose**: Monitors competitor listing activity and generates alerts for new listings, price reductions, and withdrawals
- **Timeout**: 15 minutes
- **Memory**: 2048 MB

**Process Flow**:

1. Queries all users with competitor alerts enabled
2. For each user, fetches their tracked competitors and target areas
3. Calls the Competitor Monitor to track listing events
4. Generates alerts for new listings, price reductions (>5%), and withdrawals
5. Saves alerts to DynamoDB

### 3. Trend Detector Processor (`trend-detector-processor.ts`)

- **Schedule**: Daily at 7:00 AM UTC (1 hour after life events)
- **Purpose**: Analyzes neighborhood market trends and generates alerts for significant changes
- **Timeout**: 15 minutes
- **Memory**: 2048 MB

**Process Flow**:

1. Queries all users with neighborhood trend alerts enabled
2. For each user, extracts neighborhoods from their target areas
3. Calls the Neighborhood Trend Detector to analyze trends
4. Generates alerts for price increases (>10%), inventory decreases (>20%), and DOM decreases (>15%)
5. Saves alerts to DynamoDB

### 4. Price Reduction Processor (`price-reduction-processor.ts`)

- **Schedule**: Every 4 hours (offset by 30 minutes from competitor monitoring)
- **Purpose**: Monitors price reductions in target areas and generates alerts
- **Timeout**: 15 minutes
- **Memory**: 2048 MB

**Process Flow**:

1. Queries all users with price reduction alerts enabled
2. For each user, fetches their target areas and price range filters
3. Calls the Price Reduction Monitor to detect reductions
4. Generates alerts for any price reduction (filtered by price range if specified)
5. Saves alerts to DynamoDB

## Scheduling

The functions are scheduled using AWS EventBridge (CloudWatch Events) with cron expressions:

- **Trial Notifications**: `cron(0 12 * * ? *)` - Daily at 12 PM UTC
- **Life Event Processor**: `cron(0 6 * * ? *)` - Daily at 6 AM UTC
- **Competitor Monitor**: `cron(0 */4 * * ? *)` - Every 4 hours
- **Trend Detector**: `cron(0 7 * * ? *)` - Daily at 7 AM UTC
- **Price Reduction Monitor**: `cron(30 */4 * * ? *)` - Every 4 hours, offset by 30 minutes

## Monitoring

Each Lambda function has CloudWatch alarms configured for:

- Error rate monitoring
- Duration monitoring
- Invocation monitoring

Metrics are displayed in the CloudWatch dashboard for operational visibility.

## Deployment

### Building

```bash
./scripts/build-lambda.sh
```

### Deploying

```bash
./scripts/deploy-with-lambda.sh [environment] [region]
```

### Manual Deployment

```bash
# Build functions
cd src/lambda
npm install
npx tsc

# Deploy with SAM
sam deploy --template-file template.yaml --stack-name bayon-coagent-dev --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

## Environment Variables

Each Lambda function has access to:

- `NODE_ENV`: Environment name (development/production)
- `AWS_REGION`: AWS region
- `COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `COGNITO_CLIENT_ID`: Cognito Client ID
- `DYNAMODB_TABLE_NAME`: DynamoDB table name
- `S3_BUCKET_NAME`: S3 bucket name
- `BEDROCK_MODEL_ID`: Bedrock model ID
- `BEDROCK_REGION`: Bedrock region
- `LOG_LEVEL`: Logging level (INFO)

**Trial Notifications Function Additional Variables**:
- `SES_REGION`: AWS SES region for email sending
- `FROM_EMAIL`: Email address for sending notifications
- `NEXT_PUBLIC_APP_URL`: Application URL for upgrade links

## Error Handling

Each function implements comprehensive error handling:

- User-level error isolation (one user's failure doesn't stop processing for others)
- Detailed error logging with CloudWatch
- Graceful degradation for external API failures
- Result objects with error counts for monitoring

## Testing

Functions can be tested locally using:

```bash
# Install dependencies
cd src/lambda
npm install

# Run TypeScript compiler
npx tsc

# Test individual functions (requires AWS credentials)
node dist/life-event-processor.js
```

## Performance Considerations

- Functions are configured with 2048 MB memory for optimal performance
- 15-minute timeout allows for processing large user bases
- Concurrent execution is limited by DynamoDB and external API rate limits
- Functions are designed to be idempotent for safe retries

## Security

- Functions run with least-privilege IAM roles
- All data access is scoped to individual users
- External API calls use secure authentication
- CloudWatch logs contain no sensitive information

## Future Enhancements

- Add dead letter queues for failed invocations
- Implement batch processing for improved efficiency
- Add custom metrics for business KPIs
- Implement circuit breakers for external API calls
- Add support for user-specific scheduling preferences
