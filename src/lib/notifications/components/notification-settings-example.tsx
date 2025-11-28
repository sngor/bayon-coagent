/**
 * Notification Settings Example
 * 
 * Example usage of the NotificationSettings component.
 * This file demonstrates how to integrate the settings component into your application.
 */

"use client";

import React from "react";
import { NotificationSettings } from "./notification-settings";
import { NotificationPreferences } from "../types";

/**
 * Example: Basic Usage
 * 
 * Simple integration of notification settings for a user.
 */
export function BasicNotificationSettingsExample() {
    const userId = "user-123"; // Replace with actual user ID

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage how and when you receive notifications
                    </p>
                </div>

                <NotificationSettings userId={userId} />
            </div>
        </div>
    );
}

/**
 * Example: With Update Callback
 * 
 * Integration with a callback to handle preference updates.
 */
export function NotificationSettingsWithCallbackExample() {
    const userId = "user-123"; // Replace with actual user ID

    const handlePreferencesUpdate = (preferences: NotificationPreferences) => {
        console.log("Preferences updated:", preferences);

        // You can perform additional actions here, such as:
        // - Showing a success message
        // - Updating other parts of your UI
        // - Syncing with other systems
        // - Analytics tracking
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Customize your notification preferences
                    </p>
                </div>

                <NotificationSettings
                    userId={userId}
                    onUpdate={handlePreferencesUpdate}
                />
            </div>
        </div>
    );
}

/**
 * Example: In Settings Page
 * 
 * Integration within a larger settings page with tabs or sections.
 */
export function SettingsPageExample() {
    const userId = "user-123"; // Replace with actual user ID

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Other settings sections could go here */}

                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Notifications</h2>
                        <p className="text-muted-foreground mt-1">
                            Control how you receive notifications
                        </p>
                    </div>

                    <NotificationSettings userId={userId} />
                </div>

                {/* More settings sections... */}
            </div>
        </div>
    );
}

/**
 * Example: With Custom Styling
 * 
 * Integration with custom className for styling.
 */
export function StyledNotificationSettingsExample() {
    const userId = "user-123"; // Replace with actual user ID

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <NotificationSettings
                userId={userId}
                className="bg-accent/5 rounded-lg p-6"
            />
        </div>
    );
}
