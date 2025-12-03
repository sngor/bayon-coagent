"use client";

/**
 * Mobile Feature Tooltips
 * 
 * Contextual tooltips for mobile-specific features.
 * Shows helpful hints for first-time users of mobile features.
 */

import * as React from "react";
import { FeatureTooltip } from "@/components/ui/feature-tooltip";

/**
 * Tooltip for Quick Capture button
 */
export function QuickCaptureTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-quick-capture"
            content="Tap here to quickly capture property details using your camera or voice. AI will analyze photos and transcribe voice notes automatically."
            side="bottom"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Quick Actions menu
 */
export function QuickActionsTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-quick-actions"
            content="Access your most-used features with one tap. The menu learns from your usage and prioritizes frequently used actions."
            side="bottom"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Voice Notes feature
 */
export function VoiceNotesTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-voice-notes"
            content="Record voice notes at properties. They'll be automatically transcribed and attached to property records."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Quick Share feature
 */
export function QuickShareTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-quick-share"
            content="Share property details via QR code, SMS, or social media. Track engagement to know when prospects view your listings."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Location Services
 */
export function LocationServicesTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-location-services"
            content="Enable location services to get reminders when you arrive at properties and automatically log check-ins."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Offline Mode indicator
 */
export function OfflineModeTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-offline-mode"
            content="You're offline. All actions are being queued and will sync automatically when you're back online."
            side="bottom"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Camera Capture
 */
export function CameraCaptureTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-camera-capture"
            content="Take photos of the property. AI will analyze the image to extract property details and generate marketing highlights."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Voice Capture
 */
export function VoiceCaptureTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-voice-capture"
            content="Record voice notes about the property. Real estate terminology will be recognized and automatically transcribed."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for QR Code generation
 */
export function QRCodeTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-qr-code"
            content="Generate a QR code for this property. Visitors can scan it to view property details on their phones."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Lead Notifications
 */
export function LeadNotificationsTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-lead-notifications"
            content="Get instant notifications for new leads. Tap to view details and send quick responses."
            side="bottom"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Navigation Integration
 */
export function NavigationTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-navigation"
            content="Tap to open navigation in your device's maps app. Get turn-by-turn directions to the property."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Check-In feature
 */
export function CheckInTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-check-in"
            content="Check in to log your visit. Location and timestamp will be automatically recorded."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Sync Status
 */
export function SyncStatusTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-sync-status"
            content="View your offline queue and sync status. Tap to see pending actions and manually retry if needed."
            side="bottom"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Progressive Image Loading
 */
export function ProgressiveImageTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-progressive-image"
            content="Images load progressively to save data and battery. Full quality loads when you view them."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}

/**
 * Tooltip for Content Creation on Mobile
 */
export function MobileContentCreationTooltip({ children }: { children: React.ReactNode }) {
    return (
        <FeatureTooltip
            id="mobile-content-creation"
            content="Create social media content optimized for mobile. Templates auto-populate with property data and your branding."
            side="top"
        >
            {children}
        </FeatureTooltip>
    );
}
