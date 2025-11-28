/**
 * Notification Center Usage Example
 * 
 * Demonstrates how to integrate the NotificationCenter component
 * into your application layout.
 */

"use client";

import React from "react";
import { NotificationCenter } from "./notification-center";

/**
 * Example: Adding NotificationCenter to App Header
 * 
 * This shows how to integrate the notification center into your
 * application's header or navigation bar.
 */
export function AppHeaderWithNotifications({ userId }: { userId: string }) {
    return (
        <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">My App</h1>
            </div>

            <div className="flex items-center gap-2">
                {/* Other header items */}

                {/* Notification Center */}
                <NotificationCenter
                    userId={userId}
                    maxVisible={50}
                    showUnreadOnly={false}
                    onNotificationClick={(notification) => {
                        console.log("Notification clicked:", notification);
                        // Handle navigation or custom logic here
                    }}
                />
            </div>
        </header>
    );
}

/**
 * Example: Standalone Notification Center
 * 
 * This shows how to use the notification center as a standalone component
 * in a settings page or dedicated notifications view.
 */
export function NotificationsPage({ userId }: { userId: string }) {
    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <NotificationCenter
                    userId={userId}
                    maxVisible={100}
                    showUnreadOnly={false}
                />
            </div>

            <div className="space-y-4">
                {/* Additional notification management UI */}
            </div>
        </div>
    );
}

/**
 * Example: Custom Notification Handler
 * 
 * This shows how to implement custom logic when notifications are clicked.
 */
export function CustomNotificationHandler({ userId }: { userId: string }) {
    const handleNotificationClick = (notification: any) => {
        // Custom routing logic based on notification type
        switch (notification.type) {
            case "task_completion":
                // Navigate to tasks page
                window.location.href = "/tasks";
                break;
            case "achievement":
                // Show achievement modal
                console.log("Show achievement:", notification);
                break;
            case "alert":
                // Navigate to alerts page
                window.location.href = "/alerts";
                break;
            default:
                // Default behavior - use actionUrl if provided
                if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                }
        }
    };

    return (
        <NotificationCenter
            userId={userId}
            onNotificationClick={handleNotificationClick}
        />
    );
}
