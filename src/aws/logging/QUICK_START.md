# Logging Quick Start Guide

Get started with the Bayon CoAgent logging system in 5 minutes.

## Installation

The logging module is already installed and ready to use. No additional setup required!

## Basic Usage

### 1. Import the Logger

```typescript
import { logger } from "@/aws/logging";
```

### 2. Start Logging

```typescript
// Info logs
logger.info("User logged in", { userId: "123" });

// Error logs
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", error, { operation: "riskyOperation" });
}
```

That's it! You're logging.

## Common Patterns

### Service-Specific Logger

```typescript
import { createLogger } from "@/aws/logging";

const authLogger = createLogger({ service: "auth" });
authLogger.info("Login attempt", { email: "user@example.com" });
```

### Track Operation Duration

```typescript
const endOperation = logger.startOperation("processData", { recordCount: 100 });
try {
  await processData();
} finally {
  endOperation(); // Logs duration automatically
}
```

### Request Tracing

```typescript
import { generateCorrelationId, createLogger } from "@/aws/logging";

const correlationId = generateCorrelationId();
const requestLogger = createLogger({ correlationId, userId: "123" });
requestLogger.info("Processing request");
```

## Log Levels

- **DEBUG**: Detailed debugging info (local only)
- **INFO**: General information
- **WARN**: Warning messages
- **ERROR**: Error messages

## Environment Behavior

- **Local Development**: Colored console output with full details
- **Production**: Structured JSON to CloudWatch Logs

## Next Steps

- Read the [README](./README.md) for comprehensive documentation
- Check [examples.ts](./examples.ts) for more patterns
- See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for service integration

## Quick Reference

```typescript
// Basic logging
logger.debug("Debug message", { context });
logger.info("Info message", { context });
logger.warn("Warning message", { context });
logger.error("Error message", error, { context });

// Service logger
const logger = createLogger({ service: "myService" });

// Correlation ID
const correlationId = generateCorrelationId();
const logger = createLogger({ correlationId });

// Child logger
const childLogger = logger.child({ additionalContext });

// Operation tracking
const endOp = logger.startOperation("operation", { context });
endOp(); // Call when done

// Middleware
const fn = withCorrelationId(myFunction, "serviceName");
```

## Troubleshooting

**Logs not showing?**

- Check log level (DEBUG only shows in local)
- Verify environment variables are loaded

**Too many logs?**

- Use INFO instead of DEBUG in production
- Add context filtering

**Need help?**

- Check [README.md](./README.md)
- Review [examples.ts](./examples.ts)
- See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
