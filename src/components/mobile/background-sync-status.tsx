'use client';

import { useBackgroundSync } from '@/hooks/use-background-sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RotateCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function BackgroundSyncStatus() {
    const {
        status,
        syncEvents,
        registerBackgroundSync,
        triggerBackgroundSync,
        updateServiceWorker
    } = useBackgroundSync();

    const getStatusIcon = () => {
        if (!status.isSupported) {
            return <WifiOff className="h-4 w-4 text-gray-400" />;
        }

        if (!status.isAvailable) {
            return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        }

        if (status.isRegistered) {
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        }

        return <Clock className="h-4 w-4 text-blue-500" />;
    };

    const getStatusText = () => {
        if (!status.isSupported) {
            return 'Not Supported';
        }

        if (!status.isAvailable) {
            return 'Initializing';
        }

        if (status.isRegistered) {
            return 'Active';
        }

        return 'Ready';
    };

    const getStatusColor = () => {
        if (!status.isSupported) return 'secondary';
        if (!status.isAvailable) return 'outline';
        if (status.isRegistered) return 'default';
        return 'secondary';
    };

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'sync-started':
                return <RotateCw className="h-3 w-3 text-blue-500 animate-spin" />;
            case 'sync-completed':
                return <CheckCircle className="h-3 w-3 text-green-500" />;
            case 'sync-failed':
                return <AlertCircle className="h-3 w-3 text-red-500" />;
            case 'sync-progress':
                return <Clock className="h-3 w-3 text-yellow-500" />;
            default:
                return <Wifi className="h-3 w-3 text-gray-400" />;
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                        {getStatusIcon()}
                        Background Sync
                    </span>
                    <Badge variant={getStatusColor() as any}>
                        {getStatusText()}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <div className="text-gray-500">Supported</div>
                        <div className="font-medium">
                            {status.isSupported ? 'Yes' : 'No'}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-500">Available</div>
                        <div className="font-medium">
                            {status.isAvailable ? 'Yes' : 'No'}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {!status.isRegistered && status.isSupported && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={registerBackgroundSync}
                            className="flex-1"
                        >
                            Register
                        </Button>
                    )}

                    {status.isAvailable && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={triggerBackgroundSync}
                            className="flex-1"
                        >
                            <RotateCw className="h-3 w-3 mr-1" />
                            Sync Now
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={updateServiceWorker}
                        className="px-2"
                    >
                        Update
                    </Button>
                </div>

                {/* Recent Events */}
                {syncEvents.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500">Recent Events</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {syncEvents.slice(-5).reverse().map((event, index) => (
                                <div
                                    key={`${event.timestamp}-${index}`}
                                    className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded"
                                >
                                    {getEventIcon(event.type)}
                                    <span className="flex-1 capitalize">
                                        {event.type.replace('-', ' ')}
                                    </span>
                                    {event.operationsProcessed !== undefined && (
                                        <span className="text-gray-500">
                                            {event.operationsProcessed} ops
                                        </span>
                                    )}
                                    {event.progress !== undefined && (
                                        <span className="text-gray-500">
                                            {Math.round(event.progress * 100)}%
                                        </span>
                                    )}
                                    <span className="text-gray-400">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Last Sync Event */}
                {status.lastSyncEvent && (
                    <div className="text-xs text-gray-500">
                        Last event: {status.lastSyncEvent.type} at{' '}
                        {new Date(status.lastSyncEvent.timestamp).toLocaleTimeString()}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}