# Mobile Onboarding - Quick Start Guide

Get mobile onboarding up and running in 5 minutes.

## 1. Add Providers (2 minutes)

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

## 2. Add Tooltips to Features (2 minutes)

```tsx
// Your mobile navigation component
import {
  QuickCaptureTooltip,
  QuickActionsTooltip,
  VoiceNotesTooltip,
  QuickShareTooltip,
} from "@/components/mobile";

export function MobileNav() {
  return (
    <nav>
      <QuickCaptureTooltip>
        <button>Quick Capture</button>
      </QuickCaptureTooltip>

      <QuickActionsTooltip>
        <button>Quick Actions</button>
      </QuickActionsTooltip>

      <VoiceNotesTooltip>
        <button>Voice Notes</button>
      </VoiceNotesTooltip>

      <QuickShareTooltip>
        <button>Quick Share</button>
      </QuickShareTooltip>
    </nav>
  );
}
```

## 3. Add Permission Education (1 minute)

```tsx
// Before requesting camera permission
import {
  PermissionEducationDialog,
  usePermissionEducation,
} from "@/components/mobile";

function CameraButton() {
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

## 4. Test on Mobile

1. Open your app on a mobile device
2. Clear browser data (to simulate first-time user)
3. Visit the app
4. Tour should automatically appear
5. Complete or skip the tour
6. Verify tooltips appear on features
7. Test permission education dialogs

## That's It!

Your mobile onboarding is now live. Users will see:

- ✅ Automatic tour on first mobile visit
- ✅ Contextual tooltips on features
- ✅ Permission education before requests
- ✅ Persistent state across sessions

## Optional: Add Help Page

```tsx
// app/help/mobile/page.tsx
import { MobileHelpDocumentation } from "@/components/mobile";

export default function HelpPage() {
  return (
    <div className="container py-8">
      <MobileHelpDocumentation />
    </div>
  );
}
```

## Need More?

- See [MOBILE_ONBOARDING_README.md](./MOBILE_ONBOARDING_README.md) for full documentation
- See [INTEGRATION_EXAMPLE.md](./INTEGRATION_EXAMPLE.md) for detailed examples
- See [mobile-onboarding-demo.tsx](./mobile-onboarding-demo.tsx) for interactive demos
