# Mobile Onboarding Integration Example

This guide shows how to integrate mobile onboarding and documentation features into your application.

## Step 1: Add Providers to Root Layout

Update your root layout to include the necessary providers:

```tsx
// app/layout.tsx
import { TooltipProvider } from "@/contexts/tooltip-context";
import { MobileOnboardingProvider } from "@/components/mobile";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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

## Step 2: Add Tooltips to Mobile Features

Wrap your mobile feature buttons with contextual tooltips:

```tsx
// app/(app)/mobile-nav.tsx
"use client";

import { Camera, Zap, Mic, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  QuickCaptureTooltip,
  QuickActionsTooltip,
  VoiceNotesTooltip,
  QuickShareTooltip,
} from "@/components/mobile";

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
      <div className="flex items-center justify-around p-2">
        <QuickCaptureTooltip>
          <Button variant="ghost" size="icon">
            <Camera className="h-5 w-5" />
          </Button>
        </QuickCaptureTooltip>

        <QuickActionsTooltip>
          <Button variant="ghost" size="icon">
            <Zap className="h-5 w-5" />
          </Button>
        </QuickActionsTooltip>

        <VoiceNotesTooltip>
          <Button variant="ghost" size="icon">
            <Mic className="h-5 w-5" />
          </Button>
        </VoiceNotesTooltip>

        <QuickShareTooltip>
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </QuickShareTooltip>
      </div>
    </nav>
  );
}
```

## Step 3: Add Permission Education

Use permission education dialogs before requesting permissions:

```tsx
// components/camera-feature.tsx
"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PermissionEducationDialog,
  usePermissionEducation,
} from "@/components/mobile";

export function CameraFeature() {
  const { isOpen, setIsOpen, requestPermission, handleGrant, wasDenied } =
    usePermissionEducation("camera");

  return (
    <>
      <Button onClick={requestPermission}>
        <Camera className="h-4 w-4 mr-2" />
        Enable Camera
      </Button>

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

## Step 4: Add Help Documentation Page

Create a help page for mobile features:

```tsx
// app/(app)/help/mobile/page.tsx
import { MobileHelpDocumentation } from "@/components/mobile";

export default function MobileHelpPage() {
  return (
    <div className="container max-w-4xl py-8">
      <MobileHelpDocumentation />
    </div>
  );
}
```

## Step 5: Add Manual Tour Trigger (Optional)

Allow users to manually start the tour from settings:

```tsx
// app/(app)/settings/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useMobileOnboarding } from "@/components/mobile";

export default function SettingsPage() {
  const { hasCompletedTour, startTour, resetTour } = useMobileOnboarding();

  return (
    <div className="space-y-4">
      <h2>Mobile Features</h2>

      <div className="flex gap-2">
        <Button onClick={startTour}>
          {hasCompletedTour ? "Replay Tour" : "Start Tour"}
        </Button>

        {hasCompletedTour && (
          <Button onClick={resetTour} variant="outline">
            Reset Tour
          </Button>
        )}
      </div>
    </div>
  );
}
```

## Step 6: Add Help Button to Navigation

Add a help button that opens the help documentation:

```tsx
// components/mobile-header.tsx
"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function MobileHeader() {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-4 md:hidden">
      <h1>Bayon Coagent</h1>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/help/mobile")}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </header>
  );
}
```

## Complete Example

Here's a complete example of a mobile-optimized page with all features:

```tsx
// app/(app)/mobile-dashboard/page.tsx
"use client";

import { Camera, Zap, Mic, Share2, MapPin, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  QuickCaptureTooltip,
  QuickActionsTooltip,
  VoiceNotesTooltip,
  QuickShareTooltip,
  LocationServicesTooltip,
  LeadNotificationsTooltip,
  useMobileOnboarding,
} from "@/components/mobile";

export default function MobileDashboard() {
  const { hasCompletedTour, startTour } = useMobileOnboarding();

  return (
    <div className="container py-8 space-y-6">
      {!hasCompletedTour && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">New to Mobile Features?</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={startTour} size="sm">
              Take a Quick Tour
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <QuickCaptureTooltip>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center space-y-2">
              <Camera className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium">Quick Capture</p>
            </CardContent>
          </Card>
        </QuickCaptureTooltip>

        <QuickActionsTooltip>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center space-y-2">
              <Zap className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium">Quick Actions</p>
            </CardContent>
          </Card>
        </QuickActionsTooltip>

        <VoiceNotesTooltip>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center space-y-2">
              <Mic className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium">Voice Notes</p>
            </CardContent>
          </Card>
        </VoiceNotesTooltip>

        <QuickShareTooltip>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center space-y-2">
              <Share2 className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium">Quick Share</p>
            </CardContent>
          </Card>
        </QuickShareTooltip>

        <LocationServicesTooltip>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center space-y-2">
              <MapPin className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium">Location</p>
            </CardContent>
          </Card>
        </LocationServicesTooltip>

        <LeadNotificationsTooltip>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 text-center space-y-2">
              <Bell className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium">Notifications</p>
            </CardContent>
          </Card>
        </LeadNotificationsTooltip>
      </div>
    </div>
  );
}
```

## Testing

Test the integration on mobile devices:

1. **First-time user flow:**

   - Clear browser data
   - Visit the app on mobile
   - Tour should automatically appear
   - Complete or skip the tour

2. **Permission flow:**

   - Tap a feature requiring permissions
   - Education dialog should appear
   - Grant or deny permission
   - Verify fallback behavior

3. **Tooltips:**

   - Hover/tap features with tooltips
   - Verify they appear once
   - Dismiss tooltips
   - Verify they don't reappear

4. **Help documentation:**
   - Navigate to help page
   - Search for articles
   - Read article content
   - Navigate between articles

## Troubleshooting

### Tour not showing

- Verify `MobileOnboardingProvider` is in layout
- Check if user is on mobile (`useIsMobile()`)
- Ensure tour wasn't already completed
- Check browser console for errors

### Tooltips not appearing

- Verify `TooltipProvider` is in layout
- Check if tooltip was already dismissed
- Ensure tooltip ID is unique
- Verify component is wrapped correctly

### Permissions not working

- Ensure HTTPS connection
- Check browser compatibility
- Verify permission education dialog appears first
- Check browser console for permission errors

## Next Steps

1. Customize tour steps for your specific features
2. Add custom help articles for new features
3. Monitor tour completion rates
4. Gather user feedback on onboarding
5. Iterate and improve based on usage data
