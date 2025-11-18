# AWS Logging and Monitoring

Centralized logging and monitoring system for the Bayon CoAgent application with environment-aware output and CloudWatch integration.

## Features

- **Environment-Aware Logging**: Console logging for local development, structured JSON for production
- **Structured Logging**: JSON-formatted logs with consistent schema
- **Correlation IDs**: Request tracing across services
- **Log Levels**: DEBUG, INFO, WARN, ERROR with environment-based filtering
- **CloudWatch Integration**: Direct integration with CloudWatch Logs
- **Dashboard Configurations**: Pre-configured dashboards for monitoring
- **Alarm Configurations**: Pre-configured alarms for critical metrics

## Quick Start

### Basic Usage

```typescript
import { logger } from "@/aws/logging";

// Log messages at different levels
logger.debug("Debugging information", { detail: "value" });
logger.info("User logged in", { userId: "123" });
logger.warn("Rate limit approaching", { current: 95, limit: 100 });
logger.error("Database connection failed", error, { operation: "query" });
```

### Service-Specific Logger

```typescript
import { createLogger } from "@/aws/logging";

const authLogger = createLogger({ service: "auth" });

authLogger.info("Authentication attempt", { email: "user@example.com" });
authLogger.error("Login failed", error, { reason: "invalid_credentials" });
```

### Operation Tracking

```typescript
import { logger } from "@/aws/logging";

async function processData() {
  const endOperation = logger.startOperation("processData", {
    recordCount: 100,
  });

  try {
    // Do work...
    await someAsyncOperation();
  } finally {
    endOperation(); // Logs completion with duration
  }
}
```

### Correlation IDs

```typescript
import { generateCorrelationId, createLogger } from "@/aws/logging";

async function handleRequest(req: Request) {
  const correlationId = generateCorrelationId();
  const requestLogger = createLogger({ correlationId, userId: req.userId });

  requestLogger.info("Processing request", { path: req.path });
  // All logs from this logger will include the correlationId
}
```

### Middleware Pattern

```typescript
import { withCorrelationId } from "@/aws/logging";

const authenticateUser = withCorrelationId(
  async (email: string, password: string) => {
    // Function implementation
    // Errors are automatically logged with correlation ID
  },
  "auth"
);
```

## Log Levels

Logs are filtered based on environment:

- **Local Development**: DEBUG and above
- **Development**: INFO and above
- **Production**: INFO and above

All ERROR logs are always output regardless of environment.

## Log Structure

All logs follow a consistent structure:

```typescript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  level: "INFO",
  message: "User logged in",
  context: {
    correlationId: "1705315800000-abc123",
    userId: "user-123",
    service: "auth",
    operation: "login"
  },
  environment: "production"
}
```

Error logs include additional error information:

```typescript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  level: "ERROR",
  message: "Database query failed",
  context: {
    correlationId: "1705315800000-abc123",
    operation: "getUserProfile"
  },
  error: {
    name: "DynamoDBError",
    message: "Item not found",
    stack: "...",
    code: "ItemNotFound"
  },
  environment: "production"
}
```

## CloudWatch Integration

### Direct CloudWatch Logging

For applications that need direct CloudWatch integration (optional):

```typescript
import { createCloudWatchLogger } from "@/aws/logging";

const cwLogger = await createCloudWatchLogger({
  logGroupName: "/aws/bayon-coagent",
  logStreamName: "application",
  region: "us-east-1",
});

await cwLogger.initialize();

// Log entries are buffered and auto-flushed
cwLogger.log(logEntry);

// Manual flush
await cwLogger.flush();

// Cleanup
await cwLogger.close();
```

**Note**: By default, logs go to stdout and are automatically captured by Lambda/ECS. Direct CloudWatch integration is only needed for special cases.

## Dashboards

Pre-configured CloudWatch dashboards are available:

### System Health Dashboard

- Authentication success rates
- DynamoDB operations
- Bedrock AI requests
- S3 storage operations
- Overall error rates

### Performance Dashboard

- API response times (p50, p95, p99)
- Database query latency
- AI generation latency
- Request throughput

### Cost Dashboard

- DynamoDB read/write units
- Bedrock token usage
- S3 storage size
- Service request counts

### User Activity Dashboard

- Active users
- Feature usage
- User sessions

### Using Dashboard Configurations

```typescript
import { dashboards, generateDashboardTemplate } from "@/aws/logging";

// Get dashboard configuration
const config = dashboards.systemHealth;

// Generate CloudFormation template
const template = generateDashboardTemplate(config);
```

## Alarms

Pre-configured CloudWatch alarms for critical metrics:

- **High Error Rate**: Triggers when error rate exceeds 5%
- **High Latency**: Triggers when p95 latency exceeds 1000ms
- **DynamoDB Throttling**: Triggers when requests are throttled
- **Bedrock Quota**: Triggers when approaching quota limits
- **S3 Upload Failures**: Triggers when uploads fail
- **Auth Failures**: Triggers when authentication failures spike
- **Database Latency**: Triggers when queries are slow
- **AI Generation Failures**: Triggers when AI requests fail

### Using Alarm Configurations

```typescript
import { alarms, generateAllAlarmsTemplate } from "@/aws/logging";

// Generate CloudFormation template for all alarms
const template = generateAllAlarmsTemplate(
  "arn:aws:sns:us-east-1:123456789:alerts"
);
```

## Best Practices

### 1. Use Appropriate Log Levels

- **DEBUG**: Detailed information for debugging (filtered in production)
- **INFO**: General informational messages (user actions, system events)
- **WARN**: Warning messages (approaching limits, deprecated features)
- **ERROR**: Error messages (failures, exceptions)

### 2. Include Context

Always include relevant context in your logs:

```typescript
logger.info("User action", {
  userId: user.id,
  action: "profile_update",
  fields: ["name", "email"],
});
```

### 3. Use Correlation IDs

For request tracing across services:

```typescript
const correlationId = generateCorrelationId();
const requestLogger = createLogger({ correlationId });
```

### 4. Log Errors with Context

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "riskyOperation",
    userId: user.id,
    retryCount: 3,
  });
}
```

### 5. Track Operation Duration

```typescript
const endOperation = logger.startOperation("dataProcessing", {
  recordCount: 1000,
});
try {
  await processData();
} finally {
  endOperation();
}
```

### 6. Create Service-Specific Loggers

```typescript
// In auth service
const authLogger = createLogger({ service: "auth" });

// In database service
const dbLogger = createLogger({ service: "database" });
```

## Environment Variables

No additional environment variables are required. The logging module uses the existing AWS configuration from `src/aws/config.ts`.

## Integration with Existing Services

### DynamoDB

```typescript
import { logger } from "@/aws/logging";
import { wrapDynamoDBError } from "@/aws/dynamodb/errors";

try {
  const result = await dynamodb.get(pk, sk);
  logger.debug("DynamoDB get successful", { pk, sk });
  return result;
} catch (error) {
  const wrappedError = wrapDynamoDBError(error);
  logger.error("DynamoDB get failed", wrappedError, { pk, sk });
  throw wrappedError;
}
```

### Bedrock

```typescript
import { logger } from "@/aws/logging";

const endOperation = logger.startOperation("bedrockInvoke", {
  modelId: "claude-3-5-sonnet",
});

try {
  const response = await bedrock.invoke(prompt);
  logger.info("AI generation successful", {
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
  });
  return response;
} catch (error) {
  logger.error("AI generation failed", error, { modelId });
  throw error;
} finally {
  endOperation();
}
```

### S3

```typescript
import { logger } from "@/aws/logging";

try {
  await s3.uploadFile(key, file);
  logger.info("File uploaded", { key, size: file.size });
} catch (error) {
  logger.error("File upload failed", error, { key });
  throw error;
}
```

## Monitoring in Production

### CloudWatch Logs Insights Queries

Query logs using CloudWatch Logs Insights:

```sql
-- Find all errors in the last hour
fields @timestamp, message, context.userId, error.message
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

-- Track operation duration
fields @timestamp, message, context.duration
| filter message like /Completed operation/
| stats avg(context.duration) as avgDuration by message

-- Find slow operations
fields @timestamp, message, context.duration
| filter context.duration > 1000
| sort context.duration desc
```

### Setting Up Alarms

1. Deploy alarm configurations using CloudFormation or CDK
2. Create an SNS topic for notifications
3. Subscribe to the SNS topic (email, SMS, Lambda, etc.)
4. Alarms will trigger based on configured thresholds

### Viewing Dashboards

1. Deploy dashboard configurations to CloudWatch
2. Access via AWS Console → CloudWatch → Dashboards
3. Customize as needed for your specific use case

## Testing

The logging module works seamlessly in test environments:

```typescript
import { createLogger } from "@/aws/logging";

describe("MyService", () => {
  const logger = createLogger({ service: "test" });

  it("should log operations", () => {
    logger.info("Test operation", { testId: "123" });
    // Logs will go to console in test environment
  });
});
```

## Troubleshooting

### Logs Not Appearing in CloudWatch

1. Verify environment is set to 'production'
2. Check AWS credentials are configured
3. Verify CloudWatch Logs permissions
4. Check log group and stream exist

### High Log Volume

1. Adjust log levels (use INFO instead of DEBUG in production)
2. Implement sampling for high-frequency logs
3. Use log aggregation and filtering
4. Consider log retention policies

### Missing Context

1. Always create loggers with default context
2. Use correlation IDs for request tracing
3. Include relevant metadata in all log calls

## Future Enhancements

- [ ] Log sampling for high-volume scenarios
- [ ] Integration with distributed tracing (X-Ray)
- [ ] Custom metric publishing
- [ ] Log aggregation and analysis tools
- [ ] Performance profiling integration
