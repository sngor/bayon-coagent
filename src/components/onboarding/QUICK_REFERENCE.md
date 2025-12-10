# Onboarding Components - Quick Reference

## Overview

Reusable components for building consistent onboarding flows with progress tracking, navigation, and animations.

## Components

### OnboardingContainer

Main wrapper for all onboarding steps.

```typescript
import { OnboardingContainer } from "@/components/onboarding";

<OnboardingContainer
  currentStep={1} // Current step number (1-based)
  totalSteps={6} // Total number of steps
  stepId="welcome" // Unique step identifier
  title="Welcome" // Step title
  description="Get started" // Step description
  onNext={handleNext} // Next button handler (optional)
  onSkip={handleSkip} // Skip button handler (optional)
  onBack={handleBack} // Back button handler (optional)
  nextLabel="Continue" // Next button text (default: "Continue")
  skipLabel="Skip" // Skip button text (default: "Skip")
  showProgress={true} // Show progress bar (default: true)
  allowSkip={true} // Show skip button (default: true)
  isLoading={false} // Loading state (default: false)
>
  {/* Your step content */}
</OnboardingContainer>;
```

### OnboardingProgress

Standalone progress indicator (used internally by OnboardingContainer).

```typescript
import { OnboardingProgress } from "@/components/onboarding";

<OnboardingProgress
  currentStep={2}
  totalSteps={5}
  className="custom-class" // Optional
/>;
```

### OnboardingNavigation

Standalone navigation buttons (used internally by OnboardingContainer).

```typescript
import { OnboardingNavigation } from "@/components/onboarding";

<OnboardingNavigation
  onNext={handleNext}
  onSkip={handleSkip}
  onBack={handleBack}
  nextLabel="Get Started"
  skipLabel="Skip for now"
  allowSkip={true}
  showBack={false}
  isLoading={false}
/>;
```

## Common Patterns

### Basic Step

```typescript
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
      <div>Your content here</div>
    </OnboardingContainer>
  );
}
```

### Step with Form Submission

```typescript
export default function ProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveProfile(formData);
      router.push("/onboarding/tour");
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingContainer
      currentStep={2}
      totalSteps={6}
      stepId="profile"
      title="Set Up Your Profile"
      description="Tell us about yourself"
      onNext={handleSubmit}
      isLoading={isSubmitting}
    >
      <ProfileForm />
    </OnboardingContainer>
  );
}
```

### Step with Back Navigation

```typescript
export default function TourPage() {
  const router = useRouter();

  return (
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
      <FeatureTour />
    </OnboardingContainer>
  );
}
```

### Final Step (No Skip)

```typescript
export default function CompletePage() {
  const router = useRouter();

  return (
    <OnboardingContainer
      currentStep={6}
      totalSteps={6}
      stepId="complete"
      title="You're All Set!"
      description="Welcome to Bayon Coagent"
      onNext={() => router.push("/dashboard")}
      nextLabel="Go to Dashboard"
      allowSkip={false} // No skip on final step
    >
      <CompletionCelebration />
    </OnboardingContainer>
  );
}
```

## Responsive Behavior

### Progress Indicators

- **Mobile** (< 768px): Small dots (2-2.5px)
- **Tablet** (768-1024px): Medium circles (7x7) with checkmarks
- **Desktop** (> 1024px): Large circles (8x8) with checkmarks

### Navigation Buttons

- **Mobile**: Stacked vertically, full width
- **Desktop**: Horizontal layout, auto width

## Accessibility

All components include:

- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Progress announcements
- Touch-optimized targets (44x44px minimum)

## Animations

Page transitions use Framer Motion:

- **Enter**: Fade in + slide from right (20px)
- **Exit**: Fade out + slide to left (20px)
- **Duration**: 300ms with easeInOut

## Styling

Components use Tailwind CSS and follow the design system:

- Responsive breakpoints: `sm:`, `md:`, `lg:`
- Design tokens: `primary`, `muted`, `border`
- Spacing: Consistent padding and margins
- Typography: `font-headline` for titles

## Testing

All components have comprehensive test coverage:

- Unit tests for rendering
- Interaction tests for buttons
- Progress calculation tests
- Accessibility tests

Run tests:

```bash
npm test -- src/components/onboarding/__tests__/onboarding-components.test.tsx
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

## File Locations

```
src/
├── app/(onboarding)/
│   ├── layout.tsx              # Onboarding route group layout
│   └── [step]/page.tsx         # Individual step pages
└── components/onboarding/
    ├── index.ts                # Component exports
    ├── onboarding-container.tsx
    ├── onboarding-progress.tsx
    └── onboarding-navigation.tsx
```

## Best Practices

1. **Always use OnboardingContainer** for consistency
2. **Set unique stepId** for each step
3. **Handle async operations** with loading states
4. **Provide meaningful labels** for buttons
5. **Test on mobile devices** for touch interactions
6. **Use router.push** for navigation
7. **Integrate with onboarding service** for state persistence
8. **Add error handling** for form submissions
9. **Show loading states** during async operations
10. **Follow accessibility guidelines** (WCAG AA)
