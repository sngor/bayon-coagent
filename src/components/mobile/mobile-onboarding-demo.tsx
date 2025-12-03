"use client";

/**
 * Mobile Onboarding Demo
 * 
 * Demonstrates the mobile onboarding and documentation features.
 * Shows how to integrate the tour, permission dialogs, help docs, and tooltips.
 */

import * as React from "react";
import { Camera, Mic, MapPin, Bell, HelpCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    MobileFeatureTour,
    PermissionEducationDialog,
    usePermissionEducation,
    MobileHelpDocumentation,
    useMobileOnboarding,
    QuickCaptureTooltip,
    QuickActionsTooltip,
    VoiceNotesTooltip,
    QuickShareTooltip,
} from "./index";

/**
 * Demo of the mobile feature tour
 */
function TourDemo() {
    const { hasCompletedTour, startTour, resetTour } = useMobileOnboarding();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mobile Feature Tour</CardTitle>
                <CardDescription>
                    Interactive walkthrough of mobile features for first-time users
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Badge variant={hasCompletedTour ? "default" : "secondary"}>
                        {hasCompletedTour ? "Completed" : "Not Started"}
                    </Badge>
                </div>

                <div className="flex gap-2">
                    <Button onClick={startTour} disabled={!hasCompletedTour}>
                        Start Tour
                    </Button>
                    <Button onClick={resetTour} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Tour
                    </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                    The tour automatically shows for first-time mobile users. You can manually
                    trigger it or reset the completion state for testing.
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * Demo of permission education dialogs
 */
function PermissionDemo() {
    const [activePermission, setActivePermission] = React.useState<
        "camera" | "microphone" | "location" | "notifications" | null
    >(null);

    const permissions = [
        { type: "camera" as const, icon: Camera, label: "Camera" },
        { type: "microphone" as const, icon: Mic, label: "Microphone" },
        { type: "location" as const, icon: MapPin, label: "Location" },
        { type: "notifications" as const, icon: Bell, label: "Notifications" },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Permission Education</CardTitle>
                <CardDescription>
                    Educate users before requesting permissions
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {permissions.map(({ type, icon: Icon, label }) => (
                        <Button
                            key={type}
                            variant="outline"
                            onClick={() => setActivePermission(type)}
                            className="h-auto py-4 flex-col gap-2"
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm">{label}</span>
                        </Button>
                    ))}
                </div>

                {activePermission && (
                    <PermissionEducationDialog
                        permissionType={activePermission}
                        open={true}
                        onOpenChange={(open) => !open && setActivePermission(null)}
                        onGrant={() => {
                            console.log(`${activePermission} permission granted`);
                            setActivePermission(null);
                        }}
                        onDeny={() => {
                            console.log(`${activePermission} permission denied`);
                            setActivePermission(null);
                        }}
                    />
                )}

                <p className="text-sm text-muted-foreground">
                    Click a permission type to see the education dialog. It explains why the
                    permission is needed and provides fallback options.
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * Demo of contextual tooltips
 */
function TooltipsDemo() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contextual Tooltips</CardTitle>
                <CardDescription>
                    First-time hints for mobile features
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <QuickCaptureTooltip>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Camera className="h-5 w-5" />
                            <span className="text-sm">Quick Capture</span>
                        </Button>
                    </QuickCaptureTooltip>

                    <QuickActionsTooltip>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Camera className="h-5 w-5" />
                            <span className="text-sm">Quick Actions</span>
                        </Button>
                    </QuickActionsTooltip>

                    <VoiceNotesTooltip>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Mic className="h-5 w-5" />
                            <span className="text-sm">Voice Notes</span>
                        </Button>
                    </VoiceNotesTooltip>

                    <QuickShareTooltip>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                            <Camera className="h-5 w-5" />
                            <span className="text-sm">Quick Share</span>
                        </Button>
                    </QuickShareTooltip>
                </div>

                <p className="text-sm text-muted-foreground">
                    Hover over buttons to see contextual tooltips. They only show once for
                    first-time users and can be dismissed.
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * Demo of help documentation
 */
function HelpDocsDemo() {
    const [showHelp, setShowHelp] = React.useState(false);

    if (showHelp) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Help Documentation</CardTitle>
                            <CardDescription>
                                Comprehensive guides for mobile features
                            </CardDescription>
                        </div>
                        <Button variant="ghost" onClick={() => setShowHelp(false)}>
                            Close
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <MobileHelpDocumentation />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Help Documentation</CardTitle>
                <CardDescription>
                    Searchable help articles for all mobile features
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={() => setShowHelp(true)} className="w-full">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Open Help Documentation
                </Button>

                <p className="text-sm text-muted-foreground">
                    Help documentation includes detailed guides for Quick Capture, Quick Actions,
                    Voice Notes, Quick Share, Location Services, Offline Mode, and Lead
                    Notifications.
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * Main demo component
 */
export function MobileOnboardingDemo() {
    return (
        <div className="container max-w-4xl py-8 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Mobile Onboarding & Documentation</h1>
                <p className="text-muted-foreground">
                    Interactive demos of mobile onboarding features including tours, permission
                    education, tooltips, and help documentation.
                </p>
            </div>

            <Separator />

            <div className="space-y-6">
                <TourDemo />
                <PermissionDemo />
                <TooltipsDemo />
                <HelpDocsDemo />
            </div>

            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">Integration Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        <strong>1. Add MobileOnboardingProvider</strong> to your root layout to
                        enable automatic tour for first-time mobile users.
                    </p>
                    <p>
                        <strong>2. Wrap feature buttons</strong> with contextual tooltips to
                        provide first-time hints.
                    </p>
                    <p>
                        <strong>3. Use PermissionEducationDialog</strong> before requesting
                        permissions to explain why they're needed.
                    </p>
                    <p>
                        <strong>4. Add help documentation</strong> to a help page or modal for
                        users who need detailed guidance.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
