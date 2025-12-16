# Logging Quick Reference

Quick reference for standardized logging patterns in the Bayon CoAgent platform.

## Basic Usage

```typescript
import { createLogger } from "@/aws/logging/logger";
const logger = createLogger({ service: "your-service-name" });

// ✅ Use explicit log levels
logger.info("Operation started", { userId, operation: "data-processing" });
logger.warn("Rate limit approaching", { current: 95, limit: 100 });
logger.error("Operation failed", error, { context: "additional-info" });
logger.debug("Detailed debugging info", { details: debugData });

// ❌ Don't use logger.log() - deprecated for consistency
// logger.log('Some message'); // Use logger.info() instead
```

## Log Levels

| Level   | Usage                              | Environment      |
| ------- | ---------------------------------- | ---------------- |
| `debug` | Detailed debugging information     | Development only |
| `info`  | General informational messages     | All environments |
| `warn`  | Warning messages, potential issues | All environments |
| `error` | Error messages, failures           | All environments |

## Service-Specific Loggers

```typescript
// Create service-specific loggers for better organization
const authLogger = createLogger({ service: "auth" });
const dbLogger = createLogger({ service: "database" });
const aiLogger = createLogger({ service: "bedrock" });
const marketLogger = createLogger({ service: "market-intelligence" });

// Use in operations
authLogger.info("User login attempt", { email: user.email });
dbLogger.warn("Query slow", { query: "getUserProfile", duration: 1500 });
aiLogger.error("AI generation failed", error, { modelId: "claude-3-5-sonnet" });
marketLogger.info("Market analysis started", {
  location: "Austin, TX",
  analysisType: "market-update",
});
```

## Common Patterns

### Operation Tracking

```typescript
const logger = createLogger({ service: "content-generation" });

// Start of operation
logger.info("Content generation started", {
  userId,
  contentType: "blog-post",
  topic,
});

try {
  const result = await generateContent(input);

  // Success
  logger.info("Content generation completed", {
    userId,
    contentLength: result.content.length,
    duration: Date.now() - startTime,
  });

  return result;
} catch (error) {
  // Error
  logger.error("Content generation failed", error, {
    userId,
    contentType: input.contentType,
    topic: input.topic,
  });

  throw error;
}
```

### Error Handling

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "riskyOperation",
    userId: user.id,
    retryCount: 3,
    context: "additional-context",
  });

  // Re-throw or handle appropriately
  throw error;
}
```

### Performance Monitoring

```typescript
const startTime = Date.now();

try {
  const result = await expensiveOperation();
  const duration = Date.now() - startTime;

  if (duration > 1000) {
    logger.warn("Slow operation detected", {
      operation: "expensiveOperation",
      duration,
      threshold: 1000,
    });
  } else {
    logger.info("Operation completed", {
      operation: "expensiveOperation",
      duration,
    });
  }

  return result;
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "expensiveOperation",
    duration: Date.now() - startTime,
  });
  throw error;
}
```

## Context Objects

Always include relevant context in your logs:

```typescript
// Good - Rich context
logger.info("User action completed", {
  userId: user.id,
  action: "profile_update",
  fields: ["name", "email", "phone"],
  source: "settings_page",
  userAgent: req.headers["user-agent"],
});

// Avoid - Minimal context
logger.info("Profile updated");
```

## Correlation IDs

For request tracing across services:

```typescript
import { generateCorrelationId } from "@/aws/logging/logger";

const correlationId = generateCorrelationId();
const requestLogger = createLogger({
  service: "api",
  correlationId,
});

// All logs from this logger will include the correlationId
requestLogger.info("Processing request", { path: req.path });
requestLogger.info("Database query started", { query: "getUserProfile" });
requestLogger.info("Request completed", { statusCode: 200 });
```

## Environment-Specific Behavior

| Environment | Console Output | CloudWatch | Log Level |
| ----------- | -------------- | ---------- | --------- |
| Development | ✅ Formatted   | ❌         | DEBUG+    |
| Production  | ❌             | ✅ JSON    | INFO+     |
| Test        | ✅ Minimal     | ❌         | ERROR+    |

## Common Service Names

Use these standardized service names:

- `auth` - Authentication and authorization
- `database` - DynamoDB operations
- `bedrock` - AI/Bedrock operations
- `s3` - File storage operations
- `search` - Tavily search operations
- `market-intelligence` - Market analysis
- `content-generation` - Content creation
- `image-analysis` - Image processing
- `research-agent` - Research operations
- `brand-strategy` - Brand planning
- `listing-description` - Property descriptions
- `agent-orchestration` - Workflow management

## Migration from logger.log()

If you encounter `logger.log()` calls, replace them:

```typescript
// ❌ Old pattern
logger.log("Operation completed");

// ✅ New pattern
logger.info("Operation completed");

// ❌ Old pattern with context
logger.log("User action", { userId, action });

// ✅ New pattern with context
logger.info("User action", { userId, action });
```

## CloudWatch Integration

Logs automatically integrate with CloudWatch in production:

- **Log Groups**: `/aws/lambda/function-name` or `/aws/ecs/service-name`
- **Structured Format**: JSON format for easy querying
- **Filtering**: Use CloudWatch Logs Insights for advanced queries
- **Alarms**: Set up alarms based on error rates or patterns

## Best Practices

1. **Use explicit log levels** - Never use `logger.log()`
2. **Include context** - Always provide relevant metadata
3. **Service-specific loggers** - Create loggers per service/module
4. **Consistent naming** - Use standardized service names
5. **Error details** - Include full error objects in error logs
6. **Performance tracking** - Log operation durations for monitoring
7. **Correlation IDs** - Use for request tracing across services

## Related Documentation

- [AWS Logging README](../aws/logging/README.md) - Complete logging documentation
- [Development Guide](../guides/development.md) - Development workflow
- [Best Practices](../best-practices.md) - General development guidelines
