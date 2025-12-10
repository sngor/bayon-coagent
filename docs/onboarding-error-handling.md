# Onboarding Error Handling and Recovery

Comprehensive error handling and recovery system for the user onboarding flow.

## Overview

The onboarding system implements robust error handling across multiple layers:

1. **Network Error Handling** - Automatic retry logic with exponential backoff
2. **Validation Error Display** - Field-specific error messages
3. **State Error Recovery** - Graceful degradation and state repair
4. **Navigation Error Handling** - Step validation and redirects
5. **User-Friendly Messages** - Clear, actionable error descriptions

## Requirements Addressed

- **Requirement 2.3**: Display specific validation errors for each invalid field
- **Requirement 6.1**: Automatic state saving with error handling
- **Requirement 6.2**: Data preservation on navigation with recovery

## Architecture

### Error Categories

```typescript
enum OnboardingErrorCategory {
  NETWORK = "NETWORK", // Connection issues
  VALIDATION = "VALIDATION", // Form validation errors
  STATE = "STATE", // State corruption or missing data
  NAVIGATION = "NAVIGATION", // Invalid step transitions
  AUTHENTICATION = "AUTHENTICATION", // Session/auth issues
  UNKNOWN = "UNKNOWN", // Unexpected errors
}
```

### Error Severity Levels

```typescript
enum OnboardingErrorSeverity {
  LOW = "LOW", // User can continue, minor issue
  MEDIUM = "MEDIUM", // User should be aware, may need action
  HIGH = "HIGH", // Blocks progress, requires immediate action
  CRITICAL = "CRITICAL", // System failure, requires support
}
```

## Components

### 1. Error Handler Service

**Location**: `src/services/onboarding/onboarding-error-handler.ts`

**Key Functions**:

- `getErrorInfo(error)` - Converts errors to user-friendly messages
- `retryWithBackoff(operation, config)` - Retries operations with exponential backoff
- `formatValidationErrors(error)` - Formats Zod validation errors
- `recoverFromStateError(userId, state)` - Attempts to repair corrupted state
- `validateStepTransition(current, target, total)` - Validates navigation

**Example Usage**:

```typescript
import {
  getErrorInfo,
  retryWithBackoff,
} from "@/services/onboarding/onboarding-error-handler";

try {
  await retryWithBackoff(() => onboardingService.completeStep(userId, stepId), {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true,
  });
} catch (error) {
  const errorInfo = getErrorInfo(error);
  toast({
    title: errorInfo.title,
    description: errorInfo.description,
    variant: "destructive",
  });
}
```

### 2. Validation Error Display

**Location**: `src/components/onboarding/validation-error-display.tsx`

**Components**:

- `ValidationErrorDisplay` - Shows all validation errors in a structured format
- `FieldError` - Inline error display for individual fields

**Example Usage**:

```typescript
import { ValidationErrorDisplay, FieldError } from '@/components/onboarding';

// Display all errors
<ValidationErrorDisplay
    errors={{
        firstName: ['First name is required'],
        email: ['Invalid email format'],
        'location.city': ['City is required'],
    }}
    title="Please correct the following errors"
/>

// Display field-specific error
<FieldError error="Email is required" />
```

### 3. Error Boundary

**Location**: `src/components/onboarding/onboarding-error-boundary.tsx`

**Features**:

- Catches React component errors
- Displays user-friendly error UI
- Provides recovery options (Try Again, Go to Dashboard)
- Shows technical details in development mode

**Example Usage**:

```typescript
import { OnboardingErrorBoundary } from "@/components/onboarding";

<OnboardingErrorBoundary>
  <OnboardingFlow />
</OnboardingErrorBoundary>;
```

### 4. Navigation Handler

**Location**: `src/middleware/onboarding-navigation-handler.ts`

**Features**:

- Validates step transitions
- Prevents skipping required steps
- Redirects to appropriate step on invalid navigation
- Preserves query parameters

**Example Usage**:

```typescript
import { validateStepNavigation } from "@/middleware/onboarding-navigation-handler";

const validation = validateStepNavigation(
  "complete",
  ["welcome", "profile"],
  "user"
);

if (!validation.valid) {
  redirect(validation.redirectTo);
}
```

## Error Handling Strategies

### Network Errors

**Strategy**: Automatic retry with exponential backoff

```typescript
// Retry configuration
{
    maxRetries: 3,
    initialDelay: 1000,      // 1 second
    maxDelay: 10000,         // 10 seconds
    backoffMultiplier: 2,    // Double delay each retry
    jitter: true,            // Add randomness to prevent thundering herd
}
```

**User Message**:

- Title: "Connection Issue"
- Description: "We're having trouble connecting. Your progress has been saved locally and will sync when connection is restored."
- Actions: ["Wait a moment and try again", "Check your internet connection"]

### Validation Errors

**Strategy**: Display field-specific errors immediately

**User Message**:

- Title: "Invalid Information"
- Description: "Please check the highlighted fields and correct any errors."
- Actions: ["Review the form fields", "Correct any invalid entries", "Try submitting again"]

**Example**:

```typescript
// Zod validation
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email format"),
  location: z.object({
    city: z.string().min(1, "City is required"),
  }),
});

// Error handling
try {
  const data = profileSchema.parse(formData);
} catch (error) {
  const fieldErrors = formatValidationErrors(error);
  setErrors(fieldErrors);
}
```

### State Errors

**Strategy**: Graceful degradation with state repair

**Recovery Steps**:

1. Validate state structure
2. Reset corrupted fields to safe defaults
3. Preserve valid data where possible
4. Log error for monitoring
5. Notify user of recovery

**User Message**:

- Title: "Progress Error"
- Description: "Something went wrong with your progress. We've reset to the last completed step."
- Actions: ["Continue from the current step", "Refresh the page if issues persist", "Contact support if you need help"]

### Navigation Errors

**Strategy**: Validate transitions and redirect to valid step

**Rules**:

- Can always go backward
- Can only go forward one step at a time
- Must complete previous steps before advancing
- Welcome step is always accessible

**User Message**:

- Title: "Navigation Error"
- Description: "Please complete the current step before proceeding."
- Actions: ["Complete the current step", "Use the navigation buttons", "Skip the step if you prefer"]

## Integration Points

### 1. Onboarding Service

The service layer includes:

- Input validation for all operations
- Automatic retry logic via DynamoDB repository
- State structure validation
- Error wrapping with OnboardingError class

### 2. useOnboarding Hook

The hook provides:

- Optimistic UI updates
- Automatic error recovery
- User-friendly toast notifications
- State caching for performance

### 3. Middleware

The middleware implements:

- Retry logic for state checks
- Graceful degradation on errors
- Navigation validation
- Query parameter preservation

## Testing

### Unit Tests

Test error handling in isolation:

```typescript
describe("Error Handler", () => {
  it("should categorize network errors correctly", () => {
    const error = new Error("ECONNREFUSED");
    const category = categorizeError(error);
    expect(category).toBe(OnboardingErrorCategory.NETWORK);
  });

  it("should retry operations with backoff", async () => {
    let attempts = 0;
    const operation = jest.fn(() => {
      attempts++;
      if (attempts < 3) throw new Error("Network error");
      return Promise.resolve("success");
    });

    const result = await retryWithBackoff(operation, {
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      jitter: false,
    });

    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });
});
```

### Integration Tests

Test error handling across components:

```typescript
describe("Onboarding Error Flow", () => {
  it("should recover from network errors", async () => {
    // Simulate network failure then success
    mockDynamoDB
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ state: "success" });

    const { result } = renderHook(() => useOnboarding({ userId: "test" }));

    await waitFor(() => {
      expect(result.current.state).toBeTruthy();
    });
  });

  it("should display validation errors", async () => {
    const { getByText } = render(
      <ValidationErrorDisplay
        errors={{
          firstName: ["First name is required"],
          email: ["Invalid email format"],
        }}
      />
    );

    expect(getByText(/first name is required/i)).toBeInTheDocument();
    expect(getByText(/invalid email format/i)).toBeInTheDocument();
  });
});
```

## Monitoring

### Error Logging

All errors are logged with context:

```typescript
logError(error, {
  userId: "user123",
  stepId: "profile",
  operation: "completeStep",
  metadata: {
    /* additional context */
  },
});
```

### CloudWatch Metrics

Track error rates and categories:

- `onboarding.errors.network` - Network error count
- `onboarding.errors.validation` - Validation error count
- `onboarding.errors.state` - State error count
- `onboarding.errors.navigation` - Navigation error count
- `onboarding.retries.success` - Successful retry count
- `onboarding.retries.failed` - Failed retry count

### Alarms

Set up alarms for:

- High error rate (> 5% of operations)
- Repeated state corruption
- Network errors exceeding threshold
- Critical errors requiring immediate attention

## Best Practices

### 1. Always Use Error Boundaries

Wrap onboarding components in error boundaries:

```typescript
<OnboardingErrorBoundary>
  <OnboardingFlow />
</OnboardingErrorBoundary>
```

### 2. Provide Actionable Error Messages

Bad: "An error occurred"
Good: "Unable to save progress. Please check your internet connection and try again."

### 3. Implement Graceful Degradation

On error, prioritize user access over strict enforcement:

```typescript
// Allow access if onboarding check fails
if (error) {
  console.error("Onboarding check failed:", error);
  return { needsOnboarding: false }; // Don't block user
}
```

### 4. Log Errors with Context

Include relevant information for debugging:

```typescript
logError(error, {
  userId,
  stepId,
  operation,
  metadata: {
    flowType: state.flowType,
    completedSteps: state.completedSteps.length,
  },
});
```

### 5. Test Error Scenarios

Test both happy path and error cases:

```typescript
it("should handle network errors gracefully", async () => {
  mockService.mockRejectedValue(new Error("Network error"));
  // Test error handling
});
```

## Troubleshooting

### Common Issues

**Issue**: Errors not displaying to user
**Solution**: Check that toast notifications are properly configured and error info is being extracted

**Issue**: Infinite retry loops
**Solution**: Ensure non-retryable errors are properly identified and max retries is set

**Issue**: State corruption persists
**Solution**: Check state validation logic and recovery function

**Issue**: Navigation redirects not working
**Solution**: Verify middleware is properly configured and query parameters are preserved

## Future Enhancements

1. **Offline Support**: Queue operations when offline and sync when online
2. **Error Analytics**: Track error patterns and user impact
3. **Smart Recovery**: Use ML to predict and prevent errors
4. **User Feedback**: Allow users to report errors with context
5. **A/B Testing**: Test different error messages for effectiveness
