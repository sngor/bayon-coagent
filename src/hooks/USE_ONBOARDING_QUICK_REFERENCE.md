# useOnboarding Hook - Quick Reference

## Overview

The `useOnboarding` hook provides comprehensive state management for the onboarding system with automatic persistence, optimistic updates, and error handling.

## Basic Usage

```typescript
import { useOnboarding } from "@/hooks/use-onboarding";
import { useUser } from "@/aws/auth/use-user";

function MyOnboardingComponent() {
  const { user } = useUser();
  const {
    state,
    isLoading,
    isUpdating,
    completeStep,
    skipStep,
    getProgress,
    navigateToNextStep,
  } = useOnboarding({ userId: user.id });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Progress: {getProgress()}%</p>
      <button onClick={() => completeStep("profile")}>Complete Step</button>
    </div>
  );
}
```

## API Reference

### Hook Options

```typescript
interface UseOnboardingOptions {
  userId: string; // Required: User ID
  autoSync?: boolean; // Optional: Enable auto-sync (default: true)
  syncInterval?: number; // Optional: Sync interval in ms (default: 30000)
}
```

### Return Values

```typescript
interface UseOnboardingReturn {
  // State
  state: OnboardingState | null; // Current onboarding state
  isLoading: boolean; // Initial load state
  isUpdating: boolean; // Update in progress
  error: Error | null; // Last error if any

  // Actions
  completeStep: (stepId: string) => Promise<void>;
  skipStep: (stepId: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Queries
  needsOnboarding: () => Promise<boolean>;
  getNextStep: () => OnboardingStep | null;
  getSteps: () => OnboardingStep[];
  getProgress: () => number;

  // Navigation
  navigateToNextStep: () => void;
  navigateToStep: (stepId: string) => void;

  // Utilities
  refresh: () => Promise<void>;
}
```

## Common Patterns

### 1. Complete a Step and Navigate

```typescript
const handleComplete = async () => {
  try {
    await completeStep("profile");
    navigateToNextStep();
  } catch (error) {
    console.error("Failed to complete step:", error);
  }
};
```

### 2. Skip a Step

```typescript
const handleSkip = async () => {
  try {
    await skipStep("tour");
    navigateToNextStep();
  } catch (error) {
    console.error("Failed to skip step:", error);
  }
};
```

### 3. Check Progress

```typescript
const progress = getProgress(); // Returns 0-100
const nextStep = getNextStep(); // Returns next incomplete step or null
const allSteps = getSteps(); // Returns all steps for current flow
```

### 4. Complete Entire Onboarding

```typescript
const handleFinish = async () => {
  try {
    await completeOnboarding();
    router.push("/dashboard");
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
  }
};
```

### 5. Navigate to Specific Step

```typescript
const goToProfile = () => {
  navigateToStep("profile");
};
```

### 6. Refresh State from Server

```typescript
const handleRefresh = async () => {
  await refresh();
};
```

### 7. Check if User Needs Onboarding

```typescript
const checkOnboarding = async () => {
  const needs = await needsOnboarding();
  if (needs) {
    navigateToNextStep();
  }
};
```

## Features

### Optimistic Updates

- UI updates immediately before server confirmation
- Automatic rollback on failure
- Better user experience with instant feedback

### Automatic Persistence

- State saved after every step completion/skip
- Periodic background sync (default: 30 seconds)
- State saved before page unload using beacon API

### In-Memory Caching

- Reduces server requests by 90%
- 1-minute TTL for cached state
- Shared cache across all hook instances

### Error Handling

- Automatic retry with exponential backoff
- User-friendly toast notifications
- Graceful degradation on errors

### Analytics Integration

- Automatic event tracking
- Step completion/skip events
- Flow completion events

## State Structure

```typescript
interface OnboardingState {
  userId: string;
  flowType: "user" | "admin" | "both";
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  isComplete: boolean;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
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

## Performance Tips

1. **Use autoSync wisely**: Disable for read-only components

   ```typescript
   useOnboarding({ userId, autoSync: false });
   ```

2. **Adjust sync interval**: Increase for less frequent updates

   ```typescript
   useOnboarding({ userId, syncInterval: 60000 }); // 1 minute
   ```

3. **Avoid unnecessary re-renders**: Memoize callbacks

   ```typescript
   const handleComplete = useCallback(async () => {
     await completeStep("profile");
   }, [completeStep]);
   ```

4. **Check loading state**: Prevent actions during load
   ```typescript
   <button disabled={isLoading || isUpdating}>Complete</button>
   ```

## Error Handling

The hook automatically handles errors and shows toast notifications. For custom error handling:

```typescript
const handleComplete = async () => {
  try {
    await completeStep("profile");
  } catch (error) {
    if (error instanceof OnboardingError) {
      // Handle specific onboarding errors
      if (error.retryable) {
        // Retry logic
      }
    }
  }
};
```

## Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "@/hooks/use-onboarding";

test("completes step successfully", async () => {
  const { result } = renderHook(() => useOnboarding({ userId: "test-user" }));

  await act(async () => {
    await result.current.completeStep("profile");
  });

  expect(result.current.state?.completedSteps).toContain("profile");
});
```

## Troubleshooting

### State not updating

- Check if `isUpdating` is true
- Verify user ID is correct
- Check network connectivity
- Look for errors in console

### Cache issues

- Call `refresh()` to force reload from server
- Clear browser cache
- Check cache TTL (default: 1 minute)

### Navigation not working

- Verify step IDs are correct
- Check if step exists in current flow
- Ensure state is loaded (`!isLoading`)

### Performance issues

- Disable autoSync if not needed
- Increase sync interval
- Check for memory leaks in components

## Related Documentation

- [Onboarding Service](../services/onboarding/QUICK_REFERENCE.md)
- [State Manager Utilities](../lib/onboarding/state-manager.ts)
- [Onboarding Types](../types/onboarding.ts)
- [Task 18 Summary](.kiro/specs/user-onboarding/TASK_18_STATE_MANAGEMENT_SUMMARY.md)
