# Cross-Service Communication with Request Signing

This guide explains how to implement secure Lambda-to-Lambda communication using AWS Signature V4 request signing.

## Overview

When Lambda functions need to communicate with other services via API Gateway, they should use signed requests to ensure:

1. **Authentication**: Verify the caller's identity
2. **Authorization**: Ensure the caller has permission to invoke the endpoint
3. **Integrity**: Prevent request tampering
4. **Security**: Protect against replay attacks

## Request Signing Utility

The `request-signer.ts` module provides utilities for signing requests to API Gateway endpoints using AWS Signature Version 4.

### Available Functions

#### Service-Specific Helpers

```typescript
import {
  invokeAiService,
  invokeIntegrationService,
  invokeBackgroundService,
  invokeAdminService,
} from "./utils/request-signer";
```

These functions automatically use the correct API Gateway URL from environment variables:

- `AI_SERVICE_API_URL`
- `INTEGRATION_SERVICE_API_URL`
- `BACKGROUND_SERVICE_API_URL`
- `ADMIN_SERVICE_API_URL`

#### Generic API Gateway Invocation

```typescript
import { invokeApiGateway } from "./utils/request-signer";

const result = await invokeApiGateway<ResponseType>(
  apiUrl, // Full API Gateway URL
  method, // HTTP method (GET, POST, PUT, DELETE)
  path, // Endpoint path
  body, // Request body (optional)
  queryParams // Query parameters (optional)
);
```

## Usage Examples

### Example 1: AI Service Calling Integration Service

When an AI service Lambda needs to publish content via the Integration Service:

```typescript
// In src/lambda/ai-blog-post-generator.ts
import { invokeIntegrationService } from "./utils/request-signer";

async function processJob(record: SQSRecord): Promise<void> {
  // ... generate blog post ...

  // Publish to social media via Integration Service
  try {
    const result = await invokeIntegrationService<{ success: boolean }>(
      "/publish/blog",
      "POST",
      {
        userId,
        contentId: jobId,
        content: generatedContent,
        platforms: ["facebook", "linkedin"],
      }
    );

    if (result.success) {
      console.log("Content published successfully");
    }
  } catch (error) {
    console.error("Failed to publish content:", error);
    // Handle error appropriately
  }
}
```

### Example 2: Background Service Calling AI Service

When a background processing Lambda needs to trigger AI generation:

```typescript
// In src/lambda/publish-scheduled-content.ts
import { invokeAiService } from "./utils/request-signer";

async function generateContentForSchedule(
  schedule: ScheduledContent
): Promise<void> {
  try {
    const result = await invokeAiService<{ jobId: string }>(
      "/generate/social-post",
      "POST",
      {
        userId: schedule.userId,
        topic: schedule.topic,
        platform: schedule.platform,
        tone: schedule.tone,
      }
    );

    console.log(`AI job created: ${result.jobId}`);
    return result.jobId;
  } catch (error) {
    console.error("Failed to create AI job:", error);
    throw error;
  }
}
```

### Example 3: Integration Service Calling Background Service

When an Integration Service Lambda needs to trigger analytics:

```typescript
// In src/lambda/oauth-callback-handler.ts (hypothetical)
import { invokeBackgroundService } from "./utils/request-signer";

async function handleOAuthSuccess(
  userId: string,
  provider: string
): Promise<void> {
  try {
    await invokeBackgroundService("/analytics/oauth-connected", "POST", {
      userId,
      provider,
      connectedAt: new Date().toISOString(),
    });

    console.log("Analytics event triggered");
  } catch (error) {
    console.warn("Failed to trigger analytics:", error);
    // Non-critical - continue processing
  }
}
```

### Example 4: Batch Invocations

When you need to call multiple services in parallel:

```typescript
import { batchInvokeApiGateway } from "./utils/request-signer";

async function notifyMultipleServices(event: any): Promise<void> {
  const requests = [
    {
      apiUrl: process.env.AI_SERVICE_API_URL!,
      method: "POST",
      path: "/notify",
      body: { event },
    },
    {
      apiUrl: process.env.INTEGRATION_SERVICE_API_URL!,
      method: "POST",
      path: "/notify",
      body: { event },
    },
    {
      apiUrl: process.env.BACKGROUND_SERVICE_API_URL!,
      method: "POST",
      path: "/notify",
      body: { event },
    },
  ];

  const results = await batchInvokeApiGateway(requests);
  console.log(`Notified ${results.length} services`);
}
```

### Example 5: With Retry Logic

For critical operations that need automatic retries:

```typescript
import { invokeApiGatewayWithRetry } from "./utils/request-signer";

async function criticalOperation(data: any): Promise<void> {
  try {
    const result = await invokeApiGatewayWithRetry(
      process.env.INTEGRATION_SERVICE_API_URL!,
      "POST",
      "/critical/operation",
      data,
      undefined, // no query params
      3, // max 3 retries
      1000 // 1 second base delay
    );

    console.log("Critical operation completed:", result);
  } catch (error) {
    console.error("Critical operation failed after retries:", error);
    throw error;
  }
}
```

## Error Handling

All request signing functions throw errors that should be caught and handled appropriately:

```typescript
try {
  const result = await invokeIntegrationService("/endpoint", "POST", data);
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    console.error("Request failed:", error.message);

    // Check for specific error types
    if (error.message.includes("403")) {
      // Handle authorization error
    } else if (error.message.includes("429")) {
      // Handle rate limiting
    } else if (error.message.includes("500")) {
      // Handle server error
    }
  }

  // Decide whether to retry, fail, or use fallback
}
```

## Best Practices

### 1. Use Service-Specific Helpers

Prefer `invokeAiService`, `invokeIntegrationService`, etc. over the generic `invokeApiGateway`:

```typescript
// Good
await invokeAiService("/generate", "POST", data);

// Less preferred (but still valid)
await invokeApiGateway(
  process.env.AI_SERVICE_API_URL!,
  "POST",
  "/generate",
  data
);
```

### 2. Handle Errors Gracefully

Always wrap cross-service calls in try-catch blocks:

```typescript
try {
  await invokeIntegrationService("/endpoint", "POST", data);
} catch (error) {
  console.error("Service call failed:", error);
  // Implement fallback or graceful degradation
}
```

### 3. Use Appropriate HTTP Methods

Follow REST conventions:

- `GET` - Retrieve data
- `POST` - Create resources or trigger actions
- `PUT` - Update resources
- `DELETE` - Remove resources

### 4. Include Trace IDs

Always include trace IDs for distributed tracing:

```typescript
await invokeIntegrationService("/endpoint", "POST", {
  ...data,
  traceId: process.env._X_AMZN_TRACE_ID,
});
```

### 5. Log Cross-Service Calls

Log all cross-service communications for debugging:

```typescript
console.log("Calling Integration Service:", {
  endpoint: "/publish",
  userId,
  contentId,
});

const result = await invokeIntegrationService("/publish", "POST", data);

console.log("Integration Service response:", {
  success: result.success,
  duration: Date.now() - startTime,
});
```

### 6. Implement Circuit Breakers

For production systems, implement circuit breaker patterns:

```typescript
import { CircuitBreaker } from "./circuit-breaker";

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
});

async function callServiceWithCircuitBreaker(data: any) {
  return breaker.execute(async () => {
    return await invokeIntegrationService("/endpoint", "POST", data);
  });
}
```

### 7. Use Timeouts

Set appropriate timeouts for cross-service calls:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const result = await invokeIntegrationService("/endpoint", "POST", data);
  return result;
} finally {
  clearTimeout(timeout);
}
```

## Environment Variables

Ensure these environment variables are set in your Lambda function configuration:

```yaml
Environment:
  Variables:
    AI_SERVICE_API_URL: !Sub "https://${AiServiceApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
    INTEGRATION_SERVICE_API_URL: !Sub "https://${IntegrationServiceApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
    BACKGROUND_SERVICE_API_URL: !Sub "https://${BackgroundServiceApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
    ADMIN_SERVICE_API_URL: !Sub "https://${AdminServiceApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
```

## Testing

### Unit Testing

Mock the request signing functions in your tests:

```typescript
jest.mock("./utils/request-signer", () => ({
  invokeIntegrationService: jest.fn().mockResolvedValue({ success: true }),
}));

test("should call Integration Service", async () => {
  await processJob(mockJob);

  expect(invokeIntegrationService).toHaveBeenCalledWith(
    "/publish",
    "POST",
    expect.objectContaining({
      userId: "test-user",
      contentId: "test-content",
    })
  );
});
```

### Integration Testing

Test actual cross-service communication in integration tests:

```typescript
describe("Cross-Service Integration", () => {
  it("should successfully call Integration Service", async () => {
    const result = await invokeIntegrationService("/health", "GET");
    expect(result.status).toBe("healthy");
  });
});
```

## Security Considerations

1. **IAM Permissions**: Ensure Lambda execution roles have `execute-api:Invoke` permissions
2. **API Gateway Authorization**: Configure IAM authorization on API Gateway endpoints
3. **Secrets Management**: Never hardcode credentials; use AWS Secrets Manager
4. **Network Security**: Use VPC endpoints for private communication when possible
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Input Validation**: Always validate data before sending to other services

## Troubleshooting

### Common Issues

#### 1. "API Gateway URL not set" Error

**Cause**: Environment variable not configured
**Solution**: Add the required environment variable to your Lambda function

#### 2. 403 Forbidden Error

**Cause**: IAM permissions not configured correctly
**Solution**: Add `execute-api:Invoke` permission to Lambda execution role

#### 3. Timeout Errors

**Cause**: Downstream service taking too long
**Solution**: Increase Lambda timeout or implement async patterns

#### 4. Network Errors

**Cause**: Network connectivity issues
**Solution**: Check VPC configuration and security groups

## Migration Guide

### Before (Direct HTTP Calls)

```typescript
// Old approach - no authentication
const response = await fetch(`${apiUrl}/endpoint`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

### After (Signed Requests)

```typescript
// New approach - authenticated and signed
import { invokeIntegrationService } from "./utils/request-signer";

const result = await invokeIntegrationService("/endpoint", "POST", data);
```

## Related Documentation

- [Request Signing Guide](./REQUEST_SIGNING_GUIDE.md)
- [EventBridge Integration](./EVENTBRIDGE_README.md)
- [Trace Correlation Guide](../../aws/logging/TRACE_CORRELATION_GUIDE.md)
- [API Gateway Security](../../../docs/api-gateway-microservices.md)

## Support

For questions or issues with cross-service communication:

1. Check CloudWatch Logs for detailed error messages
2. Verify IAM permissions and API Gateway configuration
3. Test with the health check endpoints first
4. Review X-Ray traces for request flow visualization
