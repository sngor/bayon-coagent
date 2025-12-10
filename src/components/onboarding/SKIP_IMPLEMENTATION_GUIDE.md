# Skip Functionality Implementation Guide

This guide explains how to implement skip functionality across all onboarding steps.

## Overview

The skip functionality allows users to bypass onboarding steps and navigate directly to the dashboard. It includes:

1. **Skip Confirmation Dialog** - Warns users about consequences of skipping
2. **State Management** - Tracks which steps are skipped
3. **Navigation** - Redirects to dashboard after skip
4. **Settings Access** - Preserves access to individual steps from settings

## Requirements

- **10.1**: Skip button visible on all onboarding steps
- **10.2**: Confirmation dialog explains consequences
- **10.3**: State marks onboarding as skipped
- **10.4**: Navigation to Dashboard on skip
- **10.5**: Individual steps accessible from settings

## Components

### 1. SkipConfirmationDialog

Located at: `src/components/onboarding/skip-confirmation-dialog.tsx`

A reusable dialog component that:

- Displays warning icon and message
- Lists consequences of skipping
- Provides "Continue Setup" and "Skip to Dashboard" buttons
- Mobile-optimized with touch targets (min 44x44px)

### 2. useOnboardingSkip Hook

Located at: `src/hooks/use-onboarding-skip.ts`

A custom hook that provides:

- `showSkipDialog` - Boolean state for dialog visibility
- `isSkipping` - Boolean state for loading state
- `openSkipDialog()` - Opens the confirmation dialog
- `closeSkipDialog()` - Closes the confirmation dialog
- `handleSkipConfirm()` - Confirms skip and navigates to dashboard
- `handleSkipAll()` - Skips entire onboarding flow

## Implementation Steps

### Step 1: Import Required Components

```typescript
import {
  OnboardingContainer,
  SkipConfirmationDialog,
} from "@/components/onboarding";
import { useOnboardingSkip } from "@/hooks/use-onboarding-skip";
```

### Step 2: Initialize the Hook

```typescript
export default function YourOnboardingPage() {
  // Get userId from auth context
  const userId = "user-id"; // Replace with actual userId

  // Initialize skip functionality
  const {
    showSkipDialog,
    isSkipping,
    openSkipDialog,
    closeSkipDialog,
    handleSkipConfirm,
  } = useOnboardingSkip(userId, "your-step-id");

  // ... rest of component
}
```

### Step 3: Pass Skip Handler to OnboardingContainer

```typescript
<OnboardingContainer
  currentStep={1}
  totalSteps={6}
  stepId="your-step-id"
  title="Your Step Title"
  description="Your step description"
  onNext={handleNext}
  onSkip={openSkipDialog} // <-- Pass openSkipDialog here
  nextLabel="Continue"
>
  {/* Your step content */}
</OnboardingContainer>
```

### Step 4: Add Skip Confirmation Dialog

```typescript
return (
  <>
    <OnboardingContainer {...props}>{/* Your content */}</OnboardingContainer>

    <SkipConfirmationDialog
      open={showSkipDialog}
      onOpenChange={closeSkipDialog}
      onConfirm={handleSkipConfirm}
      isLoading={isSkipping}
    />
  </>
);
```

## Complete Example

```typescript
"use client";

import { useRouter } from "next/navigation";
import {
  OnboardingContainer,
  SkipConfirmationDialog,
} from "@/components/onboarding";
import { useOnboardingSkip } from "@/hooks/use-onboarding-skip";

export default function ProfileSetupPage() {
  const router = useRouter();

  // TODO: Get actual userId from auth context
  const userId = "temp-user-id";

  // Initialize skip functionality
  const {
    showSkipDialog,
    isSkipping,
    openSkipDialog,
    closeSkipDialog,
    handleSkipConfirm,
  } = useOnboardingSkip(userId, "profile");

  const handleNext = () => {
    // Navigate to next step
    router.push("/onboarding/user/tour");
  };

  return (
    <>
      <OnboardingContainer
        currentStep={2}
        totalSteps={6}
        stepId="profile"
        title="Set Up Your Profile"
        description="Tell us about yourself so we can personalize your experience"
        onNext={handleNext}
        onSkip={openSkipDialog}
        nextLabel="Continue"
      >
        {/* Your profile form content */}
      </OnboardingContainer>

      <SkipConfirmationDialog
        open={showSkipDialog}
        onOpenChange={closeSkipDialog}
        onConfirm={handleSkipConfirm}
        isLoading={isSkipping}
      />
    </>
  );
}
```

## Skip All vs Skip Step

### Skip Step (Default)

Use `handleSkipConfirm()` to skip the current step:

- Marks the specific step as skipped
- Navigates to dashboard
- User can resume onboarding later

```typescript
const { handleSkipConfirm } = useOnboardingSkip(userId, "step-id");
```

### Skip All

Use `handleSkipAll()` to skip the entire onboarding:

- Marks entire onboarding as complete
- Navigates to dashboard
- No resume banner will appear

```typescript
const { handleSkipAll } = useOnboardingSkip(userId);

// In your component
<Button onClick={handleSkipAll}>Skip All Setup</Button>;
```

## Accessing Steps from Settings

After skipping, users can access individual onboarding steps from settings:

1. Navigate to `/settings/onboarding`
2. Display list of all onboarding steps
3. Allow users to complete individual steps
4. Update onboarding state accordingly

Example settings page structure:

```typescript
// src/app/(app)/settings/onboarding/page.tsx
export default function OnboardingSettingsPage() {
  const steps = [
    { id: "profile", name: "Profile Setup", path: "/onboarding/user/profile" },
    { id: "tour", name: "Feature Tour", path: "/onboarding/user/tour" },
    // ... more steps
  ];

  return (
    <div>
      <h1>Onboarding Steps</h1>
      {steps.map((step) => (
        <Link key={step.id} href={step.path}>
          {step.name}
        </Link>
      ))}
    </div>
  );
}
```

## Testing

### Unit Tests

Test the skip functionality:

```typescript
describe("Skip Functionality", () => {
  it("opens skip dialog when skip button clicked", () => {
    // Test implementation
  });

  it("marks step as skipped on confirm", async () => {
    // Test implementation
  });

  it("navigates to dashboard after skip", async () => {
    // Test implementation
  });

  it("shows toast notification after skip", async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test the complete skip flow:

```typescript
describe("Skip Flow", () => {
  it("completes skip flow from welcome to dashboard", async () => {
    // 1. Render welcome page
    // 2. Click skip button
    // 3. Confirm in dialog
    // 4. Verify navigation to dashboard
    // 5. Verify state updated
  });
});
```

## Accessibility

The skip functionality is fully accessible:

- **Keyboard Navigation**: Tab to skip button, Enter to activate
- **Screen Readers**: ARIA labels on all interactive elements
- **Focus Management**: Focus moves to dialog when opened
- **Touch Targets**: Minimum 44x44px on mobile devices

## Mobile Optimization

The skip functionality is optimized for mobile:

- Touch-optimized buttons (min 44x44px)
- Responsive dialog layout
- Reduced animation duration on mobile
- Simplified text on small screens

## Error Handling

The skip functionality handles errors gracefully:

- Network errors: Retry with exponential backoff
- State errors: Show user-friendly error message
- Navigation errors: Fallback to dashboard
- Toast notifications for all error states

## Best Practices

1. **Always use the hook**: Don't implement skip logic manually
2. **Provide step ID**: Pass the current step ID to track skipped steps
3. **Show confirmation**: Always show the confirmation dialog
4. **Handle errors**: Display user-friendly error messages
5. **Test thoroughly**: Test skip functionality on all steps
6. **Mobile-first**: Ensure touch targets meet minimum size
7. **Accessibility**: Test with keyboard and screen readers

## Troubleshooting

### Skip button not appearing

- Check `allowSkip` prop on `OnboardingContainer` (default: true)
- Verify `onSkip` handler is passed to `OnboardingContainer`

### Dialog not opening

- Check `showSkipDialog` state
- Verify `openSkipDialog` is called on skip button click

### Navigation not working

- Check router is imported from 'next/navigation'
- Verify dashboard route exists at '/dashboard'

### State not updating

- Check userId is valid
- Verify onboarding service is initialized
- Check DynamoDB connection

## Related Files

- `src/components/onboarding/skip-confirmation-dialog.tsx` - Dialog component
- `src/hooks/use-onboarding-skip.ts` - Skip functionality hook
- `src/services/onboarding/onboarding-service.ts` - Onboarding state management
- `src/types/onboarding.ts` - Type definitions
- `src/app/(onboarding)/welcome/page.tsx` - Example implementation
