# Feedback Cue System

A comprehensive feedback system that provides inline guidance, contextual tooltips, progress indicators, success/error feedback, and loading states with estimated time remaining. The system stores seen state in user preferences to avoid repetition.

## Features

- **Inline Guidance**: Contextual feedback cues with dismissible messages
- **Progress Indicators**: Multi-step progress tracking with visual feedback
- **Loading States**: Loading feedback with estimated time remaining
- **Success/Error Feedback**: Clear feedback with actionable next steps
- **Persistent State**: Remembers dismissed cues to avoid repetition
- **Accessibility**: Full ARIA support and keyboard navigation

## Components

### FeedbackCue

Main component for inline guidance and contextual feedback.

```tsx
import { FeedbackCue } from "@/components/ui/feedback-cue";

<FeedbackCue
  id="profile-completion-hint"
  type="help"
  title="Complete your profile"
  description="Adding more information helps us provide better recommendations."
  nextSteps={[
    "Add your business address",
    "Upload a profile photo",
    "Connect your Google Business Profile",
  ]}
  action={{
    label: "Complete Profile",
    onClick: () => router.push("/profile"),
  }}
  showOnce={true}
  dismissible={true}
/>;
```

**Props:**

- `id` (string, required): Unique identifier for persistence
- `type` (FeedbackType, required): Type of feedback - "info" | "success" | "warning" | "error" | "help"
- `title` (string, required): Main message title
- `description` (string, optional): Additional details
- `nextSteps` (string[], optional): List of actionable next steps
- `action` (object, optional): Primary action button configuration
- `dismissible` (boolean, default: true): Whether the cue can be dismissed
- `onDismiss` (function, optional): Callback when dismissed
- `showOnce` (boolean, default: false): Show only on first interaction
- `className` (string, optional): Additional CSS classes

### ProgressIndicator

Multi-step progress indicator with visual feedback.

```tsx
import { ProgressIndicator } from "@/components/ui/feedback-cue";

<ProgressIndicator
  currentStep={1}
  totalSteps={4}
  stepLabels={[
    "Enter business information",
    "Connect integrations",
    "Review settings",
    "Complete setup",
  ]}
  showNumbers={true}
/>;
```

**Props:**

- `currentStep` (number, required): Current step index (0-based)
- `totalSteps` (number, required): Total number of steps
- `stepLabels` (string[], optional): Labels for each step
- `showNumbers` (boolean, default: true): Show step numbers
- `className` (string, optional): Additional CSS classes

### LoadingFeedback

Loading state with estimated time remaining.

```tsx
import { LoadingFeedback } from "@/components/ui/feedback-cue";

<LoadingFeedback
  message="Generating your marketing plan..."
  estimatedTime={30}
  showProgress={true}
  progress={45}
/>;
```

**Props:**

- `message` (string, required): Loading message
- `estimatedTime` (number, optional): Estimated time in seconds
- `showProgress` (boolean, default: false): Show progress bar
- `progress` (number, optional): Progress percentage (0-100)
- `className` (string, optional): Additional CSS classes

### SuccessErrorFeedback

Success or error feedback with clear next steps.

```tsx
import { SuccessErrorFeedback } from "@/components/ui/feedback-cue";

// Success example
<SuccessErrorFeedback
  type="success"
  title="Marketing plan generated!"
  description="Your personalized 3-step marketing plan is ready."
  nextSteps={[
    "Review your action items",
    "Connect your social media accounts",
    "Start creating content"
  ]}
  primaryAction={{
    label: "View Plan",
    onClick: () => router.push("/marketing-plan")
  }}
  secondaryAction={{
    label: "Generate Another",
    onClick: handleRegenerate
  }}
/>

// Error example
<SuccessErrorFeedback
  type="error"
  title="Failed to generate plan"
  description="We couldn't generate your marketing plan. Please try again."
  nextSteps={[
    "Check your internet connection",
    "Ensure your profile is complete",
    "Contact support if the issue persists"
  ]}
  primaryAction={{
    label: "Try Again",
    onClick: handleRetry
  }}
  secondaryAction={{
    label: "Contact Support",
    onClick: () => router.push("/support")
  }}
/>
```

**Props:**

- `type` ("success" | "error", required): Type of feedback
- `title` (string, required): Main message title
- `description` (string, optional): Additional details
- `nextSteps` (string[], optional): List of actionable next steps
- `primaryAction` (object, optional): Primary action button
- `secondaryAction` (object, optional): Secondary action button
- `dismissible` (boolean, default: true): Whether feedback can be dismissed
- `onDismiss` (function, optional): Callback when dismissed
- `className` (string, optional): Additional CSS classes

### InlineTooltip

Compact inline tooltip for contextual hints.

```tsx
import { InlineTooltip } from "@/components/ui/feedback-cue";

<div className="flex items-center gap-2">
  <label>Business Name</label>
  <InlineTooltip
    id="business-name-hint"
    content="Use your official business name as registered"
    showOnce={true}
  />
</div>;
```

**Props:**

- `id` (string, required): Unique identifier for persistence
- `content` (string, required): Tooltip content
- `showOnce` (boolean, default: true): Show only once
- `className` (string, optional): Additional CSS classes

## Usage Examples

### Onboarding Flow

```tsx
"use client";

import { useState } from "react";
import { ProgressIndicator, FeedbackCue } from "@/components/ui/feedback-cue";

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Create your profile",
    "Connect integrations",
    "Run brand audit",
    "Generate marketing plan",
  ];

  return (
    <div className="space-y-6">
      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        stepLabels={steps}
      />

      {currentStep === 0 && (
        <FeedbackCue
          id="onboarding-profile-step"
          type="help"
          title="Let's start with your profile"
          description="We need some basic information to personalize your experience."
          nextSteps={[
            "Enter your business name and contact info",
            "Add your service areas",
            "Upload a professional photo",
          ]}
          showOnce={true}
        />
      )}

      {/* Step content here */}
    </div>
  );
}
```

### AI Operation with Loading State

```tsx
"use client";

import { useState } from "react";
import {
  LoadingFeedback,
  SuccessErrorFeedback,
} from "@/components/ui/feedback-cue";

export function MarketingPlanGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      await generatePlan();
      setResult("success");
    } catch (error) {
      setResult("error");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <LoadingFeedback
        message="AI is analyzing your brand and creating your personalized plan..."
        estimatedTime={45}
        showProgress={true}
        progress={calculateProgress()}
      />
    );
  }

  if (result === "success") {
    return (
      <SuccessErrorFeedback
        type="success"
        title="Your marketing plan is ready!"
        description="We've created a personalized 3-step plan based on your brand audit."
        nextSteps={[
          "Review your priority actions",
          "Set up your content calendar",
          "Start with the first action item",
        ]}
        primaryAction={{
          label: "View Plan",
          onClick: () => router.push("/marketing-plan"),
        }}
      />
    );
  }

  if (result === "error") {
    return (
      <SuccessErrorFeedback
        type="error"
        title="Generation failed"
        description="We couldn't generate your plan. This might be due to incomplete profile data."
        nextSteps={[
          "Complete your profile information",
          "Run a brand audit first",
          "Try again in a few moments",
        ]}
        primaryAction={{
          label: "Try Again",
          onClick: handleGenerate,
        }}
        secondaryAction={{
          label: "Complete Profile",
          onClick: () => router.push("/profile"),
        }}
      />
    );
  }

  return <button onClick={handleGenerate}>Generate Marketing Plan</button>;
}
```

### Form Validation Feedback

```tsx
"use client";

import { useState } from "react";
import { FeedbackCue } from "@/components/ui/feedback-cue";

export function ProfileForm() {
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit form
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <FeedbackCue
          id="form-validation-error"
          type="error"
          title="Please fix the following errors"
          nextSteps={errors}
          dismissible={true}
          onDismiss={() => setErrors([])}
        />
      )}

      {/* Form fields */}
    </form>
  );
}
```

### First-Time Feature Guidance

```tsx
"use client";

import { FeedbackCue, InlineTooltip } from "@/components/ui/feedback-cue";

export function ContentEngine() {
  return (
    <div className="space-y-6">
      <FeedbackCue
        id="content-engine-first-use"
        type="help"
        title="Welcome to the Content Engine!"
        description="Generate high-quality marketing content in seconds using AI."
        nextSteps={[
          "Choose a content type below",
          "Fill in the required information",
          "Let AI create professional content for you",
        ]}
        showOnce={true}
      />

      <div className="flex items-center gap-2">
        <h2>Content Type</h2>
        <InlineTooltip
          id="content-type-hint"
          content="Different content types are optimized for specific platforms and purposes"
        />
      </div>

      {/* Content type selection */}
    </div>
  );
}
```

## Integration with Tooltip Context

The feedback cue system integrates with the existing `TooltipContext` to persist seen state:

```tsx
// In your app layout
import { TooltipProvider } from "@/contexts/tooltip-context";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
```

## Accessibility

All components include:

- Proper ARIA roles and labels
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Color contrast compliance

## Best Practices

1. **Use unique IDs**: Always provide unique IDs for components that use persistence
2. **Provide clear next steps**: Help users understand what to do next
3. **Estimate time accurately**: Use historical data to provide realistic time estimates
4. **Don't overuse**: Show feedback cues sparingly to avoid overwhelming users
5. **Test dismissal**: Ensure dismissed cues don't reappear unexpectedly
6. **Handle errors gracefully**: Always provide recovery options in error states

## Requirements Validation

This component satisfies the following requirements:

- **3.4**: Celebratory visual feedback on successful operations
- **8.1**: Progress indicators with contextual messaging for AI operations
- **8.2**: Periodic status updates during long-running operations
- **19.2**: Contextual tooltips for first-time feature use
- **19.5**: Dismissible help hints with persistent state
