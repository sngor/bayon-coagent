# Resume Banner Integration Guide

## Quick Start

To add the resume banner to your application, follow these simple steps:

### Step 1: Import the Wrapper Component

```tsx
import { ResumeBannerWrapper } from "@/components/onboarding/resume-banner-wrapper";
```

### Step 2: Add to Your Layout

Add the `ResumeBannerWrapper` component at the top of your main layout, before the main content:

```tsx
// src/app/(app)/layout.tsx

export default function AppLayout({ children }) {
  return (
    <div>
      {/* Add the resume banner wrapper here */}
      <ResumeBannerWrapper />

      {/* Your existing layout content */}
      <main>{children}</main>
    </div>
  );
}
```

That's it! The banner will automatically:

- ✅ Show when onboarding is incomplete
- ✅ Hide when onboarding is complete
- ✅ Be dismissible for the current session
- ✅ Reappear in new sessions if still incomplete

## Detailed Integration

### Option 1: Using the Wrapper (Recommended)

The `ResumeBannerWrapper` component handles all the logic for you:

```tsx
import { ResumeBannerWrapper } from "@/components/onboarding/resume-banner-wrapper";

export default function Layout({ children }) {
  return (
    <>
      <ResumeBannerWrapper />
      {children}
    </>
  );
}
```

**Pros:**

- Zero configuration required
- Handles all state management automatically
- Integrates with authentication system
- Follows best practices

**Cons:**

- Less customization options

### Option 2: Custom Integration

For more control, use the hooks directly:

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
    autoSync: true,
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
      className="custom-styling" // Add custom styles
    />
  );
}
```

**Pros:**

- Full control over behavior
- Can add custom logic
- Can customize styling

**Cons:**

- More code to maintain
- Need to handle edge cases

## Integration Points

### 1. Main Application Layout

**File:** `src/app/(app)/layout.tsx`

Add the banner at the top level, before the sidebar or main content:

```tsx
export default function AppLayout({ children }) {
  return (
    <TooltipProvider>
      <AdminProvider>
        <AccessibilityProvider>
          <StickyHeaderProvider>
            <SubtleGradientMesh>
              <SidebarProvider>
                {/* Add banner here - it will appear above everything */}
                <ResumeBannerWrapper />

                <Sidebar>{/* Sidebar content */}</Sidebar>

                <SidebarInset>
                  <header>{/* Header content */}</header>
                  <main>{children}</main>
                </SidebarInset>
              </SidebarProvider>
            </SubtleGradientMesh>
          </StickyHeaderProvider>
        </AccessibilityProvider>
      </AdminProvider>
    </TooltipProvider>
  );
}
```

### 2. Dashboard Page

**File:** `src/app/(app)/dashboard/page.tsx`

Alternatively, add it to specific pages:

```tsx
import { ResumeBannerWrapper } from "@/components/onboarding/resume-banner-wrapper";

export default function DashboardPage() {
  return (
    <div>
      <ResumeBannerWrapper />
      {/* Dashboard content */}
    </div>
  );
}
```

### 3. Conditional Display

Show the banner only on certain pages:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { ResumeBannerWrapper } from "@/components/onboarding/resume-banner-wrapper";

export function ConditionalResumeBanner() {
  const pathname = usePathname();

  // Only show on dashboard and main pages
  const shouldShow = ["/dashboard", "/studio", "/brand", "/research"].some(
    (path) => pathname.startsWith(path)
  );

  if (!shouldShow) return null;

  return <ResumeBannerWrapper />;
}
```

## Styling Customization

### Custom Colors

Override the banner colors using Tailwind classes:

```tsx
<ResumeBanner
  nextStepName={nextStepName}
  progress={progress}
  onResume={handleResume}
  onDismiss={handleDismiss}
  className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 border-blue-500/20"
/>
```

### Custom Layout

Wrap the banner in a custom container:

```tsx
<div className="sticky top-0 z-50 shadow-lg">
  <ResumeBanner
    nextStepName={nextStepName}
    progress={progress}
    onResume={handleResume}
    onDismiss={handleDismiss}
  />
</div>
```

## Advanced Usage

### Analytics Tracking

Track banner interactions:

```tsx
"use client";

import { ResumeBanner } from "@/components/onboarding/resume-banner";
import { useResumeBanner } from "@/hooks/use-resume-banner";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useUser } from "@/aws/auth/use-user";

export function AnalyticsResumeBanner() {
  const { user } = useUser();
  const { state, isLoading } = useOnboarding({ userId: user?.userId || "" });
  const banner = useResumeBanner({ state, isLoading });

  const handleResumeWithAnalytics = () => {
    // Track resume event
    console.log("User resumed onboarding", {
      userId: user?.userId,
      nextStep: banner.nextStepName,
      progress: banner.progress,
    });

    banner.handleResume();
  };

  const handleDismissWithAnalytics = () => {
    // Track dismiss event
    console.log("User dismissed banner", {
      userId: user?.userId,
      progress: banner.progress,
    });

    banner.handleDismiss();
  };

  if (!banner.shouldShowBanner) return null;

  return (
    <ResumeBanner
      nextStepName={banner.nextStepName}
      progress={banner.progress}
      onResume={handleResumeWithAnalytics}
      onDismiss={handleDismissWithAnalytics}
    />
  );
}
```

### Custom Messages

Show different messages based on progress:

```tsx
"use client";

import { ResumeBanner } from "@/components/onboarding/resume-banner";
import { useResumeBanner } from "@/hooks/use-resume-banner";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useUser } from "@/aws/auth/use-user";

export function CustomMessageBanner() {
  const { user } = useUser();
  const { state, isLoading } = useOnboarding({ userId: user?.userId || "" });
  const banner = useResumeBanner({ state, isLoading });

  if (!banner.shouldShowBanner) return null;

  // Customize message based on progress
  let customMessage = banner.nextStepName;
  if (banner.progress < 25) {
    customMessage = `Just getting started! Next: ${banner.nextStepName}`;
  } else if (banner.progress < 75) {
    customMessage = `You're halfway there! Next: ${banner.nextStepName}`;
  } else {
    customMessage = `Almost done! Next: ${banner.nextStepName}`;
  }

  return (
    <ResumeBanner
      nextStepName={customMessage}
      progress={banner.progress}
      onResume={banner.handleResume}
      onDismiss={banner.handleDismiss}
    />
  );
}
```

## Testing

### Manual Testing

1. **Test Banner Appears:**

   - Create a new user account
   - Start onboarding but don't complete it
   - Navigate to dashboard
   - Banner should appear

2. **Test Dismissal:**

   - Click the X button
   - Banner should disappear
   - Refresh page (same session)
   - Banner should NOT reappear

3. **Test Reappearance:**

   - Open a new tab/window
   - Navigate to dashboard
   - Banner should reappear

4. **Test Resume:**

   - Click "Continue Setup" button
   - Should navigate to next incomplete step

5. **Test Completion:**
   - Complete all onboarding steps
   - Navigate to dashboard
   - Banner should NOT appear

### Automated Testing

See `src/components/onboarding/__tests__/resume-banner.test.tsx` for unit tests.

## Troubleshooting

### Banner Not Showing

**Problem:** Banner doesn't appear even though onboarding is incomplete.

**Solutions:**

1. Check if user is authenticated
2. Verify onboarding state exists in DynamoDB
3. Check browser console for errors
4. Clear session storage: `sessionStorage.clear()`
5. Verify `completedSteps` array has at least one item

### Banner Shows When It Shouldn't

**Problem:** Banner appears even though onboarding is complete.

**Solutions:**

1. Check `isComplete` flag in onboarding state
2. Verify all required steps are in `completedSteps`
3. Check flow type matches user's role
4. Refresh onboarding state

### Banner Won't Dismiss

**Problem:** Clicking X doesn't dismiss the banner.

**Solutions:**

1. Check browser console for JavaScript errors
2. Verify `onDismiss` callback is provided
3. Check if session storage is accessible
4. Try clearing session storage manually

### Wrong Next Step

**Problem:** Banner shows incorrect next step.

**Solutions:**

1. Verify onboarding state is up to date
2. Check `completedSteps` and `skippedSteps` arrays
3. Ensure flow type is correct
4. Refresh the page to reload state

## Performance Considerations

### Lazy Loading

The banner is lightweight, but you can lazy load it:

```tsx
import dynamic from "next/dynamic";

const ResumeBannerWrapper = dynamic(
  () =>
    import("@/components/onboarding/resume-banner-wrapper").then((mod) => ({
      default: mod.ResumeBannerWrapper,
    })),
  { ssr: false }
);
```

### Memoization

The hooks already use memoization, but you can add more:

```tsx
import { memo } from "react";

const MemoizedResumeBanner = memo(ResumeBanner);
```

## Best Practices

1. **Add to Layout:** Place the banner in your main layout for consistent display
2. **Use Wrapper:** Use `ResumeBannerWrapper` for simplest integration
3. **Test Thoroughly:** Test all scenarios (show, dismiss, resume, complete)
4. **Monitor Analytics:** Track banner interactions to optimize UX
5. **Keep It Simple:** Don't over-customize unless necessary

## Related Documentation

- [Resume Banner Guide](./RESUME_BANNER_GUIDE.md)
- [Onboarding System Overview](./README.md)
- [useResumeBanner Hook](../../hooks/use-resume-banner.ts)
- [useOnboarding Hook](../../hooks/use-onboarding.ts)
