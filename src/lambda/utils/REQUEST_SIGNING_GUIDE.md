# AWS Signature V4 Request Signing Guide

This guide explains how to use the request signing utility for secure service-to-service communication in the microservices architecture.

## Overview

The request signer provides utilities for signing HTTP requests to API Gateway endpoints using AWS Signature Version 4. This ensures that only authorized Lambda functions can invoke other services' API Gateway endpoints.

## Why Request Signing?

- **Security**: Ensures requests are authenticated using AWS IAM credentials
- **Authorization**: API Gateway validates that the caller has proper IAM permissions
- **Integrity**: Prevents request tampering through cryptographic signatures
- **Non-repudiation**: Provides audit trail of which service made which requests

## Basic Usage

### Import the Utility

```typescript
import {
  invokeAiService,
  invokeIntegrationService,
  invokeBackgroundService,
  invokeAdminService,
  invokeApiGateway,
  signRequest,
} from "./utils/request-signer";
```

### Invoke AI Service

```typescript
// Submit an AI job
const result = await invokeAiService("/jobs", "POST", {
  jobType: "blog-post",
  topic: "Real Estate Market Trends",
  tone: "professional",
});

// Get job status
const status = await invokeAiService(`/jobs/${jobId}`, "GET");
```

### Invoke Integration Service

```typescript
// Trigger MLS sync
const syncResult = await invokeIntegrationService("/mls/sync", "POST", {
  userId: "user123",
  provider: "mlsgrid",
});

// Get sync status
const syncStatus = await invokeIntegrationService(
  `/mls/status/${syncId}`,
  "GET"
);
```

### Invoke Background Service

```typescript
// Trigger analytics sync
const analyticsResult = await invokeBackgroundService(
  "/analytics/sync",
  "POST",
  {
    userId: "user123",
    channels: ["facebook", "instagram"],
  }
);
```

### Invoke Admin Service

```typescript
// Get system health
const health = await invokeAdminService("/health", "GET");

// Get user list (admin only)
const users = await invokeAdminService("/users", "GET", null, {
  limit: "50",
  offset: "0",
});
```

## Advanced Usage

### Custom API Gateway Invocation

```typescript
import { invokeApiGateway } from "./utils/request-signer";

const result = await invokeApiGateway(
  "https://abc123.execute-api.us-east-1.amazonaws.com/v1",
  "POST",
  "/custom/endpoint",
  { data: "value" },
  { param: "value" },
  { "Custom-Header": "value" }
);
```

### Manual Request Signing

```typescript
import { signRequest } from "./utils/request-signer";

const signedRequest = await signRequest({
  method: "POST",
  hostname: "abc123.execute-api.us-east-1.amazonaws.com",
  path: "/v1/endpoint",
  body: JSON.stringify({ data: "value" }),
  headers: { "Content-Type": "application/json" },
  queryParams: { param: "value" },
  region: "us-east-1",
  service: "execute-api",
});

// Use signedRequest.url, signedRequest.headers, signedRequest.body
const response = await fetch(signedRequest.url, {
  method: signedRequest.method,
  headers: signedRequest.headers,
  body: signedRequest.body,
});
```

### Batch Invocations

```typescript
import { batchInvokeApiGateway } from "./utils/request-signer";

const results = await batchInvokeApiGateway([
  {
    apiUrl: process.env.AI_SERVICE_API_URL!,
    method: "POST",
    path: "/jobs",
    body: { jobType: "blog-post", topic: "Topic 1" },
  },
  {
    apiUrl: process.env.AI_SERVICE_API_URL!,
    method: "POST",
    path: "/jobs",
    body: { jobType: "social-media", topic: "Topic 2" },
  },
]);
```

### Retry Logic

```typescript
import { invokeApiGatewayWithRetry } from "./utils/request-signer";

const result = await invokeApiGatewayWithRetry(
  process.env.AI_SERVICE_API_URL!,
  "POST",
  "/jobs",
  { jobType: "blog-post", topic: "Real Estate" },
  {},
  3, // max retries
  1000 // initial retry delay in ms
);
```

## Environment Variables

The request signer requires the following environment variables to be set:

```bash
AI_SERVICE_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com/v1
INTEGRATION_SERVICE_API_URL=https://def456.execute-api.us-east-1.amazonaws.com/v1
BACKGROUND_SERVICE_API_URL=https://ghi789.execute-api.us-east-1.amazonaws.com/v1
ADMIN_SERVICE_API_URL=https://jkl012.execute-api.us-east-1.amazonaws.com/v1
AWS_REGION=us-east-1
```

These are automatically set by the SAM template in the Lambda function environment.

## IAM Permissions

Lambda functions must have the following IAM permissions to invoke other services:

```yaml
- Effect: Allow
  Action:
    - execute-api:Invoke
  Resource:
    - arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/*
```

This is already configured in the SAM template for all service Lambda roles.

## Error Handling

```typescript
try {
  const result = await invokeAiService("/jobs", "POST", jobData);
  console.log("Job submitted:", result);
} catch (error) {
  if (error instanceof Error) {
    console.error("Failed to submit job:", error.message);

    // Check if it's an API Gateway error
    if (error.message.includes("403")) {
      console.error("Permission denied - check IAM policies");
    } else if (error.message.includes("404")) {
      console.error("Endpoint not found");
    } else if (error.message.includes("500")) {
      console.error("Service error - check service logs");
    }
  }

  // Implement fallback or retry logic
  throw error;
}
```

## Best Practices

1. **Use Service-Specific Functions**: Prefer `invokeAiService()`, `invokeIntegrationService()`, etc. over generic `invokeApiGateway()`
2. **Implement Retry Logic**: Use `invokeApiGatewayWithRetry()` for critical operations
3. **Handle Errors Gracefully**: Always wrap invocations in try-catch blocks
4. **Log Requests**: Log service-to-service calls for debugging and audit trails
5. **Use Batch Operations**: When making multiple calls, use `batchInvokeApiGateway()` for better performance
6. **Set Timeouts**: Configure appropriate timeouts for Lambda functions making service calls
7. **Monitor Performance**: Track latency and error rates for service-to-service calls

## Example: AI Service Lambda Calling Integration Service

```typescript
import { invokeIntegrationService } from "./utils/request-signer";
import { AWSXRay } from "aws-xray-sdk-core";

export const handler = async (event: any) => {
  // Start X-Ray subsegment for service call
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment("InvokeIntegrationService");

  try {
    // Call Integration Service to sync MLS data
    const syncResult = await invokeIntegrationService("/mls/sync", "POST", {
      userId: event.userId,
      provider: "mlsgrid",
    });

    console.log("MLS sync triggered:", syncResult);

    subsegment?.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "AI job completed and MLS sync triggered",
        syncId: syncResult.syncId,
      }),
    };
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();

    console.error("Failed to trigger MLS sync:", error);

    // Continue with AI job even if sync fails
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "AI job completed (MLS sync failed)",
        warning: "MLS sync could not be triggered",
      }),
    };
  }
};
```

## Testing

### Unit Testing

```typescript
import { signRequest } from "./utils/request-signer";

describe("Request Signer", () => {
  it("should sign a request with correct headers", async () => {
    const signed = await signRequest({
      method: "POST",
      hostname: "api.example.com",
      path: "/test",
      body: JSON.stringify({ test: "data" }),
    });

    expect(signed.headers).toHaveProperty("Authorization");
    expect(signed.headers).toHaveProperty("X-Amz-Date");
    expect(signed.headers["Authorization"]).toContain("AWS4-HMAC-SHA256");
  });
});
```

### Integration Testing

```typescript
import { invokeAiService } from "./utils/request-signer";

describe("AI Service Integration", () => {
  it("should successfully invoke AI service", async () => {
    const result = await invokeAiService("/jobs", "POST", {
      jobType: "blog-post",
      topic: "Test Topic",
    });

    expect(result).toHaveProperty("jobId");
    expect(result.status).toBe("submitted");
  });
});
```

## Troubleshooting

### "Permission denied" errors

- Check that the Lambda execution role has `execute-api:Invoke` permission
- Verify the API Gateway resource ARN in the IAM policy
- Ensure the API Gateway has IAM authentication enabled

### "Signature does not match" errors

- Verify AWS credentials are available in the Lambda environment
- Check that the region is correctly set
- Ensure the request body is not modified after signing

### "Endpoint not found" errors

- Verify the API Gateway URL environment variable is set correctly
- Check that the path starts with `/` and matches the API Gateway resource
- Ensure the API Gateway stage is deployed

### Timeout errors

- Increase Lambda timeout if making multiple service calls
- Implement retry logic with exponential backoff
- Consider using async patterns for non-critical calls

## Security Considerations

1. **Never Log Credentials**: The signer uses AWS credentials from the Lambda environment - never log these
2. **Use HTTPS Only**: All API Gateway endpoints must use HTTPS
3. **Validate Responses**: Always validate responses from other services
4. **Implement Rate Limiting**: Protect against cascading failures
5. **Monitor for Anomalies**: Track unusual patterns in service-to-service calls
6. **Rotate Credentials**: AWS automatically rotates Lambda execution role credentials
7. **Least Privilege**: Grant only necessary API Gateway invoke permissions

## Performance Optimization

1. **Reuse Connections**: The signer uses fetch which reuses connections
2. **Parallel Calls**: Use `batchInvokeApiGateway()` for independent calls
3. **Cache Signatures**: Signatures are valid for 5 minutes - consider caching for repeated calls
4. **Async Patterns**: Use async invocations for non-critical operations
5. **Circuit Breakers**: Implement circuit breakers to prevent cascading failures

## Related Documentation

- [API Gateway Configuration](../../aws/api-gateway/config.ts)
- [X-Ray Distributed Tracing](../../aws/xray/README.md)
- [Circuit Breaker Pattern](./circuit-breaker.ts)
- [Error Handling Framework](../../aws/logging/error-handler.ts)
