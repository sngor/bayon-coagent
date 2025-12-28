# AI Operation Progress System

A comprehensive system for tracking and displaying AI operation progress with smart estimates, contextual messages, and cancellation support.

## Features

- **Historical Data Tracking**: Stores operation execution times in localStorage
- **Smart Estimates**: Calculates estimated completion time based on previous runs
- **Confidence Levels**: Shows estimate confidence (low/medium/high) based on sample size
- **Contextual Messages**: Operation-specific status messages that update with progress
- **Cancellation Support**: Allows users to cancel long-running operations
- **Auto Progress**: Automatically updates progress based on elapsed time
- **Dual Display Modes**: Full and compact versions for different layouts

## Components

### AIOperationProgress

Full-featured progress indicator with all bells and whistles.

```tsx
import {
  AIOperationProgress,
  useAIOperation,
} from "@/components/ui/ai-operation-progress";

function MyComponent() {
  const operation = useAIOperation("generate-marketing-plan");

  const handleGenerate = async () => {
    const tracker = operation.start();

    try {
      // Your AI operation here
      const result = await generateMarketingPlan(data);

      // Update progress manually if needed
      tracker.updateProgress(50, "Halfway there...");

      operation.complete();
    } catch (error) {
      operation.fail(error.message);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate Plan</button>

      {operation.isRunning && operation.tracker && (
        <AIOperationProgress
          operationName="generate-marketing-plan"
          tracker={operation.tracker}
          onCancel={operation.cancel}
        />
      )}
    </div>
  );
}
```

### AIOperationProgressCompact

Smaller inline version for space-constrained layouts.

```tsx
<AIOperationProgressCompact
  operationName="generate-blog-post"
  tracker={tracker}
  onCancel={handleCancel}
/>
```

## Hook: useAIOperation

Manages the lifecycle of an AI operation.

```tsx
const {
  tracker, // Current tracker instance
  isRunning, // Whether operation is running
  error, // Error message if failed
  start, // Start the operation
  complete, // Mark as completed
  fail, // Mark as failed
  cancel, // Cancel the operation
  updateProgress, // Update progress manually
} = useAIOperation("operation-name");
```

## AIOperationTracker Class

Low-level class for tracking operations.

```tsx
import { AIOperationTracker } from "@/lib/ai-operation-tracker";

const tracker = new AIOperationTracker("generate-marketing-plan");

// Start tracking
tracker.start();

// Set up progress callback
tracker.onProgress((progress, message) => {
  console.log(`${progress}%: ${message}`);
});

// Update progress
tracker.updateProgress(50, "Processing data...");

// Get abort signal for cancellation
const signal = tracker.getAbortSignal();

// Complete or fail
tracker.complete();
// or
tracker.fail("Error message");

// Cancel
tracker.cancel();
```

## Utility Functions

### getOperationEstimate

Get estimated duration for an operation based on historical data.

```tsx
import { getOperationEstimate } from "@/lib/ai-operation-tracker";

const estimate = getOperationEstimate("generate-marketing-plan");
// {
//   estimatedDuration: 15000, // milliseconds
//   confidence: 'high',
//   basedOnSamples: 8
// }
```

### formatDuration

Format milliseconds into human-readable duration.

```tsx
import { formatDuration } from "@/lib/ai-operation-tracker";

formatDuration(5000); // "5 seconds"
formatDuration(65000); // "1 minute 5 seconds"
formatDuration(500); // "less than a second"
```

### getContextualMessage

Get operation-specific status message based on progress.

```tsx
import { getContextualMessage } from "@/lib/ai-operation-tracker";

getContextualMessage("generate-marketing-plan", 25);
// "Researching competitor strategies..."

getContextualMessage("generate-marketing-plan", 75);
// "Finalizing your marketing plan..."
```

## Operation Names

Supported operation names with default estimates:

- `generate-marketing-plan` (15s)
- `run-nap-audit` (20s)
- `find-competitors` (25s)
- `generate-blog-post` (30s)
- `run-research-agent` (45s)
- `generate-neighborhood-guide` (20s)
- `generate-listing-description` (10s)
- `generate-social-media-post` (8s)
- `generate-video-script` (15s)
- `generate-market-update` (12s)
- `analyze-reviews` (10s)

## Contextual Messages

Each operation has 4 contextual messages that display based on progress:

**generate-marketing-plan:**

1. Analyzing your profile and market...
2. Researching competitor strategies...
3. Crafting personalized action items...
4. Finalizing your marketing plan...

**run-nap-audit:**

1. Searching for your business listings...
2. Checking NAP consistency...
3. Analyzing citation quality...
4. Compiling audit results...

**find-competitors:**

1. Searching for competitors in your area...
2. Analyzing competitor profiles...
3. Gathering market intelligence...
4. Ranking competitors by relevance...

## Integration with Server Actions

```tsx
"use server";

import { AIOperationTracker } from "@/lib/ai-operation-tracker";

export async function generateMarketingPlanAction(data: FormData) {
  const tracker = new AIOperationTracker("generate-marketing-plan");
  tracker.start();

  try {
    // Check for cancellation
    if (tracker.isCancelled()) {
      return { error: "Operation cancelled" };
    }

    // Your AI operation
    const result = await bedrockClient.invoke({
      // ...
      signal: tracker.getAbortSignal(), // Pass abort signal
    });

    tracker.complete();
    return { data: result };
  } catch (error) {
    tracker.fail(error.message);
    return { error: error.message };
  }
}
```

## Styling

The components use Tailwind CSS and respect your theme configuration:

- Animations: Smooth fade-in and slide-in animations
- Colors: Uses theme colors (primary, muted, destructive)
- Dark mode: Fully supported
- Responsive: Works on all screen sizes

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard accessible cancel button
- Reduced motion support (animations respect `prefers-reduced-motion`)
- Clear visual feedback for all states

## Performance

- Efficient updates with 100ms intervals
- Minimal re-renders with React.useCallback
- LocalStorage operations are debounced
- Automatic cleanup on unmount

## Browser Support

- Modern browsers with localStorage support
- Graceful degradation if localStorage is unavailable
- AbortController support for cancellation (all modern browsers)

## Demo

Visit `/ai-operation-progress-demo` to see all features in action.
