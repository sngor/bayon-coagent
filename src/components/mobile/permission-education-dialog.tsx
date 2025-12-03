"use client";

/**
 * Permission Education Dialog
 * 
 * Educates users about why permissions are needed before requesting them.
 * Provides clear explanations and fallback options if permissions are denied.
 */

import * as React from "react";
import { Camera, Mic, MapPin, Bell, AlertCircle, CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type PermissionType = "camera" | "microphone" | "location" | "notifications";

export interface PermissionInfo {
    type: PermissionType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    benefits: string[];
    fallback?: string;
}

const PERMISSION_INFO: Record<PermissionType, PermissionInfo> = {
    camera: {
        type: "camera",
        title: "Camera Access",
        description: "Allow Bayon to use your camera to capture property photos",
        icon: Camera,
        benefits: [
            "Instantly capture property photos at showings",
            "AI analyzes photos to extract property details",
            "Attach photos to listings and notes automatically",
        ],
        fallback: "You can still upload photos from your device's photo library",
    },
    microphone: {
        type: "microphone",
        title: "Microphone Access",
        description: "Allow Bayon to record voice notes and memos",
        icon: Mic,
        benefits: [
            "Record voice notes hands-free while touring properties",
            "Automatic transcription of voice recordings",
            "Capture thoughts quickly without typing",
        ],
        fallback: "You can still type notes manually",
    },
    location: {
        type: "location",
        title: "Location Access",
        description: "Allow Bayon to access your location for context-aware features",
        icon: MapPin,
        benefits: [
            "Get reminders when you arrive at properties",
            "Automatically log property check-ins",
            "Add location context to captured content",
            "One-tap navigation to appointments",
        ],
        fallback: "You can manually enter addresses and locations",
    },
    notifications: {
        type: "notifications",
        title: "Notification Access",
        description: "Allow Bayon to send you important alerts and updates",
        icon: Bell,
        benefits: [
            "Instant alerts for new leads",
            "Reminders for upcoming appointments",
            "Notifications when offline actions sync",
            "Market alerts and opportunities",
        ],
        fallback: "You'll need to check the app manually for updates",
    },
};

export interface PermissionEducationDialogProps {
    /** Type of permission being requested */
    permissionType: PermissionType;
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog is closed */
    onOpenChange: (open: boolean) => void;
    /** Callback when user grants permission */
    onGrant: () => void;
    /** Callback when user denies permission */
    onDeny?: () => void;
    /** Whether permission was previously denied */
    wasDenied?: boolean;
}

export function PermissionEducationDialog({
    permissionType,
    open,
    onOpenChange,
    onGrant,
    onDeny,
    wasDenied = false,
}: PermissionEducationDialogProps) {
    const info = PERMISSION_INFO[permissionType];
    const Icon = info.icon;

    const handleGrant = () => {
        onGrant();
        onOpenChange(false);
    };

    const handleDeny = () => {
        onDeny?.();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <DialogTitle>{info.title}</DialogTitle>
                    </div>
                    <DialogDescription>{info.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {wasDenied && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Permission was previously denied. You may need to enable it in your
                                browser settings.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <p className="text-sm font-medium">This allows you to:</p>
                        <ul className="space-y-2">
                            {info.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span className="text-muted-foreground">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {info.fallback && (
                        <Alert>
                            <AlertDescription className="text-sm">
                                <strong>Don't want to grant access?</strong> {info.fallback}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleDeny} className="w-full sm:w-auto">
                        Not Now
                    </Button>
                    <Button onClick={handleGrant} className="w-full sm:w-auto">
                        Allow Access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Hook to manage permission education flow
 */
export function usePermissionEducation(permissionType: PermissionType) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [wasDenied, setWasDenied] = React.useState(false);

    const requestPermission = React.useCallback(() => {
        setIsOpen(true);
    }, []);

    const handleGrant = React.useCallback(async () => {
        try {
            // Request the actual permission based on type
            switch (permissionType) {
                case "camera":
                    await navigator.mediaDevices.getUserMedia({ video: true });
                    break;
                case "microphone":
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    break;
                case "location":
                    await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    break;
                case "notifications":
                    if ("Notification" in window) {
                        await Notification.requestPermission();
                    }
                    break;
            }
            setWasDenied(false);
        } catch (error) {
            console.error(`Permission denied for ${permissionType}:`, error);
            setWasDenied(true);
        }
    }, [permissionType]);

    return {
        isOpen,
        setIsOpen,
        wasDenied,
        requestPermission,
        handleGrant,
    };
}
