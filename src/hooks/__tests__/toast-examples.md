# Enhanced Toast System - Usage Examples

This document demonstrates how to use the enhanced toast notification system with the new variants and helper functions.

## Import

```typescript
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showAIToast,
  showPersistentToast,
  toast,
  TOAST_DURATION,
} from "@/hooks/use-toast";
```

## Success Toast

Use for successful operations. Auto-dismisses after 3 seconds.

```typescript
showSuccessToast(
  "Profile Updated",
  "Your profile has been successfully updated."
);
```

## Error Toast

Use for errors and failures. Auto-dismisses after 5 seconds (longer than success).

```typescript
showErrorToast("Upload Failed", "Unable to upload the file. Please try again.");
```

## Warning Toast

Use for warnings and cautions. Auto-dismisses after 4 seconds.

```typescript
showWarningToast(
  "Storage Almost Full",
  "You're using 90% of your storage space."
);
```

## AI Toast

Use for AI operations and processing. Auto-dismisses after 4 seconds.

```typescript
showAIToast("Generating Content", "AI is creating your marketing plan...");
```

## Persistent Toast

Use for important messages that require user acknowledgment. Does not auto-dismiss.

```typescript
showPersistentToast(
  "Action Required",
  "Please verify your email address to continue.",
  "warning" // Optional variant
);
```

## Custom Toast

For more control, use the base `toast` function:

```typescript
toast({
  title: "Custom Toast",
  description: "This has a custom duration",
  variant: "success",
  duration: 2000, // 2 seconds
});
```

## Manual Dismissal

All toast functions return an object with a `dismiss` method:

```typescript
const myToast = showSuccessToast("Processing", "Please wait...");

// Later, dismiss manually
myToast.dismiss();
```

## Duration Constants

Available duration constants:

```typescript
TOAST_DURATION.SUCCESS; // 3000ms (3 seconds)
TOAST_DURATION.ERROR; // 5000ms (5 seconds)
TOAST_DURATION.WARNING; // 4000ms (4 seconds)
TOAST_DURATION.AI; // 4000ms (4 seconds)
TOAST_DURATION.DEFAULT; // 4000ms (4 seconds)
TOAST_DURATION.PERSISTENT; // Infinity (never auto-dismiss)
```

## Available Variants

- `default` - Standard toast with default styling
- `destructive` - Red error styling (used by `showErrorToast`)
- `success` - Green success styling (used by `showSuccessToast`)
- `warning` - Amber warning styling (used by `showWarningToast`)
- `ai` - Gradient AI styling (used by `showAIToast`)

## Real-World Examples

### Form Submission

```typescript
async function handleSubmit(data: FormData) {
  try {
    await submitForm(data);
    showSuccessToast("Form Submitted", "Your data has been saved.");
  } catch (error) {
    showErrorToast("Submission Failed", error.message);
  }
}
```

### AI Content Generation

```typescript
async function generateContent() {
  const loadingToast = showAIToast(
    "Generating Content",
    "This may take a few moments..."
  );

  try {
    const content = await aiService.generate();
    loadingToast.dismiss();
    showSuccessToast("Content Ready", "Your content has been generated.");
  } catch (error) {
    loadingToast.dismiss();
    showErrorToast("Generation Failed", "Please try again.");
  }
}
```

### Important Notifications

```typescript
function showMaintenanceWarning() {
  showPersistentToast(
    "Scheduled Maintenance",
    "The system will be down for maintenance on Sunday at 2 AM.",
    "warning"
  );
}
```
