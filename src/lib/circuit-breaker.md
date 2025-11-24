# Circuit Breaker Pattern

This module implements the Circuit Breaker pattern for fault tolerance in external API calls.

## Overview

The Circuit Breaker pattern prevents cascading failures by:

- Detecting when an external service is failing
- Failing fast instead of waiting for timeouts
- Allowing the service time to recover
- Automatically testing recovery

## Circuit States

### CLOSED (Normal Operation)

- All requests pass through to the external service
- Failures are counted
- When failure threshold is reached, circuit opens

### OPEN (Failing Fast)

- All requests fail immediately without calling the external service
- After recovery timeout, circuit transitions to HALF_OPEN

### HALF_OPEN (Testing Recovery)

- Limited requests are allowed through to test if service has recovered
- If requests succeed, circuit closes
- If requests fail, circuit opens again

## Usage

### Basic Usage

```typescript
import { withCircuitBreaker } from "@/lib/circuit-breaker";

// Wrap external API call with circuit breaker
const result = await withCircuitBreaker("my-external-service", async () => {
  return fetch("https://api.example.com/data");
});
```

### With Custom Options

```typescript
import { withCircuitBreaker } from "@/lib/circuit-breaker";

const result = await withCircuitBreaker(
  "my-external-service",
  async () => {
    return fetch("https://api.example.com/data");
  },
  {
    failureThreshold: 5, // Open after 5 failures
    recoveryTimeout: 60000, // Wait 1 minute before testing recovery
    successThreshold: 2, // Close after 2 successful tests
    requestTimeout: 30000, // Timeout individual requests after 30 seconds
  }
);
```

### Using Circuit Breaker Instance

```typescript
import { createCircuitBreaker } from "@/lib/circuit-breaker";

const breaker = createCircuitBreaker("my-service", {
  failureThreshold: 3,
  recoveryTimeout: 30000,
});

// Execute multiple requests with the same breaker
const result1 = await breaker.execute(async () => {
  return fetch("https://api.example.com/endpoint1");
});

const result2 = await breaker.execute(async () => {
  return fetch("https://api.example.com/endpoint2");
});

// Check circuit state
console.log(breaker.getState()); // CLOSED, OPEN, or HALF_OPEN

// Get statistics
console.log(breaker.getStats());
```

### State Change Callbacks

```typescript
import { createCircuitBreaker, CircuitState } from "@/lib/circuit-breaker";

const breaker = createCircuitBreaker("my-service", {
  onStateChange: (oldState, newState) => {
    console.log(`Circuit transitioned: ${oldState} -> ${newState}`);
  },
  onOpen: () => {
    console.error("Circuit opened! Service is failing.");
    // Send alert, log to monitoring system, etc.
  },
  onClose: () => {
    console.log("Circuit closed! Service has recovered.");
  },
});
```

## Configuration Options

| Option             | Type     | Default | Description                                        |
| ------------------ | -------- | ------- | -------------------------------------------------- |
| `failureThreshold` | number   | 5       | Number of failures before opening circuit          |
| `recoveryTimeout`  | number   | 60000   | Milliseconds to wait before testing recovery       |
| `successThreshold` | number   | 2       | Successful requests needed to close from half-open |
| `requestTimeout`   | number   | 30000   | Timeout for individual requests in milliseconds    |
| `onStateChange`    | function | -       | Callback when circuit state changes                |
| `onOpen`           | function | -       | Callback when circuit opens                        |
| `onClose`          | function | -       | Callback when circuit closes                       |

## Circuit Breaker Registry

The module maintains a global registry of circuit breakers to ensure the same breaker is used for the same service across the application.

```typescript
import { circuitBreakerRegistry } from "@/lib/circuit-breaker";

// Get all circuit breakers
const allBreakers = circuitBreakerRegistry.getAll();

// Get statistics for all breakers
const allStats = circuitBreakerRegistry.getAllStats();

// Reset all breakers (useful for testing)
circuitBreakerRegistry.resetAll();

// Get a specific breaker
const breaker = circuitBreakerRegistry.get("my-service");
```

## Error Handling

When a circuit is open, requests will throw a `CircuitBreakerError`:

```typescript
import { withCircuitBreaker, CircuitBreakerError } from "@/lib/circuit-breaker";

try {
  const result = await withCircuitBreaker("my-service", async () => {
    return fetch("https://api.example.com/data");
  });
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    console.error("Circuit is open:", error.message);
    console.error("Circuit state:", error.state);
    // Provide fallback response or cached data
  } else {
    // Handle other errors
    console.error("Request failed:", error);
  }
}
```

## Best Practices

1. **Use descriptive service names**: Name your circuit breakers after the external service they protect
2. **Configure appropriate thresholds**: Balance between failing fast and allowing transient errors
3. **Monitor circuit state**: Log state changes and alert when circuits open
4. **Provide fallbacks**: Have cached data or default responses ready when circuits are open
5. **Test recovery**: Ensure your recovery timeout is long enough for services to actually recover
6. **Use separate breakers**: Don't share circuit breakers between unrelated services

## Integration Service Examples

### Google OAuth

```typescript
const tokenResponse = await withCircuitBreaker(
  "google-oauth-token-exchange",
  async () => {
    return fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      // ... request config
    });
  },
  {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    requestTimeout: 10000,
  }
);
```

### MLS API

```typescript
const response = await withCircuitBreaker(
  "mlsgrid-api",
  async () => {
    return fetch(`${baseUrl}/listings?agentId=${agentId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // ... headers
      },
    });
  },
  {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    requestTimeout: 30000,
  }
);
```

## Monitoring

Circuit breaker statistics can be exported for monitoring:

```typescript
import { circuitBreakerRegistry } from "@/lib/circuit-breaker";

// Get all stats for monitoring dashboard
const stats = circuitBreakerRegistry.getAllStats();

// Example stats structure:
// [
//   {
//     name: 'google-oauth-token-exchange',
//     state: 'CLOSED',
//     failureCount: 0,
//     successCount: 0,
//     nextAttemptTime: 0,
//     options: { ... }
//   },
//   ...
// ]
```

## Testing

For testing, you can manually control circuit breaker state:

```typescript
import { createCircuitBreaker } from "@/lib/circuit-breaker";

const breaker = createCircuitBreaker("test-service");

// Manually open the circuit
breaker.open();

// Manually reset the circuit
breaker.reset();

// Clear all breakers between tests
circuitBreakerRegistry.clear();
```

## Related Documentation

- [Integration Service Lambda Functions](../lambda/README.md)
- [AWS Secrets Manager Integration](../aws/secrets-manager/README.md)
- [Microservices Architecture Design](../../.kiro/specs/microservices-architecture/design.md)
