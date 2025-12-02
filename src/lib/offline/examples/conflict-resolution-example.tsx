/**
 * Conflict Resolution Integration Example
 * 
 * This example demonstrates how to integrate conflict resolution
 * and sync status display into an open house session page.
 */

'use client';

import { SyncStatusDisplay } from '@/components/open-house/sync-status-display';
import { SyncStatusIndicator } from '@/components/open-house/sync-status-indicator';
import { ConflictLogViewer } from '@/components/open-house/conflict-log-viewer';
import { useOfflineSync } from '@/lib/offline/use-offline-sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Example 1: Session Page with Sync Status
 * 
 * Shows sync status in the main session view
 */
export function SessionPageWithSyncStatus() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Page Header with Compact Indicator */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Open House Session</h1>
                <SyncStatusIndicator />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Session Details */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Session content here */}
                            <p className="text-muted-foreground">
                                Session details and visitor list...
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sync Status Sidebar */}
                <div className="space-y-6">
                    <SyncStatusDisplay />
                </div>
            </div>
        </div>
    );
}

/**
 * Example 2: Settings Page with Conflict Log
 * 
 * Shows conflict log in a settings or admin view
 */
export function SyncSettingsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Sync Settings</h1>

            <Tabs defaultValue="status">
                <TabsList>
                    <TabsTrigger value="status">Sync Status</TabsTrigger>
                    <TabsTrigger value="conflicts">Conflict Log</TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="space-y-6">
                    <SyncStatusDisplay />
                </TabsContent>

                <TabsContent value="conflicts" className="space-y-6">
                    <ConflictLogViewer />
                </TabsContent>
            </Tabs>
        </div>
    );
}

/**
 * Example 3: Custom Component Using Sync Hook
 * 
 * Shows how to build custom UI with the sync hook
 */
export function CustomSyncMonitor() {
    const {
        isOnline,
        isSyncing,
        pendingCount,
        failedCount,
        conflictCount,
        lastSyncTimestamp,
        sync,
        getConflicts,
    } = useOfflineSync();

    const handleViewConflicts = async () => {
        const conflicts = await getConflicts();
        console.log('Conflicts:', conflicts);
        // Handle conflicts display
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Custom Sync Monitor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">
                            {isOnline ? '🟢 Online' : '🔴 Offline'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-lg font-semibold">{pendingCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <p className="text-lg font-semibold">{failedCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Conflicts</p>
                        <p className="text-lg font-semibold">{conflictCount}</p>
                    </div>
                </div>

                {/* Last Sync */}
                {lastSyncTimestamp && (
                    <div>
                        <p className="text-sm text-muted-foreground">Last Sync</p>
                        <p className="text-sm">
                            {new Date(lastSyncTimestamp).toLocaleString()}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => sync()}
                        disabled={!isOnline || isSyncing}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                    >
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    {conflictCount > 0 && (
                        <button
                            onClick={handleViewConflicts}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-md"
                        >
                            View Conflicts
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Example 4: Mobile-Optimized Sync Status
 * 
 * Compact view for mobile devices
 */
export function MobileSyncStatus() {
    const { isOnline, pendingCount, isSyncing } = useOfflineSync();

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2">
                {isOnline ? (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                ) : (
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                )}
                <span className="text-sm">
                    {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
                </span>
            </div>
        </div>
    );
}

/**
 * Example 5: Conflict Alert Banner
 * 
 * Shows a banner when conflicts are detected
 */
export function ConflictAlertBanner() {
    const { conflictCount, getConflicts } = useOfflineSync();

    if (conflictCount === 0) {
        return null;
    }

    return (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-yellow-500">⚠️</div>
                    <div>
                        <p className="font-semibold text-sm">
                            {conflictCount} Conflict{conflictCount !== 1 ? 's' : ''} Resolved
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Some offline changes conflicted with server data.
                            Your changes were applied using last-write-wins strategy.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => getConflicts()}
                    className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                >
                    View Details
                </button>
            </div>
        </div>
    );
}

/**
 * Example 6: Complete Integration
 * 
 * Full page with all sync features
 */
export function CompleteOpenHouseSessionPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Conflict Alert */}
            <ConflictAlertBanner />

            {/* Main Content */}
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Open House Session</h1>
                    <SyncStatusIndicator />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visitors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Visitor list here */}
                                <p className="text-muted-foreground">
                                    Visitor check-in list...
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <SyncStatusDisplay />
                    </div>
                </div>

                {/* Conflict Log Section */}
                <ConflictLogViewer />
            </div>

            {/* Mobile Sync Status */}
            <div className="lg:hidden">
                <MobileSyncStatus />
            </div>
        </div>
    );
}
