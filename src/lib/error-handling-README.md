# Smart Error Handling System

A comprehensive error handling system with intelligent error detection, contextual messages, recovery actions, and exponential backoff retry mechanisms.

## Features

- **Intelligent Error Detection**: Automatically categorizes errors and provides context-aware messages
- **Suggested Recovery Actions**: Offers actionable steps users can take to resolve errors
- **Exponential Backoff Retry**: Automatically retries failed operations with smart backoff
- **Error Pattern Tracking**: Detects recurring errors and adjusts messaging
- **React Integration**: Hooks and Error Boundaries for seamless React integration
- **Toast Notifications**: Automatic user-friendly error notifications

## Error Categories

The system recognizes and handles these error categories:

- **Network**: Connection failures, timeouts, offline status
- **Authentication**: Login failures, expired sessions, unverified accounts
- **Authorization**: Permission denied, forbidden access
- **Validation**: Invalid input, missing required fields
- **AI Operation**: AI generation failures, service unavailable
- **Database**: Query failures, resource not found
- **Rate Limit**: Too many requests, throttling
- **Not Found**: Missing resources, 404 errors
- **Server Error**: 500 errors, internal server issues

## Usage

### Basic Error Handling

```typescript
import { handleError } from "@/lib/error-handling";

try {
  await someOperation();
} catch (error) {
  const pattern = handleError(error, {
    showToast: true,
    logError: true,
  });

  console.log("Error category:", pattern.category);
  console.log("User message:", pattern.userMessage);
  console.log("Suggested actions:", pattern.suggestedActions);
}
```

### Using the Hook

```typescript
import { useErrorHandler } from "@/hooks/use-error-handler";

function MyComponent() {
  const { error, pattern, handleError, clearError } = useErrorHandler();

  const performAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-message">
          <p>{pattern?.userMessage}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      <button onClick={performAction}>Do Something</button>
    </div>
  );
}
```

### Automatic Retry with Exponential Backoff

```typescript
import { retryWithBackoff } from "@/lib/error-handling";

const result = await retryWithBackoff(
  async () => {
    return await fetchData();
  },
  {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error.message);
    },
  }
);
```

### Using the Async Hook with Retry

```typescript
import { useAsyncWithRetry } from "@/hooks/use-error-handler";

function DataFetcher() {
  const { data, error, isLoading, execute, retry } = useAsyncWithRetry(
    async () => {
      return await fetchData();
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
    }
  );

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      )}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={execute}>Fetch Data</button>
    </div>
  );
}
```

### Form Error Handling

```typescript
import { useFormWithErrorHandling } from "@/hooks/use-error-handler";

function MyForm() {
  const { error, pattern, isSubmitting, handleSubmit } =
    useFormWithErrorHandling();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await handleSubmit(async () => {
      // Validate and submit form
      if (!email.includes("@")) {
        throw new Error("Validation failed: Invalid email");
      }

      return await submitForm(formData);
    });

    if (result) {
      // Success!
      console.log("Form submitted successfully");
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {/* form fields */}
      {error && (
        <div className="error">
          <p>{pattern?.userMessage}</p>
          <ul>
            {pattern?.suggestedActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
      )}
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

### API Calls with Auto-Retry

```typescript
import { useApiCall } from "@/hooks/use-error-handler";

function ApiComponent() {
  const { data, error, isLoading, execute } = useApiCall(
    async () => {
      return await fetch("/api/data").then((r) => r.json());
    },
    {
      retryOnNetworkError: true,
      maxRetries: 3,
    }
  );

  return (
    <div>
      <button onClick={execute} disabled={isLoading}>
        Fetch Data
      </button>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### Error Boundaries

```typescript
import {
  ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
} from "@/components/error-boundary";

// Wrap entire app
function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}

// Wrap individual pages
function MyPage() {
  return (
    <PageErrorBoundary>
      <PageContent />
    </PageErrorBoundary>
  );
}

// Wrap specific components
function MyComponent() {
  return (
    <ComponentErrorBoundary componentName="DataTable">
      <DataTable />
    </ComponentErrorBoundary>
  );
}
```

## Specialized Error Handlers

### Network Errors

```typescript
import { handleNetworkError } from "@/lib/error-handling";

try {
  await fetch("/api/data");
} catch (error) {
  handleNetworkError(error as Error, {
    operation: "fetch_user_data",
    userId: currentUser.id,
  });
}
```

### AI Operation Errors

```typescript
import { handleAIError } from "@/lib/error-handling";

try {
  await generateContent();
} catch (error) {
  const { retry, fallback, pattern } = handleAIError(
    error as Error,
    "content_generation"
  );

  if (retry) {
    // Retry the operation
  } else {
    // Use fallback
  }
}
```

### Authentication Errors

```typescript
import { handleAuthError } from "@/lib/error-handling";

try {
  await signIn(email, password);
} catch (error) {
  handleAuthError(error as Error);
  // User will see appropriate message and suggested actions
}
```

### Validation Errors

```typescript
import { handleValidationError } from "@/lib/error-handling";

const errors = {
  email: ["Invalid email format"],
  password: ["Password too short", "Must include numbers"],
};

handleValidationError(errors, true); // Shows toast
```

## Error Pattern Detection

The system automatically detects error patterns and provides appropriate messages:

```typescript
import { detectErrorPattern } from "@/lib/error-handling";

const error = new Error("Network request failed");
const pattern = detectErrorPattern(error);

console.log(pattern.category); // "network"
console.log(pattern.userMessage); // "Unable to connect to the server..."
console.log(pattern.suggestedActions); // ["Check your internet connection", ...]
```

## Error Statistics

Track and analyze error patterns:

```typescript
import { getErrorStatistics, isRecurringError } from "@/lib/error-handling";

// Check if error is recurring
if (isRecurringError(error, 3)) {
  console.log("This error has occurred 3+ times");
}

// Get all error statistics
const stats = getErrorStatistics();
stats.forEach((stat, key) => {
  console.log(`${key}: ${stat.count} occurrences`);
});
```

## Retry Configuration

Customize retry behavior:

```typescript
const config = {
  maxAttempts: 5, // Maximum retry attempts
  baseDelay: 2000, // Initial delay (2 seconds)
  maxDelay: 60000, // Maximum delay (60 seconds)
  backoffMultiplier: 2, // Exponential multiplier
  onRetry: (attempt, error) => {
    console.log(`Retry ${attempt}:`, error.message);
  },
};

await retryWithBackoff(operation, config);
```

## Recovery Actions

Create custom recovery actions:

```typescript
import { createRecoveryActions } from "@/lib/error-handling";

const pattern = detectErrorPattern(error);
const actions = createRecoveryActions(pattern, [
  {
    label: "Contact Support",
    action: () => window.open("mailto:support@example.com"),
    primary: false,
  },
  {
    label: "View Documentation",
    action: () => window.open("/docs"),
    primary: false,
  },
]);
```

## Best Practices

1. **Always handle errors**: Use try-catch blocks or error boundaries
2. **Provide context**: Include operation details in error context
3. **Use appropriate handlers**: Use specialized handlers for specific error types
4. **Enable retry for transient errors**: Network and AI errors often succeed on retry
5. **Don't retry validation errors**: These require user input to fix
6. **Track recurring errors**: Alert users when errors repeat
7. **Log errors**: Enable logging for debugging and monitoring
8. **Show user-friendly messages**: Never show raw error messages to users

## Error Severity Levels

The system assigns severity levels to errors:

- **Low**: Validation, Not Found
- **Medium**: Network, Rate Limit
- **High**: Authentication, Authorization, AI Operation
- **Critical**: Database, Server Error

Use severity to determine notification strategy:

```typescript
import { getErrorSeverity, shouldNotifyUser } from "@/lib/error-handling";

const severity = getErrorSeverity(pattern.category);
if (shouldNotifyUser(pattern.category)) {
  // Show prominent notification
}
```

## Integration with Toast System

The error handling system integrates seamlessly with the toast notification system:

```typescript
// Errors automatically show toasts
handleError(error, { showToast: true });

// Or use specialized toast functions
import { showErrorToast, showWarningToast } from "@/hooks/use-toast";

showErrorToast("Operation Failed", "Please try again");
showWarningToast("Recurring Issue", "Contact support if this continues");
```

## Demo

Visit `/error-handling-demo` to see the error handling system in action with:

- Various error type demonstrations
- Retry mechanism testing
- Form error handling
- API call error handling
- Error statistics tracking

## Requirements

Validates: Requirements 27.3 - AI-driven personalization and smart UI with intelligent error handling and recovery suggestions.
