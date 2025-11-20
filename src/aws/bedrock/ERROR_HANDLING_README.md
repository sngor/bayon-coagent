# Kiro AI Assistant Error Handling and Logging

Comprehensive error handling, logging, and retry system for the Kiro AI Assistant.

## Overview

This system provides:

1. **Structured Logging** - CloudWatch-integrated logging with component-specific loggers
2. **Retry Logic** - Exponential backoff retry for transient failures
3. **Circuit Breakers** - Prevent cascading failures in external API calls
4. **Error Boundaries** - React error boundaries for graceful UI error handling
5. **Performance Metrics** - Track operation duration and success rates

## Components

### 1. Kiro Logger (`kiro-logger.ts`)

Component-specific structured logging with CloudWatch integration.

```typescript
import { createGuardrailsLogger } from "@/aws/bedrock/error-handling";

const logger = createGuardrailsLogger({ userId: "user123" });

// Log guardrails check
logger.logGuardrailsCheck(true);

// Log violation
logger.logGuardrailsViolation({
  type: "out-of-domain",
  query: "sanitized query",
  timestamp: new Date(),
});

// Log workflow
logger.logWorkflowStart("wf-123");
logger.logWorkflowComplete("wf-123", metrics);

// Log performance
logger.logPerformance({
  operation: "citation-validation",
  duration: 150,
  success: true,
});
```

**Available Loggers:**

- `createGuardrailsLogger()` - For guardrails component
- `createOrchestratorLogger()` - For workflow orchestrator
- `createWorkerLogger(type)` - For worker agents
- `createCitationLogger()` - For citation service
- `createVisionLogger()` - For vision agent
- `createSearchLogger()` - For parallel search
- `createProfileLogger()` - For profile management

### 2. Retry Utilities (`retry-utils.ts`)

Exponential backoff retry logic for transient failures.

```typescript
import { retryBedrockOperation } from "@/aws/bedrock/error-handling";

// Retry a Bedrock operation
const result = await retryBedrockOperation(
  async () => {
    return await bedrockClient.invoke(prompt, schema);
  },
  "Data Analysis",
  logger
);
```

**Retry Configurations:**

- `BEDROCK_RETRY_CONFIG` - 3 attempts, 1s-10s delay
- `DYNAMODB_RETRY_CONFIG` - 3 attempts, 500ms-5s delay
- `EXTERNAL_API_RETRY_CONFIG` - 2 attempts, 2s-8s delay

**Retry Functions:**

- `retryBedrockOperation()` - For Bedrock API calls
- `retryDynamoDBOperation()` - For DynamoDB operations
- `retryExternalAPICall()` - For external APIs
- `retryBatchOperations()` - For parallel operations with partial success

### 3. DynamoDB Retry Wrapper (`dynamodb/retry-wrapper.ts`)

Retry-wrapped DynamoDB operations.

```typescript
import {
  getItemWithRetry,
  putItemWithRetry,
  queryWithRetry,
} from "@/aws/bedrock/error-handling";

// Get item with retry
const profile = await getItemWithRetry({
  TableName: "BayonCoAgent",
  Key: { PK: "USER#user123", SK: "PROFILE#AGENT" },
});

// Put item with retry
await putItemWithRetry({
  TableName: "BayonCoAgent",
  Item: profile,
});

// Query with retry
const items = await queryWithRetry({
  TableName: "BayonCoAgent",
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: { ":pk": "USER#user123" },
});
```

**Available Operations:**

- `getItemWithRetry()`
- `putItemWithRetry()`
- `updateItemWithRetry()`
- `deleteItemWithRetry()`
- `queryWithRetry()`
- `scanWithRetry()`
- `queryAllWithRetry()` - Auto-pagination
- `scanAllWithRetry()` - Auto-pagination
- `transactWriteWithRetry()`
- `conditionalPutWithRetry()`
- `conditionalUpdateWithRetry()`

### 4. External API Wrapper (`external-api-wrapper.ts`)

Retry and circuit breaker for external API calls.

```typescript
import {
  callChatGPTWithRetry,
  callAPIsInParallel,
} from "@/aws/bedrock/error-handling";

// Single API call with retry
const result = await callChatGPTWithRetry(async () => {
  return await fetch("https://api.openai.com/...");
}, "Search Query");

// Parallel API calls with partial success
const results = await callAPIsInParallel([
  { platform: "ChatGPT", operation: () => searchChatGPT(query) },
  { platform: "Gemini", operation: () => searchGemini(query) },
  { platform: "Claude", operation: () => searchClaude(query) },
]);

const successful = results.filter((r) => r.success);
```

**Available Functions:**

- `callChatGPTWithRetry()` - ChatGPT API with circuit breaker
- `callGeminiWithRetry()` - Gemini API with circuit breaker
- `callClaudeWithRetry()` - Claude API with circuit breaker
- `callTavilyWithRetry()` - Tavily Search with circuit breaker
- `callAPIsInParallel()` - Parallel calls with partial success
- `httpRequestWithRetry()` - Generic HTTP request with retry
- `callWithFallback()` - Call with fallback value
- `callWithFailover()` - Try multiple APIs in sequence

### 5. Circuit Breaker

Prevents cascading failures by opening circuit after threshold failures.

```typescript
import { getCircuitBreakerStatus } from "@/aws/bedrock/error-handling";

// Check circuit breaker status
const status = getCircuitBreakerStatus();
console.log("ChatGPT:", status.chatGPT.state); // CLOSED, OPEN, or HALF_OPEN
console.log("Failures:", status.chatGPT.failureCount);
```

**Circuit States:**

- `CLOSED` - Normal operation
- `OPEN` - Failing, reject requests immediately
- `HALF_OPEN` - Testing if service recovered

**Configuration:**

- Failure threshold: 3 failures
- Reset timeout: 60 seconds
- Monitoring window: 5 minutes

### 6. Error Boundaries (`error-boundaries.tsx`)

React error boundaries for graceful UI error handling.

```typescript
import {
  ChatErrorBoundary,
  VisionErrorBoundary,
  ProfileErrorBoundary,
  AIOperationErrorBoundary,
  WorkflowErrorBoundary,
} from "@/aws/bedrock/error-handling";

// Chat interface
function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatInterface />
    </ChatErrorBoundary>
  );
}

// Vision analysis
function VisionPage() {
  return (
    <VisionErrorBoundary>
      <VisionInterface />
    </VisionErrorBoundary>
  );
}

// AI operation
function AIFeature() {
  return (
    <AIOperationErrorBoundary operationName="Market Analysis">
      <MarketAnalysisComponent />
    </AIOperationErrorBoundary>
  );
}
```

**Available Boundaries:**

- `ChatErrorBoundary` - For chat interface
- `VisionErrorBoundary` - For vision analysis
- `ProfileErrorBoundary` - For profile management
- `AIOperationErrorBoundary` - For AI operations
- `WorkflowErrorBoundary` - For workflow orchestrator
- `InlineErrorDisplay` - For inline error display

## Error Classification

### Retryable Errors

Errors that should trigger retry logic:

- `ThrottlingException` - Rate limiting
- `ServiceUnavailableException` - Service down
- `InternalServerException` - Server error
- `TimeoutError` - Request timeout
- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)

### Non-Retryable Errors

Errors that should NOT trigger retry:

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Schema validation errors

## Performance Metrics

Track operation performance with metrics:

```typescript
import {
  recordMetric,
  getAggregatedMetrics,
} from "@/aws/bedrock/error-handling";

// Record a metric
recordMetric("workflow.duration", 1500);
recordMetric("citation.validation.duration", 200);

// Get aggregated metrics
const metrics = getAggregatedMetrics();
console.log("Average workflow duration:", metrics["workflow.duration"].average);
console.log("Total workflows:", metrics["workflow.duration"].count);
```

**Tracked Metrics:**

- `workflow.duration` - Workflow execution time
- `worker.duration` - Worker agent execution time
- `citation.validation.duration` - Citation validation time
- `bedrock.duration` - Bedrock API call time
- `profile.retrieval.duration` - Profile retrieval time

## Best Practices

### 1. Always Use Retry Wrappers

```typescript
// ❌ Bad - No retry logic
const profile = await getItem({ TableName, Key });

// ✅ Good - With retry logic
const profile = await getItemWithRetry({ TableName, Key });
```

### 2. Use Component-Specific Loggers

```typescript
// ❌ Bad - Generic logger
logger.info("Guardrails check passed");

// ✅ Good - Component-specific logger
const guardrailsLogger = createGuardrailsLogger({ userId });
guardrailsLogger.logGuardrailsCheck(true);
```

### 3. Wrap UI Components in Error Boundaries

```typescript
// ❌ Bad - No error boundary
function Page() {
  return <ChatInterface />;
}

// ✅ Good - With error boundary
function Page() {
  return (
    <ChatErrorBoundary>
      <ChatInterface />
    </ChatErrorBoundary>
  );
}
```

### 4. Use Circuit Breakers for External APIs

```typescript
// ❌ Bad - Direct call without circuit breaker
const result = await fetch("https://api.openai.com/...");

// ✅ Good - With circuit breaker
const result = await callChatGPTWithRetry(
  async () => fetch("https://api.openai.com/..."),
  "Search Query"
);
```

### 5. Handle Partial Success in Parallel Operations

```typescript
// ✅ Good - Handle partial success
const results = await callAPIsInParallel([...]);
const successful = results.filter(r => r.success);

if (successful.length === 0) {
  throw new Error('All APIs failed');
}

// Use successful results even if some failed
return analyzeResults(successful.map(r => r.data));
```

## Monitoring and Alerting

### CloudWatch Logs

All logs are sent to CloudWatch in production:

- Log group: `/aws/lambda/kiro-ai-assistant`
- Structured JSON format
- Searchable by component, userId, workflowId, etc.

### CloudWatch Metrics

Key metrics to monitor:

- Guardrails violation rate
- Workflow success rate
- Worker failure rate
- Citation validation success rate
- Profile retrieval latency
- Circuit breaker state changes

### Recommended Alarms

1. **High Guardrails Violation Rate**

   - Threshold: > 10% of requests
   - Action: Review guardrails configuration

2. **High Worker Failure Rate**

   - Threshold: > 5% of tasks
   - Action: Check Bedrock service status

3. **Slow Profile Retrieval**

   - Threshold: > 500ms average
   - Action: Check DynamoDB performance

4. **Circuit Breaker Open**
   - Threshold: Any circuit open for > 5 minutes
   - Action: Check external API status

## Testing

### Unit Tests

Test retry logic and error handling:

```typescript
import { retryOperation, isRetryableError } from "@/aws/bedrock/error-handling";

describe("Retry Logic", () => {
  it("should retry on throttling error", async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("ThrottlingException");
      }
      return "success";
    };

    const result = await retryOperation({
      operation,
      operationName: "Test",
    });

    expect(result.result).toBe("success");
    expect(result.attempts).toBe(3);
  });

  it("should not retry validation errors", () => {
    const error = new Error("ValidationException");
    expect(isRetryableError(error, BEDROCK_RETRY_CONFIG)).toBe(false);
  });
});
```

### Integration Tests

Test error boundaries and logging:

```typescript
import { render } from "@testing-library/react";
import { ChatErrorBoundary } from "@/aws/bedrock/error-handling";

describe("ChatErrorBoundary", () => {
  it("should catch and display errors", () => {
    const ThrowError = () => {
      throw new Error("Test error");
    };

    const { getByText } = render(
      <ChatErrorBoundary>
        <ThrowError />
      </ChatErrorBoundary>
    );

    expect(getByText(/Chat Error/i)).toBeInTheDocument();
    expect(getByText(/Test error/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Issue: Retry exhausted but operation should succeed

**Solution:** Check if error is classified as retryable:

```typescript
import { isRetryableError } from "@/aws/bedrock/error-handling";

const error = new Error("Your error");
console.log("Retryable:", isRetryableError(error, BEDROCK_RETRY_CONFIG));
```

### Issue: Circuit breaker stuck open

**Solution:** Check circuit breaker status and reset if needed:

```typescript
import { getCircuitBreakerStatus } from "@/aws/bedrock/error-handling";

const status = getCircuitBreakerStatus();
// Circuit will auto-reset after timeout (60s)
// Or restart the service to reset all circuits
```

### Issue: Logs not appearing in CloudWatch

**Solution:** Check environment configuration:

```typescript
import { getConfig } from "@/aws/config";

const config = getConfig();
console.log("Environment:", config.environment);
// Logs only go to CloudWatch in 'production' environment
```

## Related Documentation

- [AWS Bedrock Client](./client.ts)
- [DynamoDB Repository](../dynamodb/repository.ts)
- [CloudWatch Logging](../logging/README.md)
- [Error Handling Library](../../lib/error-handling.ts)
