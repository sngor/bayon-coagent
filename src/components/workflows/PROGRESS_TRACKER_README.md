# Workflow Progress Tracker Component

## Overview

The `WorkflowProgressTracker` component provides a visual step-by-step progress indicator for guided workflows. It displays step numbers, titles, icons, and visual states (completed, current, upcoming, skipped), allows navigation to completed steps, and provides contextual help for the current step.

## Features

- ✅ **Visual Progress Indicator**: Shows all workflow steps with clear visual states
- ✅ **Step States**: Completed (checkmark), Current (highlighted), Upcoming (gray), Skipped (skip icon)
- ✅ **Navigation**: Click on completed steps to navigate back
- ✅ **Optional Steps**: Visual indicator and skip button for optional steps
- ✅ **Time Tracking**: Displays estimated time remaining
- ✅ **Contextual Help**: Shows help text and tips for the current step
- ✅ **Responsive**: Supports both vertical (desktop) and horizontal (mobile) layouts
- ✅ **Animations**: Smooth transitions using Framer Motion

## Requirements Validated

This component validates the following requirements:

- **2.1**: Display all workflow steps with visual indicators
- **8.3**: Display estimated time remaining
- **9.1**: Visual distinction for optional steps
- **9.2**: Skip button for optional steps
- **14.1**: Allow navigation to completed steps
- **14.5**: Prevent navigation to incomplete future steps
- **15.1**: Display contextual help text
- **15.2**: Display tips for current step

## Usage

### Basic Usage

```tsx
import { WorkflowProgressTracker } from '@/components/workflows';
import { WorkflowInstance, WorkflowPreset } from '@/types/workflows';

function MyWorkflowPage() {
  const instance: WorkflowInstance = /* ... */;
  const preset: WorkflowPreset = /* ... */;

  const handleNavigateToStep = (stepId: string) => {
    // Navigate to the specified step
    console.log('Navigate to:', stepId);
  };

  const handleSkipStep = () => {
    // Skip the current step
    console.log('Skip current step');
  };

  const handleCompleteStep = (data?: any) => {
    // Complete the current step
    console.log('Complete step with data:', data);
  };

  return (
    <WorkflowProgressTracker
      instance={instance}
      preset={preset}
      currentStepId={instance.currentStepId}
      onNavigateToStep={handleNavigateToStep}
      onSkipStep={handleSkipStep}
      onCompleteStep={handleCompleteStep}
    />
  );
}
```

### Horizontal Layout (Mobile)

```tsx
<WorkflowProgressTracker
  instance={instance}
  preset={preset}
  currentStepId={instance.currentStepId}
  onNavigateToStep={handleNavigateToStep}
  onSkipStep={handleSkipStep}
  onCompleteStep={handleCompleteStep}
  horizontal={true} // Enable horizontal layout
/>
```

### Without Help Text

```tsx
<WorkflowProgressTracker
  instance={instance}
  preset={preset}
  currentStepId={instance.currentStepId}
  onNavigateToStep={handleNavigateToStep}
  onSkipStep={handleSkipStep}
  onCompleteStep={handleCompleteStep}
  showHelp={false} // Hide help text and tips
/>
```

## Props

| Prop               | Type                       | Required | Description                                      |
| ------------------ | -------------------------- | -------- | ------------------------------------------------ |
| `instance`         | `WorkflowInstance`         | Yes      | The workflow instance                            |
| `preset`           | `WorkflowPreset`           | Yes      | The workflow preset definition                   |
| `currentStepId`    | `string`                   | Yes      | Current step ID                                  |
| `onNavigateToStep` | `(stepId: string) => void` | Yes      | Callback when user navigates to a step           |
| `onSkipStep`       | `() => void`               | Yes      | Callback when user skips the current step        |
| `onCompleteStep`   | `(data?: any) => void`     | Yes      | Callback when user completes the current step    |
| `horizontal`       | `boolean`                  | No       | Whether to display horizontally (default: false) |
| `showHelp`         | `boolean`                  | No       | Whether to show help text (default: true)        |
| `className`        | `string`                   | No       | Custom className                                 |

## Visual States

### Completed Steps

- Green checkmark icon
- Green border and background
- Clickable to navigate back

### Current Step

- Highlighted with primary color
- Ring effect for emphasis
- Shows step number
- Displays help text and tips below

### Upcoming Steps

- Gray appearance
- Shows step number
- Not clickable

### Skipped Steps

- Skip forward icon
- Muted appearance
- Clickable to navigate back

## Step Navigation Rules

1. ✅ Can navigate to completed steps
2. ✅ Can navigate to skipped steps
3. ✅ Can navigate to current step
4. ❌ Cannot navigate to incomplete future steps

## Optional Steps

Optional steps are indicated with:

- "Optional" badge next to the step title
- Skip button in the help section (when it's the current step)

## Time Display

- Shows estimated time remaining at the top
- Formats time as:
  - `15m` for minutes < 60
  - `1h` for exactly 1 hour
  - `1h 30m` for hours with minutes

## Responsive Behavior

### Desktop (Vertical Layout)

- Steps displayed vertically with full details
- Help text and tips shown below the progress indicator
- Connector lines between steps

### Mobile (Horizontal Layout)

- Steps displayed horizontally in a scrollable container
- Compact step cards with tooltips for details
- Help text and tips shown below (if enabled)

## Integration with Workflow Context

The component is designed to work with the workflow context provider:

```tsx
import { useWorkflowContext } from "@/contexts/workflow-context";

function MyWorkflowPage() {
  const {
    instance,
    preset,
    currentStep,
    navigateToStep,
    skipStep,
    completeStep,
  } = useWorkflowContext();

  return (
    <WorkflowProgressTracker
      instance={instance}
      preset={preset}
      currentStepId={currentStep.id}
      onNavigateToStep={navigateToStep}
      onSkipStep={skipStep}
      onCompleteStep={completeStep}
    />
  );
}
```

## Styling

The component uses Tailwind CSS classes and follows the application's design system:

- Primary color for active/completed states
- Muted colors for upcoming/skipped states
- Smooth transitions and animations
- Responsive spacing and sizing

## Accessibility

- Keyboard navigation support (via clickable elements)
- ARIA labels on interactive elements
- Focus management for step navigation
- Screen reader friendly state announcements

## Example

See `workflow-progress-tracker-example.tsx` for a complete working example.

## Related Components

- `DashboardWorkflowWidget`: Browse and select workflow presets
- `WorkflowDetailModal`: Preview workflow before starting (to be implemented)
- `WorkflowCompletionSummary`: Display completion summary (to be implemented)

## Testing

The component should be tested with:

1. Different workflow states (various completion levels)
2. Optional and required steps
3. Navigation to completed steps
4. Skip functionality for optional steps
5. Responsive layouts (vertical and horizontal)
6. Help text display and hiding

## Future Enhancements

- [ ] Add progress percentage bar
- [ ] Add step completion animations
- [ ] Add drag-to-reorder for custom workflows
- [ ] Add step dependencies visualization
- [ ] Add estimated vs actual time comparison
