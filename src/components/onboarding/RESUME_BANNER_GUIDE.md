# Resume Banner Implementation Guide

## Overview

The Resume Banner is a dismissible notification that prompts users to continue their incomplete onboarding. It appears at the top of the application and provides a clear path to resume where they left off.

## Features

- ✅ **Progress Display**: Shows completion percentage and visual progress bar
- ✅ **Next Step Information**: Displays the name of the next incomplete step
- ✅ **Session-Based Dismissal**: Can be dismissed for the current session only
- ✅ **Automatic Reappearance**: Reappears in new sessions if onboarding is still incomplete
- ✅ **Mobile Responsive**: Optimized layout for mobile, tablet, and desktop
- ✅ **Smooth Animations**: Framer Motion animations for enter/exit
- ✅ **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Requirements Satisfied

- **5.1**: Incomplete onboarding detection
- **5.2**: Resume banner for incomplete flows
- **5.3**: Resume navigation correctness
- **5.4**: Dismissible banner for current session
- **5.5**: Banner reappears in new sessions

## Components

### 1. ResumeBanner Component

The main banner component that displays the resume prompt.

**Props:**

```typescript
interface ResumeBannerProps {
  nextStepName: string; // Name of the next step
  progress: number; // Progress percentage (0-100)
  onResume: () => void; // Callback when resume is clicked
  onDismiss: () => void; // Callback when banner is dismissed
  className?: string; // Optional custom className
}
```

**Usage:**

```tsx
import { ResumeBanner } from "@/components/onboarding/resume-banner";

<ResumeBanner
  nextStepName="Profile Setup"
  progress={25}
  onResume={() => router.push("/onboarding/user/profile")}
  onDismiss={() => console.log("Banner dismissed")}
/>;
```

### 2. useResumeBanner Hook

Custom hook that manages banner state and logic.

**Options:**

```typescript
interface UseResumeBannerOptions {
  state: OnboardingState | null; // Current onboarding state
  isLoading?: boolean; // Whether state is loading
}
```

**Returns:**

```typescript
interface UseResumeBannerReturn {
  shouldShowBanner: boolean; // Whether to show the banner
  nextStepName: string; // Name of the next step
  progress: number; // Progress percentage
  nextStepPath: string; // Path to the next step
  handleResume: () => void; // Resume handler
  handleDismiss: () => void; // Dismiss handler
}
```

**Usage:**

```tsx
import { useResumeBanner } from "@/hooks/use-resume-banner";
import { useOnboarding } from "@/hooks/use-onboarding";

const { state, isLoading } = useOnboarding({ userId: "user-123" });
const banner = useResumeBanner({ state, isLoading });

if (banner.shouldShowBanner) {
  return (
    <ResumeBanner
      nextStepName={banner.nextStepName}
      progress={banner.progress}
      onResume={banner.handleResume}
      onDismiss={banner.handleDismiss}
    />
  );
}
```

## Integration Guide

### Step 1: Add to Layout

Add the banner to your main application layout or dashboard layout:

```tsx
// src/app/(app)/layout.tsx
import { ResumeBannerExample } from "@/components/onboarding/examples/resume-banner-example";

export default function AppLayout({ children }) {
  return (
    <div>
      <ResumeBannerExample />
      <main>{children}</main>
    </div>
  );
}
```

### Step 2: Customize (Optional)

For custom behavior, use the hooks directly:

```tsx
"use client";

import { ResumeBanner } from "@/components/onboarding/resume-banner";
import { useResumeBanner } from "@/hooks/use-resume-banner";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useUser } from "@/aws/auth/use-user";

export function CustomResumeBanner() {
  const { user } = useUser();
  const { state, isLoading } = useOnboarding({
    userId: user?.userId || "",
  });

  const {
    shouldShowBanner,
    nextStepName,
    progress,
    handleResume,
    handleDismiss,
  } = useResumeBanner({ state, isLoading });

  if (!shouldShowBanner) return null;

  return (
    <ResumeBanner
      nextStepName={nextStepName}
      progress={progress}
      onResume={handleResume}
      onDismiss={handleDismiss}
      className="custom-styling"
    />
  );
}
```

## Behavior Details

### When Banner Shows

The banner shows when ALL of the following conditions are met:

1. ✅ Onboarding state is loaded (not loading)
2. ✅ Onboarding state exists (user has started onboarding)
3. ✅ Onboarding is not complete (`isComplete === false`)
4. ✅ User has completed at least one step (not first-time)
5. ✅ Banner has not been dismissed in current session

### When Banner Hides

The banner hides when ANY of the following conditions are met:

1. ❌ Onboarding is complete
2. ❌ User has not started onboarding yet
3. ❌ Banner was dismissed in current session
4. ❌ State is still loading

### Session Storage

The banner uses `sessionStorage` (not `localStorage`) to track dismissal:

- **Key**: `onboarding-banner-dismissed`
- **Value**: `'true'` when dismissed
- **Lifetime**: Current browser session only
- **Behavior**: Cleared when browser/tab is closed

This ensures the banner reappears in new sessions (Requirement 5.5).

## Mobile Optimization

The banner adapts to different screen sizes:

### Mobile (< 768px)

- Compact text: "Continue Setup" instead of "Continue Your Onboarding"
- Simplified next step display: "Next: Profile Setup"
- Smaller button: "Resume" instead of "Continue Setup"
- Icon hidden to save space
- Touch-optimized dismiss button (44x44px minimum)

### Tablet (768px - 1024px)

- Full text displayed
- Progress percentage shown
- Standard button sizes

### Desktop (> 1024px)

- Full layout with icon
- Complete text and descriptions
- Spacious layout

## Accessibility

### ARIA Labels

- Banner has `role="banner"` and `aria-label="Resume onboarding banner"`
- Progress bar has `aria-label` with percentage
- Buttons have descriptive `aria-label` attributes

### Keyboard Navigation

- Dismiss button is keyboard accessible
- Resume button is keyboard accessible
- Focus management follows logical order

### Screen Readers

- All interactive elements are announced
- Progress updates are communicated
- Button purposes are clear

## Animations

The banner uses Framer Motion for smooth animations:

### Enter Animation

- Opacity: 0 → 1
- Y position: -20px → 0
- Spring animation with stiffness: 300, damping: 30

### Exit Animation

- Opacity: 1 → 0
- Y position: 0 → -20px
- Same spring animation

## Styling

The banner uses Tailwind CSS with the following design:

- **Background**: Gradient from primary/10 via primary/5 to primary/10
- **Border**: Bottom border with primary/20
- **Backdrop**: Blur effect for modern look
- **Progress Bar**: Primary color with smooth transitions
- **Buttons**: Primary button for resume, ghost button for dismiss

## Testing

### Manual Testing Checklist

- [ ] Banner shows when onboarding is incomplete
- [ ] Banner hides when onboarding is complete
- [ ] Banner can be dismissed
- [ ] Banner stays hidden after dismissal in same session
- [ ] Banner reappears in new session (new tab/window)
- [ ] Progress percentage is accurate
- [ ] Next step name is correct
- [ ] Resume button navigates to correct step
- [ ] Mobile layout is responsive
- [ ] Animations are smooth
- [ ] Accessibility features work

### Unit Testing

See `src/components/onboarding/__tests__/resume-banner.test.tsx` for unit tests.

## Troubleshooting

### Banner Not Showing

1. Check onboarding state is loaded
2. Verify `isComplete` is `false`
3. Check `completedSteps` has at least one item
4. Clear session storage: `sessionStorage.removeItem('onboarding-banner-dismissed')`

### Banner Not Dismissing

1. Check `onDismiss` callback is provided
2. Verify session storage is accessible
3. Check browser console for errors

### Wrong Next Step

1. Verify onboarding state is up to date
2. Check `completedSteps` and `skippedSteps` arrays
3. Ensure flow type is correct

### Progress Not Updating

1. Refresh onboarding state
2. Check `completedSteps` array is updating
3. Verify `calculateProgress` function is working

## Future Enhancements

Potential improvements for future iterations:

1. **Custom Messages**: Allow custom messages based on user progress
2. **Multiple Dismissal Options**: "Remind me later" vs "Don't show again"
3. **Animation Variants**: Different animation styles
4. **Theming**: Support for different color schemes
5. **Analytics**: Track banner interactions
6. **A/B Testing**: Test different banner designs

## Related Documentation

- [Onboarding System Overview](./README.md)
- [Onboarding Service](../../services/onboarding/README.md)
- [Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
- [Mobile Optimization](./MOBILE_QUICK_REFERENCE.md)
