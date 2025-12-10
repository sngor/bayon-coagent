# Onboarding Accessibility Guide

This document outlines the accessibility features implemented in the onboarding system to ensure WCAG AA compliance and provide an inclusive experience for all users.

## Requirements

This implementation addresses the following requirements:

- **Requirement 7.1**: Responsive layouts and accessibility features
- **Requirement 7.3**: Interactive elements with visual feedback and accessibility

## Accessibility Features

### 1. Keyboard Navigation

#### Supported Keys

- **Tab**: Navigate between interactive elements
- **Shift + Tab**: Navigate backwards
- **Enter**: Activate buttons and proceed to next step (when not focused on a button)
- **Escape**: Skip onboarding or close dialogs
- **Arrow Keys**: Navigate through step indicators (future enhancement)

#### Implementation

```typescript
// Keyboard handler in onboarding-navigation.tsx
useEffect(() => {
  const handleKeyboard = createKeyboardHandler([
    {
      key: "Enter",
      handler: (e) => {
        // Only trigger if not focused on a button or input
        const target = e.target as HTMLElement;
        if (target.tagName !== "BUTTON" && target.tagName !== "INPUT") {
          if (onNext && !isNextLoading) {
            handleNext();
          }
        }
      },
    },
  ]);

  document.addEventListener("keydown", handleKeyboard);
  return () => document.removeEventListener("keydown", handleKeyboard);
}, [onNext, isNextLoading]);
```

### 2. ARIA Labels and Roles

#### Semantic HTML

All components use appropriate semantic HTML elements:

- `<header>` for the onboarding header
- `<main>` for the main content area
- `<nav>` for navigation controls
- `<button>` for all interactive actions

#### ARIA Attributes

**Progress Indicator:**

```tsx
<Progress
  value={progress}
  aria-label={`Onboarding progress: Step ${currentStep} of ${totalSteps}, ${Math.round(
    progress
  )}% complete`}
  aria-valuenow={currentStep}
  aria-valuemin={1}
  aria-valuemax={totalSteps}
  role="progressbar"
/>
```

**Navigation Buttons:**

```tsx
<Button aria-label="Go back to previous step" title="Go back to previous step">
  <ArrowLeft aria-hidden="true" />
  Back
</Button>
```

**Step Indicators:**

```tsx
<div
  role="listitem"
  aria-label={`Step ${step}${
    step === currentStep
      ? " (current)"
      : step < currentStep
      ? " (completed)"
      : " (upcoming)"
  }`}
  aria-current={step === currentStep ? "step" : undefined}
>
  {step}
</div>
```

### 3. Focus Management

#### Step Transitions

When transitioning between steps, focus is automatically managed:

```typescript
// In onboarding-container.tsx
useEffect(() => {
  manageFocusForStepTransition(stepId);
}, [stepId]);
```

The `manageFocusForStepTransition` function:

1. Waits for the transition animation to complete (350ms)
2. Focuses the main heading (`<h1>`)
3. Makes the heading temporarily focusable with `tabindex="-1"`
4. Removes the tabindex after blur

#### Focus Traps

Modal dialogs (like the skip confirmation) implement focus trapping:

- Focus is trapped within the dialog
- Tab cycles through focusable elements
- Shift+Tab cycles backwards
- Escape closes the dialog
- Focus is restored to the triggering element when closed

### 4. Screen Reader Announcements

#### ARIA Live Regions

Two live regions are included in the layout:

- **Polite**: For non-urgent updates (progress, navigation)
- **Assertive**: For urgent updates (errors)

```tsx
<div
    id="aria-live-polite"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="sr-only"
/>
<div
    id="aria-live-assertive"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    className="sr-only"
/>
```

#### Progress Announcements

Progress updates are announced automatically:

```typescript
// In onboarding-container.tsx
useEffect(() => {
  announceProgress(currentStep, totalSteps, title);
}, [currentStep, totalSteps, title]);
```

Example announcement: "Step 2 of 5: Profile Setup. 40% complete."

#### Navigation Announcements

Navigation actions are announced:

```typescript
announceNavigation("forward", nextLabel);
announceNavigation("back", "previous step");
announceNavigation("skip", skipLabel);
```

### 5. Skip Links

A skip link is provided for keyboard users to bypass navigation:

```tsx
<SkipLink
  targetId="onboarding-main-content"
  text="Skip to onboarding content"
/>
```

Features:

- Visually hidden by default
- Becomes visible when focused
- Positioned at the top-left of the screen
- Minimum 44x44px touch target
- Smooth scroll to main content
- Temporarily makes target focusable

### 6. Color Contrast

All text and interactive elements meet WCAG AA standards:

#### Text Contrast Ratios

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+): Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

#### Implementation

Using Tailwind CSS design tokens ensures consistent contrast:

- `text-foreground` on `bg-background`: High contrast
- `text-muted-foreground`: Reduced but still accessible contrast
- `text-primary-foreground` on `bg-primary`: High contrast
- Button states have sufficient contrast in all variants

#### Progress Indicators

- Completed steps: Primary color (high contrast)
- Current step: Primary color with ring (enhanced visibility)
- Upcoming steps: Muted color (sufficient contrast)

### 7. Touch Targets

All interactive elements meet minimum touch target sizes:

- **Mobile**: Minimum 44x44px (iOS/Android guidelines)
- **Desktop**: Minimum 40x40px

```tsx
<Button
  className={cn(
    "w-full sm:w-auto",
    isMobile && "min-h-[44px] touch-manipulation"
  )}
>
  Continue
</Button>
```

## Testing Checklist

### Keyboard Navigation

- [ ] Tab through all interactive elements in logical order
- [ ] Shift+Tab navigates backwards correctly
- [ ] Enter key activates buttons and proceeds
- [ ] Escape key skips onboarding or closes dialogs
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps (except intentional focus traps in modals)

### Screen Reader

- [ ] Progress updates are announced
- [ ] Navigation actions are announced
- [ ] All interactive elements have descriptive labels
- [ ] Images and icons have appropriate alt text or aria-hidden
- [ ] Form fields have associated labels
- [ ] Error messages are announced

### Focus Management

- [ ] Focus moves to main content on step transitions
- [ ] Focus is trapped in modal dialogs
- [ ] Focus is restored when dialogs close
- [ ] Skip link works correctly

### Color Contrast

- [ ] All text meets 4.5:1 contrast ratio
- [ ] Large text meets 3:1 contrast ratio
- [ ] Interactive elements meet 3:1 contrast ratio
- [ ] Focus indicators are visible

### Touch Targets

- [ ] All buttons are at least 44x44px on mobile
- [ ] Adequate spacing between touch targets
- [ ] Touch targets don't overlap

## Utilities Reference

### Announcer

```typescript
import {
  announce,
  announceProgress,
  announceNavigation,
  announceError,
  announceSuccess,
} from "@/lib/accessibility/announcer";

// General announcement
announce("Message", "polite");

// Progress announcement
announceProgress(2, 5, "Profile Setup");

// Navigation announcement
announceNavigation("forward", "Next Step");

// Error announcement
announceError("Failed to save progress");

// Success announcement
announceSuccess("Profile saved successfully");
```

### Keyboard Navigation

```typescript
import {
  createKeyboardHandler,
  focusFirstElement,
  trapFocus,
} from "@/lib/accessibility/keyboard-navigation";

// Create keyboard handler
const handleKeyboard = createKeyboardHandler([
  {
    key: "Enter",
    handler: () => handleSubmit(),
    preventDefault: true,
  },
  {
    key: "Escape",
    handler: () => handleCancel(),
  },
]);

// Focus first element
focusFirstElement(containerRef.current);

// Trap focus in modal
const cleanup = trapFocus(modalRef.current);
// Later: cleanup();
```

### Focus Management

```typescript
import {
  saveFocus,
  restoreFocus,
  manageFocusForStepTransition,
  focusElement,
} from "@/lib/accessibility/focus-management";

// Save and restore focus
saveFocus();
// ... do something
restoreFocus();

// Manage focus for step transition
manageFocusForStepTransition("step-2");

// Focus specific element
focusElement(buttonRef.current, 100); // with 100ms delay
```

### Skip Link

```tsx
import { SkipLink } from "@/lib/accessibility/skip-link";

<SkipLink targetId="main-content" text="Skip to main content" />;
```

## Browser Support

Accessibility features are tested and supported in:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Screen Reader Support

Tested with:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
