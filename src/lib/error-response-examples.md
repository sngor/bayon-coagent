# Unified Error Response Format - Usage Examples

This document provides examples of how to use the unified error response format across all microservices.

## Overview

The unified error response format ensures consistent error handling across all Lambda functions and API Gateway endpoints. It includes:

- Standard error codes
- Trace IDs for distributed tracing
- Correlation IDs for log aggregation
- Fallback information for graceful degradation
- User-friendly error messages

## Basic Usage

### API Gateway Lambda Functions

For Lambda functions that return API Gateway responses:

```typescript
import {
  formatErrorResponse,
  formatSuccessResponse,
  toAPIGatewayResponse,
  toAPIGatewaySuccessResponse,
  ErrorCode,
} from "../lib/error-response";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Your business logic here
    const result = await processRequest(event);

    // Format success response
    const successResponse = formatSuccessResponse(
      result,
      "Request processed successfully"
    );

    return toAPIGatewaySuccessResponse(successResponse);
  } catch (error) {
    // Format error response
    const errorResponse = formatErrorResponse(error as Error, {
      service: "my-service-name",
      code: ErrorCode.INTERNAL_ERROR,
      userId: event.requestContext.authorizer?.userId,
      requestId: event.requestContext.requestId,
      path: event.path,
      method: event.httpMethod,
      retryable: true,
    });

    return toAPIGatewayResponse(errorResponse);
  }
}
```

### SQS Lambda Functions

For Lambda functions that process SQS messages:

```typescript
import { formatErrorResponse, ErrorCode } from "../lib/error-response";

async function processJob(record: SQSRecord): Promise<void> {
  const job = JSON.parse(record.body);

  try {
    // Process the job
    const result = await processJobLogic(job);

    // Update job status to completed
    await updateJobStatus(job.jobId, "completed", result);
  } catch (error) {
    // Format error response
    const errorResponse = formatErrorResponse(error as Error, {
      service: "job-processor",
      code: ErrorCode.JOB_PROCESSING_ERROR,
      userId: job.userId,
      requestId: job.jobId,
      retryable: true,
      additionalDetails: {
        jobType: job.type,
        attemptNumber: record.attributes.ApproximateReceiveCount,
      },
    });

    console.error("Job processing failed:", JSON.stringify(errorResponse));

    // Update job status with error
    await updateJobStatus(
      job.jobId,
      "failed",
      undefined,
      JSON.stringify(errorResponse)
    );

    // Re-throw to trigger SQS retry/DLQ
    throw error;
  }
}
```

## Error Codes

### Client Errors (4xx)

```typescript
// Bad request - invalid input
ErrorCode.BAD_REQUEST;

// Unauthorized - authentication required
ErrorCode.UNAUTHORIZED;

// Forbidden - insufficient permissions
ErrorCode.FORBIDDEN;

// Not found - resource doesn't exist
ErrorCode.NOT_FOUND;

// Conflict - resource already exists
ErrorCode.CONFLICT;

// Validation error - input validation failed
ErrorCode.VALIDATION_ERROR;

// Rate limit exceeded
ErrorCode.RATE_LIMIT_EXCEEDED;
```

### Server Errors (5xx)

```typescript
// Internal server error
ErrorCode.INTERNAL_ERROR;

// Service unavailable
ErrorCode.SERVICE_UNAVAILABLE;

// Gateway timeout
ErrorCode.GATEWAY_TIMEOUT;
```

### Service-Specific Errors

```typescript
// AI service error
ErrorCode.AI_SERVICE_ERROR;

// Integration service error
ErrorCode.INTEGRATION_ERROR;

// Database error
ErrorCode.DATABASE_ERROR;

// External API error
ErrorCode.EXTERNAL_API_ERROR;
```

### OAuth Errors

```typescript
// Generic OAuth error
ErrorCode.OAUTH_ERROR;

// Token exchange failed
ErrorCode.TOKEN_EXCHANGE_FAILED;

// Invalid state parameter
ErrorCode.INVALID_STATE;

// Expired state parameter
ErrorCode.EXPIRED_STATE;
```

### Job Processing Errors

```typescript
// Job processing error
ErrorCode.JOB_PROCESSING_ERROR;

// Job timeout
ErrorCode.JOB_TIMEOUT;

// Job cancelled
ErrorCode.JOB_CANCELLED;
```

## Error Response Structure

```typescript
{
    error: {
        code: "AI_SERVICE_ERROR",
        message: "Failed to generate blog post",
        severity: "high",
        details: {
            service: "ai-blog-post-generator",
            timestamp: "2024-01-15T10:30:00.000Z",
            traceId: "1-5f8a1234-abcd1234efgh5678ijkl9012",
            correlationId: "abc123-def456-ghi789",
            requestId: "job-12345",
            userId: "user-67890",
            statusCode: 500
        },
        fallback: {
            available: true,
            type: "cached",
            data: { /* cached response */ },
            message: "Using cached response from previous request"
        },
        retryable: true,
        retryAfter: 30
    }
}
```

## Success Response Structure

```typescript
{
    success: true,
    data: {
        // Your response data
    },
    message: "Operation completed successfully",
    metadata: {
        traceId: "1-5f8a1234-abcd1234efgh5678ijkl9012",
        correlationId: "abc123-def456-ghi789",
        timestamp: "2024-01-15T10:30:00.000Z"
    }
}
```

## Examples by Service

### AI Service

```typescript
// AI job processing error
const errorResponse = formatErrorResponse(error, {
  service: "ai-blog-post-generator",
  code: ErrorCode.AI_SERVICE_ERROR,
  userId: job.userId,
  requestId: job.jobId,
  retryable: true,
  additionalDetails: {
    jobType: "blog-post",
    topic: job.topic,
  },
});
```

### Integration Service

```typescript
// OAuth error
const errorResponse = formatErrorResponse("Token exchange failed", {
  service: "integration-google-oauth",
  code: ErrorCode.TOKEN_EXCHANGE_FAILED,
  userId: stateData.userId,
  path: event.path,
  method: event.httpMethod,
  retryable: true,
  additionalDetails: {
    provider: "google",
    oauthError: errorData.error,
  },
});
```

### Background Service

```typescript
// Job timeout error
const errorResponse = formatErrorResponse(
  "Job exceeded maximum execution time",
  {
    service: "background-processor",
    code: ErrorCode.JOB_TIMEOUT,
    userId: job.userId,
    requestId: job.jobId,
    retryable: false,
    additionalDetails: {
      executionTime: executionTimeMs,
      maxExecutionTime: maxExecutionTimeMs,
    },
  }
);
```

## Fallback Information

When a service degrades gracefully, include fallback information:

```typescript
const errorResponse = formatErrorResponse(error, {
  service: "ai-service",
  code: ErrorCode.AI_SERVICE_ERROR,
  userId: userId,
  fallback: {
    available: true,
    type: "cached",
    data: cachedResponse,
    message: "Using cached response from previous request",
  },
  retryable: true,
});
```

Fallback types:

- `cached` - Using cached data
- `default` - Using default/placeholder data
- `alternative_service` - Using alternative service
- `queued` - Request queued for later processing

## User-Friendly Messages

The error response utility automatically generates user-friendly messages based on error codes:

```typescript
import { createUserFriendlyMessage, ErrorCode } from "../lib/error-response";

const message = createUserFriendlyMessage(ErrorCode.SERVICE_UNAVAILABLE);
// Returns: "The service is temporarily unavailable. Please try again in a few moments."
```

## Trace ID Integration

The error response format automatically includes trace IDs from X-Ray:

```typescript
// Trace ID is automatically captured from X-Ray context
const errorResponse = formatErrorResponse(error, {
  service: "my-service",
  code: ErrorCode.INTERNAL_ERROR,
});

// errorResponse.error.details.traceId will contain the X-Ray trace ID
```

## Best Practices

1. **Always use the unified format** for all API Gateway responses
2. **Include trace IDs** in all error responses for debugging
3. **Provide fallback information** when graceful degradation occurs
4. **Use appropriate error codes** for different error types
5. **Include user-friendly messages** for client-facing errors
6. **Mark errors as retryable** when appropriate
7. **Add additional context** in the `additionalDetails` field
8. **Log the full error response** for debugging

## Migration Guide

### Before (Old Format)

```typescript
return {
  statusCode: 500,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify({
    error: {
      code: "INTERNAL_ERROR",
      message: error.message,
    },
  }),
};
```

### After (New Format)

```typescript
const { formatErrorResponse, ErrorCode, toAPIGatewayResponse } = await import(
  "../lib/error-response"
);

const errorResponse = formatErrorResponse(error, {
  service: "my-service",
  code: ErrorCode.INTERNAL_ERROR,
  userId: userId,
  requestId: requestId,
  path: event.path,
  method: event.httpMethod,
});

return toAPIGatewayResponse(errorResponse);
```

## Testing

Test error responses to ensure they include all required fields:

```typescript
import { formatErrorResponse, ErrorCode } from "../lib/error-response";

describe("Error Response Format", () => {
  it("should include trace ID", () => {
    const errorResponse = formatErrorResponse(new Error("Test error"), {
      service: "test-service",
      code: ErrorCode.INTERNAL_ERROR,
    });

    expect(errorResponse.error.details.traceId).toBeDefined();
  });

  it("should include timestamp", () => {
    const errorResponse = formatErrorResponse(new Error("Test error"), {
      service: "test-service",
      code: ErrorCode.INTERNAL_ERROR,
    });

    expect(errorResponse.error.details.timestamp).toBeDefined();
  });
});
```
