'use client';

/**
 * Sync Status Demo Component
 * 
 * This component demonstrates the sync status functionality and provides
 * controls for testing offline sync behavior.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SyncStatus, FloatingSyncStatus } from './sync-status';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { SyncOperation } from '@/lib/offline-sync-manager';

export function SyncStatusDemo() {
    const {
        connectivityStatus,
        isOnline,
        queueStatus,
        totalPending,
        syncProgress,
        isSyncing,
        queueOperation,
        forceSyncPendingOperations,
        refreshStatus,
    } = useOfflineSync();

    const [operationType, setOperationType] = useState<SyncOperation['type']>('content');
    const [operationData, setOperationData] = useState('{"title": "Test Content", "body": "This is test content"}');
    const [showFloating, setShowFloating] = useState(false);

    // Queue a test operation
    const handleQueueOperation = async () => {
        try {
            let data;
            try {
                data = JSON.parse(operationData);
            } catch {
                data = { content: operationData };
            }

            await queueOperation({
                type: operationType,
                data,
                timestamp: Date.now(),
            });

            console.log('Operation queued successfully');
        } catch (error) {
            console.error('Failed to queue operation:', error);
        }
    };

    // Force sync all pending operations
    const handleForceSync = async () => {
        try {
            await forceSyncPendingOperations();
            console.log('Force sync completed');
        } catch (error) {
            console.error('Force sync failed:', error);
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="font-headline text-2xl font-bold mb-2">Sync Status Demo</h1>
                <p className="text-muted-foreground">
                    Test the offline sync functionality and monitor sync status
                </p>
            </div>

            {/* Sync Status Components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Full Sync Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Full Sync Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SyncStatus showDetails={true} />
                    </CardContent>
                </Card>

                {/* Compact Sync Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Compact Sync Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-4 border rounded">
                            <SyncStatus compact={true} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Test Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Queue Operation */}
                    <div className="space-y-2">
                        <Label>Queue Test Operation</Label>
                        <div className="flex gap-2">
                            <Select value={operationType} onValueChange={(value: SyncOperation['type']) => setOperationType(value)}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="photo">Photo</SelectItem>
                                    <SelectItem value="voice">Voice</SelectItem>
                                    <SelectItem value="content">Content</SelectItem>
                                    <SelectItem value="checkin">Check-in</SelectItem>
                                    <SelectItem value="edit">Edit</SelectItem>
                                    <SelectItem value="meeting-prep">Meeting Prep</SelectItem>
                                    <SelectItem value="market-stats">Market Stats</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Operation data (JSON)"
                                value={operationData}
                                onChange={(e) => setOperationData(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleQueueOperation}>
                                Queue Operation
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleForceSync}
                            disabled={!isOnline || totalPending === 0}
                            variant="outline"
                        >
                            Force Sync ({totalPending})
                        </Button>
                        <Button onClick={refreshStatus} variant="outline">
                            Refresh Status
                        </Button>
                        <Button
                            onClick={() => setShowFloating(!showFloating)}
                            variant="outline"
                        >
                            {showFloating ? 'Hide' : 'Show'} Floating Status
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Connectivity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 text-sm">
                            <div>Status: <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span></div>
                            <div>Last Online: {new Date(connectivityStatus.lastOnlineAt).toLocaleTimeString()}</div>
                            {connectivityStatus.lastOfflineAt > 0 && (
                                <div>Last Offline: {new Date(connectivityStatus.lastOfflineAt).toLocaleTimeString()}</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Queue Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 text-sm">
                            <div>Pending: {queueStatus.pending}</div>
                            <div>Failed: {queueStatus.failed}</div>
                            <div>Completed: {queueStatus.completed}</div>
                            <div>Total Pending: {totalPending}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Sync Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 text-sm">
                            <div>Active Operations: {syncProgress.length}</div>
                            <div>Is Syncing: {isSyncing ? 'Yes' : 'No'}</div>
                            {syncProgress.map(({ operation, progress }) => (
                                <div key={operation.id} className="text-xs">
                                    {operation.type}: {Math.round(progress * 100)}%
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <p>1. <strong>Queue Operations:</strong> Use the controls above to queue test operations</p>
                    <p>2. <strong>Test Offline Mode:</strong> Open DevTools → Network → Check "Offline" to simulate offline mode</p>
                    <p>3. <strong>Monitor Sync:</strong> Watch the sync status components update as operations are queued and synced</p>
                    <p>4. <strong>Force Sync:</strong> Use the "Force Sync" button to manually trigger synchronization</p>
                    <p>5. <strong>Floating Status:</strong> Toggle the floating status indicator to see minimal UI impact</p>
                </CardContent>
            </Card>

            {/* Floating Status */}
            {showFloating && <FloatingSyncStatus />}
        </div>
    );
}