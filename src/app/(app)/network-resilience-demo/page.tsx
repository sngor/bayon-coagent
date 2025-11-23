'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackgroundSyncStatus } from '@/components/mobile';
import { connectivityMonitor } from '@/lib/connectivity-monitor';
import { offlineSyncManager } from '@/lib/offline-sync-manager';
import { Wifi, WifiOff, Activity, Database, RotateCw } from 'lucide-react';

export default function NetworkResilienceDemoPage() {
    const [connectivityStatus, setConnectivityStatus] = useState(connectivityMonitor.getStatus());
    const [queueStatus, setQueueStatus] = useState({ pending: 0, failed: 0, completed: 0, conflicts: 0 });
    const [operations, setOperations] = useState<any[]>([]);

    useEffect(() => {
        // Subscribe to connectivity changes
        const unsubscribeConnectivity = connectivityMonitor.onConnectivityChange((event) => {
            setConnectivityStatus(event.status);
        });

        // Subscribe to sync progress
        const unsubscribeSync = offlineSyncManager.onSyncProgress((operation, progress) => {
            console.log('Sync progress:', operation.id, progress);
        });

        // Update queue status periodically
        const updateQueueStatus = async () => {
            const status = await offlineSyncManager.getQueueStatus();
            setQueueStatus(status);
        };

        updateQueueStatus();
        const interval = setInterval(updateQueueStatus, 2000);

        return () => {
            unsubscribeConnectivity();
            unsubscribeSync();
            clearInterval(interval);
        };
    }, []);

    const simulateOperation = async (type: 'photo' | 'voice' | 'content' | 'checkin' | 'edit' | 'meeting-prep' | 'market-stats' | 'comparison') => {
        const operation = {
            type,
            data: {
                id: `${type}-${Date.now()}`,
                content: `Test ${type} operation created at ${new Date().toISOString()}`,
                userId: 'demo-user',
                timestamp: Date.now()
            },
            timestamp: Date.now()
        };

        const operationId = await offlineSyncManager.queueOperation(operation);

        setOperations(prev => [...prev, {
            id: operationId,
            type,
            status: 'queued',
            timestamp: Date.now()
        }]);
    };

    const forceSync = async () => {
        try {
            await offlineSyncManager.forceSyncPendingOperations();
        } catch (error) {
            console.error('Force sync failed:', error);
        }
    };

    const getConnectionQualityColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return 'bg-green-500';
            case 'good': return 'bg-blue-500';
            case 'poor': return 'bg-yellow-500';
            case 'offline': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Network Resilience Demo</h1>
                    <p className="text-gray-600 mt-2">
                        Test offline functionality, connectivity monitoring, and background sync
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Connectivity Status */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            {connectivityStatus.isOnline ? (
                                <Wifi className="h-4 w-4 text-green-500" />
                            ) : (
                                <WifiOff className="h-4 w-4 text-red-500" />
                            )}
                            Connectivity Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Status</span>
                            <Badge variant={connectivityStatus.isOnline ? 'default' : 'destructive'}>
                                {connectivityStatus.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Quality</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getConnectionQualityColor(connectivityStatus.connectionQuality)}`} />
                                <span className="text-sm capitalize">{connectivityStatus.connectionQuality}</span>
                            </div>
                        </div>

                        {connectivityStatus.effectiveType && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Type</span>
                                <span className="text-sm font-medium">{connectivityStatus.effectiveType.toUpperCase()}</span>
                            </div>
                        )}

                        {connectivityStatus.downlink && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Speed</span>
                                <span className="text-sm font-medium">{connectivityStatus.downlink} Mbps</span>
                            </div>
                        )}

                        {connectivityStatus.rtt && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Latency</span>
                                <span className="text-sm font-medium">{connectivityStatus.rtt}ms</span>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 pt-2">
                            Last online: {connectivityStatus.lastOnlineAt ? new Date(connectivityStatus.lastOnlineAt).toLocaleTimeString() : 'Never'}
                        </div>
                    </CardContent>
                </Card>

                {/* Sync Queue Status */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Database className="h-4 w-4 text-blue-500" />
                            Sync Queue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{queueStatus.pending}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{queueStatus.failed}</div>
                                <div className="text-xs text-gray-500">Failed</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{queueStatus.completed}</div>
                                <div className="text-xs text-gray-500">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{queueStatus.conflicts}</div>
                                <div className="text-xs text-gray-500">Conflicts</div>
                            </div>
                        </div>

                        <Button
                            onClick={forceSync}
                            disabled={!connectivityStatus.isOnline}
                            className="w-full"
                            size="sm"
                        >
                            <RotateCw className="h-3 w-3 mr-1" />
                            Force Sync
                        </Button>
                    </CardContent>
                </Card>

                {/* Background Sync Status */}
                <BackgroundSyncStatus />
            </div>

            {/* Operation Simulation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Simulate Operations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button
                            onClick={() => simulateOperation('photo')}
                            variant="outline"
                            size="sm"
                        >
                            Photo Upload
                        </Button>
                        <Button
                            onClick={() => simulateOperation('voice')}
                            variant="outline"
                            size="sm"
                        >
                            Voice Memo
                        </Button>
                        <Button
                            onClick={() => simulateOperation('content')}
                            variant="outline"
                            size="sm"
                        >
                            Content Edit
                        </Button>
                        <Button
                            onClick={() => simulateOperation('checkin')}
                            variant="outline"
                            size="sm"
                        >
                            Check-in
                        </Button>
                    </div>

                    {operations.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-headline font-medium text-sm">Recent Operations</h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {operations.slice(-10).reverse().map((op, index) => (
                                    <div
                                        key={`${op.id}-${index}`}
                                        className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                                    >
                                        <span className="font-medium">{op.type}</span>
                                        <span className="text-gray-500">{op.id}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {op.status}
                                        </Badge>
                                        <span className="text-gray-400">
                                            {new Date(op.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>1. Test Offline Mode:</strong> Turn off your internet connection and try creating operations. They should be queued locally.</p>
                    <p><strong>2. Test Reconnection:</strong> Turn your internet back on. Operations should sync automatically.</p>
                    <p><strong>3. Test Background Sync:</strong> If supported, operations will sync in the background even when the tab is not active.</p>
                    <p><strong>4. Test Connection Quality:</strong> The system adapts sync behavior based on connection quality.</p>
                    <p><strong>5. Monitor Events:</strong> Watch the Background Sync Status card for real-time sync events.</p>
                </CardContent>
            </Card>
        </div>
    );
}