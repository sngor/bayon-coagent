# Onboarding Service - Quick Reference

## Import

```typescript
import { onboardingService, OnboardingError } from "@/services/onboarding";
```

## Common Operations

### Check if User Needs Onboarding

```typescript
const needsOnboarding = await onboardingService.needsOnboarding(userId);
// Returns: boolean (false on error to avoid blocking access)
```

### Initialize Onboarding

```typescript
const state = await onboardingService.initializeOnboarding(userId, "user");
// Flow types: 'user' | 'admin' | 'both'
// Idempotent: returns existing state if already initialized
```

### Get Current State

```typescript
const state = await onboardingService.getOnboardingState(userId);
// Returns: OnboardingState | null
```

### Complete a Step

```typescript
const state = await onboardingService.completeStep(userId, "profile");
// Validates step belongs to user's flow
// Automatically marks onboarding complete when all required steps done
```

### Skip a Step

```typescript
const state = await onboardingService.skipStep(userId, "tour");
// Removes from completed if previously completed
```

### Get Next Step

```typescript
const nextStep = await onboardingService.getNextStep(userId);
// Returns: OnboardingStep | null (null on error or when complete)
```

### Complete Onboarding

```typescript
const state = await onboardingService.completeOnboarding(userId);
// Idempotent: returns existing state if already complete
```

### Update Metadata

```typescript
const state = await onboardingService.updateMetadata(userId, {
  selectedHub: "studio",
  profileCompletion: 75,
});
// Merges with existing metadata
```

## Error Handling

### Basic Error Handling

```typescript
try {
  await onboardingService.completeStep(userId, stepId);
} catch (error) {
  if (error instanceof OnboardingError) {
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);

    if (error.retryable) {
      // Network error - already retried 3 times
      showToast("Network error. Please try again later.");
    } else {
      // Validation error
      showToast(error.message);
    }
  }
}
```

### Error Codes

- `INVALID_USER_ID`: User ID is empty or invalid
- `INVALID_STEP_ID`: Step ID is empty or invalid
- `INVALID_FLOW_TYPE`: Flow type is not 'user', 'admin', or 'both'
- `STATE_NOT_FOUND`: Onboarding state doesn't exist
- `INVALID_STEP`: Step doesn't belong to user's flow
- `DYNAMODB_ERROR`: Database operation failed
- `UNKNOWN_ERROR`: Unexpected error occurred

## Onboarding State Structure

```typescript
interface OnboardingState {
  userId: string;
  flowType: "user" | "admin" | "both";
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  isComplete: boolean;
  startedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  lastAccessedAt: string; // ISO timestamp
  metadata?: {
    selectedHub?: string;
    bannerDismissed?: boolean;
    profileCompletion?: number;
    tourCompleted?: boolean;
    adminFlowComplete?: boolean;
    userFlowComplete?: boolean;
  };
}
```

## Step IDs

### User Flow

- `welcome`: Welcome screen
- `profile`: Profile setup (required)
- `tour`: Feature tour
- `selection`: Hub selection
- `complete`: Completion screen (required)

### Admin Flow

- `admin-welcome`: Admin welcome
- `admin-users`: User management intro
- `admin-analytics`: Analytics overview
- `admin-config`: Configuration intro
- `admin-complete`: Admin completion (required)

## Retry Behavior

All operations automatically retry on network failures:

- Maximum 3 retries
- Exponential backoff: 100ms → 200ms → 400ms
- Jitter enabled to prevent thundering herd
- Detailed logging of retry attempts

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad
const state = await onboardingService.completeStep(userId, stepId);

// ✅ Good
try {
  const state = await onboardingService.completeStep(userId, stepId);
  // Handle success
} catch (error) {
  // Handle error
}
```

### 2. Use Safe Methods for Non-Blocking Operations

```typescript
// These methods return safe defaults on error
const needsOnboarding = await onboardingService.needsOnboarding(userId);
const nextStep = await onboardingService.getNextStep(userId);
```

### 3. Validate Inputs Early

```typescript
// Service validates inputs, but you can validate earlier
if (!userId || !stepId) {
  throw new Error("Invalid input");
}

await onboardingService.completeStep(userId, stepId);
```

### 4. Use Idempotent Operations

```typescript
// Safe to call multiple times
await onboardingService.initializeOnboarding(userId, "user");
await onboardingService.completeOnboarding(userId);
```

### 5. Check State Before Operations

```typescript
const state = await onboardingService.getOnboardingState(userId);

if (!state) {
  // Initialize first
  await onboardingService.initializeOnboarding(userId, "user");
}

// Now safe to complete steps
await onboardingService.completeStep(userId, "profile");
```

## Common Patterns

### Middleware Pattern

```typescript
async function onboardingMiddleware(request: NextRequest) {
  const userId = await getUserId(request);

  // Safe - returns false on error
  const needsOnboarding = await onboardingService.needsOnboarding(userId);

  if (needsOnboarding) {
    const nextStep = await onboardingService.getNextStep(userId);
    if (nextStep) {
      return NextResponse.redirect(new URL(nextStep.path, request.url));
    }
  }

  return NextResponse.next();
}
```

### Step Completion Pattern

```typescript
async function handleStepCompletion(userId: string, stepId: string) {
  try {
    const state = await onboardingService.completeStep(userId, stepId);

    // Track analytics
    await analytics.track("onboarding_step_completed", {
      userId,
      stepId,
      progress: state.completedSteps.length,
      isComplete: state.isComplete,
    });

    // Get next step
    if (!state.isComplete) {
      const nextStep = await onboardingService.getNextStep(userId);
      if (nextStep) {
        redirect(nextStep.path);
      }
    } else {
      redirect("/dashboard");
    }
  } catch (error) {
    if (error instanceof OnboardingError) {
      showToast(error.message);
    }
  }
}
```

### Resume Pattern

```typescript
async function showResumeBanner(userId: string) {
  const needsOnboarding = await onboardingService.needsOnboarding(userId);

  if (needsOnboarding) {
    const state = await onboardingService.getOnboardingState(userId);
    const nextStep = await onboardingService.getNextStep(userId);

    if (state && nextStep) {
      return {
        show: true,
        progress: (state.completedSteps.length / totalSteps) * 100,
        nextStep: nextStep.name,
        nextPath: nextStep.path,
      };
    }
  }

  return { show: false };
}
```

## Testing

### Mock the Service

```typescript
import { onboardingService } from "@/services/onboarding";

jest.mock("@/services/onboarding", () => ({
  onboardingService: {
    getOnboardingState: jest.fn(),
    completeStep: jest.fn(),
    // ... other methods
  },
}));

// In test
(onboardingService.getOnboardingState as jest.Mock).mockResolvedValue(
  mockState
);
```

### Test Error Handling

```typescript
it("should handle onboarding errors", async () => {
  const error = new OnboardingError("Test error", "TEST_ERROR", false);
  (onboardingService.completeStep as jest.Mock).mockRejectedValue(error);

  await expect(handleStepCompletion("user-123", "profile")).rejects.toThrow(
    OnboardingError
  );
});
```

## Performance Considerations

- Service uses in-memory caching via DynamoDB repository
- Retry logic adds latency only on failures
- Validation happens before database calls
- Idempotent operations prevent duplicate writes
- Graceful degradation prevents blocking user access

## Monitoring

All operations are logged with the prefix `[ONBOARDING_SERVICE]`:

```
[ONBOARDING_SERVICE] Initialized onboarding for user: user-123 flowType: user
[ONBOARDING_SERVICE] Completed step: profile for user: user-123
[ONBOARDING_SERVICE] Completed onboarding for user: user-123
[ONBOARDING_SERVICE] Error completing step: OnboardingError: ...
```

Monitor these logs in CloudWatch for:

- Initialization rate
- Step completion rate
- Error rate
- Retry attempts
