# Retry Utility Examples

This document provides examples of how to use the retry utility with exponential backoff.

## Basic Usage

### Simple Retry

```typescript
import { retry } from "@/lib/retry-utility";

// Retry a simple async operation
const result = await retry(
  async () => {
    const response = await fetch("https://api.example.com/data");
    return response.json();
  },
  {
    maxRetries: 3,
    operationName: "fetch-api-data",
  }
);
```

### Retry with Full Metadata

```typescript
import { retryWithExponentialBackoff } from "@/lib/retry-utility";

const result = await retryWithExponentialBackoff(
  async () => {
    const response = await fetch("https://api.example.com/data");
    return response.json();
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    operationName: "fetch-api-data",
  }
);

console.log(`Operation completed in ${result.attempts} attempts`);
console.log(`Total time: ${result.totalTime}ms`);
console.log(`Had retries: ${result.hadRetries}`);
console.log(`Data:`, result.data);
```

## Advanced Configuration

### Custom Retry Condition

```typescript
import { retry } from "@/lib/retry-utility";

const result = await retry(
  async () => {
    const response = await fetch("https://api.example.com/data");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  },
  {
    maxRetries: 5,
    shouldRetry: (error, attempt) => {
      // Only retry on specific errors
      if (error.message.includes("429")) {
        return true; // Retry rate limits
      }
      if (error.message.includes("503")) {
        return true; // Retry service unavailable
      }
      return false; // Don't retry other errors
    },
    operationName: "fetch-with-custom-retry",
  }
);
```

### Retry with Callbacks

```typescript
import { retry } from "@/lib/retry-utility";

const result = await retry(
  async () => {
    const response = await fetch("https://api.example.com/data");
    return response.json();
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry attempt ${attempt} after ${delay}ms`);
      console.log(`Error: ${error.message}`);

      // You could send metrics here
      // trackMetric('api-retry', { attempt, delay });
    },
    onMaxRetriesExceeded: (error, attempts) => {
      console.error(`Failed after ${attempts} attempts: ${error.message}`);

      // You could send an alert here
      // sendAlert('API call failed after max retries');
    },
    operationName: "fetch-with-callbacks",
  }
);
```

### Disable Jitter

```typescript
import { retry } from "@/lib/retry-utility";

// Disable jitter for predictable delays (not recommended for production)
const result = await retry(
  async () => {
    // Your operation
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    enableJitter: false, // Delays will be exactly 1s, 2s, 4s
    operationName: "predictable-delays",
  }
);
```

### Custom Jitter Factor

```typescript
import { retry } from "@/lib/retry-utility";

// Increase jitter to spread out retries more
const result = await retry(
  async () => {
    // Your operation
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    jitterFactor: 0.5, // ±50% jitter (default is 0.3 = ±30%)
    operationName: "high-jitter",
  }
);
```

## Creating Reusable Retry Wrappers

### Wrap a Function

```typescript
import { createRetryWrapper } from "@/lib/retry-utility";

// Create a wrapped version of your function
const fetchUserData = createRetryWrapper(
  async (userId: string) => {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    return response.json();
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    operationName: "fetch-user-data",
  }
);

// Use it like a normal function - retries are automatic
const user = await fetchUserData("user-123");
```

### Wrap Multiple Functions

```typescript
import { createRetryWrapper } from "@/lib/retry-utility";

const api = {
  getUser: createRetryWrapper(
    async (id: string) => {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    },
    { maxRetries: 3, operationName: "api-get-user" }
  ),

  createUser: createRetryWrapper(
    async (data: any) => {
      const response = await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    { maxRetries: 2, operationName: "api-create-user" }
  ),

  updateUser: createRetryWrapper(
    async (id: string, data: any) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    { maxRetries: 2, operationName: "api-update-user" }
  ),
};

// Use the wrapped API
const user = await api.getUser("123");
const newUser = await api.createUser({ name: "John" });
```

## Service-Specific Examples

### AI Service Calls

```typescript
import { retry } from "@/lib/retry-utility";

const generateContent = async (prompt: string) => {
  return retry(
    async () => {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      return response.json();
    },
    {
      maxRetries: 3,
      baseDelay: 2000, // Longer delay for AI operations
      maxDelay: 60000, // Max 60 seconds
      operationName: "ai-generate-content",
    }
  );
};
```

### External API Integration

```typescript
import { retry } from "@/lib/retry-utility";

const syncMLSData = async (listingId: string) => {
  return retry(
    async () => {
      const response = await fetch(`/api/mls/sync/${listingId}`);
      if (!response.ok) {
        throw new Error(`MLS sync failed: ${response.status}`);
      }
      return response.json();
    },
    {
      maxRetries: 5,
      baseDelay: 1000,
      backoffMultiplier: 2,
      shouldRetry: (error) => {
        // Retry on network errors and rate limits
        return (
          error.message.includes("network") || error.message.includes("429")
        );
      },
      operationName: "mls-sync",
    }
  );
};
```

### OAuth Token Refresh

```typescript
import { retry } from "@/lib/retry-utility";

const refreshOAuthToken = async (provider: string) => {
  return retry(
    async () => {
      const response = await fetch(`/api/oauth/${provider}/refresh`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }
      return response.json();
    },
    {
      maxRetries: 2, // Don't retry too many times for auth
      baseDelay: 500,
      operationName: `oauth-refresh-${provider}`,
    }
  );
};
```

## Monitoring Retry Statistics

```typescript
import { getRetryStats, resetRetryStats } from "@/lib/retry-utility";

// Get stats for a specific operation
const stats = getRetryStats("fetch-api-data");
console.log(`Operation: ${stats.operationName}`);
console.log(`Total attempts: ${stats.totalAttempts}`);
console.log(`Successful: ${stats.successfulAttempts}`);
console.log(`Failed: ${stats.failedAttempts}`);
console.log(`Average attempts: ${stats.averageAttempts}`);

// Get stats for all operations
const allStats = getRetryStats();
allStats.forEach((stats, operationName) => {
  console.log(`${operationName}: ${stats.averageAttempts} avg attempts`);
});

// Reset stats
resetRetryStats("fetch-api-data"); // Reset specific operation
resetRetryStats(); // Reset all operations
```

## Best Practices

### 1. Use Descriptive Operation Names

```typescript
// Good
retry(operation, { operationName: "fetch-user-profile" });
retry(operation, { operationName: "ai-generate-blog-post" });
retry(operation, { operationName: "mls-sync-listing-123" });

// Bad
retry(operation, { operationName: "operation" });
retry(operation, { operationName: "api-call" });
```

### 2. Configure Appropriate Delays

```typescript
// Fast operations (< 1s)
retry(operation, { baseDelay: 500, maxDelay: 5000 });

// Normal operations (1-5s)
retry(operation, { baseDelay: 1000, maxDelay: 30000 });

// Slow operations (> 5s)
retry(operation, { baseDelay: 2000, maxDelay: 60000 });
```

### 3. Limit Retries for Non-Idempotent Operations

```typescript
// For operations that modify data, use fewer retries
retry(createUser, { maxRetries: 1 });
retry(updateProfile, { maxRetries: 2 });

// For read operations, more retries are safe
retry(fetchData, { maxRetries: 5 });
```

### 4. Always Enable Jitter in Production

```typescript
// Good - prevents thundering herd
retry(operation, { enableJitter: true }); // Default

// Bad - can cause thundering herd
retry(operation, { enableJitter: false });
```

### 5. Use Custom Retry Conditions for Specific Errors

```typescript
retry(operation, {
  shouldRetry: (error, attempt) => {
    // Don't retry validation errors
    if (error.message.includes("validation")) {
      return false;
    }

    // Don't retry auth errors
    if (error.message.includes("401") || error.message.includes("403")) {
      return false;
    }

    // Retry everything else
    return true;
  },
});
```

## Configuration Reference

| Option                 | Type     | Default             | Description                                              |
| ---------------------- | -------- | ------------------- | -------------------------------------------------------- |
| `maxRetries`           | number   | 3                   | Maximum number of retry attempts                         |
| `baseDelay`            | number   | 1000                | Base delay in milliseconds before first retry            |
| `maxDelay`             | number   | 30000               | Maximum delay in milliseconds between retries            |
| `backoffMultiplier`    | number   | 2                   | Multiplier for exponential backoff (2x)                  |
| `enableJitter`         | boolean  | true                | Enable jitter to prevent thundering herd                 |
| `jitterFactor`         | number   | 0.3                 | Jitter factor (0-1) - percentage of delay to randomize   |
| `shouldRetry`          | function | defaultShouldRetry  | Custom condition to determine if error should be retried |
| `onRetry`              | function | undefined           | Callback invoked before each retry attempt               |
| `onMaxRetriesExceeded` | function | undefined           | Callback invoked when all retries are exhausted          |
| `operationName`        | string   | 'unknown-operation' | Operation name for logging and statistics                |

## Delay Calculation

The delay between retries is calculated using exponential backoff with optional jitter:

```
delay = min(baseDelay * (backoffMultiplier ^ (attempt - 1)), maxDelay)

With jitter:
jitterRange = delay * jitterFactor
jitter = random(-jitterRange, +jitterRange)
finalDelay = delay + jitter
```

### Example Delays (baseDelay=1000, multiplier=2, maxDelay=30000)

| Attempt | Without Jitter   | With Jitter (±30%)              |
| ------- | ---------------- | ------------------------------- |
| 1       | 1000ms           | 700-1300ms                      |
| 2       | 2000ms           | 1400-2600ms                     |
| 3       | 4000ms           | 2800-5200ms                     |
| 4       | 8000ms           | 5600-10400ms                    |
| 5       | 16000ms          | 11200-20800ms                   |
| 6       | 30000ms (capped) | 21000-39000ms (capped at 30000) |
