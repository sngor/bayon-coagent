# Structured Logging with Trace Correlation Guide

This guide explains how to use the structured logging system with X-Ray trace correlation for debugging and monitoring distributed microservices.

## Overview

The logging system automatically correlates logs with X-Ray traces, making it easy to:

- Track requests across multiple services
- Debug distributed transactions
- Analyze performance bottlenecks
- Investigate errors with full context

## Key Features

1. **Automatic Trace Correlation**: Logs automatically include X-Ray trace IDs, span IDs, and correlation IDs
2. **Structured JSON Logging**: All logs are structured for easy parsing and analysis
3. **CloudWatch Insights Integration**: Pre-built queries for common debugging scenarios
4. **Service-to-Service Tracing**: Track requests as they flow through multiple services

## Basic Usage

### Creating a Logger

```typescript
import { logger, createLogger } from "@/aws/logging";

// Use the default logger
logger.info("User logged in", { userId: "123" });

// Create a service-specific logger
const authLogger = createLogger({ service: "auth-service" });
authLogger.info("Processing login request", { userId: "123" });
```

### Logging with Trace Context

When X-Ray tracing is enabled, logs automatically include trace context:

```typescript
import { logger } from "@/aws/logging";
import { tracer } from "@/aws/xray";

// Start a trace
const traceContext = await tracer.startTrace("user-login", {
  userId: "123",
  requestId: "req-456",
});

// Log within the trace - trace IDs are automatically included
logger.info("Login successful", {
  userId: "123",
  email: "user@example.com",
});

// Close the trace
await tracer.closeSegment();
```

The log entry will include:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO",
  "message": "Login successful",
  "context": {
    "traceId": "1-5f8a1234-abcd1234efgh5678ijkl9012",
    "spanId": "53995c3f42cd8ad8",
    "correlationId": "1234567890-abc123",
    "userId": "123",
    "email": "user@example.com"
  },
  "environment": "production"
}
```

### Logging Errors with Trace Context

```typescript
try {
  await someOperation();
} catch (error) {
  logger.error("Operation failed", error as Error, {
    userId: "123",
    operation: "someOperation",
  });
}
```

### Creating Child Loggers

Child loggers inherit context from their parent:

```typescript
const requestLogger = logger.child({
  correlationId: "req-123",
  userId: "user-456",
});

// All logs from this logger will include the correlation ID and user ID
requestLogger.info("Processing request");
requestLogger.info("Request completed");
```

## CloudWatch Insights Queries

### Using Pre-built Queries

The system includes 15+ pre-built queries for common scenarios:

```typescript
import { getInsightsClient } from "@/aws/logging";

const client = getInsightsClient();

// Find all logs for a specific trace
const results = await client.findLogsByTraceId(
  "1-5f8a1234-abcd1234efgh5678ijkl9012",
  ["/aws/lambda/my-function"]
);

console.log(results.results);
```

### Available Queries

1. **findLogsByTraceId**: Find all logs for a specific X-Ray trace
2. **findLogsByCorrelationId**: Find all logs for a correlation ID
3. **traceRequestAcrossServices**: Follow a request through all services
4. **findErrorsWithTraceContext**: Find errors with trace information
5. **analyzeServicePerformance**: Analyze operation duration by service
6. **findSlowOperations**: Find operations exceeding duration threshold
7. **analyzeErrorPatterns**: Group errors by service and type
8. **findLogsByUserId**: Find all logs for a specific user
9. **analyzeRequestFlow**: Visualize request flow through services
10. **findOrphanedLogs**: Find logs missing trace context
11. **analyzeServiceDependencies**: Identify service call patterns
12. **findConcurrentOperations**: Find concurrent operations in a trace
13. **calculateEndToEndLatency**: Calculate total request latency
14. **findFailedTraces**: Find traces containing errors
15. **analyzeServiceHealth**: Calculate error rates by service

### Using Queries in AWS Console

You can copy these queries directly into the CloudWatch Insights console:

```typescript
import { queryTemplates, prepareQuery } from "@/aws/logging";

// Get a query template
const query = queryTemplates.findLogsByTraceId;

// Replace placeholders
const preparedQuery = prepareQuery(query, {
  TRACE_ID: "1-5f8a1234-abcd1234efgh5678ijkl9012",
});

console.log(preparedQuery);
// Copy this to CloudWatch Insights console
```

### Programmatic Query Execution

```typescript
import { getInsightsClient } from "@/aws/logging";
import { queryTemplates } from "@/aws/logging";

const client = getInsightsClient();

// Execute a custom query
const results = await client.executeQuery(
  queryTemplates.analyzeServicePerformance,
  {
    logGroupNames: [
      "/aws/lambda/ai-service",
      "/aws/lambda/integration-service",
      "/aws/lambda/background-service",
    ],
    startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    endTime: new Date(),
  }
);

console.log("Performance Analysis:", results.results);
```

## Common Debugging Scenarios

### Scenario 1: Debugging a Failed Request

```typescript
// 1. Get the correlation ID from the error response
const correlationId = "req-123-abc";

// 2. Find all logs for this request
const client = getInsightsClient();
const logs = await client.findLogsByCorrelationId(
  correlationId,
  ["/aws/lambda/*"] // All Lambda functions
);

// 3. Analyze the logs
logs.results?.forEach((log) => {
  console.log(`[${log["@timestamp"]}] ${log.level}: ${log.message}`);
  console.log(`  Service: ${log["context.service"]}`);
  console.log(`  Operation: ${log["context.operation"]}`);
});
```

### Scenario 2: Tracing a Request Across Services

```typescript
// Use the correlation ID to trace the request
const trace = await client.traceRequestAcrossServices("req-123-abc", [
  "/aws/lambda/*",
]);

// See which services were involved
const services = new Set(trace.results?.map((log) => log["context.service"]));
console.log("Services involved:", Array.from(services));
```

### Scenario 3: Finding Performance Bottlenecks

```typescript
// Find slow operations
const slowOps = await client.executeQuery(queryTemplates.findSlowOperations, {
  logGroupNames: ["/aws/lambda/*"],
});

// Analyze which services are slow
slowOps.results?.forEach((log) => {
  console.log(
    `${log["context.service"]}.${log["context.operation"]}: ${log["context.duration"]}ms`
  );
});
```

### Scenario 4: Investigating User Issues

```typescript
// Find all logs for a specific user
const userLogs = await client.findLogsByUserId("user-123", ["/aws/lambda/*"]);

// See what the user was doing
userLogs.results?.forEach((log) => {
  console.log(
    `[${log["@timestamp"]}] ${log["context.operation"]}: ${log.message}`
  );
});
```

## Best Practices

### 1. Always Include Context

```typescript
// Good
logger.info("User created", {
  userId: user.id,
  email: user.email,
  source: "registration",
});

// Bad
logger.info("User created");
```

### 2. Use Correlation IDs for Request Tracking

```typescript
import { generateCorrelationId } from "@/aws/logging";

const correlationId = generateCorrelationId();
const requestLogger = logger.child({ correlationId });

// All logs in this request will have the same correlation ID
requestLogger.info("Request started");
// ... process request ...
requestLogger.info("Request completed");
```

### 3. Log Operation Duration

```typescript
const endOperation = logger.startOperation("process-payment", {
  userId: "123",
  amount: 100,
});

try {
  await processPayment();
  endOperation(); // Automatically logs duration
} catch (error) {
  logger.error("Payment failed", error as Error);
  throw error;
}
```

### 4. Use Service-Specific Loggers

```typescript
// In each service, create a logger with the service name
const serviceLogger = createLogger({ service: "payment-service" });

// This makes it easy to filter logs by service
serviceLogger.info("Processing payment");
```

### 5. Include User Context When Available

```typescript
// Add user context to traces
tracer.addAnnotation("user.id", userId);
tracer.addMetadata("user.email", userEmail);

// Logs will automatically include this context
logger.info("User action completed");
```

## Integration with X-Ray

### Automatic Integration

The logger automatically integrates with X-Ray when tracing is enabled:

```typescript
import { tracer } from "@/aws/xray";
import { logger } from "@/aws/logging";

// Start a trace
await tracer.startTrace("my-operation", {
  userId: "123",
});

// Logs automatically include trace context
logger.info("Operation started");

// Add custom annotations
await tracer.addAnnotation("custom.field", "value");

// Close the trace
await tracer.closeSegment();
```

### Viewing Traces in X-Ray Console

1. Get the trace ID from logs:

   ```typescript
   const context = tracer.getCurrentTraceContext();
   console.log("Trace URL:", getTraceConsoleURL(context.traceId));
   ```

2. Open the URL in AWS X-Ray console to see:
   - Service map
   - Trace timeline
   - Subsegments
   - Annotations and metadata

### Correlating Logs with Traces

In CloudWatch Insights, use the trace ID to find related logs:

```sql
fields @timestamp, level, message, context.service
| filter context.traceId = "1-5f8a1234-abcd1234efgh5678ijkl9012"
| sort @timestamp asc
```

## Environment-Specific Behavior

### Local Development

- Logs output to console with colors
- Includes full context and stack traces
- DEBUG level enabled

### Production

- Logs output as structured JSON to CloudWatch
- INFO level and above
- Automatic trace correlation
- Optimized for CloudWatch Insights

## Troubleshooting

### Logs Missing Trace Context

If logs don't include trace IDs:

1. Verify X-Ray is enabled:

   ```typescript
   import { tracer } from "@/aws/xray";
   console.log("X-Ray enabled:", tracer.isEnabled());
   ```

2. Ensure you're within a trace:

   ```typescript
   const context = tracer.getCurrentTraceContext();
   if (!context) {
     console.log("No active trace");
   }
   ```

3. Check X-Ray daemon is running (for local development)

### Query Returns No Results

1. Verify log group names are correct
2. Check time range is appropriate
3. Ensure logs have been ingested (may take a few minutes)
4. Verify field names in query match log structure

### Performance Issues

1. Limit query time range
2. Use specific log groups instead of wildcards
3. Add filters to reduce data scanned
4. Use aggregations instead of returning all logs

## Additional Resources

- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [CloudWatch Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [Distributed Tracing Best Practices](https://aws.amazon.com/blogs/mt/distributed-tracing-aws-x-ray/)
