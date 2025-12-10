# Onboarding Components

Reusable React components for building consistent, accessible, and animated onboarding flows.

## Features

- ✅ **Consistent Layout**: Unified design across all onboarding steps
- ✅ **Progress Tracking**: Visual progress bar and step indicators
- ✅ **Responsive Design**: Mobile-first with tablet and desktop optimizations
- ✅ **Accessibility**: WCAG AA compliant with ARIA labels and keyboard navigation
- ✅ **Animations**: Smooth Framer Motion page transitions
- ✅ **Flexible Navigation**: Back, Skip, and Next buttons with customization
- ✅ **Loading States**: Built-in support for async operations
- ✅ **TypeScript**: Fully typed with comprehensive interfaces

## Components

### OnboardingContainer

Main wrapper component that provides consistent layout and navigation for all onboarding steps.

**Props:**

```typescript
interface OnboardingContainerProps {
  currentStep: number; // Current step number (1-based)
  totalSteps: number; // Total number of steps
  stepId: string; // Unique step identifier
  title: string; // Step title
  description: string; // Step description
  children: React.ReactNode; // Step content
  onNext?: () => void | Promise<void>; // Next button handler
  onSkip?: () => void | Promise<void>; // Skip button handler
  onBack?: () => void; // Back button handler
  nextLabel?: string; // Next button text (default: "Continue")
  skipLabel?: string; // Skip button text (default: "Skip")
  showProgress?: boolean; // Show progress bar (default: true)
  allowSkip?: boolean; // Show skip button (default: true)
  isLoading?: boolean; // Loading state (default: false)
}
```

**Example:**

```typescript
<OnboardingContainer
  currentStep={1}
  totalSteps={6}
  stepId="welcome"
  title="Welcome to Bayon Coagent"
  description="Let's get you set up"
  onNext={() => router.push("/onboarding/profile")}
  onSkip={() => router.push("/dashboard")}
>
  <div>Your content here</div>
</OnboardingContainer>
```

### OnboardingProgress

Standalone progress indicator component (used internally by OnboardingContainer).

**Props:**

```typescript
interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}
```

**Features:**

- Animated progress bar
- Responsive step indicators
- Mobile: Simplified dots
- Tablet: Medium circles with checkmarks
- Desktop: Large circles with checkmarks

### OnboardingNavigation

Standalone navigation buttons component (used internally by OnboardingContainer).

**Props:**

```typescript
interface OnboardingNavigationProps {
  onNext?: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  onBack?: () => void;
  nextLabel?: string;
  skipLabel?: string;
  allowSkip?: boolean;
  showBack?: boolean;
  isLoading?: boolean;
}
```

## Installation

Components are already installed in the project. Import from:

```typescript
import {
  OnboardingContainer,
  OnboardingProgress,
  OnboardingNavigation,
} from "@/components/onboarding";
```

## Usage

### Basic Step

```typescript
"use client";

import { useRouter } from "next/navigation";
import { OnboardingContainer } from "@/components/onboarding";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <OnboardingContainer
      currentStep={1}
      totalSteps={6}
      stepId="welcome"
      title="Welcome"
      description="Let's get started"
      onNext={() => router.push("/onboarding/profile")}
      onSkip={() => router.push("/dashboard")}
    >
      <div>Your welcome content</div>
    </OnboardingContainer>
  );
}
```

### Form Step with Validation

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingContainer } from "@/components/onboarding";

export default function ProfilePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveProfile(formData);
      router.push("/onboarding/tour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.name && formData.email;

  return (
    <OnboardingContainer
      currentStep={2}
      totalSteps={6}
      stepId="profile"
      title="Set Up Your Profile"
      description="Tell us about yourself"
      onNext={isValid ? handleSubmit : undefined}
      isLoading={isSubmitting}
    >
      <form>{/* Your form fields */}</form>
    </OnboardingContainer>
  );
}
```

### Step with Back Navigation

```typescript
<OnboardingContainer
  currentStep={3}
  totalSteps={6}
  stepId="tour"
  title="Feature Tour"
  description="Explore the platform"
  onNext={() => router.push("/onboarding/selection")}
  onBack={() => router.push("/onboarding/profile")}
  onSkip={() => router.push("/dashboard")}
>
  <div>Tour content</div>
</OnboardingContainer>
```

### Final Step (No Skip)

```typescript
<OnboardingContainer
  currentStep={6}
  totalSteps={6}
  stepId="complete"
  title="You're All Set!"
  description="Welcome aboard"
  onNext={() => router.push("/dashboard")}
  nextLabel="Go to Dashboard"
  allowSkip={false}
>
  <div>Completion celebration</div>
</OnboardingContainer>
```

## Responsive Behavior

### Progress Indicators

| Breakpoint          | Size    | Style                         |
| ------------------- | ------- | ----------------------------- |
| Mobile (< 768px)    | 2-2.5px | Simple dots                   |
| Tablet (768-1024px) | 7x7     | Circles with checkmarks       |
| Desktop (> 1024px)  | 8x8     | Large circles with checkmarks |

### Navigation Buttons

| Breakpoint | Layout                         |
| ---------- | ------------------------------ |
| Mobile     | Stacked vertically, full width |
| Desktop    | Horizontal, auto width         |

## Accessibility

All components include:

- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling
- **Progress Announcements**: Screen reader progress updates
- **Touch Targets**: Minimum 44x44px for mobile
- **Color Contrast**: WCAG AA compliant

## Animations

Page transitions use Framer Motion:

```typescript
{
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
  },
}
```

## Testing

Run component tests:

```bash
npm test -- src/components/onboarding/__tests__/onboarding-components.test.tsx
```

**Test Coverage:**

- 17 tests, all passing
- OnboardingProgress: 3 tests
- OnboardingNavigation: 8 tests
- OnboardingContainer: 6 tests

## File Structure

```
src/components/onboarding/
├── __tests__/
│   └── onboarding-components.test.tsx
├── examples/
│   └── basic-usage.tsx
├── index.ts
├── onboarding-container.tsx
├── onboarding-navigation.tsx
├── onboarding-progress.tsx
├── QUICK_REFERENCE.md
└── README.md
```

## Integration with Onboarding Service

```typescript
import { useOnboarding } from "@/hooks/use-onboarding";

export default function ProfilePage() {
  const { state, completeStep, skipStep } = useOnboarding();

  const handleNext = async () => {
    await completeStep("profile");
    router.push("/onboarding/tour");
  };

  const handleSkip = async () => {
    await skipStep("profile");
    router.push("/dashboard");
  };

  return (
    <OnboardingContainer
      currentStep={state.currentStep}
      totalSteps={6}
      stepId="profile"
      title="Set Up Your Profile"
      description="Tell us about yourself"
      onNext={handleNext}
      onSkip={handleSkip}
    >
      <ProfileForm />
    </OnboardingContainer>
  );
}
```

## Best Practices

1. **Always use OnboardingContainer** for consistency across all steps
2. **Set unique stepId** for each step to enable proper tracking
3. **Handle async operations** with loading states
4. **Provide meaningful labels** for navigation buttons
5. **Test on mobile devices** to ensure touch interactions work
6. **Use router.push** for navigation between steps
7. **Integrate with onboarding service** for state persistence
8. **Add error handling** for form submissions
9. **Show loading states** during async operations
10. **Follow accessibility guidelines** (WCAG AA)

## Common Patterns

### Conditional Next Button

```typescript
const isValid = validateForm(formData);

<OnboardingContainer
  onNext={isValid ? handleSubmit : undefined}
  // ... other props
>
```

### Custom Button Labels

```typescript
<OnboardingContainer
  nextLabel={isLastStep ? 'Finish' : 'Continue'}
  skipLabel="I'll do this later"
  // ... other props
>
```

### Loading State

```typescript
const [isLoading, setIsLoading] = useState(false);

<OnboardingContainer
  isLoading={isLoading}
  onNext={async () => {
    setIsLoading(true);
    await saveData();
    setIsLoading(false);
  }}
  // ... other props
>
```

## Troubleshooting

### Progress bar not showing

- Ensure `showProgress={true}` (default)
- Check that `currentStep` and `totalSteps` are valid numbers

### Navigation buttons not working

- Verify handlers are provided: `onNext`, `onSkip`, `onBack`
- Check for TypeScript errors in handler functions
- Ensure async handlers use `async/await` properly

### Animations not smooth

- Framer Motion is mocked in tests
- Check browser console for errors
- Verify `stepId` is unique for each step

### Mobile layout issues

- Test on actual mobile devices
- Check responsive hooks are working
- Verify touch targets are 44x44px minimum

## Requirements Satisfied

- ✅ **9.1**: Progress indicator with current step and total steps
- ✅ **9.2**: Progress updates before transitions
- ✅ **9.3**: Visual design clearly communicates completion percentage
- ✅ **10.1**: Skip option available on all steps

## Related Documentation

- [Quick Reference](./QUICK_REFERENCE.md) - Quick usage guide
- [Examples](./examples/basic-usage.tsx) - Code examples
- [Task Summary](../../.kiro/specs/user-onboarding/TASK_5_LAYOUT_COMPONENTS_SUMMARY.md) - Implementation details
- [Design Document](../../.kiro/specs/user-onboarding/design.md) - Full design specification

## Support

For questions or issues:

1. Check the [Quick Reference](./QUICK_REFERENCE.md)
2. Review [Examples](./examples/basic-usage.tsx)
3. Run tests to verify setup
4. Check TypeScript errors with `npm run typecheck`
