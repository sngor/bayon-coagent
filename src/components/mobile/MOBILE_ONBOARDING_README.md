# Mobile Onboarding and Documentation

This directory contains components for onboarding and documenting mobile features for first-time users.

## Components

### MobileFeatureTour

An interactive tour that introduces users to mobile-specific features.

**Features:**

- Step-by-step walkthrough of key mobile features
- Progress indicators and navigation
- Customizable tour steps
- Skip and complete callbacks
- Only shows on mobile devices

**Usage:**

```tsx
import { MobileFeatureTour } from "@/components/mobile";

function App() {
  return (
    <MobileFeatureTour
      show={true}
      onComplete={() => console.log("Tour completed")}
      onSkip={() => console.log("Tour skipped")}
    />
  );
}
```

**Default Tour Steps:**

1. Welcome to Mobile Features
2. Quick Capture
3. Quick Actions
4. Voice Notes
5. Quick Share
6. Location Services
7. Offline Mode

### PermissionEducationDialog

Educates users about why permissions are needed before requesting them.

**Features:**

- Clear explanations for each permission type
- Benefits list for each permission
- Fallback options if permission is denied
- Handles permission request flow
- Shows warning if previously denied

**Supported Permissions:**

- Camera
- Microphone
- Location
- Notifications

**Usage:**

```tsx
import {
  PermissionEducationDialog,
  usePermissionEducation,
} from "@/components/mobile";

function CameraFeature() {
  const { isOpen, setIsOpen, requestPermission, handleGrant } =
    usePermissionEducation("camera");

  return (
    <>
      <button onClick={requestPermission}>Enable Camera</button>
      <PermissionEducationDialog
        permissionType="camera"
        open={isOpen}
        onOpenChange={setIsOpen}
        onGrant={handleGrant}
      />
    </>
  );
}
```

### MobileHelpDocumentation

Comprehensive help documentation for mobile features.

**Features:**

- Searchable help articles
- Organized by category
- Detailed content for each feature
- Related articles linking
- Tag-based filtering

**Help Articles:**

- Quick Capture
- Quick Actions
- Voice Notes
- Quick Share
- Location Services
- Offline Mode
- Lead Notifications

**Usage:**

```tsx
import { MobileHelpDocumentation } from "@/components/mobile";

function HelpPage() {
  return (
    <MobileHelpDocumentation
      initialArticleId="quick-capture"
      onArticleSelect={(id) => console.log("Selected:", id)}
    />
  );
}
```

### MobileOnboardingProvider

Context provider that manages mobile onboarding state.

**Features:**

- Tracks tour completion status
- Persists state to DynamoDB
- Auto-shows tour for first-time mobile users
- Provides hooks for tour control
- Handles tour skip and reset

**Usage:**

```tsx
import {
  MobileOnboardingProvider,
  useMobileOnboarding,
} from "@/components/mobile";

// Wrap your app
function App() {
  return (
    <MobileOnboardingProvider autoShow={true}>
      <YourApp />
    </MobileOnboardingProvider>
  );
}

// Use in components
function SomeComponent() {
  const { hasCompletedTour, startTour, resetTour } = useMobileOnboarding();

  return (
    <div>
      {!hasCompletedTour && <button onClick={startTour}>Start Tour</button>}
      <button onClick={resetTour}>Reset Tour</button>
    </div>
  );
}
```

### Mobile Feature Tooltips

Contextual tooltips for mobile-specific features.

**Available Tooltips:**

- `QuickCaptureTooltip` - For Quick Capture button
- `QuickActionsTooltip` - For Quick Actions menu
- `VoiceNotesTooltip` - For Voice Notes feature
- `QuickShareTooltip` - For Quick Share feature
- `LocationServicesTooltip` - For Location Services
- `OfflineModeTooltip` - For Offline Mode indicator
- `CameraCaptureTooltip` - For Camera Capture
- `VoiceCaptureTooltip` - For Voice Capture
- `QRCodeTooltip` - For QR Code generation
- `LeadNotificationsTooltip` - For Lead Notifications
- `NavigationTooltip` - For Navigation Integration
- `CheckInTooltip` - For Check-In feature
- `SyncStatusTooltip` - For Sync Status
- `ProgressiveImageTooltip` - For Progressive Image Loading
- `MobileContentCreationTooltip` - For Content Creation

**Usage:**

```tsx
import { QuickCaptureTooltip } from "@/components/mobile";

function QuickCaptureButton() {
  return (
    <QuickCaptureTooltip>
      <button>Quick Capture</button>
    </QuickCaptureTooltip>
  );
}
```

**Features:**

- Shows once for first-time users
- Dismissible with "Got it" button
- Persists seen state to user preferences
- Integrates with TooltipProvider context

## Integration

### 1. Add to Root Layout

Wrap your app with the necessary providers:

```tsx
// app/layout.tsx
import { TooltipProvider } from "@/contexts/tooltip-context";
import { MobileOnboardingProvider } from "@/components/mobile";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TooltipProvider>
          <MobileOnboardingProvider autoShow={true}>
            {children}
          </MobileOnboardingProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
```

### 2. Add Tooltips to Features

Wrap mobile feature buttons with appropriate tooltips:

```tsx
import { QuickCaptureTooltip, QuickActionsTooltip } from "@/components/mobile";

function MobileNav() {
  return (
    <nav>
      <QuickCaptureTooltip>
        <button>Quick Capture</button>
      </QuickCaptureTooltip>

      <QuickActionsTooltip>
        <button>Quick Actions</button>
      </QuickActionsTooltip>
    </nav>
  );
}
```

### 3. Add Help Documentation

Create a help page or modal:

```tsx
import { MobileHelpDocumentation } from "@/components/mobile";

function HelpPage() {
  return (
    <div className="container py-8">
      <MobileHelpDocumentation />
    </div>
  );
}
```

### 4. Request Permissions with Education

Use the permission education dialog before requesting permissions:

```tsx
import {
  PermissionEducationDialog,
  usePermissionEducation,
} from "@/components/mobile";

function CameraFeature() {
  const { isOpen, setIsOpen, requestPermission, handleGrant, wasDenied } =
    usePermissionEducation("camera");

  return (
    <>
      <button onClick={requestPermission}>Enable Camera</button>

      <PermissionEducationDialog
        permissionType="camera"
        open={isOpen}
        onOpenChange={setIsOpen}
        onGrant={handleGrant}
        wasDenied={wasDenied}
      />
    </>
  );
}
```

## Data Storage

### DynamoDB Schema

**Onboarding State:**

```
PK: USER#<userId>
SK: ONBOARDING#MOBILE
{
  hasCompletedTour: boolean,
  tourCompletedAt: string (ISO date),
  tourSkipped: boolean
}
```

**Tooltip Preferences:**

```
PK: USER#<userId>
SK: PREFERENCES#TOOLTIPS
{
  seenTooltips: string[] (tooltip IDs)
}
```

## Customization

### Custom Tour Steps

Create custom tour steps for your specific features:

```tsx
import { MobileFeatureTour, TourStep } from "@/components/mobile";
import { MyFeatureIcon } from "lucide-react";

const customSteps: TourStep[] = [
  {
    id: "my-feature",
    title: "My Custom Feature",
    description: "This is how to use my custom feature",
    icon: MyFeatureIcon,
    action: {
      label: "Try it now",
      onClick: () => console.log("Action clicked"),
    },
  },
];

function App() {
  return <MobileFeatureTour steps={customSteps} />;
}
```

### Custom Help Articles

Add custom help articles to the documentation:

```tsx
import { MobileHelpDocumentation, HelpArticle } from "@/components/mobile";
import { MyIcon } from "lucide-react";

const customArticles: HelpArticle[] = [
  {
    id: "my-feature",
    title: "My Feature",
    category: "Custom Features",
    icon: MyIcon,
    description: "Learn about my custom feature",
    tags: ["custom", "feature"],
    content: `
# My Feature

This is the detailed content for my feature...
    `,
  },
];

// Note: You'll need to modify the component to accept custom articles
```

## Best Practices

1. **Show Tour on First Mobile Visit**: Use `autoShow={true}` in `MobileOnboardingProvider`
2. **Request Permissions with Context**: Always use `PermissionEducationDialog` before requesting permissions
3. **Add Tooltips to New Features**: Wrap new mobile features with appropriate tooltips
4. **Keep Help Content Updated**: Update help articles when features change
5. **Test on Real Devices**: Test onboarding flow on actual mobile devices
6. **Provide Skip Options**: Always allow users to skip tours and dismiss tooltips
7. **Track Completion**: Monitor tour completion rates to improve onboarding

## Accessibility

All components follow accessibility best practices:

- Keyboard navigation support
- ARIA labels and descriptions
- Focus management
- Screen reader compatibility
- Touch target sizes (min 44px)
- Color contrast compliance

## Testing

Test the onboarding flow:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileFeatureTour } from "@/components/mobile";

test("tour completes successfully", () => {
  const onComplete = jest.fn();

  render(<MobileFeatureTour show={true} onComplete={onComplete} />);

  // Navigate through steps
  fireEvent.click(screen.getByText("Next"));
  fireEvent.click(screen.getByText("Next"));
  // ... continue for all steps

  fireEvent.click(screen.getByText("Get Started"));

  expect(onComplete).toHaveBeenCalled();
});
```

## Troubleshooting

### Tour Not Showing

- Check if user is on mobile device (`useIsMobile()`)
- Verify `autoShow={true}` in provider
- Check if tour was already completed
- Ensure user is authenticated

### Tooltips Not Appearing

- Verify `TooltipProvider` is in layout
- Check if tooltip was already dismissed
- Ensure tooltip ID is unique
- Check browser console for errors

### Permissions Not Working

- Verify HTTPS connection (required for permissions)
- Check browser compatibility
- Ensure permission education dialog is shown first
- Check browser console for permission errors

## Related Documentation

- [Mobile Components](./MOBILE_UI_COMPONENTS_README.md)
- [Quick Capture](./QUICK_CAPTURE_INTERFACE_README.md)
- [Quick Actions](./QUICK_ACTIONS_README.md)
- [Voice Notes](./VOICE_NOTES_README.md)
