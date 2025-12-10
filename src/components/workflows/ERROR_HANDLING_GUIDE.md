# Workflow Error Handling Guide

This guide explains how to use the error handling features implemented for the guided workflows system.

## Overview

The workflow error handling system provides:

1. **Error Boundaries** - Catch React errors in workflow components
2. **Retry Logic** - Automatic retry with exponential backoff for transient failures
3. **Error Classification** - User-friendly error messages based on error type
4. **Toast Notifications** - Consistent user feedback for errors
5. **CloudWatch Logging** - Error logging for monitoring and debugging

## Components

### 1. WorkflowErrorBoundary

A React Error Boundary component that catches errors in workflow components and displays a fallback UI.

**Features:**

- Catches and displays React errors
- Logs errors to CloudWatch
- Provides "Restart Workflow" option
- Provides "Return to Dashboard" option
- Shows error details in development mode

**Usage:**

```tsx
import { WorkflowErrorBoundary } from "@/components/workflows/workflow-error-boundary";
import { useRouter } from "next/navigation";

function WorkflowPage() {
  const router = useRouter();

  return (
    <WorkflowErrorBoundary
      onRestart={() => {
        // Reset workflow state and restart
        router.push("/dashboard");
      }}
      onReturnToDashboard={() => {
        router.push("/dashboard");
      }}
    >
      <WorkflowContent />
    </WorkflowErrorBoundary>
  );
}
```

**Custom Fallback UI:**

```tsx
<WorkflowErrorBoundary
  fallback={(error, errorInfo) => (
    <div>
      <h1>Custom Error UI</h1>
      <p>{error.message}</p>
    </div>
  )}
>
  <WorkflowContent />
</WorkflowErrorBoundary>
```

### 2. Error Handler Utilities

The `workflow-error-handler.ts` module provides utilities for error classification and retry logic.

**Error Types:**

```typescript
enum WorkflowErrorType {
  NETWORK = "NETWORK", // Network/connection errors
  VALIDATION = "VALIDATION", // Input validation errors
  NOT_FOUND = "NOT_FOUND", // Resource not found
  UNAUTHORIZED = "UNAUTHORIZED", // Permission errors
  CONCURRENT_UPDATE = "CONCURRENT_UPDATE", // Concurrent modification
  DATABASE = "DATABASE", // Database errors
  UNKNOWN = "UNKNOWN", // Unknown errors
}
```

**Retry Logic:**

```typescript
import { withRetry } from "@/lib/workflow-error-handler";

// Retry an operation with default config (3 attempts, exponential backoff)
const result = await withRetry(() => service.createInstance(userId, preset));

// Custom retry configuration
const result = await withRetry(() => service.createInstance(userId, preset), {
  maxAttempts: 5,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
});
```

**Error Classification:**

```typescript
import {
  classifyError,
  getUserFriendlyErrorMessage,
} from "@/lib/workflow-error-handler";

try {
  await someOperation();
} catch (error) {
  const classified = classifyError(error);
  console.log(classified.type); // WorkflowErrorType
  console.log(classified.message); // User-friendly message
  console.log(classified.isRetryable); // boolean

  // Or get just the message
  const message = getUserFriendlyErrorMessage(error);
}
```

### 3. useWorkflowActionHandler Hook

A React hook for handling workflow action results with toast notifications.

**Basic Usage:**

```tsx
import { useWorkflowActionHandler } from "@/hooks/use-workflow-action-handler";
import { startWorkflow } from "@/app/workflow-actions";

function WorkflowStartButton({ presetId }: { presetId: string }) {
  const { handleActionResult } = useWorkflowActionHandler();
  const router = useRouter();

  const handleStart = async () => {
    const formData = new FormData();
    formData.append("presetId", presetId);

    const result = await startWorkflow(null, formData);

    handleActionResult(result, {
      successMessage: "Workflow started successfully!",
      onSuccess: (instance) => {
        router.push(`/workflow/${instance.id}`);
      },
      onError: (error) => {
        console.error("Failed to start workflow:", error);
      },
    });
  };

  return <button onClick={handleStart}>Start Workflow</button>;
}
```

**Execute Action Wrapper:**

```tsx
import { useWorkflowActionHandler } from "@/hooks/use-workflow-action-handler";

function WorkflowComponent() {
  const { executeAction } = useWorkflowActionHandler();

  const handleComplete = async () => {
    const result = await executeAction(
      async () => {
        const formData = new FormData();
        formData.append("instanceId", instanceId);
        formData.append("stepId", stepId);
        return completeWorkflowStep(null, formData);
      },
      {
        successMessage: "Step completed!",
        onSuccess: (instance) => {
          // Navigate to next step
        },
      }
    );
  };

  return <button onClick={handleComplete}>Complete Step</button>;
}
```

## Server Actions

All workflow server actions have been enhanced with:

1. **Retry Logic** - Automatic retry for network and database errors
2. **Error Classification** - Structured error responses with error types
3. **CloudWatch Logging** - All errors are logged with context
4. **User-Friendly Messages** - Clear, actionable error messages

**Action Result Type:**

```typescript
type ActionResult<T = any> = {
  message: string; // Success or error message
  data?: T; // Result data (if successful)
  errors: Record<string, string[]>; // Field-level errors
  errorType?: WorkflowErrorType; // Error classification
};
```

**Example Server Action Usage:**

```typescript
// Client-side
const formData = new FormData();
formData.append("presetId", "launch-your-brand");

const result = await startWorkflow(null, formData);

if (result.message === "success") {
  // Success - result.data contains the workflow instance
  console.log("Workflow started:", result.data);
} else {
  // Error - result.errors contains error details
  console.error("Error:", result.message);
  console.error("Error type:", result.errorType);
  console.error("Field errors:", result.errors);
}
```

## Error Handling Patterns

### Pattern 1: Form Submission with Error Handling

```tsx
import { useWorkflowActionHandler } from "@/hooks/use-workflow-action-handler";
import { completeWorkflowStep } from "@/app/workflow-actions";

function StepForm({ instanceId, stepId }: Props) {
  const { handleActionResult } = useWorkflowActionHandler();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append("instanceId", instanceId);
    data.append("stepId", stepId);
    data.append("contextData", JSON.stringify(formData));

    const result = await completeWorkflowStep(null, data);

    handleActionResult(result, {
      successMessage: "Step completed successfully!",
      onSuccess: (instance) => {
        // Navigate to next step
        router.push(`/workflow/${instance.id}/step/${instance.currentStepId}`);
      },
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Pattern 2: Handling Concurrent Updates

```tsx
import { useWorkflowActionHandler } from "@/hooks/use-workflow-action-handler";
import { WorkflowErrorType } from "@/lib/workflow-error-handler";

function WorkflowComponent() {
  const { handleActionResult } = useWorkflowActionHandler();

  const handleAction = async () => {
    const result = await someWorkflowAction();

    const success = handleActionResult(result, {
      onError: (error) => {
        if (error.errorType === WorkflowErrorType.CONCURRENT_UPDATE) {
          // Refresh the workflow instance and retry
          refreshWorkflow();
        }
      },
    });
  };

  return <button onClick={handleAction}>Perform Action</button>;
}
```

### Pattern 3: Network Error Recovery

```tsx
import { useWorkflowActionHandler } from "@/hooks/use-workflow-action-handler";
import { WorkflowErrorType } from "@/lib/workflow-error-handler";

function WorkflowComponent() {
  const { executeAction } = useWorkflowActionHandler();
  const [isOffline, setIsOffline] = useState(false);

  const handleAction = async () => {
    const result = await executeAction(async () => someWorkflowAction(), {
      onError: (error) => {
        if (error.errorType === WorkflowErrorType.NETWORK) {
          setIsOffline(true);
          // Queue action for retry when online
          queueForRetry(action);
        }
      },
    });
  };

  return (
    <>
      {isOffline && <OfflineBanner />}
      <button onClick={handleAction}>Perform Action</button>
    </>
  );
}
```

### Pattern 4: Validation Error Display

```tsx
import { useWorkflowActionHandler } from "@/hooks/use-workflow-action-handler";

function WorkflowForm() {
  const { handleActionResult } = useWorkflowActionHandler();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (formData: FormData) => {
    const result = await someWorkflowAction(null, formData);

    const success = handleActionResult(result, {
      showErrorToast: false, // Don't show toast for validation errors
      onError: (error) => {
        // Display field-level errors
        setFieldErrors(error.errors);
      },
    });
  };

  return (
    <form>
      <input name="field1" />
      {fieldErrors.field1 && (
        <span className="error">{fieldErrors.field1[0]}</span>
      )}
    </form>
  );
}
```

## Best Practices

1. **Always wrap workflow components in WorkflowErrorBoundary**

   - Prevents entire app from crashing on workflow errors
   - Provides recovery options for users

2. **Use the useWorkflowActionHandler hook for all workflow actions**

   - Consistent error handling across the app
   - Automatic toast notifications
   - Centralized error logging

3. **Handle specific error types when needed**

   - Concurrent updates: Refresh and retry
   - Network errors: Queue for retry when online
   - Validation errors: Display field-level errors

4. **Don't show toast for validation errors**

   - Display validation errors inline with form fields
   - Only use toasts for system errors

5. **Provide clear recovery paths**

   - "Restart Workflow" for critical errors
   - "Return to Dashboard" as fallback
   - "Refresh and Retry" for concurrent updates

6. **Log errors with context**
   - All errors are automatically logged to CloudWatch
   - Include relevant context (userId, instanceId, etc.)

## Testing Error Handling

### Testing Error Boundaries

```tsx
import { render, screen } from "@testing-library/react";
import { WorkflowErrorBoundary } from "@/components/workflows/workflow-error-boundary";

function ThrowError() {
  throw new Error("Test error");
}

test("displays error UI when error occurs", () => {
  render(
    <WorkflowErrorBoundary>
      <ThrowError />
    </WorkflowErrorBoundary>
  );

  expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  expect(screen.getByText("Restart Workflow")).toBeInTheDocument();
});
```

### Testing Retry Logic

```typescript
import { withRetry } from "@/lib/workflow-error-handler";

test("retries operation on failure", async () => {
  let attempts = 0;
  const operation = jest.fn(async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error("Network error");
    }
    return "success";
  });

  const result = await withRetry(operation, { maxAttempts: 3 });

  expect(result).toBe("success");
  expect(attempts).toBe(3);
});
```

### Testing Error Classification

```typescript
import { classifyError, WorkflowErrorType } from "@/lib/workflow-error-handler";

test("classifies network errors correctly", () => {
  const error = new Error("Network connection failed");
  const classified = classifyError(error);

  expect(classified.type).toBe(WorkflowErrorType.NETWORK);
  expect(classified.isRetryable).toBe(true);
});
```

## Monitoring and Debugging

All workflow errors are logged to CloudWatch with the following information:

- Error type and message
- Original error stack trace
- User ID and workflow instance ID
- Timestamp and operation name
- Additional context (step ID, preset ID, etc.)

**CloudWatch Log Format:**

```json
{
  "level": "ERROR",
  "operation": "completeWorkflowStep",
  "type": "NETWORK",
  "message": "Network connection error",
  "originalMessage": "fetch failed",
  "stack": "...",
  "userId": "user-123",
  "instanceId": "workflow-456",
  "stepId": "profile-setup",
  "timestamp": "2025-12-08T10:30:00.000Z"
}
```

## Summary

The workflow error handling system provides comprehensive error management with:

- ✅ Error boundaries for React errors
- ✅ Automatic retry with exponential backoff
- ✅ User-friendly error messages
- ✅ Toast notifications for user feedback
- ✅ CloudWatch logging for monitoring
- ✅ Concurrent update detection
- ✅ Network error handling
- ✅ Validation error display

Use these tools consistently across all workflow components for a robust, user-friendly error handling experience.
