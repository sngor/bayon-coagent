# Logging Integration Guide

This guide shows how to integrate the logging system into existing AWS services in the Bayon CoAgent application.

## Quick Integration Steps

### 1. Import the Logger

```typescript
import { logger, createLogger } from "@/aws/logging";
```

### 2. Add Logging to Your Service

Choose one of these patterns:

#### Pattern A: Use the Default Logger

```typescript
logger.info("Operation completed", { userId: "123" });
```

#### Pattern B: Create a Service-Specific Logger

```typescript
const serviceLogger = createLogger({ service: "myService" });
serviceLogger.info("Operation completed", { userId: "123" });
```

## Integration Examples

### DynamoDB Repository

**File**: `src/aws/dynamodb/repository.ts`

```typescript
import { createLogger } from "@/aws/logging";

export class DynamoDBRepository {
  private logger = createLogger({ service: "dynamodb" });

  async get<T>(pk: string, sk: string): Promise<T | null> {
    this.logger.debug("Getting item", { pk, sk });

    const endOperation = this.logger.startOperation("dynamodb.get", { pk, sk });

    try {
      const result = await this.client.send(command);

      if (!result.Item) {
        this.logger.debug("Item not found", { pk, sk });
        return null;
      }

      this.logger.debug("Item retrieved", { pk, sk });
      return result.Item as T;
    } catch (error) {
      this.logger.error("Failed to get item", error as Error, { pk, sk });
      throw wrapDynamoDBError(error);
    } finally {
      endOperation();
    }
  }

  async put<T>(item: DynamoDBItem<T>): Promise<void> {
    this.logger.debug("Putting item", { pk: item.PK, sk: item.SK });

    try {
      await this.client.send(command);
      this.logger.info("Item saved", {
        pk: item.PK,
        sk: item.SK,
        entityType: item.EntityType,
      });
    } catch (error) {
      this.logger.error("Failed to put item", error as Error, {
        pk: item.PK,
        sk: item.SK,
      });
      throw wrapDynamoDBError(error);
    }
  }
}
```

### Bedrock Client

**File**: `src/aws/bedrock/client.ts`

```typescript
import { createLogger, generateCorrelationId } from "@/aws/logging";

export class BedrockClient {
  private logger = createLogger({ service: "bedrock" });

  async invoke<TOutput>(
    modelId: string,
    prompt: string,
    outputSchema: z.ZodSchema<TOutput>
  ): Promise<TOutput> {
    const correlationId = generateCorrelationId();
    const requestLogger = this.logger.child({ correlationId, modelId });

    requestLogger.info("Invoking Bedrock model", {
      promptLength: prompt.length,
    });

    const endOperation = requestLogger.startOperation("bedrock.invoke", {
      modelId,
    });

    try {
      const response = await this.client.send(command);

      requestLogger.info("Bedrock invocation successful", {
        inputTokens: response.usage?.inputTokens,
        outputTokens: response.usage?.outputTokens,
      });

      return parsedOutput;
    } catch (error) {
      requestLogger.error("Bedrock invocation failed", error as Error, {
        modelId,
        promptLength: prompt.length,
      });
      throw error;
    } finally {
      endOperation();
    }
  }
}
```

### S3 Client

**File**: `src/aws/s3/client.ts`

```typescript
import { createLogger } from "@/aws/logging";

export class S3Client {
  private logger = createLogger({ service: "s3" });

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string
  ): Promise<string> {
    this.logger.info("Uploading file", {
      key,
      size: file.length,
      contentType,
    });

    const endOperation = this.logger.startOperation("s3.upload", {
      key,
      size: file.length,
    });

    try {
      await this.client.send(command);

      this.logger.info("File uploaded successfully", {
        key,
        size: file.length,
      });

      return `https://${bucket}.s3.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error("File upload failed", error as Error, {
        key,
        size: file.length,
      });
      throw error;
    } finally {
      endOperation();
    }
  }
}
```

### Cognito Client

**File**: `src/aws/auth/cognito-client.ts`

```typescript
import { createLogger } from "@/aws/logging";

export class CognitoClient {
  private logger = createLogger({ service: "cognito" });

  async signIn(email: string, password: string): Promise<AuthSession> {
    this.logger.info("Sign in attempt", { email });

    try {
      const response = await this.client.send(command);

      this.logger.info("Sign in successful", { email });

      return {
        accessToken: response.AuthenticationResult!.AccessToken!,
        idToken: response.AuthenticationResult!.IdToken!,
        refreshToken: response.AuthenticationResult!.RefreshToken!,
        expiresAt: Date.now() + 3600000,
      };
    } catch (error) {
      this.logger.error("Sign in failed", error as Error, {
        email,
        errorCode: (error as any).name,
      });
      throw error;
    }
  }

  async signOut(accessToken: string): Promise<void> {
    this.logger.info("Sign out");

    try {
      await this.client.send(command);
      this.logger.info("Sign out successful");
    } catch (error) {
      this.logger.error("Sign out failed", error as Error);
      throw error;
    }
  }
}
```

### Server Actions

**File**: `src/app/actions.ts`

```typescript
import { generateCorrelationId, createLogger } from "@/aws/logging";

export async function generateBlogPost(input: BlogPostInput) {
  const correlationId = generateCorrelationId();
  const logger = createLogger({
    correlationId,
    service: "actions",
    action: "generateBlogPost",
  });

  logger.info("Generating blog post", {
    topic: input.topic,
    userId: input.userId,
  });

  try {
    const result = await bedrockFlow.execute(input);

    logger.info("Blog post generated", {
      topic: input.topic,
      wordCount: result.content.length,
    });

    return result;
  } catch (error) {
    logger.error("Blog post generation failed", error as Error, {
      topic: input.topic,
      userId: input.userId,
    });
    throw error;
  }
}
```

### React Hooks

**File**: `src/aws/dynamodb/hooks/use-query.tsx`

```typescript
import { createLogger } from "@/aws/logging";

export function useQuery<T>(pk: string, skPrefix?: string) {
  const logger = createLogger({ service: "hooks", hook: "useQuery" });

  useEffect(() => {
    logger.debug("Query hook mounted", { pk, skPrefix });

    const fetchData = async () => {
      try {
        const data = await repository.query<T>(pk, skPrefix);
        logger.debug("Query successful", {
          pk,
          skPrefix,
          resultCount: data.length,
        });
        setData(data);
      } catch (error) {
        logger.error("Query failed", error as Error, { pk, skPrefix });
        setError(error as Error);
      }
    };

    fetchData();
  }, [pk, skPrefix]);

  return { data, loading, error };
}
```

## Best Practices for Integration

### 1. Create Service-Specific Loggers

Always create a logger with a service identifier:

```typescript
const logger = createLogger({ service: "myService" });
```

### 2. Log at Appropriate Levels

- **DEBUG**: Internal details, variable values (filtered in production)
- **INFO**: User actions, successful operations
- **WARN**: Approaching limits, deprecated features
- **ERROR**: Failures, exceptions

### 3. Include Relevant Context

```typescript
logger.info("Operation completed", {
  userId: user.id,
  operation: "updateProfile",
  fieldsUpdated: ["name", "email"],
});
```

### 4. Track Operation Duration

```typescript
const endOperation = logger.startOperation("operation", { context });
try {
  // Do work
} finally {
  endOperation();
}
```

### 5. Use Correlation IDs for Requests

```typescript
const correlationId = generateCorrelationId();
const requestLogger = logger.child({ correlationId });
```

### 6. Log Errors with Full Context

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "riskyOperation",
    userId: user.id,
    attemptNumber: 3,
  });
  throw error;
}
```

### 7. Don't Log Sensitive Data

Never log:

- Passwords
- API keys
- Credit card numbers
- Personal identification numbers
- Full authentication tokens

Instead, log:

- User IDs
- Email addresses (if needed)
- Operation names
- Error codes
- Timestamps

## Testing with Logging

### Unit Tests

```typescript
import { createLogger } from "@/aws/logging";

describe("MyService", () => {
  const logger = createLogger({ service: "test" });

  it("should perform operation", async () => {
    logger.debug("Running test");
    // Test logic
  });
});
```

### Integration Tests

```typescript
import { logger } from "@/aws/logging";

describe("Integration Tests", () => {
  beforeEach(() => {
    logger.info("Starting integration test");
  });

  it("should complete end-to-end flow", async () => {
    // Test logic
  });
});
```

## Monitoring Logs in Production

### CloudWatch Logs Insights

Query logs using CloudWatch Logs Insights:

```sql
-- Find all errors
fields @timestamp, message, context.userId, error.message
| filter level = "ERROR"
| sort @timestamp desc

-- Track operation duration
fields @timestamp, message, context.duration
| filter message like /Completed operation/
| stats avg(context.duration) as avgDuration by message

-- Find slow operations
fields @timestamp, message, context.duration
| filter context.duration > 1000
| sort context.duration desc
```

## Troubleshooting

### Logs Not Appearing

1. Check environment configuration
2. Verify log level is appropriate
3. Check CloudWatch permissions
4. Verify log group exists

### Too Many Logs

1. Increase log level (INFO instead of DEBUG)
2. Add sampling for high-frequency logs
3. Use log filtering

### Missing Context

1. Always include relevant context in log calls
2. Use child loggers to inherit context
3. Use correlation IDs for request tracing

## Next Steps

1. Add logging to all AWS service clients
2. Add logging to all server actions
3. Add logging to critical React hooks
4. Set up CloudWatch dashboards
5. Configure CloudWatch alarms
6. Test logging in production
