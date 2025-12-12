'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StandardCard } from '@/components/standard/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface VoiceDiagnosticsProps {
    isConnected: boolean;
    error: string | null;
    onRunDiagnostics: () => void;
}

export function VoiceDiagnostics({ isConnected, error, onRunDiagnostics }: VoiceDiagnosticsProps) {
    const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
    const [webSocketSupport, setWebSocketSupport] = useState<boolean>(true);
    const [mediaDevicesSupport, setMediaDevicesSupport] = useState<boolean>(true);

    useEffect(() => {
        // Check network status
        const updateNetworkStatus = () => {
            setNetworkStatus(navigator.onLine ? 'online' : 'offline');
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();

        // Check WebSocket support
        setWebSocketSupport(typeof WebSocket !== 'undefined');

        // Check MediaDevices support
        setMediaDevicesSupport(
            typeof navigator !== 'undefined' &&
            'mediaDevices' in navigator &&
            'getUserMedia' in navigator.mediaDevices
        );

        return () => {
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);
        };
    }, []);

    const diagnosticItems = [
        {
            label: 'Network Connection',
            status: networkStatus === 'online' ? 'good' : 'error',
            message: networkStatus === 'online' ? 'Connected' : 'No internet connection',
            icon: networkStatus === 'online' ? CheckCircle : WifiOff,
        },
        {
            label: 'WebSocket Support',
            status: webSocketSupport ? 'good' : 'error',
            message: webSocketSupport ? 'Supported' : 'Not supported in this browser',
            icon: webSocketSupport ? CheckCircle : AlertCircle,
        },
        {
            label: 'Microphone Access',
            status: mediaDevicesSupport ? 'good' : 'error',
            message: mediaDevicesSupport ? 'Available' : 'Not available',
            icon: mediaDevicesSupport ? CheckCircle : AlertCircle,
        },
        {
            label: 'Voice Service',
            status: isConnected ? 'good' : error ? 'error' : 'warning',
            message: isConnected ? 'Connected' : error ? 'Connection failed' : 'Disconnected',
            icon: isConnected ? CheckCircle : error ? AlertCircle : WifiOff,
        },
    ];

    return (
        <StandardCard
            title={
                <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary" />
                    <span className="font-headline">Connection Diagnostics</span>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    {diagnosticItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <IconComponent
                                        className={`h-4 w-4 ${item.status === 'good'
                                                ? 'text-emerald-500'
                                                : item.status === 'error'
                                                    ? 'text-red-500'
                                                    : 'text-yellow-500'
                                            }`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.message}</p>
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        item.status === 'good'
                                            ? 'default'
                                            : item.status === 'error'
                                                ? 'destructive'
                                                : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {item.status === 'good' ? 'OK' : item.status === 'error' ? 'Error' : 'Warning'}
                                </Badge>
                            </div>
                        );
                    })}
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">Connection Error</p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    onClick={onRunDiagnostics}
                    variant="outline"
                    size="sm"
                    className="w-full"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Diagnostics
                </Button>
            </div>
        </StandardCard>
    );
}