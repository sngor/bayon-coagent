# Workflow Context Provider

The Workflow Context Provider manages workflow state in React applications with auto-save, local storage backup, and comprehensive state management.

## Features

- ✅ React Context for workflow state management
- ✅ useReducer for predictable state updates
- ✅ Auto-save with debouncing (30 seconds default)
- ✅ Local storage backup for offline resilience
- ✅ Session interruption recovery
- ✅ Actions for step completion, skipping, and navigation
- ✅ Progress tracking and time estimation
- ✅ Error handling with retry logic

## Requirements Satisfied

- **2.2**: Auto-save workflow state on step completion
- **2.3**: Persist progress to database on navigation
- **7.1**: Save current workflow state when navigating away
- **12.1**: Automatically save workflow state to database
- **12.2**: Persist all context data and progress during session interruption

## Installation

The WorkflowContext is already set up in `src/contexts/workflow-context.tsx`. No additional installation needed.

## Basic Usage

### 1. Wrap your app with WorkflowProvider

```tsx
import { WorkflowProvider } from "@/contexts/workflow-context";

function App() {
  return (
    <WorkflowProvider
      autoSaveDelay={30000} // 30 seconds (default)
      enableLocalStorage={true} // Enable offline backup (default)
    >
      <YourWorkflowComponents />
    </WorkflowProvider>
  );
}
```

### 2. Use the workflow context in components

```tsx
import { useWorkflow } from "@/contexts/workflow-context";

function WorkflowComponent() {
  const {
    // State
    instance,
    preset,
    currentStep,
    nextStep,
    progress,
    remainingTime,
    isSaving,
    saveError,
    isLoaded,

    // Actions
    completeStep,
    skipStep,
    navigateToStep,
    save,
    loadWorkflow,
    clearWorkflow,
  } = useWorkflow();

  // Your component logic
}
```

## API Reference

### State Properties

#### `instance: WorkflowInstance | null`

Current workflow instance with all state data.

#### `preset: WorkflowPreset | null`

Workflow preset definition (template).

#### `currentStep: WorkflowStepDefinition | null`

Current step definition.

#### `nextStep: WorkflowStepDefinition | null`

Next step definition (null if at the end).

#### `progress: number`

Progress percentage (0-100).

#### `remainingTime: number`

Estimated time remaining in minutes.

#### `isSaving: boolean`

Whether auto-save is in progress.

#### `saveError: Error | null`

Last save error if any.

#### `isLoaded: boolean`

Whether a workflow is loaded.

### Actions

#### `loadWorkflow(instance: WorkflowInstance, preset: WorkflowPreset): void`

Load a workflow instance into the context.

```tsx
const { loadWorkflow } = useWorkflow();

useEffect(() => {
  loadWorkflow(workflowInstance, workflowPreset);
}, []);
```

#### `completeStep(data?: Record<string, any>): Promise<void>`

Complete the current step and advance to the next step.

```tsx
const { completeStep } = useWorkflow();

const handleComplete = async () => {
  await completeStep({
    // Optional context data to pass to next steps
    propertyDetails: { address: "123 Main St", price: 500000 },
  });
};
```

#### `skipStep(): Promise<void>`

Skip the current step (only works for optional steps).

```tsx
const { skipStep, currentStep } = useWorkflow();

const handleSkip = async () => {
  if (currentStep?.isOptional) {
    await skipStep();
  }
};
```

#### `navigateToStep(stepId: string): Promise<void>`

Navigate to a specific step (only completed or current steps).

```tsx
const { navigateToStep } = useWorkflow();

const handleGoBack = async () => {
  await navigateToStep("previous-step-id");
};
```

#### `save(): Promise<void>`

Manually trigger save (bypasses debouncing).

```tsx
const { save } = useWorkflow();

const handleManualSave = async () => {
  await save();
};
```

#### `clearWorkflow(): void`

Clear the current workflow from context and local storage.

```tsx
const { clearWorkflow } = useWorkflow();

const handleClear = () => {
  clearWorkflow();
};
```

## Auto-Save Behavior

The WorkflowContext automatically saves workflow state in the following scenarios:

### 1. Debounced Auto-Save (30 seconds)

After any state change (step completion, navigation, etc.), the context schedules a save after 30 seconds of inactivity.

```tsx
// Auto-save is triggered automatically
await completeStep();
// Save will occur 30 seconds later (unless another action happens)
```

### 2. Immediate Local Storage Backup

All state changes are immediately saved to local storage for offline resilience.

```tsx
// Local storage is updated immediately
await completeStep();
// State is now in localStorage
```

### 3. Page Visibility Changes

When the page becomes hidden (user switches tabs), pending saves are executed immediately.

```tsx
// User switches tabs
// → Pending save is executed immediately
```

### 4. Before Page Unload

When the user closes the tab or navigates away, state is saved to local storage.

```tsx
// User closes tab
// → State is saved to localStorage
```

### 5. Manual Save

You can bypass debouncing and save immediately.

```tsx
await save();
// Saves immediately to database
```

## Local Storage Backup

The WorkflowContext maintains a backup in local storage for offline resilience and session recovery.

### Storage Key

```
workflow-backup
```

### Storage Format

```json
{
  "instance": {
    /* WorkflowInstance */
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Recovery

The backup is automatically used when:

- Network connection is lost
- Browser crashes
- User refreshes the page

## Error Handling

### Save Errors

When a save fails, the error is stored in `saveError` and displayed to the user.

```tsx
const { saveError } = useWorkflow();

if (saveError) {
  return <Alert>Failed to save: {saveError.message}</Alert>;
}
```

### Retry Logic

The underlying service automatically retries failed saves with exponential backoff:

- Initial delay: 100ms
- Max delay: 2000ms
- Max retries: 3

### Network Errors

Network errors are automatically retried. If all retries fail, the state remains in local storage and will be synced when connection is restored.

## Examples

See `workflow-context-example.tsx` for comprehensive usage examples including:

1. Basic workflow display
2. Step navigation controls
3. Loading a workflow
4. Complete page with provider
5. Manual save button
6. Step list with navigation
7. Context data display
8. Workflow cleanup
9. Complete workflow dashboard

## Testing

### Unit Tests

Test the reducer and actions:

```tsx
import { renderHook, act } from "@testing-library/react";
import { WorkflowProvider, useWorkflow } from "./workflow-context";

test("completes step and advances", async () => {
  const { result } = renderHook(() => useWorkflow(), {
    wrapper: WorkflowProvider,
  });

  act(() => {
    result.current.loadWorkflow(instance, preset);
  });

  await act(async () => {
    await result.current.completeStep();
  });

  expect(result.current.instance?.completedSteps).toContain("step-1");
});
```

### Integration Tests

Test with real workflow instances and database operations.

## Performance Considerations

### Debouncing

Auto-save is debounced to prevent excessive database writes. The default 30-second delay can be customized:

```tsx
<WorkflowProvider autoSaveDelay={10000}> {/* 10 seconds */}
```

### Local Storage

Local storage operations are synchronous but fast. The backup is small (typically < 10KB).

### Memory

The context stores only the current workflow instance. Previous instances are not kept in memory.

## Best Practices

### 1. Load workflow on mount

```tsx
useEffect(() => {
  if (!isLoaded) {
    loadWorkflow(instance, preset);
  }
}, []);
```

### 2. Handle errors gracefully

```tsx
try {
  await completeStep();
} catch (error) {
  console.error("Failed to complete step:", error);
  // Show user-friendly error message
}
```

### 3. Save before critical operations

```tsx
const handleCriticalAction = async () => {
  await save(); // Ensure state is saved
  // Perform critical operation
};
```

### 4. Clear workflow when done

```tsx
const handleComplete = () => {
  clearWorkflow();
  router.push("/dashboard");
};
```

### 5. Use optional hook for conditional rendering

```tsx
const workflow = useWorkflowOptional();

if (!workflow) {
  return <div>No workflow active</div>;
}
```

## Troubleshooting

### Workflow not saving

- Check network connection
- Check browser console for errors
- Verify user has permission to update workflow
- Check `saveError` state for details

### Local storage not working

- Check browser privacy settings
- Verify local storage is not full
- Check for browser extensions blocking storage

### State not updating

- Ensure you're using the actions (completeStep, skipStep, etc.)
- Don't mutate state directly
- Check that workflow is loaded (`isLoaded === true`)

### Auto-save not triggering

- Verify `autoSaveDelay` is set correctly
- Check that state is actually changing
- Look for errors in `saveError`

## Related Files

- `src/contexts/workflow-context.tsx` - Main implementation
- `src/contexts/workflow-context-example.tsx` - Usage examples
- `src/lib/workflow-state-manager.ts` - State transition logic
- `src/lib/workflow-instance-service.ts` - Database operations
- `src/types/workflows.ts` - Type definitions
