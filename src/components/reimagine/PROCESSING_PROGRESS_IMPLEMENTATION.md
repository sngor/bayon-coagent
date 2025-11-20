# ProcessingProgress Component Implementation

## Overview

The `ProcessingProgress` component provides real-time visual feedback for image processing operations in the Reimagine Image Toolkit. It displays operation status, progress indicators, estimated completion times, timeout warnings, and error messages with recovery options.

## Requirements Addressed

- **8.1**: Display progress indicator showing operation status
- **8.2**: Update progress indicator with current status while processing
- **8.3**: Notify user when operation completes successfully
- **8.4**: Notify user with clear error message and suggested next steps on failure
- **8.5**: Inform user of delays and estimated completion time when processing exceeds expected duration

## Features

### Status Display

- **Idle**: Ready state before any operation
- **Uploading**: File upload in progress
- **Analyzing**: AI analysis of uploaded image
- **Processing**: Edit operation in progress
- **Completed**: Operation finished successfully
- **Failed**: Operation encountered an error

### Progress Tracking

- Visual progress bar with percentage display
- Elapsed time tracking
- Estimated time remaining (when provided)
- Automatic progress calculation based on elapsed time

### Timeout Warnings

- Monitors operation duration
- Shows warning after 45 seconds (configurable)
- Provides context about delays
- Suggests alternative actions

### Error Handling

- Displays detailed error messages
- Provides actionable recovery suggestions:
  - Try a different image
  - Adjust edit parameters
  - Check internet connection
  - Wait and retry
- Retry button for failed operations

### User Actions

- **Retry**: Available when operation fails
- **Cancel**: Available during processing operations

## Usage

### Basic Usage

```tsx
import { ProcessingProgress } from "@/components/reimagine/processing-progress";

function MyComponent() {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);

  return <ProcessingProgress status={status} progress={progress} />;
}
```

### With Estimated Time

```tsx
<ProcessingProgress
  status="processing"
  progress={45}
  estimatedTime={30} // 30 seconds
/>
```

### With Error Handling

```tsx
<ProcessingProgress
  status="failed"
  error="Failed to process image. The AI model encountered an error."
  onRetry={handleRetry}
/>
```

### With Cancel Support

```tsx
<ProcessingProgress status="processing" progress={60} onCancel={handleCancel} />
```

### Complete Example

```tsx
function ImageEditor() {
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();

  const handleProcess = async () => {
    try {
      setStatus("processing");
      setProgress(0);

      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 1000);

      // Process the image
      const result = await processImage();

      clearInterval(interval);
      setProgress(100);
      setStatus("completed");
    } catch (err) {
      setStatus("failed");
      setError(err.message);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setProgress(0);
    setError(undefined);
    handleProcess();
  };

  const handleCancel = () => {
    setStatus("idle");
    setProgress(0);
  };

  return (
    <ProcessingProgress
      status={status}
      progress={progress}
      estimatedTime={30}
      error={error}
      onRetry={handleRetry}
      onCancel={handleCancel}
    />
  );
}
```

## Props

| Prop            | Type               | Required | Description                                      |
| --------------- | ------------------ | -------- | ------------------------------------------------ |
| `status`        | `ProcessingStatus` | Yes      | Current operation status                         |
| `progress`      | `number`           | No       | Progress percentage (0-100)                      |
| `estimatedTime` | `number`           | No       | Estimated completion time in seconds             |
| `error`         | `string`           | No       | Error message to display when status is "failed" |
| `onRetry`       | `() => void`       | No       | Callback when retry button is clicked            |
| `onCancel`      | `() => void`       | No       | Callback when cancel button is clicked           |
| `className`     | `string`           | No       | Additional CSS classes                           |

## ProcessingStatus Type

```typescript
type ProcessingStatus =
  | "idle"
  | "uploading"
  | "analyzing"
  | "processing"
  | "completed"
  | "failed";
```

## Design Decisions

### Timeout Threshold

- Warning appears after 45 seconds of processing
- Based on 60-second timeout limit from design document
- Provides 15-second buffer before actual timeout

### Progress Calculation

- If explicit progress not provided, calculates based on elapsed time
- Caps automatic progress at 95% to avoid showing 100% before completion
- Prevents misleading "complete" indication

### Animation

- Smooth transitions using Framer Motion
- Spinning icons for active states
- Fade in/out for warnings and errors
- Scale animations for completion state

### Accessibility

- Semantic HTML structure
- ARIA roles for alerts
- Color-coded status indicators
- Clear, descriptive text

### Mobile Optimization

- Touch-friendly button sizes (min 44px)
- Responsive layout
- Readable text sizes
- Adequate spacing

## Integration with Reimagine Toolkit

The component integrates with the broader Reimagine workflow:

1. **Upload Phase**: Shows "uploading" status during file transfer
2. **Analysis Phase**: Shows "analyzing" status during AI suggestion generation
3. **Edit Phase**: Shows "processing" status during Bedrock operations
4. **Completion**: Shows success message and allows preview
5. **Error Recovery**: Provides retry mechanism with suggestions

## Testing

See `processing-progress-example.tsx` for a complete demonstration of all states and interactions.

## Future Enhancements

- Detailed progress stages (e.g., "Initializing model...", "Generating image...")
- Pause/resume functionality for long operations
- Progress history/logs
- Customizable timeout thresholds
- Webhook notifications for completed operations
