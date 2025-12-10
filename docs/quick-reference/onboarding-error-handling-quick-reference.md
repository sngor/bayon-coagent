# Onboarding Error Handling - Quick Reference

Quick reference for implementing error handling in onboarding components.

## Import Statements

```typescript
// Error handler utilities
import {
  getErrorInfo,
  retryWithBackoff,
  formatValidationErrors,
  logError,
} from "@/services/onboarding/onboarding-error-handler";

// Error display components
import {
  ValidationErrorDisplay,
  FieldError,
  OnboardingErrorBoundary,
} from "@/components/onboarding";
```

## Common Patterns

### 1. Retry Network Operations

```typescript
try {
  const result = await retryWithBackoff(
    () => onboardingService.completeStep(userId, stepId),
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: true,
    },
    (attempt, error) => {
      console.log(`Retry ${attempt}:`, error.message);
    }
  );
} catch (error) {
  const errorInfo = getErrorInfo(error);
  toast({
    title: errorInfo.title,
    description: errorInfo.description,
    variant: "destructive",
  });
}
```

### 2. Display Validation Errors

```typescript
// In your form component
const [errors, setErrors] = useState<Record<string, string[]>>({});

const handleSubmit = async (data: FormData) => {
  try {
    const validated = profileSchema.parse(data);
    await saveProfile(validated);
  } catch (error) {
    const fieldErrors = formatValidationErrors(error);
    setErrors(fieldErrors);
  }
};

// In your JSX
{
  Object.keys(errors).length > 0 && <ValidationErrorDisplay errors={errors} />;
}

// For individual fields
<FieldError error={errors.firstName} />;
```

### 3. Wrap Components in Error Boundary

```typescript
// In your page or layout
<OnboardingErrorBoundary>
  <OnboardingContainer>{/* Your onboarding content */}</OnboardingContainer>
</OnboardingErrorBoundary>
```

### 4. Log Errors with Context

```typescript
try {
  await operation();
} catch (error) {
  logError(error, {
    userId,
    stepId,
    operation: "completeStep",
    metadata: {
      flowType: state.flowType,
      attempt: retryCount,
    },
  });
  throw error;
}
```

### 5. Handle State Errors

```typescript
import { recoverFromStateError } from "@/services/onboarding/onboarding-error-handler";

try {
  const state = await getOnboardingState(userId);
  // Use state
} catch (error) {
  if (error.code === "STATE_CORRUPTED") {
    const recovery = await recoverFromStateError(userId, corruptedState);
    if (recovery.recovered) {
      toast({
        title: "Progress Recovered",
        description: recovery.message,
      });
    }
  }
}
```

## Error Messages by Category

### Network Errors

```typescript
{
    title: 'Connection Issue',
    description: 'We\'re having trouble connecting. Your progress has been saved locally.',
    actions: ['Wait a moment and try again', 'Check your internet connection'],
    retryable: true,
}
```

### Validation Errors

```typescript
{
    title: 'Invalid Information',
    description: 'Please check the highlighted fields and correct any errors.',
    actions: ['Review the form fields', 'Correct any invalid entries'],
    retryable: false,
}
```

### State Errors

```typescript
{
    title: 'Progress Error',
    description: 'Something went wrong with your progress. We\'ve reset to the last completed step.',
    actions: ['Continue from the current step', 'Refresh if issues persist'],
    retryable: false,
}
```

### Navigation Errors

```typescript
{
    title: 'Navigation Error',
    description: 'Please complete the current step before proceeding.',
    actions: ['Complete the current step', 'Use the navigation buttons'],
    retryable: false,
}
```

## Retry Configuration

### Default Configuration

```typescript
{
    maxRetries: 3,
    initialDelay: 1000,      // 1 second
    maxDelay: 10000,         // 10 seconds
    backoffMultiplier: 2,    // Double each time
    jitter: true,            // Add randomness
}
```

### Aggressive Retry (for critical operations)

```typescript
{
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
    jitter: true,
}
```

### Conservative Retry (for non-critical operations)

```typescript
{
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 3,
    jitter: true,
}
```

## Testing Error Scenarios

### Mock Network Error

```typescript
jest.mock("@/services/onboarding/onboarding-service", () => ({
  onboardingService: {
    completeStep: jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ success: true }),
  },
}));
```

### Mock Validation Error

```typescript
const validationError = {
  name: "ZodError",
  errors: [
    { path: ["firstName"], message: "First name is required" },
    { path: ["email"], message: "Invalid email format" },
  ],
};
```

### Test Error Recovery

```typescript
it("should recover from errors", async () => {
  const { result } = renderHook(() => useOnboarding({ userId: "test" }));

  // Trigger error
  await act(async () => {
    try {
      await result.current.completeStep("invalid");
    } catch (error) {
      // Error should be caught and handled
    }
  });

  // State should be preserved
  expect(result.current.state).toBeTruthy();
});
```

## Checklist

When implementing error handling:

- [ ] Wrap components in `OnboardingErrorBoundary`
- [ ] Use `retryWithBackoff` for network operations
- [ ] Display validation errors with `ValidationErrorDisplay`
- [ ] Log errors with `logError` including context
- [ ] Show user-friendly messages from `getErrorInfo`
- [ ] Implement optimistic UI updates
- [ ] Test error scenarios
- [ ] Handle state corruption gracefully
- [ ] Validate navigation transitions
- [ ] Preserve user data on errors

## Common Mistakes

❌ **Don't**: Show technical error messages to users

```typescript
toast({ description: error.stack });
```

✅ **Do**: Show user-friendly messages

```typescript
const errorInfo = getErrorInfo(error);
toast({ title: errorInfo.title, description: errorInfo.description });
```

❌ **Don't**: Retry indefinitely

```typescript
while (true) {
  try {
    await operation();
    break;
  } catch {
    /* retry forever */
  }
}
```

✅ **Do**: Use configured retry limits

```typescript
await retryWithBackoff(operation, { maxRetries: 3 });
```

❌ **Don't**: Lose user data on errors

```typescript
catch (error) {
    setState(null); // Data lost!
}
```

✅ **Do**: Preserve state and revert optimistic updates

```typescript
catch (error) {
    setState(previousState); // Data preserved
}
```

## Support

For issues or questions:

1. Check error logs in CloudWatch
2. Review error code in user message
3. Check network connectivity
4. Verify DynamoDB access
5. Contact support with error code and context
