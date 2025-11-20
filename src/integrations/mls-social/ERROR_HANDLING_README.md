# MLS Social Integration - Error Handling & Logging

Comprehensive error handling and logging system for MLS and social media integrations.

## Overview

This module provides:

- **Comprehensive Error Logging**: All errors are logged to CloudWatch with structured data
- **User-Friendly Error Messages**: Technical errors are translated to actionable user messages
- **Retry Mechanisms**: Automatic retry with exponential backoff for transient failures
- **Graceful Degradation**: Non-critical failures don't block core functionality
- **Error Notifications**: Users are notified of failures with appropriate actions

## Requirements Coverage

- **1.3**: Authentication error handling with clear messages
- **2.4**: Retry logic with exponential backoff (3 attempts)
- **6.3**: OAuth failure handling
- **7.5**: Failed post error logging and user notification
- **10.5**: Image optimization failure handling

## Components

### 1. Error Handler (`error-handler.ts`)

Central error handling with classification, logging, and retry logic.

#### Error Classification

Errors are automatically classified into categories:

- `AUTHENTICATION`: Invalid credentials, expired tokens
- `NETWORK`: Connection failures, timeouts
- `VALIDATION`: Invalid input data
- `RATE_LIMIT`: API rate limits exceeded
- `PERMISSION`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `TIMEOUT`: Operation timeout
- `EXTERNAL_API`: Third-party API errors
- `INTERNAL`: System errors

#### Error Severity

- `CRITICAL`: System-level failures requiring immediate attention
- `HIGH`: Important errors that block functionality
- `MEDIUM`: Recoverable errors that may impact user experience
- `LOW`: Minor issues that don't affect core functionality

#### Usage

```typescript
import {
  getErrorHandler,
  withRetry,
  handleError,
} from "@/integrations/mls-social/error-handler";

// Handle an error
try {
  await someOperation();
} catch (error) {
  const enhancedError = handleError(error, "someOperation", { userId: "123" });
  // enhancedError contains user-friendly message and retry info
}

// Execute with automatic retry
const result = await withRetry(
  async () => await fetchListings(),
  "fetchListings",
  { maxAttempts: 3 }, // Optional custom config
  { userId: "123" }
);

// Execute with graceful degradation
const handler = getErrorHandler();
const photos = await handler.withGracefulDegradation(
  async () => await downloadPhotos(),
  [], // Fallback to empty array
  "downloadPhotos",
  { listingId: "abc123" }
);
```

### 2. Notification System (`notification-system.ts`)

User-facing notifications for errors and important events.

#### Usage

```typescript
import {
  getNotificationSystem,
  notifyError,
  notifySuccess,
} from "@/integrations/mls-social/notification-system";

// Notify about an error
const error = handleError(someError, "operation");
notifyError(error, {
  retryAction: () => retryOperation(),
  reconnectAction: () => redirectToSettings(),
});

// Notify about success
notifySuccess("Import Complete", "Successfully imported 10 listings");

// Use specific notification methods
const notifier = getNotificationSystem();
notifier.notifyMLSConnectionSuccess("FlexMLS");
notifier.notifyPublishingSuccess(["Facebook", "Instagram"], "123 Main St");
notifier.notifyImageOptimizationFailure(2, 10);
```

### 3. Integration with UI

The notification system needs to be connected to your UI toast system:

```typescript
// In your app layout or provider
import { getNotificationSystem } from "@/integrations/mls-social/notification-system";
import { useToast } from "@/hooks/use-toast";

function AppProvider({ children }) {
  const { toast } = useToast();

  useEffect(() => {
    // Connect notification system to toast
    getNotificationSystem().setHandler({
      show: (notification) => {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === "ERROR" ? "destructive" : "default",
          duration: notification.duration,
          action: notification.action ? (
            <Button onClick={notification.action.onClick}>
              {notification.action.label}
            </Button>
          ) : undefined,
        });
      },
      dismiss: (id) => {
        // Implement dismiss if needed
      },
    });
  }, [toast]);

  return <>{children}</>;
}
```

## Retry Configuration

### Default Retry Strategies

Different error categories have different retry strategies:

| Category       | Max Attempts | Base Delay | Exponential | Jitter |
| -------------- | ------------ | ---------- | ----------- | ------ |
| AUTHENTICATION | 1            | 0ms        | No          | No     |
| NETWORK        | 3            | 1000ms     | Yes         | Yes    |
| RATE_LIMIT     | 5            | 2000ms     | Yes         | Yes    |
| TIMEOUT        | 3            | 2000ms     | Yes         | Yes    |
| EXTERNAL_API   | 3            | 1000ms     | Yes         | Yes    |

### Custom Retry Configuration

```typescript
import { withRetry } from "@/integrations/mls-social/error-handler";

const result = await withRetry(async () => await operation(), "operationName", {
  maxAttempts: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  exponential: true,
  jitter: true,
});
```

### Exponential Backoff Formula

```
delay = min(baseDelay * 2^(attempt-1), maxDelay)
```

With jitter:

```
delay = delay + random(0, delay * 0.25)
```

Example delays with baseDelay=1000ms:

- Attempt 1: 1000ms + jitter
- Attempt 2: 2000ms + jitter
- Attempt 3: 4000ms + jitter

## Logging

All errors are logged to CloudWatch with structured data:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "ERROR",
  "message": "Failed to publish to Facebook",
  "context": {
    "operation": "publishToFacebook",
    "category": "EXTERNAL_API",
    "severity": "MEDIUM",
    "retryable": true,
    "userId": "user123",
    "listingId": "listing456",
    "platform": "facebook"
  },
  "error": {
    "name": "MLSSocialError",
    "message": "Facebook API error: Invalid access token",
    "stack": "..."
  }
}
```

### Log Levels

- `ERROR`: High and critical severity errors
- `WARN`: Medium severity errors
- `INFO`: Low severity errors and important events
- `DEBUG`: Detailed operation logs (local only)

## Error Messages

### User-Friendly Messages

Technical errors are automatically translated to user-friendly messages:

| Technical Error                              | User Message                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------- |
| "Authentication failed: Invalid credentials" | "Authentication failed. Please check your credentials and try again."                  |
| "Token expired"                              | "Your social media connection has expired. Please reconnect your account in settings." |
| "Rate limit exceeded"                        | "Service rate limit reached. Please wait a moment and try again."                      |
| "ECONNREFUSED"                               | "Network connection failed. Please check your internet connection and try again."      |

### Actionable Messages

Error messages include suggested actions:

- **Authentication errors**: "Please check your credentials and try again"
- **OAuth errors**: "Please reconnect your account in settings"
- **Rate limits**: "Please wait a moment and try again"
- **Network errors**: "Please check your internet connection and try again"

## Graceful Degradation

Non-critical failures use graceful degradation to maintain functionality:

### Example: Photo Download Failure

```typescript
// If some photos fail to download, continue with available photos
const photos = await handler.withGracefulDegradation(
  async () => await downloadAllPhotos(listing),
  [], // Fallback to empty array
  "downloadPhotos",
  { listingId: listing.id }
);

// Listing import continues with available photos
await importListing({ ...listing, photos });
```

### Example: Image Optimization Failure

```typescript
// If image optimization fails, use original images
const optimizedImages = await handler.withGracefulDegradation(
  async () => await optimizeImages(images, platform),
  images.map((url) => ({ originalUrl: url, optimizedUrl: url })),
  "optimizeImages",
  { platform, listingId }
);
```

## Best Practices

### 1. Always Use Error Handler

```typescript
// ❌ Don't
try {
  await operation();
} catch (error) {
  console.error(error);
  throw error;
}

// ✅ Do
try {
  await operation();
} catch (error) {
  const enhancedError = handleError(error, "operation", context);
  notifyError(enhancedError);
  throw enhancedError;
}
```

### 2. Use Retry for Transient Failures

```typescript
// ❌ Don't
const listings = await fetchListings();

// ✅ Do
const listings = await withRetry(
  async () => await fetchListings(),
  "fetchListings",
  undefined,
  { userId }
);
```

### 3. Use Graceful Degradation for Non-Critical Operations

```typescript
// ❌ Don't - blocks entire import if photos fail
const photos = await downloadPhotos(listing);
await importListing({ ...listing, photos });

// ✅ Do - continues import even if photos fail
const photos = await handler.withGracefulDegradation(
  async () => await downloadPhotos(listing),
  [],
  "downloadPhotos"
);
await importListing({ ...listing, photos });
```

### 4. Provide Context

```typescript
// ❌ Don't
handleError(error, "operation");

// ✅ Do
handleError(error, "operation", {
  userId: user.id,
  listingId: listing.id,
  platform: "facebook",
  attempt: 2,
});
```

### 5. Notify Users Appropriately

```typescript
// ❌ Don't - generic error
notifyError(error);

// ✅ Do - specific notification with action
notifyError(error, {
  retryAction: () => retryImport(listingId),
  reconnectAction: () => router.push("/settings"),
});
```

## Testing

### Testing Error Handling

```typescript
import {
  handleError,
  ErrorCategory,
  ErrorSeverity,
} from "@/integrations/mls-social/error-handler";

describe("Error Handler", () => {
  it("should classify authentication errors", () => {
    const error = new Error("Authentication failed: Invalid credentials");
    const enhanced = handleError(error, "authenticate");

    expect(enhanced.category).toBe(ErrorCategory.AUTHENTICATION);
    expect(enhanced.severity).toBe(ErrorSeverity.HIGH);
    expect(enhanced.retryable).toBe(false);
    expect(enhanced.userMessage).toContain("check your credentials");
  });

  it("should retry network errors", async () => {
    let attempts = 0;
    const operation = jest.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error("Network error");
      return "success";
    });

    const result = await withRetry(operation, "test", { maxAttempts: 3 });

    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });
});
```

## Monitoring

### CloudWatch Metrics

Key metrics to monitor:

- Error rate by category
- Retry success rate
- Average retry attempts
- Error severity distribution
- Operation duration

### CloudWatch Alarms

Set up alarms for:

- High error rate (>5% of requests)
- Critical errors (any occurrence)
- Excessive retries (>3 attempts average)
- Authentication failures (>10 per hour)

### CloudWatch Insights Queries

```sql
-- Error rate by category
fields @timestamp, context.category, context.severity
| filter level = "ERROR"
| stats count() by context.category
| sort count desc

-- Failed operations requiring retry
fields @timestamp, context.operation, context.attempt
| filter context.retryable = true and context.attempt > 1
| stats count() by context.operation

-- User-impacting errors
fields @timestamp, context.userId, message, context.userMessage
| filter context.severity in ["HIGH", "CRITICAL"]
| sort @timestamp desc
```

## Troubleshooting

### Common Issues

**Issue**: Errors not appearing in CloudWatch

- **Solution**: Check that environment is set to 'production' in config
- **Solution**: Verify CloudWatch Logs permissions

**Issue**: Too many retries

- **Solution**: Adjust retry configuration for specific operations
- **Solution**: Check if errors are correctly classified as non-retryable

**Issue**: Users not seeing error notifications

- **Solution**: Verify notification handler is set in UI
- **Solution**: Check toast system integration

**Issue**: Graceful degradation not working

- **Solution**: Ensure fallback values are appropriate
- **Solution**: Check that operation is wrapped correctly

## Future Enhancements

- [ ] Add error aggregation and deduplication
- [ ] Implement circuit breaker pattern for failing services
- [ ] Add error recovery suggestions based on error patterns
- [ ] Implement error rate limiting to prevent log flooding
- [ ] Add user-specific error tracking and history
- [ ] Integrate with external error tracking services (Sentry, Rollbar)
