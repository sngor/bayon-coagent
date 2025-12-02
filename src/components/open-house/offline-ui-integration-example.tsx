/**
 * Offline UI Integration Examples
 * 
 * This file demonstrates how to integrate offline status indicators
 * and sync progress components throughout the open house UI.
 * 
 * These examples show best practices for:
 * - Page-level offline indicators
 * - Form-level offline messaging
 * - List-level sync status
 * - Navigation-level connectivity indicators
 */

'use client';

import { OfflineStatusIndicator, OfflineBadge, OfflineMessage } from './offline-status-indicator';
import { SyncStatusIndicator } from './sync-status-indicator';
import { SyncStatusDisplay } from './sync-status-display';
import { SyncProgressIndicator, SyncProgressBar } from './sync-progress-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Example 1: Page Layout with Fixed Offline Indicator
 * 
 * Use this pattern for main pages where users need constant awareness
 * of their connectivity status.
 */
export function PageWithOfflineIndicator() {
    return (
        <div className="min-h-screen">
            {/* Fixed offline indicator at the top */}
            <OfflineStatusIndicator position="fixed-top" />

            {/* Page content with top padding to account for fixed indicator */}
            <div className="pt-16 p-6">
                <h1 className="text-2xl font-bold mb-4">Open House Sessions</h1>
                {/* Page content */}
            </div>
        </div>
    );
}

/**
 * Example 2: Navigation Bar with Sync Status
 * 
 * Use this pattern in navigation bars or headers to provide
 * quick access to sync status without taking up much space.
 */
export function NavigationWithSyncStatus() {
    return (
        <nav className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">Open House</h1>
                <OfflineBadge />
            </div>

            <div className="flex items-center gap-2">
                {/* Other navigation items */}
                <SyncStatusIndicator />
            </div>
        </nav>
    );
}

/**
 * Example 3: Form with Offline Messaging
 * 
 * Use this pattern in forms to inform users that their data
 * will be saved locally and synced later.
 */
export function CheckInFormWithOfflineMessage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Check In Visitor</CardTitle>
                <CardDescription>
                    Add a new visitor to this open house session
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Inline offline message */}
                <OfflineMessage />

                {/* Form fields */}
                <div className="space-y-4">
                    {/* Form inputs would go here */}
                </div>

                <Button type="submit" className="w-full">
                    Check In Visitor
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Example 4: Dashboard with Sync Status Display
 * 
 * Use this pattern in dashboards or settings pages where users
 * might want detailed sync information.
 */
export function DashboardWithSyncStatus() {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Other dashboard cards */}
            <Card>
                <CardHeader>
                    <CardTitle>Session Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Statistics content */}
                </CardContent>
            </Card>

            {/* Sync status card */}
            <SyncStatusDisplay />
        </div>
    );
}

/**
 * Example 5: List with Sync Progress
 * 
 * Use this pattern when displaying lists that might have
 * pending sync operations.
 */
export function VisitorListWithSyncProgress() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Visitors</h2>
                <OfflineBadge />
            </div>

            {/* Sync progress bar */}
            <SyncProgressBar />

            {/* List content */}
            <div className="space-y-2">
                {/* Visitor items would go here */}
            </div>
        </div>
    );
}

/**
 * Example 6: Modal/Dialog with Offline Warning
 * 
 * Use this pattern in modals or dialogs where users perform
 * actions that require sync.
 */
export function ModalWithOfflineWarning() {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">Generate Follow-ups</h2>

            {/* Inline offline indicator */}
            <OfflineStatusIndicator position="inline" />

            <p className="text-sm text-muted-foreground">
                Generate personalized follow-up content for all visitors.
            </p>

            <div className="flex gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Generate</Button>
            </div>
        </div>
    );
}

/**
 * Example 7: Settings Page with Detailed Sync Info
 * 
 * Use this pattern in settings or admin pages where users
 * might need comprehensive sync information.
 */
export function SettingsWithDetailedSync() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your open house preferences and sync status
                </p>
            </div>

            {/* Detailed sync progress */}
            <SyncProgressIndicator showDetails />

            {/* Other settings sections */}
            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Settings content */}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Example 8: Session Detail Page with Multiple Indicators
 * 
 * Use this pattern for detail pages where multiple types of
 * offline indicators might be needed.
 */
export function SessionDetailWithMultipleIndicators() {
    return (
        <div className="space-y-6">
            {/* Page-level offline indicator */}
            <OfflineStatusIndicator position="inline" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Open House Session</h1>
                    <p className="text-muted-foreground">123 Main Street</p>
                </div>
                <div className="flex items-center gap-2">
                    <OfflineBadge />
                    <SyncStatusIndicator />
                </div>
            </div>

            {/* Session content with sync progress */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Main content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Visitors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SyncProgressBar />
                            {/* Visitor list */}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Sidebar with sync status */}
                    <SyncStatusDisplay />
                </div>
            </div>
        </div>
    );
}

/**
 * Best Practices for Offline UI Integration:
 * 
 * 1. **Fixed Indicators**: Use fixed-position OfflineStatusIndicator for critical
 *    pages where users must be aware of offline status (check-in, forms).
 * 
 * 2. **Navigation Badges**: Use OfflineBadge in navigation bars for subtle,
 *    always-visible status without being intrusive.
 * 
 * 3. **Inline Messages**: Use OfflineMessage in forms and action areas to
 *    inform users their data will be queued.
 * 
 * 4. **Sync Status Cards**: Use SyncStatusDisplay in dashboards and settings
 *    for detailed sync information.
 * 
 * 5. **Progress Indicators**: Use SyncProgressIndicator during active sync
 *    operations to show progress and build confidence.
 * 
 * 6. **Compact Indicators**: Use SyncStatusIndicator in headers and navigation
 *    for quick access to sync status via popover.
 * 
 * 7. **Contextual Placement**: Place indicators where users are most likely
 *    to perform actions that require sync (forms, lists, action buttons).
 * 
 * 8. **Progressive Disclosure**: Start with subtle indicators (badges) and
 *    provide detailed information on demand (popovers, cards).
 */
