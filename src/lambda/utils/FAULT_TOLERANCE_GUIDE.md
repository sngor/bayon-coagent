# Fault Tolerance and Recovery Guide

This guide explains how to use the retry logic and circuit breaker utilities to build resilient microservices.

## Overview

The fault tolerance utilities provide two complementary patterns:

1. **Retry Logic**: Automatically retry failed operations with exponential backoff
2. **Circuit Breaker**: Prevent cascading failures by failing fast when a service is down

## Retry Logic

### Basic Usage

```typescript
import { retry } from "./retry";

// Simple retry with defaults (3 attempts, 100ms initial delay, 2x backoff)
const result = await retry(async () => {
  return await fetchDataFromService();
});
```

### Custom Configuration

```typescript
import { retry } from "./retry";

const result = await retry(async () => await fetchDataFromService(), {
  maxAttempts: 5, // Try up to 5 times
  initialDelayMs: 200, // Start with 200ms delay
  backoffMultiplier: 2, // Double delay each time
  maxDelayMs: 5000, // Cap delay at 5 seconds
  useJitter: true, // Add randomness to prevent thundering herd
  onRetry: (error, attempt, delayMs) => {
    console.log(
      `Retry attempt ${attempt} after ${delayMs}ms due to:`,
      error.message
    );
  },
});
```

### Custom Retry Logic

```typescript
import { retry } from "./retry";

const result = await retry(async () => await fetchDataFromService(), {
  maxAttempts: 3,
  isRetryable: (error) => {
    // Only retry on specific errors
    return (
      error.message.includes("timeout") || error.message.includes("rate limit")
    );
  },
});
```

### Non-Throwing Retry

```typescript
import { retryWithResult } from "./retry";

const result = await retryWithResult(async () => await fetchDataFromService(), {
  maxAttempts: 3,
});

if (result.success) {
  console.log("Success after", result.attempts, "attempts:", result.data);
} else {
  console.error("Failed after", result.attempts, "attempts:", result.error);
}
```

### Making Functions Retryable

```typescript
import { makeRetryable } from "./retry";

// Create a retryable version of a function
const retryableFetch = makeRetryable(
  async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  { maxAttempts: 3, initialDelayMs: 100 }
);

// Use it like a normal function
const data = await retryableFetch("https://api.example.com/data");
```

## Circuit Breaker

### Basic Usage

```typescript
import { CircuitBreaker } from "./circuit-breaker";

// Create a circuit breaker for a service
const breaker = new CircuitBreaker("external-api", {
  failureThreshold: 5, // Open after 5 failures
  recoveryTimeoutMs: 60000, // Wait 1 minute before retry
  successThreshold: 2, // Need 2 successes to close
  requestTimeoutMs: 30000, // 30 second timeout per request
});

// Execute requests through the circuit breaker
try {
  const result = await breaker.execute(async () => {
    return await fetchDataFromService();
  });
  console.log("Success:", result);
} catch (error) {
  if (error.name === "CircuitBreakerError") {
    console.log("Circuit is open, service unavailable");
  } else {
    console.error("Request failed:", error);
  }
}
```

### Circuit Breaker States

The circuit breaker has three states:

1. **CLOSED** (Normal): Requests pass through normally
2. **OPEN** (Failing): Requests fail immediately without calling the service
3. **HALF_OPEN** (Testing): Allowing limited requests to test if service recovered

### Monitoring Circuit State

```typescript
import { CircuitBreaker, CircuitState } from "./circuit-breaker";

const breaker = new CircuitBreaker("my-service", {
  onStateChange: (oldState, newState) => {
    console.log(`Circuit breaker transitioned from ${oldState} to ${newState}`);
  },
  onOpen: (error) => {
    console.error("Circuit opened due to:", error.message);
    // Send alert, update metrics, etc.
  },
  onClose: () => {
    console.log("Circuit closed, service recovered");
  },
});

// Check current state
console.log("Current state:", breaker.getState());

// Get statistics
const stats = breaker.getStats();
console.log("Stats:", stats);
```

### Circuit Breaker Registry

Use the registry to manage multiple circuit breakers:

```typescript
import { circuitBreakerRegistry } from "./circuit-breaker";

// Get or create circuit breakers
const aiServiceBreaker = circuitBreakerRegistry.getOrCreate("ai-service", {
  failureThreshold: 5,
  recoveryTimeoutMs: 60000,
});

const integrationServiceBreaker = circuitBreakerRegistry.getOrCreate(
  "integration-service",
  {
    failureThreshold: 3,
    recoveryTimeoutMs: 30000,
  }
);

// Get all statistics
const allStats = circuitBreakerRegistry.getAllStats();
console.log("All circuit breakers:", allStats);

// Reset all circuit breakers (useful for testing)
circuitBreakerRegistry.resetAll();
```

## Combining Retry and Circuit Breaker

For maximum resilience, combine both patterns:

```typescript
import { retry } from "./retry";
import { circuitBreakerRegistry } from "./circuit-breaker";

async function callExternalService(url: string) {
  const breaker = circuitBreakerRegistry.getOrCreate("external-api", {
    failureThreshold: 5,
    recoveryTimeoutMs: 60000,
  });

  // Circuit breaker wraps the retry logic
  return breaker.execute(async () => {
    // Retry logic for transient failures
    return retry(
      async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      },
      {
        maxAttempts: 3,
        initialDelayMs: 100,
        onRetry: (error, attempt) => {
          console.log(`Retry attempt ${attempt}:`, error.message);
        },
      }
    );
  });
}

// Usage
try {
  const data = await callExternalService("https://api.example.com/data");
  console.log("Success:", data);
} catch (error) {
  if (error.name === "CircuitBreakerError") {
    console.log("Service is down, circuit breaker is open");
  } else {
    console.error("Request failed after retries:", error);
  }
}
```

## Lambda Function Example

Here's a complete example for a Lambda function:

```typescript
import { retry } from "./utils/retry";
import { circuitBreakerRegistry } from "./utils/circuit-breaker";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// Initialize circuit breaker
const aiServiceBreaker = circuitBreakerRegistry.getOrCreate("ai-service", {
  failureThreshold: 5,
  recoveryTimeoutMs: 60000,
  onOpen: (error) => {
    console.error("AI Service circuit opened:", error.message);
  },
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Use circuit breaker + retry for resilient calls
    const result = await aiServiceBreaker.execute(async () => {
      return retry(
        async () => {
          // Your service call here
          return await callAIService(event.body);
        },
        {
          maxAttempts: 3,
          initialDelayMs: 100,
          onRetry: (error, attempt, delayMs) => {
            console.log(
              `Retrying AI service call (attempt ${attempt}, delay ${delayMs}ms)`
            );
          },
        }
      );
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    if (error.name === "CircuitBreakerError") {
      // Circuit is open, return cached response or error
      return {
        statusCode: 503,
        body: JSON.stringify({
          error: "Service temporarily unavailable",
          fallback: true,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};

async function callAIService(body: string | null): Promise<any> {
  // Your AI service implementation
  throw new Error("Not implemented");
}
```

## Best Practices

### 1. Choose Appropriate Retry Counts

- **Fast operations** (< 1s): 3-5 retries
- **Slow operations** (> 5s): 2-3 retries
- **Critical operations**: More retries with longer delays
- **Non-critical operations**: Fewer retries, fail fast

### 2. Set Reasonable Timeouts

- **Internal services**: 5-10 seconds
- **External APIs**: 30-60 seconds
- **AI/ML operations**: 2-5 minutes

### 3. Use Jitter

Always enable jitter (default: true) to prevent thundering herd when multiple clients retry simultaneously.

### 4. Monitor Circuit Breakers

- Log state transitions
- Send alerts when circuits open
- Track failure rates and recovery times
- Use CloudWatch metrics

### 5. Implement Fallbacks

When circuit breakers open, provide fallback responses:

```typescript
try {
  return await breaker.execute(() => fetchData());
} catch (error) {
  if (error.name === "CircuitBreakerError") {
    // Return cached data or default response
    return getCachedData() || getDefaultResponse();
  }
  throw error;
}
```

### 6. Test Failure Scenarios

- Simulate service failures
- Test circuit breaker state transitions
- Verify retry behavior under load
- Test recovery after failures

## Error Handling

### Retryable vs Non-Retryable Errors

By default, these errors are retryable:

- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- HTTP 5xx errors
- Timeout errors
- Throttling errors

These errors should NOT be retried:

- HTTP 4xx errors (client errors)
- Authentication failures
- Validation errors
- Business logic errors

### Custom Error Classification

```typescript
import { retry } from "./retry";

await retry(async () => await operation(), {
  isRetryable: (error) => {
    // Don't retry authentication errors
    if (error.message.includes("Unauthorized")) {
      return false;
    }

    // Don't retry validation errors
    if (error.message.includes("Invalid input")) {
      return false;
    }

    // Retry everything else
    return true;
  },
});
```

## Performance Considerations

### Retry Delays

The default configuration uses exponential backoff:

- Attempt 1: 100ms
- Attempt 2: 200ms
- Attempt 3: 400ms
- Total time: ~700ms

With jitter, actual delays will be randomized within these ranges.

### Circuit Breaker Overhead

Circuit breakers add minimal overhead:

- State check: O(1)
- Timeout wrapper: Negligible
- Statistics tracking: O(1)

### Memory Usage

- Each circuit breaker: ~1KB
- Registry overhead: Minimal
- No memory leaks from retry logic

## Troubleshooting

### Circuit Breaker Stuck Open

If a circuit breaker stays open:

1. Check if the service is actually down
2. Verify recovery timeout is reasonable
3. Check success threshold isn't too high
4. Manually reset if needed: `breaker.reset()`

### Too Many Retries

If operations retry too much:

1. Reduce `maxAttempts`
2. Increase `initialDelayMs`
3. Implement custom `isRetryable` logic
4. Add circuit breaker to fail fast

### Thundering Herd

If many clients retry simultaneously:

1. Ensure jitter is enabled (default)
2. Increase `maxDelayMs` for more spread
3. Use circuit breakers to prevent cascading retries
4. Implement rate limiting

## Related Documentation

- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
